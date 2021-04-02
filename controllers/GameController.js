const { Server, Socket } = require('socket.io')
const Game = require('../models/Game.js')
const GameManager = require('../models/GameManager.js')
const Player = require('../models/Player.js')
const PlayerManager = require('../models/PlayerManager.js')


/** Class that acts as the controller for games, roughly following the MVC paradigm */
class GameController {
    /**
     * 
     * @param {Server} io - The socket io Object to emit events
     * @param {object} asyncMysql - An object containg a promisified query function and an escape function
     * @param {GameManager} gameManager - The GameManager providing access to all games
     * @param {PlayerManager} playerManager - The PlayerManager providing access to all players
     */
    constructor(io, asyncMysql, gameManager, playerManager) {
        this.io = io
        this.asyncMysql = asyncMysql
        this.gameManager = gameManager
        this.playerManager = playerManager

        this.cleanInterval = 1000

        setInterval(this.cleanGames.bind(this), this.cleanInterval)
    }

    cleanGames() {
        let games = this.playerManager.cleanDisconnectedPlayers(this.cleanInterval)

        games.forEach(g => {
            g.players.forEach(p => {
                if (p.socket)
                    p.socket.emit('playerlist', g.getCustomPlayerList(p))
            })
        })
    }

    /**
     * Handles the auth part of the Game
     * 
     * @param {Socket} socket - The socket to the client
     * @param {object} data - The data sent with the auth event
     */
    async handleAuth(socket, data) {
        if (!data) {
            throw new Error('Missing data for auth')
        }

        if (data.token) {
            socket.player = this.playerManager.getFromToken(data.token)
            if (!socket.player) {
                throw new Error('Invalid token')
            }

        } else if (data.username) {
            socket.player = await Player.createNew(data.username, this.asyncMysql)
            this.playerManager.addPlayer(socket.player)
        } else {
            throw new Error('Invalid field combination for auth')
        }

        socket.player.isConnected = true
        this.playerManager.removeDisconnectedPlayer(socket.player)
        socket.player.socket = socket
        socket.emit('playerinfo', socket.player.getPublicPlayerInfo())
        if (socket.player.game) {
            this.rejoinPlayer(socket)
        }
    }


    /**
     * Sends all necessary data to a client who has reconnected
     * 
     * @param {Socket} socket - The socket to the client
     */

    rejoinPlayer(socket) {
        socket.join(socket.player.game.inviteCode)

        socket.emit('gameinfo', socket.player.game.getPublicGameInfo())

        socket.player.game.players.forEach(p => {
            if (p.socket)
                p.socket.emit('playerlist', socket.player.game.getCustomPlayerList(p))
        })

        switch (socket.player.game.state) {
            case 'lobby':
                socket.emit('lobbyjoin')
                break

            case 'refute':
                const diceList = socket.player.game.getCustomDiceList(socket.player)

                socket.emit('refute', {
                    dices: diceList,
                    comparisonData: socket.player.game.comparisonData,
                    winnerIndex: socket.player.game.winnerIndex
                })
                break

            case 'ingame':
                socket.emit('nextturn', socket.player.game.getCustomGameStateFor(socket.player))
                break
        }
    }


    /**
     * Handles the joining of a player to an existing game
     * 
     * @param {Socket} socket - The socket to the client
     * @param {object} data - The data sent with the join event
     */

    handleJoin(socket, data) {
        if (!socket.player) {
            throw new Error('Not authenticated as Player')
        }
        if (!data || !data.inviteCode) {
            throw new Error('Ill formatted')
        }
        
        let game = this.gameManager.getFromInviteCode(data.inviteCode)
        if (!game) {
            throw new Error('Game not found')
        }
        if (game.isRunning()) {
            throw new Error('Game already running')
        }

        socket.player.joinGame(game)

        socket.join(game.inviteCode)
        this.io.to(game.inviteCode).emit('playerlist', game.getPublicPlayerList())
        
        socket.emit('gameinfo', game.getPublicGameInfo())
        socket.emit('lobbyjoin')
        socket.emit('playerinfo', socket.player.getPublicPlayerInfo())
    }


    /**
     * Handles the leaving of a player
     * 
     * @param {Socket} socket - The socket to the client
     * @param {object} data - The data sent with the leave event (Should be none)
     */

    handleLeave(socket, data) {
        if (!socket.player) {
            throw new Error('Not authenticated as Player')
        }
        if (!socket.player.game) {
            throw new Error('Player not in game')
        }

        const game = socket.player.game
        socket.player.leaveGame()

        socket.emit('set-username')
        socket.emit('gameinfo', {})
        game.players.forEach(p => {
            if (p.socket)
                p.socket.emit('playerlist', game.getCustomPlayerList(p))
        })
    }


    /**
     * Handles the creation of a new game and sets the requesting player as admin.
     * 
     * @param {Socket} socket - The socket to the client
     * @param {object} data - The data sent with the create event
     */

    handleCreate(socket, data) {
        if (!socket.player) {
            throw new Error('Not authenticated as player')
        }

        const game = Game.create()
        this.gameManager.addGame(game)

        game.admin = socket.player
        socket.player.joinGame(game)

        socket.join(game.inviteCode)
        socket.player.game.players.forEach(p => {
            if (p.socket)
                p.socket.emit('playerlist', socket.player.game.getCustomPlayerList(p))
        })
        socket.emit('gameinfo', game.getPublicGameInfo())
        socket.emit('lobbyjoin')
        socket.emit('playerinfo', socket.player.getPublicPlayerInfo())
    }


    /**
     * Handles the start of a game by sending every player the game details
     * 
     * @param {Socket} socket - The socket to the client
     * @param {object} data - The data sent with the start event (Should be none)
     */

    handleStart(socket, data) {
        if (!socket.player) {
            throw new Error('Not authenticated as player')
        }
        if (!socket.player.game) {
            throw new Error('Not in any game')
        }
        if (socket.player.game.state != 'lobby' && socket.player.game.state != 'end') {
            throw new Error('Game not in lobby')
        }
        if (socket.player != socket.player.game.admin) {
            throw new Error('Player not admin of this game')
        }

        // TODO
        socket.player.game.prepare(true)
        socket.player.game.players.forEach(p => {
            if (p.socket) {
                p.socket.emit('playerlist', socket.player.game.getCustomPlayerList(p, false))
                p.socket.emit('nextturn', socket.player.game.getCustomGameStateFor(p))
            }
        })
        
        this.io.to(socket.player.game.inviteCode).emit('gamestart')
    }


    /**
     * Checks whether a move is valid in respect to the board constraints and previous moves
     * 
     * @param {object} move - Move to check with position and face
     * @param {object} currentState - Previous move with position and faces
     */

    isValidMove(move, currentState) {
        if (typeof move.position !== 'number' || typeof move.face !== 'number')
            return false
            
        if (move.position > 29 || move.face > 6 || move.face < 1)
            return false

        if (move.position < currentState.position)
            return false

        if (move.position == currentState.position && move.face <= currentState.face)
            return false

        if ((move.position + 2) % 3 == 0) {
            if (move.face != 6)
                return false
        } else {
            if (move.face == 6)
                return false
        }

        return true
    }


    /**
     * Handles a move made by a player
     * 
     * @param {Socket} socket - The socket to the client
     * @param {object} data - The data sent with the move event
     */

    handleMove(socket, data) {
        if (!socket.player) {
            throw new Error('Not authenticated as player')
        }
        if (socket.player.game.players[socket.player.game.currentTurnIndex] != socket.player) {
           throw new Error('Player not admin of this game')
        }
        if (!this.isValidMove(data, socket.player.game.dice))  {
            throw new Error('Invalid move')
        }

        socket.player.game.dice = data
        socket.player.game.nextTurn()
        socket.player.game.players.forEach((p) => {
            if (p.socket)
                p.socket.emit('nextturn', socket.player.game.getCustomGameStateFor(p))
        })
    }


    /**
     * Counts the dices relevant to a certain bet
     * 
     * @param {Array} diceList - A list of dices to look for dices relevant to the bet
     * @param {object} dice - Current bet
     */

    countRelevantDices(diceList, dice) {
        let count = 0

        diceList.forEach(d => {
            d.forEach(d => {
                if (d == dice.face || d == 6) count++
            })
        })

        return count
    }


    /**
     * Determines the dices count for a bet from the field
     * 
     * @param {number} position - The field of which the bet count should be determined
     */

    getTargetCount(position) {
        position += 1

        let modulo = position % 3
        
        if (modulo == 2) {
            return (position - modulo) / 3 + 1
        } else {
            return position - (position - modulo) / 3
        }
    }


    /**
     * Handles the refutal of a bet by a player
     * 
     * @param {Socket} socket - The socket to the client
     * @param {object} data - The data sent with the event (Should be none)
     */

    handleRefute(socket, data) {
        if (!socket.player) {
            throw new Error('Not authenticated as Player')
        }

        if (socket.player.game.players[socket.player.game.currentTurnIndex] != socket.player) {
            throw new Error('Player not at turn')
        }

        const count = this.countRelevantDices(socket.player.game.getPublicDiceList(), socket.player.game.dice)
        const target = this.getTargetCount(socket.player.game.dice.position)

        const comparisonData = {
            actual: count,
            target: target,
            dice: socket.player.game.dice
        }

        socket.player.game.refute(comparisonData)

        /*if (typeof winnerIndex === 'number') {
            socket.player.game.state = 'end'
        } else {
            socket.player.game.state = 'refute'
        }*/

        socket.player.game.players.forEach(p => {
            const diceList = socket.player.game.getCustomDiceList(p)

            if (p.socket)
                p.socket.emit('refute', {
                    dices: diceList,
                    comparisonData: comparisonData,
                    //winnerIndex: socket.player.game.getCustomIndex(p, winnerIndex)
                })
        })
    }


    /**
     * Handles the preparation of the next round of a game
     * 
     * @param {Socket} socket - The socket to the client
     * @param {object} data - The data sent with the event (Should be none)
     */

    handleNextRound(socket, data) {
        if (!socket.player) {
            throw new Error('Not authenticated as Player')
        }
        if (socket.player.game.players[socket.player.game.nextRoundButtonPlayerIndex] != socket.player) {
            throw new Error('Player not at turn')
        }
        if (socket.player.game.state !== 'refute') {
            throw new Error('Not at refute state')
        }

        if (socket.player.game.isWinnerFound()) {
            this.handleWinnerFound(socket, data)
        } else {
                socket.player.game.prepare(false)

                socket.player.game.players.forEach(p => {
                    if (p.socket) {
                        p.socket.emit('playerlist', socket.player.game.getCustomPlayerList(p))
                        p.socket.emit('nextturn', socket.player.game.getCustomGameStateFor(p))
                    }
                })

                this.io.to(socket.player.game.inviteCode).emit('gamestart')
        }
    }

    handleNextGame(socket, data) {
        if (!socket.player) {
            throw new Error('Not authenticated as Player')
        }
        if (socket.player != socket.player.game.admin) {
            throw new Error('Not an admin')
        }
        if (socket.player.game.state !== 'end') {
            throw new Error('Game has not ended yet')
        }

        socket.player.game.players.forEach(p => {
            p.socket.emit('lobbyjoin')
        })

        socket.player.game.state = 'lobby'
    }

    handleWinnerFound(socket, data) {
        socket.player.game.players.forEach((p, i) => {
            if (p.socket) {
                p.socket.emit('winnerfound', { winnerIndex: socket.player.game.getCustomIndex(p, socket.player.game.winnerIndex) })
            }
        })
    }

    handleDisconnect(socket, data) {
        if (!socket.player) {
            return
        }

        socket.player.isConnected = false

        if (socket.player.game) {
            const game = socket.player.game

            if (game.state === 'lobby') {
                socket.player.leaveGame()
            }
            this.playerManager.addDisconnectedPlayer(socket.player)

            game.players.forEach(p => {
                if (p.socket)
                    p.socket.emit('playerlist', game.getCustomPlayerList(p))
            })
        }

        socket.player.socket = null
    }
}

module.exports = GameController

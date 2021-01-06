const Game = require('../models/Game.js')
const Player = require('../models/Player.js')

class GameController {
    constructor(io, asyncMysql, gameManager, playerManager) {
        this.io = io
        this.asyncMysql = asyncMysql
        this.gameManager = gameManager
        this.playerManager = playerManager
    }

    async handleAuth(socket, data) {
        if (data) {
            if (data.token) {
                socket.player = this.playerManager.getFromToken(data.token, this.asyncMysql)
                if (!socket.player) {
                    throw new Error('Invalid token')
                }

            } else if (data.username) {
                socket.player = await Player.createNew(data.username, this.asyncMysql)
                this.playerManager.addPlayer(socket.player)
            } else {
                throw new Error('Invalid field combination for auth')
            }

            socket.player.socket = socket
            socket.emit('playerinfo', socket.player.getPublicPlayerInfo())
            if (socket.player.game) {
                this.rejoinPlayer(socket)
            }
        } else {
            throw new Error('Missing data for auth')
        }
    }

    rejoinPlayer(socket) {
        socket.join(socket.player.game.inviteCode)

        socket.emit('gameinfo', socket.player.game.getPublicGameInfo())
        socket.emit('playerlist', socket.player.game.getCustomPlayerList(socket.player))

        switch (this.socket.player.game.state) {
            case 'lobby':
                socket.emit('gamejoin')
                break

            case 'ingame':
                socket.emit('nextturn', socket.player.game.getCustomGameStateFor(socket.player))
                socket.emit('gamestart')
                break
        }
    }

    handleJoin(socket, data) {
        if (!socket.player) {
            throw new Error('Player not authenticated')
        }
        if (!data || !data.inviteCode) {
            // Handle ill-formatted error
        }
        
        let game = this.gameManager.getFromInviteCode(data.inviteCode)
        if (!game) {
            throw new Error('Game not found')
        }
        if (game.state == 'running') {
            // Handle game already running
        }

        socket.player.joinGame(game)

        socket.join(game.inviteCode)
        this.io.to(game.inviteCode).emit('playerlist', game.getPublicPlayerList())
        socket.emit('gameinfo', game.getPublicGameInfo())
        socket.emit('gamejoin')
        socket.emit('playerinfo', socket.player.getPublicPlayerInfo())
    }

    handleLeave(socket, data) {
        if (!socket.player) {
            throw new Error('Player not authenticated')
        }
        if (!socket.player.game) {
            throw new Error('Player not in game')
        }

        const game = socket.player.game        
        socket.player.leaveGame()

        socket.emit('set-username')
        socket.emit('gameinfo', {})
        socket.player.game.players.forEach(p => {
            p.socket.emit('playerlist', socket.player.game.getCustomPlayerList(p))
        })
    }

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
            p.socket.emit('playerlist', socket.player.game.getCustomPlayerList(p))
        })
        socket.emit('gameinfo', game.getPublicGameInfo())
        socket.emit('gamejoin')
        socket.emit('playerinfo', socket.player.getPublicPlayerInfo())
    }

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
            p.socket.emit('playerlist', socket.player.game.getCustomPlayerList(p, false))
            p.socket.emit('nextturn', socket.player.game.getCustomGameStateFor(p))
        })
        
        this.io.to(socket.player.game.inviteCode).emit('gamestart')
    }

    handleMove(socket, data) {
        if (!socket.player) {
            // Handle not authenticated error
        }
        if (socket.player.game.players[socket.player.game.currentTurnIndex] != socket.player) {
            // Handle wrong player
        }

        // TODO check client data
        socket.player.game.dice = data
        socket.player.game.nextTurn()
        socket.player.game.players.forEach((p) => {
            p.socket.emit('nextturn', socket.player.game.getCustomGameStateFor(p))
        })
    }

    countRelevantDices(diceList, dice) {
        let count = 0

        diceList.forEach(d => {
            d.forEach(d => {
                if (d == dice.face) count++
            })
        })

        return count
    }

    getTargetCount(position) {
        position += 1

        let modulo = position % 3
        
        if (modulo == 2) {
            return (position - modulo) / 3 + 1
        } else {
            return position - (position - modulo) / 3
        }
    }

    handleRefute(socket, data) {
        if (!socket.player) {
            throw new Error('Player not authenticated')
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

        const winnerIndex = socket.player.game.refute(comparisonData)

        if (typeof winnerIndex === 'number') {
            socket.player.game.state = 'end'
        } else {
            socket.player.game.state = 'refute'
        }

        socket.player.game.players.forEach(p => {
            const diceList = socket.player.game.getCustomDiceList(p)

            p.socket.emit('refute', {
                dices: diceList,
                comparisonData: comparisonData,
                winnerIndex: socket.player.game.getCustomIndex(p, winnerIndex)
            })
        })
    }

    handleNextRound(socket, data) {
        if (!socket.player) {
            throw new Error('Player not authenticated')
        }
        if (socket.player.game.players[socket.player.game.currentTurnIndex] != socket.player) {
            throw new Error('Player not at turn')
        }
        if (socket.player.game.state !== 'refute') {
            throw new Error('Not at refute state')
        }

        socket.player.game.prepare(false)
    
        socket.player.game.players.forEach(p => {
            p.socket.emit('playerlist', socket.player.game.getCustomPlayerList(p))
            p.socket.emit('nextturn', socket.player.game.getCustomGameStateFor(p))
        })

        this.io.to(socket.player.game.inviteCode).emit('gamestart')
    }
}

module.exports = GameController

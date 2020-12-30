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
        socket.emit('diceposition', socket.player.game.dicePosition)
        socket.emit('statechange', socket.player.game.state)
    }

    handleJoin(socket, data) {
        if (!socket.player) {
            throw new Error('Player not authenticated')
        }
        if (!data || !data.inviteCode) {
            // Handle ill-formatted error
        }
        
        let game = this.gameManager.getFromInviteCode(data.inviteCode)
        if (game.state == 'running') {
            // Handle game already running
        }

        socket.player.joinGame(game)

        socket.join(game.inviteCode)
        this.io.to(game.inviteCode).emit('playerlist', game.getPublicPlayerList())
        socket.emit('gameinfo', game.getPublicGameInfo())
        socket.emit('statechange', 'lobby')
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

        socket.emit('statechange', 'set-username')
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
        socket.emit('statechange', 'lobby')
        socket.emit('playerinfo', socket.player.getPublicPlayerInfo())
    }

    handleStart(socket, data) {
        if (!socket.player) {
            throw new Error('Not authenticated as player')
        }
        if (!socket.player.game) {
            throw new Error('Not in any game')
        }
        if (socket.player.game.state != 'lobby') {
            throw new Error('Game not in lobby')
        }
        if (socket.player != socket.player.game.admin) {
            throw new Error('Player not admin of this game')
        }

        // TODO
        socket.player.game.prepare()
        socket.player.game.players.forEach(p => {
            p.socket.emit('playerlist', socket.player.game.getCustomPlayerList(p))
        })
        
        //let playerAtTurnSocket = socket.player.game.players[socket.player.game.currentTurnIndex].socket

        this.io.to(socket.player.game.inviteCode).emit('statechange', 'ingame')
        this.io.to(socket.player.game.inviteCode).emit('diceposition', socket.player.game.dicePosition)
    }

    handleMove(socket, data) {
        if (!socket.player) {
            // Handle not authenticated error
        }
        if (socket.player && socket.player.game.activePlayer == socket.player) {
            
        } else {
            // Handle ill-formatted error
        }
    }
}

module.exports = GameController

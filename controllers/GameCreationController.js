const Game = require('../models/Game.js')

class GameCreationController {
    static handle(socket, data, io, gameManager) {
        if (!socket.player) {
            throw new Error('Not authenticated as player')
        }

        const game = Game.create()
        gameManager.addGame(game)

        game.addPlayer(socket.player)

        socket.join(game.inviteCode)
        io.to(game.inviteCode).emit('playerlist', game.getPublicPlayerList())
        socket.emit('gameinfo', game.getPublicGameInfo())
        socket.emit('statechange', 'lobby')
    }
}

module.exports = GameCreationController

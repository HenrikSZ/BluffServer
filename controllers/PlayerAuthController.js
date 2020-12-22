const Player = require('../models/Player.js')

class PlayerAuthController {
    static async handle(socket, data, playerManager, asyncMysql) {
        if (data) {
            if (data.token) {
                socket.player = playerManager.getFromToken(data.token, asyncMysql)
                if (!socket.player) {
                    throw new Error('Invalid token')
                }

            } else if (data.username) {
                socket.player = await Player.createNew(data.username, asyncMysql)
                playerManager.addPlayer(socket.player)
            } else {
                throw new Error('Invalid field combination for auth')
            }

            socket.player.socket = socket
            socket.emit('playerinfo', socket.player.getPublicPlayerInfo())
            if (socket.player.game) {
                PlayerAuthController.rejoinPlayer(socket)
            }
        } else {
            throw new Error('Missing data for auth')
        }
    }

    static rejoinPlayer(socket) {
        socket.join(socket.player.game.inviteCode)

        socket.emit('gameinfo', socket.player.game.getPublicGameInfo())
        socket.emit('playerlist', socket.player.game.getPublicPlayerList())
        socket.emit('statechange', socket.player.game.state)
    }
}

module.exports = PlayerAuthController

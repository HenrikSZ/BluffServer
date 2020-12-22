const Player = require('../player.js')

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
            socket.emit('auth-success')
            socket.emit('playerinfo', socket.player.getPublicData())
        } else {
            throw new Error('Missing data for auth')
        }
    }
}

module.exports = PlayerAuthController

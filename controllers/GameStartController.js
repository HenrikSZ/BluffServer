class GameStartController {
    static handle(socket, data, io) {
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
        io.to(socket.player.game.inviteCode).emit('playerlist', socket.player.game.getPublicPlayerList())
        socket.emit('playerinfo', socket.player.getPublicPlayerInfo())
        socket.emit('statechange', 'ingame')
    }
}

module.exports = GameStartController

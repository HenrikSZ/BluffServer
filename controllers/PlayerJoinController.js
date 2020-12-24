class PlayerJoinController {
    static handle(socket, data, io, gameManager) {
        if (!socket.player) {
            throw new Error('Player not authenticated')
        }
        if (!data || !data.inviteCode) {
            // Handle ill-formatted error
        }
        
        let game = gameManager.getFromInviteCode(data.inviteCode)
        if (game.state == 'running') {
            // Handle game already running
        }

        socket.player.joinGame(game)

        socket.join(game.inviteCode)
        io.to(game.inviteCode).emit('playerlist', game.getPublicPlayerList())
        socket.emit('gameinfo', game.getPublicGameInfo())
        socket.emit('statechange', 'lobby')
        socket.emit('playerinfo', socket.player.getPublicPlayerInfo())
    }
}

module.exports = PlayerJoinController

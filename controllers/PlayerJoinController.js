class PlayerJoinController {
    static handle(socket, data, gameManager) {
        if (!socket.player) {
            // Handle not authenticated error
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
        io.to(game.inviteCode).emit('lobby-update', player.game.getPlayerNameList(asyncMysql))
    }
}

module.exports = PlayerJoinController

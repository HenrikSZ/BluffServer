class PlayerLeaveController {
    static handle(socket, data) {
        if (!socket.player) {
            // Handle not authenticated error
        }

        socket.player.leaveGame()

        socket.emit('statechange', 'set-username')
        socket.emit('gameinfo', {})
    }
}

module.exports = PlayerLeaveController

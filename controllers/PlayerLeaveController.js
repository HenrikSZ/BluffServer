class PlayerLeaveController {
    static handle(socket, data) {
        if (!socket.player) {
            // Handle not authenticated error
        }

        socket.player.leaveGame()
    }
}

module.exports = PlayerLeaveController

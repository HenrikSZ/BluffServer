class PlayerMoveController {
    static handle(socket, data) {
        if (!socket.player) {
            // Handle not authenticated error
        }
        if (socket.player && socket.player.game.activePlayer == socket.player) {
            
        } else {
            // Handle ill-formatted error
        }
    }
}

module.exports = PlayerMoveController

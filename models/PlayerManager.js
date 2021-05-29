class PlayerManager {
    constructor() {
        this.players = {}
        this.disconnectedPlayers = []
    }

    addPlayer(player) {
        this.players[player.token] = player
    }

    addDisconnectedPlayer(player) {
        this.disconnectedPlayers.push({
            timeout: 15000,
            player: player
        })
    }

    removeFromDisconnectedPlayers(player) {
        this.disconnectedPlayers = this.disconnectedPlayers.filter(p => p.player != player)
    }

    cleanDisconnectedPlayers(cleanInterval) {
        const cleanedGames = []

        this.disconnectedPlayers.forEach(dp => {
            dp.timeout -= cleanInterval

            if (dp.timeout <= 0) {
                cleanedGames.push(dp.player.game)
                dp.player.leaveGame()
                
                this.removeFromDisconnectedPlayers(dp.player)
            }
        })

        return cleanedGames
    }

    removePlayer(player) {
        this.players[player.token] = null
    }

    getFromToken(token) {
        return this.players[token]
    }
}

module.exports = PlayerManager

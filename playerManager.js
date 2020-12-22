class PlayerManager {
    static async createAndLoadPlayers(asyncMysql) {
        const playerManager = new PlayerManager()

        const players = await asyncMysql.query(`SELECT username, token FROM players`)
        players.forEach(p => {
            playerManager.addPlayer(p)
        })

        return playerManager
    }

    constructor() {
        this.players = {}
    }

    addPlayer(player) {
        this.players[player.token] = player
    }

    removePlayer(player) {
        this.players[player.token] = null
    }

    getFromToken(token) {
        return this.players[token]
    }
}

module.exports = PlayerManager

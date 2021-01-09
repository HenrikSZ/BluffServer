const Player = require('./Player.js')

class PlayerManager {
    static createAndLoadPlayers(asyncMysql) {
        return asyncMysql.query('CREATE TABLE IF NOT EXISTS players (id INT NOT NULL PRIMARY KEY AUTO_INCREMENT, username VARCHAR(64), token CHAR(32))')
        .then(() => asyncMysql.query(`SELECT id, username, token FROM players`))
        .then((players) => {
            const playerManager = new PlayerManager()
            players.forEach(p => {
                playerManager.addPlayer(Player.createFromDb(p))
            })

            return playerManager
        })
    }

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

    removeDisconnectedPlayer(player) {
        this.disconnectedPlayers = this.disconnectedPlayers.filter(p => p.player != player)
    }

    cleanDisconnectedPlayers(cleanInterval) {
        const cleanedGames = []

        this.disconnectedPlayers.forEach(dp => {
            dp.timeout -= cleanInterval

            if (dp.timeout <= 0) {
                cleanedGames.push(dp.player.game)
                dp.player.leaveGame()
                
                this.removeDisconnectedPlayer(dp.player)
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

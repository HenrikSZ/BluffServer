const Player = require('./Player.js')

class PlayerManager {
    static createAndLoadPlayers(asyncMysql) {
        return asyncMysql.query(`SELECT id, username, token FROM players`)
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

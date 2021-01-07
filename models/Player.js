const crypto = require('crypto')

class Player {
    async updateUsername(username, asyncMysql) {
        //TODO fix 
        await asyncMysql.query(`UPDATE players SET username = ${asyncMysql.escape(username)} WHERE id = ${asyncMysql.escape(player.id)}`)
        this.username = username

        return player
    }

    static async createNew(username, asyncMysql) {
        const player = new Player()
        let result

        player.token = crypto.randomBytes(16).toString('hex')
        player.username = username
        if (!username) {
            throw new Error('Username must be included in query!')
        }
        if (username.length > 64 || username.length == 0) {
            throw new Error('Username must be between 1 and 64 characters long!')
        }
        
        // TODO think of error handling
        result = await asyncMysql.query(`INSERT INTO players (username, token) VALUES (${asyncMysql.escape(username)}, ${asyncMysql.escape(player.token)})`)
        player.id = result.insertId

        return player
    }

    static createFromDb(playerData) {
        const player = new Player()

        player.username = playerData.username
        player.id = playerData.id
        player.token = playerData.token

        return player
    }

    constructor() {
        this.username = ''
        this.id = ''
        this.token = ''
        this.dices = []
        this.dicesTaken = 0
    }

    getPublicPlayerInfo() {
        return {
            username: this.username,
            token: this.token,
            isAdmin: this.game && this.game.admin == this
        }
    }

    diceCount() {
        const diceCount = this.dices.length - this.dicesTaken

        return diceCount > 0 ? diceCount : 0
    }

    rollTheDices(reset) {
        let diceCount = reset ? 5 : this.dices.length - this.dicesTaken

        this.dicesTaken = 0

        if (diceCount < 0)
            diceCount = 0

        this.dices = []
        for (let i = 0; i < diceCount; i++) {
            this.dices.push(1 + Math.floor(Math.random() * 6))
        }

        this.dices.sort((a, b) => a - b)
    }

    inPlay() {
        return this.dices.length > 0
    }

    joinGame(game) {
        this.game = game
        game.addPlayer(this)
    }

    leaveGame() {
        if (!this.game) {
            throw new Error('Player not in any game')
        }

        this.game.removePlayer(this)
        this.game = null
    }
}

module.exports = Player

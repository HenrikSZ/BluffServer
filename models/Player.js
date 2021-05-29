const crypto = require('crypto')

class Player {
    constructor(username) {
        this.token = crypto.randomBytes(16).toString('hex')
        this.username = username
        if (!username) {
            throw new Error('Username must be included in query!')
        }
        if (username.length > 64 || username.length == 0) {
            throw new Error('Username must be between 1 and 64 characters long!')
        }

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

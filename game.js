const crypto = require('crypto')

class Game {
    static create() {
        const game = new Game()

        return game
    }

    constructor() {
        this.players = []
        this.inviteCode = crypto.randomBytes(4).toString('hex')
    }

    getPublicPlayerList() {
        return this.players.map(p => {
            return {
                username: p.username
            }
        })
    }

    getPublicGameInfo() {
        return {
            inviteCode: this.inviteCode,
            playerCount: this.players.length
        }
    }

    addPlayer(player) {
        if (!this.players.includes(player)) {
            this.players.push(player)
        }
    }

    removePlayer(player) {
        this.players = this.players.filter(p => p != player)
        if (this.players.length == 0) {
            this.gameManager.removeGame(this)
        }
    }
}

module.exports = Game

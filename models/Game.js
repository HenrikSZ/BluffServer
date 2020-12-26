const crypto = require('crypto')

class Game {
    static create() {
        const game = new Game()

        return game
    }

    constructor() {
        this.players = []
        this.inviteCode = crypto.randomBytes(4).toString('hex')
        this.state = 'lobby'
        this.currentTurnIndex = 0
    }

    getPublicPlayerList() {
        return this.players.map((p, index) => {
            if (this.state === 'ingame') {
                return {
                    username: p.username,
                    dices: [0, 0, 0, 0, 0],
                    atTurn: index == this.currentTurnIndex
                }
            } else {
                return {
                    username: p.username,
                    dices: p.dices
                }
            }
        })
    }

    getCustomPlayerList(player) {
        const target = []

        let i = this.players.indexOf(player)

        target.push({
            username: player.username,
            dices: this.state === 'ingame' ? player.dices : [],
            atTurn: i == this.currentTurnIndex
        })        

        i++

        if (i == this.players.length)
        i = 0

        while (this.players[i] != player) {
            target.push({
                username: this.players[i].username,
                dices: this.state === 'ingame' ? [0, 0, 0, 0, 0] : [],
                atTurn: i == this.currentTurnIndex
            })

            i++

            if (i == this.players.length)
                i = 0
        }

        return target
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

    nextPlayerTurn() {
        this.currentTurnIndex++

        if (this.currentTurnIndex == this.players.length || this.players[this.currentTurnIndex].diceCount <= 0) {
            this.currentTurnIndex = 0
        }
    }

    prepare() {
        this.players.forEach(p => {
            p.rollTheDices(true)
        })

        this.state = 'ingame'
    }
}

module.exports = Game

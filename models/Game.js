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
        this.dice = {
            face: 0,
            position: 0
        }
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
            dices: this.state === 'ingame' || this.state === 'refute' ? player.dices : [],
            atTurn: i == this.currentTurnIndex
        })        

        i++

        if (i == this.players.length)
            i = 0

        while (this.players[i] != player) {
            target.push({
                username: this.players[i].username,
                dices: Array(this.players[i].dices.length).fill(0, 0, this.players[i].dices.length)
            })

            i++

            if (i == this.players.length)
                i = 0
        }

        return target
    }

    getCustomDicesList(player) {
        const target = []

        let i = this.players.indexOf(player)

        target.push(player.dices)

        i++

        if (i == this.players.length)
            i = 0

        while (this.players[i] != player) {
            target.push(this.players[i].dices)

            i++

            if (i == this.players.length)
                i = 0
        }

        return target
    }

    getCustomGameStateFor(player) {
        let i = this.players.indexOf(player)

        let delta = this.currentTurnIndex - i
        if (delta < 0) delta += this.players.length

        return {
            dice: this.dice,
            currentTurnIndex: delta
        }
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

    getPreviousActivePlayerIndex() {
        let i = this.currentTurnIndex

        while (true) {
            i--
            if (i < 0) {
                i = this.players.length - 1
            }

            if (i == this.currentTurnIndex)
                return -1

            if (this.players[i].inPlay())
                return i
        }
    }

    nextTurn() {
        this.currentTurnIndex++

        if (this.currentTurnIndex == this.players.length || this.players[this.currentTurnIndex].diceCount <= 0) {
            this.currentTurnIndex = 0
        }
    }

    prepare(newGame) {
        if (!newGame) {
            const diff = this.comparisonData.target - this.comparisonData.actual
            const previousPlayerIndex = this.getPreviousActivePlayerIndex()

            if (diff < 0) {
                this.players[this.currentTurnIndex].dicesTaken = -diff
                this.currentTurnIndex = previousPlayerIndex
            } else if (diff > 0) {
                this.players[previousPlayerIndex].dicesTaken = diff
            } else {
                this.players.forEach((p, i) => {
                    if (i != previousPlayerIndex) {
                        p.dicesTaken = 1
                    }
                })
            }
            this.comparisonData = null
        }

        this.players.forEach(p => {
            p.rollTheDices(newGame)
        })

        this.state = 'ingame'
        this.dice = {
            face: 0,
            position: 0
        }
    }
}

module.exports = Game

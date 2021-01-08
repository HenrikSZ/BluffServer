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
        this.isConnected = false
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
                    isAdmin: p == this.admin,
                    isConnected: p.isConnected,
                }
            } else {
                return {
                    username: p.username,
                    dices: p.dices,
                    isAdmin: p == this.admin,
                    isConnected: p.isConnected,
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
            isAdmin: player == this.admin,
            atTurn: this.currentTurnIndex == i
        })        

        i++

        if (i == this.players.length)
            i = 0

        while (this.players[i] != player) {
            target.push({
                username: this.players[i].username,
                dices: Array(this.players[i].dices.length).fill(0, 0, this.players[i].dices.length),
                isAdmin: this.players[i] == this.admin,
                isConnected: this.players[i].isConnected,
                atTurn: this.currentTurnIndex == i
            })

            i++

            if (i == this.players.length)
                i = 0
        }

        return target
    }

    getCustomDiceList(player) {
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

    getPublicDiceList() {
        return this.players.map(p => p.dices)
    }

    getCustomIndex(player, index) {
        let i = this.players.indexOf(player)

        let delta = index - i
        if (delta < 0) delta += this.players.length

        return delta
    }

    getCustomGameStateFor(player) {
        return {
            dice: this.dice,
            currentTurnIndex: this.getCustomIndex(player, this.currentTurnIndex)
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
        do {
            this.currentTurnIndex++
            if (this.currentTurnIndex == this.players.length) {
                this.currentTurnIndex = 0
            }

        } while (!this.players[this.currentTurnIndex].inPlay())
    }

    getPublicWinner() {
        const player = this.players[this.currentTurnIndex]
        return {
            username: player.username
        }
    }

    isRunning() {
        return this.state !== 'lobby'
    }

    refute(comparisonData) {
        this.comparisonData = comparisonData
        this.state = 'refute'
        this.nextRoundButtonPlayerIndex = this.currentTurnIndex

        const diff = comparisonData.target - comparisonData.actual
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

            this.currentTurnIndex = previousPlayerIndex
        }

        const activePlayerCount = this.players.filter(p => p.diceCount() > 0).length

        if (activePlayerCount == 1)
            this.winnerIndex = this.players.findIndex(p => p.diceCount() > 0)
        else
            this.winnerIndex = undefined

        return this.winnerIndex
    }

    prepare(newGame) {
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

class GameManager {
    constructor() {
        this.games = {}
    }

    addGame(game) {
        this.games[game.inviteCode] = game
        game.gameManager = this
    }

    removeGame(game) {
        this.games[game.inviteCode].gameManager = null
        this.games[game.inviteCode] = null
    }

    getFromInviteCode(inviteCode) {
        return this.games[inviteCode]
    }
}

module.exports = GameManager
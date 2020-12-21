const crypto = require('crypto')

class Game {
    static async createNew(asyncMysql) {
        const game = new Game()
        let result

        game.inviteCode = crypto.randomBytes(4).toString('hex')
        result = await asyncMysql.query(`INSERT INTO games (invite_code) VALUES (${asyncMysql.escape(game.inviteCode)})`)
        game.id = result.insertId

        // TODO error handling

        return game
    }

    static async createFromExisting(req, asyncMysql) {
        const game = new Game()
        let result

        game.inviteCode = req.body.gameId

        result = await asyncMysql.query(`SELECT id FROM games WHERE invite_code = ${asyncMysql.escape(inviteCode)}`)
        if (result.length != 1) {
            // TODO error handling
        }

        game.id = result[0].id

        return game
    }

    static async createFromId(id, asyncMysql) {
        const game = new Game()
        let result

        result = await asyncMysql.query(`SELECT invite_code FROM games WHERE id = ${asyncMysql.escape(id)}`)
        if (result.length != 1) {
            // TODO error handling
        }

        game.id = id
        game.inviteCode = result[0].invite_code

        return game
    }

    async deleteIfEmpty(asyncMysql) {
        let result = await asyncMysql.query(`SELECT COUNT(*) FROM players WHERE game = ${this.id}`)
        if (result[0]['COUNT(*)'] == 0) {
            await asyncMysql.query(`DELETE FROM games WHERE id = ${this.id}`)
        }
    }
}

module.exports = Game

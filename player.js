const crypto = require('crypto')
const Game = require('./Game.js')

class Player {
    static async createFromExisting(req, asyncMysql) {
        const player = new Player()

        if (!req.cookies.token) {
            throw new Error('Cannot load existing player without token')
            // TODO error handling
        }
        player.token = req.cookies.token

        if (req.body.username) {
            await asyncMysql.query(`UPDATE players SET username = ${asyncMysql.escape(req.body.username)} WHERE token = ${asyncMysql.escape(req.cookies.token)}`)
            let user = await asyncMysql.query(`SELECT id, game FROM players WHERE TOKEN = ${asyncMysql.escape(req.cookies.token)}`)[0]
            
            player.username = req.body.username
            player.id = user.id

            if (user.game) {
                player.game = await Game.createFromId(user.game, asyncMysql)
            }
        } else {
            let user = (await asyncMysql.query(`SELECT username, id, game FROM players WHERE token = ${asyncMysql.escape(req.cookies.token)}`))[0]

            player.username = user.username
            player.id = user.id

            if (user.game) {
                player.game = await Game.createFromId(user.game, asyncMysql)
            }
        }

        return player
    }

    static async createNew(req, res, asyncMysql) {
        const player = new Player()
        let result

        player.token = crypto.randomBytes(16).toString('hex')
        if (!req.body.username) {
            throw new Error('Username must be included in query!')
        }
        if (req.body.username.length > 64 || req.body.username.length == 0) {
            throw new Error('Username must be between 1 and 64 characters long!')
        }
        
        // TODO think of error handling
        result = await asyncMysql.query(`INSERT INTO players (username, token) VALUES (${asyncMysql.escape(req.body.username)}, ${asyncMysql.escape(player.token)})`)
        player.id = result.insertId
        res.cookie('token', player.token, { maxAge: 86400000 })

        return player
    } 

    async join(game, asyncMysql) {
        this.game = game
        await asyncMysql.query(`UPDATE players SET game = ${game.id} WHERE id = ${this.id}`)
    }

    async leave(asyncMysql) {
        if (this.game) {
            await asyncMysql.query(`UPDATE players SET game = NULL WHERE id = ${this.id}`)
            await this.game.deleteIfEmpty(asyncMysql)
            this.game = null
        }
    }
}

module.exports = Player

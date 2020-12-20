const crypto = require('crypto')

class Player {
    static async createFromRequest(req, res, asyncQuery, escape) {
        const player = new Player()
        let result

        if (req.cookies.token) {
            player.token = req.cookies.token

            if (req.body.username) {
                result = await asyncQuery(`UPDATE players SET username = ${escape(req.body.username)} WHERE token = ${escape(req.cookies.token)}`)
                player.username = req.body.username
            } else {
                player.username = (await asyncQuery(`SELECT username FROM players WHERE token = ${escape(req.cookies.token)}`))[0].username
            }
        } else {
            player.token = crypto.randomBytes(16).toString('hex')
            if (!req.body.username) {
                throw new Error('Username must be included in query!')
            }
            if (req.body.username.length > 64 || req.body.username.length == 0) {
                throw new Error('Username must be between 1 and 64 characters long!')
            }
            
            // TODO think of error handling
            result = await asyncQuery(`INSERT INTO players (username, token) VALUES (${escape(req.body.username)}, ${escape(player.token)})`)
            res.cookie('token', player.token, { maxAge: 86400000 })
        }

        return player
    }
}

module.exports = Player

function getCookieValue(cookieKey) {
    let regex = new RegExp('^.*;?\s*' + cookieKey + 's*=\s*([^;]+).*?$', 'gi')
    let regexResult = regex.exec(document.cookie)
    return regexResult ? regexResult[1] : null
}

function game() {
    return {
        gameState: 'set-username',
        players: [],
        game: {},
        player: {},
        connectSocketIO() {
            this.socket = io()

            this.socket.on('statechange', data => {
                this.gameState = data
            })
            this.socket.on('gameinfo', data => {
                this.game = data
            })
            this.socket.on('playerlist', data => {
                console.log('received playerlist')
                console.log(data)
                this.players = data
            })
            this.socket.on('playerinfo', data => {
                this.player = data
            })
        },
        authSocketIO() {
            const token = getCookieValue('token')
            if (token) {
                this.socket.emit('auth', { token: token })
            } else {
                this.socket.emit('auth', { username: username })
            }
        },
        createGame() {
            this.socket.on('auth-success', () => {
                this.socket.emit('game-create')
                this.socket.off('auth-success')
            })
            this.authSocketIO()
        },
        joinGame() {
            // TODO client side validating
            this.socket.on('auth-success', () => {
                this.socket.emit('game-join', inviteCode)
                this.socket.off('auth-success')
            })
            this.authSocketIO()
        }
    }
}

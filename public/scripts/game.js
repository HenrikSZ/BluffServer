function getCookieValue(cookieKey) {
    let regex = new RegExp('^.*;?\s*' + cookieKey + 's*=\s*([^;]+).*?$', 'gi')
    let regexResult = regex.exec(document.cookie)
    return regexResult ? regexResult[1] : null
}

function setCookieValue(key, value, maxAge) {
    document.cookie = `${key}=${value}; max-age=${maxAge}`
}

function game() {
    return {
        gameState: '',
        players: [],
        game: {},
        player: {},
        authenticated: false,
        rejoin: false,
        connectSocketIO() {
            this.socket = io()

            this.socket.on('statechange', data => {
                console.log(`game.statechange[${data}]`)
                this.gameState = data
            })
            this.socket.on('gameinfo', data => {
                console.log(`game.gameinfo`)
                this.game = data
            })
            this.socket.on('playerlist', data => {
                console.log(`game.playerlist`)
                this.players = data
            })
            this.socket.on('playerinfo', data => {
                console.log(`game.playerinfo`)
                console.log(data)
                this.player = data
            })

            if (this.rejoin) {
                console.log('game.rejoin')
                this.authSocketIO()
            } else {
                this.gameState = 'set-username'
            }
        },
        authSocketIO() {
            this.socket.on('auth-response', data => {
                this.socket.off('auth-response')
                if (!data || !data.error) {
                    this.authenticated = true
                } else {
                    console.log(data.error)
                }
            })

            const token = getCookieValue('token')
            if (token) {
                this.socket.emit('auth', { token: token })
            } else {
                this.socket.emit('auth', { username: username })
                this.socket.on('playerinfo', data => {
                    this.socket.off('playerinfo')
                    this.player = data
                    setCookieValue('token', data.token, 31536000000)
                })
            }
        },
        createGame() {
            while (!this.authenticated) continue
            
            this.socket.emit('game-create')
        },
        joinGame() {
            while (!this.authenticated) continue
            
            this.socket.emit('game-join')
        },
        leaveGame() {
            if (this.game) {
                this.socket.emit('game-leave')
            }
        },
        startGame() {
            if (this.game && this.player.isAdmin) {
                this.socket.emit('game-start')
            }
        }
    }
}

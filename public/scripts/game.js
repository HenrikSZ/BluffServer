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
        player: {
            dices: []
        },
        authenticated: false,
        rejoin: false,
        turnOptions: {},
        connectSocketIO() {
            this.socket = io()

            this.socket.on('statechange', data => {
                console.log(`game.statechange[${data}]`)
                this.gameState = data
            })
            this.socket.on('gameinfo', data => {
                console.log(`game.gameinfo`)
                this.game = data
/*
                this.$refs.ownTurnOptionsCanvasParent.textContent = ''
                this.$refs.ownTurnOptionsCanvasParent.appendChild(this.createTurnOptionsCanvas())*/
            })
            this.socket.on('playerlist', data => {
                console.log(`game.playerlist`)
                //console.log(data)
                this.players = data

                this.updateDiceCanvases()
            })
            this.socket.on('playerinfo', data => {
                console.log(`game.playerinfo`)
                this.player = data
                
                /*this.$refs.ownDicesCanvasParent.textContent = ''
                this.$refs.ownDicesCanvasParent.appendChild(this.createDiceCanvas(this.player.dices, 100))*/
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
            
            this.socket.emit('create')
        },
        joinGame() {
            while (!this.authenticated) continue
            
            this.socket.emit('join', { inviteCode: this.game.inviteCode })
        },
        leaveGame() {
            if (this.game) {
                this.socket.emit('leave')
            }
        },
        startGame() {
            if (this.game && this.player.isAdmin) {
                this.socket.emit('start')
            }
        },
        drawName(name, ctx, x, y) {
            ctx.font = '20px sans-serif'

            const nameWidth = ctx.measureText(name).width
            ctx.fillStyle = 'black'
            ctx.textBaseline = 'top'
            ctx.fillText(name, x  - nameWidth / 2, y)
        },
        drawDices(dices, diceSize, ctx, x, y) {
            const spacing = (diceSize / 10)

            const totalWidth = dices.length * diceSize + (dices.length - 1) * spacing
            x = x - totalWidth / 2

            dices.forEach((d, index) => {
                ctx.drawImage(this.$refs.dicesImage, d * 200, d.highlighted ? 200 : 0, 200, 200, x + (diceSize + spacing) * index, y, diceSize, diceSize)
            })
        },
        drawAtTurn(ctx, x, y) {
            const rectX = x - 200 / 2

            ctx.fillStyle = '#bde7f0'
            ctx.fillRect(rectX, y, 200, 30)

            ctx.strokeStyle = '#0720b0'
            ctx.strokeRect(rectX, y, 200, 30)

            const textX = x - ctx.measureText('current turn').width / 2

            ctx.fillStyle = '#0720b0'
            ctx.textBaseline = 'middle'
            ctx.fillText('current turn', textX, y + 15)
        },
        drawPlayer(player, ctx, x, y) {
            this.drawName(player.username, ctx, x, y - 55)
            this.drawDices(player.dices, 50, ctx, x, y - 30)
            if (player.atTurn) {
                this.drawAtTurn(ctx, x, y + 25)
            }

            ctx.beginPath()
            ctx.arc(x, y, 5, 0, 2 * Math.PI, false)
            ctx.fill()
        },
        updateDiceCanvases() {
            const canvas = this.$refs.gameCanvas
            const ctx = canvas.getContext('2d')

            ctx.clearRect(0, 0, canvas.width, canvas.height)

            let angle = 0

            let deltaAngle = Math.PI / (this.players.length - 2)

            if (this.players.length == 2) {
                angle += deltaAngle
            }

            this.drawPlayer(this.players[0], ctx, 600, 600 - 100)
            for (let i = 1; i < this.players.length; i++) {
                const x = 600 - 400 * Math.cos(angle)
                const y = 400 - 300 * Math.sin(angle)

                this.drawPlayer(this.players[i], ctx, x, y)

                angle += deltaAngle
            }

            ctx.fillRect(400, 180, 400, 250)
        },
        createTurnOptionsCanvas() {
            const canvas = document.createElement('canvas')
            canvas.width = 20 * 20 + 19 * 5
            canvas.height = 20 * 2 + 20

            const ctx = canvas.getContext('2d')

            for (let i = 1; i <= 6; i++) {
                ctx.drawImage(this.$refs.dicesImage, (i - 1) * 200, 0, 200, 200, (20 + 5) * i, 0, 20, 20)
            }
            for (let i = 0; i < 20; i++) {
                ctx.drawImage(this.$refs.fieldsImage, i * 100, 0, 100, 100, (20 + 5) * i, 40, 20, 20)
            }
        },
        isIngame() {
            return this.gameState === 'ingame' || this.gameState === 'atturn'
        }
    }
}

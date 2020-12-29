function getCookieValue(cookieKey) {
    let regex = new RegExp('^.*;?\s*' + cookieKey + 's*=\s*([^;]+).*?$', 'gi')
    let regexResult = regex.exec(document.cookie)
    return regexResult ? regexResult[1] : null
}

function setCookieValue(key, value, maxAge) {
    document.cookie = `${key}=${value}; max-age=${maxAge}`
}

class Board {
    constructor(dicesImage, ctx) {
        this.fields = []

        let starCounter = 1, normCounter = 1

        for (let i = 0; i < 30; i++) {

            let number
            const isStarField = (i - 1) % 3 == 0
            if (isStarField)
                number = starCounter++
            else
                number = normCounter++
            
            if (i == 0) {
                this.fields.push(new CornerField(number, true, true, isStarField, dicesImage, ctx))
            } else if (i < 10) {
                this.fields.push(new SimpleField(600 - 500 / 2 + 70 + 40 * (i - 1), 300 - 300 / 2, number, 'top', isStarField, dicesImage, ctx))
            } else if (i == 10) {
                this.fields.push(new CornerField(number, true, false, isStarField, dicesImage, ctx))
            } else if (i < 15) {
                this.fields.push(new SimpleField(600 + 500 / 2 - 70, 300 - 300 / 2 + 70 + 40 * (i - 11), number, 'right', isStarField, dicesImage, ctx))
            } else if (i == 15) {
                this.fields.push(new CornerField(number, false, false, isStarField, dicesImage, ctx))
            } else if (i < 25) {
                this.fields.push(new SimpleField(600 + 500 / 2 - 70 - 40 * (i - 16 + 1), 300 + (300 / 2) - 70, number, 'bottom', isStarField, dicesImage, ctx))
            } else if (i == 25) {
                this.fields.push(new CornerField(number, false, true, isStarField, dicesImage, ctx))
            } else {
                this.fields.push(new SimpleField(600 - 500 / 2, 300 + 300 / 2 - 70 - 40 * (i - 26 + 1), number, 'left', isStarField, dicesImage, ctx))
            }
        }

        this.ctx = ctx
    }

    draw() {
        this.ctx.fillStyle = '#6cb2eb'
        this.ctx.strokeStyle = 'black'
        this.ctx.lineWidth = 3
        this.ctx.beginPath()
        this.ctx.rect(600 - 480 / 2, 300 - 180 / 2, 480, 180)
        this.ctx.fill()
        this.ctx.stroke()

        this.fields.forEach(f => f.draw())
    }

    setMovableFrom(targetIndex) {
        this.fields.forEach((f, index) => {
            if (index < targetIndex)
                f.isMovable = false
            else
                f.isMovable = true
        })
    }

    setDicePosition(dice) {
        this.fields.forEach((f, i) => {
            if (f.diceFace)
                f.dice = undefined
            
            if (i === dice.position)
                f.dice = dice.face
        })
    }
}

class Field {
    constructor(x, y, textX, textY, diceX, diceY, w, h, number, isStar, dicesImage, ctx) {
        this.x = x
        this.y = y
        this.w = w
        this.h = h
        this.textX = textX
        this.textY = textY
        this.diceX = diceX
        this.diceY = diceY
        this.number = number
        this.isStar = isStar
        this.isMovable = false
        this.dicesImage = dicesImage
        this.dice = undefined
        this.ctx = ctx
    }

    draw() {
        this.ctx.beginPath()
        this.ctx.rect(this.x, this.y, this.w, this.h)
        if (this.isMovable)
            if (this.isStar)
                this.ctx.fillStyle = '#bfaa08'
            else
                this.ctx.fillStyle = '#ffe100'
        else
            if (this.isStar)
                this.ctx.fillStyle = '#875c17'
            else
                this.ctx.fillStyle = '#d48300'
                
        this.ctx.fill()
        this.ctx.stroke()

        this.ctx.fillStyle = 'black'
        this.ctx.textBaseline = 'alphabetic'
        this.ctx.fillText(this.number, this.textX, this.textY)

        if (typeof this.dice === 'number')
            this.ctx.drawImage(this.$refs.dicesImage, this.dice * 200, 400, 200, 200, this.diceX, this.diceY, 32, 32)
    }
}

class CornerField extends Field {
    constructor(number, top, left, isStar, dicesImage, ctx) {
        ctx.font = '20px black Arial'
        const textWidth = ctx.measureText(number).width

        let x, y, w, h, textX, textY, diceX, diceY

        if (top) {
            y = 300 - 300 / 2
            textY = y + 70 - 10
            diceY = y + 4
        } else {
            y = 300 + 300 / 2 - 70
            textY = y + 20 + 5
            diceY = y + 70 - 30 - 5
        }

        if (left) {
            x = 600 - 500 / 2
            textX = x + 70 - 15 - (textWidth / 2)
            diceX = x + 4
        } else {
            x = 600 + 500 / 2 - 70
            textX = x + 15 - (textWidth / 2)
            diceX = x + 70 - 30 - 5
        }

        w = 70
        h = 70

        super(x, y, textX, textY, diceX, diceY, w, h, number, isStar, dicesImage, ctx)
    }
}

class SimpleField extends Field {
    constructor(x, y, number, position, isStar, dicesImage, ctx) {
        ctx.font = '20px black Arial'
        const textWidth = ctx.measureText(number).width

        let w, h, textX, textY, diceX, diceY

        switch(position) {
            case 'top':
                w = 40
                h = 70
                textX = x + 40 / 2 - textWidth / 2
                textY = y + 70 - 10
                diceX = x + 5
                diceY = y + 4
                break

            case 'bottom':
                w = 40
                h = 70
                textX = x + 40 / 2 - textWidth / 2
                textY = y + 20 + 4
                diceX = x + 5
                diceY = y + 70 - 30 - 4
                break

            case 'left':
                w = 70
                h = 40
                textX = x + 70 - 15 - (textWidth / 2)
                textY = y + (40 + 20) / 2
                diceX = x + 4
                diceY = y + 5
                break

            case 'right':
                w = 70
                h = 40
                textX = x + 15 - (textWidth / 2)
                textY = y + (40 + 20) / 2
                diceX = x + 70 - 30 - 4
                diceY = y + 5
                break
        }

        super(x, y, textX, textY, diceX, diceY, w, h, number, isStar, dicesImage, ctx)
    }
}

function game() {
    return {
        gameState: '',
        board: false,
        players: [],
        game: {},
        player: {
            dices: []
        },
        authenticated: false,
        rejoin: false,
        dice: {},
        targetDice: this.dice,
        showMoveOptions: true,
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

                this.drawCanvas()
            })
            this.socket.on('playerinfo', data => {
                console.log(`game.playerinfo`)
                this.player = data
            })
            this.socket.on('diceposition', data => {
                console.log(`game.diceposition`)
                this.dice = data
                this.targetDice = data

                this.board.setDicePosition(dice)
                this.board.draw()
            })

            if (this.rejoin) {
                console.log('game.rejoin')
                this.authSocketIO()
            } else {
                this.gameState = 'set-username'
            }

            this.board = new Board(this.$refs.dicesImage, this.$refs.gameCanvas.getContext('2d'))
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
        },
        draw2Players(ctx) {
            this.drawPlayer(this.players[1], ctx, 600, 300 - 200)
        },
        draw3Players(ctx) {
            this.drawPlayer(this.players[1], ctx, 600 - 400, 300)
            this.drawPlayer(this.players[2], ctx, 600 + 400, 300)
        },
        draw4Players(ctx) {
            this.drawPlayer(this.players[1], ctx, 600 - 400, 300)
            this.drawPlayer(this.players[2], ctx, 600, 300 - 200)
            this.drawPlayer(this.players[3], ctx, 600 + 400, 300)
        },
        draw5Players(ctx) {
            this.drawPlayer(this.players[1], ctx, 600 - 400, 300 + 75)
            this.drawPlayer(this.players[2], ctx, 600 - 400, 300 - 75)
            this.drawPlayer(this.players[3], ctx, 600 + 400, 300 - 75)
            this.drawPlayer(this.players[4], ctx, 600 + 400, 300 + 75)
        },
        draw6Players(ctx) {
            this.drawPlayer(this.players[1], ctx, 600 - 400, 300 + 75)
            this.drawPlayer(this.players[2], ctx, 600 - 400, 300 - 75)
            this.drawPlayer(this.players[3], ctx, 600, 300 - 200)
            this.drawPlayer(this.players[4], ctx, 600 + 400, 300 - 75)
            this.drawPlayer(this.players[5], ctx, 600 + 400, 300 + 75)
        },
        drawCanvas() {
            const canvas = this.$refs.gameCanvas
            const ctx = canvas.getContext('2d')

            ctx.clearRect(0, 0, canvas.width, canvas.height)

            this.drawPlayer(this.players[0], ctx, 600, 300 + 220)

            switch(this.players.length) {
                case 2:
                    this.draw2Players(ctx)
                    break
                case 3:
                    this.draw3Players(ctx)
                    break
                case 4:
                    this.draw4Players(ctx)
                    break
                case 5:
                    this.draw5Players(ctx)
                    break
                case 6:
                    this.draw6Players(ctx)
                    break
            }

            this.board.draw(ctx)
        },
        isIngame() {
            return this.gameState === 'ingame' || this.gameState === 'atturn'
        }
    }
}

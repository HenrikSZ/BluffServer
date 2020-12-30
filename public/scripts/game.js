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

    }

    draw(ctx) {
        ctx.fillStyle = '#6cb2eb'
        ctx.strokeStyle = 'black'
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.rect(600 - 480 / 2, 300 - 180 / 2, 480, 180)
        ctx.fill()
        ctx.stroke()

        this.fields.forEach(f => f.draw(ctx))
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
    constructor(x, y, textX, textY, diceX, diceY, w, h, number, isStar, dicesImage) {
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
    }

    draw(ctx) {
        ctx.beginPath()
        ctx.rect(this.x, this.y, this.w, this.h)
        if (this.isMovable)
            if (this.isStar)
                ctx.fillStyle = '#bfaa08'
            else
                ctx.fillStyle = '#ffe100'
        else
            if (this.isStar)
                ctx.fillStyle = '#875c17'
            else
                ctx.fillStyle = '#d48300'
                
        ctx.fill()
        ctx.stroke()

        ctx.fillStyle = 'black'
        ctx.textBaseline = 'alphabetic'
        ctx.fillText(this.number, this.textX, this.textY)

        if (typeof this.dice === 'number')
            ctx.drawImage(this.dicesImage, this.dice * 200, 400, 200, 200, this.diceX, this.diceY, 32, 32)
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

        super(x, y, textX, textY, diceX, diceY, w, h, number, isStar, dicesImage)
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

        super(x, y, textX, textY, diceX, diceY, w, h, number, isStar, dicesImage)
    }
}

class Player {
    constructor(playerData, x, y, dicesImage, ctx) {
        this.playerData = playerData
        this.x = x
        this.y = y

        this.dicesImage = dicesImage

        this.currentTurnTextX = x - ctx.measureText('current turn').width / 2
        this.nameX = x - ctx.measureText(playerData.username).width / 2
    }

    drawName(ctx) {
        ctx.font = '20px sans-serif'
        ctx.fillStyle = 'black'
        ctx.textBaseline = 'top'
        ctx.fillText(this.playerData.username, this.nameX, this.y - 55)
    }

    drawDices(ctx) {
        const spacing = 50 / 10

        const totalWidth = this.playerData.dices.length * 50 + (this.playerData.dices.length - 1) * spacing

        this.playerData.dices.forEach((d, index) => {
            ctx.drawImage(this.dicesImage, d * 200, d.highlighted ? 200 : 0, 200, 200, this.x - totalWidth / 2 + (50 + spacing) * index, this.y - 30, 50, 50)
        })
    }

    drawAtTurn(ctx) {
        const rectX = this.x - 200 / 2

        ctx.fillStyle = '#bde7f0'
        ctx.fillRect(rectX, this.y + 25, 200, 30)

        ctx.strokeStyle = '#0720b0'
        ctx.strokeRect(rectX, this.y + 25, 200, 30)

        ctx.fillStyle = '#0720b0'
        ctx.textBaseline = 'middle'
        ctx.fillText('current turn', this.currentTurnTextX, this.y + 25 + 15)
    }

    draw(ctx) {
        this.drawName(ctx)
        this.drawDices(ctx)
        if (this.playerData.atTurn) {
            this.drawAtTurn(ctx)
        }
    }
}

class GameCanvas {
    constructor(canvas, dicesImage, players) {
        this.canvas = canvas
        this.ctx = canvas.getContext('2d')
        this.board = new Board(dicesImage, this.ctx)

        this.players = []
        
        this.players.push(new Player(players[0], 600, 300 + 220, dicesImage, this.ctx))

        switch(players.length) {
            case 2:
                this.create2Players(players, dicesImage, ctx)
                break
            case 3:
                this.create3Players(players, dicesImage, ctx)
                break
            case 4:
                this.create4Players(players, dicesImage, ctx)
                break
            case 5:
                this.create5Players(players, dicesImage, ctx)
                break
            case 6:
                this.create6Players(players, dicesImage, ctx)
                break
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

        this.players.forEach(p => p.draw(this.ctx))
        this.board.draw(this.ctx)
    }

    create2Players(players, dicesImage, ctx) {
        this.players.push(new Player(players[1], 600, 300 - 200, dicesImage, ctx))
    }

    create3Players(players, dicesImage, ctx) {
        this.players.push(new Player(players[1], 600 - 400, 300, dicesImage, ctx))
        this.players.push(new Player(players[2], 600 + 400, 300, dicesImage, ctx))
    }

    create4Players(players, dicesImage, ctx) {
        this.players.push(new Player(players[1], 600 - 400, 300, dicesImage, ctx))
        this.players.push(new Player(players[2], 600, 300 - 200, dicesImage, ctx))
        this.players.push(new Player(players[3], 600 + 400, 300, dicesImage, ctx))
    }

    create5Players(players, dicesImage, ctx) {
        this.players.push(new Player(players[1], 600 - 400, 300 + 75, dicesImage, ctx))
        this.players.push(new Player(players[2], 600 - 400, 300 - 75, dicesImage, ctx))
        this.players.push(new Player(players[3], 600 + 400, 300 - 75, dicesImage, ctx))
        this.players.push(new Player(players[4], 600 + 400, 300 + 75, dicesImage, ctx))
    }

    create6Players(players, dicesImage, ctx) {
        this.players.push(new Player(players[1], 600 - 400, 300 + 75, dicesImage, ctx))
        this.players.push(new Player(players[2], 600 - 400, 300 - 75, dicesImage, ctx))
        this.players.push(new Player(players[3], 600, 300 - 200, dicesImage, ctx))
        this.players.push(new Player(players[4], 600 + 400, 300 - 75, dicesImage, ctx))
        this.players.push(new Player(players[5], 600 + 400, 300 + 75, dicesImage, ctx))
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

                this.gameCanvas = new GameCanvas(this.$refs.gameCanvas, this.$refs.dicesImage, data)
                this.gameCanvas.draw()
            })
            this.socket.on('playerinfo', data => {
                console.log(`game.playerinfo`)
                this.player = data
            })
            this.socket.on('diceposition', data => {
                console.log(`game.diceposition`)
                this.dice = data
                this.targetDice = data

                this.gameCanvas.board.setDicePosition(data)
                if (this.players[0].atTurn)
                    this.gameCanvas.board.setMovableFrom(data.position)
                this.gameCanvas.draw()
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
        isIngame() {
            return this.gameState === 'ingame' || this.gameState === 'atturn'
        }
    }
}

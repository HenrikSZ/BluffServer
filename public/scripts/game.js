function getCookieValue(cookieKey) {
    let regex = new RegExp('^.*;?\s*' + cookieKey + 's*=\s*([^;]+).*?$', 'gi')
    let regexResult = regex.exec(document.cookie)
    return regexResult ? regexResult[1] : null
}

function setCookieValue(key, value, maxAge) {
    document.cookie = `${key}=${value}; max-age=${maxAge}`
}

class Button {
    constructor(x, y, text, ctx) {
        this.isVisible = false
        
        const textWidth = ctx.measureText(text).width

        this.x = x
        this.y = y
        this.textX = x + (200 - textWidth) / 2
        this.text = text
    }

    draw(ctx) {
        if (this.isVisible) {
            ctx.beginPath()
            ctx.rect(this.x, this.y, 200, 30)
            
            ctx.fillStyle = 'red'
            ctx.strokeStyle = 'white'

            ctx.fill()
            ctx.stroke()

            ctx.font = '20px Arial'

            ctx.fillStyle = 'white'
            ctx.fillText(this.text, this.textX, this.y + 20 + 2)
        }
    }

    onClick(x, y) {
        if (this.isVisible && x >= this.x && x < this.x + 200 && y >= this.y && y < this.y + 30) {
            return true
        }

        return false
    }
}

class NextRoundButton extends Button {
    constructor(x, y, board, ctx) {
        super(x, y, 'Nächste Runde', ctx)

        this.board = board
    }

    onClick(x, y) {
        if (super.onClick(x, y)) {
            console.log('next round')
            this.board.gameCanvas.nextRound()
            return true
        }

        return false
    }

    onRefute(data) {
        this.isVisible = data.ownTurn
    }

    onNextRound() {
        this.isVisible = false
    }
}

class LieButton extends Button {
    constructor(x, y, board, ctx) {
        super(x, y, 'Aufdecken', ctx)

        this.board = board
    }

    onClick(x, y) {
        if (super.onClick(x, y)) {
            this.board.gameCanvas.refute()
            return true
        }

        return false
    }

    onRefute() {
        this.isVisible = false
    }

    onNextRound() {
        this.isVisible = false
    }

    onNextTurn(data) {
        this.isVisible = data.ownTurn && data.dice.face > 0
    }
}

class ComparisonGraphic {
    constructor(x, y, dicesImage, board, ctx) {        
        //const textWidth = ctx.measureText('Aufdecken').width

        this.x = x
        this.y = y

        this.dicesImage = dicesImage

        this.board = board
        this.nextRoundButton = new NextRoundButton(x - 200 / 2, y + 40, board, ctx)
        this.isVisible = false
    }

    set isVisible(isVisible) {
        this.isVisibleAcc = isVisible
        if (!isVisible || this.board.gameCanvas.thisPlayer.playerData.atTurn)
            this.nextRoundButton.isVisible = isVisible
    }

    get isVisible() {
        return this.isVisibleAcc
    }

    draw(ctx) {
        if (this.isVisible) {
            ctx.font = '20px Arial'

            ctx.fillStyle = 'black'
            ctx.fillText(this.comparisonData.actual + 'x', this.x - 50 - 20 - 10 - ctx.measureText(this.comparisonData.actual + 'x').width, this.y + 20 / 2)
            ctx.drawImage(this.dicesImage, 200 * this.comparisonData.dice.face, 0, 200, 200, this.x - 50 - 20, this.y - 50 / 2, 50, 50)

            let comp

            if (this.comparisonData.actual == this.comparisonData.target) {
                comp = '='
            } else if (this.comparisonData.actual < this.comparisonData.target) {
                comp = '<'
            } else {
                comp = '>'
            }

            ctx.fillText(comp, this.x - ctx.measureText(comp).width / 2, this.y + 20 / 2)

            ctx.fillText(this.comparisonData.target + 'x', this.x + 20 + 20 - ctx.measureText(this.comparisonData.target + 'x').width, this.y + 20 / 2)
            ctx.drawImage(this.dicesImage, 200 * this.comparisonData.dice.face, 0, 200, 200, this.x + 20 + 10 + 20, this.y - 50 / 2, 50, 50)

            this.nextRoundButton.draw(ctx)
        }
    }

    onRefute(data) {
        this.isVisible = true
        this.comparisonData = data.comparisonData

        this.nextRoundButton.onRefute(data)
    }

    onNextRound() {
        this.isVisible = false
    }

    onClick(x, y) {
        if (this.nextRoundButton.onClick(x, y)) {
            return true
        }

        return false
    }
}

class ChooseBubble {
    constructor(dicesImage, bubbleImage, board) {
        this.bubbleImage = bubbleImage
        this.dicesImage = dicesImage

        this.isVisible = false
        this.allowOnlyStarOption = false
        this.allowFrom = 1
        this.x = 0
        this.y = 0

        this.board = board
    }

    draw(ctx) {
        if (this.isVisible) {
            ctx.drawImage(this.bubbleImage, this.x, this.y)
            for (let i = 1; i <= 6; i++) {
                if (i < this.allowFrom || this.allowOnlyStarOption && i < 6 || !this.allowOnlyStarOption && i == 6) {
                    ctx.globalAlpha = 0.1
                }
                ctx.drawImage(this.dicesImage, 200 * i, 400, 200, 200, this.x + 10 + (50 + 10) * (i - 1), this.y + 10, 50, 50)

                ctx.globalAlpha = 1.0
            }
        }
    }

    setForTarget(x, y) {
        this.x = x - 370 / 2
        this.y = y - 100
    }

    onClick(x, y) {
        if (this.isVisible && x >= this.x + 10 && x < this.x + 6 * (50 + 10) && y >= this.y + 10 && y < this.y + 10 + 50) {
            x = x - this.x - 10
            
            let delta = x % 60
            if (delta <= 50) {
                let v = (x - delta) / 60 + 1

                if (this.allowOnlyStarOption) {
                    if (v == 6) {
                        this.board.setDiceFaceForSelected(v)
                        this.isVisible = false
                    }
                } else {
                    if (v >= this.allowFrom && v != 6) {
                        this.board.setDiceFaceForSelected(v)
                        this.isVisible = false
                    }
                }
            }
            return true

        } else {
            this.isVisible = false
            this.board.setDiceFaceForSelected(-1)

            return false
        }
    }
}

class Board {
    constructor(dicesImage, bubbleImage, gameCanvas, ctx) {
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

        this.chooseBubble = new ChooseBubble(dicesImage, bubbleImage, this)
        this.lieButton = new LieButton(600 - 200 / 2, 300 - 30 / 2, this, ctx)
        this.comparisonGraphic = new ComparisonGraphic(600, 300, dicesImage, this, ctx)
        this.selectedField = -1
        this.gameCanvas = gameCanvas
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
        this.lieButton.draw(ctx)
        this.comparisonGraphic.draw(ctx)
        this.chooseBubble.draw(ctx)
    }

    set movableFrom(targetIndex) {
        this.fields.forEach((f, index) => {
            if (index < targetIndex)
                f.isMovable = false
            else
                f.isMovable = true
        })
    }

    set dice(dice) {
        if (typeof this.diceAcc === 'object') {
            this.fields[this.diceAcc.position].dice = null
        }
        
        this.fields[dice.position].dice = dice.face
        this.diceAcc = dice
    }

    get dice() {
        return this.diceAcc
    }

    set selectedField(selectedField) {
        if (typeof this.selectedFieldAcc === 'number' && this.selectedFieldAcc >= 0 && this.selectedFieldAcc < 30) {
            this.fields[this.selectedFieldAcc].isSelected = false
        }
        if (typeof selectedField === 'number' && selectedField >= 0 && selectedField < 30) {
            this.fields[selectedField].isSelected = true
        }
        
        this.selectedFieldAcc = selectedField
    }

    get selectedField() {
        return this.selectedFieldAcc
    }

    setDiceFaceForSelected(diceFace) {
        if (diceFace >= 1) {
            let dice = { position: this.selectedField, face: diceFace }
            this.gameCanvas.sendMove(dice)
        }
        
        this.selectedField = null
    }

    onRefute(data) {
        this.movableFrom = 30

        this.lieButton.onRefute(data)
        this.comparisonGraphic.onRefute(data)
    }

    onNextRound() {
        this.lieButton.onNextRound()
        this.comparisonGraphic.onNextRound()
    }

    onNextTurn(data) {
        if (data.ownTurn) {
            this.movableFrom = data.dice.position + (data.dice.face > 4 ? 1 : 0)
        } else {
            this.movableFrom = 30
        }

        this.dice = data.dice
        this.lieButton.onNextTurn(data)
    }

    onClick(x, y) {
        let ret = false

        if (this.comparisonGraphic.onClick(x, y)) {
            ret = true
        } else if (this.chooseBubble.onClick(x, y)) {
            ret = true
        } else if (x >= 600 - 500 / 2 && x <= 600 + 500 / 2 && y >= 300 - 300 / 2 && y <= 300 + 300 / 2) {
            if (this.lieButton.onClick(x, y)) {
                ret = true
            } else {
                this.fields.forEach((f, i) => {
                    if (f.onClick(x, y)) {
                        this.selectedField = i
                        ret = true
                    }
                })
    
                if (ret) {
                    this.chooseBubble.setForTarget(x, y)
                    this.chooseBubble.allowOnlyStarOption = this.fields[this.selectedField].isStar
                    if (this.selectedField == this.dice.position) {
                        this.chooseBubble.allowFrom = this.dice.face + 1
                    } else {
                        this.chooseBubble.allowFrom = 1
                    }
                    this.chooseBubble.isVisible = true
                }
            }
        }
        
        return ret
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
        this.dice = null
        this.isSelected = false
    }

    draw(ctx) {
        ctx.beginPath()
        ctx.rect(this.x, this.y, this.w, this.h)
        if (this.isMovable)
            if (this.isSelected)
                ctx.fillStyle = '#d62b04'
            else if (this.isStar)
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

    onClick(x, y) {
        let ret = false

        if (x >= this.x && x < this.x + this.w && y >= this.y && y < this.y + this.h) {
            if (!this.isSelected) {
                if (this.isMovable) {
                    this.isSelected = true
                    ret = true
                }
            }
        } else {
            if (this.isSelected) {
                this.isSelected = false
                ret = true
            }
        }

        return ret
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
            const highlighted = typeof this.comparisonData === 'object' && this.comparisonData.dice.face == d
            ctx.drawImage(this.dicesImage, d * 200, highlighted ? 200 : 0, 200, 200, this.x - totalWidth / 2 + (50 + spacing) * index, this.y - 30, 50, 50)
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
    constructor(canvas, dicesImage, bubbleImage, socket, players) {
        this.canvas = canvas
        this.ctx = canvas.getContext('2d')
        this.board = new Board(dicesImage, bubbleImage, this, this.ctx)
        this.dicesImage = dicesImage
        this.bubbleImage = bubbleImage
        this.socket = socket

        this.canvas.addEventListener('click', this.onClick.bind(this))

        this.players = players
    }

    get thisPlayer() {
        return this.players[0]
    }

    get players() {
        return this.playersAcc
    }

    set players(players) {
        this.playersAcc = []

        this.players.push(new Player(players[0], 600, 300 + 220, this.dicesImage, this.ctx))

        switch(players.length) {
            case 2:
                this.create2Players(players)
                break
            case 3:
                this.create3Players(players)
                break
            case 4:
                this.create4Players(players)
                break
            case 5:
                this.create5Players(players)
                break
            case 6:
                this.create6Players(players)
                break
        }

        players.forEach((p, i) => {
            if (p.atTurn) this.currentTurnIndex = i
        })
    }

    set currentTurnIndex(currentTurnIndex) {
        if (typeof this.currentTurnIndex === 'number')
            this.players[this.currentTurnIndex].playerData.atTurn = false

        this.currentTurnIndexAcc = currentTurnIndex

        if (typeof this.currentTurnIndex === 'number')
            this.players[this.currentTurnIndex].playerData.atTurn = true
    }

    get currentTurnIndex() {
        return this.currentTurnIndexAcc
    }

    onRefute(data) {
        data.ownTurn = this.thisPlayer.playerData.atTurn
        this.currentTurnIndex = null

        this.board.onRefute(data)
        
        this.players.forEach((p, i) => {
            p.playerData.dices = data.dices[i]
            p.comparisonData = data.comparisonData
        })
    }

    onNextRound() {
        this.board.onNextRound()

        this.players.forEach(p => {
            p.comparisonData = undefined
        })
    }

    onNextTurn(data) {
        this.currentTurnIndex = data.currentTurnIndex
        data.ownTurn = !!this.thisPlayer.playerData.atTurn

        this.board.onNextTurn(data)
    }

    refute() {
        this.socket.emit('refute')
    }

    nextRound() {
        this.socket.emit('nextround')
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

        this.players.forEach(p => p.draw(this.ctx))
        this.board.draw(this.ctx)
    }

    create2Players(players) {
        this.players.push(new Player(players[1], 600, 300 - 200, this.dicesImage, this.ctx))
    }

    create3Players(players) {
        this.players.push(new Player(players[1], 600 - 400, 300, this.dicesImage, this.ctx))
        this.players.push(new Player(players[2], 600 + 400, 300, this.dicesImage, this.ctx))
    }

    create4Players(players) {
        this.players.push(new Player(players[1], 600 - 400, 300, this.dicesImage, this.ctx))
        this.players.push(new Player(players[2], 600, 300 - 200, this.dicesImage, this.ctx))
        this.players.push(new Player(players[3], 600 + 400, 300, this.dicesImage, this.ctx))
    }

    create5Players(players) {
        this.players.push(new Player(players[1], 600 - 400, 300 + 75, this.dicesImage, this.ctx))
        this.players.push(new Player(players[2], 600 - 400, 300 - 75, this.dicesImage, this.ctx))
        this.players.push(new Player(players[3], 600 + 400, 300 - 75, this.dicesImage, this.ctx))
        this.players.push(new Player(players[4], 600 + 400, 300 + 75, this.dicesImage, this.ctx))
    }

    create6Players(players) {
        this.players.push(new Player(players[1], 600 - 400, 300 + 75, this.dicesImage, this.ctx))
        this.players.push(new Player(players[2], 600 - 400, 300 - 75, this.dicesImage, this.ctx))
        this.players.push(new Player(players[3], 600, 300 - 200, this.dicesImage, this.ctx))
        this.players.push(new Player(players[4], 600 + 400, 300 - 75, this.dicesImage, this.ctx))
        this.players.push(new Player(players[5], 600 + 400, 300 + 75, this.dicesImage, this.ctx))
    }

    onClick(event) {
        let rect = this.canvas.getBoundingClientRect()
        let x = event.clientX - rect.left
        let y = event.clientY - rect.top

        this.board.onClick(x, y)
        this.draw()
    }

    sendMove(dice) {
        this.socket.emit('move', dice)
    }
}


function game() {
    return {
        gameState: '',
        game: {},
        player: {},
        authenticated: false,
        rejoin: false,
        players: [],
        connectSocketIO() {
            this.socket = io()

            this.socket.on('statechange', data => {
                console.log(`game.statechange[${data}]`)
                this.gameState = data

                //this.gameCanvas.onStateChange(data)
            })
            this.socket.on('gameinfo', data => {
                console.log(`game.gameinfo`)
                this.game = data
            })
            this.socket.on('playerlist', data => {
                console.log(`game.playerlist`)

                this.players = data

                if (!this.gameCanvas) {
                    this.gameCanvas = new GameCanvas(this.$refs.gameCanvas, this.$refs.dicesImage, this.$refs.bubbleImage, this.socket, data)
                } else {
                    this.gameCanvas.players = data
                }
                
                this.gameCanvas.draw()
            })
            this.socket.on('playerinfo', data => {
                console.log(`game.playerinfo`)
                this.player = data
            })
            this.socket.on('nextturn', data => {
                console.log(`game.gamestate`)

                this.gameCanvas.onNextTurn(data)
                this.gameCanvas.draw()
            })
            this.socket.on('refute', data => {
                console.log('game.refute')

                this.gameCanvas.onRefute(data)
                this.gameCanvas.draw()
            })
            this.socket.on('nextround', data => {
                console.log('game.nextround')

                this.gameCanvas.onNextRound()
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
            return this.gameState === 'ingame' || this.gameState === 'atturn' || this.gameState === 'refute'
        }
    }
}

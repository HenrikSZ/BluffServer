const express = require('express')
const socketio = require('socket.io')
const http = require('http')
const cookieParser = require('cookie-parser')
const path = require('path')
const asyncMysql = require('./dbConnection.js')

const GameManager = require('./models/GameManager.js')
const PlayerManager = require('./models/PlayerManager.js')

const GameController = require('./controllers/GameController.js')

const app = express()
const port = 3000

let gameManager, playerManager

app.set('view engine', 'pug')
app.use(express.json())
app.use(cookieParser())

app.use((req, res, next) => {
    req.player = playerManager.getFromToken(req.cookies.token)
    if (req.body.username) {
        req.player.updateUsername(username)
    }
    next()
})

app.get('/', (req, res) => {
    res.render('game', { player: req.player })
})

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '/public' + req.originalUrl))
})

const server = http.createServer(app)
const io = socketio(server)

server.listen(port, async () => {
    playerManager = await PlayerManager.createAndLoadPlayers(asyncMysql)
    gameManager = GameManager.create()
    const gameController = new GameController(io, asyncMysql, gameManager, playerManager)

    io.on('connection', socket => {
        socket.on('create', data => {
            gameController.handleCreate(socket, data)
        })
        socket.on('start', data => {
            gameController.handleStart(socket, data)
        })

        socket.on('auth', async data => {
            try {
                await gameController.handleAuth(socket, data)
                socket.emit('auth-response')
            } catch (e) {
                console.log(e)
                socket.emit('auth-response', { error: 'Auth unsuccessful' })
            }
        })
        socket.on('join', data => {
            gameController.handleJoin(socket, data)
        })
        socket.on('leave', data => {
            gameController.handleLeave(socket, data)
        })
        socket.on('move', data => {
            gameController.handleMove(socket, data)
        })
        socket.on('refute', data => {
            gameController.handleRefute(socket, data)
        })
    })
    console.log(`sys.list.port[${port}]`)
})

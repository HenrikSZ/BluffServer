const express = require('express')
const socketio = require('socket.io')
const http = require('http')
const cookieParser = require('cookie-parser')
const path = require('path')
const asyncMysql = require('./dbConnection.js')

const GameManager = require('./models/GameManager.js')
const PlayerManager = require('./models/PlayerManager.js')

const PlayerJoinController = require('./controllers/PlayerJoinController.js')
const PlayerLeaveController = require('./controllers/PlayerLeaveController.js')
const PlayerMoveController = require('./controllers/PlayerMoveController.js')
const PlayerAuthController = require('./controllers/PlayerAuthController.js')
const GameCreationController = require('./controllers/GameCreationController.js')

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
    res.render('login', { player: req.player })
})

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '/public' + req.originalUrl))
})

const server = http.createServer(app)
const io = socketio(server)

io.on('connection', socket => {
    socket.on('auth', async data => {
        await PlayerAuthController.handle(socket, data, playerManager, asyncMysql)
    })
    socket.on('game-join', data => {
        PlayerJoinController.handle(socket, data)
    })
    socket.on('game-create', data => {
        GameCreationController.handle(socket, data, io, gameManager)
    })
    socket.on('game-leave', data => {
        PlayerLeaveController.handle(socket, data)
    })
    socket.on('player-move', data => {
        PlayerMoveController.handle(socket, data)
    })
})

server.listen(port, async () => {
    playerManager = await PlayerManager.createAndLoadPlayers(asyncMysql)
    gameManager = GameManager.create()
    console.log(`sys.list.port[${port}]`)
})

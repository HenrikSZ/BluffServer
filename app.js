const express = require('express')
const socketio = require('socket.io')
const http = require('http')
const cookieParser = require('cookie-parser')
const path = require('path')
const asyncMysql = require('./dbConnection.js')

const GameManager = require('./gameManager.js')
const PlayerManager = require('./playerManager.js')

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

/*
app.post('/player/create', async (req, res) => {
    await Player.createNew(req, res, asyncMysql)
    res.send({ status: 0 })
})

app.use('/game', (req, res, next) => {
    if (!req.player) {
        res.redirect('/')
    } else {
        next()
    }
})

app.post('/game/join', (req, res) => {
    req.player.join(Game.getFromInviteCode(req.body.inviteCode))
    res.send({
        goto: '/game'
    })
})
app.post('/game/create', (req, res) => {
    req.player.join(Game.createNew())
    res.send({
        goto: '/game'
    })
})
app.post('/game/leave', (req, res) => {
    req.player.leave(asyncMysql)
    res.send({
        goto: '/'
    })
})

app.get('/game', (req, res) => {
    if (req.player && req.player.game) {
        res.render('game', { player: req.player })
    } else {
        res.redirect('/')
    }
})*/

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

const express = require('express')
const socketio = require('socket.io')
const http = require('http')
const cookieParser = require('cookie-parser')
const path = require('path')
const asyncMysql = require('./dbConnection.js')

const Player = require('./player.js')
const Game = require('./game.js')

const app = express()
const port = 3000

app.set('view engine', 'pug')
app.use(express.json())
app.use(cookieParser())

app.use(async (req, res, next) => {
    if (req.cookies.token) {
        req.player = await Player.createFromExisting(req, asyncMysql)
    }
    next()
})

app.post('/player/create', async (req, res) => {
    await Player.createNew(req, res, asyncMysql)
    res.send({ status: 0 })
})

app.post('/game/join', async (req, res) => {
    await req.player.join(await Game.createFromExisting(req, asyncMysql), asyncMysql)
    res.send({
        goto: '/game'
    })
})
app.post('/game/create', async (req, res) => {
    await req.player.join(await Game.createNew(asyncMysql), asyncMysql)
    res.send({
        goto: '/game'
    })
})
app.post('/game/leave', async (req, res) => {
    await req.player.leave(asyncMysql)
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
})

app.get('/', (req, res) => {
    if (req.player) {
        if (req.player.game) {
            res.redirect('/game')
        } else {
            res.render('login', { player: req.player })
        }
    } else {
        res.render('login')
    }
})

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '/public' + req.originalUrl))
})

const server = http.createServer(app)
const io = socketio(server)

io.on('connection', (socket) => {
    console.log('a user connected')
    socket.emit('event', 'Hello, world!')
})

server.listen(port, () => {
    console.log(`sys.list.port[${port}]`)
})

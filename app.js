const express = require('express')
const socketio = require('socket.io')
const http = require('http')
const cookieParser = require('cookie-parser')
const path = require('path')
const mysql = require('mysql')
const promisify = require('util').promisify

const config = require('dotenv').config()

if (config.error) {
    throw new Error(config.error)
}

const GameManager = require('./models/GameManager.js')
const PlayerManager = require('./models/PlayerManager.js')

const GameController = require('./controllers/GameController.js')

const dbConnection = mysql.createConnection({
    host: config.parsed.DB_HOST,
    user: config.parsed.DB_USER,
    password: config.parsed.DB_PASS,
    database: config.parsed.DB_NAME
})

const asyncQuery = promisify(dbConnection.query).bind(dbConnection)
const escape = dbConnection.escape.bind(dbConnection)

const asyncMysql = {
    query: asyncQuery,
    escape: escape
 }

const port = config.parsed.PORT

function callControllerFunction(func, socket, data) {
    try {
        func(socket, data)
    } catch (e) {
        console.log(e)

        const errorPacket = {
            name: e.name,
            message: e.message
        }
        
        socket.emit('error', errorPacket)
    }
}


function setupRoutes(app, gameController) {
    app.set('view engine', 'pug')
    app.use(express.json())
    app.use(cookieParser())

    app.use((req, res, next) => {
        req.player = gameController.playerManager.getFromToken(req.cookies.token)
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

}

function setupSocketIO(io, gameController) {
    io.on('connection', socket => {
        socket.on('create', data => {
            console.log('game.create')
            callControllerFunction(gameController.handleCreate.bind(gameController), socket, data)
        })
        socket.on('start', data => {
            console.log('game.start')
            callControllerFunction(gameController.handleStart.bind(gameController), socket, data)
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
            console.log('game.join')
            callControllerFunction(gameController.handleJoin.bind(gameController), socket, data)
        })
        socket.on('leave', data => {
            console.log('game.leave')
            callControllerFunction(gameController.handleLeave.bind(gameController), socket, data)
        })
        socket.on('move', data => {
            console.log('game.move')
            callControllerFunction(gameController.handleMove.bind(gameController), socket, data)
        })
        socket.on('refute', data => {
            console.log('game.refute')
            callControllerFunction(gameController.handleRefute.bind(gameController), socket, data)
        })
        socket.on('nextround', data => {
            console.log('game.nextround')
            callControllerFunction(gameController.handleNextRound.bind(gameController), socket, data)
        })
        socket.on('nextgame', data => {
            console.log('game.nextgame')
            callControllerFunction(gameController.handleNextGame.bind(gameController), socket, data)
        })
        socket.on('disconnect', data => {
            console.log('game.disconnect')
            callControllerFunction(gameController.handleDisconnect.bind(gameController), socket, data)
        })
    })
}

PlayerManager.createAndLoadPlayers(asyncMysql)
.then((playerManager) => {

    const app = express()
    const server = http.createServer(app)
    const io = socketio(server)

    const gameManager = GameManager.create()
    const gameController = new GameController(io, asyncMysql, gameManager, playerManager)

    setupRoutes(app, gameController)
    setupSocketIO(io, gameController)
    
    server.listen(port, () => {
        console.log(`sys.list.port[${port}]`)
    })
})

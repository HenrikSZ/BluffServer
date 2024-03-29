const express = require('express')
const socketio = require('socket.io')
const http = require('http')
const cookieParser = require('cookie-parser')
const path = require('path')
const promisify = require('util').promisify
const i18next = require('i18next')
const i18nMiddleware = require('i18next-http-middleware')
const backend = require('i18next-fs-backend')

const winston = require('winston')

const config = require('dotenv').config()

if (config.error) {
    throw new Error(config.error)
}

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    defaultMeta: { service: 'user-service' },
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ],
})

if (config.parsed.DEBUGGING) {
    logger.add(new winston.transports.Console({
        format: winston.format.simple(),
    }))
}

const GameManager = require('./models/GameManager.js')

const GameController = require('./controllers/GameController.js')
const PlayerManager = require('./models/PlayerManager.js')

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
    app.use(i18nMiddleware.handle(i18next, { removeLngFromUrl: false }))

    app.use((req, res, next) => {
        req.player = gameController.playerManager.getFromToken(req.cookies.token)
        if (req.body.username) {
            req.player.updateUsername(username)
        }
        next()
    })
    
    app.get('/', (req, res) => {
        console.log(req.languages)  
        res.render('game', { player: req.player })
    })
    
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '/public' + req.originalUrl))
    })

}

function setupSocketIO(io, gameController) {
    io.on('connection', socket => {
        socket.on('create', data => {
            callControllerFunction(gameController.handleCreate.bind(gameController), socket, data)
        })
        socket.on('start', data => {
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
            callControllerFunction(gameController.handleJoin.bind(gameController), socket, data)
        })
        socket.on('leave', data => {
            callControllerFunction(gameController.handleLeave.bind(gameController), socket, data)
        })
        socket.on('move', data => {
            callControllerFunction(gameController.handleMove.bind(gameController), socket, data)
        })
        socket.on('refute', data => {
            callControllerFunction(gameController.handleRefute.bind(gameController), socket, data)
        })
        socket.on('nextround', data => {
            callControllerFunction(gameController.handleNextRound.bind(gameController), socket, data)
        })
        socket.on('nextgame', data => {
            callControllerFunction(gameController.handleNextGame.bind(gameController), socket, data)
        })
        socket.on('disconnect', data => {
            callControllerFunction(gameController.handleDisconnect.bind(gameController), socket, data)
        })
    })
}

i18next
.use(i18nMiddleware.LanguageDetector)
.use(backend)
.init({
    preload: ['en', 'de', 'pt'],
    initImmediate: false,
    backend: {
        loadPath: './public/locales/{{lng}}.json'
    }
})

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const gameManager = new GameManager()
const playerManager = new PlayerManager()
const gameController = new GameController(io, gameManager, playerManager, logger)

setupRoutes(app, gameController)
setupSocketIO(io, gameController)

server.listen(port, () => {
    logger.info(`sys.listen.port[${port}]`)
})

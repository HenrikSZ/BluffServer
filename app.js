const promisify = require('util').promisify

const express = require('express')
const cookieParser = require('cookie-parser')
const mysql = require('mysql')
const path = require('path')

const Player = require('./player.js')

const app = express()
const port = 3000
const dbConnection = mysql.createConnection({
    host: 'localhost',
    user: 'bluffer',
    password: 'V5gM1pr97Iek4gHmmnJq',
    database: 'bluff'
})

const asyncQuery = promisify(dbConnection.query).bind(dbConnection)
const escape = dbConnection.escape.bind(dbConnection)

app.set('view engine', 'pug')
app.use(express.json())
app.use(cookieParser())

app.use(async (req, res, next) => {
    if (req.cookies.token) {
        req.player = await Player.createFromRequest(req, res, asyncQuery, escape)
    }
    next()
})

app.use('/player', async (req, res, next) => {
    req.player = await Player.createFromRequest(req, res, asyncQuery, escape)
    next()
})

app.post('/join', (req, res) => {
    // TODO action of joining to game
    res.send(JSON.stringify({ status: 0 }))
})
app.post('/create', (req, res) => {
    // TODO action of joining to game
    res.send(JSON.stringify({ status: 0 }))
})

app.get('/', (req, res) => {
    if (req.player) {
        res.render('login', { username: req.player.username })
    } else {
        res.render('login')
    }
})

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '/public' + req.originalUrl))
})

app.listen(port, () => {
    console.log(`sys.list.port[${port}]`)
})

const promisify = require('util').promisify
const mysql = require('mysql')

const dbConnection = mysql.createConnection({
    host: 'localhost',
    user: 'bluffer',
    password: 'V5gM1pr97Iek4gHmmnJq',
    database: 'bluff'
})

const asyncQuery = promisify(dbConnection.query).bind(dbConnection)
const escape = dbConnection.escape.bind(dbConnection)

const asyncConnection = {
    query: asyncQuery,
    escape: escape
 }

module.exports = asyncConnection

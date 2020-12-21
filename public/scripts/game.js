function handleJsonResponse(jsonResponse) {
    if (jsonResponse.goto) {
        window.location = jsonResponse.goto
    }
}

function getCookieValue(cookieKey) {
    let regex = new RegExp('^.*;?\s*' + cookieKey + 's*=\s*([^;]+).*?$', 'gi')
    //console.log(regex)
    //console.log(regex.exec(document.cookie)[1])
    return regex.exec(document.cookie)[1]
}

function game() {
    return {
        gameState: 'lobby',
        players: [],
        connectSocketIO() {
            this.socket = io()

            this.socket.on('playerList', (data) => {
                console.log('received player list')
                console.log(data)
                this.players = data
            })
            this.socket.on('connect', () => {
                this.socket.emit('token', getCookieValue('token'))
            })
        },
        leaveGame(next) {
            console.log(`Leaving game`)
            
            const xhttp = new XMLHttpRequest()
            xhttp.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200 ) {
                    handleJsonResponse(JSON.parse(this.responseText))
                    if (next)
                        next()
                }
            }
            xhttp.open('POST', '/game/leave')
            xhttp.setRequestHeader('Content-type', 'application/json')
            xhttp.send()
        }
    }
}
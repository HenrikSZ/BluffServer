function handleJsonResponse(jsonResponse) {
    if (jsonResponse.goto) {
        window.location = jsonResponse.goto
    }
}

function login() {
    return {
        showPage: 'set-username',
        username: '',
        gameId: '',
        createPlayer(next) {
            const xhttp = new XMLHttpRequest()
            xhttp.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200 ) {
                    handleJsonResponse(JSON.parse(this.responseText))
                    if (next)
                        next()
                }
            }
            xhttp.open('POST', '/player/create')
            xhttp.setRequestHeader('Content-type', 'application/json')
            xhttp.send(JSON.stringify({
                    username: this.username
                }
            ))
        },
        joinGame(next) {
            if (!document.cookie.match(/^(.*;)?\s*token\s*=\s*[^;]+(.*)?$/)) {
                this.createPlayer(this.joinGame)
            }

            console.log(`Joining game ${this.gameId} as ${this.username}`)
            
            const xhttp = new XMLHttpRequest()
            xhttp.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200 ) {
                    handleJsonResponse(JSON.parse(this.responseText))
                    if (next)
                        next()
                }
            }
            xhttp.open('POST', '/game/join')
            xhttp.setRequestHeader('Content-type', 'application/json')
            xhttp.send(JSON.stringify(
                {
                    gameId: this.gameId
                }
            ))
        },
        createGame(next) {
            if (!document.cookie.match(/^(.*;)?\s*token\s*=\s*[^;]+(.*)?$/)) {
                this.createPlayer(this.joinGame)
            }

            console.log(`Creating game as ${this.username}`)
            
            const xhttp = new XMLHttpRequest()
            xhttp.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200 ) {
                    handleJsonResponse(JSON.parse(this.responseText))
                    if (next)
                        next()
                }
            }
            xhttp.open('POST', '/game/create')
            xhttp.setRequestHeader('Content-type', 'application/json')
            xhttp.send()
        },
        loadGame() {
            window.location = '/game'
        }
    }
}

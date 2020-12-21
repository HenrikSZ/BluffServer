function handleJsonResponse(jsonResponse) {
    if (jsonResponse.goto) {
        window.location = jsonResponse.goto
    }
}

function game() {
    return {
        gameState: 'lobby',
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
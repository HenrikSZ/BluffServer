function login() {
    return {
        showPage: 'set-username',
        username: '',
        gameId: '',
        joinGame() {
            console.log(`Joining game ${this.gameId} as ${this.username}`)
            
            const xhttp = new XMLHttpRequest()
            xhttp.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200 ) {
                    console.log(this.responseText)
                }
            }
            xhttp.open('POST', '/player/join')
            xhttp.setRequestHeader('Content-type', 'application/json')
            xhttp.send(JSON.stringify(
                {
                    username: this.username,
                    gameId: this.gameId
                }
            ))
        },
        createGame() {
            console.log(`Creating game as ${this.username}`)
        }
    }
}

var express = require('express');
var http = require('http');
var WebSocket = require('ws');

const app = express();

//initialize a simple http server
const server = http.createServer(app);

//initialize the WebSocket server instance
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    ws.isAlive = true;
    ws.on('pong', () => {
        ws.isAlive = true;
    });

    //connection is up, let's add a simple simple event
    ws.on('message', (message) => {

        //log the received message and send it back to the client
        console.log('received: %s', message);
        const broadcastRegex = /^broadcast\:/;

        if (broadcastRegex.test(message)) {
            message = message.replace(broadcastRegex, '');

            //send back the message to the other clients
            wss.clients
                .forEach(client => {
                    console.log(`Events: ${client._socket.server._eventsCount}`)
                    console.log(`Connections: ${client._socket.server._connections}`)
                    //
                    if (client != ws) {
                        client.send(`Hello, broadcast message -> ${message}`);
                    }    
                });
            
        } else {
            ws.send(`Hello, you sent -> ${message}`);
        }
    });

    setInterval(() => {
        wss.clients.forEach((ws) => {
            
            if (!ws.isAlive) return ws.terminate();
            
            ws.isAlive = false;
            //ws.ping(null, false, true);
        });
    }, 10000);

    ws.on('close', (ws, code, reason) => {
        console.log(`ws: ${ws}, code: ${code}, reason: ${reason}`)
    })

   

    //send immediatly a feedback to the incoming connection    
    ws.send('Hi there, I am a WebSocket server');
});



//start our server
server.listen(process.env.PORT || 8999, () => {
    console.log(JSON.stringify(server.address()))
    console.log(`Server started on port ${server.address().port} :)`);
});
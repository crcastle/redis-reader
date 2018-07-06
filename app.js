const redis = require('redis');
const express = require('express');
const http = require('http');
const nodeCleanup = require('node-cleanup');

const WebSocket = require('ws');

const app = express();

//
// Serve static files from the 'public' folder.
//
app.use(express.static('public'));

//
// Create HTTP and WebSocket servers
//
const server = http.createServer(app);
const wss = new WebSocket.Server({server});

//
// Setup Redis
//
const client = redis.createClient(process.env.REDIS_URL);
client.on("error", err => console.log("Redis error: " + err));
client.on('subscribe', (channel, count) => console.log(`Subscribed to redis channel "${channel}"`));
client.subscribe(process.env.REDIS_CHANNEL);

//
// Setup WebSocket event listeners
// and redis message broadcaster
//
function noop() {}

function heartbeat() {
  this.isAlive = true;
}

wss.on('connection', (ws, req) => {
  console.log('New WebSocket connection created')
  
  ws.isAlive = true;
  ws.on('pong', heartbeat);

  client.on('message', (channel, message) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      console.log(`Sending message from "${channel}" channel to WebSocket client: "${message}"`);
      ws.send(message);
    }
  })

  // When WebSocket connection is closed
  ws.on('close', (code, reason) => {
    console.log(`WebSocket connection closed: ${reason} (${code})`);
  })
});

//
// Start the server.
//
const port = process.env.PORT
server.listen(port, () => console.log(`Listening on port ${port}`));

//
// Ping WebSocket connections every 25s to keep them alive 
// or terminate them if no pong response received
//
const interval = setInterval(function ping() {
  wss.clients.forEach(function each(ws) {
    if (ws.isAlive === false) {
      return ws.terminate();
    }

    ws.isAlive = false;
    ws.ping(noop);
  });
}, 25000);

nodeCleanup((exitCode, signal) => {
  console.log(`${signal} received. Cleaning up...`)
  if (client) client.unsubscribe();
})

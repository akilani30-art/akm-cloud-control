const http = require("http");
const WebSocket = require("ws");

const port = process.env.PORT || 10000;

const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end("AKM Sync Server Running");
});

const wss = new WebSocket.Server({ server });

let state = {
  startedAtEpochMs: Date.now(),
  baseOffsetSeconds: 0,
  playing: true
};

wss.on("connection", (ws) => {

  ws.on("message", (raw) => {
    const msg = JSON.parse(raw);

    if (msg.type === "hello") {
      ws.send(JSON.stringify({
        type: "hello",
        sentAt: msg.sentAt,
        serverTimeMs: Date.now()
      }));

      ws.send(JSON.stringify({
        type: "sync",
        startedAtEpochMs: state.startedAtEpochMs,
        baseOffsetSeconds: state.baseOffsetSeconds,
        playing: state.playing
      }));
    }
  });

});

server.listen(port, () => {
  console.log("✅ Sync server running on port " + port);
});

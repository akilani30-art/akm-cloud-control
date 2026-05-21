// server.js
// STATION BROADCAST SYSTEM

const http = require("http");
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");

const PORT = 7345;

// ---------- HTTP SERVER (STATIC FILES) ----------
const server = http.createServer((req, res) => {
  let filePath = "." + req.url;
  if (filePath === "./" || filePath === "./index.html") {
    filePath = "./viewer.html"; // default to viewer
  }

  const ext = String(path.extname(filePath)).toLowerCase();
  const mimeTypes = {
    ".html": "text/html",
    ".js": "text/javascript",
    ".css": "text/css",
    ".png": "image/png",
    ".jpg": "image/jpg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".json": "application/json"
  };

  const contentType = mimeTypes[ext] || "application/octet-stream";

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === "ENOENT") {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("404 Not Found", "utf-8");
      } else {
        res.writeHead(500);
        res.end("Server Error: " + error.code);
      }
    } else {
      res.writeHead(200, { "Content-Type": contentType });
      res.end(content, "utf-8");
    }
  });
});

// ---------- WEBSOCKET SERVER ----------
const wss = new WebSocket.Server({ server });

let clients = [];

wss.on("connection", (ws) => {
  clients.push(ws);

  ws.on("message", (message) => {
    // Expect JSON from control-room
    let data;
    try {
      data = JSON.parse(message);
    } catch (e) {
      console.log("Invalid JSON:", message.toString());
      return;
    }

    // Broadcast to all other clients (viewers)
    clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  });

  ws.on("close", () => {
    clients = clients.filter((c) => c !== ws);
  });
});

// ---------- START SERVER ----------
server.listen(PORT, () => {
  console.log("STATION BROADCAST SYSTEM ONLINE");
  console.log(`🌍 Listening on http://localhost:${PORT}`);
});



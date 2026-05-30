// server.js
// STATION BROADCAST SYSTEM

const http = require("http");
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");
const cors = require("cors");
const { ChannelEngine } = require("./channel-engine");
const fs = require("fs");
const path = require("path");

const PLAYLIST_FILE = path.join(__dirname, "channel.json");



const PORT = 7345;
app.use(express.json());
app.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));

const channelEngine = new ChannelEngine({
  playlistFile: "./channel.json",
  broadcast,
  onStateChange: (state) => {
    // Optional: push state to clients if you want a live dashboard
    broadcast({ type: "channel_state", state });
  }
});

// Load playlist on startup
try {
  channelEngine.loadPlaylist();
  console.log("✅ Channel playlist loaded");
} catch (err) {
  console.error("❌ Failed to load channel playlist:", err.message);
  }

app.get("/api/channel", (_req, res) => {
  try {
    res.json({
      ok: true,
      playlist: channelEngine.playlist,
      state: channelEngine.getState()
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post("/api/channel/start", (req, res) => {
  try {
    const index = req.body?.index ?? 0;
    channelEngine.start(index);
    res.json({ ok: true, state: channelEngine.getState() });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post("/api/channel/stop", (_req, res) => {
  channelEngine.stop();
  res.json({ ok: true, state: channelEngine.getState() });
});

app.post("/api/channel/next", (_req, res) => {
  channelEngine.next();
  res.json({ ok: true, state: channelEngine.getState() });
});

app.post("/api/channel/prev", (_req, res) => {
  channelEngine.prev();
  res.json({ ok: true, state: channelEngine.getState() });
});

app.post("/api/channel/jump", (req, res) => {
  try {
    channelEngine.jump(req.body?.index ?? 0);
    res.json({ ok: true, state: channelEngine.getState() });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post("/api/channel/reload", (_req, res) => {
  try {
    channelEngine.reload();
    res.json({ ok: true, playlist: channelEngine.playlist, state: channelEngine.getState() });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});


  
// ---------- HTTP SERVER (STATIC FILES) ----------
const server = http.createServer((req, res) => {
  let filePath = "." + req.url;
  if (filePath === "./" || filePath === "./index.html") {
    filePath = "./viewer.html"; // default to viewer
  }

{
  "loop": true,
  "items": [
    {
      "id": "station-open",
      "label": "Station Open",
      "durationSec": 20,
      "commands": [
        { "type": "transition", "style": "fade" },
        { "type": "scene", "scene": "scene1" },
        {
          "type": "lowerthird",
          "show": true,
          "title": "AKM Network",
          "subtitle": "Now Live"
        }
      ]
    },
    {
      "id": "music-hour",
      "label": "Studio B Music",
      "durationSec": 1800,
      "commands": [
        { "type": "transition", "style": "fade" },
        {
          "type": "studioB",
          "action": "play",
          "url": "https://www.youtube.com/watch?v=YOUR_VIDEO_ID"
        },
        { "type": "scene", "scene": "sceneStudioB" },
        {
          "type": "ticker",
          "show": true,
          "text": "Welcome to AKM Network | Stay connected | More programming coming up"
        }
      ]
    },
    {
      "id": "scripture-slot",
      "label": "Scripture Moment",
      "durationSec": 40,
      "commands": [
        { "type": "transition", "style": "cut" },
        {
          "type": "scripture",
          "title": "Psalm 23",
          "text": "The Lord is my shepherd; I shall not want."
        },
        { "type": "scene", "scene": "scene3" }
      ]
    },
    {
      "id": "camera-two-live",
      "label": "Live Camera 2",
      "durationSec": 300,
      "commands": [
        { "type": "transition", "style": "slide" },
        { "type": "camera", "view": "cam2" },
        { "type": "scene", "scene": "scene2" },
        {
          "type": "lowerthird",
          "show": true,
          "title": "Live Segment",
          "subtitle": "Camera 2"
        }
      ]
    },
    {
      "id": "ai-news-slot",
      "label": "AI News Slot",
      "durationSec": 600,
      "commands": [
        { "type": "transition", "style": "fade" },
        {
          "type": "studioB",
          "action": "play",
          "url": "https://your-domain-or-storage.example.com/ai-news-bulletin.mp4"
        },
        { "type": "scene", "scene": "sceneStudioB" },
        {
          "type": "lowerthird",
          "show": true,
          "title": "AKM News",
          "subtitle": "Top Stories"
        }
      ]
    },
    {
      "id": "clear-overlays",
      "label": "Clear Overlays",
      "durationSec": 5,
      "commands": [
        { "type": "lowerthird", "show": false },
        { "type": "ticker", "show": false }
      ]
    }
  ]
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

const fs = require("fs");

let schedule = [];
let lastTriggered = null;

// Load schedule
function loadSchedule() {
  try {
    const raw = fs.readFileSync("./schedule.json");
    schedule = JSON.parse(raw);
    console.log("📅 Schedule loaded:", schedule.length, "items");
  } catch (err) {
    console.error("❌ Failed to load schedule:", err.message);
  }
}
    if (data.type === "scene" || data.type === "studioB" || data.type === "camera") {
  // Optional: pause channel automation when operator takes over
  // channelEngine.stop();
}


// Convert HH:MM → minutes
function toMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

// Get current time in minutes
function nowMinutes() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

// Scheduler loop
function runScheduler() {
  const now = nowMinutes();

  for (const item of schedule) {
    const itemTime = toMinutes(item.time);

    // Match current minute
    if (now === itemTime) {

      // Prevent duplicate trigger
      if (lastTriggered === item.time) return;

      console.log("⏰ Trigger:", item.label);

      // Send to all clients
      broadcast({
        type: "studioB",
        action: "play",
        url: item.url
      });

      // Optional: auto switch scene
      broadcast({
        type: "scene",
        scene: "sceneStudioB"
      });

      lastTriggered = item.time;
    }
  }

  // Reset trigger after minute passes
  if (lastTriggered) {
    const lastTime = toMinutes(lastTriggered);
    if (now !== lastTime) {
      lastTriggered = null;
    }
  }
}

// Reload schedule every minute (in case you edit file)
setInterval(loadSchedule, 60000);

// Run scheduler every 30 seconds
setInterval(runScheduler, 30000);

// Initial load
loadSchedule();
    
    
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



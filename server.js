// server.js
// STATION BROADCAST SYSTEM

const http = require("http");
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");
const express = require("express");
const cors = require("cors");
const { ChannelEngine } = require("./channel-engine");

const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.json());
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

// ---------- Static files ----------
app.use(express.static(__dirname));

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "viewer.html"));
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// ---------- HTTP server + WebSocket ----------
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// ---------- Broadcast helper ----------
function broadcast(data) {
  if (!wss || !wss.clients) return;

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

// ---------- Channel Engine ----------
const channelEngine = new ChannelEngine({
  playlistFile: "./channel.json",
  broadcast,
  onStateChange: (state) => {
    broadcast({ type: "channel_state", state });
  },
});

// Load playlist on startup
try {
  channelEngine.loadPlaylist();
  console.log("✅ Channel playlist loaded");
} catch (err) {
  console.error("❌ Failed to load channel playlist:", err.message);
}

// ---------- API Routes ----------
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
    res.json({
      ok: true,
      playlist: channelEngine.playlist,
      state: channelEngine.getState(),
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ---------- Schedule management ----------
let schedule = [];
let lastTriggered = null;

function loadSchedule() {
  try {
    const raw = fs.readFileSync(path.join(__dirname, "schedule.json"), "utf-8");
    schedule = JSON.parse(raw);
    console.log("📅 Schedule loaded:", schedule.length, "items");
  } catch (err) {
    console.error("❌ Failed to load schedule:", err.message);
  }
}

function toMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function nowMinutes() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function runScheduler() {
  const now = nowMinutes();

  for (const item of schedule) {
    const itemTime = toMinutes(item.time);

    // Trigger only at the exact scheduled minute, once
    if (now === itemTime && lastTriggered !== item.time) {
      console.log("⏰ Trigger:", item.label);

      broadcast({
        type: "studioB",
        action: "play",
        url: item.url,
      });

      broadcast({
        type: "scene",
        scene: "sceneStudioB",
      });

      lastTriggered = item.time;
    }
  }

  // Reset trigger after the minute has passed
  if (lastTriggered) {
    const lastTime = toMinutes(lastTriggered);
    if (now !== lastTime) {
      lastTriggered = null;
    }
  }
}

setInterval(loadSchedule, 60000);
setInterval(runScheduler, 30000);
loadSchedule();

// ---------- WebSocket handling ----------
wss.on("connection", (ws) => {
  console.log("✅ WebSocket client connected");

  ws.on("message", (message) => {
    let data;
    try {
      data = JSON.parse(message);
    } catch (e) {
      console.log("❌ Invalid JSON:", message.toString());
      return;
    }

    if (
      data.type === "scene" ||
      data.type === "studioB" ||
      data.type === "camera"
    ) {
      // Optional: pause automation if operator takes over
      // channelEngine.stop();
    }

    // Broadcast to all other clients
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  });

  ws.on("close", () => {
    console.log("❌ WebSocket client disconnected");
  });
});

// ---------- Start server ----------
server.listen(PORT, "0.0.0.0", () => {
  console.log("🚀 STATION BROADCAST SYSTEM ONLINE");
  console.log(`🌍 Listening on port ${PORT}`);
});

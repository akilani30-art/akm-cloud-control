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
app.use("/videos", express.static(path.join(__dirname, "videos")));

app.get("/", (_req, res) => {
  res.send("STATION BROADCAST SYSTEM RUNNING");
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

// ---------- STATE TRACKING --------
  const state = {
  scene: "sceneStudioB",
  transitionStyle: "slide",

  studioBUrl: "",
  dinabUrl: "",

  // ✅ multi-guest DINAB
  dinabGuests: ["", "", "", ""],
  dinabLayout: "solo",

  camera: "cam1",

  scripture: {
    title: "",
    text: ""
  },

  lowerThird: {
    show: false,
    title: "",
    subtitle: ""
  },

  ticker: {
    show: false,
    text: "",
    label: "BREAKING NEWS"
  }
};


function sendFullState(ws) {
  const playback = getPlaybackState();

  ws.send(JSON.stringify({
    type: "full_state",
    scene: state.scene,
    transitionStyle: state.transitionStyle,

    studioBUrl: state.studioBUrl,
    dinabUrl: state.dinabUrl,

    // ✅ multi-guest DINAB state
    dinabGuests: state.dinabGuests,
    dinabLayout: state.dinabLayout,

    camera: state.camera,
    scripture: state.scripture,
    lowerThird: state.lowerThird,
    ticker: state.ticker,
    playback: playback
  }));
}




// ---------- PLAYBACK TRACKING ----------
let playbackState = {
  url: null,
  currentTime: 0,
  isPlaying: false,
  lastUpdate: Date.now()
};

function updatePlaybackState(url, currentTime, isPlaying) {
  playbackState = {
    url,
    currentTime,
    isPlaying,
    lastUpdate: Date.now()
  };
}

function getPlaybackState() {
  // If video is playing, calculate elapsed time since last update
  if (playbackState.isPlaying) {
    const elapsed = (Date.now() - playbackState.lastUpdate) / 1000;
    return {
      url: playbackState.url,
      currentTime: playbackState.currentTime + elapsed,
      isPlaying: true
    };
  }
  return playbackState;
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
// ---------- WebSocket handling ----------

  wss.on("connection", (ws) => {
  console.log("✅ WebSocket client connected");

  // ✅ Send full state on connect
  sendFullState(ws);

  ws.on("message", (message) => {
    let data;
    try {
      data = JSON.parse(message);
    } catch {
      console.log("❌ Invalid JSON:", message.toString());
      return;
    }

    if (data.type === "scene") {
      state.scene = data.scene;
      broadcast({ type: "scene", scene: data.scene });
    }

    else if (data.type === "transition") {
      state.transitionStyle = data.style || "slide";
      broadcast({ type: "transition", style: state.transitionStyle });
    }

    else if (data.type === "studioB") {
      state.studioBUrl = data.url || "";
      broadcast(data);
    }
else if (data.type === "speaker_level") {
  broadcast({
    type: "speaker_level",
    index: data.index,
    level: data.level
  });
}

   
    else if (data.type === "dinab") {
      state.dinabUrl = data.url || "";
      state.dinabGuests = ["", "", "", ""];
      state.dinabLayout = "solo";

      broadcast({ type: "dinab", url: state.dinabUrl });
    }

else if (data.type === "dinab_multi") {
      state.dinabGuests = Array.isArray(data.guests)
        ? data.guests.slice(0, 4)
        : ["", "", "", ""];

      while (state.dinabGuests.length < 4) {
        state.dinabGuests.push("");
      }

      state.dinabLayout = data.layout || "solo";

      // Optional: clear single DINAB when multi mode is used
      state.dinabUrl = "";

      broadcast({
        type: "dinab_multi",
        guests: state.dinabGuests,
        layout: state.dinabLayout
      });
    }


    else if (data.type === "reload_dinab") {
      broadcast({ type: "reload_dinab" });
    }

    else if (data.type === "camera") {
      state.camera = data.view || "cam1";
      broadcast(data);
    }

    else if (data.type === "scripture") {
      state.scripture = {
        title: data.title || "",
        text: data.text || ""
      };
      broadcast(data);
    }

    else if (data.type === "lowerthird") {
      state.lowerThird = {
        show: !!data.show,
        title: data.title || "",
        subtitle: data.subtitle || ""
      };
      broadcast(data);
    }
else if (data.type === "host_lock") {
  broadcast({
    type: "host_lock",
    enabled: data.enabled
  });
}


    else if (data.type === "ticker") {
      state.ticker = {
        show: !!data.show,
        text: data.text || "",
        label: data.label || "BREAKING NEWS"
      };
      broadcast(data);
    }

    else if (data.type === "request_full_state") {
      sendFullState(ws);
    }
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
const http = require("http");
const WebSocket = require("ws");

const PORT = process.env.PORT || 10000;

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("AKM Sync Server Running");
});

const wss = new WebSocket.Server({ server });

const PLAYLIST = {
  main: {
    id: "main",
    title: "Main Broadcast",
    src: "https://akilani30-art.github.io/akm-cloud-control/videos/akm.mp4"
  },
  news: {
    id: "news",
    title: "News Update",
    src: "https://akilani30-art.github.io/akm-cloud-control/videos/ai_news_video.mp4
  },
  preach: {
    id: "preach",
    title: "Preaching",
    src: "https://akilani30-art.github.io/akm-cloud-control/videos/preach.mp4"
  },
  worship: {
    id: "worship",
    title: "Worship Session",
    src: "https://akilani30-art.github.io/akm-cloud-control/videos/worship.mp4"
  }
};

// minutes since midnight (Johannesbur time const SCHEDULE = [
  // Midnight → 8:59 → Main
  { start: 0, end: 539, contentId: "main" },

  // 09:00 → 09:09 → AI News (10 min slot)
  { start: 540, end: 549, contentId: "news" },

  // 09:10 → end of day → Main again
  { start: 550, end: 1439, contentId: "main" }
];

function getJohannesburgMinutes() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Johannesburg",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(now);

  let hour = 0;
  let minute = 0;

  for (const p of parts) {
    if (p.type === "hour") hour = parseInt(p.value, 10);
    if (p.type === "minute") minute = parseInt(p.value, 10);
  }

  return hour * 60 + minute;
}

function getScheduledContent() {
  const minutes = getJohannesburgMinutes();
  for (const slot of SCHEDULE) {
    if (minutes >= slot.start && minutes <= slot.end) {
      return PLAYLIST[slot.contentId];
    }
  }
  return PLAYLIST.main;
}

let state = {
  contentId: null,
  startedAtEpochMs: Date.now(),
  baseOffsetSeconds: 0,
  playing: true
};

function setCurrentContent(contentId, offsetSeconds = 0) {
  state.contentId = contentId;
  state.baseOffsetSeconds = offsetSeconds;
  state.startedAtEpochMs = Date.now();
  state.playing = true;
}

function getCurrentTime() {
  if (!state.playing) return state.baseOffsetSeconds;
  return state.baseOffsetSeconds + ((Date.now() - state.startedAtEpochMs) / 1000);
}

function getSyncPayload() {
  const content = PLAYLIST[state.contentId];
  return {
    type: "sync",
    contentId: state.contentId,
    title: content.title,
    src: content.src,
    startedAtEpochMs: state.startedAtEpochMs,
    baseOffsetSeconds: state.baseOffsetSeconds,
    playing: state.playing
  };
}

function broadcastSync() {
  const payload = JSON.stringify(getSyncPayload());
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

function checkSchedule() {
  const scheduled = getScheduledContent();
  if (state.contentId !== scheduled.id) {
    setCurrentContent(scheduled.id, 0);
    broadcastSync();
    console.log("Switched to:", scheduled.title);
  }
}

setCurrentContent(getScheduledContent().id, 0);
setInterval(checkSchedule, 15000);

wss.on("connection", (ws) => {
  ws.on("message", (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }

    if (msg.type === "hello") {
      ws.send(JSON.stringify({
        type: "hello",
        sentAt: msg.sentAt,
        serverTimeMs: Date.now()
      }));

      ws.send(JSON.stringify(getSyncPayload()));
    }

    if (msg.type === "pause") {
      state.baseOffsetSeconds = getCurrentTime();
      state.playing = false;
      broadcastSync();
    }

    if (msg.type === "play") {
      state.startedAtEpochMs = Date.now();
      state.playing = true;
      broadcastSync();
    }

    if (msg.type === "seek" && typeof msg.offsetSeconds === "number") {
      state.baseOffsetSeconds = Math.max(0, msg.offsetSeconds);
      state.startedAtEpochMs = Date.now();
      state.playing = true;
      broadcastSync();
    }
  });
});

server.listen(PORT, () => {
  console.log("AKM Sync Server listening on port " + PORT);
});

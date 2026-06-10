const http = require("http");
const WebSocket = require("ws");

const PORT = process.env.PORT || 10000;

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("AKM Sync Server Running");
});

const wss = new WebSocket.Server({ server });

// -------------------------
// CHANNEL / PLAYLIST CONFIG
// -------------------------
const PLAYLIST = {
  music1: {
    id: "music1",
    title: "Morning Worship Mix",
    src: "/video/worship.mp4",
    duration: 1800
  },
  news1: {
    id: "news1",
    title: "Morning News",
    src: "/video/morning-news.mp4",
    duration: 600
  },
  preach1: {
    id: "preach1",
    title: "Preaching Session",
    src: "/video/preaching.mp4",
    duration: 1500
  },
  night1: {
    id: "night1",
    title: "Night Music",
    src: "/video/night-mix.mp4",
    duration: 3600
  }
};

// minutes since midnight
const SCHEDULE = [
  { start: 0, end: 359, contentId: "night1" },
  { start: 360, end: 539, contentId: "music1" },
  { start: 540, end: 549, contentId: "news1" },
  { start: 550, end: 1079, contentId: "music1" },
  { start: 1080, end: 1109, contentId: "preach1" },
  { start: 1110, end: 1439, contentId: "night1" }
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

  return PLAYLIST.night1;
}

// -------------------------
// SHARED STATE
// -------------------------
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

function getCurrentContent() {
  return PLAYLIST[state.contentId];
}

function getCurrentPlaybackTime() {
  if (!state.playing) return state.baseOffsetSeconds;
  return state.baseOffsetSeconds + ((Date.now() - state.startedAtEpochMs) / 1000);
}

function getSyncPayload() {
  const content = getCurrentContent();
  return {
    type: "sync",
    contentId: state.contentId,
    title: content?.title || "",
    src: content?.src || "",
    duration: content?.duration || 0,
    startedAtEpochMs: state.startedAtEpochMs,
    baseOffsetSeconds: state.baseOffsetSeconds,
    playing: state.playing
  };
}

function broadcastSync() {
  const payload = JSON.stringify(getSyncPayload());
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

// -------------------------
// AUTO SWITCHER
// -------------------------
function ensureScheduleIsCurrent() {
  const scheduled = getScheduledContent();
  if (!scheduled) return;

  if (state.contentId !== scheduled.id) {
    setCurrentContent(scheduled.id, 0);
    broadcastSync();
    console.log("Switched to scheduled content:", scheduled.title);
  }
}

// initial content
const initial = getScheduledContent();
setCurrentContent(initial.id, 0);

// check every 15 sec for schedule changes
setInterval(ensureScheduleIsCurrent, 15000);

// -------------------------
// WEBSOCKET
// -------------------------
wss.on("connection", (ws) => {
  console.log("Client connected");

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
      return;
    }

    // manual admin controls
    if (msg.type === "pause") {
      state.baseOffsetSeconds = getCurrentPlaybackTime();
      state.playing = false;
      broadcastSync();
      return;
    }

    if (msg.type === "play") {
      state.startedAtEpochMs = Date.now();
      state.playing = true;
      broadcastSync();
      return;
    }

    if (msg.type === "seek" && typeof msg.offsetSeconds === "number") {
      state.baseOffsetSeconds = Math.max(0, msg.offsetSeconds);
      state.startedAtEpochMs = Date.now();
      state.playing = true;
      broadcastSync();
      return;
    }

    if (msg.type === "switchContent" && PLAYLIST[msg.contentId]) {
      setCurrentContent(msg.contentId, 0);
      broadcastSync();
      return;
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

server.listen(PORT, () => {
  console.log(`AKM Sync Server listening on port ${PORT}`);
});

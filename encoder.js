// ===============================
// AKM BROADCAST ENGINE — PHASE 1 ENCODER
// ===============================

// 🎯 CONFIG
const FPS = 30;
const WIDTH = 1280;
const HEIGHT = 720;
const BITRATE = 2500000; // 2.5 Mbps
const CHUNK_INTERVAL = 1000; // 1 second

// 🔌 OPTIONAL: PREPARE FOR PHASE 2 (WebSocket)
let ws = null;
// ws = new WebSocket("wss://your-server");
// ws.binaryType = "arraybuffer";

// ===============================
// 🎥 CANVAS SETUP
// ===============================
const canvas = document.getElementById("broadcastCanvas");
if (!canvas) {
  console.error("❌ broadcastCanvas not found");
}

canvas.width = WIDTH;
canvas.height = HEIGHT;

const ctx = canvas.getContext("2d");

// 🎬 TARGET PROGRAM OUTPUT
const program = document.getElementById("program-output");

if (!program) {
  console.error("❌ program-output container not found");
}

// ===============================
// 🔁 FRAME RENDER LOOP
// ===============================
function drawFrame() {
  try {
    // Find active video inside program
    const video = program.querySelector("video");

    if (video && video.readyState >= 2) {
      ctx.drawImage(video, 0, 0, WIDTH, HEIGHT);
    } else {
      // fallback visual (important for debugging)
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      ctx.fillStyle = "#00ffcc";
      ctx.font = "28px Arial";
      ctx.fillText("AKM BROADCAST ENGINE", 40, 60);

      ctx.fillStyle = "white";
      ctx.font = "20px Arial";
      ctx.fillText("Waiting for video signal...", 40, 100);
    }

  } catch (err) {
    console.warn("⚠️ drawFrame error:", err);
  }

  requestAnimationFrame(drawFrame);
}

drawFrame();

// ===============================
// 🎬 CAPTURE STREAM
// ===============================
const stream = canvas.captureStream(FPS);

// ===============================
// 🎥 MEDIA RECORDER SETUP
// ===============================
let options = {
  mimeType: "video/webm; codecs=vp9",
  videoBitsPerSecond: BITRATE
};

// Fallback if VP9 unsupported
if (!MediaRecorder.isTypeSupported(options.mimeType)) {
  console.warn("⚠️ VP9 not supported, falling back to VP8");
  options.mimeType = "video/webm; codecs=vp8";
}

const recorder = new MediaRecorder(stream, options);

// ===============================
// 📦 CHUNK HANDLING
// ===============================
let chunkIndex = 0;
let totalBytes = 0;

recorder.ondataavailable = (event) => {
  if (event.data && event.data.size > 0) {
    chunkIndex++;
    totalBytes += event.data.size;

    console.log(`🎥 Chunk #${chunkIndex} | ${event.data.size} bytes`);

    // 🔌 PHASE 2 READY:
    if (ws && ws.readyState === 1) {
      ws.send(event.data);
    }
  }
};

// ===============================
// 🚀 LIFECYCLE EVENTS
// ===============================
recorder.onstart = () => {
  console.log("🚀 Encoder STARTED");
};

recorder.onstop = () => {
  console.log("🛑 Encoder STOPPED");
};

recorder.onerror = (err) => {
  console.error("❌ Encoder ERROR:", err);
};

// ===============================
// ▶ START ENCODING
// ===============================
recorder.start(CHUNK_INTERVAL);

// ===============================
// 🧠 CONTROL HELPERS (OPTIONAL)
// ===============================
window.AKMEncoder = {
  stop: () => recorder.stop(),
  start: () => recorder.start(CHUNK_INTERVAL),
  getStats: () => ({
    chunks: chunkIndex,
    totalMB: (totalBytes / (1024 * 1024)).toFixed(2)
  })
};
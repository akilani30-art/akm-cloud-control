const NodeMediaServer = require('node-media-server');
const express = require('express');
const { spawn } = require('child_process');

const app = express();
const PORT = 3000;

let ffmpegProcess = null;
let isLive = false;

/* =========================
   RTMP SERVER
========================= */
const config = {
  rtmp: {
    port: 1935,
    chunk_size: 60000,
    gop_cache: true
  },
  http: {
    port: 8000,
    allow_origin: '*'
  }
};

const nms = new NodeMediaServer(config);
nms.run();

console.log("✅ RTMP Server running...");

/* =========================
   CONTROL API
========================= */

// ✅ START STREAM
app.get('/start', (req, res) => {
  if (ffmpegProcess) {
    return res.send("Already running");
  }

  const input = 'rtmp://127.0.0.1:1935/live/studiob';

  const youtube = 'rtmp://a.rtmp.youtube.com/live2/YOUR_KEY';

  const args = [
    '-i', input,

    '-c:v', 'libx264',
    '-preset', 'veryfast',
    '-tune', 'zerolatency',

    '-c:a', 'aac',
    '-ar', '44100',
    '-b:a', '128k',

    '-f', 'flv', youtube
  ];

  ffmpegProcess = spawn('ffmpeg', args);
  isLive = true;

  ffmpegProcess.stderr.on('data', (data) => {
    console.log(`FFmpeg: ${data}`);
  });

  ffmpegProcess.on('close', () => {
    console.log('FFmpeg stopped');
    ffmpegProcess = null;
    isLive = false;
  });

  res.send("✅ Stream started");
});

// ✅ STOP STREAM
app.get('/stop', (req, res) => {
  if (!ffmpegProcess) {
    return res.send("Not running");
  }

  ffmpegProcess.kill('SIGINT');
  ffmpegProcess = null;
  isLive = false;

  res.send("⛔ Stream stopped");
});

// ✅ STATUS
app.get('/status', (req, res) => {
  res.json({ live: isLive });
});

/* =========================
   SERVE DASHBOARD
========================= */
app.use(express.static('public'));

app.listen(PORT, () => {
  console.log(`🌐 Dashboard running at http://localhost:${PORT}`);
});

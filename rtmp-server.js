const NodeMediaServer = require('node-media-server');
const { spawn } = require('child_process');

const config = {
  rtmp: {
    port: 1935,
    chunk_size: 60000,
    gop_cache: true,
    ping: 30,
    ping_timeout: 60
  },
  http: {
    port: 8000,
    allow_origin: '*'
  }
};

const nms = new NodeMediaServer(config);

let ffmpegProcess = null;

// ✅ Hook into stream publish event
nms.on('postPublish', (id, StreamPath, args) => {
  console.log('✅ Stream started:', StreamPath);

  if (StreamPath === '/live/studiob') {
    startRestream();
  }
});

nms.on('donePublish', (id, StreamPath, args) => {
  console.log('❌ Stream ended:', StreamPath);

  if (ffmpegProcess) {
    ffmpegProcess.kill('SIGINT');
    ffmpegProcess = null;
  }
});

// ✅ FFmpeg Restream function
function startRestream() {
  if (ffmpegProcess) return;

  const input = 'rtmp://127.0.0.1:1935/live/studiob';

  const youtube = 'rtmp://a.rtmp.youtube.com/live2/ u8pj-wg1b-mzzm-kh1d-2xve';
  const facebook = 'rtmp://live-api-s.facebook.com:80/rtmp/YOUR_FACEBOOK_KEY';

  const args = [
    '-i', input,

    '-c:v', 'libx264',
    '-preset', 'veryfast',
    '-tune', 'zerolatency',

    '-c:a', 'aac',
    '-ar', '44100',
    '-b:a', '128k',

    '-f', 'flv', youtube,

    '-c:v', 'libx264',
    '-preset', 'veryfast',
    '-tune', 'zerolatency',

    '-c:a', 'aac',
    '-ar', '44100',
    '-b:a', '128k',

    '-f', 'flv', facebook
  ];

  console.log('🚀 Starting FFmpeg restream...');

  ffmpegProcess = spawn('ffmpeg', args);

  ffmpegProcess.stderr.on('data', (data) => {
    console.log(`FFmpeg: ${data}`);
  });

  ffmpegProcess.on('close', (code) => {
    console.log(`FFmpeg exited with code ${code}`);
    ffmpegProcess = null;
  });
}

nms.run();

console.log("✅ RTMP Server running...");

// ===============================
// AKM V3 ENCODER (Viewer-Aware)
// ===============================

const canvas = document.getElementById("broadcastCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 1280;
canvas.height = 720;

// 🔍 FIND ACTIVE FRAME
function getActiveFrame() {
  const A = document.getElementById("sceneA");
  const B = document.getElementById("sceneB");

  if (A.classList.contains("activeScene")) return A;
  if (B.classList.contains("activeScene")) return B;

  return null;
}

// 🎬 DRAW LOOP
function draw() {
  const frame = getActiveFrame();

  try {
    if (frame && frame.contentWindow) {
      // ⚠️ iframe capture fallback (we simulate)
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#00ffcc";
      ctx.font = "28px Arial";
      ctx.fillText("AKM LIVE PROGRAM", 40, 60);

      ctx.fillStyle = "white";
      ctx.fillText("Scene: " + frame.src, 40, 100);

    } else {
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "red";
      ctx.fillText("No active scene", 40, 60);
    }

  } catch (e) {
    console.warn("Draw error", e);
  }

  requestAnimationFrame(draw);
}

draw();

// ===============================
// 🎥 CAPTURE STREAM
// ===============================
const stream = canvas.captureStream(30);

const recorder = new MediaRecorder(stream, {
  mimeType: "video/webm; codecs=vp8",
  videoBitsPerSecond: 2500000
});

recorder.ondataavailable = (e) => {
  if (e.data.size > 0) {
    console.log("🎥 chunk", e.data.size);
  }
};

recorder.start(1000);
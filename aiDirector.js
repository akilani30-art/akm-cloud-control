function decide(state) {
  const current = state.activeCamera;
  const scene = state.scene || "unknown";
  const learning = state.learning || {};
  const cameras = state.cameras || {};

  if (!cameras.cam1 && !cameras.cam2) return null;

  const cam1Score = learning.cam1 || 0;
  const cam2Score = learning.cam2 || 0;

  // =========================================================
  // 🧠 SCENE LOGIC (SWITCHER STYLE)
  // =========================================================

  let weightCam1 = cam1Score;
  let weightCam2 = cam2Score;

  switch (scene) {
    case "studio":
    case "interview":
      weightCam1 += 2; // stable "A-cam"
      break;

    case "breaking":
      weightCam2 += 2; // aggressive "B-roll / cutaway"
      weightCam1 += 1;
      break;

    default:
      break;
  }

  // =========================================================
  // 🧠 PREVIEW SELECTION (NOT PROGRAM YET)
  // =========================================================

  let preview =
    weightCam1 >= weightCam2 ? "cam1" : "cam2";

  // safety check
  if (!cameras[preview]) {
    preview = current;
  }

  // =========================================================
  // 🧠 NO USELESS SWITCHING
  // =========================================================

  if (preview === current) {
    return {
      action: "HOLD_PROGRAM",
      target: current,
      preview: current,
      confidence: 0.5,
      reason: `stable program in scene: ${scene}`
    };
  }

  // =========================================================
  // 🎬 SWITCHER OUTPUT MODEL
  // =========================================================

  return {
    action: "SET_PREVIEW",
    target: preview,     // what goes to preview bus
    program: current,    // what stays on air
    confidence: 0.85,
    reason: `scene-aware preview selection (${scene})`
  };
}

module.exports = { decide };
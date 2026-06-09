function startStream() {
  fetch('/start')
    .then(() => updateStatus("LIVE", "live"))
    .catch(() => alert('Failed to start'));
}

function stopStream() {
  fetch('/stop')
    .then(() => updateStatus("OFFLINE", "offline"))
    .catch(() => alert('Failed to stop'));
}

function updateStatus(text, cls) {
  const el = document.getElementById("status");
  el.innerText = text;
  el.className = "status " + cls;
}

// ✅ Auto-refresh status
setInterval(() => {
  fetch('/status')
    .then(res => res.json())
    .then(data => {
      if (data.live) {
        updateStatus("LIVE", "live");
      } else {
        updateStatus("OFFLINE", "offline");
      }
    });
}, 2000);

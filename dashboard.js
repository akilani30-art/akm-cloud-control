function startStream() {
  updateStatus("LIVE", "live");

  fetch('/start')
    .then(() => console.log('Started'))
    .catch(() => alert('Failed to start'));
}

function stopStream() {
  updateStatus("OFFLINE", "offline");

  fetch('/stop')
    .then(() => console.log('Stopped'))
    .catch(() => alert('Failed to stop'));
}

function updateStatus(text, cls) {
  const el = document.getElementById("status");
  el.innerText = text;
  el.className = "status " + cls;
}

function openPreview() {
  const ip = document.getElementById("ip").value;
  const key = document.getElementById("key").value;
  window.open(`http://${ip}:8000/live/${key}.flv`);
}

function toggle(id) {
  const el = document.getElementById(id);
  el.classList.toggle("on");
  el.classList.toggle("off");
}

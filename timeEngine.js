const { emitEvent } = require("./eventBus");

const fs = require("fs");
const path = require("path");

const LOG_FILE = path.join(__dirname, "timeline/events.log");

function logEvent(type, data) {
    const event = {
        time: new Date().toISOString(),
        type,
        data
    };

    fs.appendFileSync(LOG_FILE, JSON.stringify(event) + "\n");

    console.log("⏱️ EVENT:", type, data);
}

function logEvent(type, data) {
    const event = {
        time: new Date().toISOString(),
        type,
        data
    };

    fs.appendFileSync(LOG_FILE, JSON.stringify(event) + "\n");

    // 🔥 NEW: broadcast event immediately
    emitEvent(type, data);
}






function getTimeline() {
    if (!fs.existsSync(LOG_FILE)) return [];

    const raw = fs.readFileSync(LOG_FILE, "utf-8").trim();
    if (!raw) return [];

    return raw.split("\n").map(line => JSON.parse(line));
}

module.exports = { logEvent, getTimeline };
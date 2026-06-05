const fs = require("fs");
const path = require("path");

const SNAP_DIR = path.join(__dirname, "snapshots");
const VERSION_FILE = path.join(__dirname, "version.json");

// ensure folder exists
if (!fs.existsSync(SNAP_DIR)) {
    fs.mkdirSync(SNAP_DIR);
}

function getVersionData() {
    return JSON.parse(fs.readFileSync(VERSION_FILE, "utf-8"));
}

function saveSnapshot(label = "manual") {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

    const snapshotName = `${label}_${timestamp}`;
    const snapshotPath = path.join(SNAP_DIR, snapshotName);

    fs.mkdirSync(snapshotPath);

    // copy core files
    const files = ["server.js", "version.json"];

    files.forEach(file => {
        fs.copyFileSync(
            path.join(__dirname, file),
            path.join(snapshotPath, file)
        );
    });

    const version = getVersionData();
    version.history.push(snapshotName);
    version.current = snapshotName;

    fs.writeFileSync(VERSION_FILE, JSON.stringify(version, null, 2));

    console.log("📸 Snapshot saved:", snapshotName);
}

module.exports = { saveSnapshot };

const { logEvent } = require("./timeEngine");

function saveSnapshot(label = "auto") {
    logEvent("SNAPSHOT", { label });

    // existing snapshot logic continues...
}
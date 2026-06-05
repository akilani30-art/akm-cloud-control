const fs = require("fs");
const path = require("path");

const SNAP_DIR = path.join(__dirname, "snapshots");
const VERSION_FILE = path.join(__dirname, "version.json");

function restore(snapshotName) {
    const snapshotPath = path.join(SNAP_DIR, snapshotName);

    if (!fs.existsSync(snapshotPath)) {
        console.log("❌ Snapshot not found:", snapshotName);
        return;
    }

    const files = fs.readdirSync(snapshotPath);

    files.forEach(file => {
        fs.copyFileSync(
            path.join(snapshotPath, file),
            path.join(__dirname, file)
        );
    });

    const version = JSON.parse(fs.readFileSync(VERSION_FILE, "utf-8"));
    version.current = snapshotName;

    fs.writeFileSync(VERSION_FILE, JSON.stringify(version, null, 2));

    console.log("🔁 Restored to:", snapshotName);
}

function listSnapshots() {
    return fs.readdirSync(SNAP_DIR);
}

module.exports = { restore, listSnapshots };
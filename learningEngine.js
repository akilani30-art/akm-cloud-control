const fs = require("fs");
const path = require("path");

const BRAIN_FILE = path.join(__dirname, "brain.json");

// initialize brain
function loadBrain() {
    if (!fs.existsSync(BRAIN_FILE)) {
        fs.writeFileSync(BRAIN_FILE, JSON.stringify({ patterns: {} }, null, 2));
    }
    return JSON.parse(fs.readFileSync(BRAIN_FILE));
}

function saveBrain(brain) {
    fs.writeFileSync(BRAIN_FILE, JSON.stringify(brain, null, 2));
}

// 🧠 LEARN PATTERNS
function learnFromTimeline(events) {
    const brain = loadBrain();

    for (let i = 0; i < events.length - 1; i++) {
        const current = events[i].type;
        const next = events[i + 1].type;

        if (!brain.patterns[current]) {
            brain.patterns[current] = {};
        }

        if (!brain.patterns[current][next]) {
            brain.patterns[current][next] = 0;
        }

        brain.patterns[current][next]++;
    }

    saveBrain(brain);
}

// 🔮 PREDICT BASED ON LEARNING
function predictNext(type) {
    const brain = loadBrain();

    const options = brain.patterns[type];
    if (!options) return null;

    let best = null;
    let max = 0;

    for (const next in options) {
        if (options[next] > max) {
            max = options[next];
            best = next;
        }
    }

    return best;
}

module.exports = { learnFromTimeline, predictNext };

const { logEvent, getTimeline } = require("./timeEngine");
const { runPredictiveEngine } = require("./predictiveEngine");
const { onEvent } = require("./eventBus");
const sceneManager = require("./sceneManager");

/* =========================================================
   🧠 STATE (SINGLE SOURCE OF TRUTH)
========================================================= */

let memory = {
    lastActionTime: {},
    lastLowerThird: null,
    lastTicker: null,
    sceneHistory: []
};

/* =========================================================
   🧠 TIMELINE ANALYSIS
========================================================= */

function analyzeTimeline() {
    const events = getTimeline();
    if (!events || events.length === 0) return null;

    return events[events.length - 1];
}

/* =========================================================
   ⏱ COOLDOWN SYSTEM
========================================================= */

function canTrigger(type, cooldown = 10000) {
    const now = Date.now();
    const last = memory.lastActionTime[type] || 0;

    if (now - last < cooldown) return false;

    memory.lastActionTime[type] = now;
    return true;
}

/* =========================================================
   🧠 SCENE LEARNING (EVENT LISTENER)
========================================================= */

onEvent("SCENE_CHANGE", (payload) => {
    const scene = payload.scene;

    memory.sceneHistory.push({
        scene,
        time: Date.now()
    });

    console.log("🧠 AI observed scene:", scene);

    analyzeScenePatterns();
});

/* =========================================================
   🔍 PATTERN ANALYSIS
========================================================= */

function analyzeScenePatterns() {
    const history = memory.sceneHistory;

    if (history.length < 3) return;

    const last3 = history.slice(-3).map(e => e.scene);

    // Repetition detection
    if (last3.every(s => s === last3[0])) {
        console.log("🧠 AI: repeated scene detected:", last3[0]);
    }

    // Transition detection
    if (last3.includes("studio") && last3.includes("breaking")) {
        console.log("🧠 AI: news transition pattern detected");
    }
}

/* =========================================================
   🎯 DECISION ENGINE
========================================================= */

function decideAction(lastEvent) {
    if (!lastEvent) return null;

    const now = new Date();
    const hour = now.getHours();

    /* -------------------------------
       🚨 BREAKING NEWS PRIORITY
    --------------------------------*/
    if (
        lastEvent.type === "LOWER_THIRD" &&
        lastEvent.data?.text?.toLowerCase().includes("breaking")
    ) {
        if (canTrigger("BREAKING_TICKER", 15000)) {
            return {
                type: "TICKER_UPDATE",
                data: {
                    text: `🚨 BREAKING: ${lastEvent.data.text}`
                }
            };
        }
    }

    /* -------------------------------
       📡 LIVE START LOGIC
    --------------------------------*/
    if (
        lastEvent.type === "LIVE_STATUS" &&
        lastEvent.data?.state === true
    ) {
        if (canTrigger("LIVE_INTRO", 20000)) {

            const text =
                hour < 12
                    ? "☀️ Morning Broadcast"
                    : hour < 18
                        ? "🌇 Afternoon Live"
                        : "🌙 Evening Broadcast";

            memory.lastLowerThird = text;

            return {
                type: "LOWER_THIRD",
                data: { text }
            };
        }
    }

    /* -------------------------------
       🎬 SCENE AWARE TICKER
    --------------------------------*/
    if (lastEvent.type === "SCENE_CHANGE") {
        if (canTrigger("SCENE_TICKER", 8000)) {

            const text = `Now showing: ${lastEvent.scene || lastEvent.data?.scene}`;

            if (memory.lastTicker === text) return null;

            memory.lastTicker = text;

            return {
                type: "TICKER_UPDATE",
                data: { text }
            };
        }
    }

    /* -------------------------------
       📺 IDLE FALLBACK
    --------------------------------*/
    if (canTrigger("IDLE_FILL", 30000)) {

        const text =
            hour < 12
                ? "☀️ Stay tuned for more"
                : "📺 Live broadcast continues";

        if (memory.lastLowerThird === text) return null;

        memory.lastLowerThird = text;

        return {
            type: "LOWER_THIRD",
            data: { text }
        };
    }

    return null;
}

/* =========================================================
   ⚙️ EXECUTION ENGINE
========================================================= */

function executeDecision(decision) {
    if (!decision) return;

    logEvent(decision.type, decision.data);

    console.log("🤖 AI PRODUCER ACTION:", decision);
}

/* =========================================================
   🔮 MAIN AI LOOP
========================================================= */

function runAIProducer() {

    const lastEvent = analyzeTimeline();

    // 🔮 Predictive layer FIRST
    const predictiveAction = runPredictiveEngine();

    if (predictiveAction && canTrigger("PREDICTIVE", 7000)) {
        console.log("🔮 PREDICTED:", predictiveAction);
        executeDecision(predictiveAction);
        return;
    }

    // 🧠 fallback logic
    const decision = decideAction(lastEvent);
    executeDecision(decision);
}

/* =========================================================
   📦 EXPORTS
========================================================= */

module.exports = {
    runAIProducer
};
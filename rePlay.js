const { getTimeline } = require("./timeEngine");

function replay() {
    const events = getTimeline();

    console.log("🎬 REPLAYING BROADCAST TIMELINE...\n");

    events.forEach((event, index) => {
        setTimeout(() => {
            console.log(`[REPLAY ${event.time}]`, event.type, event.data);
        }, index * 500);
    });
}

module.exports = { replay };


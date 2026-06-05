const { getTimeline } = require("../timeEngine");
const { getStateAt } = require("./console");

function scrubTo(index) {
    const timeline = getTimeline();

    if (index < 0 || index >= timeline.length) {
        return { error: "Invalid timeline index" };
    }

    const state = getStateAt(index);

    return {
        time: timeline[index].time,
        state
    };
}

module.exports = { scrubTo };
const { getTimeline } = require("../timeEngine");

function getStateAt(timeIndex) {
    const events = getTimeline().slice(0, timeIndex);

    let state = {
        live: false,
        lowerThird: null,
        ticker: "",
        scene: "default",
        logo: "/assets/logo.png"
    };

    for (const e of events) {
        switch (e.type) {
            case "LIVE_STATUS":
                state.live = e.data.state;
                break;

            case "LOWER_THIRD":
                state.lowerThird = e.data.text;
                break;

            case "TICKER_UPDATE":
                state.ticker = e.data.text;
                break;

            case "SCENE_CHANGE":
                state.scene = e.data.scene;
                break;
        }
    }

    return state;
}

module.exports = { getStateAt };

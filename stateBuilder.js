const { getTimeline } = require("../timeEngine");

function buildLiveState() {
    const events = getTimeline();

    return events.reduce((state, e) => {
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

        return state;
    }, {
        live: false,
        lowerThird: null,
        ticker: "",
        scene: "default",
        logo: "/assets/logo.png"
    });
}

module.exports = { buildLiveState };
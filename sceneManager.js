const { emitEvent } = require("./eventBus");

let scenes = {
    studio: {
        name: "Studio",
        lowerThird: null,
        ticker: "Live from studio",
        logo: "/assets/logo.png"
    },

    breaking: {
        name: "Breaking News",
        lowerThird: "🚨 BREAKING NEWS",
        ticker: "Developing story...",
        logo: "/assets/logo.png"
    },

    interview: {
        name: "Interview",
        lowerThird: "🎤 Live Interview",
        ticker: "Special guest segment",
        logo: "/assets/logo.png"
    }
};

let activeScene = "studio";

function getActiveScene() {
    return {
        id: activeScene,
        ...scenes[activeScene]
    };
}

function listScenes() {
    return Object.keys(scenes);
}

function switchScene(sceneName) {
    if (!scenes[sceneName]) return false;

    activeScene = sceneName;

    emitEvent("SCENE_CHANGE", {
        scene: sceneName,
        data: scenes[sceneName]
    });

    console.log("🎬 Scene switched to:", sceneName);

    return true;
}

module.exports = {
    getActiveScene,
    listScenes,
    switchScene
};

const EventEmitter = require("events");
const bus = new EventEmitter();

// central log (optional debugging)
bus.on("event", (e) => {
    console.log("📡 EVENT:", e.type, e.data);
});

function emitEvent(type, data = {}) {
    const event = { type, data, time: Date.now() };

    bus.emit(type, event);
    bus.emit("event", event); // global logger

    return event;
}

function onEvent(type, handler) {
    bus.on(type, handler);
}

module.exports = {
    emitEvent,
    onEvent
};
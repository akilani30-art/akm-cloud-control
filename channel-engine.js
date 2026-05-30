const fs = require("fs");
const path = require("path");

class ChannelEngine {
  constructor(options) {
    this.broadcast = options.broadcast;
    this.onStateChange = options.onStateChange || (() => {});
    this.playlistFile = options.playlistFile || path.join(__dirname, "channel.json");

    this.playlist = { loop: true, items: [] };
    this.currentIndex = -1;
    this.currentTimer = null;
    this.running = false;
    this.startedAt = null;
    this.currentEndsAt = null;
    this.lastError = null;
  }

  loadPlaylist() {
    const raw = fs.readFileSync(this.playlistFile, "utf8");
    const parsed = JSON.parse(raw);

    if (!parsed || !Array.isArray(parsed.items)) {
      throw new Error("Invalid channel.json format: expected { items: [] }");
    }

    this.playlist = {
      loop: parsed.loop !== false,
      items: parsed.items
    };

    this.lastError = null;
    this._emitState();
    return this.playlist;
  }

  getState() {
    const currentItem =
      this.currentIndex >= 0 && this.currentIndex < this.playlist.items.length
        ? this.playlist.items[this.currentIndex]
        : null;

    return {
      running: this.running,
      currentIndex: this.currentIndex,
      currentItem,
      startedAt: this.startedAt,
      currentEndsAt: this.currentEndsAt,
      playlistCount: this.playlist.items.length,
      loop: this.playlist.loop,
      lastError: this.lastError
    };
  }

  start(index = 0) {
    if (!this.playlist.items.length) {
      this.loadPlaylist();
    }

    if (!this.playlist.items.length) {
      throw new Error("Playlist is empty");
    }

    this.stop(false);
    this.running = true;
    this.currentIndex = this._normalizeIndex(index);
    this._playCurrent();
    this._emitState();
  }

  stop(clearScene = false) {
    this.running = false;

    if (this.currentTimer) {
      clearTimeout(this.currentTimer);
      this.currentTimer = null;
    }

    this.startedAt = null;
    this.currentEndsAt = null;

    if (clearScene) {
      this.broadcast({ type: "lowerthird", show: false });
      this.broadcast({ type: "ticker", show: false });
    }

    this._emitState();
  }

  next() {
    if (!this.playlist.items.length) return;

    if (this.currentTimer) {
      clearTimeout(this.currentTimer);
      this.currentTimer = null;
    }

    const nextIndex = this.currentIndex + 1;

    if (nextIndex >= this.playlist.items.length) {
      if (this.playlist.loop) {
        this.currentIndex = 0;
      } else {
        this.stop();
        return;
      }
    } else {
      this.currentIndex = nextIndex;
    }

    if (this.running) {
      this._playCurrent();
    }

    this._emitState();
  }

  prev() {
    if (!this.playlist.items.length) return;

    if (this.currentTimer) {
      clearTimeout(this.currentTimer);
      this.currentTimer = null;
    }

    const prevIndex = this.currentIndex - 1;

    if (prevIndex < 0) {
      this.currentIndex = this.playlist.loop
        ? this.playlist.items.length - 1
        : 0;
    } else {
      this.currentIndex = prevIndex;
    }

    if (this.running) {
      this._playCurrent();
    }

    this._emitState();
  }

  jump(index) {
    if (!this.playlist.items.length) return;

    if (this.currentTimer) {
      clearTimeout(this.currentTimer);
      this.currentTimer = null;
    }

    this.currentIndex = this._normalizeIndex(index);

    if (this.running) {
      this._playCurrent();
    }

    this._emitState();
  }

  reload() {
    const wasRunning = this.running;
    const oldIndex = this.currentIndex < 0 ? 0 : this.currentIndex;

    this.loadPlaylist();

    if (wasRunning) {
      this.start(Math.min(oldIndex, this.playlist.items.length - 1));
    } else {
      this.currentIndex = Math.min(oldIndex, this.playlist.items.length - 1);
      this._emitState();
    }
  }

  _playCurrent() {
    const item = this.playlist.items[this.currentIndex];
    if (!item) return;

    const durationSec = Number(item.durationSec) || 10;
    this.startedAt = Date.now();
    this.currentEndsAt = this.startedAt + durationSec * 1000;

    // Run all commands for this slot
    if (Array.isArray(item.commands)) {
      for (const cmd of item.commands) {
        this.broadcast(cmd);
      }
    }

    // Optional "after" commands when slot ends
    this.currentTimer = setTimeout(() => {
      if (Array.isArray(item.after)) {
        for (const cmd of item.after) {
          this.broadcast(cmd);
        }
      }
      this.next();
    }, durationSec * 1000);

    this._emitState();
  }

  _normalizeIndex(index) {
    const max = this.playlist.items.length - 1;
    const num = Number(index);

    if (Number.isNaN(num)) return 0;
    if (num < 0) return 0;
    if (num > max) return max;
    return num;
  }

  _emitState() {
    this.onStateChange(this.getState());
  }
}

module.exports = { ChannelEngine };

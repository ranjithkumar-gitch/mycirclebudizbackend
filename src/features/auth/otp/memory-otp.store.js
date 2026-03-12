class MemoryOtpStore {
  #store = new Map();
  #timers = new Map();

  set(key, entry, ttlMs) {
    this.delete(key);
    this.#store.set(key, entry);
    const timer = setTimeout(() => this.delete(key), ttlMs);
    this.#timers.set(key, timer);
  }

  get(key) {
    const entry = this.#store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.delete(key);
      return null;
    }
    return entry;
  }

  update(key, updates) {
    const entry = this.get(key);
    if (!entry) return null;
    const updated = { ...entry, ...updates };
    this.#store.set(key, updated);
    return updated;
  }

  delete(key) {
    this.#store.delete(key);
    const timer = this.#timers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.#timers.delete(key);
    }
  }

  has(key) {
    return this.get(key) !== null;
  }
}

export default new MemoryOtpStore();

const memoryStore = new Map();

export const memoryStorage = {
  getItem(key) {
    return memoryStore.has(key) ? memoryStore.get(key) : null;
  },
  setItem(key, value) {
    memoryStore.set(key, String(value));
  },
  removeItem(key) {
    memoryStore.delete(key);
  },
  clear() {
    memoryStore.clear();
  },
};

export default memoryStorage;

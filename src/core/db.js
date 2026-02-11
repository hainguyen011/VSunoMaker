import Dexie from '../lib/dexie.js';

export const db = new Dexie('VSunoMakerDB');

// Define Schema
db.version(1).stores({
    works: '++id, sunoId, title, artist, status, timestamp, createdAt'
    // id: Auto-increment primary key
    // sunoId, title, artist, status, timestamp, createdAt: Indexed properties for searching/sorting
});

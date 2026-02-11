const fs = require('fs');
const http = require('http');
const path = require('path');

const PORT = 8888;
const WATCH_DIR = path.join(__dirname, '..');
const IGNORE_DIRS = ['.git', 'node_modules', '.aevum', 'scripts'];

let version = 1;

function notifyChange() {
    version++;
    console.log('\x1b[33m%s\x1b[0m', `Change detected! Version: ${version}`);
}

// Simple recursive watcher (Native fs.watch can be inconsistent on some OS/versions, 
// so we'll watch the whole src tree)
function watchRecursive(dir) {
    fs.watch(dir, { recursive: true }, (event, filename) => {
        if (filename) {
            const isIgnored = IGNORE_DIRS.some(d => filename.includes(d));
            if (!isIgnored) {
                notifyChange();
            }
        }
    });
}

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.url === '/version') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ version }));
        return;
    }
    res.writeHead(404);
    res.end();
});

server.listen(PORT, () => {
    console.log('\x1b[32m%s\x1b[0m', `🚀 VSunoMaker Watcher started on http://localhost:${PORT}`);
    console.log('Watching for changes in src/ and manifest.json...');
    watchRecursive(path.join(WATCH_DIR, 'src'));
    fs.watch(path.join(WATCH_DIR, 'manifest.json'), () => notifyChange());
});

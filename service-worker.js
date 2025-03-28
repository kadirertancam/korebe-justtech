// service-worker.js
const CACHE_NAME = 'korebe-game-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/styles.css',
    '/game.js',
    '/mobile-controls.js',
    '/power-ups.js',
    '/game-enhancements.js'
];

// Service Worker Kurulumu
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});
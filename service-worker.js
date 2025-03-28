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
self.addEventListener('install', event => {
    event.waitUntil(
      caches.open(CACHE_NAME)
        .then(cache => {
          console.log('Opened cache');
          // Instead of cache.addAll which fails if any request fails,
          // let's use a more resilient approach
          return Promise.all(
            urlsToCache.map(url => {
              // Try to fetch and cache each resource, but don't fail the entire operation
              // if some resources are missing
              return fetch(url)
                .then(response => {
                  if (response.status === 200) {
                    return cache.put(url, response);
                  }
                  console.log(`Failed to cache: ${url}, status: ${response.status}`);
                  return Promise.resolve();
                })
                .catch(error => {
                  console.log(`Failed to fetch: ${url}, error: ${error}`);
                  return Promise.resolve(); // Continue despite the error
                });
            })
          );
        })
    );
  });
  
  self.addEventListener('fetch', event => {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          // Cache hit - return response
          if (response) {
            return response;
          }
          return fetch(event.request).catch(() => {
            // If the fetch fails (e.g., offline), we can't do much
            console.log('Fetch failed for:', event.request.url);
            // Return a simple offline page or just fail gracefully
          });
        })
    );
  });
  
  self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheWhitelist.indexOf(cacheName) === -1) {
              return caches.delete(cacheName);
            }
          })
        );
      })
    );
  });
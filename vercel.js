{
  "version": 2,
  "builds": [
    { "src": "*.html", "use": "@vercel/static" },
    { "src": "server.js", "use": "@vercel/node" },
    { "src": "*.css", "use": "@vercel/static" },
    { "src": "*.js", "use": "@vercel/node", "config": { "includeFiles": ["*.js"] } }
  ],
  "routes": [
    { "src": "/", "dest": "index.html" },
    { "src": "^/ws/?$", "dest": "server.js", "headers": { "Upgrade": "websocket" } },
    { "src": "/socket.io/(.*)", "dest": "server.js" },
    { "src": "/dynamic-maze.js", "dest": "/dynamic-maze.js" },
    { "src": "/power-ups.js", "dest": "/power-ups.js" },
    { "src": "/game-enhancements.js", "dest": "/game-enhancements.js" },
    { "src": "/korebe-blood-countdown-integration.js", "dest": "/korebe-blood-countdown-integration.js" },
    { "src": "/(.*)", "dest": "/$1" }
  ]
}
// server.js
const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Statik dosyaları serve et
app.use(express.static(__dirname));

// Ana sayfa için yönlendirme
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Oyun odaları
const gameRooms = {};

// Benzersiz ID oluştur
function generateId() {
    return Math.random().toString(36).substring(2, 10);
}

// Mesaj gönderme yardımcı fonksiyonu
function sendToRoom(roomId, message, excludeClientId = null) {
    if (!gameRooms[roomId]) return;
    
    gameRooms[roomId].clients.forEach(client => {
        if (client.id !== excludeClientId && client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(JSON.stringify(message));
        }
    });
}

// WebSocket bağlantı yönetimi
wss.on('connection', (ws) => {
    const clientId = generateId();
    let currentRoom = null;
    
    console.log(`Yeni bağlantı: ${clientId}`);
    
    // Hoş geldin mesajı gönder
    ws.send(JSON.stringify({
        type: 'connected',
        clientId: clientId
    }));
    
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            
            switch (data.type) {
                case 'create_room':
                    // Yeni oda oluştur
                    const roomId = generateId();
                    gameRooms[roomId] = {
                        id: roomId,
                        name: data.roomName || `Oda ${roomId}`,
                        clients: [],
                        ebeId: null,
                        gameStarted: false
                    };
                    
                    // Oda oluşturma cevabı
                    ws.send(JSON.stringify({
                        type: 'room_created',
                        roomId: roomId
                    }));
                    break;
                    
                case 'join_room':
                    // Odaya katıl
                    const roomToJoin = gameRooms[data.roomId];
                    if (!roomToJoin) {
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: 'Oda bulunamadı'
                        }));
                        return;
                    }
                    
                    // Mevcut odadan çık
                    if (currentRoom) {
                        const oldRoom = gameRooms[currentRoom];
                        if (oldRoom) {
                            oldRoom.clients = oldRoom.clients.filter(c => c.id !== clientId);
                            sendToRoom(currentRoom, {
                                type: 'player_left',
                                clientId: clientId
                            });
                            
                            // Ebe ayrıldıysa yeni ebe seç
                            if (oldRoom.ebeId === clientId && oldRoom.clients.length > 0) {
                                oldRoom.ebeId = oldRoom.clients[0].id;
                                sendToRoom(currentRoom, {
                                    type: 'new_ebe',
                                    ebeId: oldRoom.ebeId
                                });
                            }
                        }
                    }
                    
                    // Yeni odaya gir
                    currentRoom = data.roomId;
                    
                    // İstemci bilgilerini ekle
                    const newClient = {
                        id: clientId,
                        ws: ws,
                        username: data.username || `Oyuncu ${clientId}`,
                        x: Math.random() * 800,
                        y: Math.random() * 600,
                        angle: 0,
                        color: data.color || getRandomColor(),
                        isEbe: false
                    };
                    
                    roomToJoin.clients.push(newClient);
                    
                    // İlk giren kişi ebe olsun
                    if (!roomToJoin.ebeId && roomToJoin.clients.length === 1) {
                        roomToJoin.ebeId = clientId;
                        newClient.isEbe = true;
                    }
                    
                    // Odaya katılım cevabı
                    ws.send(JSON.stringify({
                        type: 'room_joined',
                        roomId: data.roomId,
                        isEbe: newClient.isEbe,
                        players: roomToJoin.clients.map(client => ({
                            id: client.id,
                            username: client.username,
                            x: client.x,
                            y: client.y,
                            angle: client.angle,
                            color: client.color,
                            isEbe: client.id === roomToJoin.ebeId
                        }))
                    }));
                    
                    // Diğer oyunculara yeni oyuncuyu bildir
                    sendToRoom(currentRoom, {
                        type: 'player_joined',
                        player: {
                            id: clientId,
                            username: newClient.username,
                            x: newClient.x,
                            y: newClient.y,
                            angle: newClient.angle,
                            color: newClient.color,
                            isEbe: newClient.isEbe
                        }
                    }, clientId);
                    break;
                    
                case 'list_rooms':
                    // Mevcut odaları listele
                    const roomList = Object.values(gameRooms).map(room => ({
                        id: room.id,
                        name: room.name,
                        playerCount: room.clients.length,
                        gameStarted: room.gameStarted
                    }));
                    
                    ws.send(JSON.stringify({
                        type: 'room_list',
                        rooms: roomList
                    }));
                    break;
                    
                case 'start_game':
                    // Oyunu başlat
                    if (currentRoom && gameRooms[currentRoom]) {
                        gameRooms[currentRoom].gameStarted = true;
                        sendToRoom(currentRoom, {
                            type: 'game_started'
                        });
                    }
                    break;
                    
                case 'player_update':
                    // Oyuncu durumunu güncelle
                    if (currentRoom && gameRooms[currentRoom]) {
                        const client = gameRooms[currentRoom].clients.find(c => c.id === clientId);
                        if (client) {
                            // Oyuncu pozisyonunu güncelle
                            client.x = data.x;
                            client.y = data.y;
                            client.angle = data.angle;
                            
                            // Diğer oyunculara bildir
                            sendToRoom(currentRoom, {
                                type: 'player_position',
                                id: clientId,
                                x: data.x,
                                y: data.y,
                                angle: data.angle,
                                isRunning: data.isRunning
                            }, clientId);
                        }
                    }
                    break;
                    
                case 'footprint_created':
                    // Ayak izi oluşturulduğunda diğer oyunculara bildir
                    if (currentRoom) {
                        sendToRoom(currentRoom, {
                            type: 'footprint_created',
                            footprint: data.footprint
                        }, clientId);
                    }
                    break;
                    
                case 'catch_player':
                    // Oyuncu yakalandığında
                    if (currentRoom && gameRooms[currentRoom]) {
                        const room = gameRooms[currentRoom];
                        
                        // Ebe değişimi
                        const oldEbeId = room.ebeId;
                        room.ebeId = data.caughtPlayerId;
                        
                        // Ebe değişimini bildir
                        sendToRoom(currentRoom, {
                            type: 'new_ebe',
                            oldEbeId: oldEbeId,
                            ebeId: room.ebeId
                        });
                        
                        // Oyuncu rollerini güncelle
                        room.clients.forEach(client => {
                            client.isEbe = client.id === room.ebeId;
                        });
                    }
                    break;
            }
        } catch (err) {
            console.error("Mesaj işleme hatası:", err);
        }
    });
    
    ws.on('close', () => {
        console.log(`Bağlantı kapandı: ${clientId}`);
        
        // Bağlantısı kesilen oyuncuyu odadan çıkar
        if (currentRoom && gameRooms[currentRoom]) {
            const room = gameRooms[currentRoom];
            
            room.clients = room.clients.filter(client => client.id !== clientId);
            
            // Odadaki diğer oyunculara bildir
            sendToRoom(currentRoom, {
                type: 'player_left',
                clientId: clientId
            });
            
            // Ebe ayrıldıysa yeni ebe seç
            if (room.ebeId === clientId && room.clients.length > 0) {
                room.ebeId = room.clients[0].id;
                sendToRoom(currentRoom, {
                    type: 'new_ebe',
                    ebeId: room.ebeId
                });
            }
            
            // Oda boşsa odayı sil
            if (room.clients.length === 0) {
                delete gameRooms[currentRoom];
            }
        }
    });
});

// Rastgele renk seçme
function getRandomColor() {
    const colors = ['blue', 'green', 'yellow', 'purple', 'orange', 'cyan', 'magenta'];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Sunucuyu başlat
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda başlatıldı`);
});
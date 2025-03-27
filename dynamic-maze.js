// dynamic-maze.js
// Körebe oyunu için dinamik labirent özellikleri

// Labirent özelliklerini tanımla
const MAZE_FEATURES = {
    WALL: 1,         // Normal duvar
    EMPTY: 0,        // Boş alan
    HIDING_SPOT: 2,  // Gizlenme noktası
    MOVING_WALL: 3,  // Hareketli duvar
    ONE_WAY_DOOR: 4, // Tek yönlü kapı
    SECRET_PATH: 5,  // Gizli geçit
    TELEPORT: 6,     // Teleport noktası
    FOGGY_AREA: 7,   // Sisli alan
    SLIPPERY: 8,     // Kaygan zemin
    NOISY_FLOOR: 9,  // Gürültülü zemin
    DARK_ROOM: 10    // Karanlık oda
};

// Labirent renkleri
const MAZE_COLORS = {
    [MAZE_FEATURES.WALL]: '#444',           // Normal duvar
    [MAZE_FEATURES.EMPTY]: 'transparent',   // Boş alan
    [MAZE_FEATURES.HIDING_SPOT]: '#222',    // Gizlenme yeri
    [MAZE_FEATURES.MOVING_WALL]: '#555',    // Hareketli duvar
    [MAZE_FEATURES.ONE_WAY_DOOR]: '#664400',// Tek yönlü kapı
    [MAZE_FEATURES.SECRET_PATH]: '#333',    // Gizli geçit (normalde duvar gibi görünür)
    [MAZE_FEATURES.TELEPORT]: '#9b59b6',    // Teleport noktası
    [MAZE_FEATURES.FOGGY_AREA]: '#aabbcc',  // Sisli alan
    [MAZE_FEATURES.SLIPPERY]: '#3498db',    // Kaygan zemin
    [MAZE_FEATURES.NOISY_FLOOR]: '#e74c3c', // Gürültülü zemin
    [MAZE_FEATURES.DARK_ROOM]: '#111'       // Karanlık oda
};

// Dinamik labirent yöneticisi
class DynamicMazeManager {
    constructor(maze, tileSize) {
        this.originalMaze = JSON.parse(JSON.stringify(maze)); // Orijinal labirenti kopyala
        this.maze = maze;
        this.tileSize = tileSize;
        
        // Dinamik özellikleri tutan veri yapıları
        this.movingWalls = [];
        this.teleportPairs = [];
        this.secretPaths = [];
        this.oneWayDoors = [];
        this.foggyAreas = [];
        this.slipperyAreas = [];
        this.noisyFloors = [];
        this.darkRooms = [];
        
        // Oyuncu durumu
        this.playerLastPosition = { x: 0, y: 0 };
        this.playerVelocity = { x: 0, y: 0 };
        this.playerInSlipperyArea = false;
        this.playerMadeNoise = false;
        this.activatedSecretPaths = new Set();
        
        // Animasyon değişkenleri
        this.animationTime = 0;
    }
    
    // Bir test labirenti oluştur (orijinal labirentten farklı)
    createTestMaze() {
        // 25x25 boyutunda boş bir labirent
        const testMaze = Array(25).fill().map(() => Array(25).fill(MAZE_FEATURES.EMPTY));
        
        // Dış duvarlar
        for (let i = 0; i < 25; i++) {
            testMaze[0][i] = MAZE_FEATURES.WALL;
            testMaze[24][i] = MAZE_FEATURES.WALL;
            testMaze[i][0] = MAZE_FEATURES.WALL;
            testMaze[i][24] = MAZE_FEATURES.WALL;
        }
        
        // İç duvarlar
        for (let i = 3; i < 22; i += 3) {
            for (let j = 3; j < 22; j += 3) {
                testMaze[i][j] = MAZE_FEATURES.WALL;
            }
        }
        
        // Hareketli duvarlar
        testMaze[5][10] = MAZE_FEATURES.MOVING_WALL;
        testMaze[15][10] = MAZE_FEATURES.MOVING_WALL;
        testMaze[10][5] = MAZE_FEATURES.MOVING_WALL;
        testMaze[10][15] = MAZE_FEATURES.MOVING_WALL;
        
        // Tek yönlü kapılar
        testMaze[7][12] = MAZE_FEATURES.ONE_WAY_DOOR;
        testMaze[17][12] = MAZE_FEATURES.ONE_WAY_DOOR;
        
        // Gizli geçitler
        testMaze[3][3] = MAZE_FEATURES.SECRET_PATH;
        testMaze[21][21] = MAZE_FEATURES.SECRET_PATH;
        
        // Teleport noktaları
        testMaze[5][5] = MAZE_FEATURES.TELEPORT;
        testMaze[20][20] = MAZE_FEATURES.TELEPORT;
        
        // Sisli alanlar
        testMaze[8][8] = MAZE_FEATURES.FOGGY_AREA;
        testMaze[9][8] = MAZE_FEATURES.FOGGY_AREA;
        testMaze[8][9] = MAZE_FEATURES.FOGGY_AREA;
        testMaze[9][9] = MAZE_FEATURES.FOGGY_AREA;
        
        // Kaygan zemin
        testMaze[15][15] = MAZE_FEATURES.SLIPPERY;
        testMaze[16][15] = MAZE_FEATURES.SLIPPERY;
        testMaze[15][16] = MAZE_FEATURES.SLIPPERY;
        testMaze[16][16] = MAZE_FEATURES.SLIPPERY;
        
        // Gürültülü zeminler
        testMaze[12][8] = MAZE_FEATURES.NOISY_FLOOR;
        testMaze[13][8] = MAZE_FEATURES.NOISY_FLOOR;
        
        // Karanlık odalar
        testMaze[18][3] = MAZE_FEATURES.DARK_ROOM;
        testMaze[19][3] = MAZE_FEATURES.DARK_ROOM;
        testMaze[18][4] = MAZE_FEATURES.DARK_ROOM;
        testMaze[19][4] = MAZE_FEATURES.DARK_ROOM;
        
        // Gizlenme yerleri
        testMaze[3][10] = MAZE_FEATURES.HIDING_SPOT;
        testMaze[21][10] = MAZE_FEATURES.HIDING_SPOT;
        testMaze[10][3] = MAZE_FEATURES.HIDING_SPOT;
        testMaze[10][21] = MAZE_FEATURES.HIDING_SPOT;
        
        return testMaze;
    }
    
    // Var olan labirente dinamik öğeler ekle
    enhanceMaze() {
        // Rastgele hareketli duvarlar ekle
        this.addRandomFeature(MAZE_FEATURES.MOVING_WALL, 5);
        
        // Teleport noktası çiftleri ekle
        this.addTeleportPairs(3);
        
        // Tek yönlü kapılar ekle
        this.addRandomFeature(MAZE_FEATURES.ONE_WAY_DOOR, 6);
        
        // Gizli geçitler ekle
        this.addSecretPaths(4);
        
        // Sisli alanlar ekle
        this.addFoggyAreas(2);
        
        // Kaygan zeminler ekle
        this.addRandomFeature(MAZE_FEATURES.SLIPPERY, 8);
        
        // Gürültülü zeminler ekle 
        this.addRandomFeature(MAZE_FEATURES.NOISY_FLOOR, 10);
        
        // Karanlık odalar ekle
        this.addDarkRooms(2);
        
        console.log("Labirent geliştirildi: ", {
            "Hareketli Duvarlar": this.movingWalls.length,
            "Teleport Çiftleri": this.teleportPairs.length,
            "Tek Yönlü Kapılar": this.oneWayDoors.length,
            "Gizli Geçitler": this.secretPaths.length,
            "Sisli Alanlar": this.foggyAreas.length,
            "Kaygan Zeminler": this.slipperyAreas.length,
            "Gürültülü Zeminler": this.noisyFloors.length,
            "Karanlık Odalar": this.darkRooms.length
        });
    }
    
    // Rastgele labirent özelliği ekle
    addRandomFeature(featureType, count) {
        let added = 0;
        let attempts = 0;
        const maxAttempts = 100;
        
        while (added < count && attempts < maxAttempts) {
            attempts++;
            
            // Rastgele bir boş konum seç
            const x = Math.floor(Math.random() * (this.maze[0].length - 2)) + 1;
            const y = Math.floor(Math.random() * (this.maze.length - 2)) + 1;
            
            // Eğer bu konum boşsa veya gizlenme yeriyse
            if (this.maze[y][x] === MAZE_FEATURES.EMPTY || this.maze[y][x] === MAZE_FEATURES.HIDING_SPOT) {
                // Özelliği ekle
                this.maze[y][x] = featureType;
                added++;
                
                // Özellik tipine göre ek veri yapılarına ekle
                switch (featureType) {
                    case MAZE_FEATURES.MOVING_WALL:
                        this.movingWalls.push({
                            x: x,
                            y: y,
                            direction: Math.random() > 0.5 ? 'horizontal' : 'vertical',
                            speed: 0.5 + Math.random() * 1.5, // Hız
                            phase: Math.random() * Math.PI * 2, // Başlangıç fazı
                            amplitude: 1 + Math.floor(Math.random() * 2) // Hareket genliği
                        });
                        break;
                        
                    case MAZE_FEATURES.ONE_WAY_DOOR:
                        this.oneWayDoors.push({
                            x: x,
                            y: y,
                            direction: ['up', 'right', 'down', 'left'][Math.floor(Math.random() * 4)]
                        });
                        break;
                        
                    case MAZE_FEATURES.SLIPPERY:
                        this.slipperyAreas.push({ x: x, y: y });
                        break;
                        
                    case MAZE_FEATURES.NOISY_FLOOR:
                        this.noisyFloors.push({ x: x, y: y });
                        break;
                }
            }
        }
    }
    
    // Teleport çiftlerini ekle
    addTeleportPairs(pairCount) {
        for (let i = 0; i < pairCount; i++) {
            let point1 = null;
            let point2 = null;
            let attempts = 0;
            const maxAttempts = 100;
            
            // İlk teleport noktasını bul
            while (!point1 && attempts < maxAttempts) {
                attempts++;
                const x = Math.floor(Math.random() * (this.maze[0].length - 2)) + 1;
                const y = Math.floor(Math.random() * (this.maze.length - 2)) + 1;
                
                if (this.maze[y][x] === MAZE_FEATURES.EMPTY) {
                    point1 = { x: x, y: y };
                    this.maze[y][x] = MAZE_FEATURES.TELEPORT;
                }
            }
            
            attempts = 0;
            
            // İkinci teleport noktasını bul (yeterince uzak olmalı)
            while (!point2 && attempts < maxAttempts) {
                attempts++;
                const x = Math.floor(Math.random() * (this.maze[0].length - 2)) + 1;
                const y = Math.floor(Math.random() * (this.maze.length - 2)) + 1;
                
                if (this.maze[y][x] === MAZE_FEATURES.EMPTY) {
                    const distance = Math.sqrt((x - point1.x) ** 2 + (y - point1.y) ** 2);
                    
                    // Minimum mesafe kontrolü
                    if (distance > 7) {
                        point2 = { x: x, y: y };
                        this.maze[y][x] = MAZE_FEATURES.TELEPORT;
                    }
                }
            }
            
            // İki nokta da bulunduysa çift oluştur
            if (point1 && point2) {
                this.teleportPairs.push({
                    from: point1,
                    to: point2,
                    cooldown: 3000, // Teleport sonrası bekleme süresi (ms)
                    lastUsed: 0,
                    color: this.getRandomTeleportColor()
                });
                
                this.teleportPairs.push({
                    from: point2,
                    to: point1,
                    cooldown: 3000,
                    lastUsed: 0,
                    color: this.teleportPairs[this.teleportPairs.length - 1].color // Aynı renk
                });
            }
        }
    }
    
    // Gizli geçitler ekle
    addSecretPaths(count) {
        let added = 0;
        let attempts = 0;
        const maxAttempts = 100;
        
        while (added < count && attempts < maxAttempts) {
            attempts++;
            
            // Rastgele bir duvar konumu seç
            const x = Math.floor(Math.random() * (this.maze[0].length - 2)) + 1;
            const y = Math.floor(Math.random() * (this.maze.length - 2)) + 1;
            
            // Eğer bu konum bir duvarsa
            if (this.maze[y][x] === MAZE_FEATURES.WALL) {
                // En az bir boş komşu kontrolü
                const hasEmptyNeighbor = 
                    (y > 0 && this.maze[y-1][x] === MAZE_FEATURES.EMPTY) ||
                    (y < this.maze.length - 1 && this.maze[y+1][x] === MAZE_FEATURES.EMPTY) ||
                    (x > 0 && this.maze[y][x-1] === MAZE_FEATURES.EMPTY) ||
                    (x < this.maze[0].length - 1 && this.maze[y][x+1] === MAZE_FEATURES.EMPTY);
                
                if (hasEmptyNeighbor) {
                    // Gizli geçit ekle
                    this.maze[y][x] = MAZE_FEATURES.SECRET_PATH;
                    
                    // Aktivasyon noktası (trigger) seç
                    let triggerX = -1, triggerY = -1;
                    let triggerAttempts = 0;
                    
                    while ((triggerX === -1 || triggerY === -1) && triggerAttempts < 20) {
                        triggerAttempts++;
                        
                        // Rastgele bir komşu boş alan seç
                        const direction = Math.floor(Math.random() * 4);
                        let tx = x, ty = y;
                        
                        switch (direction) {
                            case 0: ty = y - 1; break; // Yukarı
                            case 1: ty = y + 1; break; // Aşağı
                            case 2: tx = x - 1; break; // Sol
                            case 3: tx = x + 1; break; // Sağ
                        }
                        
                        // Sınırları kontrol et
                        if (ty >= 0 && ty < this.maze.length && tx >= 0 && tx < this.maze[0].length) {
                            // Boş alan mı?
                            if (this.maze[ty][tx] === MAZE_FEATURES.EMPTY) {
                                triggerX = tx;
                                triggerY = ty;
                            }
                        }
                    }
                    
                    // Eğer trigger noktası bulunamazsa bu gizli geçidi atla
                    if (triggerX === -1 || triggerY === -1) {
                        this.maze[y][x] = MAZE_FEATURES.WALL; // Geri duvar yap
                        continue;
                    }
                    
                    // Gizli geçidi kaydet
                    this.secretPaths.push({
                        path: { x: x, y: y },
                        trigger: { x: triggerX, y: triggerY },
                        isActive: false,
                        duration: 5000, // Aktif kalma süresi (ms)
                        activationTime: 0
                    });
                    
                    added++;
                }
            }
        }
    }
    
    // Sisli alanlar ekle
    addFoggyAreas(count) {
        for (let i = 0; i < count; i++) {
            // Merkez nokta seç
            const centerX = Math.floor(Math.random() * (this.maze[0].length - 2)) + 1;
            const centerY = Math.floor(Math.random() * (this.maze.length - 2)) + 1;
            
            // Alan boyutu
            const width = 3 + Math.floor(Math.random() * 3);
            const height = 3 + Math.floor(Math.random() * 3);
            
            // Sisli alanı oluştur
            const foggyArea = {
                x: centerX,
                y: centerY,
                width: width,
                height: height,
                tiles: []
            };
            
            // Sisli alanın tüm karelerini işaretle
            for (let y = Math.max(1, centerY - Math.floor(height/2)); 
                 y < Math.min(this.maze.length - 1, centerY + Math.ceil(height/2)); 
                 y++) {
                for (let x = Math.max(1, centerX - Math.floor(width/2)); 
                     x < Math.min(this.maze[0].length - 1, centerX + Math.ceil(width/2)); 
                     x++) {
                    
                    // Duvar değilse sisli yap
                    if (this.maze[y][x] !== MAZE_FEATURES.WALL) {
                        // Eğer başka özel bir kare değilse
                        if (![MAZE_FEATURES.TELEPORT, MAZE_FEATURES.MOVING_WALL].includes(this.maze[y][x])) {
                            this.maze[y][x] = MAZE_FEATURES.FOGGY_AREA;
                            foggyArea.tiles.push({ x: x, y: y });
                        }
                    }
                }
            }
            
            if (foggyArea.tiles.length > 0) {
                this.foggyAreas.push(foggyArea);
            }
        }
    }
    
    // Karanlık odalar ekle
    addDarkRooms(count) {
        for (let i = 0; i < count; i++) {
            // Merkez nokta seç
            const centerX = Math.floor(Math.random() * (this.maze[0].length - 2)) + 1;
            const centerY = Math.floor(Math.random() * (this.maze.length - 2)) + 1;
            
            // Oda boyutu
            const width = 3 + Math.floor(Math.random() * 2);
            const height = 3 + Math.floor(Math.random() * 2);
            
            // Karanlık odayı oluştur
            const darkRoom = {
                x: centerX,
                y: centerY,
                width: width,
                height: height,
                tiles: []
            };
            
            // Karanlık odanın tüm karelerini işaretle
            for (let y = Math.max(1, centerY - Math.floor(height/2)); 
                 y < Math.min(this.maze.length - 1, centerY + Math.ceil(height/2)); 
                 y++) {
                for (let x = Math.max(1, centerX - Math.floor(width/2)); 
                     x < Math.min(this.maze[0].length - 1, centerX + Math.ceil(width/2)); 
                     x++) {
                    
                    // Duvar değilse karanlık yap
                    if (this.maze[y][x] !== MAZE_FEATURES.WALL) {
                        // Eğer başka özel bir kare değilse
                        if (![MAZE_FEATURES.TELEPORT, MAZE_FEATURES.MOVING_WALL, 
                              MAZE_FEATURES.FOGGY_AREA].includes(this.maze[y][x])) {
                            this.maze[y][x] = MAZE_FEATURES.DARK_ROOM;
                            darkRoom.tiles.push({ x: x, y: y });
                        }
                    }
                }
            }
            
            if (darkRoom.tiles.length > 0) {
                this.darkRooms.push(darkRoom);
            }
        }
    }
    
    // Rastgele teleport rengi
    getRandomTeleportColor() {
        const colors = [
            '#9b59b6', // Mor
            '#3498db', // Mavi
            '#2ecc71', // Yeşil
            '#f1c40f', // Sarı
            '#e74c3c'  // Kırmızı
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    // Hareketli duvarları güncelle
    updateMovingWalls(deltaTime) {
        this.animationTime += deltaTime / 1000; // Saniye cinsinden
        
        // Her hareketli duvar için
        this.movingWalls.forEach(wall => {
            // Duvarın orijinal konumu
            const origX = wall.x;
            const origY = wall.y;
            
            // Sinüs dalgası hareketi
            const sinValue = Math.sin(this.animationTime * wall.speed + wall.phase);
            const offset = sinValue * wall.amplitude;
            
            // Hareketi yönüne göre uygula
            if (wall.direction === 'horizontal') {
                // Duvarın yeni X konumu
                const newX = Math.round(origX + offset);
                
                // Eski konumdan temizle (boş alan yap)
                this.maze[origY][origX] = MAZE_FEATURES.EMPTY;
                
                // Yeni konuma duvar koy (sınırlar içindeyse)
                if (newX >= 0 && newX < this.maze[0].length) {
                    this.maze[origY][newX] = MAZE_FEATURES.MOVING_WALL;
                    wall.currentX = newX;
                    wall.currentY = origY;
                } else {
                    // Sınırlar dışındaysa orijinal konumda tut
                    this.maze[origY][origX] = MAZE_FEATURES.MOVING_WALL;
                    wall.currentX = origX;
                    wall.currentY = origY;
                }
            } else { // 'vertical'
                // Duvarın yeni Y konumu
                const newY = Math.round(origY + offset);
                
                // Eski konumdan temizle (boş alan yap)
                this.maze[origY][origX] = MAZE_FEATURES.EMPTY;
                
                // Yeni konuma duvar koy (sınırlar içindeyse)
                if (newY >= 0 && newY < this.maze.length) {
                    this.maze[newY][origX] = MAZE_FEATURES.MOVING_WALL;
                    wall.currentX = origX;
                    wall.currentY = newY;
                } else {
                    // Sınırlar dışındaysa orijinal konumda tut
                    this.maze[origY][origX] = MAZE_FEATURES.MOVING_WALL;
                    wall.currentX = origX;
                    wall.currentY = origY;
                }
            }
        });
    }
    
    // Gizli geçitleri güncelle
    updateSecretPaths() {
        const currentTime = Date.now();
        
        this.secretPaths.forEach(path => {
            // Eğer aktifse, süresini kontrol et
            if (path.isActive) {
                if (currentTime - path.activationTime > path.duration) {
                    // Süre doldu, geçiti kapat
                    path.isActive = false;
                    this.maze[path.path.y][path.path.x] = MAZE_FEATURES.SECRET_PATH;
                    this.activatedSecretPaths.delete(`${path.path.x},${path.path.y}`);
                }
            }
        });
    }
    
    // Oyuncu pozisyonu güncellendiğinde çağrılır
    playerMovedTo(x, y, isRunning) {
        // Kare koordinatlarını hesapla
        const tileX = Math.floor(x / this.tileSize);
        const tileY = Math.floor(y / this.tileSize);
        
        // Eski kare koordinatları
        const oldTileX = Math.floor(this.playerLastPosition.x / this.tileSize);
        const oldTileY = Math.floor(this.playerLastPosition.y / this.tileSize);
        
        // Eğer yeni bir kareye geçtiyse
        if (tileX !== oldTileX || tileY !== oldTileY) {
            // Teleport kontrolü
            this.checkTeleport(tileX, tileY);
            
            // Gizli geçit tetikleyici kontrolü
            this.checkSecretPathTrigger(tileX, tileY);
            
            // Gürültülü zemin kontrolü
            this.checkNoisyFloor(tileX, tileY, isRunning);
        }
        
        // Kaygan zemin kontrolü
        this.checkSlipperyArea(tileX, tileY);
        
        // Oyuncu hızını hesapla
        const dx = x - this.playerLastPosition.x;
        const dy = y - this.playerLastPosition.y;
        this.playerVelocity = { x: dx, y: dy };
        
        // Son pozisyonu güncelle
        this.playerLastPosition = { x, y };
    }
    
    // Teleport kontrolü
    checkTeleport(tileX, tileY) {
        // Sınır kontrolü
        if (tileX < 0 || tileX >= this.maze[0].length || tileY < 0 || tileY >= this.maze.length) {
            return;
        }
        
        // Teleport noktasında mı?
        if (this.maze[tileY][tileX] === MAZE_FEATURES.TELEPORT) {
            const currentTime = Date.now();
            
            // Teleport çiftini bul
            for (const teleport of this.teleportPairs) {
                if (teleport.from.x === tileX && teleport.from.y === tileY) {
                    // Cooldown kontrolü
                    if (currentTime - teleport.lastUsed > teleport.cooldown) {
                        // Teleport işlemi
                        teleport.lastUsed = currentTime;
                        
                        // Teleport olayını tetikle
                        if (this.onTeleport) {
                            this.onTeleport(
                                teleport.from.x * this.tileSize + this.tileSize / 2,
                                teleport.from.y * this.tileSize + this.tileSize / 2,
                                teleport.to.x * this.tileSize + this.tileSize / 2,
                                teleport.to.y * this.tileSize + this.tileSize / 2,
                                teleport.color
                            );
                        }
                        
                        break;
                    }
                }
            }
        }
    }
    
    // Tek yönlü kapı kontrolü
    canPassThroughOneWayDoor(fromX, fromY, toX, toY) {
        // Kare koordinatlarını hesapla
        const fromTileX = Math.floor(fromX / this.tileSize);
        const fromTileY = Math.floor(fromY / this.tileSize);
        const toTileX = Math.floor(toX / this.tileSize);
        const toTileY = Math.floor(toY / this.tileSize);
        
        // Tek yönlü kapı mı kontrol et
        if (this.maze[toTileY][toTileX] === MAZE_FEATURES.ONE_WAY_DOOR) {
            // Hareket yönünü belirle
            const dx = toTileX - fromTileX;
            const dy = toTileY - fromTileY;
            
            // Kapıyı bul
            for (const door of this.oneWayDoors) {
                if (door.x === toTileX && door.y === toTileY) {
                    // Geçiş yönünü kontrol et
                    switch (door.direction) {
                        case 'up': return dy < 0; // Yukarı doğru geçiş
                        case 'right': return dx > 0; // Sağa doğru geçiş
                        case 'down': return dy > 0; // Aşağı doğru geçiş
                        case 'left': return dx < 0; // Sola doğru geçiş
                    }
                }
            }
        }
        
        // Tek yönlü kapı değilse veya kapı bulunamazsa geçişe izin ver
        return true;
    }
    
    // Gizli geçit tetikleyici kontrolü
    checkSecretPathTrigger(tileX, tileY) {
        // Sınır kontrolü
        if (tileX < 0 || tileX >= this.maze[0].length || tileY < 0 || tileY >= this.maze.length) {
            return;
        }
        
        // Tetikleyicide durulduğunda gizli geçidi aktifleştir
        for (const path of this.secretPaths) {
            if (path.trigger.x === tileX && path.trigger.y === tileY && !path.isActive) {
                // Geçidi aç
                path.isActive = true;
                path.activationTime = Date.now();
                
                // Geçidi görünür yap
                this.maze[path.path.y][path.path.x] = MAZE_FEATURES.EMPTY;
                
                // Aktifleştirilen geçitleri kaydet
                this.activatedSecretPaths.add(`${path.path.x},${path.path.y}`);
                
                // Gizli geçit bulundu olayını tetikle
                if (this.onSecretPathFound) {
                    this.onSecretPathFound(
                        path.trigger.x * this.tileSize + this.tileSize / 2,
                        path.trigger.y * this.tileSize + this.tileSize / 2,
                        path.path.x * this.tileSize + this.tileSize / 2,
                        path.path.y * this.tileSize + this.tileSize / 2
                    );
                }
                
                break;
            }
        }
    }
    
    // Kaygan zemin kontrolü
    checkSlipperyArea(tileX, tileY) {
        // Sınır kontrolü
        if (tileX < 0 || tileX >= this.maze[0].length || tileY < 0 || tileY >= this.maze.length) {
            return false;
        }
        
        // Kaygan zeminde mi?
        this.playerInSlipperyArea = (this.maze[tileY][tileX] === MAZE_FEATURES.SLIPPERY);
        
        return this.playerInSlipperyArea;
    }
    
    // Gürültülü zemin kontrolü
    checkNoisyFloor(tileX, tileY, isRunning) {
        // Sınır kontrolü
        if (tileX < 0 || tileX >= this.maze[0].length || tileY < 0 || tileY >= this.maze.length) {
            return false;
        }
        
        // Gürültülü zeminde mi?
        const onNoisyFloor = (this.maze[tileY][tileX] === MAZE_FEATURES.NOISY_FLOOR);
        
        if (onNoisyFloor) {
            // Gürültü seviyesi - koşarken daha gürültülü
            const noiseLevel = isRunning ? 1.0 : 0.5;
            
            // Gürültü olayını tetikle
            if (this.onNoiseCreated) {
                this.onNoiseCreated(
                    tileX * this.tileSize + this.tileSize / 2,
                    tileY * this.tileSize + this.tileSize / 2,
                    noiseLevel
                );
            }
            
            this.playerMadeNoise = true;
            return true;
        }
        
        return false;
    }
    
    // Özel kare çizimi
    drawSpecialTiles(ctx) {
        // Her özel kare tipini çiz
        for (let y = 0; y < this.maze.length; y++) {
            for (let x = 0; x < this.maze[0].length; x++) {
                const tileType = this.maze[y][x];
                
                // Normal duvar, boş alan ve gizlenme yeri dışındaki özel kareler
                if (tileType !== MAZE_FEATURES.WALL && 
                    tileType !== MAZE_FEATURES.EMPTY && 
                    tileType !== MAZE_FEATURES.HIDING_SPOT) {
                    
                    // Karenin konumu
                    const tileX = x * this.tileSize;
                    const tileY = y * this.tileSize;
                    
                    // Kare rengini belirle
                    let color = MAZE_COLORS[tileType];
                    
                    // Özel kare tiplerine göre ek efektler
                    switch (tileType) {
                        case MAZE_FEATURES.MOVING_WALL:
                            // Hareketli duvar görünümü
                            ctx.fillStyle = color;
                            ctx.fillRect(tileX, tileY, this.tileSize, this.tileSize);
                            
                            // Hareket yönünü belirten ok
                            const wall = this.movingWalls.find(w => w.currentX === x && w.currentY === y);
                            if (wall) {
                                ctx.strokeStyle = 'white';
                                ctx.lineWidth = 2;
                                ctx.beginPath();
                                
                                const centerX = tileX + this.tileSize / 2;
                                const centerY = tileY + this.tileSize / 2;
                                
                                if (wall.direction === 'horizontal') {
                                    // Yatay ok
                                    ctx.moveTo(centerX - 10, centerY);
                                    ctx.lineTo(centerX + 10, centerY);
                                    ctx.moveTo(centerX - 7, centerY - 3);
                                    ctx.lineTo(centerX - 10, centerY);
                                    ctx.lineTo(centerX - 7, centerY + 3);
                                    ctx.moveTo(centerX + 7, centerY - 3);
                                    ctx.lineTo(centerX + 10, centerY);
                                    ctx.lineTo(centerX + 7, centerY + 3);
                                } else {
                                    // Dikey ok
                                    ctx.moveTo(centerX, centerY - 10);
                                    ctx.lineTo(centerX, centerY + 10);
                                    ctx.moveTo(centerX - 3, centerY - 7);
                                    ctx.lineTo(centerX, centerY - 10);
                                    ctx.lineTo(centerX + 3, centerY - 7);
                                    ctx.moveTo(centerX - 3, centerY + 7);
                                    ctx.lineTo(centerX, centerY + 10);
                                    ctx.lineTo(centerX + 3, centerY + 7);
                                }
                                
                                ctx.stroke();
                            }
                            break;
                            
                        case MAZE_FEATURES.ONE_WAY_DOOR:
                            // Tek yönlü kapı görünümü
                            ctx.fillStyle = color;
                            ctx.fillRect(tileX, tileY, this.tileSize, this.tileSize);
                            
                            // Yön oku çiz
                            const door = this.oneWayDoors.find(d => d.x === x && d.y === y);
                            if (door) {
                                ctx.fillStyle = 'white';
                                ctx.beginPath();
                                
                                const centerX = tileX + this.tileSize / 2;
                                const centerY = tileY + this.tileSize / 2;
                                
                                // Yönü belirten ok
                                switch (door.direction) {
                                    case 'up':
                                        ctx.moveTo(centerX, centerY - 10);
                                        ctx.lineTo(centerX - 7, centerY);
                                        ctx.lineTo(centerX + 7, centerY);
                                        break;
                                    case 'right':
                                        ctx.moveTo(centerX + 10, centerY);
                                        ctx.lineTo(centerX, centerY - 7);
                                        ctx.lineTo(centerX, centerY + 7);
                                        break;
                                    case 'down':
                                        ctx.moveTo(centerX, centerY + 10);
                                        ctx.lineTo(centerX - 7, centerY);
                                        ctx.lineTo(centerX + 7, centerY);
                                        break;
                                    case 'left':
                                        ctx.moveTo(centerX - 10, centerY);
                                        ctx.lineTo(centerX, centerY - 7);
                                        ctx.lineTo(centerX, centerY + 7);
                                        break;
                                }
                                
                                ctx.closePath();
                                ctx.fill();
                            }
                            break;
                            
                        case MAZE_FEATURES.SECRET_PATH:
                            // Gizli geçit görünümü (aktif değilse duvar gibi)
                            const pathKey = `${x},${y}`;
                            const isActive = this.activatedSecretPaths.has(pathKey);
                            
                            if (isActive) {
                                // Aktif ise boş alan gibi görünür
                                ctx.fillStyle = MAZE_COLORS[MAZE_FEATURES.EMPTY];
                            } else {
                                // Aktif değilse duvar gibi görünür ama hafif farklı
                                ctx.fillStyle = MAZE_COLORS[MAZE_FEATURES.WALL];
                                ctx.fillRect(tileX, tileY, this.tileSize, this.tileSize);
                                
                                // Küçük bir işaret (gizli olduğunu belli eden)
                                ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                                ctx.beginPath();
                                ctx.arc(tileX + this.tileSize / 2, tileY + this.tileSize / 2, 3, 0, Math.PI * 2);
                                ctx.fill();
                            }
                            break;
                            
                        case MAZE_FEATURES.TELEPORT:
                            // Teleport noktası görünümü
                            // Hangi teleport çiftine ait olduğunu bul
                            const teleport = this.teleportPairs.find(t => t.from.x === x && t.from.y === y);
                            
                            if (teleport) {
                                // Teleport rengi
                                ctx.fillStyle = teleport.color || color;
                                ctx.fillRect(tileX, tileY, this.tileSize, this.tileSize);
                                
                                // Teleport simgesi
                                ctx.fillStyle = 'white';
                                ctx.beginPath();
                                ctx.arc(tileX + this.tileSize / 2, tileY + this.tileSize / 2, 8, 0, Math.PI * 2);
                                ctx.fill();
                                
                                // Teleport cooldown göstergesi
                                const currentTime = Date.now();
                                const cooldownProgress = Math.min(1, (currentTime - teleport.lastUsed) / teleport.cooldown);
                                
                                if (cooldownProgress < 1) {
                                    // Cooldown göstergesi
                                    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                                    ctx.beginPath();
                                    ctx.moveTo(tileX + this.tileSize / 2, tileY + this.tileSize / 2);
                                    ctx.arc(tileX + this.tileSize / 2, tileY + this.tileSize / 2, 
                                          this.tileSize / 2, -Math.PI / 2, 
                                          -Math.PI / 2 + cooldownProgress * Math.PI * 2);
                                    ctx.fill();
                                }
                            } else {
                                // Eğer teleport çifti bulunamazsa varsayılan renk kullan
                                ctx.fillStyle = color;
                                ctx.fillRect(tileX, tileY, this.tileSize, this.tileSize);
                            }
                            break;
                            
                        case MAZE_FEATURES.FOGGY_AREA:
                            // Sisli alan görünümü - yarı saydam gri
                            ctx.fillStyle = 'rgba(200, 200, 200, 0.3)';
                            ctx.fillRect(tileX, tileY, this.tileSize, this.tileSize);
                            break;
                            
                        case MAZE_FEATURES.SLIPPERY:
                            // Kaygan zemin görünümü - mavi kaygan yüzey
                            ctx.fillStyle = color;
                            ctx.fillRect(tileX, tileY, this.tileSize, this.tileSize);
                            
                            // Kaygan zemin simgesi (dalgalı çizgiler)
                            ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
                            ctx.lineWidth = 1;
                            ctx.beginPath();
                            
                            for (let i = 0; i < 3; i++) {
                                const y = tileY + (i + 1) * this.tileSize / 4;
                                ctx.moveTo(tileX + 5, y);
                                ctx.bezierCurveTo(
                                    tileX + this.tileSize / 3, y - 5,
                                    tileX + 2 * this.tileSize / 3, y + 5,
                                    tileX + this.tileSize - 5, y
                                );
                            }
                            
                            ctx.stroke();
                            break;
                            
                        case MAZE_FEATURES.NOISY_FLOOR:
                            // Gürültülü zemin görünümü - kırmızımsı zemin
                            ctx.fillStyle = color;
                            ctx.fillRect(tileX, tileY, this.tileSize, this.tileSize);
                            
                            // Ses dalgaları simgesi
                            ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
                            ctx.lineWidth = 1;
                            
                            const centerX = tileX + this.tileSize / 2;
                            const centerY = tileY + this.tileSize / 2;
                            
                            // Ses dalgaları çiz
                            for (let i = 0; i < 3; i++) {
                                const radius = 5 + i * 5;
                                ctx.beginPath();
                                ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                                ctx.stroke();
                            }
                            break;
                            
                        case MAZE_FEATURES.DARK_ROOM:
                            // Karanlık oda görünümü - koyu gri
                            ctx.fillStyle = color;
                            ctx.fillRect(tileX, tileY, this.tileSize, this.tileSize);
                            break;
                            
                        default:
                            // Tanımlanmamış kare tipleri için varsayılan görünüm
                            ctx.fillStyle = color || 'purple';
                            ctx.fillRect(tileX, tileY, this.tileSize, this.tileSize);
                    }
                }
            }
        }
    }
    
    // Oyuncu üzerindeki etkileri hesapla
    calculateEffectsOnPlayer(player) {
        const effects = {
            applySlippery: false,
            inDarkRoom: false,
            inFoggyArea: false,
            visibilityMultiplier: 1.0
        };
        
        // Oyuncunun bulunduğu kare
        const tileX = Math.floor(player.x / this.tileSize);
        const tileY = Math.floor(player.y / this.tileSize);
        
        // Sınır kontrolü
        if (tileX < 0 || tileX >= this.maze[0].length || tileY < 0 || tileY >= this.maze.length) {
            return effects;
        }
        
        // Kaygan zemin etkisi
        if (this.maze[tileY][tileX] === MAZE_FEATURES.SLIPPERY) {
            effects.applySlippery = true;
        }
        
        // Karanlık oda etkisi
        if (this.maze[tileY][tileX] === MAZE_FEATURES.DARK_ROOM) {
            effects.inDarkRoom = true;
            effects.visibilityMultiplier *= 0.3; // %30 görüş
        }
        
        // Sisli alan etkisi
        if (this.maze[tileY][tileX] === MAZE_FEATURES.FOGGY_AREA) {
            effects.inFoggyArea = true;
            effects.visibilityMultiplier *= 0.6; // %60 görüş
        }
        
        return effects;
    }
    
    // Olay dinleyicileri
    setEventListener(event, callback) {
        switch (event) {
            case 'teleport':
                this.onTeleport = callback;
                break;
            case 'secretPathFound':
                this.onSecretPathFound = callback;
                break;
            case 'noiseCreated':
                this.onNoiseCreated = callback;
                break;
        }
    }
}

// Dinamik labirent sistemini dışa aktar
window.DynamicMazeSystem = {
    DynamicMazeManager,
    MAZE_FEATURES,
    MAZE_COLORS
};
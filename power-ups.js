// power-ups.js
// Körebe oyunu için güç-up sistemi

// Tüm güç-up tiplerini tanımla
const POWERUP_TYPES = {
    SPEED_POTION: {
        id: 'speed_potion',
        name: 'Hız İksiri',
        description: 'Hızınızı 10 saniye boyunca artırır',
        duration: 10000,
        iconColor: '#3498db',
        iconSymbol: '⚡',
        rarity: 'common',
        // Sadece ebe olmayanlar kullanabilir
        validFor: (isEbe) => !isEbe
    },
    INVISIBILITY: {
        id: 'invisibility',
        name: 'Görünmezlik Pelerini',
        description: '10 saniye boyunca neredeyse tamamen görünmez olursunuz',
        duration: 10000,
        iconColor: '#9b59b6',
        iconSymbol: '👻',
        rarity: 'rare',
        // Sadece ebe olmayanlar kullanabilir
        validFor: (isEbe) => !isEbe
    },
    SILENT_STEPS: {
        id: 'silent_steps',
        name: 'Sessiz Adımlar',
        description: '15 saniye boyunca ayak izi bırakmazsınız',
        duration: 15000,
        iconColor: '#2ecc71',
        iconSymbol: '👣',
        rarity: 'uncommon',
        // Sadece ebe olmayanlar kullanabilir
        validFor: (isEbe) => !isEbe
    },
    RADAR: {
        id: 'radar',
        name: 'Radar',
        description: '5 saniye boyunca ebenin konumunu gösterir',
        duration: 5000,
        iconColor: '#f1c40f',
        iconSymbol: '📡',
        rarity: 'uncommon',
        // Sadece ebe olmayanlar kullanabilir
        validFor: (isEbe) => !isEbe
    },
    LANTERN: {
        id: 'lantern',
        name: 'Fener',
        description: '15 saniye boyunca görüş açınız genişler',
        duration: 15000,
        iconColor: '#e67e22', 
        iconSymbol: '🔦',
        rarity: 'common',
        // Sadece ebeler kullanabilir
        validFor: (isEbe) => isEbe
    },
    DASH_RECHARGE: {
        id: 'dash_recharge',
        name: 'Dash Şarjı',
        description: 'Tüm dash haklarınızı anında doldurur',
        duration: 0, // Anlık etki
        iconColor: '#e74c3c',
        iconSymbol: '💨',
        rarity: 'uncommon',
        // Sadece ebeler kullanabilir
        validFor: (isEbe) => isEbe
    }
};

// Güç-up yöneticisi
class PowerUpManager {
    constructor(player, gameState) {
        this.player = player;
        this.gameState = gameState;
        this.activePowerUps = [];
        this.inventory = [];
        this.maxInventory = 3; // Maksimum 3 güç-up taşıyabilir
        this.spawnPoints = []; // Güç-up oluşturma noktaları
        this.worldPowerUps = []; // Dünyada bulunan güç-uplar
        this.powerUpElements = {}; // UI elementleri
        this.UI = null; // Ana UI element
        
        // Modifikasyon katsayıları - güç-uplar bunları etkiler
        this.modifiers = {
            speedMultiplier: 1,
            visibilityMultiplier: 1,
            leavesFootprints: true,
            viewAngleMultiplier: 1,
            viewDistanceMultiplier: 1
        };
        
        // Event listener'ları
        this.eventListeners = {
            onPowerUpCollected: [],
            onPowerUpActivated: [],
            onPowerUpDeactivated: [],
            onPowerUpExpired: []
        };
    }
    
    // Oyuncunun güncel modifikasyonlarını al
    getModifiers() {
        return {...this.modifiers};
    }
    
    // Güç-up oluşturma noktaları oluştur
    setupSpawnPoints(maze, tileSize) {
        this.spawnPoints = [];
        
        // Labirentin boş alanlarında rastgele güç-up spawn noktaları oluştur
        for (let y = 0; y < maze.length; y++) {
            for (let x = 0; x < maze[y].length; x++) {
                // Boş alanlarda (0) ve gizlenme yerlerinde (2) güç-up oluşturabilir
                if (maze[y][x] === 0 || maze[y][x] === 2) {
                    // Her boş alan bir spawn noktası değil - rastgele seç
                    if (Math.random() < 0.05) { // %5 ihtimalle
                        this.spawnPoints.push({
                            x: x * tileSize + tileSize / 2,
                            y: y * tileSize + tileSize / 2
                        });
                    }
                }
            }
        }
        
        console.log(`${this.spawnPoints.length} güç-up spawn noktası oluşturuldu`);
    }
    
    // Dünyada güç-up oluştur
    spawnPowerUps(count = 5) {
        if (this.spawnPoints.length === 0) {
            console.error('Güç-up oluşturma noktaları ayarlanmamış!');
            return;
        }
        
        // Belirtilen sayıda güç-up oluştur
        for (let i = 0; i < count; i++) {
            // Rastgele bir spawn noktası seç
            const spawnIndex = Math.floor(Math.random() * this.spawnPoints.length);
            const spawnPoint = this.spawnPoints[spawnIndex];
            
            // Rastgele bir güç-up tipi seç
            const powerUpTypes = Object.values(POWERUP_TYPES);
            let selectedType;
            let attempts = 0;
            
            // Oyuncu için geçerli bir güç-up seç (ebe durumuna göre)
            do {
                const randomIndex = Math.floor(Math.random() * powerUpTypes.length);
                selectedType = powerUpTypes[randomIndex];
                attempts++;
                
                // Sonsuz döngüye girmeyi önlemek için
                if (attempts > 20) {
                    // Varsayılan olarak herkes için geçerli bir güç-up seç
                    selectedType = POWERUP_TYPES.SPEED_POTION;
                    break;
                }
            } while (!this.isValidSpawn(selectedType));
            
            // Dünyaya güç-up ekle
            this.worldPowerUps.push({
                type: selectedType,
                x: spawnPoint.x,
                y: spawnPoint.y,
                radius: 15, // Güç-up boyutu
                spawnTime: Date.now(),
                pulsePhase: Math.random() * Math.PI * 2 // Rastgele başlangıç fazı
            });
        }
    }
    
    // Belirli bir oyun durumunda (ebe vs normal) güç-up oluşumu geçerli mi?
    isValidSpawn(powerUpType) {
        // Rastgele olasılık - nadir güç-uplar daha az sıklıkla oluşur
        let rarityChance = 1;
        switch (powerUpType.rarity) {
            case 'common': rarityChance = 0.6; break;
            case 'uncommon': rarityChance = 0.3; break;
            case 'rare': rarityChance = 0.1; break;
        }
        
        if (Math.random() > rarityChance) {
            return false;
        }
        
        // Oyun moduna göre (ebe/normal) filtrele
        return true; // Basitleştirilmiş - tüm güç-uplar oluşturulabilir
    }
    
    // Güç-up toplama kontrolü
    checkPowerUpCollection(playerX, playerY, playerSize) {
        const collectedIndices = [];
        
        // Dünya üzerindeki tüm güç-upları kontrol et
        this.worldPowerUps.forEach((powerUp, index) => {
            const dist = this.distance(playerX, playerY, powerUp.x, powerUp.y);
            
            // Toplama mesafesi kontrolü
            if (dist < playerSize + powerUp.radius) {
                // Güç-up'ı envanterimize ekle, fakat envanter doluysa ekleme
                if (this.inventory.length < this.maxInventory) {
                    this.inventory.push(powerUp.type);
                    collectedIndices.push(index);
                    
                    // Toplama olayını tetikle
                    this.triggerEvent('onPowerUpCollected', powerUp.type);
                    
                    // UI'ı güncelle
                    this.updateUI();
                } else {
                    console.log('Envanter dolu, güç-up toplanamadı!');
                }
            }
        });
        
        // Toplanan güç-upları dünyadan kaldır (tersten giderek indeks karışıklığı olmaması için)
        for (let i = collectedIndices.length - 1; i >= 0; i--) {
            this.worldPowerUps.splice(collectedIndices[i], 1);
        }
        
        // Eğer dünyada az sayıda güç-up kaldıysa yeni güç-uplar oluştur
        if (this.worldPowerUps.length < 3 && Math.random() < 0.01) { // %1 şans
            this.spawnPowerUps(1); // Yeni bir güç-up oluştur
        }
    }
    
    // Güç-upları çiz
    drawPowerUps(ctx, camera) {
        const currentTime = Date.now();
        
        ctx.save();
        
        // Dünya üzerindeki güç-upları çiz
        this.worldPowerUps.forEach(powerUp => {
            // Pulsing (yanıp sönen) efekt için hesaplamalar
            const pulseSpeed = 2; // Nabız hızı
            const elapsedTime = (currentTime - powerUp.spawnTime) / 1000;
            const pulseFactor = 0.2 * Math.sin(pulseSpeed * elapsedTime + powerUp.pulsePhase) + 1;
            
            // Güç-up dairesini çiz
            ctx.fillStyle = powerUp.type.iconColor;
            ctx.beginPath();
            ctx.arc(powerUp.x, powerUp.y, powerUp.radius * pulseFactor, 0, Math.PI * 2);
            ctx.fill();
            
            // Güç-up sembolünü çiz
            ctx.fillStyle = 'white';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(powerUp.type.iconSymbol, powerUp.x, powerUp.y);
        });
        
        ctx.restore();
    }
    
    // Güç-up kullan
    activatePowerUp(index) {
        if (index < 0 || index >= this.inventory.length) {
            console.error('Geçersiz güç-up indeksi!');
            return false;
        }
        
        const powerUpType = this.inventory[index];
        
        // Güç-up, mevcut oyuncu durumu için geçerli mi kontrol et
        if (!powerUpType.validFor(this.gameState.isEbe)) {
            console.log(`${powerUpType.name} şu anda kullanılamaz (ebe durumuna uygun değil)`);
            return false;
        }
        
        // Güç-up'ı envanterden kaldır
        this.inventory.splice(index, 1);
        
        // Aktif güç-up listesine ekle (süreli etkileri olanlar için)
        if (powerUpType.duration > 0) {
            const activePowerUp = {
                type: powerUpType,
                startTime: Date.now(),
                endTime: Date.now() + powerUpType.duration,
                id: Math.random().toString(36).substring(2, 9) // Benzersiz ID
            };
            
            this.activePowerUps.push(activePowerUp);
            
            // Güç-up etkilerini uygula
            this.applyPowerUpEffects(powerUpType, true);
            
            // Güç-up'ın süresini kontrol etmek için zamanlayıcı
            setTimeout(() => {
                this.deactivatePowerUp(activePowerUp.id);
            }, powerUpType.duration);
            
            // Aktifleştirme olayını tetikle
            this.triggerEvent('onPowerUpActivated', powerUpType);
        } else {
            // Anlık etkisi olan güç-uplar için
            this.applyInstantPowerUpEffect(powerUpType);
            
            // Aktifleştirme olayını tetikle
            this.triggerEvent('onPowerUpActivated', powerUpType);
            
            // Anında sona erme olayını tetikle
            this.triggerEvent('onPowerUpExpired', powerUpType);
        }
        
        // UI'ı güncelle
        this.updateUI();
        
        return true;
    }
    
    // Güç-up'ı devre dışı bırak
    deactivatePowerUp(powerUpId) {
        const index = this.activePowerUps.findIndex(p => p.id === powerUpId);
        
        if (index === -1) return false;
        
        const powerUp = this.activePowerUps[index];
        
        // Güç-up'ı aktif listeden kaldır
        this.activePowerUps.splice(index, 1);
        
        // Güç-up etkilerini kaldır
        this.applyPowerUpEffects(powerUp.type, false);
        
        // Devre dışı bırakma olayını tetikle
        this.triggerEvent('onPowerUpDeactivated', powerUp.type);
        
        // Sona erme olayını tetikle
        this.triggerEvent('onPowerUpExpired', powerUp.type);
        
        // UI'ı güncelle
        this.updateUI();
        
        return true;
    }
    
    // Aktif güç-upların durumunu güncelle
    updateActivePowerUps() {
        const currentTime = Date.now();
        const expiredPowerUps = [];
        
        // Süresi dolan güç-upları bul
        this.activePowerUps.forEach(powerUp => {
            if (currentTime >= powerUp.endTime) {
                expiredPowerUps.push(powerUp.id);
            }
        });
        
        // Süresi dolan güç-upları devre dışı bırak
        expiredPowerUps.forEach(powerUpId => {
            this.deactivatePowerUp(powerUpId);
        });
    }
    
    // Güç-up'ın etkilerini uygula/kaldır
    applyPowerUpEffects(powerUpType, activate) {
        // Her güç-up tipi için farklı etkiler
        switch (powerUpType.id) {
            case 'speed_potion':
                // Hız modifikasyonu
                if (activate) {
                    this.modifiers.speedMultiplier = 2.0; // 2x hız
                } else {
                    this.modifiers.speedMultiplier = 1.0; // Normal hız
                }
                break;
                
            case 'invisibility':
                // Görünürlük modifikasyonu
                if (activate) {
                    this.modifiers.visibilityMultiplier = 0.2; // %20 görünürlük (neredeyse görünmez)
                } else {
                    this.modifiers.visibilityMultiplier = 1.0; // Normal görünürlük
                }
                break;
                
            case 'silent_steps':
                // Ayak izi bırakma modifikasyonu
                if (activate) {
                    this.modifiers.leavesFootprints = false; // Ayak izi bırakmaz
                } else {
                    this.modifiers.leavesFootprints = true; // Normal ayak izi bırakır
                }
                break;
                
            case 'radar':
                // Radar modifikasyonu - client tarafında özel işlem gerektirir
                if (activate) {
                    this.gameState.radarActive = true;
                } else {
                    this.gameState.radarActive = false;
                }
                break;
                
            case 'lantern':
                // Görüş açısı modifikasyonu
                if (activate) {
                    this.modifiers.viewAngleMultiplier = 1.5; // Görüş açısı %50 artar
                    this.modifiers.viewDistanceMultiplier = 1.3; // Görüş mesafesi %30 artar
                } else {
                    this.modifiers.viewAngleMultiplier = 1.0; // Normal görüş açısı
                    this.modifiers.viewDistanceMultiplier = 1.0; // Normal görüş mesafesi
                }
                break;
        }
    }
    
    // Anlık etkili güç-uplar için
    applyInstantPowerUpEffect(powerUpType) {
        switch (powerUpType.id) {
            case 'dash_recharge':
                // Dash haklarını anında doldur
                if (this.player.dashCount !== undefined) {
                    this.player.dashCount = this.player.maxDashCount || 3; // Maksimum dash hakkı
                }
                break;
                
            // Diğer anlık etkili güç-uplar burada eklenebilir
        }
    }
    
    // Event sistemi
    addEventListener(event, callback) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].push(callback);
        }
    }
    
    removeEventListener(event, callback) {
        if (this.eventListeners[event]) {
            this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
        }
    }
    
    triggerEvent(event, data) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].forEach(callback => callback(data));
        }
    }
    
    // Yardımcı fonksiyonlar
    distance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    }
    
    // UI hazırlama
    setupUI() {
        // Daha önceden oluşturulmuş bir UI element varsa temizle
        if (this.UI) {
            this.UI.remove();
        }
        
        // Ana UI container
        this.UI = document.createElement('div');
        this.UI.id = 'powerup-ui';
        this.UI.className = 'game-ui-element';
        this.UI.style.cssText = `
            position: absolute;
            left: 10px;
            top: 10px;
            background-color: rgba(0, 0, 0, 0.7);
            border-radius: 5px;
            padding: 10px;
            display: flex;
            flex-direction: column;
            z-index: 100;
        `;
        
        // UI başlığı
        const title = document.createElement('div');
        title.textContent = 'Güç-Uplar';
        title.style.cssText = `
            color: white;
            font-family: Arial, sans-serif;
            font-size: 14px;
            margin-bottom: 5px;
            text-align: center;
        `;
        this.UI.appendChild(title);
        
        // Güç-uplar container
        const powerupsContainer = document.createElement('div');
        powerupsContainer.id = 'powerups-container';
        powerupsContainer.style.cssText = `
            display: flex;
            gap: 5px;
        `;
        this.UI.appendChild(powerupsContainer);
        
        // Güç-up slotları
        for (let i = 0; i < this.maxInventory; i++) {
            const slot = document.createElement('div');
            slot.className = 'powerup-slot';
            slot.dataset.index = i;
            slot.style.cssText = `
                width: 40px;
                height: 40px;
                background-color: rgba(255, 255, 255, 0.1);
                border-radius: 5px;
                display: flex;
                justify-content: center;
                align-items: center;
                font-size: 20px;
                color: white;
                cursor: pointer;
                position: relative;
            `;
            
            // Tuş kısayolu etiketi
            const keyLabel = document.createElement('div');
            keyLabel.textContent = (i + 1).toString();
            keyLabel.style.cssText = `
                position: absolute;
                bottom: 2px;
                right: 2px;
                font-size: 10px;
                color: rgba(255, 255, 255, 0.7);
            `;
            slot.appendChild(keyLabel);
            
            // Slot'a tıklandığında güç-up kullan
            slot.addEventListener('click', () => {
                this.activatePowerUp(i);
            });
            
            powerupsContainer.appendChild(slot);
            this.powerUpElements[i] = slot;
        }
        
        // Aktif güç-uplar container
        const activeContainer = document.createElement('div');
        activeContainer.id = 'active-powerups';
        activeContainer.style.cssText = `
            margin-top: 5px;
            display: flex;
            flex-direction: column;
            gap: 3px;
        `;
        this.UI.appendChild(activeContainer);
        
        // Document body'e ekle
        document.body.appendChild(this.UI);
        
        // UI'ı ilk kez güncelle
        this.updateUI();
    }
    
    // UI güncelleme
    updateUI() {
        if (!this.UI) {
            this.setupUI();
            return;
        }
        
        // Envanterdeki güç-upları güncelle
        for (let i = 0; i < this.maxInventory; i++) {
            const slot = this.powerUpElements[i];
            
            if (i < this.inventory.length) {
                const powerUpType = this.inventory[i];
                slot.innerHTML = ''; // İçeriği temizle
                
                // Güç-up ikonu
                const icon = document.createElement('div');
                icon.textContent = powerUpType.iconSymbol;
                icon.style.cssText = `
                    font-size: 24px;
                `;
                slot.appendChild(icon);
                
                // Güç-up tuş kısayolu
                const keyLabel = document.createElement('div');
                keyLabel.textContent = (i + 1).toString();
                keyLabel.style.cssText = `
                    position: absolute;
                    bottom: 2px;
                    right: 2px;
                    font-size: 10px;
                    color: rgba(255, 255, 255, 0.7);
                `;
                slot.appendChild(keyLabel);
                
                // Arka plan rengini güç-up'a göre ayarla
                slot.style.backgroundColor = powerUpType.iconColor;
                
                // Tooltip ekle
                slot.title = `${powerUpType.name}: ${powerUpType.description}`;
            } else {
                // Boş slot
                slot.innerHTML = '';
                slot.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                slot.title = 'Boş slot';
                
                // Güç-up tuş kısayolu
                const keyLabel = document.createElement('div');
                keyLabel.textContent = (i + 1).toString();
                keyLabel.style.cssText = `
                    position: absolute;
                    bottom: 2px;
                    right: 2px;
                    font-size: 10px;
                    color: rgba(255, 255, 255, 0.7);
                `;
                slot.appendChild(keyLabel);
            }
        }
        
        // Aktif güç-upları güncelle
        const activeContainer = document.getElementById('active-powerups');
        activeContainer.innerHTML = '';
        
        this.activePowerUps.forEach((powerUp) => {
            const remainingTime = Math.max(0, powerUp.endTime - Date.now());
            const remainingSeconds = Math.ceil(remainingTime / 1000);
            
            const activeItem = document.createElement('div');
            activeItem.className = 'active-powerup-item';
            activeItem.style.cssText = `
                display: flex;
                align-items: center;
                gap: 5px;
                padding: 3px;
                border-radius: 3px;
                background-color: ${powerUp.type.iconColor}33; /* 20% opaklık */
            `;
            
            // İkon
            const icon = document.createElement('div');
            icon.textContent = powerUp.type.iconSymbol;
            icon.style.cssText = `
                width: 20px;
                height: 20px;
                display: flex;
                justify-content: center;
                align-items: center;
                font-size: 16px;
                color: ${powerUp.type.iconColor};
            `;
            activeItem.appendChild(icon);
            
            // İsim
            const name = document.createElement('div');
            name.textContent = powerUp.type.name;
            name.style.cssText = `
                color: white;
                font-family: Arial, sans-serif;
                font-size: 12px;
                flex-grow: 1;
            `;
            activeItem.appendChild(name);
            
            // Kalan süre
            const time = document.createElement('div');
            time.textContent = `${remainingSeconds}s`;
            time.style.cssText = `
                color: white;
                font-family: Arial, sans-serif;
                font-size: 12px;
                width: 30px;
                text-align: right;
            `;
            activeItem.appendChild(time);
            
            activeContainer.appendChild(activeItem);
        });
        
        // Aktif güç-up yoksa mesaj göster
        if (this.activePowerUps.length === 0) {
            activeContainer.style.display = 'none';
        } else {
            activeContainer.style.display = 'flex';
        }
    }
}

// Güç-up sistemini dışa aktar
window.PowerUpSystem = {
    PowerUpManager,
    POWERUP_TYPES
};
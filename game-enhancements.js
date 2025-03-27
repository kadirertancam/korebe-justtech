// game-enhancements.js
// Körebe oyunu için tüm ek özellikler ve entegrasyonlar

// ----------------------
// GENEL DEĞİŞKENLER
// ----------------------
let powerUpManager = null; // Güç-up yöneticisi
let mazeManager = null; // Dinamik labirent yöneticisi
let particleSystem = null; // Parçacık sistemi
let soundEngine = null; // Ses motoru
let gameUI = null; // Oyun arayüzü
let particleEffects = []; // Parçacık efektleri (teleport, ses dalgaları, vb.)
let effectSounds = {}; // Efekt sesleri
let gameMode = 'classic'; // Oyun modu (classic, infection, treasure, timeAttack, teams)
let playerClasses = {}; // Oyuncu sınıfları
let treasureLocations = []; // Hazine konumları (hazine avcısı modu için)
let achievements = []; // Başarı/görevler
let playerStats = {}; // Oyuncu istatistikleri
let storyElements = []; // Hikaye elementleri
let gameTimer = 0; // Oyun zamanlayıcısı
let timerInterval = null; // Zamanlayıcı interval
let selectedCharacterType = 'runner'; // Seçilen karakter tipi
let gameState = 'menu'; // Oyun durumu (menu, playing, paused, gameOver)
let aiPlayers = []; // Bot oyuncular
let showFps = false; // FPS gösterimi

// ----------------------
// OYUN ENTEGRASYONU
// ----------------------

// Ana başlatma fonksiyonu - oyun başlatıldığında çağrılır
function initGameEnhancements() {
    console.log("Oyun geliştirmeleri başlatılıyor...");
    
    // Ses motorunu başlat
    soundEngine = new SoundEngine();
    soundEngine.init();
    
    // Parçacık sistemini başlat
    particleSystem = new ParticleSystem();
    
    // Karakter sınıflarını tanımla
    initCharacterClasses();
    
    // Başarıları tanımla
    initAchievements();
    
    // UI'ı başlat
    gameUI = new GameUI();
    gameUI.init();
    
    // Ana menüyü göster
    gameUI.showScreen('main-menu');
    
    console.log("Oyun geliştirmeleri başlatıldı");
}

// Oyunu başlat
function startGame() {
    console.log(`Oyun başlatılıyor... Mod: ${gameMode}, Karakter: ${selectedCharacterType}`);
    
    // Oyun durumunu güncelle
    gameState = 'playing';
    
    // Karakter sınıfına göre oyuncu özelliklerini ayarla
    setupPlayerClass();
    
    // Labirenti dinamik hale getir
    setupDynamicMaze();
    
    // Güç-up sistemini başlat
    setupPowerUpSystem();
    
    // Seçilen oyun modunu başlat
    startGameMode();
    
    // Arkaplan müziğini başlat
    if (soundEngine) {
        soundEngine.playBackgroundMusic('music_game');
    }
    
    // HUD'u göster
    gameUI.elements.hud.style.display = 'flex';
    
    console.log("Oyun başlatıldı");
}

// Oyunu duraklat
function pauseGame() {
    if (gameState !== 'playing') return;
    
    console.log("Oyun duraklatıldı");
    gameState = 'paused';
    
    // Zamanlayıcıyı durdur
    clearInterval(timerInterval);
    
    // Duraklatma menüsünü göster
    gameUI.showScreen('pause-menu');
}

// Oyunu devam ettir
function resumeGame() {
    if (gameState !== 'paused') return;
    
    console.log("Oyun devam ediyor");
    gameState = 'playing';
    
    // Zamanlayıcıyı devam ettir
    if (gameTimer > 0) {
        startGameTimer(gameTimer);
    }
}

// Oyundan çık
function quitGame() {
    console.log("Oyundan çıkılıyor");
    
    // Zamanlayıcıyı durdur
    clearInterval(timerInterval);
    
    // Oyun durumunu güncelle
    gameState = 'menu';
    
    // Oyun müziğini durdur
    if (soundEngine && soundEngine.backgroundMusic) {
        soundEngine.stopSound(soundEngine.backgroundMusic);
    }
    
    // Ana menüyü göster
    gameUI.showScreen('main-menu');
    
    // Oyun verilerini temizle
    resetGameData();
}

// Oyunu bitir
function endGame() {
    console.log("Oyun bitti");
    
    // Zamanlayıcıyı durdur
    clearInterval(timerInterval);
    
    // Oyun durumunu güncelle
    gameState = 'gameOver';
    
    // Sonuçları hesapla
    const gameMode = GAME_MODES[gameMode.toUpperCase()] || GAME_MODES.CLASSIC;
    const winner = gameMode.getWinner();
    
    // Sonuç ekranını hazırla
    const resultElement = document.getElementById('game-result');
    const statsElement = document.getElementById('game-stats');
    
    if (resultElement) {
        if (winner) {
            if (Array.isArray(winner)) {
                resultElement.textContent = `Kazananlar: ${winner.map(p => p.name).join(', ')}`;
            } else {
                resultElement.textContent = `Kazanan: ${winner.name}`;
            }
        } else {
            resultElement.textContent = 'Berabere!';
        }
    }
    
    if (statsElement) {
        // Oyun istatistiklerini göster
        let statsText = '';
        Object.values(players).forEach(player => {
            statsText += `${player.name}: `;
            
            if (gameMode.id === 'treasure') {
                statsText += `${player.treasures || 0} hazine\n`;
            } else if (gameMode.id === 'infection') {
                statsText += player.isEbe ? 'Enfekte oldu' : 'Hayatta kaldı';
                statsText += '\n';
            } else {
                statsText += `${player.stats.tags || 0} ebeleme, ${player.stats.tagged || 0} ebelenme\n`;
            }
        });
        
        statsElement.textContent = statsText;
    }
    
    // Oyun sonu ekranını göster
    gameUI.showScreen('game-over');
}

// Oyun zamanlayıcısını başlat
function startGameTimer(seconds) {
    // Önceki zamanlayıcıyı temizle
    clearInterval(timerInterval);
    
    // Zamanlayıcıyı ayarla
    gameTimer = seconds;
    gameUI.updateTimer(gameTimer);
    
    // Her saniye güncelle
    timerInterval = setInterval(() => {
        gameTimer--;
        gameUI.updateTimer(gameTimer);
        
        // Süre doldu mu kontrol et
        if (gameTimer <= 0) {
            clearInterval(timerInterval);
            
            // Seçilen oyun moduna göre süre dolunca ne olacağını belirle
            const gameMode = GAME_MODES[gameMode.toUpperCase()] || GAME_MODES.CLASSIC;
            if (gameMode.isGameOver()) {
                endGame();
            }
        }
    }, 1000);
}

// Oyun verilerini sıfırla
function resetGameData() {
    // Tüm oyuncuları sıfırla
    Object.values(players).forEach(player => {
        player.isEbe = false;
        player.isTagged = false;
        player.isImmune = false;
        player.treasures = 0;
        player.stats = {
            tags: 0,
            tagged: 0,
            timeAsEbe: 0,
            treasuresCollected: 0,
            infectionTime: 0
        };
    });
    
    // Oyun değişkenlerini sıfırla
    gameTimer = 0;
    clearInterval(timerInterval);
    treasureLocations = [];
    
    // Modülleri sıfırla
    if (powerUpManager) {
        // PowerUpManager'ı temizle
        if (powerUpManager.UI) {
            powerUpManager.UI.remove();
        }
        powerUpManager = null;
    }
    
    if (mazeManager) {
        // Dinamik labirenti sıfırla
        mazeManager = null;
    }
}

// Dinamik labirenti kur
function setupDynamicMaze() {
    // Mevcut mazeManager'ı temizle
    if (mazeManager) {
        mazeManager = null;
    }
    
    // Dinamik labirent yöneticisi oluştur
    mazeManager = new DynamicMazeManager(maze, TILE_SIZE);
    
    // Labirenti geliştir
    mazeManager.enhanceMaze();
    
    // Teleport olayları
    mazeManager.setEventListener('teleport', (fromX, fromY, toX, toY, color) => {
        // Oyuncu teleport edilecek
        myPlayer.x = toX;
        myPlayer.y = toY;
        
        // Teleport efektleri
        if (particleSystem) {
            // Başlangıç noktasında parçacık efekti
            particleSystem.createParticles(fromX, fromY, 'teleport', 30, { color: color });
            
            // Bitiş noktasında parçacık efekti
            setTimeout(() => {
                particleSystem.createParticles(toX, toY, 'teleport', 30, { color: color });
            }, 100);
        }
        
        // Teleport sesi
        if (soundEngine) {
            soundEngine.playSound('teleport');
        }
    });
    
    // Gizli geçit olayları
    mazeManager.setEventListener('secretPathFound', (triggerX, triggerY, pathX, pathY) => {
        console.log('Gizli geçit bulundu!');
        
        // Gizli geçit efektleri
        if (particleSystem) {
            particleSystem.createParticles(pathX, pathY, 'secretPath', 20);
        }
        
        // Gizli geçit sesi
        if (soundEngine) {
            soundEngine.playSound('secret_path');
        }
        
        // UI'da bildir
        gameUI.showGameMessage('Gizli geçit bulundu!', 2000);
    });
    
    // Gürültü olayları
    mazeManager.setEventListener('noiseCreated', (x, y, level) => {
        // Gürültü efektleri
        if (particleSystem) {
            particleSystem.createParticles(x, y, 'noise', 10 * level);
        }
        
        // Gürültü sesi
        if (soundEngine) {
            soundEngine.playSound('noisy_floor');
        }
    });
}

// Güç-up sistemini kur
function setupPowerUpSystem() {
    // Mevcut powerUpManager'ı temizle
    if (powerUpManager) {
        if (powerUpManager.UI) {
            powerUpManager.UI.remove();
        }
        powerUpManager = null;
    }
    
    // Basit oyun durumu nesnesi oluştur
    const gameState = {
        isEbe: myPlayer.isEbe,
        radarActive: false
    };
    
    // Güç-up yöneticisini başlat
    powerUpManager = new PowerUpSystem.PowerUpManager(myPlayer, gameState);
    
    // Labirent oluşturulduktan sonra güç-up noktalarını ayarla
    powerUpManager.setupSpawnPoints(maze, TILE_SIZE);
    
    // İlk güç-upları oluştur
    powerUpManager.spawnPowerUps(10);
    
    // UI'ı başlat
    powerUpManager.setupUI();
    
    // Güç-up tuş olaylarını dinle
    setupPowerUpKeyBindings();
    
    // Olayları dinle
    setupPowerUpEventListeners();
}

// Güç-up tuş olaylarını dinle
function setupPowerUpKeyBindings() {
    window.addEventListener('keydown', (e) => {
        // 1-3 tuşları ile güç-up kullanımı
        if (e.key >= '1' && e.key <= '3') {
            const index = parseInt(e.key) - 1;
            if (powerUpManager) {
                powerUpManager.activatePowerUp(index);
            }
        }
    });
}

// Güç-up olaylarını dinle
function setupPowerUpEventListeners() {
    if (!powerUpManager) return;
    
    // Güç-up toplandığında
    powerUpManager.addEventListener('onPowerUpCollected', (powerUpType) => {
        playPowerUpCollectSound();
        showStatusMessage(`${powerUpType.name} toplandı!`, 2000);
        
        // Başarıları kontrol et
        checkAchievements('collectPowerUp', { powerUpType });
    });
    
    // Güç-up aktifleştirildiğinde
    powerUpManager.addEventListener('onPowerUpActivated', (powerUpType) => {
        playPowerUpActivateSound();
        showStatusMessage(`${powerUpType.name} aktifleştirildi!`, 2000);
        
        // Başarıları kontrol et
        checkAchievements('usePowerUp', { powerUpType });
    });
    
    // Güç-up süresi bittiğinde
    powerUpManager.addEventListener('onPowerUpExpired', (powerUpType) => {
        playPowerUpExpireSound();
        // Güç-up süresinin bittiğini bildiren mesajı göster
        if (powerUpType.duration > 0) {
            showStatusMessage(`${powerUpType.name} süresi doldu!`, 2000);
        }
    });
}

// Basit ses efektleri
function playPowerUpCollectSound() {
    if (soundEngine) {
        soundEngine.createSimpleSound({
            type: 'sine',
            frequency: 440,
            endFrequency: 880,
            duration: 0.4,
            volume: 0.5
        });
    }
}

function playPowerUpActivateSound() {
    if (soundEngine) {
        soundEngine.createSimpleSound({
            type: 'triangle',
            frequency: 300,
            endFrequency: 900,
            duration: 0.3,
            volume: 0.5
        });
    }
}

function playPowerUpExpireSound() {
    if (soundEngine) {
        soundEngine.createSimpleSound({
            type: 'sawtooth',
            frequency: 600,
            endFrequency: 300,
            duration: 0.3,
            volume: 0.3
        });
    }
}

// Durum mesajı göster
function showStatusMessage(text, duration = 3000, type = 'info') {
    if (gameUI) {
        gameUI.showGameMessage(text, duration);
    } else {
        // Alternatif mesaj gösterimi
        const statusMessage = document.getElementById('status-message');
        if (statusMessage) {
            statusMessage.textContent = text;
            statusMessage.style.display = 'block';
            
            // Mesajı belirli süre sonra gizle
            setTimeout(() => {
                statusMessage.style.display = 'none';
            }, duration);
        }
    }
}

// Oyun modunu başlat
function startGameMode() {
    const selectedMode = gameMode.toUpperCase();
    const gameModeObj = GAME_MODES[selectedMode] || GAME_MODES.CLASSIC;
    
    // Oyun modunu başlat
    gameModeObj.init();
    
    // Oyun modu adını güncelle
    if (gameUI && gameUI.elements.gameMode) {
        gameUI.elements.gameMode.textContent = gameModeObj.name;
    }
}

// Oyuncu konumunu güncelle (orijinal updatePlayer fonksiyonundan çağrılacak)
function updatePlayerWithEnhancements(deltaTime) {
    if (!myPlayer || !mazeManager || gameState !== 'playing') return;
    
    // Karakter sınıfı özelliklerini uygula
    applyCharacterClassEffects(deltaTime);
    
    // Güç-up modifikatörlerini uygula
    applyPowerUpModifiersToPlayer(deltaTime);
    
    // Dinamik labirent etkilerini güncelle
    mazeManager.playerMovedTo(myPlayer.x, myPlayer.y, myPlayer.isRunning);
    
    // Oyuncunun üzerindeki etkileri hesapla
    const effects = mazeManager.calculateEffectsOnPlayer(myPlayer);
    
    // Kaygan zeminde kayma efekti
    if (effects.applySlippery && myPlayer.vx !== 0 && myPlayer.vy !== 0) {
        // Mevcut yönde biraz kayma ekle
        myPlayer.x += myPlayer.vx * 0.3;
        myPlayer.y += myPlayer.vy * 0.3;
        
        // Kayma sesi
        if (soundEngine && Math.random() < 0.05) {
            soundEngine.playSound('slippery');
        }
    }
    
    // Sisli alan ve karanlık oda görünürlük etkileri
    if (effects.inFoggyArea || effects.inDarkRoom) {
        // Görünürlük değişimini uygula (render fonksiyonunda kullanılacak)
        playerVisibilityMultiplier = effects.visibilityMultiplier;
    } else {
        playerVisibilityMultiplier = 1.0;
    }
    
    // Hazine toplama (Hazine Avcısı modu)
    if (gameMode === 'treasure' && !myPlayer.isEbe) {
        checkTreasureCollection();
    }
}

// Güç-up modifikatörlerini oyuncuya uygula
function applyPowerUpModifiersToPlayer(deltaTime) {
    if (!powerUpManager) return;
    
    const modifiers = powerUpManager.getModifiers();
    
    // Hız modifikasyonu uygula
    const baseSpeed = myPlayer.isRunning ? myPlayer.speed * 1.5 : myPlayer.speed;
    const modifiedSpeed = baseSpeed * modifiers.speedMultiplier;
    myPlayer.speed = modifiedSpeed;
    
    // Görünürlük modifikasyonu
    if (playerHidingAlpha !== undefined) {
        if (playerIsHiding) {
            playerHidingAlpha = HIDING_ALPHA_MIN * modifiers.visibilityMultiplier;
        } else {
            playerHidingAlpha = 1.0 * modifiers.visibilityMultiplier;
        }
    }
    
    // Görüş açısı modifikasyonu
    if (VIEW_ANGLE !== undefined && VIEW_DISTANCE !== undefined) {
        VIEW_ANGLE = BASE_VIEW_ANGLE * modifiers.viewAngleMultiplier;
        VIEW_DISTANCE = BASE_VIEW_DISTANCE * modifiers.viewDistanceMultiplier;
    }
}

// Ayak izi oluşturma kontrolü (createFootprint fonksiyonundan çağrılacak)
function shouldCreateFootprint() {
    // Eğer sessiz adımlar güç-up'ı aktifse ayak izi bırakmayı engelle
    if (powerUpManager && 
        powerUpManager.getModifiers().leavesFootprints === false) {
        return false;
    }
    
    // Karakter sınıfı kontrolü
    if (myPlayer && myPlayer.characterClass === 'stealth' && playerIsHiding) {
        return false; // Gizli karakterler saklıyken ayak izi bırakmaz
    }
    
    return true;
}

// Radar efekti çizimi (renderTick fonksiyonundan çağrılacak)
function drawRadarEffect(ctx) {
    if (!powerUpManager || !powerUpManager.gameState.radarActive) return;
    
    ctx.save();
    
    // Radar efekti - eğer ebe değilsek ebenin konumunu göster
    if (!myPlayer.isEbe) {
        let ebePlayer = null;
        
        // Ebeli oyuncuyu bul
        Object.values(players).forEach(player => {
            if (player.isEbe) {
                ebePlayer = player;
            }
        });
        
        if (ebePlayer) {
            // Radar pulse çizimi
            const pulseSpeed = 2;
            const currentTime = Date.now() / 1000;
            const pulseSize = 20 + 10 * Math.sin(pulseSpeed * currentTime);
            
            // Ebenin konumunda radar işaretçisi
            ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
            ctx.beginPath();
            ctx.arc(ebePlayer.x, ebePlayer.y, pulseSize, 0, Math.PI * 2);
            ctx.fill();
            
            // Hedef işareti
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
            ctx.lineWidth = 2;
            
            // Yatay çizgi
            ctx.beginPath();
            ctx.moveTo(ebePlayer.x - 15, ebePlayer.y);
            ctx.lineTo(ebePlayer.x - 5, ebePlayer.y);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(ebePlayer.x + 5, ebePlayer.y);
            ctx.lineTo(ebePlayer.x + 15, ebePlayer.y);
            ctx.stroke();
            
            // Dikey çizgi
            ctx.beginPath();
            ctx.moveTo(ebePlayer.x, ebePlayer.y - 15);
            ctx.lineTo(ebePlayer.x, ebePlayer.y - 5);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(ebePlayer.x, ebePlayer.y + 5);
            ctx.lineTo(ebePlayer.x, ebePlayer.y + 15);
            ctx.stroke();
        }
    }
    
    ctx.restore();
}

// Parçacıkları güncelle (renderTick fonksiyonundan çağrılacak)
function updateAndDrawParticles(ctx, deltaTime) {
    if (!particleSystem) return;
    
    // Parçacıkları güncelle
    particleSystem.update(deltaTime);
    
    // Parçacıkları çiz
    particleSystem.draw(ctx);
}

// Hazine toplama kontrolü
function checkTreasureCollection() {
    if (!treasureLocations || treasureLocations.length === 0) return;
    
    const COLLECT_DISTANCE = 20; // Toplama mesafesi
    
    for (let i = 0; i < treasureLocations.length; i++) {
        const treasure = treasureLocations[i];
        
        // Eğer hazine zaten toplandıysa atla
        if (treasure.collected) continue;
        
        // Oyuncu-hazine mesafesini hesapla
        const dx = myPlayer.x - treasure.x;
        const dy = myPlayer.y - treasure.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Toplama mesafesi içindeyse
        if (distance < COLLECT_DISTANCE) {
            // Hazine toplandı
            treasure.collected = true;
            
            // Hazine toplama olayını tetikle
            const gameMode = GAME_MODES[gameMode.toUpperCase()] || GAME_MODES.TREASURE;
            if (gameMode.onTreasureCollected) {
                gameMode.onTreasureCollected(myPlayer, treasure);
            }
        }
    }
}

// Hazinenin çizimi (renderTick fonksiyonundan çağrılacak)
function drawTreasures(ctx) {
    if (!treasureLocations || treasureLocations.length === 0) return;
    
    ctx.save();
    
    // Her hazineyi çiz
    treasureLocations.forEach(treasure => {
        // Eğer hazine toplandıysa atla
        if (treasure.collected) return;
        
        // Hazine parlaması efekti
        const currentTime = Date.now() / 1000;
        const pulseScale = 0.2 * Math.sin(currentTime * 3) + 1;
        
        // Hazine değerine göre renk ve boyut
        let color, size;
        switch (treasure.value) {
            case 3: // Çok değerli hazine
                color = '#f39c12'; // Altın
                size = 14 * pulseScale;
                break;
            case 2: // Orta değerli hazine
                color = '#e67e22'; // Bronz
                size = 12 * pulseScale;
                break;
            default: // Normal hazine
                color = '#bdc3c7'; // Gümüş
                size = 10 * pulseScale;
                break;
        }
        
        // Hazineyi çiz
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(treasure.x, treasure.y, size, 0, Math.PI * 2);
        ctx.fill();
        
        // Parlama efekti
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(treasure.x, treasure.y, size + 3, 0, Math.PI * 2);
        ctx.stroke();
        
        // Yıldız şekli
        ctx.fillStyle = 'white';
        const starSize = size * 0.6;
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i * 2 * Math.PI / 5) - Math.PI / 2;
            const x = treasure.x + Math.cos(angle) * starSize;
            const y = treasure.y + Math.sin(angle) * starSize;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.fill();
    });
    
    ctx.restore();
}

// ----------------------
// KARAKTER SINIFLARI
// ----------------------
function initCharacterClasses() {
    playerClasses = {
        runner: {
            type: 'runner',
            name: 'Koşucu',
            icon: '🏃',
            color: '#3498db',
            traitDescription: 'Daha yüksek koşma hızı ve stamina',
            baseSpeed: 150,
            staminaRegenRate: 1.5,
            special: {
                name: 'Sürat Patlaması',
                description: 'Kısa süreli hız artışı',
                cooldown: 10000, // 10 saniye
                duration: 3000, // 3 saniye
                icon: '⚡',
                use: function(player) {
                    player.speed *= 2;
                    setTimeout(() => {
                        player.speed /= 2;
                    }, this.duration);
                }
            }
        },
        stealth: {
            type: 'stealth',
            name: 'Gizli',
            icon: '👤',
            color: '#9b59b6',
            traitDescription: 'Daha iyi gizlenme ve sessiz hareket',
            baseSpeed: 130,
            hidingEfficiency: 2.0, // Daha iyi gizlenme
            special: {
                name: 'Duman Perdesi',
                description: 'Kaçış için duman bulutu oluşturur',
                cooldown: 15000, // 15 saniye
                duration: 5000, // 5 saniye
                icon: '💨',
                use: function(player) {
                    // Duman bulutu efekti
                    if (particleSystem) {
                        particleSystem.createParticles(player.x, player.y, 'noise', 50, {
                            color: '#aaa',
                            lifetime: { min: 2, max: 4 },
                            speed: { min: 10, max: 30 }
                        });
                    }
                    
                    // Geçici görünmezlik
                    player.visibility = 0.2;
                    setTimeout(() => {
                        player.visibility = 1.0;
                    }, this.duration);
                }
            }
        },
        defender: {
            type: 'defender',
            name: 'Koruyucu',
            icon: '🛡️',
            color: '#e74c3c',
            traitDescription: 'Ebe olarak daha etkili, normal oyuncu olarak dayanıklı',
            baseSpeed: 140,
            tagEfficiency: 1.5, // Ebe olarak daha etkili
            immunityDuration: 2.0, // Ebelendikten sonra daha uzun dokunulmazlık
            special: {
                name: 'Kalkan Duvarı',
                description: 'Kısa süreli dokunulmazlık kazanır',
                cooldown: 20000, // 20 saniye
                duration: 4000, // 4 saniye
                icon: '🛡️',
                use: function(player) {
                    player.isImmune = true;
                    
                    // Kalkan efekti
                    if (particleSystem) {
                        particleSystem.createParticles(player.x, player.y, 'secretPath', 20, {
                            color: '#e74c3c',
                            gravity: 0
                        });
                    }
                    
                    setTimeout(() => {
                        player.isImmune = false;
                    }, this.duration);
                }
            }
        },
        scout: {
            type: 'scout',
            name: 'İzci',
            icon: '🔍',
            color: '#f1c40f',
            traitDescription: 'Daha geniş görüş alanı, haritayı daha iyi görme',
            baseSpeed: 140,
            viewDistanceMultiplier: 1.3, // Daha uzağı görebilme
            viewAngleMultiplier: 1.2, // Daha geniş görüş açısı
            special: {
                name: 'Keşif',
                description: 'Tüm oyuncuların konumunu kısa süreliğine gösterir',
                cooldown: 25000, // 25 saniye
                duration: 5000, // 5 saniye
                icon: '🔍',
                use: function(player) {
                    // Radar efekti - tüm oyuncuları gösterme
                    if (powerUpManager) {
                        powerUpManager.gameState.radarActive = true;
                        setTimeout(() => {
                            powerUpManager.gameState.radarActive = false;
                        }, this.duration);
                    }
                }
            }
        },
        trickster: {
            type: 'trickster',
            name: 'Hilebaz',
            icon: '🎭',
            color: '#2ecc71',
            traitDescription: 'Rakipleri aldatmaya yönelik yetenekler',
            baseSpeed: 135,
            special: {
                name: 'Sahte İz',
                description: 'Ebeyi şaşırtmak için sahte ayak izleri oluşturur',
                cooldown: 15000, // 15 saniye
                duration: 6000, // 6 saniye
                icon: '👣',
                use: function(player) {
                    // Rastgele yönlerde sahte ayak izleri oluştur
                    const directions = [
                        { x: 1, y: 0 },
                        { x: -1, y: 0 },
                        { x: 0, y: 1 },
                        { x: 0, y: -1 },
                        { x: 1, y: 1 },
                        { x: -1, y: 1 },
                        { x: 1, y: -1 },
                        { x: -1, y: -1 }
                    ];
                    
                    // Her yönde 3 ayak izi oluştur
                    directions.forEach(dir => {
                        let x = player.x;
                        let y = player.y;
                        
                        for (let i = 0; i < 5; i++) {
                            x += dir.x * 20;
                            y += dir.y * 20;
                            
                            createFootprint(x, y, 0.8); // Sahte ayak izi
                        }
                    });
                }
            }
        }
    };
}

// Seçilen karakter sınıfına göre oyuncu özelliklerini ayarla
function setupPlayerClass() {
    if (!myPlayer) return;
    
    // Seçilen karakter sınıfını al
    const characterClass = playerClasses[selectedCharacterType];
    if (!characterClass) return;
    
    // Karakter sınıfını oyuncuya ata
    myPlayer.characterClass = selectedCharacterType;
    
    // Temel özellikleri ayarla
    myPlayer.speed = characterClass.baseSpeed;
    myPlayer.color = characterClass.color;
    
    // Sınıfa özgü özellikleri ayarla
    if (characterClass.staminaRegenRate) {
        myPlayer.staminaRegenRate = characterClass.staminaRegenRate;
    }
    
    if (characterClass.hidingEfficiency) {
        myPlayer.hidingEfficiency = characterClass.hidingEfficiency;
        // HIDING_ALPHA_MIN değerini güncelle (eğer varsa)
        if (typeof HIDING_ALPHA_MIN !== 'undefined') {
            HIDING_ALPHA_MIN = 0.1 / characterClass.hidingEfficiency;
        }
    }
    
    if (characterClass.viewDistanceMultiplier) {
        // VIEW_DISTANCE değerini güncelle (eğer varsa)
        if (typeof VIEW_DISTANCE !== 'undefined' && typeof BASE_VIEW_DISTANCE !== 'undefined') {
            VIEW_DISTANCE = BASE_VIEW_DISTANCE * characterClass.viewDistanceMultiplier;
        }
    }
    
    if (characterClass.viewAngleMultiplier) {
        // VIEW_ANGLE değerini güncelle (eğer varsa)
        if (typeof VIEW_ANGLE !== 'undefined' && typeof BASE_VIEW_ANGLE !== 'undefined') {
            VIEW_ANGLE = BASE_VIEW_ANGLE * characterClass.viewAngleMultiplier;
        }
    }
    
    // Özel yetenekleri yetenekler çubuğuna ekle
    if (characterClass.special && gameUI) {
        const abilities = [characterClass.special];
        gameUI.updateAbilities(abilities);
        gameUI.elements.abilities.style.display = 'flex';
    }
    
    console.log(`Karakter sınıfı ayarlandı: ${characterClass.name}`);
}

// Karakter sınıfı etkilerini uygula
function applyCharacterClassEffects(deltaTime) {
    if (!myPlayer || !myPlayer.characterClass) return;
    
    const characterClass = playerClasses[myPlayer.characterClass];
    if (!characterClass) return;
    
    // Koşucu sınıfı için ekstra stamina rejenerasyonu
    if (characterClass.staminaRegenRate && myPlayer.stamina !== undefined) {
        // Koşmuyorsa stamina'yı daha hızlı doldur
        if (!myPlayer.isRunning && myPlayer.stamina < myPlayer.maxStamina) {
            myPlayer.stamina += characterClass.staminaRegenRate * deltaTime;
            if (myPlayer.stamina > myPlayer.maxStamina) {
                myPlayer.stamina = myPlayer.maxStamina;
            }
        }
    }
    
    // Gizli sınıf için daha etkili gizlenme
    if (characterClass.hidingEfficiency && playerIsHiding && playerHidingAlpha !== undefined) {
        playerHidingAlpha = HIDING_ALPHA_MIN / characterClass.hidingEfficiency;
    }
    
    // Koruyucu sınıfı için ebe özelliği
    if (characterClass.tagEfficiency && myPlayer.isEbe) {
        // Ebeleme etkisi daha yüksek (daha geniş ebeleme alanı)
        if (typeof TAG_DISTANCE !== 'undefined') {
            TAG_DISTANCE = BASE_TAG_DISTANCE * characterClass.tagEfficiency;
        }
    }
    
    // İzci sınıfı için görüş alanı ayarları
    if (myPlayer.isEbe) {
        if (characterClass.viewDistanceMultiplier && typeof VIEW_DISTANCE !== 'undefined') {
            VIEW_DISTANCE = BASE_VIEW_DISTANCE * characterClass.viewDistanceMultiplier;
        }
        
        if (characterClass.viewAngleMultiplier && typeof VIEW_ANGLE !== 'undefined') {
            VIEW_ANGLE = BASE_VIEW_ANGLE * characterClass.viewAngleMultiplier;
        }
    }
}

// ----------------------
// BAŞARILAR VE GÖREVLER
// ----------------------
function initAchievements() {
    achievements = [
        // Ebeleme başarıları
        {
            id: 'first_tag',
            name: 'İlk Ebeleme',
            description: 'İlk defa bir oyuncu ebeledin',
            hint: 'Bir oyuncuyu yakala',
            unlocked: false,
            isQuest: true,
            rewardXP: 50
        },
        {
            id: 'quick_tag',
            name: 'Çevik Avcı',
            description: 'Oyunun ilk 30 saniyesinde bir oyuncu ebeledin',
            hint: 'Oyunun başında hızlı hareket et',
            unlocked: false,
            isQuest: false
        },
        {
            id: 'tag_spree',
            name: 'Ebeleme Çılgınlığı',
            description: '10 saniye içinde 3 farklı oyuncu ebeledin',
            hint: 'Hızlı ve arka arkaya ebeleme',
            unlocked: false,
            isQuest: false
        },
        
        // Kaçma başarıları
        {
            id: 'escape_artist',
            name: 'Kaçış Ustası',
            description: 'Ebenin 5 saniye yakınında kalıp ebelenmeden kaç',
            hint: 'Ebeye yakın kalıp kaçmayı başar',
            unlocked: false,
            isQuest: true,
            rewardXP: 100
        },
        {
            id: 'hide_master',
            name: 'Gizlenme Ustası',
            description: 'Bir gizlenme noktasında 30 saniye boyunca ebelenmeden kal',
            hint: 'Gizlenme noktalarını kullan',
            unlocked: false,
            isQuest: false
        },
        
        // Güç-up başarıları
        {
            id: 'power_collector',
            name: 'Güç-Up Koleksiyoncusu',
            description: 'Tek bir oyunda 10 farklı güç-up topla',
            hint: 'Güç-upları topla',
            unlocked: false,
            currentValue: 0,
            targetValue: 10,
            progress: 0,
            isQuest: true,
            rewardXP: 150
        },
        {
            id: 'invisibility_tag',
            name: 'Görünmez Avcı',
            description: 'Görünmezlik güç-up\'ı aktifken bir oyuncuyu ebele',
            hint: 'Görünmezlik ile ebeleme',
            unlocked: false,
            isQuest: false
        },
        
        // Hazine Avcısı başarıları
        {
            id: 'treasure_hunter',
            name: 'Hazine Avcısı',
            description: 'Tek bir oyunda 20 hazine topla',
            hint: 'Hazine Avcısı modunda oyna',
            unlocked: false,
            currentValue: 0,
            targetValue: 20,
            progress: 0,
            isQuest: true,
            rewardXP: 200
        },
        {
            id: 'rare_treasure',
            name: 'Nadir Hazine',
            description: 'Değeri 3 olan bir hazine bul',
            hint: 'En değerli hazineleri ara',
            unlocked: false,
            isQuest: false
        },
        
        // Labirent özellikleri başarıları
        {
            id: 'teleport_escape',
            name: 'Teleport Kaçışı',
            description: 'Ebe yaklaşırken teleport kullanarak kaç',
            hint: 'Teleport noktalarını stratejik kullan',
            unlocked: false,
            isQuest: false
        },
        {
            id: 'secret_finder',
            name: 'Gizli Geçit Kaşifi',
            description: '5 farklı gizli geçit bul',
            hint: 'Duvarların yakınlarını araştır',
            unlocked: false,
            currentValue: 0,
            targetValue: 5,
            progress: 0,
            isQuest: true,
            rewardXP: 100
        }
    ];
}

// Başarıları kontrol et ve güncelle
function checkAchievements(actionType, data) {
    if (!achievements || achievements.length === 0) return;
    
    // Tüm başarıları kontrol et
    achievements.forEach(achievement => {
        // Zaten açılmış başarıları atla
        if (achievement.unlocked) return;
        
        let unlocked = false;
        
        switch (actionType) {
            case 'tag':
                // Ebeleme başarıları
                if (achievement.id === 'first_tag') {
                    unlocked = true;
                } else if (achievement.id === 'quick_tag' && gameTimer > 90) {
                    // Oyunun ilk 30 saniyesinde ebeleme (120 saniyeden başlıyorsa)
                    unlocked = true;
                } else if (achievement.id === 'tag_spree') {
                    // Oyuncu istatistiklerini kontrol et (10 saniye içinde 3 ebeleme)
                    const player = data.tagger;
                    if (player.stats && player.stats.recentTags && player.stats.recentTags.length >= 3) {
                        // Son eklenen ebeleme zamanı
                        const lastTagTime = player.stats.recentTags[player.stats.recentTags.length - 1];
                        // İlk eklenen ebeleme zamanı (en az 3 ebeleme varsa)
                        const firstTagTime = player.stats.recentTags[player.stats.recentTags.length - 3];
                        
                        // 10 saniye içinde 3 ebeleme
                        if (lastTagTime - firstTagTime <= 10000) {
                            unlocked = true;
                        }
                    }
                }
                break;
                
            case 'escape':
                // Kaçma başarıları
                if (achievement.id === 'escape_artist' && data.escapeDuration >= 5) {
                    unlocked = true;
                }
                break;
                
            case 'hide':
                // Gizlenme başarıları
                if (achievement.id === 'hide_master' && data.hideDuration >= 30) {
                    unlocked = true;
                }
                break;
                
            case 'collectPowerUp':
                // Güç-up toplama başarıları
                if (achievement.id === 'power_collector') {
                    // Mevcut değeri artır
                    achievement.currentValue = (achievement.currentValue || 0) + 1;
                    achievement.progress = (achievement.currentValue / achievement.targetValue) * 100;
                    
                    // Hedef değere ulaşıldı mı?
                    if (achievement.currentValue >= achievement.targetValue) {
                        unlocked = true;
                    }
                }
                break;
                
            case 'usePowerUp':
                // Görünmezlik ile ebeleme başarısı
                if (achievement.id === 'invisibility_tag' && 
                    data.powerUpType.id === 'invisibility' &&
                    data.taggedPlayer) {
                    unlocked = true;
                }
                break;
                
            case 'collectTreasure':
                // Hazine toplama başarıları
                if (achievement.id === 'treasure_hunter') {
                    // Mevcut değeri artır
                    achievement.currentValue = (achievement.currentValue || 0) + 1;
                    achievement.progress = (achievement.currentValue / achievement.targetValue) * 100;
                    
                    // Hedef değere ulaşıldı mı?
                    if (achievement.currentValue >= achievement.targetValue) {
                        unlocked = true;
                    }
                } else if (achievement.id === 'rare_treasure' && data.treasureValue === 3) {
                    unlocked = true;
                }
                break;
                
            case 'teleport':
                // Teleport başarıları
                if (achievement.id === 'teleport_escape' && data.escapedFromEbe) {
                    unlocked = true;
                }
                break;
                
            case 'findSecretPath':
                // Gizli geçit başarıları
                if (achievement.id === 'secret_finder') {
                    // Mevcut değeri artır
                    achievement.currentValue = (achievement.currentValue || 0) + 1;
                    achievement.progress = (achievement.currentValue / achievement.targetValue) * 100;
                    
                    // Hedef değere ulaşıldı mı?
                    if (achievement.currentValue >= achievement.targetValue) {
                        unlocked = true;
                    }
                }
                break;
        }
        
        // Başarı açıldıysa
        if (unlocked) {
            // Başarıyı açık olarak işaretle
            achievement.unlocked = true;
            
            // Eğer ilerleme başarısıysa, ilerlemeyi %100 olarak ayarla
            if (achievement.progress !== undefined) {
                achievement.progress = 100;
            }
            
            // Başarı bildirimini göster
            showAchievementNotification(achievement);
            
            // Eğer görevse deneyim puanını ekle
            if (achievement.isQuest && achievement.rewardXP && myPlayer) {
                myPlayer.xp = (myPlayer.xp || 0) + achievement.rewardXP;
                // Seviye yükseltme kontrolü
                checkLevelUp(myPlayer);
            }
            
            // UI'ı güncelle
            if (gameUI) {
                // Eğer başarılar ekranı açıksa güncelle
                if (gameUI.visibleScreens.has('achievements')) {
                    gameUI.updateAchievements();
                }
                // Eğer görevler paneli açıksa güncelle
                if (gameUI.visibleScreens.has('quests-panel')) {
                    gameUI.updateQuestList();
                }
            }
        }
    });
}

// Başarı bildirimini göster
function showAchievementNotification(achievement) {
    // Bildirim elementi oluştur
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: rgba(46, 204, 113, 0.9);
        color: white;
        padding: 10px 15px;
        border-radius: 5px;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
        z-index: 1000;
        animation: slideIn 0.5s, fadeOut 0.5s 4.5s forwards;
        display: flex;
        align-items: center;
        gap: 10px;
    `;
    
    // İkon
    const icon = document.createElement('div');
    icon.style.cssText = `
        width: 30px;
        height: 30px;
        background-color: #27ae60;
        border-radius: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 16px;
    `;
    icon.textContent = '✓';
    notification.appendChild(icon);
    
    // Bilgi kısmı
    const info = document.createElement('div');
    info.style.cssText = `
        display: flex;
        flex-direction: column;
    `;
    
    // Başlık
    const title = document.createElement('div');
    title.style.cssText = `
        font-weight: bold;
        font-size: 14px;
    `;
    title.textContent = 'Başarı Kazanıldı!';
    info.appendChild(title);
    
    // Başarı adı
    const name = document.createElement('div');
    name.textContent = achievement.name;
    info.appendChild(name);
    
    // XP ödülü (eğer varsa)
    if (achievement.isQuest && achievement.rewardXP) {
        const reward = document.createElement('div');
        reward.style.cssText = `
            font-size: 12px;
            color: #e8f8e8;
        `;
        reward.textContent = `+${achievement.rewardXP} XP`;
        info.appendChild(reward);
    }
    
    notification.appendChild(info);
    
    // Stili ekle
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
        }
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    // Bildirim sesini çal
    if (soundEngine) {
        soundEngine.createSimpleSound({
            type: 'sine',
            frequency: 880,
            endFrequency: 1760,
            duration: 0.3,
            volume: 0.4
        });
        
        // Küçük bir gecikmeyle ikinci ses
        setTimeout(() => {
            soundEngine.createSimpleSound({
                type: 'triangle',
                frequency: 880,
                endFrequency: 1760,
                duration: 0.5,
                volume: 0.4
            });
        }, 300);
    }
    
    // Bildirimi ekle
    document.body.appendChild(notification);
    
    // 5 saniye sonra kaldır
    setTimeout(() => {
        notification.remove();
        style.remove();
    }, 5000);
}

// Seviye yükseltme kontrolü
function checkLevelUp(player) {
    if (!player.xp) return;
    
    // Mevcut seviye
    player.level = player.level || 1;
    
    // Sonraki seviye için gereken XP
    const requiredXP = 100 * player.level;
    
    // XP yeterli mi?
    if (player.xp >= requiredXP) {
        // Seviyeyi yükselt
        player.level++;
        
        // Kalan XP'yi hesapla
        player.xp -= requiredXP;
        
        // Seviye yükseltme bildirimini göster
        showLevelUpNotification(player);
        
        // Seviye ödüllerini ver
        giveLevelRewards(player);
        
        // Tekrar kontrol et (birden fazla seviye atlama durumu için)
        checkLevelUp(player);
    }
}

// Seviye yükseltme bildirimini göster
function showLevelUpNotification(player) {
    // Bildirim elementi oluştur
    const notification = document.createElement('div');
    notification.className = 'level-up-notification';
    notification.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: rgba(52, 152, 219, 0.9);
        color: white;
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
        z-index: 1001;
        text-align: center;
        animation: scaleIn 0.5s, fadeOut 0.5s 4.5s forwards;
    `;
    
    // Başlık
    const title = document.createElement('h2');
    title.style.cssText = `
        margin: 0 0 10px 0;
        font-size: 24px;
    `;
    title.textContent = 'Seviye Yükseldi!';
    notification.appendChild(title);
    
    // Seviye
    const level = document.createElement('div');
    level.style.cssText = `
        font-size: 36px;
        font-weight: bold;
        margin: 10px 0;
    `;
    level.textContent = `Seviye ${player.level}`;
    notification.appendChild(level);
    
    // Stili ekle
    const style = document.createElement('style');
    style.textContent = `
        @keyframes scaleIn {
            from { transform: translate(-50%, -50%) scale(0.5); }
            to { transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    // Seviye yükseltme sesini çal
    if (soundEngine) {
        soundEngine.createSimpleSound({
            type: 'sine',
            frequency: 440,
            endFrequency: 880,
            duration: 0.2,
            volume: 0.5
        });
        
        // Kısa bir gecikmeyle ardışık sesler
        setTimeout(() => {
            soundEngine.createSimpleSound({
                type: 'sine',
                frequency: 880,
                endFrequency: 1320,
                duration: 0.3,
                volume: 0.5
            });
        }, 200);
        
        setTimeout(() => {
            soundEngine.createSimpleSound({
                type: 'sine',
                frequency: 1320,
                endFrequency: 1760,
                duration: 0.4,
                volume: 0.5
            });
        }, 500);
    }
    
    // Bildirimi ekle
    document.body.appendChild(notification);
    
    // 5 saniye sonra kaldır
    setTimeout(() => {
        notification.remove();
        style.remove();
    }, 5000);
}

// Seviye ödüllerini ver
function giveLevelRewards(player) {
    // Seviyeye göre farklı ödüller
    switch (player.level) {
        case 2:
            // Seviye 2: Ekstra hız
            player.baseSpeed *= 1.1;
            break;
        case 3:
            // Seviye 3: Daha hızlı stamina rejenerasyonu
            player.staminaRegenRate *= 1.2;
            break;
        case 4:
            // Seviye 4: Daha uzun dokunulmazlık süresi
            player.immunityDuration = 4000; // 4 saniye
            break;
        case 5:
            // Seviye 5: Yeni kostüm
            addItemToInventory({
                id: 'costume_legend',
                name: 'Efsane Kostümü',
                type: 'costume',
                icon: '👑',
                description: 'Seviye 5 ödülü, efsanevi bir kostüm.'
            });
            break;
        default:
            // Diğer seviyeler için genel iyileştirmeler
            player.baseSpeed *= 1.05; // %5 hız artışı
            break;
    }
}

// Envantere eşya ekle
function addItemToInventory(item) {
    if (!myPlayer.inventory) {
        myPlayer.inventory = [];
    }
    
    myPlayer.inventory.push(item);
    
    // Eşya bildirimini göster
    showItemNotification(item);
    
    // Eğer eşyalar paneli açıksa güncelle
    if (gameUI && gameUI.visibleScreens.has('items-panel')) {
        gameUI.updateItemGrid();
    }
}

// Eşya bildirimini göster
function showItemNotification(item) {
    // Bildirim elementi oluştur
    const notification = document.createElement('div');
    notification.className = 'item-notification';
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background-color: rgba(52, 73, 94, 0.9);
        color: white;
        padding: 10px 15px;
        border-radius: 5px;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
        z-index: 1000;
        animation: slideUp 0.5s, fadeOut 0.5s 4.5s forwards;
        display: flex;
        align-items: center;
        gap: 10px;
    `;
    
    // İkon
    const icon = document.createElement('div');
    icon.style.cssText = `
        width: 40px;
        height: 40px;
        background-color: #2c3e50;
        border-radius: 5px;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 24px;
    `;
    icon.textContent = item.icon || '📦';
    notification.appendChild(icon);
    
    // Bilgi kısmı
    const info = document.createElement('div');
    info.style.cssText = `
        display: flex;
        flex-direction: column;
    `;
    
    // Başlık
    const title = document.createElement('div');
    title.style.cssText = `
        font-weight: bold;
        font-size: 14px;
    `;
    title.textContent = 'Yeni Eşya Kazanıldı!';
    info.appendChild(title);
    
    // Eşya adı
    const name = document.createElement('div');
    name.textContent = item.name;
    info.appendChild(name);
    
    // Eşya açıklaması
    const description = document.createElement('div');
    description.style.cssText = `
        font-size: 12px;
        color: #bdc3c7;
    `;
    description.textContent = item.description;
    info.appendChild(description);
    
    notification.appendChild(info);
    
    // Stili ekle
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideUp {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
        }
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    // Eşya kazanma sesini çal
    if (soundEngine) {
        soundEngine.createSimpleSound({
            type: 'sawtooth',
            frequency: 440,
            endFrequency: 660,
            duration: 0.3,
            volume: 0.4
        });
    }
    
    // Bildirimi ekle
    document.body.appendChild(notification);
    
    // 5 saniye sonra kaldır
    setTimeout(() => {
        notification.remove();
        style.remove();
    }, 5000);
}

// ----------------------
// OYUN MODLARI
// ----------------------
const GAME_MODES = {
    // Klasik Mod - Normal körebe
    CLASSIC: {
        id: 'classic',
        name: 'Klasik Mod',
        description: 'Klasik körebe oyunu. Ebelenince, ebe sen olursun.',
        init: function() {
            console.log('Klasik mod başlatıldı');
            gameUI.showGameMessage('Ebelenmekten kaçın!', 3000);
            
            // Karakter sınıflarına göre özel yetenekleri etkinleştir
            initPlayerAbilities();
            
            // 2 dakikalık oyun süresi
            startGameTimer(120);
        },
        onPlayerTagged: function(taggedPlayer, taggerPlayer) {
            console.log(`${taggedPlayer.name} ebelendi!`);
            
            // Ebeyi değiştir
            taggedPlayer.isEbe = true;
            taggerPlayer.isEbe = false;
            
            // UI'da bildir
            gameUI.showGameMessage(`${taggedPlayer.name} yeni ebe!`, 2000);
            
            // Ebelenen oyuncuya kısa süreli dokunulmazlık ver
            taggedPlayer.isImmune = true;
            setTimeout(() => {
                taggedPlayer.isImmune = false;
            }, 3000);
            
            // Ses efektleri
            if (soundEngine) {
                soundEngine.playSound('tagged');
            }
            
            // Başarıları kontrol et
            checkAchievements('tag', { tagger: taggerPlayer, tagged: taggedPlayer });
        },
        isGameOver: function() {
            // Süre dolunca oyun biter
            return gameTimer <= 0;
        },
        getWinner: function() {
            // En az ebelenen oyuncu kazanır
            return Object.values(players)
                .sort((a, b) => a.stats.timeAsEbe - b.stats.timeAsEbe)[0];
        }
    },
    
    // Enfeksiyon Modu - Ebelenenler de ebe olur
    INFECTION: {
        id: 'infection',
        name: 'Enfeksiyon Modu',
        description: 'Ebelenenler ebe olur ve diğer oyuncuları ebelemeye çalışır. Son hayatta kalan kazanır.',
        init: function() {
            console.log('Enfeksiyon modu başlatıldı');
            gameUI.showGameMessage('Enfeksiyon başlıyor! Hayatta kal!', 3000);
            
            // İlk ebe
            const allPlayers = Object.values(players);
            const randomPlayer = allPlayers[Math.floor(Math.random() * allPlayers.length)];
            randomPlayer.isEbe = true;
            
            // Ebe görüntüsünü değiştir
            randomPlayer.color = '#e74c3c'; // Kırmızı
            
            // 3 dakikalık oyun süresi
            startGameTimer(180);
        },
        onPlayerTagged: function(taggedPlayer, taggerPlayer) {
            console.log(`${taggedPlayer.name} enfekte oldu!`);
            
            // Ebelenen oyuncu da ebe olur
            taggedPlayer.isEbe = true;
            
            // Ebe görüntüsünü değiştir
            taggedPlayer.color = '#e74c3c'; // Kırmızı
            
            // UI'da bildir
            gameUI.showGameMessage(`${taggedPlayer.name} enfekte oldu!`, 2000);
            
            // Ses efektleri
            if (soundEngine) {
                soundEngine.playSound('tagged');
                soundEngine.createSimpleSound({
                    type: 'sine',
                    frequency: 300,
                    endFrequency: 600,
                    duration: 0.5,
                    volume: 0.5
                });
            }
            
            // Başarıları kontrol et
            checkAchievements('infect', { infector: taggerPlayer, infected: taggedPlayer });
            
            // Oyun sonu kontrolü
            const survivors = Object.values(players).filter(p => !p.isEbe);
            if (survivors.length === 1) {
                // Son hayatta kalan
                gameUI.showGameMessage(`${survivors[0].name} son hayatta kalan!`, 5000);
                endGame();
            } else if (survivors.length === 0) {
                // Herkes enfekte oldu
                gameUI.showGameMessage('Herkes enfekte oldu!', 5000);
                endGame();
            }
        },
        isGameOver: function() {
            // Süre dolunca veya tüm oyuncular ebe olunca oyun biter
            const survivors = Object.values(players).filter(p => !p.isEbe);
            return gameTimer <= 0 || survivors.length <= 1;
        },
        getWinner: function() {
            // Hayatta kalan son oyuncu kazanır
            const survivors = Object.values(players).filter(p => !p.isEbe);
            if (survivors.length === 1) {
                return survivors[0];
            } else if (survivors.length === 0) {
                // Herkes enfekte olduysa, en son enfekte olan kazanır
                return Object.values(players)
                    .sort((a, b) => b.stats.infectionTime - a.stats.infectionTime)[0];
            }
            return null;
        }
    },
    
    // Hazine Avcısı - Hazineleri toplamaya çalış
    TREASURE: {
        id: 'treasure',
        name: 'Hazine Avcısı',
        description: 'Haritada saklı hazineleri topla. Ebe seni engelleyecektir.',
        treasureCount: 10,
        init: function() {
            console.log('Hazine Avcısı modu başlatıldı');
            gameUI.showGameMessage('Hazineleri bul ve topla!', 3000);
            
            // İlk ebe
            const allPlayers = Object.values(players);
            const randomPlayer = allPlayers[Math.floor(Math.random() * allPlayers.length)];
            randomPlayer.isEbe = true;
            
            // Hazineleri rastgele yerleştir
            this.placeTreasures();
            
            // Skor göstergesini aç
            gameUI.elements.scoreDisplay.style.display = 'block';
            
            // 3 dakikalık oyun süresi
            startGameTimer(180);
        },
        placeTreasures: function() {
            treasureLocations = [];
            
            // Labirentte boş konumlar bul
            const emptyLocations = [];
            for (let y = 0; y < maze.length; y++) {
                for (let x = 0; x < maze[y].length; x++) {
                    if (maze[y][x] === MAZE_FEATURES.EMPTY || maze[y][x] === MAZE_FEATURES.HIDING_SPOT) {
                        emptyLocations.push({x, y});
                    }
                }
            }
            
            // Rastgele konumlara hazineler yerleştir
            for (let i = 0; i < this.treasureCount; i++) {
                if (emptyLocations.length === 0) break;
                
                const randomIndex = Math.floor(Math.random() * emptyLocations.length);
                const location = emptyLocations.splice(randomIndex, 1)[0];
                
                treasureLocations.push({
                    x: location.x * TILE_SIZE + TILE_SIZE / 2,
                    y: location.y * TILE_SIZE + TILE_SIZE / 2,
                    value: Math.floor(Math.random() * 3) + 1, // 1-3 arası değer
                    collected: false
                });
            }
        },
        onPlayerTagged: function(taggedPlayer, taggerPlayer) {
            // Ebelenen oyuncu hazinelerinin yarısını kaybeder
            if (taggedPlayer.treasures > 0) {
                const lostTreasures = Math.floor(taggedPlayer.treasures / 2);
                taggedPlayer.treasures -= lostTreasures;
                
                // UI'da bildir
                gameUI.showGameMessage(`${taggedPlayer.name} ${lostTreasures} hazine kaybetti!`, 2000);
                
                // Skor güncelle
                gameUI.updateScore(taggedPlayer.treasures);
            }
            
            // Ebeye kısa süreli hız artışı ver
            taggerPlayer.speed *= 1.5;
            setTimeout(() => {
                taggerPlayer.speed /= 1.5;
            }, 5000);
            
            // Ses efektleri
            if (soundEngine) {
                soundEngine.playSound('tagged');
            }
            
            // Başarıları kontrol et
            checkAchievements('tag', { tagger: taggerPlayer, tagged: taggedPlayer });
        },
        onTreasureCollected: function(player, treasure) {
            // Hazine toplama
            player.treasures = (player.treasures || 0) + treasure.value;
            
            // UI'da bildir
            gameUI.showGameMessage(`${player.name} bir hazine buldu: +${treasure.value}!`, 2000);
            
            // Skor güncelle
            gameUI.updateScore(player.treasures);
            
            // Parçacık efektleri
            if (particleSystem) {
                particleSystem.createParticles(treasure.x, treasure.y, 'treasure', 30);
            }
            
            // Ses efektleri
            if (soundEngine) {
                soundEngine.playSound('treasure_collect');
            }
            
            // Başarıları kontrol et
            checkAchievements('collectTreasure', { player, treasureValue: treasure.value });
            
            // Tüm hazineler toplandıysa yeni yerleştir
            if (treasureLocations.every(t => t.collected)) {
                this.placeTreasures();
                gameUI.showGameMessage('Yeni hazineler belirdi!', 3000);
            }
        },
        isGameOver: function() {
            // Süre dolunca oyun biter
            return gameTimer <= 0;
        },
        getWinner: function() {
            // En çok hazine toplayan oyuncu kazanır
            return Object.values(players)
                .sort((a, b) => (b.treasures || 0) - (a.treasures || 0))[0];
        }
    },
    
    // Zamana Karşı - Belirli süre boyunca ebelenmemeye çalış
    TIME_ATTACK: {
        id: 'timeAttack',
        name: 'Zamana Karşı',
        description: 'Belirli süre boyunca ebelenmemeye çalış. Ebelendiğinde veya süre dolduğunda oyun biter.',
        init: function() {
            console.log('Zamana Karşı modu başlatıldı');
            gameUI.showGameMessage('Ebelenmeden hayatta kal!', 3000);
            
            // İlk ebe (AI yapay zeka)
            const allPlayers = Object.values(players);
            let ebePlayer = null;
            
            // Yapay zeka varsa onu ebe yap, yoksa rastgele bir oyuncu
            for (const player of allPlayers) {
                if (player.isAI) {
                    ebePlayer = player;
                    break;
                }
            }
            
            // Yapay zeka yoksa rastgele bir oyuncuyu ebe yap
            if (!ebePlayer) {
                ebePlayer = allPlayers[Math.floor(Math.random() * allPlayers.length)];
            }
            
            ebePlayer.isEbe = true;
            
            // Ebeye ek güçlendirmeler
            ebePlayer.speed *= 1.2;
            
            // 2 dakikalık oyun süresi
            startGameTimer(120);
        },
        onPlayerTagged: function(taggedPlayer, taggerPlayer) {
            console.log(`${taggedPlayer.name} ebelendi! Oyun bitti.`);
            
            // UI'da bildir
            gameUI.showGameMessage(`${taggedPlayer.name} ebelendi! Oyun bitti.`, 3000);
            
            // Ses efektleri
            if (soundEngine) {
                soundEngine.playSound('tagged');
            }
            
            // Başarıları kontrol et
            checkAchievements('tag', { tagger: taggerPlayer, tagged: taggedPlayer });
            
            // Oyun sonu
            endGame();
        },
        isGameOver: function() {
            // Süre dolduğunda veya oyuncu ebelendiğinde oyun biter
            return gameTimer <= 0 || Object.values(players).some(p => !p.isEbe && p.isTagged);
        },
        getWinner: function() {
            // Süre dolduğunda, ebelenmemiş oyuncular kazanır
            // Eğer oyuncu ebeli ise, ebe kazanır
            if (gameTimer <= 0) {
                return Object.values(players).filter(p => !p.isEbe && !p.isTagged);
            } else {
                return Object.values(players).find(p => p.isEbe);
            }
        }
    },
    
    // Takım Modu - İki takım halinde oyun
    TEAMS: {
        id: 'teams',
        name: 'Takım Modu',
        description: 'İki takım halinde oyna: Ebeler ve Kaçanlar. Rolünü yerine getirerek takımına puan kazandır.',
        init: function() {
            console.log('Takım Modu başlatıldı');
            
            // Oyuncuları iki takıma ayır
            const allPlayers = Object.values(players);
            
            // Oyuncuların yarısı ebe, yarısı kaçan
            for (let i = 0; i < allPlayers.length; i++) {
                const player = allPlayers[i];
                if (i < allPlayers.length / 2) {
                    player.isEbe = true;
                    player.team = 'hunters'; // Avcılar takımı
                    player.color = '#e74c3c'; // Kırmızı
                } else {
                    player.isEbe = false;
                    player.team = 'runners'; // Kaçanlar takımı
                    player.color = '#3498db'; // Mavi
                }
            }
            
            // Takım puanlarını sıfırla
            this.teamScores = {
                hunters: 0,
                runners: 0
            };
            
            // Skor göstergesini aç
            gameUI.elements.scoreDisplay.style.display = 'block';
            gameUI.updateScore(`Avcılar: ${this.teamScores.hunters} | Kaçanlar: ${this.teamScores.runners}`);
            
            // 3 dakikalık oyun süresi
            startGameTimer(180);
        },
        onPlayerTagged: function(taggedPlayer, taggerPlayer) {
            console.log(`${taggedPlayer.name} ebelendi!`);
            
            // Avcılar takımına puan ekle
            this.teamScores.hunters += 10;
            
            // Ebelenen oyuncuya geçici dokunulmazlık ver
            taggedPlayer.isImmune = true;
            setTimeout(() => {
                taggedPlayer.isImmune = false;
            }, 3000);
            
            // UI'da bildir
            gameUI.showGameMessage(`${taggedPlayer.name} ebelendi! +10 puan Avcılar takımına.`, 2000);
            
            // Skor güncelle
            gameUI.updateScore(`Avcılar: ${this.teamScores.hunters} | Kaçanlar: ${this.teamScores.runners}`);
            
            // Ses efektleri
            if (soundEngine) {
                soundEngine.playSound('tagged');
            }
            
            // Başarıları kontrol et
            checkAchievements('tag', { tagger: taggerPlayer, tagged: taggedPlayer });
        },
        onEscaped: function(player) {
            // Oyuncu belirli bir süre yakalanmadan kaçtı
            
            // Kaçanlar takımına puan ekle
            this.teamScores.runners += 5;
            
            // UI'da bildir
            gameUI.showGameMessage(`${player.name} başarıyla kaçtı! +5 puan Kaçanlar takımına.`, 2000);
            
            // Skor güncelle
            gameUI.updateScore(`Avcılar: ${this.teamScores.hunters} | Kaçanlar: ${this.teamScores.runners}`);
            
            // Başarıları kontrol et
            checkAchievements('escape', { player, escapeDuration: 5 });
        },
        isGameOver: function() {
            // Süre dolunca oyun biter
            return gameTimer <= 0;
        },
        getWinner: function() {
            // En yüksek puanı alan takım kazanır
            if (this.teamScores.hunters > this.teamScores.runners) {
                return { team: 'hunters', name: 'Avcılar Takımı' };
            } else if (this.teamScores.runners > this.teamScores.hunters) {
                return { team: 'runners', name: 'Kaçanlar Takımı' };
            } else {
                return { team: 'draw', name: 'Berabere' };
            }
        }
    }
};

// ----------------------
// YAPAY ZEKA (AI)
// ----------------------

// AI bot oluşturucu
function createAIPlayer(name, type = 'hunter') {
    const aiPlayer = {
        name: name,
        x: 0,
        y: 0,
        speed: 130,
        color: type === 'hunter' ? '#e74c3c' : '#3498db',
        isEbe: type === 'hunter',
        isAI: true,
        characterClass: type === 'hunter' ? 'stealth' : 'runner',
        state: 'idle', // idle, chase, patrol, hide, flee
        target: null,
        path: [],
        lastTargetUpdate: 0,
        lastStateUpdate: 0,
        isRunning: false,
        stamina: 100,
        maxStamina: 100,
        lastKnownPlayerPositions: {},
        
        // AI güncellemesi
        update: function(deltaTime, maze, players) {
            // Durum güncellemesi
            this.updateState(players);
            
            // Durum davranışlarını işle
            switch (this.state) {
                case 'chase':
                    this.chaseTarget(deltaTime);
                    break;
                case 'patrol':
                    this.patrol(deltaTime, maze);
                    break;
                case 'hide':
                    this.hide(deltaTime, maze);
                    break;
                case 'flee':
                    this.flee(deltaTime, players);
                    break;
                default:
                    this.idle(deltaTime);
                    break;
            }
            
            // Stamina yönetimi
            this.updateStamina(deltaTime);
        },
        
        // Durum güncellemesi
        updateState: function(players) {
            const currentTime = Date.now();
            
            // Güncellemeler arasında minimum zaman (500ms)
            if (currentTime - this.lastStateUpdate < 500) return;
            
            this.lastStateUpdate = currentTime;
            
            // Ebe ise
            if (this.isEbe) {
                // En yakın görünen oyuncuyu hedefle
                const target = this.findNearestVisiblePlayer(players);
                
                if (target) {
                    this.state = 'chase';
                    this.target = target;
                    this.lastTargetUpdate = currentTime;
                } else {
                    // Görünen oyuncu yoksa devriye gezmeye başla
                    if (this.state !== 'patrol' || !this.path.length) {
                        this.state = 'patrol';
                        this.generatePatrolPath();
                    }
                }
            } 
            // Ebe değilse
            else {
                // En yakın ebeyi bul
                const nearestEbe = this.findNearestEbe(players);
                
                if (nearestEbe) {
                    const distance = this.distanceTo(nearestEbe);
                    
                    // Eğer ebe yakınsa kaç
                    if (distance < 150) {
                        this.state = 'flee';
                        this.lastTargetUpdate = currentTime;
                    } 
                    // Eğer ebe uzaktaysa ve stamina yüksekse gizlen
                    else if (this.stamina > 50) {
                        this.state = 'hide';
                    }
                    // Diğer durumda devriye gez
                    else {
                        if (this.state !== 'patrol' || !this.path.length) {
                            this.state = 'patrol';
                            this.generatePatrolPath();
                        }
                    }
                } else {
                    // Ebe görünmüyorsa devriye gez
                    if (this.state !== 'patrol' || !this.path.length) {
                        this.state = 'patrol';
                        this.generatePatrolPath();
                    }
                }
            }
        },
        
        // Hedefi kovalama
        chaseTarget: function(deltaTime) {
            if (!this.target) {
                this.state = 'patrol';
                return;
            }
            
            // Hedef konumuna doğru hareket et
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            
            // Mesafe hesapla
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Hedef konum normalleştirme
            const nx = dx / distance;
            const ny = dy / distance;
            
            // Koşma kontrolü
            this.isRunning = distance > 100 && this.stamina > 20;
            
            // Hız hesaplaması
            const moveSpeed = this.isRunning ? this.speed * 1.5 : this.speed;
            
            // Hareket etme
            this.x += nx * moveSpeed * deltaTime;
            this.y += ny * moveSpeed * deltaTime;
            
            // Eğer çok yakınsa ve ebeyse, ebelemeye çalış
            if (this.isEbe && distance < 30) {
                this.tryTag(this.target);
            }
        },
        
        // Devriye gezme
        patrol: function(deltaTime, maze) {
            // Eğer patika boşsa, yeni patika oluştur
            if (!this.path.length) {
                this.generatePatrolPath();
            }
            
            // Bir sonraki patika noktasına git
            const currentTarget = this.path[0];
            if (!currentTarget) return;
            
            const dx = currentTarget.x - this.x;
            const dy = currentTarget.y - this.y;
            
            // Mesafe hesapla
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Hedef konuma ulaşıldı mı?
            if (distance < 20) {
                this.path.shift(); // İlk noktayı kaldır
                return;
            }
            
            // Hedef konum normalleştirme
            const nx = dx / distance;
            const ny = dy / distance;
            
            // Koşma kontrolü - devriye gezme sırasında genellikle koşmaz
            this.isRunning = false;
            
            // Hareket etme
            this.x += nx * this.speed * deltaTime;
            this.y += ny * this.speed * deltaTime;
        },
        
        // Gizlenme
        hide: function(deltaTime, maze) {
            // En yakın gizlenme noktasını bul
            if (!this.target) {
                const hidingSpot = this.findNearestHidingSpot(maze);
                if (hidingSpot) {
                    this.target = hidingSpot;
                } else {
                    this.state = 'patrol';
                    return;
                }
            }
            
            // Gizlenme noktasına git
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            
            // Mesafe hesapla
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Hedef konuma ulaşıldı mı?
            if (distance < 10) {
                // Gizlenme noktasında dur
                this.isRunning = false;
                return;
            }
            
            // Hedef konum normalleştirme
            const nx = dx / distance;
            const ny = dy / distance;
            
            // Koşma kontrolü
            this.isRunning = this.stamina > 30;
            
            // Hız hesaplaması
            const moveSpeed = this.isRunning ? this.speed * 1.5 : this.speed;
            
            // Hareket etme
            this.x += nx * moveSpeed * deltaTime;
            this.y += ny * moveSpeed * deltaTime;
        },
        
        // Kaçma
        flee: function(deltaTime, players) {
            // En yakın ebeyi bul
            const nearestEbe = this.findNearestEbe(players);
            
            if (!nearestEbe) {
                this.state = 'patrol';
                return;
            }
            
            // Ebeden uzaklaş
            const dx = this.x - nearestEbe.x;
            const dy = this.y - nearestEbe.y;
            
            // Mesafe hesapla
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Eğer ebeden yeterince uzaklaştıysa
            if (distance > 250) {
                this.state = 'hide';
                this.target = null;
                return;
            }
            
            // Kaçış yönü normalleştirme
            const nx = dx / distance;
            const ny = dy / distance;
            
            // Koşma kontrolü
            this.isRunning = this.stamina > 10;
            
            // Hız hesaplaması
            const moveSpeed = this.isRunning ? this.speed * 1.5 : this.speed;
            
            // Hareket etme
            this.x += nx * moveSpeed * deltaTime;
            this.y += ny * moveSpeed * deltaTime;
        },
        
        // Boşta durma
        idle: function(deltaTime) {
            // Boşta durma sırasında rastgele küçük hareketler
            if (Math.random() < 0.01) {
                this.state = 'patrol';
                this.generatePatrolPath();
            }
        },
        
        // Stamina güncellemesi
        updateStamina: function(deltaTime) {
            // Koşarken stamina azalır
            if (this.isRunning) {
                this.stamina -= 20 * deltaTime;
                if (this.stamina < 0) {
                    this.stamina = 0;
                    this.isRunning = false;
                }
            } 
            // Koşmazken stamina dolar
            else if (this.stamina < this.maxStamina) {
                this.stamina += 10 * deltaTime;
                if (this.stamina > this.maxStamina) {
                    this.stamina = this.maxStamina;
                }
            }
        },
        
        // En yakın görünen oyuncuyu bul
findNearestVisiblePlayer: function(players) {
    let nearestDistance = Infinity;
    let nearestPlayer = null;
    
    for (const id in players) {
        const player = players[id];
        
        // Kendini hedef alma ve diğer ebeleri hedef alma (eğer ebeyse)
        if (player === this || (this.isEbe && player.isEbe)) {
            continue;
        }
        
        // Oyuncu dokunulmazsa, atla
        if (player.isImmune) {
            continue;
        }
        
        // Görünürlük kontrolü - yapay bir görüş algoritması
        const isVisible = this.canSeePlayer(player);
        
        if (isVisible) {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestPlayer = player;
            }
        } else {
            // Oyuncu görünmese bile, son bilinen konumunu güncelle
            if (Math.random() < 0.1) { // %10 şansla
                this.lastKnownPlayerPositions[id] = { x: player.x, y: player.y, time: Date.now() };
            }
        }
    }
    
    // Yakında görünen oyuncu yoksa, son bilinen konumlara bak
    if (!nearestPlayer) {
        const currentTime = Date.now();
        let mostRecentTime = 0;
        
        for (const id in this.lastKnownPlayerPositions) {
            const posInfo = this.lastKnownPlayerPositions[id];
            const age = currentTime - posInfo.time;
            
            // Son 10 saniye içinde görüldüyse
            if (age < 10000 && posInfo.time > mostRecentTime) {
                const player = players[id];
                if (player && !player.isEbe && !player.isImmune) {
                    nearestPlayer = { x: posInfo.x, y: posInfo.y };
                    mostRecentTime = posInfo.time;
                }
            }
        }
    }
    
    return nearestPlayer;
},

// En yakın ebeyi bul
findNearestEbe: function(players) {
    let nearestDistance = Infinity;
    let nearestEbe = null;
    
    for (const id in players) {
        const player = players[id];
        
        // Sadece ebeleri kontrol et
        if (!player.isEbe) continue;
        
        // Kendini kontrol etme
        if (player === this) continue;
        
        // Görünürlük kontrolü
        const isVisible = this.canSeePlayer(player);
        
        if (isVisible) {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestEbe = player;
            }
        }
    }
    
    return nearestEbe;
},

// En yakın gizlenme noktasını bul
findNearestHidingSpot: function(maze) {
    let nearestDistance = Infinity;
    let nearestHidingSpot = null;
    
    for (let y = 0; y < maze.length; y++) {
        for (let x = 0; x < maze[0].length; x++) {
            // Gizlenme noktaları (2) veya boş alanlar (0)
            if (maze[y][x] === 2) {
                const spotX = x * TILE_SIZE + TILE_SIZE / 2;
                const spotY = y * TILE_SIZE + TILE_SIZE / 2;
                
                const dx = spotX - this.x;
                const dy = spotY - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestHidingSpot = { x: spotX, y: spotY };
                }
            }
        }
    }
    
    return nearestHidingSpot;
},

// Oyuncuyu görebiliyor mu kontrolü
canSeePlayer: function(player) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Mesafe kontrolü - görüş mesafesi 250px
    if (distance > 250) {
        return false;
    }
    
    // Açı kontrolü - görüş açısı 120 derece
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    const viewingAngle = Math.atan2(this.lookDy || 0, this.lookDx || 1) * 180 / Math.PI;
    const angleDiff = Math.abs(((angle - viewingAngle + 180) % 360) - 180);
    
    if (angleDiff > 60) { // 120 derece görüş açısı (60 + 60)
        return false;
    }
    
    // Duvar kontrolü - duvarlar arasında görüş hattı kontrolü
    // Basitleştirilmiş kontrol - gerçekte raycasting yapılmalı
    let blocked = false;
    
    // Basit bir çizgi boyunca 10 nokta kontrol et
    for (let t = 0.1; t < 1; t += 0.1) {
        const checkX = this.x + dx * t;
        const checkY = this.y + dy * t;
        
        // Nokta bir duvar içinde mi?
        const tileX = Math.floor(checkX / TILE_SIZE);
        const tileY = Math.floor(checkY / TILE_SIZE);
        
        if (tileX >= 0 && tileX < maze[0].length && 
            tileY >= 0 && tileY < maze.length) {
            if (maze[tileY][tileX] === 1) { // 1: duvar
                blocked = true;
                break;
            }
        }
    }
    
    if (blocked) {
        return false;
    }
    
    // Gizlilik kontrolü - oyuncu gizleniyorsa görünürlük düşer
    if (player.isHiding) {
        // %30 şansla gizlenen oyuncuyu göremez
        return Math.random() > 0.3;
    }
    
    return true;
},

// Ebelemeyi dene
tryTag: function(target) {
    // Eğer ebe değilsek, ebeleyemeyiz
    if (!this.isEbe) return false;
    
    // Hedefe yeterince yakın mı?
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < 30) { // Ebeleme mesafesi
        // Hedef dokunulmaz mı?
        if (target.isImmune) return false;
        
        // Ebeleme gerçekleştir
        console.log(`AI ${this.name} ebeledi: ${target.name}`);
        
        // Oyun moduna göre ebeleme aksiyonunu çağır
        const gameMode = GAME_MODES[gameMode.toUpperCase()] || GAME_MODES.CLASSIC;
        if (gameMode.onPlayerTagged) {
            gameMode.onPlayerTagged(target, this);
        }
        
        return true;
    }
    
    return false;
},

// Mesafe hesaplama
distanceTo: function(target) {
    if (!target) return Infinity;
    
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    return Math.sqrt(dx * dx + dy * dy);
},

// Devriye patikası oluştur
generatePatrolPath: function() {
    this.path = [];
    
    // 3-5 noktalı rastgele bir patika oluştur
    const pointCount = 3 + Math.floor(Math.random() * 3);
    
    // Başlangıç noktası
    let lastX = this.x;
    let lastY = this.y;
    
    for (let i = 0; i < pointCount; i++) {
        // Rastgele bir mesafe ve açı
        const distance = 100 + Math.random() * 200;
        const angle = Math.random() * Math.PI * 2;
        
        // Yeni nokta
        const newX = lastX + Math.cos(angle) * distance;
        const newY = lastY + Math.sin(angle) * distance;
        
        // Nokta labirent sınırları içinde mi?
        const tileX = Math.floor(newX / TILE_SIZE);
        const tileY = Math.floor(newY / TILE_SIZE);
        
        if (tileX >= 0 && tileX < maze[0].length && 
            tileY >= 0 && tileY < maze.length) {
            if (maze[tileY][tileX] !== 1) { // 1: duvar
                this.path.push({ x: newX, y: newY });
                lastX = newX;
                lastY = newY;
            }
        }
    }
    
    // Eğer patika oluşturulamadıysa, rastgele bir nokta ekle
    if (this.path.length === 0) {
        this.path.push({
            x: this.x + (Math.random() * 400 - 200),
            y: this.y + (Math.random() * 400 - 200)
        });
    }
}
};

// Yapay zeka oyuncuyu oyuna ekle
aiPlayers.push(aiPlayer);
return aiPlayer;
}

// Yapay zeka oyuncuları güncelle
function updateAIPlayers(deltaTime) {
if (!aiPlayers || !aiPlayers.length) return;

// Her AI oyuncuyu güncelle
aiPlayers.forEach(aiPlayer => {
    aiPlayer.update(deltaTime, maze, players);
});
}

// Yapay zeka oyuncuları başlat
function initAIPlayers(count = 3) {
// Mevcut AI oyuncuları temizle
aiPlayers = [];

// Ebeler ve normal oyuncular için sayaçlar
let hunterCount = Math.ceil(count / 3); // Yaklaşık 1/3'ü ebe
let runnerCount = count - hunterCount;

// Ebe AI'lar oluştur
for (let i = 0; i < hunterCount; i++) {
    createAIPlayer(`AI Hunter ${i+1}`, 'hunter');
}

// Normal AI'lar oluştur
for (let i = 0; i < runnerCount; i++) {
    createAIPlayer(`AI Runner ${i+1}`, 'runner');
}

console.log(`${aiPlayers.length} yapay zeka oyuncu oluşturuldu`);
}

// ----------------------
// OYUN MOTORUNDAKİ ENTEGRASYON
// ----------------------

// FPS sayacı
let lastFrameTime = 0;
let fpsCounter = 0;
let fps = 0;
let fpsUpdateTimer = 0;

// Oyun döngüsü modifikasyonu (orijinal oyun döngüsüne aşağıdaki kodu entegre edin)
function enhancedGameLoop(timestamp) {
// Delta Time hesaplama
const deltaTime = (timestamp - lastFrameTime) / 1000; // saniye cinsinden
lastFrameTime = timestamp;

// FPS hesaplama
fpsCounter++;
fpsUpdateTimer += deltaTime;
if (fpsUpdateTimer >= 1) {
    fps = fpsCounter;
    fpsCounter = 0;
    fpsUpdateTimer = 0;
}

// Oyun durumunu güncelle (orijinal oyun kodu)
// ...

// Güç-up sistemini güncelle
if (powerUpManager) {
    powerUpManager.updateActivePowerUps();
    powerUpManager.checkPowerUpCollection(myPlayer.x, myPlayer.y, PLAYER_SIZE);
}

// Dinamik labirenti güncelle
if (mazeManager) {
    mazeManager.updateMovingWalls(deltaTime);
    mazeManager.updateSecretPaths();
}

// Yapay zeka oyuncuları güncelle
if (gameState === 'playing') {
    updateAIPlayers(deltaTime);
}

// Parçacık sistemini güncelle
if (particleSystem) {
    particleSystem.update(deltaTime);
}

// Çizim işlemleri (orijinal oyun kodu)
// ...

// Özel çizimler
if (mazeManager) {
    mazeManager.drawSpecialTiles(ctx);
}

// Hazineleri çiz (Hazine Avcısı modunda)
if (gameMode === 'treasure') {
    drawTreasures(ctx);
}

// Radar efektini çiz
if (powerUpManager && powerUpManager.gameState.radarActive) {
    drawRadarEffect(ctx);
}

// Güç-upları çiz
if (powerUpManager) {
    powerUpManager.drawPowerUps(ctx);
}

// Parçacık efektlerini çiz
if (particleSystem) {
    particleSystem.draw(ctx);
}

// FPS göster
if (showFps) {
    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.fillText(`FPS: ${fps}`, 10, 20);
}

// Sonraki kareyi iste
requestAnimationFrame(enhancedGameLoop);
}

// Oyun başlatma (orijinal startGame fonksiyonuna ekleme yapın)
function enhancedStartGame() {
// Orijinal oyun kodu
// ...

// Karakter sınıfına göre oyuncu ayarla
setupPlayerClass();

// Dinamik labirenti başlat
setupDynamicMaze();

// Güç-up sistemini başlat
setupPowerUpSystem();

// Yapay zeka oyuncularını başlat
initAIPlayers(4);

// Seçilen oyun modunu başlat
startGameMode();

// Oyun durumunu güncelle
gameState = 'playing';

// Oyun arayüzünü güncelle
if (gameUI) {
    gameUI.hideAllScreens();
    gameUI.elements.hud.style.display = 'flex';
}

// Arkaplan müziğini başlat
if (soundEngine) {
    soundEngine.playBackgroundMusic('music_game');
}

// Geliştirilmiş oyun döngüsü başlat
requestAnimationFrame(enhancedGameLoop);
}

// Tüm oyun geliştirmelerini başlat
document.addEventListener('DOMContentLoaded', function() {
// Sayfa yüklendikten sonra oyun geliştirmelerini başlat
initGameEnhancements();
});
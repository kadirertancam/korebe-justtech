// Mobil Kontrol Mekanizması

class MobileControlManager {
    constructor(canvas, gameState) {
        this.canvas = canvas;
        this.gameState = gameState;
        this.joystickContainer = document.getElementById('mobile-joystick-container');
        this.joystick = document.getElementById('mobile-joystick');
        this.actionTagButton = document.getElementById('action-tag');
        this.actionSpecialButton = document.getElementById('action-special');
        
        this.joystickData = {
            active: false,
            centerX: 0,
            centerY: 0,
            currentX: 0,
            currentY: 0,
            radius: 60
        };
        
        this.setupEventListeners();
        this.disablePCControls();
    }
    
    // PC kontrol tuşlarını devre dışı bırak
    disablePCControls() {
        // Klavye event listener'larını devre dışı bırak
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
        
        // Gerekirse tüm klavye kontrol değişkenlerini sıfırla
        if (typeof keys !== 'undefined') {
            keys.w = false;
            keys.a = false;
            keys.s = false;
            keys.d = false;
            keys.shift = false;
        }
    }
    
    setupEventListeners() {
        // Dokunma başlangıcı
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        
        // Dokunma hareketi
        this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        
        // Dokunma bitişi
        this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
        
        // Mobil buton olayları
        this.actionTagButton.addEventListener('touchstart', this.handleTagAction.bind(this));
        this.actionSpecialButton.addEventListener('touchstart', this.handleSpecialAction.bind(this));
    }
    
    handleTouchStart(event) {
        event.preventDefault();
        const touch = event.touches[0];
        
        // Joystick kontrolü
        const joystickRect = this.joystickContainer.getBoundingClientRect();
        if (
            touch.clientX >= joystickRect.left && 
            touch.clientX <= joystickRect.right && 
            touch.clientY >= joystickRect.top && 
            touch.clientY <= joystickRect.bottom
        ) {
            this.joystickData.active = true;
            this.joystickData.centerX = joystickRect.left + joystickRect.width / 2;
            this.joystickData.centerY = joystickRect.top + joystickRect.height / 2;
        } else {
            // Joystick alanı dışında fare/dokunma koordinatlarını güncelle
            mouseX = touch.clientX;
            mouseY = touch.clientY;
        }
    }
    
    handleTouchMove(event) {
        event.preventDefault();
        const touch = event.touches[0];
        
        // Joystick hareketini kontrol et
        if (this.joystickData.active) {
            const dx = touch.clientX - this.joystickData.centerX;
            const dy = touch.clientY - this.joystickData.centerY;
            
            const distance = Math.sqrt(dx * dx + dy * dy);
            const maxDistance = this.joystickData.radius;
            
            // Joystick sınırları içinde hareket
            if (distance <= maxDistance) {
                this.joystick.style.transform = `translate(${dx}px, ${dy}px)`;
                
                // Hareket yönünü hesapla
                const moveX = dx / maxDistance;
                const moveY = dy / maxDistance;
                
                // Oyuncu hareketini güncelle
                this.updatePlayerMovement(moveX, moveY);
            } else {
                // Maksimum sınırda sabit kal
                const angle = Math.atan2(dy, dx);
                const limitedX = Math.cos(angle) * maxDistance;
                const limitedY = Math.sin(angle) * maxDistance;
                
                this.joystick.style.transform = `translate(${limitedX}px, ${limitedY}px)`;
                
                const moveX = limitedX / maxDistance;
                const moveY = limitedY / maxDistance;
                
                this.updatePlayerMovement(moveX, moveY);
            }
            
            // Fare koordinatlarını da güncelle (bakış açısı için)
            mouseX = touch.clientX;
            mouseY = touch.clientY;
        } else {
            // Joystick dışında fare koordinatlarını güncelle
            mouseX = touch.clientX;
            mouseY = touch.clientY;
        }
    }
    
    handleTouchEnd(event) {
        event.preventDefault();
        
        // Joystick konumunu sıfırla
        if (this.joystickData.active) {
            this.joystickData.active = false;
            this.joystick.style.transform = 'translate(-50%, -50%)';
            
            // Hareket kontrollerini sıfırla
            this.updatePlayerMovement(0, 0);
        }
    }
    
    updatePlayerMovement(x, y) {
        // Oyuncu hareket kontrollerini güncelle
        if (typeof keys !== 'undefined') {
            keys.w = y < -0.5;
            keys.s = y > 0.5;
            keys.a = x < -0.5;
            keys.d = x > 0.5;
            
            // Koşma kontrolü
            keys.shift = Math.abs(x) > 0.8 || Math.abs(y) > 0.8;
        }
    }
    
    handleTagAction() {
        // Ebeleme aksiyonu
        if (this.gameState.isEbe && typeof checkCatchPlayers === 'function') {
            checkCatchPlayers();
        }
    }
    
    handleSpecialAction() {
        // Karakter sınıfına özel yetenek
        if (typeof powerUpManager !== 'undefined') {
            powerUpManager.activatePowerUp(0); // İlk güç-up'ı kullan
        }
    }
    
    // Mobil cihaz kontrollerini etkinleştir
    enableMobileControls() {
        this.joystickContainer.style.display = 'block';
        this.actionTagButton.style.display = 'block';
        this.actionSpecialButton.style.display = 'block';
    }
    
    // Mobil cihaz kontrollerini devre dışı bırak
    disableMobileControls() {
        this.joystickContainer.style.display = 'none';
        this.actionTagButton.style.display = 'none';
        this.actionSpecialButton.style.display = 'none';
    }
}

// Mobil cihaz kontrolü
function initMobileControls() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
        const mobileControlManager = new MobileControlManager(canvas, {
            isEbe: isEbe
        });
        
        // Oyun başladığında mobil kontrolleri etkinleştir
        mobileControlManager.enableMobileControls();
    }
}

// Sayfa yüklendiğinde mobil kontrolleri başlat
document.addEventListener('DOMContentLoaded', initMobileControls);
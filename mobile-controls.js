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
    }
    
    setupEventListeners() {
        // Dokunma başlangıcı
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
        
        // Dokunma hareketi
        this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
        
        // Dokunma bitişi
        this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
        
        // Mobil buton olayları
        this.actionTagButton.addEventListener('touchstart', this.handleTagAction.bind(this));
        this.actionSpecialButton.addEventListener('touchstart', this.handleSpecialAction.bind(this));
    }
    
    handleTouchStart(event) {
        event.preventDefault();
        const touch = event.touches[0];
        
        // Joystick kontrolü
        if (this.isInJoystickArea(touch)) {
            this.joystickData.active = true;
            this.joystickData.centerX = this.joystickContainer.offsetLeft + this.joystickContainer.offsetWidth / 2;
            this.joystickData.centerY = this.joystickContainer.offsetTop + this.joystickContainer.offsetHeight / 2;
        }
    }
    
    handleTouchMove(event) {
        event.preventDefault();
        const touch = event.touches[0];
        
        if (this.joystickData.active) {
            // Joystick hareketini hesapla
            const dx = touch.pageX - this.joystickData.centerX;
            const dy = touch.pageY - this.joystickData.centerY;
            
            // Joystick sınırları içinde kalmak
            const distance = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);
            
            if (distance <= this.joystickData.radius) {
                this.joystick.style.transform = `translate(${dx}px, ${dy}px)`;
                
                // Oyuncu hareketini hesapla
                const moveX = dx / this.joystickData.radius;
                const moveY = dy / this.joystickData.radius;
                
                // Oyuncu hareketini güncelle
                this.updatePlayerMovement(moveX, moveY);
            }
        }
    }
    
    handleTouchEnd(event) {
        // Joystick konumunu sıfırla
        this.joystickData.active = false;
        this.joystick.style.transform = 'translate(-50%, -50%)';
        
        // Oyuncu hareketini durdur
        this.updatePlayerMovement(0, 0);
    }
    
    isInJoystickArea(touch) {
        const joystickRect = this.joystickContainer.getBoundingClientRect();
        return (
            touch.pageX >= joystickRect.left &&
            touch.pageX <= joystickRect.right &&
            touch.pageY >= joystickRect.top &&
            touch.pageY <= joystickRect.bottom
        );
    }
    
    updatePlayerMovement(x, y) {
        // Oyuncu hareket kontrollerini güncelle
        keys.w = y < -0.5;
        keys.s = y > 0.5;
        keys.a = x < -0.5;
        keys.d = x > 0.5;
        
        // Koşma kontrolü
        keys.shift = Math.abs(x) > 0.8 || Math.abs(y) > 0.8;
    }
    
    handleTagAction() {
        // Ebeleme aksiyonu
        if (this.gameState.isEbe) {
            checkCatchPlayers();
        }
    }
    
    handleSpecialAction() {
        // Karakter sınıfına özel yetenek
        if (powerUpManager) {
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
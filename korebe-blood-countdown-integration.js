// Körebe oyununa eklenecek HTML
// HTML'in <body> etiketine ekleyin
const bloodOverlayHTML = `
<!-- Kan Temalı Geri Sayım Overlay -->
<div id="blood-overlay" style="display: none;">
    <canvas id="blood-canvas"></canvas>
    <div id="countdown-splash"></div>
    <div id="countdown-container">
        <div id="countdown-number">3</div>
    </div>
</div>
`;

// Körebe oyununa eklenecek CSS
// HTML'in <head> etiketine ekleyin
const bloodOverlayCSS = `
/* Kan temalı font */
@font-face {
    font-family: 'Horror';
    src: url('https://fonts.gstatic.com/s/creepster/v13/AlZy_zVUqJz4yMrniH4Rcn35.woff2') format('woff2');
    font-weight: normal;
    font-style: normal;
}

#blood-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.7);
    z-index: 1000;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
}

#blood-canvas {
    position: absolute;
    width: 100%;
    height: 100%;
    z-index: 1001;
}

#countdown-container {
    position: relative;
    z-index: 1002;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
}

#countdown-number {
    font-family: 'Horror', sans-serif;
    font-size: 20vw;
    color: #8a0303;
    text-shadow: 
        0 0 20px #ff0000,
        0 0 30px #600000,
        0 0 40px #300000;
    position: relative;
    opacity: 0;
    transform: scale(0.5);
    animation: pulse 1s ease-in-out infinite alternate;
}

#countdown-splash {
    position: absolute;
    width: 100%;
    height: 100%;
    background-size: cover;
    background-position: center;
    opacity: 0;
    z-index: 1003;
}

/* Kan damlaları */
.blood-drop {
    position: absolute;
    background-color: #8a0303;
    border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
    transform: rotate(45deg);
    filter: blur(1px);
    opacity: 0;
    z-index: 1001;
}

@keyframes drip {
    0% {
        transform: translateY(0) rotate(45deg) scale(1);
        opacity: 0.9;
    }
    100% {
        transform: translateY(200px) rotate(45deg) scale(0.7);
        opacity: 0;
    }
}

@keyframes pulse {
    0% {
        transform: scale(0.95);
        text-shadow: 
            0 0 20px #ff0000,
            0 0 30px #600000,
            0 0 40px #300000;
    }
    100% {
        transform: scale(1.05);
        text-shadow: 
            0 0 25px #ff0000,
            0 0 40px #600000,
            0 0 60px #300000;
    }
}

@keyframes splash {
    0% {
        opacity: 0.7;
    }
    100% {
        opacity: 0;
    }
}

@keyframes appear {
    0% {
        opacity: 0;
        transform: scale(0.5);
    }
    100% {
        opacity: 1;
        transform: scale(1);
    }
}

@keyframes disappear {
    0% {
        opacity: 1;
        transform: scale(1);
    }
    100% {
        opacity: 0;
        transform: scale(1.5);
    }
}

/* Kan lekeleri */
.blood-stain {
    position: absolute;
    background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M50,5C25,5,5,25,5,50s20,45,45,45s45-20,45-45S75,5,50,5z M85.5,67.5C77.8,82.9,60.9,90,45.5,82.3s-22.5-24.6-14.8-40s24.6-22.5,40-14.8 S93.2,52.1,85.5,67.5z" fill="%238a0303"/></svg>');
    background-size: contain;
    background-repeat: no-repeat;
    opacity: 0.5;
    z-index: 1002;
}

/* Kan pıhtıları */
.blood-clot {
    position: absolute;
    background-color: #5e0101;
    border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
    transform: rotate(45deg);
    opacity: 0.7;
    z-index: 1001;
}
`;

// Körebe oyununa eklenecek JavaScript
// Aşağıdaki kodu mevcut JS koduna entegre edin

// Kan animasyonu değişkenleri
let bloodCanvas;
let bloodCtx;
let bloodOverlay;
let countdownNumber;
let countdownSplash;

// Kan pozları (parlak ve koyu kırmızı renkler)
const bloodColors = [
    '#8a0303', // Koyu kan kırmızısı
    '#a81616', // Orta kırmızı
    '#770000', // Çok koyu
    '#c22121', // Parlak kan
    '#5e0101'  // Pıhtılaşmış kan
];

// Kan elementlerini hazırla
function initBloodElements() {
    // HTML'i body'e ekle
    const bloodOverlayContainer = document.createElement('div');
    bloodOverlayContainer.innerHTML = bloodOverlayHTML;
    document.body.appendChild(bloodOverlayContainer.firstElementChild);
    
    // CSS'i head'e ekle
    const bloodStyle = document.createElement('style');
    bloodStyle.textContent = bloodOverlayCSS;
    document.head.appendChild(bloodStyle);
    
    // Elementleri seç
    bloodCanvas = document.getElementById('blood-canvas');
    bloodCtx = bloodCanvas.getContext('2d');
    bloodOverlay = document.getElementById('blood-overlay');
    countdownNumber = document.getElementById('countdown-number');
    countdownSplash = document.getElementById('countdown-splash');
    
    // Canvas boyutlandırma
    bloodCanvas.width = window.innerWidth;
    bloodCanvas.height = window.innerHeight;
    
    // Pencere boyutu değiştiğinde canvas boyutunu güncelle
    window.addEventListener('resize', () => {
        bloodCanvas.width = window.innerWidth;
        bloodCanvas.height = window.innerHeight;
    });
}

// Kan damlası, kan lekesi ve pıhtı oluşturma
function createBloodElements() {
    // Kan damlaları oluştur
    for (let i = 0; i < 15; i++) {
        createBloodDrop();
    }
    
    // Kan lekeleri oluştur
    for (let i = 0; i < 10; i++) {
        createBloodStain();
    }
    
    // Kan pıhtıları oluştur
    for (let i = 0; i < 8; i++) {
        createBloodClot();
    }
}

// Kan damlası oluştur
function createBloodDrop() {
    const drop = document.createElement('div');
    drop.className = 'blood-drop';
    
    // Rastgele boyut ve pozisyon
    const size = 5 + Math.random() * 15;
    const left = Math.random() * window.innerWidth;
    const top = -50 + Math.random() * 150; // Ekranın üst kısmında başla
    
    drop.style.width = `${size}px`;
    drop.style.height = `${size * 1.5}px`;
    drop.style.left = `${left}px`;
    drop.style.top = `${top}px`;
    drop.style.backgroundColor = bloodColors[Math.floor(Math.random() * bloodColors.length)];
    
    // Animasyon
    drop.style.animation = `drip ${1 + Math.random() * 4}s linear ${Math.random() * 3}s`;
    
    // Ekrana ekle
    bloodOverlay.appendChild(drop);
    
    // Animasyon bitince sil
    drop.addEventListener('animationend', () => {
        drop.remove();
        // Yeni damla oluştur
        if (bloodOverlay.style.display !== 'none') {
            createBloodDrop();
        }
    });
}

// Kan lekesi oluştur
function createBloodStain() {
    const stain = document.createElement('div');
    stain.className = 'blood-stain';
    
    // Rastgele boyut, pozisyon ve rotasyon
    const size = 30 + Math.random() * 100;
    const left = Math.random() * window.innerWidth;
    const top = Math.random() * window.innerHeight;
    const rotation = Math.random() * 360;
    
    stain.style.width = `${size}px`;
    stain.style.height = `${size}px`;
    stain.style.left = `${left}px`;
    stain.style.top = `${top}px`;
    stain.style.transform = `rotate(${rotation}deg)`;
    stain.style.opacity = 0.1 + Math.random() * 0.4;
    
    // Ekrana ekle
    bloodOverlay.appendChild(stain);
    
    // 8-12 saniye sonra sil
    setTimeout(() => {
        if (stain.parentNode) {
            stain.remove();
        }
    }, 8000 + Math.random() * 4000);
}

// Kan pıhtısı oluştur
function createBloodClot() {
    const clot = document.createElement('div');
    clot.className = 'blood-clot';
    
    // Rastgele boyut, pozisyon ve rotasyon
    const size = 10 + Math.random() * 30;
    const left = Math.random() * window.innerWidth;
    const top = Math.random() * window.innerHeight;
    const rotation = Math.random() * 360;
    
    clot.style.width = `${size}px`;
    clot.style.height = `${size}px`;
    clot.style.left = `${left}px`;
    clot.style.top = `${top}px`;
    clot.style.transform = `rotate(${rotation}deg)`;
    clot.style.opacity = 0.3 + Math.random() * 0.4;
    
    // Ekrana ekle
    bloodOverlay.appendChild(clot);
    
    // 5-10 saniye sonra sil
    setTimeout(() => {
        if (clot.parentNode) {
            clot.remove();
        }
    }, 5000 + Math.random() * 5000);
}

// Canvas üzerinde kan sıçraması çiz
function drawBloodSplash() {
    bloodCtx.clearRect(0, 0, bloodCanvas.width, bloodCanvas.height);
    
    // Rastgele kan sıçramaları
    for (let i = 0; i < 20; i++) {
        const x = Math.random() * bloodCanvas.width;
        const y = Math.random() * bloodCanvas.height;
        
        // Rastgele yön ve uzunlukta kan sıçramaları
        const angle = Math.random() * Math.PI * 2;
        const length = 20 + Math.random() * 100;
        const endX = x + Math.cos(angle) * length;
        const endY = y + Math.sin(angle) * length;
        
        // Kan rengi
        bloodCtx.strokeStyle = bloodColors[Math.floor(Math.random() * bloodColors.length)];
        bloodCtx.lineWidth = 2 + Math.random() * 8;
        
        // Çizgi çiz
        bloodCtx.beginPath();
        bloodCtx.moveTo(x, y);
        
        // Kavisli kan sıçraması
        const controlX = x + Math.cos(angle + Math.PI/4) * length * 0.7;
        const controlY = y + Math.sin(angle + Math.PI/4) * length * 0.7;
        bloodCtx.quadraticCurveTo(controlX, controlY, endX, endY);
        bloodCtx.stroke();
        
        // Kan damlası ekle
        bloodCtx.fillStyle = bloodCtx.strokeStyle;
        bloodCtx.beginPath();
        bloodCtx.arc(endX, endY, bloodCtx.lineWidth * 0.8, 0, Math.PI * 2);
        bloodCtx.fill();
    }
}

// Sayıyı görüntüle ve animasyonu başlat
function showNumber(number) {
    countdownNumber.textContent = number;
    countdownNumber.style.opacity = '0';
    countdownNumber.style.animation = 'none';
    
    // Yeni renk tonu
    const hue = 0; // Kırmızı
    const lightness = 30 + Math.random() * 15; // Parlaklık
    countdownNumber.style.color = `hsl(${hue}, 100%, ${lightness}%)`;
    
    // Görünme animasyonu
    setTimeout(() => {
        countdownNumber.style.opacity = '1';
        countdownNumber.style.animation = 'pulse 1s infinite alternate';
        countdownNumber.style.transition = 'opacity 0.5s, transform 0.5s';
        countdownNumber.style.transform = 'scale(1)';
        
        // Kan sıçraması efekti
        drawBloodSplash();
        
        // Kan sıçrama animasyonu
        countdownSplash.style.opacity = '0.7';
        countdownSplash.style.animation = 'splash 1s';
    }, 100);
}

// Kanlı geri sayım animasyonu
function startBloodCountdown(totalSeconds, onComplete) {
    // Overlay'i görünür yap
    bloodOverlay.style.display = 'flex';
    
    // Kan elementleri oluştur
    createBloodElements();
    
    // İlk sayıyı göster
    let currentSecond = totalSeconds;
    showNumber(currentSecond);
    
    // Geri sayım intervali
    const countdownInterval = setInterval(() => {
        currentSecond--;
        
        if (currentSecond > 0) {
            // Kaybolma animasyonu
            countdownNumber.style.opacity = '0';
            countdownNumber.style.transform = 'scale(1.5)';
            
            // Kısa bir gecikme sonrası yeni sayıyı göster
            setTimeout(() => {
                showNumber(currentSecond);
            }, 500);
        } else {
            // Geri sayım bitti
            clearInterval(countdownInterval);
            
            // Son sayı kaybolsun
            countdownNumber.style.opacity = '0';
            countdownNumber.style.transform = 'scale(1.5)';
            
            // Geri sayım bittiğinde overlay'i kapat
            setTimeout(() => {
                bloodOverlay.style.display = 'none';
                
                // Kan elementlerini temizle
                const bloodElements = bloodOverlay.querySelectorAll('.blood-drop, .blood-stain, .blood-clot');
                bloodElements.forEach(element => element.remove());
                
                // Canvas temizle
                bloodCtx.clearRect(0, 0, bloodCanvas.width, bloodCanvas.height);
                
                // Tamamlandı callback
                if (onComplete) onComplete();
            }, 1000);
        }
    }, 1000);
}

// Körebe oyununun ebe değişim fonksiyonuna entegre etme
// Bu fonksiyonu mevcut kodda uygun yere yerleştirin:
function startEbeCountdown() {
    // İlk çağrıldığında kan elementlerini hazırla
    if (!bloodCanvas) {
        initBloodElements();
    }
    
    // Donmuş duruma geç
    isFreezed = true;
    
    // Kanlı geri sayımı başlat
    startBloodCountdown(3, () => {
        // Donmuş durumdan çık
        isFreezed = false;
    });
}

// Körebe oyununun WebSocket yönetiminde ebe değişim kısmını şu şekilde değiştirin:
// case 'new_ebe': bloğu içinde şu kodu bulun:
/*
if (message.ebeId === clientId && !wasEbe) {
    // Yeni ebe olunduğunda donma durumunu ayarla
    isFreezed = true;
    setTimeout(function() {
        isFreezed = false;
    }, 3000);
    
    showStatusMessage('Şimdi EBE sensin! 3 saniye sonra başlayabilirsin.');
}
*/

// Ve şu kod ile değiştirin:
/*
if (message.ebeId === clientId && !wasEbe) {
    // Kanlı geri sayım animasyonu başlat
    startEbeCountdown();
    
    showStatusMessage('Şimdi EBE sensin!');
}
*/

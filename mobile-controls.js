// improved-mobile-controls.js
// Enhanced mobile controls with better appearance and fullscreen functionality

class MobileControlManager {
    constructor() {
        this.isMobile = this.detectMobile();
        this.joystickSize = 150;
        this.joystickInnerSize = 60;
        this.buttonSize = 80;
        this.joystick = null;
        this.joystickInner = null;
        this.runButton = null;
        this.actionButton = null;
        this.joystickActive = false;
        this.joystickTouchId = null;
        this.joystickStartX = 0;
        this.joystickStartY = 0;
        this.joystickMaxDistance = this.joystickSize / 3;
        
        // Add styles to document
        this.addStyles();
        
        // Initialize if mobile
        if (this.isMobile) {
            this.setupMobileControls();
            this.disablePCControls();
            this.requestFullscreen();
        }
    }
    
    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
               (window.innerWidth <= 800);
    }
    
    addStyles() {
        // Add CSS styles for mobile controls
        const style = document.createElement('style');
        style.textContent = `
            /* Mobile Controls Styles */
            .mobile-control {
                position: fixed;
                z-index: 1000;
                touch-action: none;
                user-select: none;
            }
            
            #joystick-container {
                bottom: 100px;
                left: 50px;
                width: ${this.joystickSize}px;
                height: ${this.joystickSize}px;
                border-radius: 50%;
                background: radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 70%, rgba(255,255,255,0) 100%);
                border: 2px solid rgba(255,255,255,0.3);
                box-shadow: 0 0 10px rgba(0,0,0,0.2);
                backdrop-filter: blur(3px);
                -webkit-backdrop-filter: blur(3px);
            }
            
            #joystick-inner {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: ${this.joystickInnerSize}px;
                height: ${this.joystickInnerSize}px;
                border-radius: 50%;
                background: radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%);
                box-shadow: 0 0 15px rgba(255,255,255,0.5);
                transition: transform 0.1s ease, box-shadow 0.2s ease;
            }
            
            .game-button {
                display: flex;
                justify-content: center;
                align-items: center;
                font-family: Arial, sans-serif;
                font-weight: bold;
                color: white;
                text-shadow: 0 1px 3px rgba(0,0,0,0.5);
                border-radius: 50%;
                box-shadow: 0 5px 15px rgba(0,0,0,0.3);
                backdrop-filter: blur(3px);
                -webkit-backdrop-filter: blur(3px);
                transform: translateY(0);
                transition: transform 0.1s, background-color 0.2s, box-shadow 0.2s;
            }
            
            .game-button:active {
                transform: translateY(2px);
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            }
            
            #run-button {
                bottom: 110px;
                right: 50px;
                width: ${this.buttonSize}px;
                height: ${this.buttonSize}px;
                background: radial-gradient(circle, rgba(255,100,100,0.8) 0%, rgba(200,50,50,0.6) 100%);
                border: 2px solid rgba(255,150,150,0.6);
            }
            
            #action-button {
                bottom: 220px;
                right: 50px;
                width: ${this.buttonSize}px;
                height: ${this.buttonSize}px;
                background: radial-gradient(circle, rgba(100,255,100,0.8) 0%, rgba(50,200,50,0.6) 100%);
                border: 2px solid rgba(150,255,150,0.6);
            }
            
            #fullscreen-button {
                top: 20px;
                right: 20px;
                width: 40px;
                height: 40px;
                background: rgba(0,0,0,0.5);
                border-radius: 8px;
                display: flex;
                justify-content: center;
                align-items: center;
                font-size: 20px;
            }
            
            /* Button icons */
            .button-icon {
                width: 60%;
                height: 60%;
                display: flex;
                justify-content: center;
                align-items: center;
                font-size: 20px;
            }
            
            /* Button effects */
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
            }
            
            .game-button:hover .button-icon {
                animation: pulse 1s infinite;
            }
        `;
        document.head.appendChild(style);
    }
    
    disablePCControls() {
        // Define fallback handler to prevent errors
        window.handleKeyDown = window.handleKeyDown || function(e) {
            console.log("Key event intercepted and ignored");
        };
        
        // Disable keyboard controls
        window.removeEventListener('keydown', window.handleKeyDown);
        
        // Hide desktop instructions
        const instructions = document.querySelector('.instructions');
        if (instructions) {
            instructions.style.display = 'none';
        }
    }
    
    requestFullscreen() {
        // Create fullscreen button
        const fullscreenBtn = document.createElement('div');
        fullscreenBtn.id = 'fullscreen-button';
        fullscreenBtn.className = 'mobile-control';
        fullscreenBtn.innerHTML = '⛶';
        fullscreenBtn.addEventListener('click', () => {
            this.enterFullscreen();
        });
        document.body.appendChild(fullscreenBtn);
        
        // Try to request fullscreen when game starts
        this.tryFullscreen();
        
        // Also listen for the first user interaction to request fullscreen
        document.addEventListener('touchstart', () => {
            this.tryFullscreen();
        }, { once: true });
    }
    
    tryFullscreen() {
        setTimeout(() => {
            // Try to request fullscreen
            this.enterFullscreen();
        }, 1000);
    }
    
    enterFullscreen() {
        const docEl = document.documentElement;
        
        // Check which fullscreen method is available and use it
        if (docEl.requestFullscreen) {
            docEl.requestFullscreen().catch(err => {
                console.log('Fullscreen request failed:', err);
            });
        } else if (docEl.mozRequestFullScreen) { // Firefox
            docEl.mozRequestFullScreen();
        } else if (docEl.webkitRequestFullscreen) { // Chrome, Safari
            docEl.webkitRequestFullscreen();
        } else if (docEl.msRequestFullscreen) { // IE/Edge
            docEl.msRequestFullscreen();
        }
        
        // Lock screen orientation to landscape if available
        if (screen.orientation && screen.orientation.lock) {
            screen.orientation.lock('landscape').catch(e => {
                console.log('Orientation lock failed:', e);
            });
        }
    }
    
    setupMobileControls() {
        // Create joystick container
        this.joystick = document.createElement('div');
        this.joystick.id = 'joystick-container';
        this.joystick.className = 'mobile-control';
        
        // Create joystick inner
        this.joystickInner = document.createElement('div');
        this.joystickInner.id = 'joystick-inner';
        
        this.joystick.appendChild(this.joystickInner);
        document.body.appendChild(this.joystick);
        
        // Create run button
        this.runButton = document.createElement('div');
        this.runButton.id = 'run-button';
        this.runButton.className = 'mobile-control game-button';
        
        // Add run icon
        const runIcon = document.createElement('div');
        runIcon.className = 'button-icon';
        runIcon.innerHTML = '🏃';
        this.runButton.appendChild(runIcon);
        
        document.body.appendChild(this.runButton);
        
        // Create action button
        this.actionButton = document.createElement('div');
        this.actionButton.id = 'action-button';
        this.actionButton.className = 'mobile-control game-button';
        
        // Add action icon
        const actionIcon = document.createElement('div');
        actionIcon.className = 'button-icon';
        actionIcon.innerHTML = '👋';
        this.actionButton.appendChild(actionIcon);
        
        document.body.appendChild(this.actionButton);
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Adjust UI for mobile
        this.adjustUIForMobile();
    }
    
    adjustUIForMobile() {
        // Adjust UI elements for mobile
        const gameUI = document.getElementById('game-ui');
        if (gameUI) {
            gameUI.style.top = '10px';
            gameUI.style.right = '10px';
            gameUI.style.fontSize = '14px';
        }
        
        const playerList = document.getElementById('player-list');
        if (playerList) {
            playerList.style.maxWidth = '120px';
            playerList.style.fontSize = '12px';
        }
        
        // Ensure viewport is properly set
        let viewport = document.querySelector('meta[name="viewport"]');
        if (!viewport) {
            viewport = document.createElement('meta');
            viewport.name = 'viewport';
            document.head.appendChild(viewport);
        }
        viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
        
        // Prevent scrolling/zooming
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
        document.body.style.height = '100%';
    }
    
    setupEventListeners() {
        // Joystick events
        this.joystick.addEventListener('touchstart', this.handleJoystickStart.bind(this));
        document.addEventListener('touchmove', this.handleJoystickMove.bind(this));
        document.addEventListener('touchend', this.handleJoystickEnd.bind(this));
        document.addEventListener('touchcancel', this.handleJoystickEnd.bind(this));
        
        // Run button events
        this.runButton.addEventListener('touchstart', this.handleRunStart.bind(this));
        this.runButton.addEventListener('touchend', this.handleRunEnd.bind(this));
        this.runButton.addEventListener('touchcancel', this.handleRunEnd.bind(this));
        
        // Action button events
        this.actionButton.addEventListener('touchstart', this.handleActionPress.bind(this));
    }
    
    handleJoystickStart(e) {
        if (this.joystickActive) return;
        
        e.preventDefault();
        const touch = e.touches[0];
        this.joystickActive = true;
        this.joystickTouchId = touch.identifier;
        
        const joystickRect = this.joystick.getBoundingClientRect();
        this.joystickStartX = joystickRect.left + joystickRect.width / 2;
        this.joystickStartY = joystickRect.top + joystickRect.height / 2;
        
        this.updateJoystickPosition(touch.clientX, touch.clientY);
    }
    
    handleJoystickMove(e) {
        if (!this.joystickActive) return;
        
        e.preventDefault();
        
        // Find the right touch
        for (let i = 0; i < e.touches.length; i++) {
            if (e.touches[i].identifier === this.joystickTouchId) {
                this.updateJoystickPosition(e.touches[i].clientX, e.touches[i].clientY);
                break;
            }
        }
    }
    
    updateJoystickPosition(touchX, touchY) {
        // Calculate displacement from center
        let deltaX = touchX - this.joystickStartX;
        let deltaY = touchY - this.joystickStartY;
        
        // Calculate distance
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // Limit to max distance
        if (distance > this.joystickMaxDistance) {
            deltaX = (deltaX / distance) * this.joystickMaxDistance;
            deltaY = (deltaY / distance) * this.joystickMaxDistance;
        }
        
        // Update joystick position with smoother animation
        this.joystickInner.style.transform = `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px))`;
        
        // Update shadow based on distance (more distance = stronger glow)
        const shadowIntensity = Math.min(15, 5 + distance / 5);
        this.joystickInner.style.boxShadow = `0 0 ${shadowIntensity}px rgba(255,255,255,0.7)`;
        
        // Update game controls
        if (window.keys) {
            window.keys.w = deltaY < -10;
            window.keys.s = deltaY > 10;
            window.keys.a = deltaX < -10;
            window.keys.d = deltaX > 10;
        }
    }
    
    handleJoystickEnd(e) {
        // Check if our touch ended
        let touchFound = false;
        for (let i = 0; i < e.touches.length; i++) {
            if (e.touches[i].identifier === this.joystickTouchId) {
                touchFound = true;
                break;
            }
        }
        
        if (!touchFound) {
            this.joystickActive = false;
            this.joystickTouchId = null;
            
            // Reset joystick position with smooth animation
            this.joystickInner.style.transition = 'transform 0.2s ease, box-shadow 0.2s ease';
            this.joystickInner.style.transform = 'translate(-50%, -50%)';
            this.joystickInner.style.boxShadow = '0 0 15px rgba(255,255,255,0.5)';
            
            // Remove transition after animation completes
            setTimeout(() => {
                this.joystickInner.style.transition = '';
            }, 200);
            
            // Reset game controls
            if (window.keys) {
                window.keys.w = false;
                window.keys.a = false;
                window.keys.s = false;
                window.keys.d = false;
            }
        }
    }
    
    handleRunStart(e) {
        e.preventDefault();
        
        // Update visual state
        this.runButton.style.boxShadow = '0 2px 8px rgba(255,50,50,0.5)';
        this.runButton.style.background = 'radial-gradient(circle, rgba(255,50,50,0.9) 0%, rgba(200,0,0,0.7) 100%)';
        
        // Update game controls
        if (window.keys) {
            window.keys.shift = true;
        }
    }
    
    handleRunEnd(e) {
        // Update visual state
        this.runButton.style.boxShadow = '0 5px 15px rgba(0,0,0,0.3)';
        this.runButton.style.background = 'radial-gradient(circle, rgba(255,100,100,0.8) 0%, rgba(200,50,50,0.6) 100%)';
        
        // Update game controls
        if (window.keys) {
            window.keys.shift = false;
        }
    }
    
    handleActionPress(e) {
        e.preventDefault();
        
        // Visual feedback
        this.actionButton.style.boxShadow = '0 2px 8px rgba(50,255,50,0.5)';
        this.actionButton.style.background = 'radial-gradient(circle, rgba(50,255,50,0.9) 0%, rgba(0,200,0,0.7) 100%)';
        
        setTimeout(() => {
            this.actionButton.style.boxShadow = '0 5px 15px rgba(0,0,0,0.3)';
            this.actionButton.style.background = 'radial-gradient(circle, rgba(100,255,100,0.8) 0%, rgba(50,200,50,0.6) 100%)';
        }, 100);
        
        // Game action - either tag if player is "it" or use power-up
        if (window.isEbe && window.checkCatchPlayers) {
            window.checkCatchPlayers();
        } else if (window.powerUpManager && 
                  window.powerUpManager.inventory && 
                  window.powerUpManager.inventory.length > 0) {
            window.powerUpManager.activatePowerUp(0);
        }
    }
}

// Initialize mobile controls
function initMobileControls() {
    // Create global control manager instance
    window.mobileControlManager = new MobileControlManager();
}

// Initialize when document is loaded
document.addEventListener('DOMContentLoaded', initMobileControls);

// Also initialize when game starts
if (window.startGame) {
    const originalStartGame = window.startGame;
    window.startGame = function() {
        originalStartGame.apply(this, arguments);
        initMobileControls();
        
        // Try to go fullscreen when game starts
        if (window.mobileControlManager) {
            window.mobileControlManager.tryFullscreen();
        }
    };
}

// Initialize on orientation change to ensure controls adapt
window.addEventListener('orientationchange', function() {
    // Reinitialize controls after slight delay to allow rotation to complete
    setTimeout(() => {
        if (window.mobileControlManager && window.mobileControlManager.isMobile) {
            window.mobileControlManager.tryFullscreen();
        }
    }, 300);
});
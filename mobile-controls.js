// mobile-controls.js - Fixed version

class MobileControlManager {
    constructor() {
        this.isMobile = this.detectMobile();
        this.joystickSize = 120;
        this.joystickInnerSize = 50;
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
        
        // Initialize if mobile
        if (this.isMobile) {
            this.setupMobileControls();
            this.disablePCControls();
        }
    }
    
    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
               (window.innerWidth <= 800);
    }
    
    disablePCControls() {
        // Define handleKeyDown function to fix the error
        window.handleKeyDown = function(e) {
            // No-op function to prevent errors
            console.log("Key event intercepted and ignored");
        };
        
        // Disable keyboard controls by removing existing event listeners
        window.removeEventListener('keydown', window.handleKeyDown);
        
        // Hide desktop instructions
        const instructions = document.querySelector('.instructions');
        if (instructions) {
            instructions.style.display = 'none';
        }
    }
    
    setupMobileControls() {
        // Create joystick container
        this.joystick = document.createElement('div');
        this.joystick.id = 'joystick-container';
        this.joystick.style.cssText = `
            position: fixed;
            bottom: 80px;
            left: 50px;
            width: ${this.joystickSize}px;
            height: ${this.joystickSize}px;
            background-color: rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            z-index: 1000;
            touch-action: none;
        `;
        
        // Create joystick inner
        this.joystickInner = document.createElement('div');
        this.joystickInner.id = 'joystick-inner';
        this.joystickInner.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: ${this.joystickInnerSize}px;
            height: ${this.joystickInnerSize}px;
            background-color: rgba(255, 255, 255, 0.5);
            border-radius: 50%;
            z-index: 1001;
        `;
        
        this.joystick.appendChild(this.joystickInner);
        document.body.appendChild(this.joystick);
        
        // Create run button
        this.runButton = document.createElement('div');
        this.runButton.id = 'run-button';
        this.runButton.style.cssText = `
            position: fixed;
            bottom: 100px;
            right: 50px;
            width: ${this.buttonSize}px;
            height: ${this.buttonSize}px;
            background-color: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            z-index: 1000;
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 18px;
            font-weight: bold;
            color: white;
            touch-action: none;
        `;
        this.runButton.textContent = 'RUN';
        document.body.appendChild(this.runButton);
        
        // Create action button
        this.actionButton = document.createElement('div');
        this.actionButton.id = 'action-button';
        this.actionButton.style.cssText = `
            position: fixed;
            bottom: 200px;
            right: 50px;
            width: ${this.buttonSize}px;
            height: ${this.buttonSize}px;
            background-color: rgba(100, 255, 100, 0.3);
            border-radius: 50%;
            z-index: 1000;
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 18px;
            font-weight: bold;
            color: white;
            touch-action: none;
        `;
        this.actionButton.textContent = 'ACTION';
        document.body.appendChild(this.actionButton);
        
        // Setup event listeners
        this.setupEventListeners();
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
        
        // Update joystick position
        this.joystickInner.style.transform = `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px))`;
        
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
            
            // Reset joystick position
            this.joystickInner.style.transform = 'translate(-50%, -50%)';
            
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
        this.runButton.style.backgroundColor = 'rgba(255, 100, 100, 0.5)';
        
        // Update game controls
        if (window.keys) {
            window.keys.shift = true;
        }
    }
    
    handleRunEnd(e) {
        // Update visual state
        this.runButton.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
        
        // Update game controls
        if (window.keys) {
            window.keys.shift = false;
        }
    }
    
    handleActionPress(e) {
        e.preventDefault();
        
        // Visual feedback
        this.actionButton.style.backgroundColor = 'rgba(100, 255, 100, 0.5)';
        setTimeout(() => {
            this.actionButton.style.backgroundColor = 'rgba(100, 255, 100, 0.3)';
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
    
    // Add additional mobile-specific tweaks
    if (window.mobileControlManager.isMobile) {
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
}

// Initialize when document is loaded
document.addEventListener('DOMContentLoaded', initMobileControls);

// Also initialize when game starts
if (window.startGame) {
    const originalStartGame = window.startGame;
    window.startGame = function() {
        originalStartGame.apply(this, arguments);
        initMobileControls();
    };
}
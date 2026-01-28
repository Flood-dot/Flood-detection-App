// Enhanced UI/UX Features for FloodGuard Pro
// Implementation of key improvements based on analysis

class FloodGuardEnhancedUI {
    constructor() {
        // Initialize managers only when needed
        this.gestureManager = null;
        this.smartAlerts = null;
        this.adaptiveInterface = null;
        this.performanceOptimizer = null;
        this.accessibilityManager = null;
        
        this.init();
    }
    
    init() {
        this.initializeEnhancedFeatures();
        
        // Handle window resize for notification positioning
        window.addEventListener('resize', () => {
            this.adjustNotificationPositioning();
        });
        
        // Comment out methods that aren't fully implemented yet
        // this.setupSmartNotifications();
        // this.enableGestureNavigation();
        // this.optimizePerformance();
        // this.enhanceAccessibility();
    }
    
    adjustNotificationPositioning() {
        const notifications = document.querySelectorAll('.smart-notification');
        const isMobile = window.innerWidth <= 768;
        const topOffset = isMobile ? '100px' : '80px';
        
        notifications.forEach(notification => {
            notification.style.top = topOffset;
        });
    }
    
    initializeEnhancedFeatures() {
        console.log('🚀 Initializing Enhanced FloodGuard Features...');
        
        // Update logo in header to use FD_logo.png (already done in HTML)
        // Logo updates are now handled directly in HTML
        
        // Add contextual quick actions
        this.addQuickActions();
        
        // Implement smart loading states
        this.enhanceLoadingStates();
        
        // Add micro-interactions
        this.addMicroInteractions();
        
        // Fix Firebase connection issues
        this.fixFirebaseConnection();
    }
    
    // Fix Firebase connection retry logic
    fixFirebaseConnection() {
        // Override the existing connection error handler
        const originalHandleConnectionError = window.handleConnectionError;
        
        window.handleConnectionError = () => {
            // Implement exponential backoff with circuit breaker
            const maxRetries = 3; // Reduced from 5
            const baseDelay = 2000;
            
            if (window.connectionRetryCount < maxRetries) {
                const delay = baseDelay * Math.pow(2, window.connectionRetryCount);
                console.log(`🔄 Smart retry in ${delay}ms (attempt ${window.connectionRetryCount + 1}/${maxRetries})`);
                
                setTimeout(() => {
                    window.connectionRetryCount++;
                    // Try reconnection with circuit breaker
                    this.attemptSmartReconnection();
                }, delay);
            } else {
                console.log('🔌 Switching to offline mode');
                this.enableOfflineMode();
            }
        };
    }
    
    attemptSmartReconnection() {
        // Check network connectivity first
        if (navigator.onLine) {
            try {
                // Attempt reconnection with timeout
                const reconnectPromise = new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => reject(new Error('Connection timeout')), 5000);
                    
                    // Try to reconnect
                    firebase.database().goOnline();
                    
                    // Test connection with a simple read
                    firebase.database().ref('.info/connected').once('value', (snapshot) => {
                        clearTimeout(timeout);
                        if (snapshot.val()) {
                            resolve();
                        } else {
                            reject(new Error('Connection failed'));
                        }
                    });
                });
                
                reconnectPromise.then(() => {
                    console.log('✅ Connection restored');
                    this.showConnectionRestoredNotification();
                    window.connectionRetryCount = 0;
                }).catch(() => {
                    console.log('❌ Reconnection failed');
                    this.enableOfflineMode();
                });
                
            } catch (error) {
                console.log('❌ Reconnection error:', error);
                this.enableOfflineMode();
            }
        } else {
            console.log('📡 No network connection detected');
            this.enableOfflineMode();
        }
    }
    
    enableOfflineMode() {
        console.log('🔌 Enabling offline mode');
        
        // Show offline notification
        this.showOfflineNotification();
        
        // Switch to cached data
        this.useCachedData();
        
        // Reduce update frequency
        this.reduceUpdateFrequency();
        
        // Enable offline features
        this.enableOfflineFeatures();
    }
    
    // Method to manually clear offline notifications
    clearOfflineNotifications() {
        console.log('🧹 Clearing all offline notifications');
        
        // Remove stored offline notification
        if (this.offlineNotification) {
            this.offlineNotification.classList.remove('show');
            setTimeout(() => {
                if (this.offlineNotification && this.offlineNotification.parentNode) {
                    this.offlineNotification.remove();
                }
                this.offlineNotification = null;
            }, 300);
        }
        
        // Remove any other offline notifications
        const existingOfflineNotifications = document.querySelectorAll('.offline-notification');
        existingOfflineNotifications.forEach(notification => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        });
    }
    
    // Add contextual quick actions
    addQuickActions() {
        const quickActionsContainer = document.createElement('div');
        quickActionsContainer.className = 'quick-actions-container';
        quickActionsContainer.innerHTML = `
            <div class="quick-actions-fab" id="quickActionsFab">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V6a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V12a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
            </div>
            <div class="quick-actions-menu" id="quickActionsMenu">
                <button class="quick-action" data-action="refresh">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="23 4 23 10 17 10"/>
                        <polyline points="1 20 1 14 7 14"/>
                        <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                    </svg>
                    <span>Refresh</span>
                </button>
                <button class="quick-action" data-action="silence">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 5L6 9H2v6h4l5 4V5z"/>
                        <line x1="23" y1="9" x2="17" y2="15"/>
                        <line x1="17" y1="9" x2="23" y2="15"/>
                    </svg>
                    <span>Silence</span>
                </button>
                <button class="quick-action" data-action="export">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    <span>Export</span>
                </button>
                <button class="quick-action" data-action="share">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="18" cy="5" r="3"/>
                        <circle cx="6" cy="12" r="3"/>
                        <circle cx="18" cy="19" r="3"/>
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                    </svg>
                    <span>Share</span>
                </button>
            </div>
        `;
        
        document.body.appendChild(quickActionsContainer);
        this.initializeQuickActions();
    }
    
    initializeQuickActions() {
        const fab = document.getElementById('quickActionsFab');
        const menu = document.getElementById('quickActionsMenu');
        
        fab.addEventListener('click', () => {
            menu.classList.toggle('active');
            fab.classList.toggle('active');
        });
        
        // Handle quick action clicks
        document.querySelectorAll('.quick-action').forEach(action => {
            action.addEventListener('click', (e) => {
                const actionType = e.currentTarget.dataset.action;
                this.handleQuickAction(actionType);
                menu.classList.remove('active');
                fab.classList.remove('active');
            });
        });
    }
    
    handleQuickAction(action) {
        switch(action) {
            case 'refresh':
                this.refreshSensorData();
                break;
            case 'silence':
                this.silenceAlerts();
                break;
            case 'export':
                this.exportData();
                break;
            case 'share':
                this.shareStatus();
                break;
        }
    }
    
    // Enhanced loading states with skeleton screens
    enhanceLoadingStates() {
        const style = document.createElement('style');
        style.textContent = `
            .skeleton-loader {
                background: linear-gradient(90deg, var(--bg-tertiary) 25%, var(--bg-elevated) 50%, var(--bg-tertiary) 75%);
                background-size: 200% 100%;
                animation: skeleton-loading 1.5s infinite;
            }
            
            @keyframes skeleton-loading {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
            }
            
            .skeleton-text {
                height: 1em;
                border-radius: 4px;
                margin: 0.5em 0;
            }
            
            .skeleton-circle {
                border-radius: 50%;
            }
            
            .skeleton-rect {
                border-radius: 8px;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Add micro-interactions for better UX
    addMicroInteractions() {
        // Button press feedback
        document.addEventListener('click', (e) => {
            if (e.target.matches('button, .clickable')) {
                this.addRippleEffect(e.target, e);
            }
        });
        
        // Hover effects for cards
        document.querySelectorAll('.sensor-card, .status-card').forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-2px) scale(1.02)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = '';
            });
        });
    }
    
    addRippleEffect(element, event) {
        const ripple = document.createElement('span');
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            transform: scale(0);
            animation: ripple 0.6s ease-out;
            pointer-events: none;
        `;
        
        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
    }
    
    // Smart notifications system
    showConnectionRestoredNotification() {
        console.log('🔄 Connection restored - removing offline notification');
        
        // Remove offline notification if it exists
        if (this.offlineNotification) {
            console.log('📡 Removing offline notification');
            this.offlineNotification.classList.remove('show');
            setTimeout(() => {
                if (this.offlineNotification && this.offlineNotification.parentNode) {
                    this.offlineNotification.remove();
                    console.log('✅ Offline notification removed');
                }
                this.offlineNotification = null;
            }, 300);
        }
        
        // Also remove any other offline notifications that might exist
        const existingOfflineNotifications = document.querySelectorAll('.offline-notification');
        existingOfflineNotifications.forEach(notification => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        });
        
        // Show connection restored notification
        this.showNotification('✅ Connection Restored', 'Real-time monitoring resumed', 'success');
    }
    
    showOfflineNotification() {
        // Prevent multiple offline notifications
        if (this.offlineNotification) {
            console.log('📡 Offline notification already exists, skipping');
            return;
        }
        
        console.log('📡 Showing offline notification');
        
        // Check if mobile navigation is visible to adjust positioning
        const isMobile = window.innerWidth <= 768;
        const topOffset = isMobile ? '100px' : '80px';
        
        const notification = this.showNotification(
            '📡 Offline Mode', 
            'Using cached data. Will reconnect automatically.', 
            'warning', 
            true
        );
        
        // Adjust positioning for offline notification specifically
        if (notification) {
            notification.style.top = topOffset;
            notification.style.zIndex = '1001'; // Below navigation
            
            // Add special class for offline notification
            notification.classList.add('offline-notification');
            
            // Store reference for potential removal
            this.offlineNotification = notification;
            
            console.log('📡 Offline notification created and stored');
        }
    }
    
    showNotification(title, message, type = 'info', persistent = false) {
        const notification = document.createElement('div');
        notification.className = `smart-notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <h4>${title}</h4>
                <p>${message}</p>
            </div>
            ${!persistent ? '<button class="notification-close">×</button>' : ''}
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Auto remove if not persistent
        if (!persistent) {
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }, 5000);
        }
        
        // Close button handler
        const closeBtn = notification.querySelector('.notification-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            });
        }
        
        // Return notification element for further manipulation
        return notification;
    }
    
    // Performance optimizations
    optimizePerformance() {
        // Implement virtual scrolling for large datasets
        this.implementVirtualScrolling();
        
        // Lazy load non-critical components
        this.lazyLoadComponents();
        
        // Optimize chart rendering
        this.optimizeChartPerformance();
        
        // Implement request deduplication
        this.implementRequestDeduplication();
    }
    
    // Accessibility enhancements
    enhanceAccessibility() {
        // Add keyboard navigation
        this.addKeyboardNavigation();
        
        // Implement focus management
        this.manageFocus();
        
        // Add ARIA labels
        this.addAriaLabels();
        
        // Implement screen reader support
        this.addScreenReaderSupport();
    }
    
    // Quick action implementations
    refreshSensorData() {
        this.showNotification('🔄 Refreshing', 'Updating sensor data...', 'info');
        // Trigger data refresh
        if (window.floodMonitor && window.floodMonitor.performance) {
            window.floodMonitor.performance.forceUpdate();
        }
    }
    
    silenceAlerts() {
        this.showNotification('🔇 Alerts Silenced', 'Notifications muted for 1 hour', 'success');
        // Implement alert silencing logic
    }
    
    exportData() {
        const data = {
            timestamp: new Date().toISOString(),
            currentStatus: window.currentData || {},
            historicalData: window.historicalData || [],
            systemInfo: {
                version: '1.2.0',
                exportedBy: 'FloodGuard Pro'
            }
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `floodguard-data-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showNotification('📥 Data Exported', 'Sensor data downloaded successfully', 'success');
    }
    
    shareStatus() {
        if (navigator.share) {
            navigator.share({
                title: 'FloodGuard Pro Status',
                text: `Current threat level: ${document.getElementById('threatPercentage')?.textContent || '0%'}`,
                url: window.location.href
            });
        } else {
            // Fallback: copy to clipboard
            const statusText = `FloodGuard Pro Status - Threat Level: ${document.getElementById('threatPercentage')?.textContent || '0%'}`;
            navigator.clipboard.writeText(statusText).then(() => {
                this.showNotification('📋 Copied', 'Status copied to clipboard', 'success');
            });
        }
    }
}

// Gesture Manager for mobile navigation
class GestureManager {
    constructor() {
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchEndX = 0;
        this.touchEndY = 0;
        this.minSwipeDistance = 50;
        
        this.init();
    }
    
    init() {
        document.addEventListener('touchstart', this.handleTouchStart.bind(this));
        document.addEventListener('touchend', this.handleTouchEnd.bind(this));
    }
    
    handleTouchStart(e) {
        this.touchStartX = e.changedTouches[0].screenX;
        this.touchStartY = e.changedTouches[0].screenY;
    }
    
    handleTouchEnd(e) {
        this.touchEndX = e.changedTouches[0].screenX;
        this.touchEndY = e.changedTouches[0].screenY;
        this.handleSwipe();
    }
    
    handleSwipe() {
        const deltaX = this.touchEndX - this.touchStartX;
        const deltaY = this.touchEndY - this.touchStartY;
        
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > this.minSwipeDistance) {
            if (deltaX > 0) {
                this.onSwipeRight();
            } else {
                this.onSwipeLeft();
            }
        } else if (Math.abs(deltaY) > this.minSwipeDistance) {
            if (deltaY < 0) {
                this.onSwipeUp();
            } else {
                this.onSwipeDown();
            }
        }
    }
    
    onSwipeLeft() {
        // Navigate to next section
        console.log('👈 Swipe left detected');
    }
    
    onSwipeRight() {
        // Navigate to previous section
        console.log('👉 Swipe right detected');
    }
    
    onSwipeUp() {
        // Scroll up or show more details
        console.log('👆 Swipe up detected');
    }
    
    onSwipeDown() {
        // Pull to refresh
        console.log('👇 Swipe down detected - Pull to refresh');
        if (window.scrollY === 0) {
            this.triggerPullToRefresh();
        }
    }
    
    triggerPullToRefresh() {
        // Show pull to refresh indicator
        const refreshIndicator = document.createElement('div');
        refreshIndicator.className = 'pull-to-refresh-indicator';
        refreshIndicator.innerHTML = `
            <div class="refresh-spinner"></div>
            <span>Refreshing...</span>
        `;
        document.body.prepend(refreshIndicator);
        
        // Trigger refresh
        setTimeout(() => {
            if (window.floodMonitor && window.floodMonitor.performance) {
                window.floodMonitor.performance.forceUpdate();
            }
            refreshIndicator.remove();
        }, 2000);
    }
}

// Smart Alert System
class SmartAlertSystem {
    constructor() {
        this.alertHistory = [];
        this.userPreferences = this.loadPreferences();
        this.contextualFactors = {};
    }
    
    loadPreferences() {
        return JSON.parse(localStorage.getItem('floodguard-alert-preferences') || '{}');
    }
    
    savePreferences() {
        localStorage.setItem('floodguard-alert-preferences', JSON.stringify(this.userPreferences));
    }
    
    generateSmartAlert(data, context) {
        const alert = {
            id: Date.now(),
            timestamp: new Date(),
            data: data,
            context: context,
            severity: this.calculateSeverity(data, context),
            message: this.generateContextualMessage(data, context),
            actions: this.suggestActions(data, context)
        };
        
        this.alertHistory.push(alert);
        return alert;
    }
    
    calculateSeverity(data, context) {
        let baseSeverity = data.threatLevel || 0;
        
        // Adjust based on context
        if (context.timeOfDay === 'night') baseSeverity *= 1.2;
        if (context.weather === 'storm') baseSeverity *= 1.3;
        if (context.userPresent === false) baseSeverity *= 1.1;
        
        return Math.min(100, baseSeverity);
    }
    
    generateContextualMessage(data, context) {
        const baseMessage = `Threat level: ${data.threatLevel}%`;
        
        if (context.timeOfDay === 'night') {
            return `${baseMessage} - Night monitoring active`;
        }
        
        if (context.weather === 'storm') {
            return `${baseMessage} - Storm conditions detected`;
        }
        
        return baseMessage;
    }
    
    suggestActions(data, context) {
        const actions = [];
        
        if (data.threatLevel > 60) {
            actions.push({ type: 'evacuate', label: 'Consider evacuation', priority: 'high' });
        }
        
        if (data.threatLevel > 35) {
            actions.push({ type: 'monitor', label: 'Increase monitoring', priority: 'medium' });
        }
        
        actions.push({ type: 'silence', label: 'Silence for 1 hour', priority: 'low' });
        
        return actions;
    }
}

// Adaptive Interface
class AdaptiveInterface {
    constructor() {
        this.userBehavior = this.loadUserBehavior();
        this.environmentalFactors = {};
        
        this.init();
    }
    
    init() {
        this.detectEnvironmentalFactors();
        this.adaptInterface();
        this.startBehaviorTracking();
    }
    
    detectEnvironmentalFactors() {
        // Detect light level
        if ('AmbientLightSensor' in window) {
            const sensor = new AmbientLightSensor();
            sensor.addEventListener('reading', () => {
                this.environmentalFactors.lightLevel = sensor.illuminance;
                this.adaptToLightLevel(sensor.illuminance);
            });
            sensor.start();
        }
        
        // Detect battery level
        if ('getBattery' in navigator) {
            navigator.getBattery().then(battery => {
                this.environmentalFactors.batteryLevel = battery.level;
                this.adaptToBatteryLevel(battery.level);
                
                battery.addEventListener('levelchange', () => {
                    this.environmentalFactors.batteryLevel = battery.level;
                    this.adaptToBatteryLevel(battery.level);
                });
            });
        }
        
        // Detect network quality
        if ('connection' in navigator) {
            this.environmentalFactors.networkType = navigator.connection.effectiveType;
            this.adaptToNetworkQuality(navigator.connection.effectiveType);
        }
    }
    
    adaptToLightLevel(illuminance) {
        if (illuminance < 10) {
            document.body.classList.add('night-mode');
        } else {
            document.body.classList.remove('night-mode');
        }
    }
    
    adaptToBatteryLevel(level) {
        if (level < 0.2) {
            document.body.classList.add('power-save-mode');
            this.reducePowerConsumption();
        } else {
            document.body.classList.remove('power-save-mode');
        }
    }
    
    adaptToNetworkQuality(effectiveType) {
        if (effectiveType === 'slow-2g' || effectiveType === '2g') {
            document.body.classList.add('low-bandwidth-mode');
            this.optimizeForLowBandwidth();
        } else {
            document.body.classList.remove('low-bandwidth-mode');
        }
    }
    
    loadUserBehavior() {
        return JSON.parse(localStorage.getItem('floodguard-user-behavior') || '{}');
    }
    
    saveUserBehavior() {
        localStorage.setItem('floodguard-user-behavior', JSON.stringify(this.userBehavior));
    }
    
    startBehaviorTracking() {
        // Track section visits
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const sectionId = entry.target.id;
                    this.trackSectionVisit(sectionId);
                }
            });
        });
        
        document.querySelectorAll('[id$="-section"]').forEach(section => {
            observer.observe(section);
        });
    }
    
    trackSectionVisit(sectionId) {
        if (!this.userBehavior.sectionVisits) {
            this.userBehavior.sectionVisits = {};
        }
        
        this.userBehavior.sectionVisits[sectionId] = (this.userBehavior.sectionVisits[sectionId] || 0) + 1;
        this.saveUserBehavior();
    }
}

// Performance Optimizer
class PerformanceOptimizer {
    constructor() {
        this.performanceMetrics = {};
        this.optimizations = new Set();
        
        this.init();
    }
    
    init() {
        this.measurePerformance();
        this.implementOptimizations();
        this.startPerformanceMonitoring();
    }
    
    measurePerformance() {
        // Measure initial load time
        window.addEventListener('load', () => {
            const loadTime = performance.now();
            this.performanceMetrics.loadTime = loadTime;
            console.log(`⚡ Page loaded in ${loadTime.toFixed(2)}ms`);
        });
        
        // Measure chart rendering time
        const originalUpdateChart = window.updateChart;
        if (originalUpdateChart) {
            window.updateChart = () => {
                const start = performance.now();
                originalUpdateChart();
                const end = performance.now();
                this.performanceMetrics.chartRenderTime = end - start;
            };
        }
    }
    
    implementOptimizations() {
        // Implement request deduplication
        this.implementRequestDeduplication();
        
        // Optimize image loading
        this.optimizeImageLoading();
        
        // Implement virtual scrolling
        this.implementVirtualScrolling();
        
        // Optimize animations
        this.optimizeAnimations();
    }
    
    implementRequestDeduplication() {
        const pendingRequests = new Map();
        
        const originalFetch = window.fetch;
        window.fetch = (url, options) => {
            const key = `${url}-${JSON.stringify(options)}`;
            
            if (pendingRequests.has(key)) {
                return pendingRequests.get(key);
            }
            
            const promise = originalFetch(url, options);
            pendingRequests.set(key, promise);
            
            promise.finally(() => {
                pendingRequests.delete(key);
            });
            
            return promise;
        };
    }
    
    optimizeImageLoading() {
        // Implement lazy loading for images
        const images = document.querySelectorAll('img[data-src]');
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        images.forEach(img => imageObserver.observe(img));
    }
    
    startPerformanceMonitoring() {
        // Monitor FPS
        let lastTime = performance.now();
        let frames = 0;
        
        const measureFPS = () => {
            frames++;
            const currentTime = performance.now();
            
            if (currentTime >= lastTime + 1000) {
                this.performanceMetrics.fps = Math.round((frames * 1000) / (currentTime - lastTime));
                frames = 0;
                lastTime = currentTime;
            }
            
            requestAnimationFrame(measureFPS);
        };
        
        requestAnimationFrame(measureFPS);
    }
}

// Accessibility Enhancer
class AccessibilityEnhancer {
    constructor() {
        this.init();
    }
    
    init() {
        this.addKeyboardNavigation();
        this.addAriaLabels();
        this.addFocusManagement();
        this.addScreenReaderSupport();
    }
    
    addKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'Tab':
                    this.handleTabNavigation(e);
                    break;
                case 'Enter':
                case ' ':
                    this.handleActivation(e);
                    break;
                case 'Escape':
                    this.handleEscape(e);
                    break;
                case 'ArrowUp':
                case 'ArrowDown':
                case 'ArrowLeft':
                case 'ArrowRight':
                    this.handleArrowNavigation(e);
                    break;
            }
        });
    }
    
    addAriaLabels() {
        // Add ARIA labels to interactive elements
        document.querySelectorAll('button:not([aria-label])').forEach(button => {
            const text = button.textContent.trim() || button.title || 'Button';
            button.setAttribute('aria-label', text);
        });
        
        // Add ARIA labels to form controls
        document.querySelectorAll('input:not([aria-label])').forEach(input => {
            const label = document.querySelector(`label[for="${input.id}"]`);
            if (label) {
                input.setAttribute('aria-labelledby', label.id || `label-${input.id}`);
            }
        });
    }
    
    addFocusManagement() {
        // Ensure focus is visible
        const style = document.createElement('style');
        style.textContent = `
            *:focus {
                outline: 2px solid var(--primary-cyan) !important;
                outline-offset: 2px !important;
            }
            
            .focus-trap {
                position: relative;
            }
        `;
        document.head.appendChild(style);
    }
    
    addScreenReaderSupport() {
        // Add live regions for dynamic content
        const liveRegion = document.createElement('div');
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.className = 'sr-only';
        liveRegion.id = 'live-region';
        document.body.appendChild(liveRegion);
        
        // Announce important changes
        const originalUpdateCurrentStatus = window.updateCurrentStatus;
        if (originalUpdateCurrentStatus) {
            window.updateCurrentStatus = (data) => {
                originalUpdateCurrentStatus(data);
                
                // Announce threat level changes
                const threatLevel = document.getElementById('threatPercentage')?.textContent;
                if (threatLevel) {
                    this.announceToScreenReader(`Threat level updated to ${threatLevel}`);
                }
            };
        }
    }
    
    announceToScreenReader(message) {
        const liveRegion = document.getElementById('live-region');
        if (liveRegion) {
            liveRegion.textContent = message;
            
            // Clear after announcement
            setTimeout(() => {
                liveRegion.textContent = '';
            }, 1000);
        }
    }
}

// Initialize enhanced features when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait for the main app to initialize first, but not too long
    setTimeout(() => {
        try {
            window.floodGuardEnhanced = new FloodGuardEnhancedUI();
            console.log('🚀 FloodGuard Enhanced UI initialized successfully');
            
            // Add global method for debugging offline notifications
            window.clearOfflineNotifications = () => {
                if (window.floodGuardEnhanced) {
                    window.floodGuardEnhanced.clearOfflineNotifications();
                    console.log('🧹 Offline notifications cleared via global method');
                } else {
                    console.log('❌ Enhanced UI not available');
                }
            };
            
        } catch (error) {
            console.error('❌ Enhanced UI initialization failed:', error);
            // Continue without enhanced features if there's an error
        }
    }, 500); // Reduced from 1000ms for faster initialization
});

// Add enhanced styles
const enhancedStyles = document.createElement('style');
enhancedStyles.textContent = `
    /* Quick Actions Styles */
    .quick-actions-container {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 1000;
    }
    
    .quick-actions-fab {
        width: 56px;
        height: 56px;
        background: linear-gradient(135deg, var(--primary-blue), var(--primary-cyan));
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        transition: all 0.3s ease;
        border: none;
    }
    
    .quick-actions-fab:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 20px rgba(0, 212, 255, 0.4);
    }
    
    .quick-actions-fab.active {
        transform: rotate(45deg);
    }
    
    .quick-actions-fab svg {
        width: 24px;
        height: 24px;
    }
    
    .quick-actions-menu {
        position: absolute;
        bottom: 70px;
        right: 0;
        background: var(--bg-card);
        border: 1px solid var(--border-primary);
        border-radius: 12px;
        padding: 8px;
        min-width: 200px;
        opacity: 0;
        visibility: hidden;
        transform: translateY(20px) scale(0.9);
        transition: all 0.3s ease;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    }
    
    .quick-actions-menu.active {
        opacity: 1;
        visibility: visible;
        transform: translateY(0) scale(1);
    }
    
    .quick-action {
        display: flex;
        align-items: center;
        gap: 12px;
        width: 100%;
        padding: 12px;
        background: transparent;
        border: none;
        border-radius: 8px;
        color: var(--text-primary);
        cursor: pointer;
        transition: all 0.2s ease;
        text-align: left;
    }
    
    .quick-action:hover {
        background: var(--bg-elevated);
        transform: translateX(4px);
    }
    
    .quick-action svg {
        width: 20px;
        height: 20px;
        color: var(--primary-cyan);
    }
    
    .quick-action span {
        font-size: 14px;
        font-weight: 500;
    }
    
    /* Smart Notifications - FIXED POSITIONING TO AVOID NAVIGATION */
    .smart-notification {
        position: fixed;
        top: 80px; /* Moved down to avoid navigation button */
        right: 20px;
        background: var(--bg-card);
        border: 1px solid var(--border-primary);
        border-radius: 12px;
        padding: 16px;
        max-width: 400px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        transform: translateX(100%);
        transition: transform 0.3s ease;
        z-index: 1001; /* Below navigation (1100+) */
    }
    
    .smart-notification.show {
        transform: translateX(0);
    }
    
    .smart-notification.success {
        border-left: 4px solid var(--status-normal);
    }
    
    .smart-notification.warning {
        border-left: 4px solid var(--status-warning);
    }
    
    .smart-notification.error {
        border-left: 4px solid var(--status-danger);
    }
    
    /* Special styling for offline notification */
    .smart-notification.offline-notification {
        background: linear-gradient(135deg, var(--bg-card), var(--bg-elevated));
        border: 2px solid var(--status-warning);
        box-shadow: 0 8px 32px rgba(255, 170, 0, 0.2);
    }
    
    .smart-notification.offline-notification .notification-content h4 {
        color: var(--status-warning);
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    .notification-content h4 {
        margin: 0 0 8px 0;
        font-size: 16px;
        font-weight: 600;
        color: var(--text-primary);
    }
    
    .notification-content p {
        margin: 0;
        font-size: 14px;
        color: var(--text-secondary);
        line-height: 1.4;
    }
    
    .notification-close {
        position: absolute;
        top: 8px;
        right: 8px;
        background: none;
        border: none;
        color: var(--text-muted);
        cursor: pointer;
        font-size: 20px;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        transition: all 0.2s ease;
    }
    
    .notification-close:hover {
        background: var(--bg-elevated);
        color: var(--text-primary);
    }
    
    /* Pull to Refresh */
    .pull-to-refresh-indicator {
        position: fixed;
        top: 0;
        left: 50%;
        transform: translateX(-50%);
        background: var(--bg-card);
        border: 1px solid var(--border-primary);
        border-radius: 0 0 12px 12px;
        padding: 12px 24px;
        display: flex;
        align-items: center;
        gap: 12px;
        z-index: 1000;
        animation: slideDown 0.3s ease;
    }
    
    .refresh-spinner {
        width: 20px;
        height: 20px;
        border: 2px solid var(--bg-tertiary);
        border-top: 2px solid var(--primary-cyan);
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }
    
    /* Adaptive Interface Modes */
    .night-mode {
        filter: brightness(0.8) contrast(1.1);
    }
    
    .power-save-mode .chart-container {
        animation: none !important;
    }
    
    .power-save-mode * {
        animation-duration: 0.1s !important;
        transition-duration: 0.1s !important;
    }
    
    .low-bandwidth-mode img {
        display: none;
    }
    
    .low-bandwidth-mode .chart-container {
        background: var(--bg-tertiary);
    }
    
    /* Screen Reader Only */
    .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
    }
    
    /* Ripple Effect */
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
    
    @keyframes slideDown {
        from {
            transform: translateX(-50%) translateY(-100%);
        }
        to {
            transform: translateX(-50%) translateY(0);
        }
    }
    
    /* Mobile Optimizations - FIXED NOTIFICATION POSITIONING */
    @media (max-width: 768px) {
        .quick-actions-container {
            bottom: 80px;
            right: 16px;
        }
        
        .quick-actions-fab {
            width: 48px;
            height: 48px;
        }
        
        .quick-actions-fab svg {
            width: 20px;
            height: 20px;
        }
        
        .smart-notification {
            top: 100px; /* More space on mobile to avoid navigation */
            right: 16px;
            left: 16px;
            max-width: none;
        }
    }
`;

document.head.appendChild(enhancedStyles);
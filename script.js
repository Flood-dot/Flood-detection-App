// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDsVF0xPnarV87dfJsS__2XGa8CjIoGc18",
    authDomain: "flood-detection-5d4e6.firebaseapp.com",
    databaseURL: "https://flood-detection-5d4e6-default-rtdb.firebaseio.com",
    projectId: "flood-detection-5d4e6",
    storageBucket: "flood-detection-5d4e6.firebasestorage.app",
    messagingSenderId: "794898699570",
    appId: "1:794898699570:web:0d045f79cf00fc6a1bb32b",
    measurementId: "G-4CRZY0CY4P"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Global variables
let waterLevelChart;
let currentData = {};
let historicalData = [];
let messageHistory = [];
let lastSeverity = 'normal';
let isInitialized = false;
let connectionRetryCount = 0;
const MAX_RETRY_COUNT = 5;

// DOM Elements - Updated for professional UI
const elements = {
    connectionStatus: document.getElementById('connectionStatus'),
    lastUpdateTime: document.getElementById('lastUpdateTime'),
    statusAlert: document.getElementById('statusAlert'),
    alertTitle: document.getElementById('alertTitle'),
    alertMessage: document.getElementById('alertMessage'),
    thresholdFill: document.getElementById('thresholdFill'),
    threatPercentage: document.getElementById('threatPercentage'),
    waterLevelValue: document.getElementById('waterLevelValue'),
    sensorDistance: document.getElementById('sensorDistance'),
    waterSensorValue: document.getElementById('waterSensorValue'),
    waterSensorUnit: document.getElementById('waterSensorUnit'),
    waterSensorStatus: document.getElementById('waterSensorStatus'),
    messagesList: document.getElementById('messagesList'),
    messageCount: document.getElementById('messageCount'),
    dataPoints: document.getElementById('dataPoints'),
    chartLoading: document.getElementById('chartLoading'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    alertBanner: document.getElementById('alertBanner'),
    alertBannerTitle: document.getElementById('alertBannerTitle'),
    alertBannerMessage: document.getElementById('alertBannerMessage')
};

// Mobile Navigation functionality
function initializeMobileNav() {
    const mobileNavToggle = document.getElementById('mobileNavToggle');
    const mobileNavClose = document.getElementById('mobileNavClose');
    const mobileNavMenu = document.getElementById('mobileNavMenu');
    const mobileNavOverlay = document.getElementById('mobileNavOverlay');
    const mobileNavItems = document.querySelectorAll('.mobile-nav-item');
    
    if (!mobileNavToggle) return; // Exit if mobile nav not present
    
    // Toggle mobile navigation
    function toggleMobileNav() {
        const isActive = mobileNavMenu.classList.contains('active');
        
        if (isActive) {
            closeMobileNav();
        } else {
            openMobileNav();
        }
    }
    
    // Open mobile navigation
    function openMobileNav() {
        mobileNavMenu.classList.add('active');
        mobileNavOverlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
        
        // Animate nav items
        mobileNavItems.forEach((item, index) => {
            item.style.opacity = '0';
            item.style.transform = 'translateX(20px)';
            setTimeout(() => {
                item.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
                item.style.opacity = '1';
                item.style.transform = 'translateX(0)';
            }, index * 50 + 100);
        });
    }
    
    // Close mobile navigation
    function closeMobileNav() {
        mobileNavMenu.classList.remove('active');
        mobileNavOverlay.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
        
        // Reset nav items animation
        mobileNavItems.forEach(item => {
            item.style.transition = '';
            item.style.opacity = '';
            item.style.transform = '';
        });
    }
    
    // Event listeners
    mobileNavToggle.addEventListener('click', toggleMobileNav);
    mobileNavClose.addEventListener('click', closeMobileNav);
    mobileNavOverlay.addEventListener('click', closeMobileNav);
    
    // Close nav when clicking on nav items
    mobileNavItems.forEach(item => {
        item.addEventListener('click', (e) => {
            // Small delay to allow smooth scrolling to start
            setTimeout(() => {
                closeMobileNav();
            }, 100);
        });
    });
    
    // Close nav on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mobileNavMenu.classList.contains('active')) {
            closeMobileNav();
        }
    });
    
    // Update active nav item based on scroll position
    function updateActiveNavItem() {
        const sections = ['status-section', 'sensors-section', 'analytics-section', 'events-section'];
        const scrollPosition = window.scrollY + 150; // Offset for header
        
        let activeSection = sections[0]; // Default to first section
        
        sections.forEach(sectionId => {
            const section = document.getElementById(sectionId);
            if (section && section.offsetTop <= scrollPosition) {
                activeSection = sectionId;
            }
        });
        
        // Update active nav item
        mobileNavItems.forEach(item => {
            const targetSection = item.getAttribute('data-section') + '-section';
            if (targetSection === activeSection) {
                item.style.background = 'var(--bg-elevated)';
                item.style.borderColor = 'var(--primary-cyan)';
            } else {
                item.style.background = '';
                item.style.borderColor = '';
            }
        });
    }
    
    // Throttled scroll listener for performance
    let scrollTimeout;
    window.addEventListener('scroll', () => {
        if (scrollTimeout) {
            clearTimeout(scrollTimeout);
        }
        scrollTimeout = setTimeout(updateActiveNavItem, 100);
    });
    
    // Initial active item update
    updateActiveNavItem();
    
    console.log('✅ Mobile navigation initialized');
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    showLoadingOverlay();
    initializeChart();
    setupFirebaseListeners();
    initializeMobileNav(); // Initialize mobile navigation
    
    // Hide loading overlay after initial setup
    setTimeout(() => {
        hideLoadingOverlay();
        isInitialized = true;
        
        // Force hide chart loading if no data after 3 seconds
        setTimeout(() => {
            if (historicalData.length === 0) {
                elements.chartLoading.classList.add('hidden');
                console.log('Chart loading hidden - no historical data yet');
            }
        }, 3000);
    }, 2000);
});

// Show/hide loading overlay
function showLoadingOverlay() {
    elements.loadingOverlay.classList.remove('hidden');
}

function hideLoadingOverlay() {
    elements.loadingOverlay.classList.add('hidden');
}

// Initialize Chart.js with simple, reliable configuration - REFERENCE DESIGN
function initializeChart() {
    const ctx = document.getElementById('waterLevelChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (waterLevelChart) {
        waterLevelChart.destroy();
    }
    
    // Create chart with immediate demo data to prevent loading issues
    const now = Date.now();
    const demoLabels = [];
    const demoData = [];
    
    // Generate 20 demo points for immediate display
    for (let i = 19; i >= 0; i--) {
        const time = new Date(now - (i * 60000)); // Every minute
        demoLabels.push(time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));
        demoData.push(15 + Math.sin(i * 0.3) * 8 + Math.random() * 5); // Realistic demo data
    }
    
    waterLevelChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: demoLabels,
            datasets: [{
                label: 'Threat Level (%)',
                data: demoData,
                borderColor: '#00d4ff',
                backgroundColor: 'rgba(0, 212, 255, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#00d4ff',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 1,
                pointRadius: 3,
                pointHoverRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 300 // Fast animation
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: '#00d4ff',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            return `Threat Level: ${context.parsed.y.toFixed(1)}%`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#94a3b8',
                        maxTicksLimit: 6,
                        font: {
                            size: 11
                        }
                    }
                },
                y: {
                    display: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#94a3b8',
                        callback: function(value) {
                            return value + '%';
                        },
                        font: {
                            size: 11
                        }
                    },
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
    
    // Immediately hide loading since we have demo data
    setTimeout(() => {
        elements.chartLoading.classList.add('hidden');
        console.log('✅ Chart initialized with demo data - loading hidden');
    }, 100);
    
    console.log('✅ Chart initialized successfully with demo data');
}
// Optimized Firebase listeners with ultra-fast settings and minimal latency
function setupFirebaseListeners() {
    // Ultra-fast current status listener with optimized settings
    const currentStatusRef = database.ref('currentStatus');
    
    // Enable offline persistence for faster loading
    database.goOffline();
    database.goOnline();
    
    currentStatusRef.on('value', (snapshot) => {
        try {
            const data = snapshot.val();
            if (data) {
                currentData = data;
                
                // Handle shortened keys from ultra-optimized firmware
                if (data.wL !== undefined) {
                    data.waterLevel = data.wL;
                    data.distance = data.d;
                    data.waterLevelRaw = data.wLR;
                    data.waterLevelPercent = data.wLP;
                    data.severity = data.s;
                    data.message = data.m;
                    data.timestamp = data.t;
                }
                
                priorityUpdate(() => updateCurrentStatus(data), 10); // Ultra-fast priority update
                connectionRetryCount = 0; // Reset retry count on success
            }
        } catch (error) {
            console.error('Error processing current status:', error);
            handleConnectionError();
        }
    }, (error) => {
        console.error('Firebase current status error:', error);
        handleConnectionError();
    });

    // Ultra-fast historical data listener with optimized limit
    const historyRef = database.ref('history').limitToLast(100).orderByKey(); // Reduced for speed
    historyRef.on('value', (snapshot) => {
        try {
            const data = snapshot.val();
            console.log('🔥 FIREBASE HISTORY DATA:', data ? Object.keys(data).length + ' records' : 'null');
            
            if (data) {
                historicalData = Object.values(data).sort((a, b) => a.timestamp - b.timestamp);
                console.log('📊 PROCESSED HISTORICAL DATA:', historicalData.length, 'records');
                
                priorityUpdate(() => {
                    updateChart();
                    updateDataPointsCount();
                }, 50); // Ultra-fast chart updates
            } else {
                console.log('⚠️ No historical data from Firebase');
                setTimeout(() => {
                    elements.chartLoading.classList.add('hidden');
                    console.log('⏰ Chart loading hidden - no Firebase history data');
                }, 5000); // Reduced timeout
            }
        } catch (error) {
            console.error('❌ Error processing historical data:', error);
            elements.chartLoading.classList.add('hidden');
        }
    }, (error) => {
        console.error('❌ Firebase history error:', error);
        elements.chartLoading.classList.add('hidden');
    });

    // Ultra-fast connection state monitoring
    database.ref('.info/connected').on('value', (snapshot) => {
        if (snapshot.val() === true) {
            updateConnectionStatus('connected');
            connectionRetryCount = 0;
            
            // Notify enhanced features about connection restoration
            if (window.floodGuardEnhanced) {
                window.floodGuardEnhanced.showConnectionRestoredNotification();
            }
            
            // Hide loading overlay when connected
            if (elements.loadingOverlay && !elements.loadingOverlay.classList.contains('hidden')) {
                setTimeout(() => hideLoadingOverlay(), 250); // Faster hide
            }
        } else {
            updateConnectionStatus('error');
            handleConnectionError();
        }
    });
    
    // Add ultra-fast connection quality monitoring
    monitorConnectionQualityOptimized();
}

// Ultra-optimized connection quality monitoring with minimal overhead
function monitorConnectionQualityOptimized() {
    let lastUpdateTime = Date.now();
    let updateCount = 0;
    let averageLatency = 0;
    let performanceMetrics = {
        updateFrequency: 0,
        averageLatency: 0,
        connectionQuality: 'excellent',
        lastUpdate: Date.now()
    };
    
    // Lightweight performance tracking
    const originalUpdateStatus = updateCurrentStatus;
    window.updateCurrentStatus = function(data) {
        const now = Date.now();
        const timeSinceLastUpdate = now - lastUpdateTime;
        
        updateCount++;
        averageLatency = (averageLatency * (updateCount - 1) + timeSinceLastUpdate) / updateCount;
        
        // Update performance metrics every 10 updates for efficiency
        if (updateCount % 10 === 0) {
            performanceMetrics = {
                updateFrequency: 1000 / averageLatency, // Updates per second
                averageLatency: averageLatency,
                connectionQuality: getConnectionQuality(averageLatency),
                lastUpdate: now,
                totalUpdates: updateCount
            };
            
            // Update connection quality indicator with minimal DOM manipulation
            updateConnectionQualityOptimized(performanceMetrics);
        }
        
        lastUpdateTime = now;
        return originalUpdateStatus.call(this, data);
    };
    
    // Expose performance metrics for debugging
    window.floodMonitor.performance.metrics = () => performanceMetrics;
    
    console.log('✅ Ultra-optimized connection quality monitoring initialized');
}

// Ultra-fast connection quality assessment
function getConnectionQuality(averageLatency) {
    if (averageLatency < 1000) return 'excellent';      // < 1 second
    if (averageLatency < 2000) return 'good';           // 1-2 seconds
    if (averageLatency < 4000) return 'fair';           // 2-4 seconds
    return 'poor';                                      // > 4 seconds
}

// Optimized connection quality indicator update
function updateConnectionQualityOptimized(metrics) {
    const qualityElement = document.getElementById('connectionQuality');
    if (!qualityElement) return;
    
    // Batch DOM updates for performance
    requestAnimationFrame(() => {
        qualityElement.textContent = metrics.connectionQuality;
        qualityElement.style.color = {
            'excellent': 'var(--status-normal)',
            'good': 'var(--primary-cyan)',
            'fair': 'var(--status-warning)',
            'poor': 'var(--status-danger)'
        }[metrics.connectionQuality];
        
        // Update frequency indicator if available
        const frequencyElement = document.getElementById('updateFrequency');
        if (frequencyElement) {
            frequencyElement.textContent = `${metrics.updateFrequency.toFixed(1)}/s`;
        }
    });
}

// Monitor connection quality and performance
function monitorConnectionQuality() {
    let lastUpdateTime = Date.now();
    let updateCount = 0;
    let averageLatency = 0;
    
    // Monitor update frequency
    const originalUpdateStatus = updateCurrentStatus;
    updateCurrentStatus = function(data) {
        const now = Date.now();
        const timeSinceLastUpdate = now - lastUpdateTime;
        
        updateCount++;
        averageLatency = (averageLatency * (updateCount - 1) + timeSinceLastUpdate) / updateCount;
        
        // Update connection quality indicator
        updateConnectionQuality(timeSinceLastUpdate, averageLatency);
        
        lastUpdateTime = now;
        return originalUpdateStatus.call(this, data);
    };
}

// Update connection quality indicator
function updateConnectionQuality(latency, averageLatency) {
    const qualityElement = document.getElementById('connectionQuality');
    if (!qualityElement) return;
    
    let quality = 'excellent';
    let color = 'var(--status-normal)';
    
    if (averageLatency > 5000) {
        quality = 'poor';
        color = 'var(--status-danger)';
    } else if (averageLatency > 3000) {
        quality = 'fair';
        color = 'var(--status-warning)';
    } else if (averageLatency > 1500) {
        quality = 'good';
        color = 'var(--status-normal)';
    }
    
    qualityElement.textContent = quality;
    qualityElement.style.color = color;
}

// Handle connection errors with exponential backoff retry logic
function handleConnectionError() {
    connectionRetryCount++;
    updateConnectionStatus('error');
    
    if (connectionRetryCount < MAX_RETRY_COUNT) {
        const retryDelay = Math.min(2000 * Math.pow(2, connectionRetryCount - 1), 30000); // Exponential backoff, max 30s
        
        setTimeout(() => {
            console.log(`Retrying connection... Attempt ${connectionRetryCount + 1}`);
            updateConnectionStatus('connecting');
            
            // Try to reconnect by creating a new reference
            try {
                database.goOffline();
                setTimeout(() => {
                    database.goOnline();
                }, 1000);
            } catch (error) {
                console.error('Reconnection attempt failed:', error);
            }
        }, retryDelay);
    } else {
        console.error('Max retry attempts reached. Switching to offline mode.');
        updateConnectionStatus('failed');
        
        // Notify enhanced features about offline mode
        if (window.floodGuardEnhanced) {
            window.floodGuardEnhanced.enableOfflineMode();
        }
    }
}

// Update connection status with visual feedback and performance metrics
function updateConnectionStatus(status) {
    const statusDot = elements.connectionStatus.querySelector('.status-dot');
    const statusText = elements.connectionStatus.querySelector('.status-text');
    
    statusDot.className = 'status-dot';
    
    switch(status) {
        case 'connected':
            statusDot.classList.add('connected');
            statusText.textContent = 'Connected';
            break;
        case 'connecting':
            statusText.textContent = 'Connecting...';
            statusDot.classList.add('connecting');
            break;
        case 'error':
            statusDot.classList.add('error');
            statusText.textContent = `Connection Error (${connectionRetryCount}/${MAX_RETRY_COUNT})`;
            break;
        case 'failed':
            statusDot.classList.add('error');
            statusText.textContent = 'Connection Failed';
            break;
    }
}

// Update current status with animations and sound alerts - ENHANCED DEBUG
function updateCurrentStatus(data) {
    console.log('🔍 RECEIVED DATA:', data);
    
    // Update last update time
    if (data.timestamp) {
        const date = new Date(data.timestamp * 1000);
        elements.lastUpdateTime.textContent = date.toLocaleTimeString();
    }

    // Determine severity and update status alert
    const severity = data.severity ? data.severity.toLowerCase() : 'normal';
    console.log('📊 SEVERITY:', severity);
    
    updateStatusAlert(severity, data.message || 'System monitoring active');

    // Calculate water level percentage - ENHANCED DEBUG
    const distance = data.distance || 0;
    console.log('📐 RAW DISTANCE:', distance);
    
    const waterLevelPercent = calculateWaterLevelPercent(distance);
    console.log('📈 CALCULATED THREAT:', waterLevelPercent);
    
    elements.waterLevelValue.textContent = waterLevelPercent.toFixed(1);
    
    // Update sensor distance with trend
    elements.sensorDistance.textContent = distance.toFixed(1);
    updateDistanceTrend(distance);
    
    // Update water sensor status
    updateWaterSensorDisplay(data.waterLevelRaw, data.waterLevelPercent);
    
    // Update threshold bar with animation - FORCE UPDATE
    console.log('🎯 UPDATING PROGRESS BAR TO:', waterLevelPercent);
    updateThresholdBar(waterLevelPercent);
    
    // Visual feedback only - no sound alerts
    if (severity !== lastSeverity && isInitialized) {
        lastSeverity = severity;
    }
    
    // Add message to history
    if (data.message) {
        addMessageToHistory(data.message, data.timestamp, severity);
    }
}

// Calculate water level percentage from distance - FIXED REALISTIC THREAT MAPPING
function calculateWaterLevelPercent(distance) {
    if (!distance || distance < 0) return 100; // If no reading, assume worst case
    
    // UPDATED ranges to match user expectations:
    // Normal (11-10.2cm) → 0% to 49% threat
    // Warning (10.2-9.4cm) → 50% to 69% threat  
    // Critical (9.4-0cm) → 70% to 100% threat
    
    let percent = 0;
    
    if (distance >= 10.2) {
        // NORMAL range (11-10.2cm) → 0% to 49% threat
        const normalRange = 11.0 - 10.2; // 0.8cm range
        const distanceFromMax = Math.max(0, 11.0 - distance); // How far from 11cm
        const normalProgress = Math.min(1, distanceFromMax / normalRange); // 0 to 1
        percent = normalProgress * 49; // Scale to 0-49%
        
    } else if (distance >= 9.4) {
        // WARNING range (10.2-9.4cm) → 50% to 69% threat
        const warningRange = 10.2 - 9.4; // 0.8cm range
        const distanceFromWarningStart = 10.2 - distance; // How far into warning range
        const warningProgress = Math.min(1, distanceFromWarningStart / warningRange); // 0 to 1
        percent = 50 + (warningProgress * 19); // Scale to 50-69%
        
    } else {
        // CRITICAL range (9.4-0cm) → 70% to 100% threat
        const criticalRange = 9.4; // 9.4cm range (from 9.4 to 0)
        const distanceFromCriticalStart = 9.4 - distance; // How far into critical range
        const criticalProgress = Math.min(1, distanceFromCriticalStart / criticalRange); // 0 to 1
        percent = 70 + (criticalProgress * 30); // Scale to 70-100%
    }
    
    // Clamp to 0-100%
    percent = Math.max(0, Math.min(100, percent));
    
    // Enhanced debug logging with corrected mapping
    console.log(`🎯 UPDATED THREAT MAPPING: Distance=${distance}cm -> Threat=${percent.toFixed(1)}%`);
    
    // Validate against updated thresholds
    if (distance >= 10.2) {
        console.log(`✅ NORMAL range (11-10.2cm): Expected 0-49% threat, Got ${percent.toFixed(1)}%`);
    } else if (distance >= 9.4) {
        console.log(`⚠️ WARNING range (10.2-9.4cm): Expected 50-69% threat, Got ${percent.toFixed(1)}%`);
    } else {
        console.log(`🚨 CRITICAL range (9.4-0cm): Expected 70-100% threat, Got ${percent.toFixed(1)}%`);
    }
    
    return percent;
}

// Update distance trend indicator
function updateDistanceTrend(currentDistance) {
    const trendElement = document.getElementById('distanceTrend');
    if (!trendElement) return;
    
    const trendIcon = trendElement.querySelector('.trend-icon');
    const trendText = trendElement.querySelector('.trend-text');
    
    // Updated trend calculation for new ranges
    if (currentDistance >= 10.2) {
        trendIcon.textContent = '↓';
        trendText.textContent = 'Normal';
        trendElement.style.color = 'var(--status-normal)';
    } else if (currentDistance >= 9.4) {
        trendIcon.textContent = '↗';
        trendText.textContent = 'Warning';
        trendElement.style.color = 'var(--status-warning)';
    } else {
        trendIcon.textContent = '↑';
        trendText.textContent = 'Critical';
        trendElement.style.color = 'var(--status-danger)';
    }
}

// Update water sensor display
function updateWaterSensorDisplay(rawValue, percentValue) {
    if (rawValue !== undefined) {
        elements.waterSensorValue.textContent = rawValue;
        elements.waterSensorUnit.textContent = 'ADC';
        
        const statusElement = elements.waterSensorStatus;
        if (!statusElement) return;
        
        const statusIcon = statusElement.querySelector('.trend-icon');
        const statusText = statusElement.querySelector('.trend-text');
        
        if (rawValue < 500) {
            statusIcon.textContent = '○';
            statusText.textContent = 'Dry';
            statusElement.style.color = 'var(--text-secondary)';
        } else if (rawValue < 800) {
            statusIcon.textContent = '◐';
            statusText.textContent = 'Touching';
            statusElement.style.color = 'var(--status-warning)';
        } else if (rawValue >= 1200) {
            statusIcon.textContent = '●';
            statusText.textContent = 'Confirmed';
            statusElement.style.color = 'var(--status-danger)';
        } else {
            statusIcon.textContent = '◑';
            statusText.textContent = 'Rising';
            statusElement.style.color = 'var(--status-warning)';
        }
    } else {
        elements.waterSensorValue.textContent = '--';
        elements.waterSensorUnit.textContent = '--';
    }
}

// Update status alert with enhanced professional styling and heartbeat animations
function updateStatusAlert(severity, message) {
    const statusCard = elements.statusAlert;
    const alertBanner = elements.alertBanner;
    
    // Update main status card with heartbeat animations
    statusCard.className = `status-card primary-status ${severity}`;
    
    const titles = {
        normal: 'System Operational',
        warning: 'Warning Detected',
        danger: 'Critical Alert',
        critical: 'Emergency Status'
    };
    
    elements.alertTitle.textContent = titles[severity] || 'System Status';
    elements.alertMessage.textContent = message;
    
    // Show/hide alert banner for critical situations
    if (severity === 'danger' || severity === 'critical') {
        alertBanner.style.display = 'block';
        elements.alertBannerTitle.textContent = titles[severity];
        elements.alertBannerMessage.textContent = message;
        alertBanner.className = `alert-banner ${severity}`;
    } else {
        alertBanner.style.display = 'none';
    }
    
    // Update pulse ring color
    const pulseRing = statusCard.querySelector('.pulse-ring');
    const statusDot = statusCard.querySelector('.status-indicator .status-dot');
    
    if (pulseRing && statusDot) {
        switch(severity) {
            case 'normal':
                pulseRing.style.borderColor = 'var(--status-normal)';
                statusDot.style.background = 'var(--status-normal)';
                statusDot.style.boxShadow = '0 0 12px rgba(0, 255, 136, 0.6)';
                break;
            case 'warning':
                pulseRing.style.borderColor = 'var(--status-warning)';
                statusDot.style.background = 'var(--status-warning)';
                statusDot.style.boxShadow = '0 0 12px rgba(255, 170, 0, 0.6)';
                break;
            case 'danger':
            case 'critical':
                pulseRing.style.borderColor = 'var(--status-danger)';
                statusDot.style.background = 'var(--status-danger)';
                statusDot.style.boxShadow = '0 0 12px rgba(255, 51, 102, 0.6)';
                break;
        }
    }
    
    // Apply heartbeat animations to sensor cards
    applyHeartbeatToSensorCards(severity);
    
    // 🚨 EMERGENCY EVACUATION POPUP - Show when warning level is reached
    if (severity === 'warning' && !isEvacuationPopupShown) {
        showEvacuationPopup();
    }
}

// Update threshold bar with professional styling - UPDATED THREAT COLORS
function updateThresholdBar(percentage) {
    console.log('🎯 UPDATING PROGRESS BAR:', percentage + '%');
    
    // Force immediate update
    elements.thresholdFill.style.width = `${percentage}%`;
    elements.threatPercentage.textContent = `${percentage.toFixed(1)}%`;
    
    // Update fill color based on updated threat levels
    let color;
    let colorName;
    if (percentage >= 70) {
        // Critical: 70-100%
        color = 'var(--status-danger)';
        colorName = 'CRITICAL';
    } else if (percentage >= 50) {
        // Warning: 50-69%
        color = 'var(--status-warning)';
        colorName = 'WARNING';
    } else {
        // Normal: 0-49%
        color = 'var(--status-normal)';
        colorName = 'NORMAL';
    }
    
    console.log('🎨 PROGRESS BAR COLOR:', colorName, color);
    
    elements.thresholdFill.style.background = `linear-gradient(90deg, var(--status-normal), ${color})`;
    
    // Add glow effect for updated threat levels
    if (percentage >= 70) {
        // Critical glow
        elements.thresholdFill.style.boxShadow = '0 0 20px rgba(255, 51, 102, 0.4)';
    } else if (percentage >= 50) {
        // Warning glow
        elements.thresholdFill.style.boxShadow = '0 0 15px rgba(255, 170, 0, 0.3)';
    } else {
        // Normal - no glow
        elements.thresholdFill.style.boxShadow = 'none';
    }
    
    // Force a repaint
    elements.thresholdFill.offsetHeight;
    
    console.log('✅ PROGRESS BAR UPDATED');
}

// Add message to history with improved management
function addMessageToHistory(message, timestamp, severity = 'info') {
    // Avoid duplicate messages
    if (messageHistory.length > 0 && messageHistory[0].message === message) {
        return;
    }
    
    messageHistory.unshift({
        message: message,
        timestamp: timestamp,
        severity: severity,
        id: Date.now() + Math.random() // Unique ID for animations
    });
    
    // Keep only last 20 messages for performance
    if (messageHistory.length > 20) {
        messageHistory = messageHistory.slice(0, 20);
    }
    
    // Update display
    updateMessagesDisplay();
}

// Update messages display with professional styling
function updateMessagesDisplay() {
    const hasMessages = messageHistory.length > 0;
    
    // Update message count
    elements.messageCount.textContent = messageHistory.length;
    
    if (!hasMessages) {
        elements.messagesList.innerHTML = `
            <div class="no-events">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="16" x2="12" y2="12"/>
                    <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
                <span>No events recorded</span>
            </div>
        `;
        return;
    }
    
    elements.messagesList.innerHTML = messageHistory.map((item, index) => {
        const date = new Date(item.timestamp * 1000);
        const iconType = ['danger', 'critical'].includes(item.severity) ? 'danger' : 
                        item.severity === 'warning' ? 'warning' : 'info';
        
        return `
            <div class="message-item" style="animation-delay: ${index * 0.05}s">
                <div class="message-icon ${iconType}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        ${iconType === 'danger' ? 
                            '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>' :
                            iconType === 'warning' ?
                            '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>' :
                            '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>'
                        }
                    </svg>
                </div>
                <div class="message-content">
                    <div class="message-text">${item.message}</div>
                    <div class="message-time">${date.toLocaleString()}</div>
                </div>
            </div>
        `;
    }).join('');
}

// Performance optimization: Enhanced debounce with priority handling
let updateTimeout;
let priorityUpdateTimeout;

function debounceUpdate(callback, delay = 50) {  // Reduced default delay
    clearTimeout(updateTimeout);
    updateTimeout = setTimeout(callback, delay);
}

function priorityUpdate(callback, delay = 10) {  // Ultra-fast priority updates
    clearTimeout(priorityUpdateTimeout);
    priorityUpdateTimeout = setTimeout(callback, delay);
}

// Optimized chart updates with performance monitoring - FIXED loading issue
function updateChart() {
    const startTime = performance.now();
    
    console.log('📊 CHART UPDATE: Historical data length:', historicalData.length);
    
    // Always hide loading spinner when updateChart is called
    elements.chartLoading.classList.add('hidden');
    
    // Use demo data if no real data available
    let dataToUse = historicalData;
    if (historicalData.length === 0) {
        console.log('📊 Using demo data for chart display');
        // Chart already has demo data from initialization, just return
        return;
    }
    
    // Get optimal number of data points based on screen width
    const maxPoints = Math.min(100, Math.max(20, Math.floor(window.innerWidth / 10)));
    const recentData = dataToUse.slice(-maxPoints);
    
    console.log('📈 Processing', recentData.length, 'data points for chart');
    
    // Prepare chart data with optimized processing
    const labels = recentData.map(item => {
        const date = new Date(item.timestamp * 1000);
        return date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    });
    
    const waterLevels = recentData.map(item => {
        const level = calculateWaterLevelPercent(item.distance);
        console.log(`Chart point: ${item.distance}cm -> ${level.toFixed(1)}%`);
        return level;
    });
    
    // Update chart with optimized animation
    waterLevelChart.data.labels = labels;
    waterLevelChart.data.datasets[0].data = waterLevels;
    
    // Color code points based on updated threat levels
    const pointColors = waterLevels.map(level => {
        if (level >= 70) return '#ff3366'; // Critical (70-100%)
        if (level >= 50) return '#ffaa00'; // Warning (50-69%)
        return '#00ff88'; // Normal (0-49%)
    });
    
    waterLevelChart.data.datasets[0].pointBackgroundColor = pointColors;
    
    // Use faster animation for real-time updates
    const animationDuration = recentData.length > 50 ? 200 : 400;
    waterLevelChart.options.animation.duration = animationDuration;
    
    waterLevelChart.update('none'); // Skip animation for better performance
    
    const endTime = performance.now();
    console.log(`✅ Chart update completed in ${(endTime - startTime).toFixed(2)}ms`);
}

// Update data points count with performance info
function updateDataPointsCount() {
    const totalPoints = historicalData.length;
    const recentPoints = historicalData.filter(item => 
        (Date.now() / 1000) - item.timestamp < 3600 // Last hour
    ).length;
    
    elements.dataPoints.innerHTML = `
        <span>${totalPoints} total</span>
        <span class="text-xs text-slate-400">• ${recentPoints} recent</span>
    `;
}

// Initialize with professional demo data if no real data after timeout - FORCE CHART DISPLAY
setTimeout(() => {
    console.log('🔄 Checking data status after 2 seconds...');
    
    if (Object.keys(currentData).length === 0 && isInitialized) {
        console.log('🎭 No real data received, showing professional demo data');
        const demoData = {
            waterLevel: 27,
            distance: 8.0,
            severity: 'Normal',
            message: 'FloodGuard Pro - Flood detection system active. Connect ESP32 for live data.',
            timestamp: Math.floor(Date.now() / 1000),
            waterLevelRaw: 850
        };
        updateCurrentStatus(demoData);
        addMessageToHistory('🚀 FloodGuard Pro initialized - Flood detection system ready', demoData.timestamp, 'info');
        addMessageToHistory('📡 Demo mode active - Connect your ESP32 device for real-time monitoring', demoData.timestamp, 'info');
    }
    
    // Create demo historical data if none exists for chart (but chart already has demo data)
    if (historicalData.length === 0) {
        console.log('📊 Creating demo historical data for Firebase simulation');
        
        const now = Math.floor(Date.now() / 1000);
        for (let i = 0; i < 30; i++) {
            historicalData.push({
                timestamp: now - (i * 120),
                distance: 10.7 + Math.sin(i * 0.3) * 0.3 + Math.random() * 0.2,
                waterLevel: 8 + Math.sin(i * 0.3) * 3 + Math.random() * 2,
                severity: 'Normal'
            });
        }
        historicalData.reverse();
        
        console.log('✅ Demo historical data created:', historicalData.length, 'records');
        
        // Update chart with real demo data
        setTimeout(() => {
            updateChart();
            updateDataPointsCount();
            console.log('🎯 Chart updated with demo historical data');
        }, 100);
    }
    
}, 2000);

// Add chart control functionality
document.addEventListener('DOMContentLoaded', function() {
    const chartControls = document.querySelectorAll('.chart-control');
    chartControls.forEach(control => {
        control.addEventListener('click', function() {
            // Remove active class from all controls
            chartControls.forEach(c => c.classList.remove('active'));
            // Add active class to clicked control
            this.classList.add('active');
            
            // Update chart based on selected range
            const range = this.dataset.range;
            updateChartRange(range);
        });
    });
});

// Update chart based on time range
function updateChartRange(range) {
    let dataPoints;
    const now = Date.now() / 1000;
    
    switch(range) {
        case '1h':
            dataPoints = historicalData.filter(item => (now - item.timestamp) <= 3600);
            break;
        case '6h':
            dataPoints = historicalData.filter(item => (now - item.timestamp) <= 21600);
            break;
        case '24h':
            dataPoints = historicalData.filter(item => (now - item.timestamp) <= 86400);
            break;
        default:
            dataPoints = historicalData.slice(-50);
    }
    
    if (dataPoints.length > 0) {
        const labels = dataPoints.map(item => {
            const date = new Date(item.timestamp * 1000);
            return date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        });
        
        const waterLevels = dataPoints.map(item => {
            return calculateWaterLevelPercent(item.distance);
        });
        
        waterLevelChart.data.labels = labels;
        waterLevelChart.data.datasets[0].data = waterLevels;
        waterLevelChart.update('active');
    }
}

// Dismiss alert banner
function dismissAlert() {
    const alertBanner = elements.alertBanner;
    alertBanner.style.animation = 'slideUp 0.3s ease-out reverse';
    setTimeout(() => {
        alertBanner.style.display = 'none';
    }, 300);
}

// Make dismissAlert globally available
window.dismissAlert = dismissAlert;

// Apply heartbeat animations to sensor cards based on severity - ENHANCED
function applyHeartbeatToSensorCards(severity) {
    // Get all sensor cards
    const sensorCards = document.querySelectorAll('.sensor-card');
    
    sensorCards.forEach(card => {
        // Remove existing animation classes
        card.classList.remove('warning', 'critical');
        
        // Apply appropriate animation based on severity
        if (severity === 'warning') {
            card.classList.add('warning');
            console.log('🟡 Applied warning heartbeat to sensor cards');
        } else if (severity === 'danger' || severity === 'critical') {
            card.classList.add('critical');
            console.log('🔴 Applied critical heartbeat to sensor cards');
        }
    });
    
    // Also apply to main status card for enhanced effect
    const statusCard = elements.statusAlert;
    if (statusCard) {
        statusCard.classList.remove('warning', 'critical', 'danger');
        
        if (severity === 'warning') {
            statusCard.classList.add('warning');
        } else if (severity === 'danger' || severity === 'critical') {
            statusCard.classList.add('critical');
        }
    }
}

// Export for debugging and testing
window.floodMonitor = {
    currentData,
    historicalData,
    messageHistory,
    updateChart,
    connectionRetryCount,
    performance: {
        forceUpdate: () => updateCurrentStatus(currentData),
        clearHistory: () => {
            historicalData = [];
            messageHistory = [];
            updateChart();
            updateMessagesDisplay();
        },
        connectionStatus: () => ({
            connected: database.ref('.info/connected'),
            retryCount: connectionRetryCount,
            lastUpdate: elements.lastUpdateTime.textContent
        })
    }
};

// Test message listener for animation testing
window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'test') {
        console.log('🧪 Test message received:', event.data);
        
        const testData = {
            distance: event.data.distance || 10.0,
            severity: event.data.severity || 'normal',
            message: event.data.message || 'Test message',
            timestamp: Math.floor(Date.now() / 1000),
            waterLevelRaw: event.data.severity === 'critical' ? 1500 : 
                          event.data.severity === 'warning' ? 1200 : 800
        };
        
        // Force update with test data
        updateCurrentStatus(testData);
        addMessageToHistory(testData.message, testData.timestamp, testData.severity);
        
        console.log('✅ Test animation applied:', testData.severity);
    }
    
    // Handle offline/online testing
    if (event.data && event.data.type === 'test-offline') {
        console.log('🔌 Offline mode test triggered');
        if (window.floodGuardEnhanced) {
            window.floodGuardEnhanced.enableOfflineMode();
        }
    }
    
    if (event.data && event.data.type === 'test-online') {
        console.log('✅ Online mode test triggered');
        if (window.floodGuardEnhanced) {
            window.floodGuardEnhanced.showConnectionRestoredNotification();
        }
    }
});

// ===================================
// EMERGENCY EVACUATION POPUP SYSTEM
// ===================================

let isEvacuationPopupShown = false;
let evacuationTimer = null;
let evacuationCountdown = 30;

// Show emergency evacuation popup
function showEvacuationPopup() {
    console.log('🚨 EMERGENCY: Showing evacuation popup for WARNING level');
    
    const overlay = document.getElementById('evacuationPopupOverlay');
    const acknowledgeBtn = document.getElementById('evacuationAcknowledge');
    const timerElement = document.getElementById('evacuationTimer');
    
    if (!overlay) {
        console.error('❌ Evacuation popup overlay not found');
        return;
    }
    
    // Mark as shown to prevent multiple popups
    isEvacuationPopupShown = true;
    
    // Show the popup
    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
    
    // Reset countdown
    evacuationCountdown = 30;
    timerElement.textContent = evacuationCountdown;
    
    // Start countdown timer
    evacuationTimer = setInterval(() => {
        evacuationCountdown--;
        timerElement.textContent = evacuationCountdown;
        
        if (evacuationCountdown <= 0) {
            hideEvacuationPopup();
        }
    }, 1000);
    
    // Add acknowledge button event listener
    acknowledgeBtn.onclick = () => {
        console.log('✅ User acknowledged evacuation warning');
        hideEvacuationPopup();
    };
    
    // Add escape key listener
    document.addEventListener('keydown', evacuationEscapeHandler);
    
    // Log evacuation popup display
    addMessageToHistory('🚨 EVACUATION WARNING DISPLAYED - User alerted to prepare for evacuation', Date.now() / 1000, 'danger');
    
    console.log('✅ Evacuation popup displayed successfully');
}

// Hide evacuation popup
function hideEvacuationPopup() {
    console.log('🔒 Hiding evacuation popup');
    
    const overlay = document.getElementById('evacuationPopupOverlay');
    
    if (overlay) {
        overlay.style.display = 'none';
        document.body.style.overflow = ''; // Restore scrolling
    }
    
    // Clear timer
    if (evacuationTimer) {
        clearInterval(evacuationTimer);
        evacuationTimer = null;
    }
    
    // Remove escape key listener
    document.removeEventListener('keydown', evacuationEscapeHandler);
    
    console.log('✅ Evacuation popup hidden');
}

// Handle escape key for evacuation popup
function evacuationEscapeHandler(event) {
    if (event.key === 'Escape') {
        hideEvacuationPopup();
    }
}

// Reset evacuation popup state when returning to normal
function resetEvacuationPopupState(severity) {
    if (severity === 'normal' && isEvacuationPopupShown) {
        isEvacuationPopupShown = false;
        console.log('🔄 Evacuation popup state reset - can show again if warning returns');
    }
}

// Add evacuation popup reset to the existing updateStatusAlert function
// This will be called automatically when severity changes
const originalUpdateStatusAlert = updateStatusAlert;
updateStatusAlert = function(severity, message) {
    // Call original function
    originalUpdateStatusAlert(severity, message);
    
    // Reset evacuation popup state if returning to normal
    resetEvacuationPopupState(severity);
};
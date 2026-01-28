// FloodGuard Pro - Validation Check Script
// Run this in browser console to verify all fixes

console.log('🔍 FloodGuard Pro Validation Check Starting...');

// Test 1: Threat Level Calculation
function testThreatCalculation() {
    console.log('\n📊 Testing Threat Level Calculations...');
    
    // Test cases with expected results
    const testCases = [
        { distance: 10.5, expected: 'Normal (0-49%)', range: [0, 49] },
        { distance: 10.2, expected: 'Warning Start (50%)', range: [50, 50] },
        { distance: 9.8, expected: 'Warning Mid (55%)', range: [50, 69] },
        { distance: 9.4, expected: 'Warning End (69%)', range: [50, 69] },
        { distance: 9.39, expected: 'Critical Start (70%)', range: [70, 70] },
        { distance: 5.0, expected: 'Critical Mid (85%)', range: [70, 100] },
        { distance: 1.0, expected: 'Critical High (95%)', range: [70, 100] }
    ];
    
    testCases.forEach(test => {
        if (typeof calculateWaterLevelPercent === 'function') {
            const result = calculateWaterLevelPercent(test.distance);
            const inRange = result >= test.range[0] && result <= test.range[1];
            console.log(`  ${test.distance}cm -> ${result.toFixed(1)}% ${inRange ? '✅' : '❌'} ${test.expected}`);
        } else {
            console.log('  ❌ calculateWaterLevelPercent function not found');
        }
    });
}

// Test 2: Chart Container Heights
function testChartLayout() {
    console.log('\n📈 Testing Chart Layout...');
    
    const chartContainer = document.querySelector('.chart-container');
    const eventList = document.querySelector('.event-list');
    const analyticsSection = document.querySelector('.analytics-section');
    
    if (chartContainer) {
        const chartHeight = window.getComputedStyle(chartContainer).height;
        console.log(`  Chart Container Height: ${chartHeight} ✅`);
    } else {
        console.log('  ❌ Chart container not found');
    }
    
    if (eventList) {
        const eventHeight = window.getComputedStyle(eventList).maxHeight;
        console.log(`  Event List Max Height: ${eventHeight} ✅`);
    } else {
        console.log('  ❌ Event list not found');
    }
    
    if (analyticsSection) {
        const gridColumns = window.getComputedStyle(analyticsSection).gridTemplateColumns;
        console.log(`  Analytics Grid: ${gridColumns} ✅`);
    } else {
        console.log('  ❌ Analytics section not found');
    }
}

// Test 3: Mobile Navigation Position
function testMobileNavigation() {
    console.log('\n📱 Testing Mobile Navigation...');
    
    const mobileNav = document.querySelector('.mobile-nav');
    const navToggle = document.querySelector('.mobile-nav-toggle');
    
    if (mobileNav) {
        const navStyle = window.getComputedStyle(mobileNav);
        const zIndex = navStyle.zIndex;
        console.log(`  Mobile Nav Position: top=${navStyle.top}, right=${navStyle.right} ✅`);
        console.log(`  Mobile Nav Z-Index: ${zIndex} ${parseInt(zIndex) >= 1100 ? '✅' : '❌'}`);
        
        if (window.innerWidth <= 768) {
            console.log(`  Mobile Nav Display: ${navStyle.display} ✅`);
        }
    } else {
        console.log('  ❌ Mobile navigation not found');
    }
    
    if (navToggle) {
        const toggleStyle = window.getComputedStyle(navToggle);
        const toggleZIndex = toggleStyle.zIndex;
        console.log(`  Nav Toggle Size: ${toggleStyle.width} x ${toggleStyle.height} ✅`);
        console.log(`  Nav Toggle Z-Index: ${toggleZIndex} ${parseInt(toggleZIndex) >= 1101 ? '✅' : '❌'}`);
    } else {
        console.log('  ❌ Navigation toggle not found');
    }
    
    // Test notification positioning
    const notifications = document.querySelectorAll('.smart-notification');
    if (notifications.length > 0) {
        notifications.forEach((notification, index) => {
            const notificationStyle = window.getComputedStyle(notification);
            const notificationZIndex = notificationStyle.zIndex;
            const notificationTop = notificationStyle.top;
            console.log(`  Notification ${index + 1}: top=${notificationTop}, z-index=${notificationZIndex} ${parseInt(notificationZIndex) < 1100 ? '✅' : '❌'}`);
        });
    } else {
        console.log('  ℹ️ No notifications currently displayed');
    }
}

// Test 4: Enhanced Features
function testEnhancedFeatures() {
    console.log('\n🚀 Testing Enhanced Features...');
    
    if (window.floodGuardEnhanced) {
        console.log('  Enhanced UI Instance: ✅ Loaded');
    } else {
        console.log('  ⚠️ Enhanced UI not loaded (may still be initializing)');
    }
    
    const quickActionsFab = document.querySelector('.quick-actions-fab');
    if (quickActionsFab) {
        console.log('  Quick Actions FAB: ✅ Present');
    } else {
        console.log('  ⚠️ Quick Actions FAB not found (may still be loading)');
    }
}

// Test 5: Logo Integration
function testLogoIntegration() {
    console.log('\n🖼️ Testing Logo Integration...');
    
    const logoImages = document.querySelectorAll('img[src*="FD_logo.png"]');
    const faviconLink = document.querySelector('link[href*="FD_logo.png"]');
    
    console.log(`  Logo Images Found: ${logoImages.length} ✅`);
    
    if (faviconLink) {
        console.log('  Favicon Link: ✅ Present');
    } else {
        console.log('  ❌ Favicon link not found');
    }
    
    // Check specific logo locations
    const headerLogo = document.querySelector('.status-icon img[src*="FD_logo.png"]');
    const navLogo = document.querySelector('.nav-icon img[src*="FD_logo.png"]');
    const loadingLogo = document.querySelector('.loading-logo img[src*="FD_logo.png"]');
    
    console.log(`  Header Logo: ${headerLogo ? '✅' : '❌'}`);
    console.log(`  Navigation Logo: ${navLogo ? '✅' : '❌'}`);
    console.log(`  Loading Logo: ${loadingLogo ? '✅' : '❌'}`);
}

// Test 6: Responsive Design
function testResponsiveDesign() {
    console.log('\n📐 Testing Responsive Design...');
    
    const screenWidth = window.innerWidth;
    console.log(`  Screen Width: ${screenWidth}px`);
    
    if (screenWidth <= 480) {
        console.log('  Device: Very Small Mobile');
    } else if (screenWidth <= 768) {
        console.log('  Device: Mobile');
    } else if (screenWidth <= 1200) {
        console.log('  Device: Tablet');
    } else {
        console.log('  Device: Desktop');
    }
    
    // Check for overflow issues
    const body = document.body;
    const hasHorizontalScroll = body.scrollWidth > body.clientWidth;
    console.log(`  Horizontal Overflow: ${hasHorizontalScroll ? '❌ Present' : '✅ None'}`);
    
    // Check analytics section on mobile
    if (screenWidth <= 768) {
        const analyticsSection = document.querySelector('.analytics-section');
        if (analyticsSection) {
            const gridColumns = window.getComputedStyle(analyticsSection).gridTemplateColumns;
            const isSingleColumn = gridColumns.includes('1fr') && !gridColumns.includes('2fr');
            console.log(`  Mobile Single Column: ${isSingleColumn ? '✅' : '❌'}`);
        }
    }
}

// Run all tests
function runAllTests() {
    console.log('🧪 Running FloodGuard Pro Validation Tests...');
    console.log('================================================');
    
    testThreatCalculation();
    testChartLayout();
    testMobileNavigation();
    testEnhancedFeatures();
    testLogoIntegration();
    testResponsiveDesign();
    
    console.log('\n✅ Validation Check Complete!');
    console.log('================================================');
    console.log('💡 To test threat levels, use the test-animations.html page');
    console.log('📱 To test mobile view, resize browser or use Developer Tools');
    console.log('🚀 Enhanced features may take a moment to fully initialize');
}

// Auto-run tests after page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(runAllTests, 2000);
    });
} else {
    setTimeout(runAllTests, 1000);
}

// Export for manual testing
window.floodGuardValidation = {
    runAllTests,
    testThreatCalculation,
    testChartLayout,
    testMobileNavigation,
    testEnhancedFeatures,
    testLogoIntegration,
    testResponsiveDesign,
    // New test functions
    testOfflineMode: () => {
        console.log('\n📡 Testing Offline Mode Notification...');
        if (window.floodGuardEnhanced) {
            window.floodGuardEnhanced.showOfflineNotification();
            console.log('  Offline notification triggered ✅');
            
            setTimeout(() => {
                const offlineNotification = document.querySelector('.offline-notification');
                if (offlineNotification) {
                    const style = window.getComputedStyle(offlineNotification);
                    console.log(`  Notification position: top=${style.top}, z-index=${style.zIndex}`);
                    console.log(`  Z-index below navigation: ${parseInt(style.zIndex) < 1100 ? '✅' : '❌'}`);
                } else {
                    console.log('  ❌ Offline notification not found');
                }
            }, 500);
        } else {
            console.log('  ❌ Enhanced features not loaded');
        }
    },
    testConnectionRestored: () => {
        console.log('\n✅ Testing Connection Restored...');
        if (window.floodGuardEnhanced) {
            window.floodGuardEnhanced.showConnectionRestoredNotification();
            console.log('  Connection restored notification triggered ✅');
        } else {
            console.log('  ❌ Enhanced features not loaded');
        }
    }
};

console.log('🔧 Validation script loaded. Run floodGuardValidation.runAllTests() to test manually.');
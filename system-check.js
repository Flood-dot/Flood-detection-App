// FloodGuard Pro System Check
// Quick diagnostic script to verify all components are working

class SystemCheck {
    constructor() {
        this.results = {
            logo: false,
            firebase: false,
            chart: false,
            navigation: false,
            enhanced: false,
            icons: false
        };
        
        this.runChecks();
    }
    
    async runChecks() {
        console.log('🔍 Running FloodGuard Pro System Check...');
        
        // Check logo integration
        this.checkLogo();
        
        // Check Firebase connection
        this.checkFirebase();
        
        // Check chart system
        this.checkChart();
        
        // Check navigation
        this.checkNavigation();
        
        // Check enhanced features
        this.checkEnhancedFeatures();
        
        // Check icons
        await this.checkIcons();
        
        // Display results
        this.displayResults();
    }
    
    checkLogo() {
        const logoImages = document.querySelectorAll('img[src*="FD_logo.png"]');
        const faviconLink = document.querySelector('link[href*="FD_logo.png"]');
        
        this.results.logo = logoImages.length > 0 && faviconLink !== null;
        console.log(`📷 Logo Check: ${this.results.logo ? '✅' : '❌'} (${logoImages.length} instances found)`);
    }
    
    checkFirebase() {
        this.results.firebase = typeof firebase !== 'undefined' && firebase.database;
        console.log(`🔥 Firebase Check: ${this.results.firebase ? '✅' : '❌'}`);
    }
    
    checkChart() {
        this.results.chart = typeof Chart !== 'undefined' && document.getElementById('waterLevelChart');
        console.log(`📊 Chart Check: ${this.results.chart ? '✅' : '❌'}`);
    }
    
    checkNavigation() {
        const mobileNav = document.getElementById('mobileNav');
        const navItems = document.querySelectorAll('.mobile-nav-item');
        
        this.results.navigation = mobileNav !== null && navItems.length > 0;
        console.log(`🧭 Navigation Check: ${this.results.navigation ? '✅' : '❌'} (${navItems.length} nav items)`);
    }
    
    checkEnhancedFeatures() {
        this.results.enhanced = typeof window.floodGuardEnhanced !== 'undefined';
        console.log(`🚀 Enhanced Features Check: ${this.results.enhanced ? '✅' : '❌'}`);
    }
    
    async checkIcons() {
        const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];
        let foundIcons = 0;
        
        for (const size of iconSizes) {
            try {
                const response = await fetch(`icons/icon-${size}x${size}.png`, { method: 'HEAD' });
                if (response.ok) foundIcons++;
            } catch (error) {
                // Icon not found
            }
        }
        
        this.results.icons = foundIcons >= 4; // At least half the icons should exist
        console.log(`🎨 Icons Check: ${this.results.icons ? '✅' : '❌'} (${foundIcons}/${iconSizes.length} icons found)`);
    }
    
    displayResults() {
        const overallHealth = Object.values(this.results).filter(Boolean).length;
        const totalChecks = Object.keys(this.results).length;
        const healthPercentage = Math.round((overallHealth / totalChecks) * 100);
        
        console.log('\n🏥 SYSTEM HEALTH REPORT');
        console.log('========================');
        console.log(`Overall Health: ${healthPercentage}% (${overallHealth}/${totalChecks})`);
        console.log('\nComponent Status:');
        
        Object.entries(this.results).forEach(([component, status]) => {
            console.log(`  ${component.padEnd(12)}: ${status ? '✅ OK' : '❌ ISSUE'}`);
        });
        
        if (healthPercentage === 100) {
            console.log('\n🎉 All systems operational! FloodGuard Pro is ready.');
        } else if (healthPercentage >= 80) {
            console.log('\n⚠️ Minor issues detected. System mostly functional.');
        } else {
            console.log('\n🚨 Multiple issues detected. Please check configuration.');
        }
        
        // Show recommendations
        this.showRecommendations();
    }
    
    showRecommendations() {
        console.log('\n💡 RECOMMENDATIONS:');
        
        if (!this.results.logo) {
            console.log('  • Verify FD_logo.png exists in icons/ folder');
        }
        
        if (!this.results.firebase) {
            console.log('  • Check Firebase configuration and network connection');
        }
        
        if (!this.results.chart) {
            console.log('  • Verify Chart.js library is loaded');
        }
        
        if (!this.results.navigation) {
            console.log('  • Check mobile navigation HTML structure');
        }
        
        if (!this.results.enhanced) {
            console.log('  • Enhanced features may still be loading');
        }
        
        if (!this.results.icons) {
            console.log('  • Generate missing PWA icons using the icon generator');
        }
    }
}

// Auto-run system check after page load
window.addEventListener('load', () => {
    setTimeout(() => {
        window.systemCheck = new SystemCheck();
    }, 2000); // Wait for other systems to initialize
});

// Manual system check function
window.runSystemCheck = () => {
    new SystemCheck();
};
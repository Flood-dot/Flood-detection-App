/*
 * FloodGuard Pro - Performance Monitor
 * 
 * Real-time performance monitoring for ultra-optimized data flow:
 * - Measures actual update frequencies
 * - Tracks connection quality and latency
 * - Monitors dashboard responsiveness
 * - Provides performance analytics
 */

class PerformanceMonitor {
    constructor() {
        this.metrics = {
            updateFrequency: 0,
            averageLatency: 0,
            connectionQuality: 'excellent',
            dashboardResponsiveness: 0,
            totalUpdates: 0,
            failedUpdates: 0,
            successRate: 100,
            lastUpdate: Date.now(),
            startTime: Date.now()
        };
        
        this.updateTimes = [];
        this.latencyHistory = [];
        this.maxHistoryLength = 100;
        
        this.isMonitoring = false;
        this.performanceChart = null;
        
        this.init();
    }
    
    init() {
        console.log('🚀 Performance Monitor initialized');
        this.createPerformanceUI();
        this.startMonitoring();
    }
    
    startMonitoring() {
        if (this.isMonitoring) return;
        
        this.isMonitoring = true;
        this.metrics.startTime = Date.now();
        
        // Hook into the main update function
        this.hookUpdateFunction();
        
        // Start performance tracking interval
        this.performanceInterval = setInterval(() => {
            this.updatePerformanceMetrics();
            this.updatePerformanceUI();
        }, 1000); // Update every second
        
        console.log('📊 Performance monitoring started');
    }
    
    stopMonitoring() {
        this.isMonitoring = false;
        
        if (this.performanceInterval) {
            clearInterval(this.performanceInterval);
        }
        
        console.log('⏹️ Performance monitoring stopped');
    }
    
    hookUpdateFunction() {
        // Hook into the main updateCurrentStatus function
        const originalUpdate = window.updateCurrentStatus;
        if (!originalUpdate) return;
        
        const self = this;
        
        window.updateCurrentStatus = function(data) {
            const startTime = performance.now();
            
            // Call original function
            const result = originalUpdate.call(this, data);
            
            const endTime = performance.now();
            const responseTime = endTime - startTime;
            
            // Track performance
            self.recordUpdate(responseTime);
            
            return result;
        };
    }
    
    recordUpdate(responseTime) {
        const now = Date.now();
        
        // Record update timing
        this.updateTimes.push(now);
        this.latencyHistory.push(responseTime);
        
        // Keep history manageable
        if (this.updateTimes.length > this.maxHistoryLength) {
            this.updateTimes.shift();
            this.latencyHistory.shift();
        }
        
        // Update metrics
        this.metrics.totalUpdates++;
        this.metrics.lastUpdate = now;
        this.metrics.dashboardResponsiveness = responseTime;
        
        // Calculate average latency
        const totalLatency = this.latencyHistory.reduce((sum, lat) => sum + lat, 0);
        this.metrics.averageLatency = totalLatency / this.latencyHistory.length;
        
        // Assess connection quality
        this.metrics.connectionQuality = this.assessConnectionQuality();
    }
    
    updatePerformanceMetrics() {
        const now = Date.now();
        const timeWindow = 60000; // 1 minute window
        
        // Calculate update frequency (updates per second)
        const recentUpdates = this.updateTimes.filter(time => now - time < timeWindow);
        this.metrics.updateFrequency = recentUpdates.length / (timeWindow / 1000);
        
        // Calculate success rate (assuming failures are tracked elsewhere)
        this.metrics.successRate = this.metrics.totalUpdates > 0 ? 
            ((this.metrics.totalUpdates - this.metrics.failedUpdates) / this.metrics.totalUpdates) * 100 : 100;
    }
    
    assessConnectionQuality() {
        const avgLatency = this.metrics.averageLatency;
        const frequency = this.metrics.updateFrequency;
        
        if (avgLatency < 50 && frequency > 1.0) return 'excellent';
        if (avgLatency < 100 && frequency > 0.8) return 'good';
        if (avgLatency < 200 && frequency > 0.5) return 'fair';
        return 'poor';
    }
    
    createPerformanceUI() {
        // Create performance monitor panel
        const performancePanel = document.createElement('div');
        performancePanel.id = 'performanceMonitor';
        performancePanel.className = 'performance-monitor hidden';
        performancePanel.innerHTML = `
            <div class="performance-header">
                <h3>🚀 Performance Monitor</h3>
                <button class="close-btn" onclick="window.performanceMonitor.togglePanel()">×</button>
            </div>
            
            <div class="performance-metrics">
                <div class="metric-card">
                    <div class="metric-label">Update Frequency</div>
                    <div class="metric-value" id="perfUpdateFreq">0.0 Hz</div>
                    <div class="metric-target">Target: 1.33 Hz</div>
                </div>
                
                <div class="metric-card">
                    <div class="metric-label">Average Latency</div>
                    <div class="metric-value" id="perfLatency">0 ms</div>
                    <div class="metric-target">Target: <50 ms</div>
                </div>
                
                <div class="metric-card">
                    <div class="metric-label">Connection Quality</div>
                    <div class="metric-value" id="perfQuality">excellent</div>
                    <div class="metric-indicator" id="perfQualityIndicator"></div>
                </div>
                
                <div class="metric-card">
                    <div class="metric-label">Success Rate</div>
                    <div class="metric-value" id="perfSuccessRate">100%</div>
                    <div class="metric-target">Target: >95%</div>
                </div>
            </div>
            
            <div class="performance-chart-container">
                <canvas id="performanceChart" width="400" height="200"></canvas>
            </div>
            
            <div class="performance-controls">
                <button class="perf-btn" onclick="window.performanceMonitor.resetMetrics()">Reset</button>
                <button class="perf-btn" onclick="window.performanceMonitor.exportMetrics()">Export</button>
                <button class="perf-btn" onclick="window.performanceMonitor.runBenchmark()">Benchmark</button>
            </div>
        `;
        
        // Add to body
        document.body.appendChild(performancePanel);
        
        // Add CSS styles
        this.addPerformanceStyles();
        
        // Initialize performance chart
        this.initPerformanceChart();
        
        // Add toggle button to main interface
        this.addToggleButton();
    }
    
    addPerformanceStyles() {
        const styles = `
            <style id="performanceMonitorStyles">
                .performance-monitor {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    width: 400px;
                    background: var(--bg-elevated);
                    border: 1px solid var(--border-color);
                    border-radius: 12px;
                    padding: 20px;
                    z-index: 1000;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                    backdrop-filter: blur(10px);
                    transition: all 0.3s ease;
                }
                
                .performance-monitor.hidden {
                    transform: translateX(420px);
                    opacity: 0;
                    pointer-events: none;
                }
                
                .performance-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    padding-bottom: 10px;
                    border-bottom: 1px solid var(--border-color);
                }
                
                .performance-header h3 {
                    margin: 0;
                    color: var(--primary-cyan);
                    font-size: 16px;
                }
                
                .close-btn {
                    background: none;
                    border: none;
                    color: var(--text-secondary);
                    font-size: 20px;
                    cursor: pointer;
                    padding: 0;
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .close-btn:hover {
                    color: var(--text-primary);
                }
                
                .performance-metrics {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                    margin-bottom: 20px;
                }
                
                .metric-card {
                    background: var(--bg-card);
                    padding: 12px;
                    border-radius: 8px;
                    border: 1px solid var(--border-color);
                }
                
                .metric-label {
                    font-size: 12px;
                    color: var(--text-secondary);
                    margin-bottom: 5px;
                }
                
                .metric-value {
                    font-size: 18px;
                    font-weight: 600;
                    color: var(--text-primary);
                    margin-bottom: 3px;
                }
                
                .metric-target {
                    font-size: 10px;
                    color: var(--text-tertiary);
                }
                
                .metric-indicator {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    margin-top: 5px;
                }
                
                .performance-chart-container {
                    margin-bottom: 20px;
                    background: var(--bg-card);
                    padding: 15px;
                    border-radius: 8px;
                    border: 1px solid var(--border-color);
                }
                
                .performance-controls {
                    display: flex;
                    gap: 10px;
                }
                
                .perf-btn {
                    flex: 1;
                    padding: 8px 12px;
                    background: var(--bg-card);
                    border: 1px solid var(--border-color);
                    border-radius: 6px;
                    color: var(--text-primary);
                    font-size: 12px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                
                .perf-btn:hover {
                    background: var(--primary-cyan);
                    color: var(--bg-primary);
                }
                
                .perf-toggle-btn {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    width: 50px;
                    height: 50px;
                    background: var(--primary-cyan);
                    border: none;
                    border-radius: 50%;
                    color: var(--bg-primary);
                    font-size: 20px;
                    cursor: pointer;
                    z-index: 999;
                    box-shadow: 0 4px 15px rgba(0, 212, 255, 0.3);
                    transition: all 0.3s ease;
                }
                
                .perf-toggle-btn:hover {
                    transform: scale(1.1);
                    box-shadow: 0 6px 20px rgba(0, 212, 255, 0.4);
                }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', styles);
    }
    
    addToggleButton() {
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'perf-toggle-btn';
        toggleBtn.innerHTML = '📊';
        toggleBtn.title = 'Performance Monitor';
        toggleBtn.onclick = () => this.togglePanel();
        
        document.body.appendChild(toggleBtn);
    }
    
    initPerformanceChart() {
        const ctx = document.getElementById('performanceChart');
        if (!ctx) return;
        
        this.performanceChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Update Frequency (Hz)',
                    data: [],
                    borderColor: '#00d4ff',
                    backgroundColor: 'rgba(0, 212, 255, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }, {
                    label: 'Latency (ms)',
                    data: [],
                    borderColor: '#ffaa00',
                    backgroundColor: 'rgba(255, 170, 0, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4,
                    yAxisID: 'y1'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 0 },
                plugins: {
                    legend: {
                        display: true,
                        labels: { color: '#94a3b8', font: { size: 10 } }
                    }
                },
                scales: {
                    x: {
                        display: true,
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#94a3b8', font: { size: 10 } }
                    },
                    y: {
                        display: true,
                        position: 'left',
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#94a3b8', font: { size: 10 } },
                        title: { display: true, text: 'Frequency (Hz)', color: '#00d4ff' }
                    },
                    y1: {
                        display: true,
                        position: 'right',
                        grid: { drawOnChartArea: false },
                        ticks: { color: '#94a3b8', font: { size: 10 } },
                        title: { display: true, text: 'Latency (ms)', color: '#ffaa00' }
                    }
                }
            }
        });
    }
    
    updatePerformanceUI() {
        // Update metric values
        document.getElementById('perfUpdateFreq').textContent = `${this.metrics.updateFrequency.toFixed(2)} Hz`;
        document.getElementById('perfLatency').textContent = `${this.metrics.averageLatency.toFixed(1)} ms`;
        document.getElementById('perfQuality').textContent = this.metrics.connectionQuality;
        document.getElementById('perfSuccessRate').textContent = `${this.metrics.successRate.toFixed(1)}%`;
        
        // Update quality indicator
        const indicator = document.getElementById('perfQualityIndicator');
        if (indicator) {
            const colors = {
                excellent: '#00ff88',
                good: '#00d4ff',
                fair: '#ffaa00',
                poor: '#ff3366'
            };
            indicator.style.backgroundColor = colors[this.metrics.connectionQuality];
        }
        
        // Update performance chart
        if (this.performanceChart) {
            const now = new Date().toLocaleTimeString();
            
            this.performanceChart.data.labels.push(now);
            this.performanceChart.data.datasets[0].data.push(this.metrics.updateFrequency);
            this.performanceChart.data.datasets[1].data.push(this.metrics.averageLatency);
            
            // Keep only last 20 points
            if (this.performanceChart.data.labels.length > 20) {
                this.performanceChart.data.labels.shift();
                this.performanceChart.data.datasets[0].data.shift();
                this.performanceChart.data.datasets[1].data.shift();
            }
            
            this.performanceChart.update('none');
        }
    }
    
    togglePanel() {
        const panel = document.getElementById('performanceMonitor');
        if (panel) {
            panel.classList.toggle('hidden');
        }
    }
    
    resetMetrics() {
        this.metrics = {
            updateFrequency: 0,
            averageLatency: 0,
            connectionQuality: 'excellent',
            dashboardResponsiveness: 0,
            totalUpdates: 0,
            failedUpdates: 0,
            successRate: 100,
            lastUpdate: Date.now(),
            startTime: Date.now()
        };
        
        this.updateTimes = [];
        this.latencyHistory = [];
        
        if (this.performanceChart) {
            this.performanceChart.data.labels = [];
            this.performanceChart.data.datasets[0].data = [];
            this.performanceChart.data.datasets[1].data = [];
            this.performanceChart.update();
        }
        
        console.log('🔄 Performance metrics reset');
    }
    
    exportMetrics() {
        const exportData = {
            timestamp: new Date().toISOString(),
            metrics: this.metrics,
            history: {
                updateTimes: this.updateTimes,
                latencyHistory: this.latencyHistory
            }
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `floodguard-performance-${Date.now()}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        console.log('📊 Performance metrics exported');
    }
    
    runBenchmark() {
        console.log('🏃 Running performance benchmark...');
        
        const startTime = performance.now();
        let iterations = 0;
        const maxIterations = 1000;
        
        const benchmark = () => {
            if (iterations < maxIterations) {
                // Simulate update processing
                const mockData = {
                    distance: 10.5 + Math.sin(iterations * 0.1) * 0.5,
                    waterLevel: 25 + Math.cos(iterations * 0.1) * 10,
                    severity: 'normal',
                    timestamp: Math.floor(Date.now() / 1000)
                };
                
                // Measure processing time
                const processStart = performance.now();
                // Simulate processing
                JSON.stringify(mockData);
                const processEnd = performance.now();
                
                this.recordUpdate(processEnd - processStart);
                
                iterations++;
                requestAnimationFrame(benchmark);
            } else {
                const endTime = performance.now();
                const totalTime = endTime - startTime;
                
                console.log(`✅ Benchmark completed: ${iterations} iterations in ${totalTime.toFixed(2)}ms`);
                console.log(`📊 Average iteration time: ${(totalTime / iterations).toFixed(3)}ms`);
            }
        };
        
        requestAnimationFrame(benchmark);
    }
    
    getMetrics() {
        return { ...this.metrics };
    }
}

// Initialize performance monitor when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    if (typeof Chart !== 'undefined') {
        window.performanceMonitor = new PerformanceMonitor();
        console.log('🚀 Performance Monitor ready');
    } else {
        console.warn('⚠️ Chart.js not available - Performance Monitor disabled');
    }
});

// Export for external access
window.PerformanceMonitor = PerformanceMonitor;
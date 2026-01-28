# FloodGuard Pro - Smart Flood Monitoring System

A professional-grade IoT flood monitoring system with dual-sensor validation, real-time Firebase integration, and modern web dashboard featuring emergency evacuation alerts and responsive design.

## 🎯 Core Features

### 🌊 Intelligent Dual-Sensor Flood Detection
- **Primary Sensor**: HC-SR04 ultrasonic sensor for precise distance measurement
- **Secondary Sensor**: Water level sensor for physical water contact confirmation
- **Smart Logic**: Both sensors must confirm before triggering alarms AND LEDs (prevents false positives)
- **Three-LED System**: Green (Normal), Yellow (Warning), Red (Critical) with cumulative behavior
- **Custom Thresholds**: Normal (11-10.2cm), Warning (10.2-9.4cm), Critical (9.4-0cm)
- **LED Stability**: 1-second response time with anti-flickering hysteresis

### 🚨 Emergency Evacuation System
- **Automatic Popup**: Displays "WARNING: PREPARE FOR EVACUATION IMMEDIATELY!" when warning level reached
- **Clear Action Items**: Step-by-step evacuation instructions with icons
- **Smart Behavior**: Single display per warning event, 30-second auto-dismiss
- **Mobile Responsive**: Optimized for all screen sizes

### ⚡ Ultra-Optimized Performance
- **Ultra-Fast Measurements**: 0.5-second sensor reading intervals
- **Real-Time Firebase Updates**: 0.75-second database sync
- **Instant UI Response**: 25ms dashboard debounce
- **Performance Monitoring**: Real-time metrics with connection quality assessment

### 🎨 Modern Web Dashboard
- **Real-Time Visualization**: Live charts with smooth animations
- **Professional UI**: Dark theme with card-based layout
- **PWA Support**: Installable web app with offline capabilities
- **Mobile Navigation**: Professional floating menu system

## 🔧 Hardware Architecture

### Components
- **ESP32**: Main microcontroller with WiFi capability
- **HC-SR04**: Ultrasonic distance sensor (primary detection)
- **Water Level Sensor**: Analog sensor for physical confirmation
- **Active Buzzer**: Multi-pattern alarm system
- **Three-LED System**: Cumulative visual status indicators

### Pin Configuration
```
ESP32 Pin Assignments:
├── GPIO5  → Ultrasonic TRIG
├── GPIO18 → Ultrasonic ECHO
├── GPIO34 → Water Level Sensor (ADC)
├── GPIO4  → Buzzer Control
├── GPIO2  → Green LED (Normal)
├── GPIO15 → Yellow LED (Warning)
├── GPIO16 → Red LED (Critical)
└── 5V/3.3V → Sensor Power
```

## 🌊 Dual-Sensor Logic System

### Distance Thresholds (Ultrasonic Sensor)
- **Normal**: 11-10.2cm from sensor (0-49% threat level)
- **Warning**: 10.2-9.4cm from sensor (50-69% threat level)
- **Critical**: 9.4-0cm from sensor (70-100% threat level)

### Water Sensor Confirmation
- **Dry**: <500 ADC (no water contact)
- **Touching**: 500-800 ADC (water touching sensor)
- **Rising**: 800-1200 ADC (water level increasing)
- **Confirmed**: ≥1200 ADC (triggers alarm confirmation)

### Alarm Activation Logic
```
Normal State: Green LED only, no alarms
Warning State: Green + Yellow LEDs + (Buzzer + Evacuation Popup if water sensor ≥1200)
Critical State: All LEDs + (Continuous buzzer if water sensor ≥1200)
```

## 🗂️ Project Structure

```
FloodGuard-Pro/
├── firmware/
│   └── flood_monitor.ino          # Optimized ESP32 firmware
├── dashboard/                     # Modern web interface
│   ├── index.html                 # Responsive HTML with evacuation popup
│   ├── styles.css                 # Professional CSS with animations
│   ├── script.js                  # Firebase integration & evacuation system
│   ├── manifest.json              # PWA configuration
│   ├── sw.js                      # Service worker for offline support
│   └── icons/                     # PWA icons and logos
├── docs/                          # Technical documentation
│   ├── system-architecture.md     # System design overview
│   ├── calibration.md            # Sensor calibration guide
│   ├── firebase-setup.md         # Database configuration
│   └── hardware-diagram.md       # Wiring specifications
└── README.md                     # Project overview
```

## 🚀 Quick Start

### 1. Hardware Setup
1. Connect ESP32 to sensors according to pin configuration
2. Upload `firmware/flood_monitor.ino` to ESP32
3. Update WiFi credentials and Firebase config in firmware

### 2. Firebase Configuration
1. Create Firebase project at https://console.firebase.google.com
2. Enable Realtime Database
3. Update Firebase credentials in `dashboard/script.js`
4. Set database rules for read/write access

### 3. Dashboard Deployment
1. Host dashboard files on web server or open `index.html` locally
2. Install as PWA for mobile access
3. Test evacuation popup functionality

## 🎯 Key Features

### Emergency Safety
- **Evacuation Popup**: Automatic warning when flood risk detected
- **Clear Instructions**: Step-by-step evacuation guidance
- **Professional Design**: Urgent, attention-grabbing interface

### Smart Detection
- **Dual-Sensor Validation**: Prevents false alarms
- **Cumulative LEDs**: Visual status progression
- **Fast Response**: 1-second LED activation time

### Modern Interface
- **Real-Time Updates**: Live sensor data and charts
- **Mobile Optimized**: Responsive design for all devices
- **PWA Support**: Installable web application

## ⚠️ Safety Notice

This system is designed for early flood detection and warning. It should not be used as the sole method for flood protection. Always follow local emergency procedures and evacuation orders from authorities.

## 📄 License

This project is open source and available under the MIT License.

---

**FloodGuard Pro** - Professional flood monitoring with emergency evacuation alerts
# System Architecture & Design Rationale

## 1. Overall Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   ESP32 Device  │    │   Firebase RTDB  │    │  Web Dashboard  │
│                 │    │                  │    │                 │
│ ┌─────────────┐ │    │ ┌──────────────┐ │    │ ┌─────────────┐ │
│ │ Ultrasonic  │ │    │ │ currentStatus│ │    │ │ Real-time   │ │
│ │ Sensor      │ │───▶│ │              │ │◄───│ │ Display     │ │
│ └─────────────┘ │    │ └──────────────┘ │    │ └─────────────┘ │
│                 │    │                  │    │                 │
│ ┌─────────────┐ │    │ ┌──────────────┐ │    │ ┌─────────────┐ │
│ │ Buzzer +    │ │    │ │   history    │ │    │ │ Trend       │ │
│ │ LED Alarms  │ │    │ │              │ │    │ │ Charts      │ │
│ └─────────────┘ │    │ └──────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 2. Data Flow Architecture

### Real-time Data Pipeline

```
[Sensor Reading] → [Filtering] → [State Logic] → [Local Alarms] → [Firebase Update]
                                      ↓
                              [State Change Detection]
                                      ↓
                              [Immediate Firebase Push]
                                      ↓
                              [Dashboard Auto-Update]
```

### Data Processing Stages

1. **Sensor Layer**
   - HC-SR04 ultrasonic measurement
   - 5-point moving average filtering
   - Outlier rejection
   - Temperature compensation (optional)

2. **Logic Layer**
   - Three-state severity determination
   - State transition detection
   - Recovery message generation
   - Hysteresis implementation

3. **Output Layer**
   - Local alarm control (buzzer + LED)
   - Firebase data formatting
   - Real-time vs. historical data routing

4. **Presentation Layer**
   - Live status display
   - Historical trend visualization
   - Alert message management
   - Responsive UI adaptation

## 3. Component Design Decisions

### Hardware Choices

**ESP32 Microcontroller**
- **Why chosen**: Built-in WiFi, sufficient GPIO pins, Arduino IDE support
- **Alternatives considered**: Arduino Uno + WiFi module (more complex)
- **Trade-offs**: Higher power consumption vs. integrated connectivity

**HC-SR04 Ultrasonic Sensor**
- **Why chosen**: Cost-effective, reliable, easy integration
- **Alternatives considered**: Laser distance sensor (more expensive), pressure sensor (less accurate)
- **Trade-offs**: Weather sensitivity vs. simplicity

**Active Buzzer + LED**
- **Why chosen**: Simple, immediate local feedback, low power
- **Alternatives considered**: Display screen (more complex), SMS alerts (requires cellular)
- **Trade-offs**: Limited information vs. reliability

### Software Architecture Decisions

**Firebase Realtime Database**
- **Why chosen**: Real-time synchronization, easy web integration, scalable
- **Alternatives considered**: Local server (maintenance overhead), MQTT (more complex setup)
- **Trade-offs**: Internet dependency vs. ease of use

**Three-State Severity System**
- **Why chosen**: Clear, actionable states with visual distinction
- **Alternatives considered**: Continuous scale (less intuitive), binary alarm (less informative)
- **Trade-offs**: Simplicity vs. granular information

**Client-side Dashboard**
- **Why chosen**: No server maintenance, direct Firebase connection, responsive design
- **Alternatives considered**: Server-side rendering (more complex), mobile app (platform-specific)
- **Trade-offs**: Limited offline capability vs. simplicity

## 4. State Machine Design

### Severity State Transitions

```
     ┌─────────┐
     │ NORMAL  │◄──────────────────┐
     │ (Green) │                   │
     └────┬────┘                   │
          │                        │
          │ Water Rising           │ Water Receding
          ▼                        │
     ┌─────────┐                   │
     │WARNING  │                   │
     │(Yellow) │                   │
     └────┬────┘                   │
          │                        │
          │ Water Rising           │ Water Receding
          ▼                        │
     ┌─────────┐                   │
     │ DANGER  │───────────────────┘
     │  (Red)  │
     └─────────┘
```

### State Logic Implementation

```cpp
enum SeverityState { NORMAL, WARNING, DANGER };

SeverityState determineState(float distance) {
    if (distance >= NORMAL_THRESHOLD) {
        return NORMAL;      // > 50cm from sensor
    } else if (distance >= WARNING_THRESHOLD) {
        return WARNING;     // 30-50cm from sensor
    } else {
        return DANGER;      // < 30cm from sensor
    }
}
```

### Recovery Detection

```cpp
String generateMessage() {
    if (previousState != NORMAL && currentState == NORMAL) {
        return "Water level back to safe state";  // Recovery message
    } else if (currentState == DANGER) {
        return "Flood detected!";
    } else if (currentState == WARNING) {
        return "Water level approaching danger threshold";
    } else {
        return "Water level normal";
    }
}
```

## 5. Database Schema Design

### Current Status Structure
```json
{
  "currentStatus": {
    "waterLevel": 25.5,      // Calculated level (cm)
    "distance": 74.5,        // Raw sensor distance (cm)
    "severity": "Normal",    // State string
    "message": "Water level normal",  // User-friendly message
    "timestamp": 1640995200  // Unix timestamp
  }
}
```

### Historical Data Structure
```json
{
  "history": {
    "1640995200": {          // Unix timestamp as key
      "waterLevel": 25.5,
      "distance": 74.5,
      "severity": "Normal",
      "timestamp": 1640995200
    }
  }
}
```

### Design Rationale
- **Flat structure**: Easy to query and update
- **Timestamp keys**: Natural ordering and uniqueness
- **Redundant timestamp**: Supports different query patterns
- **Separate current/history**: Optimizes real-time vs. analytical queries

## 6. User Interface Design

### Design Principles
- **Clarity**: Immediate understanding of system status
- **Hierarchy**: Most critical information prominently displayed
- **Responsiveness**: Works on desktop and mobile devices
- **Accessibility**: Color-blind friendly with text labels

### Visual Design System

**Color Coding**
- Green (#10b981): Normal state, safe conditions
- Yellow (#f59e0b): Warning state, attention needed
- Red (#ef4444): Danger state, immediate action required

**Typography**
- Primary: Inter font family for readability
- Hierarchy: Clear size and weight distinctions
- Contrast: WCAG AA compliant color ratios

**Layout**
- Card-based design for information grouping
- Grid system for responsive behavior
- Consistent spacing and padding

### Component Architecture

```
Dashboard
├── Header (Status + Connection)
├── Status Cards Row
│   ├── Current Status Card
│   └── System Messages Card
├── Chart Row
│   └── Water Level Trend Chart
└── Statistics Row
    ├── Max Level Stat
    ├── Min Level Stat
    ├── Average Level Stat
    └── Alert Count Stat
```

## 7. Performance Considerations

### ESP32 Optimization
- **Measurement interval**: 5 seconds (balance between responsiveness and power)
- **Firebase updates**: 10 seconds regular, immediate on state change
- **Memory management**: Fixed-size buffers, no dynamic allocation
- **Power efficiency**: Deep sleep mode possible for battery operation

### Dashboard Optimization
- **Real-time updates**: Firebase listeners for automatic UI updates
- **Chart performance**: Limited data points, efficient rendering
- **Responsive design**: CSS Grid and Flexbox for layout efficiency
- **Caching**: Browser caching for static assets

### Database Optimization
- **Data structure**: Optimized for common query patterns
- **Indexing**: Timestamp-based keys for natural ordering
- **Data retention**: Consider cleanup policies for large datasets
- **Bandwidth**: Minimal data payload for real-time updates

## 8. Scalability Considerations

### Multi-Device Support
```json
{
  "devices": {
    "device_001": {
      "currentStatus": { ... },
      "history": { ... }
    },
    "device_002": {
      "currentStatus": { ... },
      "history": { ... }
    }
  }
}
```

### Geographic Distribution
- Device location metadata
- Regional dashboard views
- Timezone handling
- Local weather integration

### Alert System Expansion
- Email notifications
- SMS alerts
- Push notifications
- Integration with emergency services

## 9. Security Architecture

### Current Implementation (Development)
- Open Firebase rules for testing
- No authentication required
- Public read/write access

### Production Security Recommendations
```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null && auth.uid == $device_id"
  }
}
```

### Security Measures
- Device authentication tokens
- User access control
- Data encryption in transit
- Regular security audits

## 10. Limitations & Future Improvements

### Current Limitations
1. **Single sensor point**: No redundancy or area coverage
2. **WiFi dependency**: No offline data logging
3. **Basic filtering**: Simple noise reduction
4. **No predictive analytics**: Reactive system only
5. **Limited alerting**: Local alarms only

### Potential Improvements
1. **Multi-sensor array**: Better coverage and redundancy
2. **Edge computing**: Local data processing and storage
3. **Machine learning**: Predictive flood modeling
4. **Integration**: Weather data, river levels, rainfall
5. **Mobile app**: Native mobile experience
6. **Battery backup**: Uninterrupted operation during power outages

### Upgrade Path
```
Phase 1: Current prototype (MVP)
Phase 2: Multi-sensor deployment
Phase 3: Predictive analytics
Phase 4: Regional monitoring network
Phase 5: AI-powered flood prediction
```

This architecture provides a solid foundation for a flood monitoring system while maintaining simplicity and reliability for prototype deployment.
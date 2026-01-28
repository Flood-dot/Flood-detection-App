# Dual-Sensor Calibration Guide

## Overview

This system uses both an ultrasonic sensor (HC-SR04) and a water level sensor for dual-sensor validation and improved accuracy. Proper calibration of both sensors is essential for reliable flood detection.

## 1. Physical Installation Calibration

### Sensor Mounting
- **Ultrasonic Height**: Mount sensor at least 1 meter above maximum expected water level
- **Ultrasonic Angle**: Ensure sensor faces directly downward (perpendicular to water surface)
- **Water Level Sensor**: Position at the lowest expected water level point
- **Clearance**: Maintain 30cm clearance from walls or obstacles for ultrasonic sensor
- **Protection**: Shield both sensors from direct rain while allowing proper operation

### Reference Measurements
1. Measure exact distance from ultrasonic sensor to normal water level
2. Measure distance to warning threshold level
3. Measure distance to danger threshold level
4. Record mounting height above ground/floor
5. Test water level sensor at different water depths
6. Record water level sensor readings at normal, warning, and danger levels

## 2. Software Calibration

### Ultrasonic Sensor (HC-SR04)

The HC-SR04 sensor has these characteristics:
- **Range**: 2cm to 400cm
- **Accuracy**: ±3mm
- **Resolution**: 0.3cm
- **Beam Angle**: 15° cone

### Water Level Sensor

Typical water level sensor characteristics:
- **Output**: Analog 0-4095 (12-bit ADC)
- **Response**: Linear with water depth
- **Sensitivity**: Varies by sensor type
- **Range**: Depends on sensor length

### Calibration Constants

Update these values in `firmware/flood_monitor.ino`:

```cpp
// Ultrasonic thresholds (in cm from sensor)
#define NORMAL_THRESHOLD 50    // > 50cm = Normal
#define WARNING_THRESHOLD 30   // 30-50cm = Warning  
#define DANGER_THRESHOLD 20    // < 20cm = Danger

// Water level sensor thresholds (analog values 0-4095)
#define WATER_LEVEL_NORMAL 1000    // Below this = Normal
#define WATER_LEVEL_WARNING 2000   // 1000-2000 = Warning
#define WATER_LEVEL_DANGER 3000    // Above 2000 = Danger
```

### Threshold Calculation

For your specific installation:

1. **Measure Baseline**:
   ```
   Normal Water Level Distance = [Your measurement] cm
   Maximum Expected Rise = [Your measurement] cm
   Sensor Height = [Your measurement] cm
   ```

2. **Calculate Thresholds**:
   ```
   NORMAL_THRESHOLD = Normal Water Level Distance - 10cm (safety margin)
   WARNING_THRESHOLD = Normal Water Level Distance - 20cm
   DANGER_THRESHOLD = Normal Water Level Distance - 30cm
   ```

3. **Example Calculation**:
   ```
   If normal water level is 80cm from sensor:
   NORMAL_THRESHOLD = 70cm   (water level safe)
   WARNING_THRESHOLD = 60cm  (water rising)
   DANGER_THRESHOLD = 50cm   (flood condition)
   ```

## 3. Environmental Calibration

### Temperature Compensation

Sound speed varies with temperature:
- **20°C**: 343 m/s (default)
- **0°C**: 331 m/s
- **40°C**: 355 m/s

For better accuracy, implement temperature compensation:

```cpp
// Add temperature sensor (optional)
float getTemperatureCompensatedDistance(float rawDistance, float temperature) {
    float speedOfSound = 331.3 + (0.606 * temperature);  // m/s
    float correctionFactor = speedOfSound / 343.0;  // Relative to 20°C
    return rawDistance * correctionFactor;
}
```

### Humidity Effects
- Minimal impact on ultrasonic measurements
- Consider only in extreme humidity conditions (>90%)

## 4. Noise Filtering Calibration

### Current Filtering Method
The firmware implements a 5-point moving average filter:

```cpp
float distanceBuffer[5] = {0};
int bufferIndex = 0;

float getFilteredDistance() {
    float sum = 0;
    int validReadings = 0;
    
    for (int i = 0; i < 5; i++) {
        if (distanceBuffer[i] > 0) {
            sum += distanceBuffer[i];
            validReadings++;
        }
    }
    
    return validReadings > 0 ? sum / validReadings : -1;
}
```

### Advanced Filtering Options

For noisy environments, consider:

1. **Median Filter** (better for spike rejection):
```cpp
float getMedianDistance() {
    float sorted[5];
    memcpy(sorted, distanceBuffer, sizeof(distanceBuffer));
    // Sort array and return middle value
    return sorted[2];
}
```

2. **Outlier Rejection**:
```cpp
float getFilteredDistanceWithOutlierRejection() {
    float mean = getFilteredDistance();
    float validSum = 0;
    int validCount = 0;
    
    for (int i = 0; i < 5; i++) {
        if (abs(distanceBuffer[i] - mean) < 5.0) {  // 5cm tolerance
            validSum += distanceBuffer[i];
            validCount++;
        }
    }
    
    return validCount > 0 ? validSum / validCount : mean;
}
```

## 5. Calibration Procedure

### Step 1: Initial Setup
1. Install sensor at desired location
2. Upload firmware with default thresholds
3. Monitor serial output for 10 minutes
4. Record distance readings at normal water level

### Step 2: Threshold Testing
1. Simulate water level changes (if safe)
2. Verify state transitions occur at correct levels
3. Adjust thresholds in code if needed
4. Test alarm activation in danger state

### Step 3: Long-term Validation
1. Monitor system for 24 hours
2. Check for false alarms or missed detections
3. Analyze data trends in Firebase dashboard
4. Fine-tune filtering parameters if needed

## 6. Validation Tests

### Accuracy Test
```cpp
void runAccuracyTest() {
    Serial.println("=== Accuracy Test ===");
    for (int i = 0; i < 100; i++) {
        float distance = measureDistance();
        Serial.print("Reading ");
        Serial.print(i);
        Serial.print(": ");
        Serial.print(distance);
        Serial.println(" cm");
        delay(100);
    }
}
```

### State Transition Test
```cpp
void testStateTransitions() {
    Serial.println("=== State Transition Test ===");
    
    // Test each threshold
    float testDistances[] = {60, 45, 35, 25, 15};  // cm
    
    for (int i = 0; i < 5; i++) {
        SeverityState state = determineState(testDistances[i]);
        Serial.print("Distance: ");
        Serial.print(testDistances[i]);
        Serial.print(" cm -> State: ");
        Serial.println(getStateString(state));
    }
}
```

## 7. Troubleshooting Calibration Issues

### Inconsistent Readings
- **Cause**: Surface reflections, obstacles, vibrations
- **Solution**: Relocate sensor, add dampening, increase filtering

### False Alarms
- **Cause**: Thresholds too sensitive, environmental noise
- **Solution**: Adjust thresholds, improve filtering, add hysteresis

### Missed Detections
- **Cause**: Thresholds too conservative, sensor malfunction
- **Solution**: Lower thresholds, test sensor operation, check connections

### Hysteresis Implementation
Prevent rapid state changes:

```cpp
SeverityState determineStateWithHysteresis(float distance) {
    static float hysteresis = 2.0;  // 2cm hysteresis
    
    if (currentState == NORMAL && distance < WARNING_THRESHOLD - hysteresis) {
        return WARNING;
    } else if (currentState == WARNING) {
        if (distance > NORMAL_THRESHOLD + hysteresis) {
            return NORMAL;
        } else if (distance < DANGER_THRESHOLD - hysteresis) {
            return DANGER;
        }
    } else if (currentState == DANGER && distance > WARNING_THRESHOLD + hysteresis) {
        return WARNING;
    }
    
    return currentState;  // No change
}
```

## 8. Maintenance Schedule

### Weekly
- Check sensor cleanliness
- Verify mounting stability
- Review data trends

### Monthly
- Recalibrate thresholds if needed
- Clean sensor face
- Check electrical connections

### Seasonally
- Account for water level changes
- Update thresholds for seasonal variations
- Perform full system test

## 9. Documentation Template

Record your calibration settings:

```
Installation Date: ___________
Location: ___________________
Sensor Height: _____________ cm
Normal Water Distance: _____ cm
Warning Threshold: _________ cm
Danger Threshold: __________ cm
Environmental Conditions: ___________
Calibration Notes: _________________
```
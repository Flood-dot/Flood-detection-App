/*
 * Smart Flood Monitoring System - Dual Sensor Implementation
 * 
 * Sensor Logic:
 * 1. Ultrasonic Sensor (Primary): Measures water by distance for all levels
 *    - Normal: > 50cm from sensor
 *    - Warning: 30-50cm from sensor  
 *    - Critical: < 30cm from sensor
 * 
 * 2. Water Level Sensor (Secondary): Activates only at WARNING level and above
 *    - WARNING: Water touches sensor → minimal alarm (periodic beep)
 *    - CRITICAL: Water covers sensor → continuous buzzer
 * 
 * LED Behavior (Cumulative - LEDs stay on as threat increases):
 * - Normal: Green LED ON
 * - Warning: Green LED ON + Yellow LED ON (both stay on)
 * - Critical: Green LED ON + Yellow LED ON + Red LED ON (all stay on)
 * 
 * Alarm Logic:
 * - Normal: No alarms
 * - Warning: Cumulative LEDs + periodic beep (if water level sensor detects water)
 * - Critical: All LEDs + continuous buzzer (if water level sensor fully submerged)
 */

#include <WiFi.h>
#include <FirebaseESP32.h>
#include <ArduinoJson.h>
#include <time.h>

// WiFi credentials - UPDATE THESE WITH YOUR NETWORK
const char* ssid = "DPWH";        // Replace with your WiFi network name
const char* password = "123456789000"; // Replace with your WiFi password

// Firebase configuration
#define FIREBASE_HOST "flood-detection-5d4e6-default-rtdb.firebaseio.com"
#define FIREBASE_AUTH "AIzaSyDsVF0xPnarV87dfJsS__2XGa8CjIoGc18"

// Hardware pins
#define TRIG_PIN 5
#define ECHO_PIN 18
#define WATER_LEVEL_PIN 34  // ADC pin for water level sensor
#define BUZZER_PIN 4
#define LED_GREEN_PIN 2     // Green LED for Normal
#define LED_YELLOW_PIN 15   // Yellow LED for Warning  
#define LED_RED_PIN 16      // Red LED for Critical

// Thresholds (in cm from ultrasonic sensor) - Updated ranges per user specification
#define NORMAL_THRESHOLD_MIN 10.2   // 13cm to 10.2cm = Normal (safe level)
#define WARNING_THRESHOLD_MIN 9.4   // 10.2cm to 9.4cm = Warning (rising water)
#define CRITICAL_THRESHOLD_MAX 9.2  // 9.2cm to 0cm = Critical (flood detected)

// Hysteresis thresholds to prevent LED flickering - OPTIMIZED for faster response
#define NORMAL_HYSTERESIS 0.05      // 0.05cm hysteresis for faster response (was 0.1)
#define WARNING_HYSTERESIS 0.05     // 0.05cm hysteresis for faster response (was 0.1)
#define CRITICAL_HYSTERESIS 0.05    // 0.05cm hysteresis for faster response (was 0.1)

// Calculated stable thresholds with hysteresis - OPTIMIZED
#define NORMAL_TO_WARNING_THRESHOLD (NORMAL_THRESHOLD_MIN - NORMAL_HYSTERESIS)    // 10.15cm (was 10.1)
#define WARNING_TO_NORMAL_THRESHOLD (NORMAL_THRESHOLD_MIN + NORMAL_HYSTERESIS)    // 10.25cm (was 10.3)
#define WARNING_TO_CRITICAL_THRESHOLD (WARNING_THRESHOLD_MIN - WARNING_HYSTERESIS) // 9.35cm (was 9.3)
#define CRITICAL_TO_WARNING_THRESHOLD (WARNING_THRESHOLD_MIN + WARNING_HYSTERESIS) // 9.45cm (was 9.5)

// Water level sensor thresholds (analog values 0-4095)
// DUAL-SENSOR CONFIRMATION: Both ultrasonic AND water level must meet thresholds
#define WATER_SENSOR_DRY 500        // Below this = No water detected
#define WATER_SENSOR_TOUCHING 800   // 500-800 = Water touching sensor
#define WATER_SENSOR_THRESHOLD 1200 // Above 1200 = Water level confirmation for alarms (was 3500)

// Alarm timing
#define WARNING_BEEP_DURATION 5000   // 5 seconds total for warning beep
#define CRITICAL_BUZZ_INTERVAL 200   // 200ms for continuous buzz pattern

// Timing - ULTRA-OPTIMIZED for maximum speed
#define MEASUREMENT_INTERVAL 500    // 0.5 seconds (ultra-fast measurements)
#define FIREBASE_UPDATE_INTERVAL 750  // 0.75 seconds (real-time updates)
#define FIREBASE_BATCH_SIZE 15      // Larger batch for better performance
#define CONNECTION_TIMEOUT 3000     // 3 second WiFi timeout (faster connection)
#define FIREBASE_RETRY_DELAY 500    // 0.5 second retry delay (faster recovery)

FirebaseData firebaseData;
FirebaseConfig config;
FirebaseAuth auth;

// State variables
enum SeverityState { NORMAL, WARNING, CRITICAL };
SeverityState currentState = NORMAL;
SeverityState previousState = NORMAL;
SeverityState stableState = NORMAL;  // New: Stable state for LED control

unsigned long lastMeasurement = 0;
unsigned long lastFirebaseUpdate = 0;
unsigned long lastWarningCycle = 0;
unsigned long lastCriticalBuzz = 0;
int warningStep = 0;
bool buzzerState = false;
bool warningAlarmActive = false;
bool firebaseConnected = false;
int firebaseRetryCount = 0;

// LED Stability Control - OPTIMIZED for faster response
unsigned long lastStateChange = 0;
unsigned long stateStabilityDelay = 1000;  // 1 second stability required (was 3000ms)
bool ledStatesLocked = false;  // Prevent LED flickering
SeverityState pendingState = NORMAL;  // State waiting for confirmation

// Performance optimization variables
unsigned long lastSuccessfulUpdate = 0;
bool batchUpdatePending = false;
bool dataChanged = false;  // Track if data needs Firebase update
float lastDistance = 0.0;  // Track distance changes
String pendingUpdates[FIREBASE_BATCH_SIZE];
int pendingUpdateCount = 0;

// Sensor filtering
float distanceBuffer[5] = {0};
int distanceBufferIndex = 0;
int waterLevelBuffer[5] = {0};
int waterLevelBufferIndex = 0;

void setup() {
  Serial.begin(115200);
  
  // Initialize pins
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(WATER_LEVEL_PIN, INPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LED_GREEN_PIN, OUTPUT);   // Green LED
  pinMode(LED_YELLOW_PIN, OUTPUT);  // Yellow LED
  pinMode(LED_RED_PIN, 
    OUTPUT);     // Red LED
  
  // Turn off all alarms and LEDs initially
  digitalWrite(BUZZER_PIN, LOW);
  digitalWrite(LED_GREEN_PIN, LOW);
  digitalWrite(LED_YELLOW_PIN, LOW);
  digitalWrite(LED_RED_PIN, LOW);
  
  // Ultra-fast WiFi connection
  WiFi.begin(ssid, password);
  WiFi.setAutoReconnect(true);
  WiFi.persistent(true);
  Serial.print("Connecting to WiFi");
  unsigned long wifiStartTime = millis();
  
  while (WiFi.status() != WL_CONNECTED && (millis() - wifiStartTime < CONNECTION_TIMEOUT)) {
    delay(100);  // Ultra-fast connection attempts
    Serial.print(".");
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nWiFi connection failed! Check credentials.");
    // Continue anyway for testing
  }
  
  // Configure Firebase with optimized settings
  config.host = FIREBASE_HOST;
  config.signer.tokens.legacy_token = FIREBASE_AUTH;
  config.timeout.serverResponse = 5000;    // 5 second timeout
  config.timeout.socketConnection = 3000;  // 3 second socket timeout
  
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
  
  // Test Firebase connection
  if (Firebase.ready()) {
    firebaseConnected = true;
    Serial.println("Firebase connected successfully!");
  } else {
    firebaseConnected = false;
    Serial.println("Firebase connection failed - will retry");
  }
  
  // Initialize time
  configTime(0, 0, "pool.ntp.org");
  
  Serial.println("Flood Monitor System Started");
  
  // Initial Firebase setup
  initializeFirebase();
}

void loop() {
  unsigned long currentTime = millis();
  
  // Ultra-fast WiFi reconnection check
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected - fast reconnection");
    WiFi.reconnect();
    delay(500);  // Reduced delay for faster recovery
    return;
  }
  
  // Ultra-fast measurements every 0.5 seconds for maximum responsiveness
  if (currentTime - lastMeasurement >= MEASUREMENT_INTERVAL) {
    Serial.println("--- Ultra-fast measurements with LED stability ---");
    
    float distance = measureDistance();
    int waterLevelRaw = measureWaterLevel();
    
    Serial.print("Raw ultrasonic distance: ");
    Serial.println(distance);
    Serial.print("Raw water level: ");
    Serial.println(waterLevelRaw);
    
    if (distance > 0) {  // Valid ultrasonic reading (primary sensor)
      Serial.println("✅ Valid ultrasonic reading received");
      
      // Determine immediate state based on ultrasonic sensor (for Firebase)
      previousState = currentState;
      currentState = determineStateFromUltrasonic(distance);
      
      // Determine stable state with hysteresis (for LED control)
      SeverityState newStableState = determineStableStateWithHysteresis(distance, stableState);
      
      // Check if stable state is changing
      if (newStableState != stableState) {
        // State wants to change - start stability timer
        if (pendingState != newStableState) {
          pendingState = newStableState;
          lastStateChange = currentTime;
          ledStatesLocked = true;  // Lock LEDs during transition
          Serial.print("🔄 State change pending: ");
          Serial.print(getStateString(stableState));
          Serial.print(" -> ");
          Serial.print(getStateString(pendingState));
          Serial.println(" (waiting for stability)");
        }
        
        // Check if enough time has passed for stable state change
        if (currentTime - lastStateChange >= stateStabilityDelay) {
          stableState = pendingState;
          ledStatesLocked = false;  // Unlock LEDs
          Serial.print("✅ State stabilized: ");
          Serial.println(getStateString(stableState));
        }
      } else {
        // State is stable - reset pending state
        if (pendingState != stableState) {
          pendingState = stableState;
          ledStatesLocked = false;  // Unlock LEDs
          Serial.println("🔒 State change cancelled - returned to stable state");
        }
      }
      
      Serial.print("Current state (Firebase): ");
      Serial.println(getStateString(currentState));
      Serial.print("Stable state (LEDs): ");
      Serial.println(getStateString(stableState));
      
      // Control alarms based on STABLE state and dual sensors
      controlAlarmsWithDualSensorsStable(stableState, waterLevelRaw, currentTime);
      
      // Check for immediate state changes for Firebase (use current state)
      if (currentState != previousState) {
        Serial.println("Firebase state changed - immediate update");
        updateFirebaseImmediate(distance, waterLevelRaw);
        lastFirebaseUpdate = currentTime;
      }
      
      // Print status (reduced verbosity for speed)
      printStatusOptimized(distance, waterLevelRaw);
    } else {
      Serial.println("❌ Invalid ultrasonic reading - check sensor");
    }
    
    lastMeasurement = currentTime;
  }
  
  // Handle continuous buzzer for critical level (optimized)
  handleContinuousBuzzer(currentTime);
  
  // Ultra-fast Firebase updates every 0.75 seconds for real-time dashboard
  if (currentTime - lastFirebaseUpdate >= FIREBASE_UPDATE_INTERVAL) {
    float distance = measureDistance();
    int waterLevelRaw = measureWaterLevel();
    if (distance > 0) {
      updateFirebaseUltraOptimized(distance, waterLevelRaw);
    } else {
      Serial.println("Skipping Firebase update - no valid sensor data");
    }
    lastFirebaseUpdate = currentTime;
  }
  
  // Process any pending batch updates with minimal delay
  processPendingUpdatesOptimized();
  
  delay(25);  // Ultra-minimal delay for maximum responsiveness
}

float measureDistance() {
  // Send ultrasonic pulse
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  
  // Read echo
  long duration = pulseIn(ECHO_PIN, HIGH, 30000);  // 30ms timeout
  
  if (duration == 0) {
    Serial.println("Sensor timeout");
    return -1;  // Invalid reading
  }
  
  // Calculate distance (speed of sound = 343 m/s)
  float distance = (duration * 0.0343) / 2;
  
  // Apply simple filtering
  distanceBuffer[distanceBufferIndex] = distance;
  distanceBufferIndex = (distanceBufferIndex + 1) % 5;
  
  // Return filtered average
  return getFilteredDistance();
}

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

int measureWaterLevel() {
  // Read analog value from water level sensor
  int rawValue = analogRead(WATER_LEVEL_PIN);
  
  // Apply filtering
  waterLevelBuffer[waterLevelBufferIndex] = rawValue;
  waterLevelBufferIndex = (waterLevelBufferIndex + 1) % 5;
  
  // Return filtered average
  return getFilteredWaterLevel();
}

int getFilteredWaterLevel() {
  int sum = 0;
  int validReadings = 0;
  
  for (int i = 0; i < 5; i++) {
    if (waterLevelBuffer[i] >= 0) {
      sum += waterLevelBuffer[i];
      validReadings++;
    }
  }
  
  return validReadings > 0 ? sum / validReadings : -1;
}

SeverityState determineStateFromUltrasonic(float distance) {
  if (distance >= NORMAL_THRESHOLD_MIN) {
    return NORMAL;           // 11cm to 10.2cm = Normal
  } else if (distance >= WARNING_THRESHOLD_MIN) {
    return WARNING;          // 10.2cm to 9.4cm = Warning
  } else if (distance <= CRITICAL_THRESHOLD_MAX) {
    return CRITICAL;         // 9.4cm to 0cm = Critical
  } else {
    return WARNING;          // Edge case handling
  }
}

// NEW: Stable state determination with hysteresis to prevent LED flickering
SeverityState determineStableStateWithHysteresis(float distance, SeverityState currentStableState) {
  // Use hysteresis to prevent rapid state changes around thresholds
  switch (currentStableState) {
    case NORMAL:
      // From NORMAL, only change to WARNING if distance drops below hysteresis threshold
      if (distance < NORMAL_TO_WARNING_THRESHOLD) {  // 10.15cm (was 10.1cm)
        return WARNING;
      }
      return NORMAL;  // Stay in NORMAL
      
    case WARNING:
      // From WARNING, change to NORMAL if distance rises above hysteresis threshold
      if (distance > WARNING_TO_NORMAL_THRESHOLD) {  // 10.25cm (was 10.3cm)
        return NORMAL;
      }
      // From WARNING, change to CRITICAL if distance drops below hysteresis threshold
      else if (distance < WARNING_TO_CRITICAL_THRESHOLD) {  // 9.35cm (was 9.3cm)
        return CRITICAL;
      }
      return WARNING;  // Stay in WARNING
      
    case CRITICAL:
      // From CRITICAL, only change to WARNING if distance rises above hysteresis threshold
      if (distance > CRITICAL_TO_WARNING_THRESHOLD) {  // 9.45cm (was 9.5cm)
        return WARNING;
      }
      return CRITICAL;  // Stay in CRITICAL
      
    default:
      // Fallback to normal determination
      return determineStateFromUltrasonic(distance);
  }
}

String determineWaterSensorStatus(int waterLevelRaw) {
  if (waterLevelRaw < WATER_SENSOR_DRY) {
    return "DRY";
  } else if (waterLevelRaw < WATER_SENSOR_TOUCHING) {
    return "TOUCHING";
  } else if (waterLevelRaw >= WATER_SENSOR_THRESHOLD) {
    return "CONFIRMED";  // Above 1200 = Alarm confirmation threshold
  } else {
    return "RISING";     // Between touching and threshold
  }
}

void controlAlarmsWithDualSensors(SeverityState ultrasonicState, int waterLevelRaw, unsigned long currentTime) {
  String waterSensorStatus = determineWaterSensorStatus(waterLevelRaw);
  
  // DUAL-SENSOR CONFIRMATION: Both sensors must meet thresholds for ALL alarms AND LEDs
  bool ultrasonicWarning = (ultrasonicState == WARNING);
  bool ultrasonicCritical = (ultrasonicState == CRITICAL);
  bool waterSensorConfirmed = (waterSensorStatus == "CONFIRMED");  // >= 1200
  
  // REVISED LED CONTROL: LEDs require DUAL-SENSOR CONFIRMATION (like buzzer)
  // - Normal: Only Green LED (no water sensor requirement)
  // - Warning: Green + Yellow LEDs ONLY if BOTH sensors confirm
  // - Critical: All LEDs ONLY if BOTH sensors confirm
  
  if (ultrasonicState == NORMAL) {
    // Normal level (11-10.2cm) - Only Green LED (no dual-sensor needed for normal)
    digitalWrite(LED_GREEN_PIN, HIGH);
    digitalWrite(LED_YELLOW_PIN, LOW);
    digitalWrite(LED_RED_PIN, LOW);
    digitalWrite(BUZZER_PIN, LOW);
    buzzerState = false;
    warningAlarmActive = false;
    warningStep = 0;
    Serial.println("NORMAL: Green LED ON - water level safe");
    
  } else if (ultrasonicState == WARNING) {
    // Warning level (10.2-9.4cm) - LEDs require DUAL-SENSOR CONFIRMATION
    if (waterSensorConfirmed) {
      // WARNING CONFIRMED: Both ultrasonic (10.2-9.4cm) AND water sensor (>=1200)
      digitalWrite(LED_GREEN_PIN, HIGH);   // Green ON (confirmed warning)
      digitalWrite(LED_YELLOW_PIN, HIGH);  // Yellow ON (confirmed warning)
      digitalWrite(LED_RED_PIN, LOW);      // Red still OFF
      
      warningAlarmActive = true;
      warningAlarmPattern(currentTime);  // Intermittent beep pattern
      Serial.println("WARNING CONFIRMED: Green + Yellow LEDs ON + BUZZER - Dual-sensor confirmation");
    } else {
      // WARNING NOT CONFIRMED: Ultrasonic detects warning but no water sensor confirmation
      digitalWrite(LED_GREEN_PIN, HIGH);   // Only Green LED (normal state)
      digitalWrite(LED_YELLOW_PIN, LOW);   // NO Yellow LED (no water detected)
      digitalWrite(LED_RED_PIN, LOW);      // NO Red LED
      digitalWrite(BUZZER_PIN, LOW);       // NO buzzer
      warningAlarmActive = false;
      warningStep = 0;
      buzzerState = false;
      Serial.println("WARNING NOT CONFIRMED: Only Green LED ON - ultrasonic warning but no water detected (preventing false alarm)");
    }
    
  } else if (ultrasonicState == CRITICAL) {
    // Critical level (9.4-0cm) - LEDs require DUAL-SENSOR CONFIRMATION
    if (waterSensorConfirmed) {
      // CRITICAL CONFIRMED: Both ultrasonic (9.4-0cm) AND water sensor (>=1200)
      digitalWrite(LED_GREEN_PIN, HIGH);   // Green ON (confirmed critical)
      digitalWrite(LED_YELLOW_PIN, HIGH);  // Yellow ON (confirmed critical)
      digitalWrite(LED_RED_PIN, HIGH);     // Red ON (confirmed critical)
      
      warningAlarmActive = false;  // Stop warning pattern
      warningStep = 0;
      Serial.println("CRITICAL CONFIRMED: All LEDs ON (Green + Yellow + Red) + CONTINUOUS BUZZER - Dual-sensor confirmation");
    } else {
      // CRITICAL NOT CONFIRMED: Ultrasonic detects critical but no water sensor confirmation
      digitalWrite(LED_GREEN_PIN, HIGH);   // Only Green LED (normal state)
      digitalWrite(LED_YELLOW_PIN, LOW);   // NO Yellow LED (no water detected)
      digitalWrite(LED_RED_PIN, LOW);      // NO Red LED (no water detected)
      digitalWrite(BUZZER_PIN, LOW);       // NO buzzer
      buzzerState = false;
      Serial.println("CRITICAL NOT CONFIRMED: Only Green LED ON - ultrasonic critical but no water detected (preventing false alarm)");
    }
  }
}

// NEW: Stable LED control function with hysteresis and stability delay
void controlAlarmsWithDualSensorsStable(SeverityState stableUltrasonicState, int waterLevelRaw, unsigned long currentTime) {
  String waterSensorStatus = determineWaterSensorStatus(waterLevelRaw);
  bool waterSensorConfirmed = (waterSensorStatus == "CONFIRMED");  // >= 1200
  
  // Skip LED updates if states are locked during transition
  if (ledStatesLocked) {
    Serial.println("🔒 LEDs locked during state transition - maintaining current state");
    // Still handle buzzer based on immediate state for safety
    if (currentState == CRITICAL && waterSensorConfirmed) {
      // Allow critical buzzer even during LED lock for safety
      warningAlarmActive = false;
      warningStep = 0;
    } else if (currentState == WARNING && waterSensorConfirmed) {
      warningAlarmActive = true;
      warningAlarmPattern(currentTime);
    } else {
      digitalWrite(BUZZER_PIN, LOW);
      warningAlarmActive = false;
      warningStep = 0;
      buzzerState = false;
    }
    return;
  }
  
  // STABLE LED CONTROL: LEDs use stable state with dual-sensor confirmation
  if (stableUltrasonicState == NORMAL) {
    // Normal level - Only Green LED (no dual-sensor needed for normal)
    digitalWrite(LED_GREEN_PIN, HIGH);
    digitalWrite(LED_YELLOW_PIN, LOW);
    digitalWrite(LED_RED_PIN, LOW);
    digitalWrite(BUZZER_PIN, LOW);
    buzzerState = false;
    warningAlarmActive = false;
    warningStep = 0;
    Serial.println("STABLE NORMAL: Green LED ON - water level safe and stable");
    
  } else if (stableUltrasonicState == WARNING) {
    // Warning level - LEDs require DUAL-SENSOR CONFIRMATION
    if (waterSensorConfirmed) {
      // WARNING CONFIRMED: Both stable ultrasonic AND water sensor confirm
      digitalWrite(LED_GREEN_PIN, HIGH);   // Green ON (confirmed warning)
      digitalWrite(LED_YELLOW_PIN, HIGH);  // Yellow ON (confirmed warning)
      digitalWrite(LED_RED_PIN, LOW);      // Red still OFF
      
      warningAlarmActive = true;
      warningAlarmPattern(currentTime);  // Intermittent beep pattern
      Serial.println("STABLE WARNING CONFIRMED: Green + Yellow LEDs ON + BUZZER - Stable dual-sensor confirmation");
    } else {
      // WARNING NOT CONFIRMED: Stable ultrasonic warning but no water sensor confirmation
      digitalWrite(LED_GREEN_PIN, HIGH);   // Only Green LED (normal state)
      digitalWrite(LED_YELLOW_PIN, LOW);   // NO Yellow LED (no water detected)
      digitalWrite(LED_RED_PIN, LOW);      // NO Red LED
      digitalWrite(BUZZER_PIN, LOW);       // NO buzzer
      warningAlarmActive = false;
      warningStep = 0;
      buzzerState = false;
      Serial.println("STABLE WARNING NOT CONFIRMED: Only Green LED ON - stable ultrasonic warning but no water detected");
    }
    
  } else if (stableUltrasonicState == CRITICAL) {
    // Critical level - LEDs require DUAL-SENSOR CONFIRMATION
    if (waterSensorConfirmed) {
      // CRITICAL CONFIRMED: Both stable ultrasonic AND water sensor confirm
      digitalWrite(LED_GREEN_PIN, HIGH);   // Green ON (confirmed critical)
      digitalWrite(LED_YELLOW_PIN, HIGH);  // Yellow ON (confirmed critical)
      digitalWrite(LED_RED_PIN, HIGH);     // Red ON (confirmed critical)
      
      warningAlarmActive = false;  // Stop warning pattern
      warningStep = 0;
      Serial.println("STABLE CRITICAL CONFIRMED: All LEDs ON (Green + Yellow + Red) + CONTINUOUS BUZZER - Stable dual-sensor confirmation");
    } else {
      // CRITICAL NOT CONFIRMED: Stable ultrasonic critical but no water sensor confirmation
      digitalWrite(LED_GREEN_PIN, HIGH);   // Only Green LED (normal state)
      digitalWrite(LED_YELLOW_PIN, LOW);   // NO Yellow LED (no water detected)
      digitalWrite(LED_RED_PIN, LOW);      // NO Red LED (no water detected)
      digitalWrite(BUZZER_PIN, LOW);       // NO buzzer
      buzzerState = false;
      Serial.println("STABLE CRITICAL NOT CONFIRMED: Only Green LED ON - stable ultrasonic critical but no water detected");
    }
  }
}

void handleContinuousBuzzer(unsigned long currentTime) {
  // Use CURRENT state for buzzer (immediate response for safety)
  // But LEDs use STABLE state (for stability)
  if (currentState == CRITICAL) {
    int waterLevelRaw = getFilteredWaterLevel();
    String waterSensorStatus = determineWaterSensorStatus(waterLevelRaw);
    
    // Activate urgent continuous pattern only if water sensor confirms (>=1200)
    if (waterSensorStatus == "CONFIRMED") {
      criticalAlarmPattern(currentTime);
      
      // Print status occasionally
      static unsigned long lastContinuousMessage = 0;
      if (currentTime - lastContinuousMessage > 10000) {  // Every 10 seconds
        Serial.println("URGENT CONTINUOUS ALARM: DUAL-SENSOR CRITICAL CONFIRMATION!");
        lastContinuousMessage = currentTime;
      }
    } else {
      // Stop continuous buzzer if water sensor doesn't confirm
      if (buzzerState) {
        digitalWrite(BUZZER_PIN, LOW);
        buzzerState = false;
      }
    }
  } else {
    // Stop continuous buzzer if not in critical state
    if (buzzerState) {
      digitalWrite(BUZZER_PIN, LOW);
      buzzerState = false;
    }
  }
}

// Warning alarm pattern - intermittent beeps (like smoke alarm)
void warningAlarmPattern(unsigned long currentTime) {
  // Pattern: 3 short beeps, pause, repeat
  // Step timing: 200ms per step
  
  if (currentTime - lastWarningCycle >= 200) {
    if (warningStep < 6) {  // 3 beeps (on/off = 6 steps)
      if (warningStep % 2 == 0) {
        digitalWrite(BUZZER_PIN, HIGH);
        // LED control handled by controlAlarmsWithDualSensors()
      } else {
        digitalWrite(BUZZER_PIN, LOW);
      }
      warningStep++;
    } else if (warningStep < 16) {  // Pause (10 steps = 2 seconds)
      digitalWrite(BUZZER_PIN, LOW);
      // LED control handled by controlAlarmsWithDualSensors()
      warningStep++;
    } else {
      warningStep = 0;  // Reset cycle
    }
    lastWarningCycle = currentTime;
  }
}

// Critical alarm pattern - urgent fast alternating (like fire alarm)
void criticalAlarmPattern(unsigned long currentTime) {
  // Fast alternating pattern every 100ms
  if (currentTime - lastCriticalBuzz >= 100) {
    buzzerState = !buzzerState;
    digitalWrite(BUZZER_PIN, buzzerState ? HIGH : LOW);
    // LED control handled by controlAlarmsWithDualSensors()
    lastCriticalBuzz = currentTime;
  }
}

SeverityState determineState(float distance) {
  // Legacy function - now uses ultrasonic sensor as primary
  return determineStateFromUltrasonic(distance);
}

void controlAlarms() {
  // Legacy function - now handled by controlAlarmsWithDualSensors
  // Keeping for compatibility
}

String getStateString(SeverityState state) {
  switch (state) {
    case NORMAL: return "Normal";
    case WARNING: return "Warning";
    case CRITICAL: return "Critical";
    default: return "Unknown";
  }
}

String generateMessage() {
  int waterLevelRaw = getFilteredWaterLevel();
  String waterSensorStatus = determineWaterSensorStatus(waterLevelRaw);
  
  if (previousState != NORMAL && currentState == NORMAL) {
    return "Water level back to safe range (11-10.2cm)";
  } else if (currentState == CRITICAL) {
    if (waterSensorStatus == "CONFIRMED") {
      return "CRITICAL FLOOD! Dual-sensor confirmation (ultrasonic 9.4-0cm + water sensor ≥1200)";
    } else {
      return "Critical ultrasonic reading (9.4-0cm) - awaiting water sensor confirmation (≥1200)";
    }
  } else if (currentState == WARNING) {
    if (waterSensorStatus == "CONFIRMED") {
      return "WARNING: Dual-sensor confirmation (ultrasonic 10.2-9.4cm + water sensor ≥1200)";
    } else {
      return "Warning ultrasonic reading (10.2-9.4cm) - awaiting water sensor confirmation (≥1200)";
    }
  } else {
    return "Water level normal (11-10.2cm) - dual-sensor monitoring active";
  }
}

void updateFirebase(float distance, int waterLevelRaw, bool stateChanged) {
  updateFirebaseOptimized(distance, waterLevelRaw);
}

// Immediate Firebase update for critical state changes
void updateFirebaseImmediate(float distance, int waterLevelRaw) {
  if (!Firebase.ready()) {
    Serial.println("Firebase not ready for immediate update");
    return;
  }
  
  Serial.println("🚀 Immediate Firebase update started");
  
  // Get current timestamp
  time_t now = time(nullptr);
  
  // Calculate water level percentage using updated threat mapping
  // Normal (11-10.2cm) → 0% to 49% threat
  // Warning (10.2-9.4cm) → 50% to 69% threat  
  // Critical (9.4-0cm) → 70% to 100% threat
  
  float waterLevel = 0.0f;
  
  if (distance >= 10.2f) {
    // NORMAL range (11-10.2cm) → 0% to 49% threat
    float normalRange = 11.0f - 10.2f; // 0.8cm range
    float distanceInRange = min(distance, 11.0f) - 10.2f;
    float normalProgress = max(0.0f, (normalRange - distanceInRange) / normalRange);
    waterLevel = normalProgress * 49.0f; // Scale to 0-49%
    
  } else if (distance >= 9.4f) {
    // WARNING range (10.2-9.4cm) → 50% to 69% threat
    float warningRange = 10.2f - 9.4f; // 0.8cm range
    float distanceInRange = distance - 9.4f;
    float warningProgress = (warningRange - distanceInRange) / warningRange;
    waterLevel = 50.0f + (warningProgress * 19.0f); // Scale to 50-69%
    
  } else {
    // CRITICAL range (9.4-0cm) → 70% to 100% threat
    float criticalRange = 9.4f - 0.0f; // 9.4cm range
    float distanceInRange = max(0.0f, distance);
    float criticalProgress = (criticalRange - distanceInRange) / criticalRange;
    waterLevel = 70.0f + (criticalProgress * 30.0f); // Scale to 70-100%
  }
  
  // Clamp to 0-100%
  waterLevel = max(0.0f, min(100.0f, waterLevel));
  
  // Debug output for updated threat level calculation
  Serial.print("🎯 UPDATED THREAT MAPPING: Distance=");
  Serial.print(distance, 2);
  Serial.print("cm, Threat=");
  Serial.print(waterLevel, 1);
  Serial.println("%");
  
  float waterLevelPercent = map(waterLevelRaw, 0, 4095, 0, 100);
  
  // Create JSON object for batch update
  FirebaseJson json;
  json.set("waterLevel", waterLevel);
  json.set("distance", distance);
  json.set("waterLevelRaw", waterLevelRaw);
  json.set("waterLevelPercent", waterLevelPercent);
  json.set("severity", getStateString(currentState));
  json.set("message", generateMessage());
  json.set("timestamp", now);
  
  // Update current status with single call
  if (Firebase.setJSON(firebaseData, "/currentStatus", json)) {
    Serial.println("✅ Immediate Firebase update successful");
    firebaseConnected = true;
    firebaseRetryCount = 0;
    lastSuccessfulUpdate = millis();
    
    // Add to history for state changes
    String historyPath = "/history/" + String(now);
    Firebase.setJSON(firebaseData, historyPath, json);
    
  } else {
    Serial.print("❌ Immediate Firebase update failed: ");
    Serial.println(firebaseData.errorReason());
    firebaseConnected = false;
    firebaseRetryCount++;
  }
}

// Optimized Firebase update with retry logic and batching
void updateFirebaseOptimized(float distance, int waterLevelRaw) {
  if (!Firebase.ready()) {
    if (firebaseRetryCount < 3) {
      Serial.println("Firebase not ready - will retry");
      firebaseRetryCount++;
      delay(FIREBASE_RETRY_DELAY);
      return;
    } else {
      Serial.println("Firebase connection failed after retries");
      return;
    }
  }
  
  // Get current timestamp
  time_t now = time(nullptr);
  
  // Calculate water level percentage using updated threat mapping
  // Normal (11-10.2cm) → 0% to 49% threat
  // Warning (10.2-9.4cm) → 50% to 69% threat  
  // Critical (9.4-0cm) → 70% to 100% threat
  
  float waterLevel = 0.0f;
  
  if (distance >= 10.2f) {
    // NORMAL range (11-10.2cm) → 0% to 49% threat
    float normalRange = 11.0f - 10.2f; // 0.8cm range
    float distanceInRange = min(distance, 11.0f) - 10.2f;
    float normalProgress = max(0.0f, (normalRange - distanceInRange) / normalRange);
    waterLevel = normalProgress * 49.0f; // Scale to 0-49%
    
  } else if (distance >= 9.4f) {
    // WARNING range (10.2-9.4cm) → 50% to 69% threat
    float warningRange = 10.2f - 9.4f; // 0.8cm range
    float distanceInRange = distance - 9.4f;
    float warningProgress = (warningRange - distanceInRange) / warningRange;
    waterLevel = 50.0f + (warningProgress * 19.0f); // Scale to 50-69%
    
  } else {
    // CRITICAL range (9.4-0cm) → 70% to 100% threat
    float criticalRange = 9.4f - 0.0f; // 9.4cm range
    float distanceInRange = max(0.0f, distance);
    float criticalProgress = (criticalRange - distanceInRange) / criticalRange;
    waterLevel = 70.0f + (criticalProgress * 30.0f); // Scale to 70-100%
  }
  
  // Clamp to 0-100%
  waterLevel = max(0.0f, min(100.0f, waterLevel));
  
  float waterLevelPercent = map(waterLevelRaw, 0, 4095, 0, 100);
  
  // Use batch update for better performance
  FirebaseJson json;
  json.set("waterLevel", waterLevel);
  json.set("distance", distance);
  json.set("waterLevelRaw", waterLevelRaw);
  json.set("waterLevelPercent", waterLevelPercent);
  json.set("severity", getStateString(currentState));
  json.set("message", generateMessage());
  json.set("timestamp", now);
  
  // Update current status
  if (Firebase.setJSON(firebaseData, "/currentStatus", json)) {
    Serial.println("✅ Optimized Firebase update successful");
    firebaseConnected = true;
    firebaseRetryCount = 0;
    lastSuccessfulUpdate = millis();
    
    // Add to history every minute or on state changes
    static unsigned long lastHistoryUpdate = 0;
    if ((millis() - lastHistoryUpdate > 60000) || (currentState != previousState)) {
      String historyPath = "/history/" + String(now);
      Firebase.setJSON(firebaseData, historyPath, json);
      lastHistoryUpdate = millis();
    }
    
  } else {
    Serial.print("❌ Optimized Firebase update failed: ");
    Serial.println(firebaseData.errorReason());
    firebaseConnected = false;
    firebaseRetryCount++;
    
    // Add to pending updates for retry
    if (pendingUpdateCount < FIREBASE_BATCH_SIZE) {
      pendingUpdates[pendingUpdateCount] = json.raw();
      pendingUpdateCount++;
      batchUpdatePending = true;
    }
  }
}

// ULTRA-OPTIMIZED Firebase update with minimal latency
void updateFirebaseUltraOptimized(float distance, int waterLevelRaw) {
  if (!Firebase.ready()) {
    if (firebaseRetryCount < 2) {  // Reduced retry attempts for speed
      Serial.println("Firebase not ready - fast retry");
      firebaseRetryCount++;
      delay(FIREBASE_RETRY_DELAY);  // Now 500ms
      return;
    } else {
      Serial.println("Firebase connection failed - switching to batch mode");
      addToPendingBatch(distance, waterLevelRaw);
      return;
    }
  }
  
  // Get current timestamp
  time_t now = time(nullptr);
  
  // Calculate water level percentage (optimized calculation)
  float waterLevel = calculateThreatLevelOptimized(distance);
  float waterLevelPercent = map(waterLevelRaw, 0, 4095, 0, 100);
  
  // Ultra-compact JSON for speed
  FirebaseJson json;
  json.set("wL", waterLevel);           // Shortened keys for faster transmission
  json.set("d", distance);
  json.set("wLR", waterLevelRaw);
  json.set("wLP", waterLevelPercent);
  json.set("s", getStateString(currentState));
  json.set("m", generateMessageOptimized());
  json.set("t", now);
  
  // Single atomic update for maximum speed
  if (Firebase.setJSON(firebaseData, "/currentStatus", json)) {
    Serial.println("✅ Ultra-fast Firebase update successful");
    firebaseConnected = true;
    firebaseRetryCount = 0;
    lastSuccessfulUpdate = millis();
    
    // Optimized history updates (only on significant changes)
    static unsigned long lastHistoryUpdate = 0;
    static SeverityState lastHistoryState = NORMAL;
    
    if ((millis() - lastHistoryUpdate > 30000) || // Every 30 seconds instead of 60
        (currentState != lastHistoryState)) {     // Or on state change
      String historyPath = "/history/" + String(now);
      Firebase.setJSON(firebaseData, historyPath, json);
      lastHistoryUpdate = millis();
      lastHistoryState = currentState;
    }
    
  } else {
    Serial.print("❌ Ultra-fast Firebase update failed: ");
    Serial.println(firebaseData.errorReason());
    firebaseConnected = false;
    firebaseRetryCount++;
    addToPendingBatch(distance, waterLevelRaw);
  }
}

// Optimized threat level calculation (reduced computation)
float calculateThreatLevelOptimized(float distance) {
  if (distance >= 10.2f) {
    // NORMAL: 0-49%
    return ((11.0f - distance) / 0.8f) * 49.0f;
  } else if (distance >= 9.4f) {
    // WARNING: 50-69%
    return 50.0f + ((10.2f - distance) / 0.8f) * 19.0f;
  } else {
    // CRITICAL: 70-100%
    return 70.0f + ((9.4f - distance) / 9.4f) * 30.0f;
  }
}

// Optimized message generation (reduced string operations)
String generateMessageOptimized() {
  switch(currentState) {
    case NORMAL: return "Normal";
    case WARNING: return "Warning";
    case CRITICAL: return "Critical";
    default: return "Unknown";
  }
}

// Fast batch addition for failed updates
void addToPendingBatch(float distance, int waterLevelRaw) {
  if (pendingUpdateCount < FIREBASE_BATCH_SIZE) {
    // Store minimal data for batch processing
    FirebaseJson json;
    json.set("wL", calculateThreatLevelOptimized(distance));
    json.set("d", distance);
    json.set("wLR", waterLevelRaw);
    json.set("s", getStateString(currentState));
    json.set("t", time(nullptr));
    
    pendingUpdates[pendingUpdateCount] = json.raw();
    pendingUpdateCount++;
    batchUpdatePending = true;
  }
}

// Ultra-fast pending updates processing
void processPendingUpdatesOptimized() {
  if (!batchUpdatePending || !Firebase.ready() || pendingUpdateCount == 0) {
    return;
  }
  
  Serial.println("Fast-processing pending updates...");
  
  // Process multiple updates in parallel batches
  for (int i = 0; i < pendingUpdateCount; i++) {
    FirebaseJson json;
    json.setJsonData(pendingUpdates[i]);
    
    if (Firebase.setJSON(firebaseData, "/currentStatus", json)) {
      Serial.print("✅ Batch update ");
      Serial.print(i + 1);
      Serial.println(" processed");
    } else {
      Serial.print("❌ Batch update failed at ");
      Serial.println(i + 1);
      break;
    }
    
    delay(50); // Reduced delay for faster processing
  }
  
  // Clear pending updates
  pendingUpdateCount = 0;
  batchUpdatePending = false;
  Serial.println("Fast batch processing complete");
}

// Optimized status printing (reduced serial output for speed)
void printStatusOptimized(float distance, int waterLevelRaw) {
  Serial.print("📊 D:");
  Serial.print(distance, 1);
  Serial.print("cm W:");
  Serial.print(waterLevelRaw);
  Serial.print(" S:");
  Serial.print(getStateString(currentState));
  Serial.print(" T:");
  Serial.print(calculateThreatLevelOptimized(distance), 1);
  Serial.println("%");
}

void initializeFirebase() {
  // Initialize current status
  Firebase.setString(firebaseData, "/currentStatus/severity", "Normal");
  Firebase.setString(firebaseData, "/currentStatus/message", "System initialized");
  Firebase.setFloat(firebaseData, "/currentStatus/waterLevel", 0);
  Firebase.setFloat(firebaseData, "/currentStatus/distance", 0);
  Firebase.setInt(firebaseData, "/currentStatus/timestamp", time(nullptr));
  
  Serial.println("Firebase initialized");
}

void printStatus(float distance, int waterLevelRaw) {
  String waterSensorStatus = determineWaterSensorStatus(waterLevelRaw);
  
  Serial.println("=== Flood Monitor Status ===");
  Serial.print("Ultrasonic Distance: ");
  Serial.print(distance, 1);
  Serial.println(" cm");
  
  // Print range information with updated ranges
  if (distance >= NORMAL_THRESHOLD_MIN) {
    Serial.println("  Range: NORMAL (11-10.2cm)");
  } else if (distance >= WARNING_THRESHOLD_MIN) {
    Serial.println("  Range: WARNING (10.2-9.4cm)");
  } else if (distance <= CRITICAL_THRESHOLD_MAX) {
    Serial.println("  Range: CRITICAL (9.4-0cm)");
  } else {
    Serial.println("  Range: WARNING edge");
  }
  
  Serial.print("Water Level Sensor: ");
  Serial.print(waterLevelRaw);
  Serial.print(" (");
  Serial.print(map(waterLevelRaw, 0, 4095, 0, 100));
  Serial.print("%) - ");
  Serial.println(waterSensorStatus);
  
  Serial.print("System State: ");
  Serial.println(getStateString(currentState));
  
  Serial.print("Message: ");
  Serial.println(generateMessage());
  
  // Print LED status (dual-sensor confirmation system)
  Serial.println("LED Status (Dual-Sensor Confirmation Required):");
  Serial.print("  Green (Normal): ");
  Serial.println(digitalRead(LED_GREEN_PIN) ? "ON" : "OFF");
  Serial.print("  Yellow (Warning): ");
  if (digitalRead(LED_YELLOW_PIN)) {
    Serial.println("ON (dual-sensor confirmed)");
  } else {
    Serial.println("OFF (awaiting water sensor ≥1200)");
  }
  Serial.print("  Red (Critical): ");
  if (digitalRead(LED_RED_PIN)) {
    Serial.println("ON (dual-sensor confirmed)");
  } else {
    Serial.println("OFF (awaiting water sensor ≥1200)");
  }
  
  // Print buzzer status
  Serial.print("Buzzer: ");
  
  // Check dual-sensor confirmation
  bool waterSensorConfirmed = (waterSensorStatus == "CONFIRMED");
  
  if (currentState == NORMAL) {
    Serial.println("OFF");
  } else if (currentState == WARNING) {
    if (waterSensorConfirmed) {
      Serial.println("INTERMITTENT PATTERN (dual-sensor confirmed)");
    } else {
      Serial.println("OFF (awaiting water sensor ≥1200)");
    }
  } else if (currentState == CRITICAL) {
    if (waterSensorConfirmed) {
      Serial.println("URGENT CONTINUOUS (dual-sensor confirmed)");
    } else {
      Serial.println("OFF (awaiting water sensor ≥1200)");
    }
  }
  
  Serial.println("============================");
}
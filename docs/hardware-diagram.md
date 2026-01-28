# Hardware Wiring Diagram

## Components Required

- ESP32 Development Board
- HC-SR04 Ultrasonic Sensor
- Water Level Sensor (Analog/Digital)
- Active Buzzer (5V)
- Green LED (Normal indicator)
- Yellow LED (Warning indicator)
- Red LED (Critical indicator)
- 3x 220Ω Resistors (for LEDs)
- Breadboard
- Jumper Wires
- 5V Power Supply

## Pin Connections

### ESP32 to HC-SR04 Ultrasonic Sensor
```
ESP32 Pin    →    HC-SR04 Pin
GPIO 5       →    Trig
GPIO 18      →    Echo
5V           →    VCC
GND          →    GND
```

### ESP32 to Water Level Sensor
```
ESP32 Pin    →    Water Level Sensor
GPIO 34      →    Analog Output (A0)
5V           →    VCC
GND          →    GND
```

### ESP32 to Buzzer
```
ESP32 Pin    →    Buzzer
GPIO 4       →    Positive (+)
GND          →    Negative (-)
```

### ESP32 to Three-LED System
```
ESP32 Pin    →    LED Color    →    Function
GPIO 2       →    Green LED    →    Normal Level (11-10.5cm)
GPIO 15      →    Yellow LED   →    Warning Level (10.2-9.7cm)
GPIO 16      →    Red LED      →    Critical Level (9.6-0cm)

Each LED connects through 220Ω resistor to GND
```

## Circuit Diagram (ASCII)

```
                    ESP32
                 ┌─────────────┐
                 │             │
    HC-SR04      │  GPIO 5     │ ──── Trig
   ┌─────────┐   │  GPIO 18    │ ──── Echo
   │ Trig    │───│             │
   │ Echo    │───│  GPIO 34    │ ──── Water Level Sensor (A0)
   │ VCC     │───│  5V         │ ──── Sensors VCC
   │ GND     │───│  GND        │ ──── Common Ground
   └─────────┘   │             │
                 │  GPIO 4     │ ──── Buzzer (+)
  Water Level    │             │
   Sensor        │  GPIO 2     │ ──── Green LED (Normal)
   ┌─────────┐   │  GPIO 15    │ ──── Yellow LED (Warning)
   │ A0      │───│  GPIO 16    │ ──── Red LED (Critical)
   │ VCC     │───│             │
   │ GND     │───│             │
   └─────────┘   └─────────────┘
                                          
                 Three-LED Status System:
                 
                 Green LED (GPIO 2)    Yellow LED (GPIO 15)   Red LED (GPIO 16)
                      │                       │                      │
                   ┌──┴──┐                ┌──┴──┐               ┌──┴──┐
                   │220Ω │                │220Ω │               │220Ω │
                   └──┬──┘                └──┬──┘               └──┬──┘
                      │                       │                      │
                     GND                     GND                    GND
```

## LED Status Indication

### Three-LED System Behavior (CUMULATIVE)
- **Normal (11-10.2cm)**: Green LED ON, Yellow OFF, Red OFF
- **Warning (10.2-9.4cm)**: Green LED ON, Yellow LED ON, Red OFF
- **Critical (9.4-0cm)**: Green LED ON, Yellow LED ON, Red LED ON

### Cumulative LED Behavior
- LEDs accumulate as threat level increases
- Green LED stays ON during Warning and Critical states
- Yellow LED stays ON during Critical state
- LEDs only turn OFF when water level decreases below their thresholds
- Provides clear visual indication of maximum threat level reached
- LEDs work independently of buzzer (which requires dual-sensor confirmation)

## Physical Layout Recommendations

### Sensor Placement
- Mount HC-SR04 sensor facing downward toward water surface
- Position water level sensor at warning level (~9.7cm from ultrasonic sensor)
- Ensure both sensors are waterproof or protected from splashing
- Position ultrasonic sensor at known height above maximum expected water level
- Avoid obstacles in ultrasonic sensor's detection cone (15° beam angle)

### LED Placement
- Mount LEDs in visible location for status monitoring
- Green LED: Top position (Normal status - stays on in all states above normal)
- Yellow LED: Middle position (Warning status - stays on in critical state)
- Red LED: Bottom position (Critical status - only on in critical state)
- Consider using LED panel or status light tower for professional appearance
- Arrange LEDs to show cumulative behavior clearly (all three visible simultaneously)

### Power Considerations
- ESP32 can be powered via USB (5V) or external power supply
- Buzzer requires 5V for optimal volume
- LEDs operate at 3.3V through current-limiting resistors
- Water level sensor typically operates at 3.3V-5V
- Total current consumption: ~200mA (ESP32) + 30mA (buzzer) + 60mA (3 LEDs) + 10mA (water sensor)

### Enclosure Requirements
- Waterproof enclosure for ESP32 and electronics
- Sensor opening for ultrasonic transducer
- Ventilation holes for buzzer sound output
- Three LED visibility windows (Green, Yellow, Red)
- Cable glands for power and sensor connections

## Assembly Steps

1. **Breadboard Setup**
   - Place ESP32 on breadboard
   - Connect power rails (5V and GND)

2. **Sensor Connections**
   - Wire HC-SR04 according to pin diagram
   - Connect water level sensor to GPIO 34 (ADC pin)
   - Ensure stable connections for all sensor pins

3. **Three-LED System**
   - Connect Green LED with 220Ω resistor to GPIO 2
   - Connect Yellow LED with 220Ω resistor to GPIO 15
   - Connect Red LED with 220Ω resistor to GPIO 16
   - Verify LED polarity (long leg = anode, short leg = cathode)

4. **Output Devices**
   - Connect buzzer to GPIO 4 and GND
   - Test each LED individually

5. **Power Supply**
   - Connect 5V power supply to ESP32 VIN and GND
   - Verify all connections before powering on

6. **Testing**
   - Upload `tests/three_led_test.ino` to test LED system
   - Upload `tests/progress_level_test.ino` to validate threat levels
   - Upload `firmware/flood_monitor.ino` for full system operation

## Troubleshooting

### Common Issues
- **No sensor readings**: Check Trig/Echo pin connections and power
- **Buzzer not working**: Verify 5V supply and GPIO 4 connection
- **LEDs not lighting**: Check resistor values and GPIO connections
- **Wrong LED lighting**: Verify GPIO pin assignments (2, 15, 16)
- **Erratic readings**: Ensure stable power supply and proper grounding

### LED System Troubleshooting
- **Multiple LEDs on**: This is normal behavior - LEDs accumulate as threat increases
- **Green LED not staying on in Warning/Critical**: Check cumulative LED logic in firmware
- **LEDs too dim**: Verify 220Ω resistor values
- **LEDs too bright**: Increase resistor value to 330Ω or 470Ω
- **LED not changing**: Check state transition logic in firmware
- **Wrong cumulative behavior**: Verify GPIO pin assignments (2, 15, 16) and firmware logic

### Calibration Notes
- Measure actual distance from sensor to reference point
- Account for sensor mounting height in software calculations
- Test in actual deployment environment for accuracy
- Verify LED transitions at exact threshold distances:
  - 10.2cm: Green to Yellow transition
  - 9.4cm: Yellow to Red transition
- Consider temperature and humidity effects on ultrasonic readings
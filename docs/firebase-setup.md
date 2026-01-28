# Firebase Setup Guide

## Configuration Applied

Your Firebase project is already configured with these details:

### Project Information
- **Project ID**: flood-detection-5d4e6
- **Database URL**: https://flood-detection-5d4e6-default-rtdb.firebaseio.com
- **Auth Domain**: flood-detection-5d4e6.firebaseapp.com

### ESP32 Firmware Configuration
The firmware has been updated with your Firebase credentials:
```cpp
#define FIREBASE_HOST "flood-detection-5d4e6-default-rtdb.firebaseio.com"
#define FIREBASE_AUTH "AIzaSyDsVF0xPnarV87dfJsS__2XGa8CjIoGc18"
```

### Web Dashboard Configuration
The dashboard script.js has been updated with your complete Firebase config.

## Next Steps

1. **Setup Database Rules** (Important for Security)
2. **Test the Connection**
3. **Configure WiFi Credentials**

---

# Original Firebase Setup Guide

## 1. Create Firebase Project ✅ COMPLETED

Your project "flood-detection-5d4e6" is already created and configured.

## 2. Setup Realtime Database

1. In Firebase Console, navigate to "Realtime Database"
2. Click "Create Database"
3. Choose location (select closest to your device)
4. Start in **test mode** for development
5. Note the database URL: `https://your-project-default-rtdb.firebaseio.com`

## 3. Configure Database Rules

Replace the default rules with:

```json
{
  "rules": {
    "currentStatus": {
      ".read": true,
      ".write": true
    },
    "history": {
      ".read": true,
      ".write": true,
      "$timestamp": {
        ".validate": "newData.hasChildren(['waterLevel', 'distance', 'severity', 'timestamp'])"
      }
    }
  }
}
```

**Note**: These rules allow public read/write access. For production, implement proper authentication.

## 4. Get Configuration Keys

### For ESP32 Firmware:
1. Go to Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Extract the `private_key` value for `FIREBASE_AUTH` in your ESP32 code

### For Web Dashboard:
1. Go to Project Settings → General
2. Scroll to "Your apps" section
3. Click "Add app" → Web app
4. Register app with name: `flood-monitor-dashboard`
5. Copy the configuration object:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project-default-rtdb.firebaseio.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

## 5. Update Code Files

### ESP32 Firmware (`firmware/flood_monitor.ino`):
```cpp
// Update these lines with your values
#define FIREBASE_HOST "your-project-default-rtdb.firebaseio.com"
#define FIREBASE_AUTH "your-database-secret-or-token"

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
```

### Web Dashboard (`dashboard/script.js`):
```javascript
// Replace the firebaseConfig object with your values
const firebaseConfig = {
    apiKey: "your-api-key",
    authDomain: "your-project.firebaseapp.com",
    databaseURL: "https://your-project-default-rtdb.firebaseio.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "your-app-id"
};
```

## 6. Database Structure

The system will create this structure automatically:

```json
{
  "currentStatus": {
    "waterLevel": 25.5,
    "distance": 74.5,
    "severity": "Normal",
    "message": "Water level normal",
    "timestamp": 1640995200
  },
  "history": {
    "1640995200": {
      "waterLevel": 25.5,
      "distance": 74.5,
      "severity": "Normal",
      "timestamp": 1640995200
    },
    "1640995260": {
      "waterLevel": 28.2,
      "distance": 71.8,
      "severity": "Warning",
      "timestamp": 1640995260
    }
  }
}
```

## 7. Security Considerations

### For Development:
- Test mode rules allow unrestricted access
- Suitable for prototyping and testing

### For Production:
1. Enable Firebase Authentication
2. Update database rules to require authentication:

```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}
```

3. Implement user authentication in web dashboard
4. Use service account authentication for ESP32

## 8. Testing the Setup

1. **ESP32 Test**:
   - Upload firmware with correct credentials
   - Monitor Serial output for connection status
   - Check Firebase Console for incoming data

2. **Dashboard Test**:
   - Open `dashboard/index.html` in web browser
   - Check browser console for connection errors
   - Verify real-time data updates

## 9. Troubleshooting

### Common Issues:

**ESP32 not connecting to Firebase**:
- Verify WiFi credentials
- Check Firebase host URL format
- Ensure database rules allow write access

**Dashboard not showing data**:
- Check Firebase config in `script.js`
- Verify database rules allow read access
- Check browser console for JavaScript errors

**Data not updating in real-time**:
- Confirm Realtime Database (not Firestore) is being used
- Check network connectivity
- Verify Firebase listeners are properly set up

### Debug Commands:

**ESP32 Serial Monitor**:
```
Connecting to WiFi...
WiFi connected!
Firebase initialized
=== Flood Monitor Status ===
Distance: 45.2 cm
State: Normal
Firebase updated successfully
```

**Browser Console**:
```javascript
// Check Firebase connection
firebase.database().ref('.info/connected').once('value', (snapshot) => {
  console.log('Connected:', snapshot.val());
});

// Check current data
firebase.database().ref('currentStatus').once('value', (snapshot) => {
  console.log('Current Status:', snapshot.val());
});
```

## 10. Data Management

### Automatic Cleanup:
Consider implementing data retention policies:
- Keep only last 30 days of historical data
- Archive older data to Firebase Storage
- Implement data compression for large datasets

### Backup Strategy:
- Export data periodically using Firebase Admin SDK
- Store backups in cloud storage
- Implement data recovery procedures
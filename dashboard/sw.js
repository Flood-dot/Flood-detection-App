// FloodGuard Pro Service Worker
// Advanced PWA implementation with offline support, background sync, and push notifications

const CACHE_NAME = 'floodguard-pro-v1.2.0';
const STATIC_CACHE = 'floodguard-static-v1.2.0';
const DYNAMIC_CACHE = 'floodguard-dynamic-v1.2.0';
const API_CACHE = 'floodguard-api-v1.2.0';

// Resources to cache immediately
const STATIC_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './script.js',
  './enhanced-features.js',
  './performance-monitor.js',
  './manifest.json',
  './icons/FD_logo.png',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap',
  'https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/9.0.0/firebase-database-compat.js',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

// API endpoints to cache
const API_ENDPOINTS = [
  'https://flood-detection-5d4e6-default-rtdb.firebaseio.com'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('🔧 Service Worker: Installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then(cache => {
        console.log('📦 Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('✅ Service Worker: Activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== API_CACHE) {
              console.log('🗑️ Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Take control of all clients
      self.clients.claim()
    ])
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Handle different types of requests with appropriate strategies
  if (STATIC_ASSETS.some(asset => request.url.includes(asset))) {
    // Static assets - Cache First strategy
    event.respondWith(cacheFirst(request, STATIC_CACHE));
  } else if (url.hostname.includes('firebase') || url.hostname.includes('googleapis')) {
    // API requests - Network First with fallback
    event.respondWith(networkFirstWithFallback(request, API_CACHE));
  } else if (request.destination === 'image') {
    // Images - Cache First with network fallback
    event.respondWith(cacheFirst(request, DYNAMIC_CACHE));
  } else {
    // Other requests - Network First
    event.respondWith(networkFirst(request, DYNAMIC_CACHE));
  }
});

// Background Sync for offline data
self.addEventListener('sync', event => {
  console.log('🔄 Service Worker: Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync-sensor-data') {
    event.waitUntil(syncSensorData());
  } else if (event.tag === 'background-sync-alerts') {
    event.waitUntil(syncAlerts());
  }
});

// Push notifications for critical alerts
self.addEventListener('push', event => {
  console.log('🔔 Service Worker: Push notification received');
  
  const options = {
    body: 'Critical flood alert detected!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [500, 100, 500, 100, 500],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'view',
        title: 'View Dashboard',
        icon: '/icons/action-view.png'
      },
      {
        action: 'silence',
        title: 'Silence Alert',
        icon: '/icons/action-silence.png'
      }
    ],
    requireInteraction: true,
    tag: 'flood-alert'
  };
  
  if (event.data) {
    const data = event.data.json();
    options.body = data.message || options.body;
    options.data = { ...options.data, ...data };
  }
  
  event.waitUntil(
    self.registration.showNotification('FloodGuard Pro Alert', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  console.log('🖱️ Service Worker: Notification clicked');
  
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/')
    );
  } else if (event.action === 'silence') {
    // Send message to client to silence alerts
    event.waitUntil(
      clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SILENCE_ALERTS',
            duration: 3600000 // 1 hour
          });
        });
      })
    );
  } else {
    // Default action - open app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Caching Strategies

// Cache First - for static assets
async function cacheFirst(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Update cache in background
      fetch(request).then(response => {
        if (response.ok) {
          cache.put(request, response.clone());
        }
      }).catch(() => {}); // Ignore network errors
      
      return cachedResponse;
    }
    
    // Not in cache, fetch from network
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
    
  } catch (error) {
    console.error('Cache First strategy failed:', error);
    return new Response('Offline - Content not available', { 
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Network First - for dynamic content
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    console.log('Network failed, trying cache:', error);
    
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return new Response('Offline - Content not available', { 
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Network First with Fallback - for API requests
async function networkFirstWithFallback(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
    
  } catch (error) {
    console.log('API request failed, trying cache:', error);
    
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline fallback data
    return new Response(JSON.stringify({
      offline: true,
      message: 'Offline mode - showing cached data',
      timestamp: Date.now()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Background sync functions
async function syncSensorData() {
  try {
    console.log('🔄 Syncing sensor data in background...');
    
    // Get pending sensor data from IndexedDB
    const pendingData = await getPendingData('sensor-data');
    
    for (const data of pendingData) {
      try {
        await fetch('/api/sensor-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        
        // Remove from pending queue
        await removePendingData('sensor-data', data.id);
        
      } catch (error) {
        console.error('Failed to sync sensor data:', error);
      }
    }
    
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

async function syncAlerts() {
  try {
    console.log('🔄 Syncing alerts in background...');
    
    // Sync alert acknowledgments and settings
    const pendingAlerts = await getPendingData('alerts');
    
    for (const alert of pendingAlerts) {
      try {
        await fetch('/api/alerts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(alert)
        });
        
        await removePendingData('alerts', alert.id);
        
      } catch (error) {
        console.error('Failed to sync alert:', error);
      }
    }
    
  } catch (error) {
    console.error('Alert sync failed:', error);
  }
}

// IndexedDB helpers for offline data storage
async function getPendingData(storeName) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('FloodGuardDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => resolve(getAllRequest.result);
      getAllRequest.onerror = () => reject(getAllRequest.error);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

async function removePendingData(storeName, id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('FloodGuardDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const deleteRequest = store.delete(id);
      
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
    };
  });
}

// Periodic background sync
self.addEventListener('periodicsync', event => {
  if (event.tag === 'sensor-data-sync') {
    event.waitUntil(syncSensorData());
  }
});

// Handle messages from main thread
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('🚀 FloodGuard Pro Service Worker loaded successfully');
// Simple service worker for Blood Warriors
// This is a minimal service worker to prevent errors

self.addEventListener("install", function (event) {
  console.log("Blood Warriors Service Worker installed");
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  console.log("Blood Warriors Service Worker activated");
  event.waitUntil(self.clients.claim());
});

// Remove the no-op fetch handler to avoid overhead during navigation

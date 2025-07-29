// Run this in browser console to clear stale sessions
console.log("Clearing Supabase session data...");

// Clear localStorage
Object.keys(localStorage).forEach((key) => {
  if (key.includes("supabase") || key.includes("sb-")) {
    console.log("Removing:", key);
    localStorage.removeItem(key);
  }
});

// Clear sessionStorage
Object.keys(sessionStorage).forEach((key) => {
  if (key.includes("supabase") || key.includes("sb-")) {
    console.log("Removing:", key);
    sessionStorage.removeItem(key);
  }
});

console.log("Storage cleared. Please refresh the page.");

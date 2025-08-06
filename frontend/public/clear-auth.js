// Emergency auth state cleaner
// Run this in browser console if you're stuck in a login loop

console.log("🩸 Blood Warriors - Auth State Cleaner");
console.log("Current tokens:");
console.log(
  "- Access Token:",
  localStorage.getItem("blood_warriors_access_token") ? "Present" : "None"
);
console.log(
  "- Refresh Token:",
  localStorage.getItem("blood_warriors_refresh_token") ? "Present" : "None"
);

// Clear all auth-related localStorage
localStorage.removeItem("blood_warriors_access_token");
localStorage.removeItem("blood_warriors_refresh_token");

console.log("✅ Auth tokens cleared");
console.log("🔄 Please refresh the page");

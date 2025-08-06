// Debug script to check authentication state
console.log("=== Authentication Debug ===");

// Check localStorage tokens
const accessToken = localStorage.getItem("blood_warriors_access_token");
const refreshToken = localStorage.getItem("blood_warriors_refresh_token");

console.log("Access Token:", accessToken ? "Present" : "Not found");
console.log("Refresh Token:", refreshToken ? "Present" : "Not found");

if (accessToken) {
  try {
    const payload = JSON.parse(atob(accessToken.split(".")[1]));
    console.log("Token Payload:", payload);
    console.log("Token Expired:", payload.exp < Date.now() / 1000);
  } catch (e) {
    console.log("Invalid token format");
  }
}

// Clear tokens if needed
// localStorage.removeItem('blood_warriors_access_token');
// localStorage.removeItem('blood_warriors_refresh_token');
// console.log('Tokens cleared');

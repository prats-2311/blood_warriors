import { supabase } from "./supabase";

/**
 * Clear all Supabase session data and reset authentication state
 */
export const clearSupabaseSession = async () => {
  try {
    console.log("Clearing Supabase session...");

    // Sign out from Supabase
    await supabase.auth.signOut();

    // Clear localStorage
    Object.keys(localStorage).forEach((key) => {
      if (key.includes("supabase") || key.includes("sb-")) {
        console.log("Removing from localStorage:", key);
        localStorage.removeItem(key);
      }
    });

    // Clear sessionStorage
    Object.keys(sessionStorage).forEach((key) => {
      if (key.includes("supabase") || key.includes("sb-")) {
        console.log("Removing from sessionStorage:", key);
        sessionStorage.removeItem(key);
      }
    });

    console.log("Session cleared successfully");

    // Reload the page to ensure clean state
    window.location.reload();
  } catch (error) {
    console.error("Error clearing session:", error);
  }
};

/**
 * Check if there are any stale sessions in storage
 */
export const checkForStaleSession = () => {
  const storageKeys = [
    ...Object.keys(localStorage),
    ...Object.keys(sessionStorage),
  ];
  const supabaseKeys = storageKeys.filter(
    (key) => key.includes("supabase") || key.includes("sb-")
  );

  if (supabaseKeys.length > 0) {
    console.log("Found potential stale session keys:", supabaseKeys);
    return true;
  }

  return false;
};

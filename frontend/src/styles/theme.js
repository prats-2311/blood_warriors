// Blood Warriors Medical Theme Configuration
export const medicalTheme = {
  colors: {
    // Medical Red Palette - Professional and calming
    primary: {
      50: "#fef7f7", // Very light red for backgrounds
      100: "#fee2e2", // Light red for subtle highlights
      200: "#fecaca", // Soft red for borders
      300: "#fca5a5", // Medium light red
      400: "#f87171", // Medium red
      500: "#dc2626", // Main medical red - professional
      600: "#b91c1c", // Darker red for hover states
      700: "#991b1b", // Dark red for active states
      800: "#7f1d1d", // Very dark red
      900: "#6b1d1d", // Deepest red
    },

    // Healthcare Blue-Gray Palette - Clean and trustworthy
    secondary: {
      50: "#f8fafc", // Clean white-blue for backgrounds
      100: "#f1f5f9", // Light gray-blue for cards
      200: "#e2e8f0", // Soft gray for borders
      300: "#cbd5e1", // Medium light gray
      400: "#94a3b8", // Medium gray
      500: "#64748b", // Main gray for text
      600: "#475569", // Darker gray for headings
      700: "#334155", // Dark gray for emphasis
      800: "#1e293b", // Very dark blue-gray for primary text
      900: "#0f172a", // Deepest blue-gray
    },

    // Medical Accent Colors
    accent: {
      // Medical Green - for positive actions and success
      success: {
        50: "#f0fdf4",
        100: "#dcfce7",
        500: "#059669", // Medical green
        600: "#047857",
        700: "#065f46",
      },

      // Medical Orange - for warnings and caution
      warning: {
        50: "#fffbeb",
        100: "#fef3c7",
        500: "#d97706", // Medical orange
        600: "#b45309",
        700: "#92400e",
      },

      // Medical Blue - for information
      info: {
        50: "#eff6ff",
        100: "#dbeafe",
        500: "#0284c7", // Medical blue
        600: "#0369a1",
        700: "#0c4a6e",
      },

      // Error uses primary red for consistency
      error: {
        50: "#fef7f7",
        100: "#fee2e2",
        500: "#dc2626", // Same as primary
        600: "#b91c1c",
        700: "#991b1b",
      },
    },

    // Neutral colors
    white: "#ffffff",
    black: "#000000",
    transparent: "transparent",
  },

  spacing: {
    xs: "0.25rem", // 4px
    sm: "0.5rem", // 8px
    md: "1rem", // 16px
    lg: "1.5rem", // 24px
    xl: "2rem", // 32px
    "2xl": "3rem", // 48px
    "3xl": "4rem", // 64px
    "4xl": "6rem", // 96px
  },

  borderRadius: {
    none: "0",
    sm: "0.25rem", // 4px
    md: "0.375rem", // 6px
    lg: "0.5rem", // 8px
    xl: "0.75rem", // 12px
    "2xl": "1rem", // 16px
    "3xl": "1.5rem", // 24px
    full: "9999px",
  },

  shadows: {
    sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
    "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
    inner: "inset 0 2px 4px 0 rgb(0 0 0 / 0.06)",
  },

  typography: {
    fontFamily: {
      sans: [
        "Inter",
        "system-ui",
        "-apple-system",
        "BlinkMacSystemFont",
        "Segoe UI",
        "Roboto",
        "sans-serif",
      ],
      mono: ["Fira Code", "Monaco", "Consolas", "monospace"],
    },
    fontSize: {
      xs: "0.75rem", // 12px
      sm: "0.875rem", // 14px
      base: "1rem", // 16px
      lg: "1.125rem", // 18px
      xl: "1.25rem", // 20px
      "2xl": "1.5rem", // 24px
      "3xl": "1.875rem", // 30px
      "4xl": "2.25rem", // 36px
      "5xl": "3rem", // 48px
    },
    fontWeight: {
      light: "300",
      normal: "400",
      medium: "500",
      semibold: "600",
      bold: "700",
      extrabold: "800",
    },
    lineHeight: {
      tight: "1.25",
      normal: "1.5",
      relaxed: "1.75",
    },
  },

  breakpoints: {
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
    "2xl": "1536px",
  },

  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modal: 1040,
    popover: 1050,
    tooltip: 1060,
  },
};

// Blood Group Colors - Medical and distinguishable
export const bloodGroupColors = {
  "A+": "#dc2626", // Medical red
  "A-": "#b91c1c", // Darker red
  "B+": "#0284c7", // Medical blue
  "B-": "#0369a1", // Darker blue
  "AB+": "#7c3aed", // Medical purple
  "AB-": "#6d28d9", // Darker purple
  "O+": "#059669", // Medical green
  "O-": "#047857", // Darker green
};

// Urgency Colors - Clear hierarchy
export const urgencyColors = {
  SOS: "#dc2626", // Medical red - highest urgency
  Urgent: "#d97706", // Medical orange - medium urgency
  Scheduled: "#059669", // Medical green - lowest urgency
};

// Status Colors - Clear states
export const statusColors = {
  Open: "#0284c7", // Medical blue
  "In Progress": "#d97706", // Medical orange
  Fulfilled: "#059669", // Medical green
  Cancelled: "#64748b", // Gray
  Expired: "#64748b", // Gray
};

// Notification Status Colors
export const notificationColors = {
  Sent: "#64748b", // Gray
  Read: "#0284c7", // Medical blue
  Accepted: "#059669", // Medical green
  Declined: "#dc2626", // Medical red
};

// Export default theme for backward compatibility
export const theme = medicalTheme;

// Export default theme
export default medicalTheme;

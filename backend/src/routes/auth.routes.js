const express = require("express");
const RegistrationController = require("../controllers/RegistrationController");
const LoginController = require("../controllers/LoginController");
const PasswordController = require("../controllers/PasswordController");
const TokenController = require("../controllers/TokenController");
const ProfileController = require("../controllers/ProfileController");
const AuthMiddleware = require("../middleware/AuthMiddleware");

const router = express.Router();
const authMiddleware = new AuthMiddleware();

// Initialize controllers
const registrationController = new RegistrationController();
const loginController = new LoginController();
const passwordController = new PasswordController();
const tokenController = new TokenController();
const profileController = new ProfileController();

// Public routes
router.post("/register", (req, res) =>
  registrationController.register(req, res)
);
router.post("/login", (req, res) => loginController.login(req, res));
router.post("/logout", (req, res) => loginController.logout(req, res));
router.post("/refresh", (req, res) => loginController.refreshToken(req, res));

// Email verification routes
router.get("/verify/:token", (req, res) =>
  registrationController.verifyEmail(req, res)
);
router.post("/resend-verification", (req, res) =>
  registrationController.resendVerification(req, res)
);

// Password management routes
router.post("/forgot-password", (req, res) =>
  passwordController.forgotPassword(req, res)
);
router.post("/reset-password", (req, res) =>
  passwordController.resetPassword(req, res)
);
router.post("/change-password", authMiddleware.authenticate, (req, res) =>
  passwordController.changePassword(req, res)
);

// Token management routes
router.post("/token/refresh", (req, res) =>
  tokenController.refreshToken(req, res)
);
router.post("/token/revoke", authMiddleware.authenticate, (req, res) =>
  tokenController.revokeTokens(req, res)
);
router.get("/sessions", authMiddleware.authenticate, (req, res) =>
  tokenController.getSessions(req, res)
);

// Utility routes
router.get("/check-email", (req, res) =>
  registrationController.checkEmailAvailability(req, res)
);

// Protected routes
router.get("/profile", authMiddleware.authenticate, (req, res) =>
  profileController.getProfile(req, res)
);
router.put("/profile", authMiddleware.authenticate, (req, res) =>
  profileController.updateProfile(req, res)
);
router.get("/profile/stats", authMiddleware.authenticate, (req, res) =>
  profileController.getStats(req, res)
);

// Debug route to test authentication
router.get("/debug/token", authMiddleware.authenticate, (req, res) => {
  res.json({
    status: "success",
    message: "Authentication working",
    user: {
      user_id: req.user.user_id,
      email: req.user.email,
      user_type: req.user.user_type,
    },
  });
});

module.exports = router;

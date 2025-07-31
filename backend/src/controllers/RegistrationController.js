const JWTService = require("../services/JWTService");
const PasswordService = require("../services/PasswordService");
const EmailService = require("../services/EmailService");
const { supabase } = require("../utils/supabase");
const Joi = require("joi");

class RegistrationController {
  constructor() {
    this.jwtService = new JWTService();
    this.passwordService = new PasswordService();
    this.emailService = new EmailService();

    // Enhanced registration validation schema
    this.registrationSchema = Joi.object({
      email: Joi.string().email().required().messages({
        "string.email": "Please provide a valid email address",
        "any.required": "Email is required",
      }),
      password: Joi.string().min(8).required().messages({
        "string.min": "Password must be at least 8 characters long",
        "any.required": "Password is required",
      }),
      phone_number: Joi.string()
        .pattern(/^[0-9]{10,15}$/)
        .required()
        .messages({
          "string.pattern.base": "Phone number must be 10-15 digits",
          "any.required": "Phone number is required",
        }),
      full_name: Joi.string().min(2).max(100).required().messages({
        "string.min": "Full name must be at least 2 characters",
        "string.max": "Full name cannot exceed 100 characters",
        "any.required": "Full name is required",
      }),
      city: Joi.string().max(100).optional(),
      state: Joi.string().max(100).optional(),
      user_type: Joi.string().valid("Patient", "Donor").required().messages({
        "any.only": "User type must be either Patient or Donor",
        "any.required": "User type is required",
      }),
      blood_group_id: Joi.number().integer().positive().required().messages({
        "number.base": "Blood group ID must be a number",
        "number.positive": "Blood group ID must be positive",
        "any.required": "Blood group is required",
      }),
      date_of_birth: Joi.date().when("user_type", {
        is: "Patient",
        then: Joi.required().messages({
          "any.required": "Date of birth is required for patients",
        }),
        otherwise: Joi.optional(),
      }),
    });
  }

  /**
   * Register a new user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async register(req, res) {
    try {
      // Validate request data
      const { error, value } = this.registrationSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          status: "error",
          message: "Validation failed",
          errors: error.details.map((detail) => ({
            field: detail.path.join("."),
            message: detail.message,
          })),
        });
      }

      const {
        email,
        password,
        phone_number,
        full_name,
        city,
        state,
        user_type,
        blood_group_id,
        date_of_birth,
      } = value;

      // Validate password strength
      const passwordValidation =
        this.passwordService.validateStrength(password);
      if (!passwordValidation.isValid) {
        return res.status(400).json({
          status: "error",
          message: "Password does not meet security requirements",
          errors: passwordValidation.errors,
          suggestions: passwordValidation.suggestions,
        });
      }

      // Check if user already exists
      const { data: existingUser } = await supabase
        .from("users")
        .select("email")
        .eq("email", email.toLowerCase())
        .single();

      if (existingUser) {
        return res.status(409).json({
          status: "error",
          message: "An account with this email already exists",
        });
      }

      // Hash password
      const hashedPassword = await this.passwordService.hashPassword(password);

      // Generate email verification token
      const verificationToken = this.passwordService.generateResetToken();

      // Start database transaction
      const { data: userData, error: userError } = await supabase
        .from("users")
        .insert({
          email: email.toLowerCase(),
          password_hash: hashedPassword,
          phone_number,
          full_name,
          city,
          state,
          user_type,
          is_active: false, // Account inactive until email verification
          is_verified: false,
          failed_login_attempts: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (userError) {
        console.error("User creation error:", userError);
        return res.status(500).json({
          status: "error",
          message: "Failed to create user account",
        });
      }

      try {
        // Create type-specific record
        if (user_type === "Patient") {
          const { error: patientError } = await supabase
            .from("patients")
            .insert({
              patient_id: userData.user_id,
              blood_group_id,
              date_of_birth,
            });

          if (patientError) {
            throw new Error(
              `Failed to create patient record: ${patientError.message}`
            );
          }
        } else if (user_type === "Donor") {
          const { error: donorError } = await supabase.from("donors").insert({
            donor_id: userData.user_id,
            blood_group_id,
            donation_count: 0,
          });

          if (donorError) {
            throw new Error(
              `Failed to create donor record: ${donorError.message}`
            );
          }
        }

        // Store email verification token
        const { error: verificationError } = await supabase
          .from("email_verifications")
          .insert({
            user_id: userData.user_id,
            token_hash: verificationToken.tokenHash,
            expires_at: verificationToken.expiresAt,
            created_at: new Date().toISOString(),
          });

        if (verificationError) {
          throw new Error(
            `Failed to create verification token: ${verificationError.message}`
          );
        }

        // Send verification email (skip for MVP with dummy emails)
        try {
          if (this.emailService.validateEmailFormat(email)) {
            await this.emailService.sendVerificationEmail(
              userData,
              verificationToken.token
            );
          }
        } catch (emailError) {
          console.warn("Email sending failed:", emailError.message);
          // Don't fail registration if email fails
        }

        // Return success response
        res.status(201).json({
          status: "success",
          message:
            "Registration successful. Please check your email to verify your account.",
          data: {
            user_id: userData.user_id,
            email: userData.email,
            full_name: userData.full_name,
            user_type: userData.user_type,
            is_verified: userData.is_verified,
            created_at: userData.created_at,
          },
        });
      } catch (rollbackError) {
        // Rollback user creation if type-specific record creation fails
        await supabase.from("users").delete().eq("user_id", userData.user_id);

        console.error("Registration rollback error:", rollbackError);
        return res.status(500).json({
          status: "error",
          message: "Registration failed during account setup",
        });
      }
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({
        status: "error",
        message: "Internal server error during registration",
      });
    }
  }

  /**
   * Verify email address
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async verifyEmail(req, res) {
    try {
      const { token } = req.params;

      if (!token) {
        return res.status(400).json({
          status: "error",
          message: "Verification token is required",
        });
      }

      // Find verification record by hashing the provided token
      const crypto = require("crypto");
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

      const { data: verificationData, error: verificationError } =
        await supabase
          .from("email_verifications")
          .select("*")
          .eq("token_hash", tokenHash)
          .single();

      if (verificationError || !verificationData) {
        return res.status(400).json({
          status: "error",
          message: "Invalid or expired verification token",
        });
      }

      // Verify token
      const isValidToken = this.passwordService.verifyResetToken(
        token,
        verificationData.token_hash,
        new Date(verificationData.expires_at)
      );

      if (!isValidToken) {
        return res.status(400).json({
          status: "error",
          message: "Invalid or expired verification token",
        });
      }

      // Activate user account
      const { data: updatedUser, error: updateError } = await supabase
        .from("users")
        .update({
          is_active: true,
          is_verified: true,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", verificationData.user_id)
        .select()
        .single();

      if (updateError) {
        console.error("User activation error:", updateError);
        return res.status(500).json({
          status: "error",
          message: "Failed to activate account",
        });
      }

      // Delete used verification token
      await supabase
        .from("email_verifications")
        .delete()
        .eq("user_id", verificationData.user_id);

      res.status(200).json({
        status: "success",
        message: "Email verified successfully. Your account is now active.",
        data: {
          user_id: updatedUser.user_id,
          email: updatedUser.email,
          is_verified: updatedUser.is_verified,
          is_active: updatedUser.is_active,
        },
      });
    } catch (error) {
      console.error("Email verification error:", error);
      res.status(500).json({
        status: "error",
        message: "Internal server error during email verification",
      });
    }
  }

  /**
   * Resend verification email
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async resendVerification(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          status: "error",
          message: "Email is required",
        });
      }

      // Find user
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("email", email.toLowerCase())
        .single();

      if (userError || !userData) {
        return res.status(404).json({
          status: "error",
          message: "User not found",
        });
      }

      if (userData.is_verified) {
        return res.status(400).json({
          status: "error",
          message: "Account is already verified",
        });
      }

      // Generate new verification token
      const verificationToken = this.passwordService.generateResetToken();

      // Delete old verification tokens
      await supabase
        .from("email_verifications")
        .delete()
        .eq("user_id", userData.user_id);

      // Store new verification token
      const { error: verificationError } = await supabase
        .from("email_verifications")
        .insert({
          user_id: userData.user_id,
          token_hash: verificationToken.tokenHash,
          expires_at: verificationToken.expiresAt,
          created_at: new Date().toISOString(),
        });

      if (verificationError) {
        console.error("Verification token creation error:", verificationError);
        return res.status(500).json({
          status: "error",
          message: "Failed to generate verification token",
        });
      }

      // Send verification email
      try {
        if (this.emailService.validateEmailFormat(email)) {
          await this.emailService.sendVerificationEmail(
            userData,
            verificationToken.token
          );
        }
      } catch (emailError) {
        console.warn("Email sending failed:", emailError.message);
      }

      res.status(200).json({
        status: "success",
        message: "Verification email sent successfully",
      });
    } catch (error) {
      console.error("Resend verification error:", error);
      res.status(500).json({
        status: "error",
        message: "Internal server error",
      });
    }
  }

  /**
   * Check if email is available
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async checkEmailAvailability(req, res) {
    try {
      const { email } = req.query;

      if (!email) {
        return res.status(400).json({
          status: "error",
          message: "Email parameter is required",
        });
      }

      // Validate email format
      if (!this.emailService.validateEmailFormat(email)) {
        return res.status(400).json({
          status: "error",
          message: "Invalid email format",
        });
      }

      // Check if email exists
      const { data: existingUser } = await supabase
        .from("users")
        .select("email")
        .eq("email", email.toLowerCase())
        .single();

      res.status(200).json({
        status: "success",
        data: {
          email,
          available: !existingUser,
        },
      });
    } catch (error) {
      console.error("Email availability check error:", error);
      res.status(500).json({
        status: "error",
        message: "Internal server error",
      });
    }
  }
}

module.exports = RegistrationController;

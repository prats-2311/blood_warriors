const { supabase } = require("../utils/supabase");

/**
 * Register a new user
 */
const register = async (req, res) => {
  try {
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
    } = req.body;

    // Validate required fields
    if (
      !email ||
      !password ||
      !phone_number ||
      !full_name ||
      !user_type ||
      !blood_group_id
    ) {
      return res.status(400).json({
        status: "error",
        message: "Missing required fields",
      });
    }

    // Validate user type
    if (!["Patient", "Donor"].includes(user_type)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid user type. Must be Patient or Donor",
      });
    }

    // Check if user already exists in our database
    const { data: existingUser } = await supabase
      .from("users")
      .select("user_id, email")
      .or(`email.eq.${email},phone_number.eq.${phone_number}`)
      .maybeSingle();

    if (existingUser) {
      return res.status(400).json({
        status: "error",
        message: "User with this email or phone number already exists",
      });
    }

    // Register user with Supabase Auth (without email confirmation)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.FRONTEND_URL}/auth/callback`,
        data: {
          full_name,
          phone_number,
          city,
          state,
          user_type,
          blood_group_id,
        },
      },
    });

    if (authError) {
      // Handle specific auth errors
      if (authError.message.includes("already registered")) {
        return res.status(400).json({
          status: "error",
          message: "An account with this email already exists",
        });
      }

      // Handle email not confirmed error - this is expected in development
      if (authError.message.includes("Email not confirmed")) {
        // This is normal when email confirmation is enabled
        // The user is created but needs confirmation
        console.log("User created but email confirmation required");

        return res.status(200).json({
          status: "success",
          message:
            "Registration successful! Please check your email to confirm your account.",
          data: {
            user: authData?.user,
            needsConfirmation: true,
          },
        });
      }

      return res.status(400).json({
        status: "error",
        message: authError.message,
      });
    }

    // Check if user was created successfully
    if (!authData?.user) {
      return res.status(400).json({
        status: "error",
        message: "Failed to create user account",
      });
    }

    // Create user record in our Users table
    const { data: userData, error: userError } = await supabase
      .from("users")
      .insert({
        auth_id: authData.user.id,
        email,
        phone_number,
        full_name,
        city,
        state,
        user_type,
      })
      .select()
      .single();

    if (userError) {
      // Handle duplicate key errors specifically
      if (userError.code === "23505") {
        // PostgreSQL unique violation
        // Clean up the auth user
        await supabase.auth.admin.deleteUser(authData.user.id);

        if (userError.message.includes("users_auth_id_key")) {
          return res.status(400).json({
            status: "error",
            message:
              "Registration conflict. Please try again or contact support.",
          });
        } else if (userError.message.includes("email")) {
          return res.status(400).json({
            status: "error",
            message: "An account with this email already exists",
          });
        } else if (userError.message.includes("phone")) {
          return res.status(400).json({
            status: "error",
            message: "An account with this phone number already exists",
          });
        }
      }

      // Rollback: delete the auth user if we couldn't create the user record
      await supabase.auth.admin.deleteUser(authData.user.id);

      return res.status(400).json({
        status: "error",
        message: userError.message,
      });
    }

    // Create Patient or Donor record
    if (user_type === "Patient") {
      if (!date_of_birth) {
        return res.status(400).json({
          status: "error",
          message: "Date of birth is required for patients",
        });
      }

      const { error: patientError } = await supabase.from("patients").insert({
        patient_id: userData.user_id,
        blood_group_id,
        date_of_birth,
      });

      if (patientError) {
        // Rollback: delete the user record and auth user
        await supabase.from("users").delete().eq("user_id", userData.user_id);
        await supabase.auth.admin.deleteUser(authData.user.id);

        return res.status(400).json({
          status: "error",
          message: patientError.message,
        });
      }
    } else if (user_type === "Donor") {
      const { error: donorError } = await supabase.from("donors").insert({
        donor_id: userData.user_id,
        blood_group_id,
        is_available_for_sos: true,
      });

      if (donorError) {
        // Rollback: delete the user record and auth user
        await supabase.from("users").delete().eq("user_id", userData.user_id);
        await supabase.auth.admin.deleteUser(authData.user.id);

        return res.status(400).json({
          status: "error",
          message: donorError.message,
        });
      }
    }

    // After successful registration, automatically sign in the user
    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (signInError) {
      console.error("Auto sign-in failed:", signInError);
      // Registration was successful, but auto sign-in failed
      return res.status(201).json({
        status: "success",
        message:
          "User registered successfully. Please login with your credentials.",
        data: {
          user_id: userData.user_id,
          email: userData.email,
          full_name: userData.full_name,
          user_type: userData.user_type,
          needsLogin: true,
        },
      });
    }

    // Registration and auto sign-in successful
    res.status(201).json({
      status: "success",
      message: "User registered and logged in successfully",
      data: {
        user_id: userData.user_id,
        email: userData.email,
        full_name: userData.full_name,
        user_type: userData.user_type,
        session: signInData.session,
        access_token: signInData.session.access_token,
      },
    });
  } catch (error) {
    console.error("Registration error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    res.status(500).json({
      status: "error",
      message: "Registration failed. Please try again.",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Login a user
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        status: "error",
        message: "Email and password are required",
      });
    }

    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({
        status: "error",
        message: error.message,
      });
    }

    // Get user details from our Users table
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("auth_id", data.user.id)
      .single();

    if (userError) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Login successful",
      data: {
        token: data.session.access_token,
        user: {
          user_id: userData.user_id,
          email: userData.email,
          full_name: userData.full_name,
          user_type: userData.user_type,
        },
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      status: "error",
      message: "Login failed",
    });
  }
};

/**
 * Get user profile
 */
const getProfile = async (req, res) => {
  try {
    // req.user is set by the authenticate middleware
    const userId = req.user.user_id;
    const userType = req.user.user_type;

    let profileData = {};

    // Get basic user data
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (userError) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    profileData = {
      user_id: userData.user_id,
      email: userData.email,
      phone_number: userData.phone_number,
      full_name: userData.full_name,
      city: userData.city,
      state: userData.state,
      user_type: userData.user_type,
      created_at: userData.created_at,
    };

    // Get additional data based on user type
    if (userType === "Patient") {
      const { data: patientData, error: patientError } = await supabase
        .from("patients")
        .select(
          `
          date_of_birth,
          blood_group_id,
          medical_conditions,
          emergency_contact
        `
        )
        .eq("patient_id", userId)
        .single();

      if (!patientError && patientData) {
        // Get blood group name
        const { data: bloodGroup } = await supabase
          .from("bloodgroups")
          .select("group_name")
          .eq("blood_group_id", patientData.blood_group_id)
          .single();

        profileData.date_of_birth = patientData.date_of_birth;
        profileData.blood_group = bloodGroup?.group_name || "Unknown";
        profileData.medical_conditions = patientData.medical_conditions;
        profileData.emergency_contact = patientData.emergency_contact;
      }
    } else if (userType === "Donor") {
      const { data: donorData, error: donorError } = await supabase
        .from("donors")
        .select(
          `
          last_donation_date,
          is_available_for_sos,
          latitude,
          longitude,
          qloo_taste_keywords,
          blood_group_id,
          donation_count
        `
        )
        .eq("donor_id", userId)
        .single();

      if (!donorError && donorData) {
        // Get blood group name
        const { data: bloodGroup } = await supabase
          .from("bloodgroups")
          .select("group_name")
          .eq("blood_group_id", donorData.blood_group_id)
          .single();

        profileData.last_donation_date = donorData.last_donation_date;
        profileData.is_available_for_sos = donorData.is_available_for_sos;
        profileData.blood_group = bloodGroup?.group_name || "Unknown";
        profileData.interests = donorData.qloo_taste_keywords || [];
        profileData.location = {
          latitude: donorData.latitude,
          longitude: donorData.longitude,
        };
        profileData.donation_count = donorData.donation_count || 0;
      }
    }

    res.status(200).json({
      status: "success",
      data: profileData,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to get profile",
    });
  }
};

/**
 * Update user profile
 */
const updateProfile = async (req, res) => {
  try {
    // req.user is set by the authenticate middleware
    const userId = req.user.user_id;
    const userType = req.user.user_type;

    const {
      phone_number,
      full_name,
      city,
      state,
      is_available_for_sos,
      qloo_taste_keywords,
    } = req.body;

    // Update basic user data
    const updateData = {};
    if (phone_number) updateData.phone_number = phone_number;
    if (full_name) updateData.full_name = full_name;
    if (city) updateData.city = city;
    if (state) updateData.state = state;

    if (Object.keys(updateData).length > 0) {
      const { error: userError } = await supabase
        .from("users")
        .update(updateData)
        .eq("user_id", userId);

      if (userError) {
        return res.status(400).json({
          status: "error",
          message: userError.message,
        });
      }
    }

    // Update additional data based on user type
    if (userType === "Donor") {
      const donorUpdateData = {};
      if (is_available_for_sos !== undefined)
        donorUpdateData.is_available_for_sos = is_available_for_sos;
      if (qloo_taste_keywords)
        donorUpdateData.qloo_taste_keywords = qloo_taste_keywords;

      if (Object.keys(donorUpdateData).length > 0) {
        const { error: donorError } = await supabase
          .from("donors")
          .update(donorUpdateData)
          .eq("donor_id", userId);

        if (donorError) {
          return res.status(400).json({
            status: "error",
            message: donorError.message,
          });
        }
      }
    }

    res.status(200).json({
      status: "success",
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to update profile",
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
};

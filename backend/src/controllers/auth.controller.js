const { supabase } = require("../utils/supabase");

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

    // Create auth user
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (authError) {
      return res.status(400).json({
        status: "error",
        message: authError.message,
      });
    }

    // Create user record
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
      await supabase.auth.admin.deleteUser(authData.user.id);
      return res.status(400).json({
        status: "error",
        message: userError.message,
      });
    }

    // Create type-specific record
    if (user_type === "Patient") {
      const { error: patientError } = await supabase.from("patients").insert({
        patient_id: userData.user_id,
        blood_group_id,
        date_of_birth,
      });

      if (patientError) {
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
      });

      if (donorError) {
        await supabase.from("users").delete().eq("user_id", userData.user_id);
        await supabase.auth.admin.deleteUser(authData.user.id);
        return res.status(400).json({
          status: "error",
          message: donorError.message,
        });
      }
    }

    res.status(201).json({
      status: "success",
      message: "User registered successfully",
      data: {
        user_id: userData.user_id,
        email: userData.email,
        full_name: userData.full_name,
        user_type: userData.user_type,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      status: "error",
      message: "Registration failed",
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

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
        user: userData,
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

const getProfile = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const userType = req.user.user_type;

    let profileData = { ...req.user };

    if (userType === "Patient") {
      const { data: patientData } = await supabase
        .from("patients")
        .select("date_of_birth, blood_group_id")
        .eq("patient_id", userId)
        .single();

      if (patientData) {
        const { data: bloodGroup } = await supabase
          .from("bloodgroups")
          .select("group_name")
          .eq("blood_group_id", patientData.blood_group_id)
          .single();

        profileData.date_of_birth = patientData.date_of_birth;
        profileData.blood_group = bloodGroup?.group_name;
      }
    } else if (userType === "Donor") {
      const { data: donorData } = await supabase
        .from("donors")
        .select("blood_group_id, donation_count")
        .eq("donor_id", userId)
        .single();

      if (donorData) {
        const { data: bloodGroup } = await supabase
          .from("bloodgroups")
          .select("group_name")
          .eq("blood_group_id", donorData.blood_group_id)
          .single();

        profileData.blood_group = bloodGroup?.group_name;
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

module.exports = {
  register,
  login,
  getProfile,
};

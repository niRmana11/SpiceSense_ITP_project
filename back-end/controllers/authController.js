import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";
import transporter from "../config/nodemailer.js";

export const register = async (req, res) => {
  const { 
    name, 
    email, 
    phone,
    password, 
    confirmPassword,
    role, 
    companyName, 
    contactPerson, 
    jobTitle, 
    department, 
    shippingAddress, 
    billingAddress 
  } = req.body;

  if (!name || !email || !phone || !password || !role) {
    return res.status(400).json({ success: false, message: "Missing Details" });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ success: false, message: "Passwords do not match" });
  }

  try {
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let roleSpecificFields = {};
    switch (role) {
      case 'supplier':
        roleSpecificFields = { companyName, contactPerson };
        break;
      case 'employee':
        roleSpecificFields = { jobTitle, department };
        break;
      case 'customer':
        roleSpecificFields = { shippingAddress, billingAddress };
        break;
      case 'admin':
        roleSpecificFields = { permissions: ['manage-users', 'view-reports'] };
        break;
      default:
        return res.status(400).json({ success: false, message: "Invalid role" });
    }

    // Generate OTP for email verification
    const otp = String(Math.floor(100000 + Math.random() * 900000));

    const user = new userModel({
      name,
      email,
      phone,
      password: hashedPassword,
      role,
      verifyOtp: otp,
      verifyOtpExpireAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours expiry
      ...roleSpecificFields,
    });

    await user.save();

    // Send OTP email
    const mailOptions = {
      from: `SpiceSense <${process.env.SENDER_EMAIL}>`,
      to: email,
      subject: "Verify Your SpiceSense Account",
      text: `Welcome to SpiceSense! Your OTP for email verification is ${otp}. Verify your account using this OTP.`,
    };

    try {
      const emailResponse = await transporter.sendMail(mailOptions);
      console.log("OTP email sent successfully:", emailResponse.response);
    } catch (emailError) {
      console.error("Error sending OTP email:", emailError.message);
    }

    return res.status(201).json({
      success: true,
      message: "User registered successfully. Please verify your email.",
      userId: user._id.toString(),
    });

  } catch (error) {
    console.error("Registration error:", error.message);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password are required" });
  }

  try {
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid email" });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: "Account is deactivated. Please contact an admin." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid password" });
    }

    // Check if account is verified
    if (!user.isAccountVerified) {
      const otp = String(Math.floor(100000 + Math.random() * 900000));
      user.verifyOtp = otp;
      user.verifyOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000;
      await user.save();

      const mailOptions = {
        from: `SpiceSense <${process.env.SENDER_EMAIL}>`,
        to: user.email,
        subject: "Account Verification OTP",
        text: `Your OTP is ${otp}. Verify your account using this OTP.`,
      };

      await transporter.sendMail(mailOptions);

      return res.status(200).json({
        success: true,
        message: "Login successful. OTP sent to email for verification.",
        userId: user._id.toString(),
      });
    }

    const token = jwt.sign(
      { id: user._id.toString(), role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    console.log("Login Token Generated:", token);

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };

    res.cookie("token", token, cookieOptions);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      userId: user._id.toString(),
      role: user.role,
    });

  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const verifyEmail = async (req, res) => {
  const { otp, userId } = req.body;

  if (!userId || !otp) {
    return res.status(400).json({ success: false, message: "Missing Details" });
  }

  try {
    console.log("Verifying email for user ID:", userId);
    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    console.log("Stored OTP:", user.verifyOtp, "Received OTP:", otp);

    if (user.verifyOtp === "" || user.verifyOtp !== otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    if (user.verifyOtpExpireAt < Date.now()) {
      return res.status(400).json({ success: false, message: "OTP Expired" });
    }

    user.isAccountVerified = true;
    user.verifyOtp = "";
    user.verifyOtpExpireAt = 0;
    await user.save();

    // Generate JWT token after verification
    const token = jwt.sign(
      { id: user._id.toString(), role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    };

    res.cookie("token", token, cookieOptions);
    console.log("Verification Cookie Set:", token);

    return res.json({
      success: true,
      message: "Email verified successfully. Please log in.",
      userId: user._id.toString(),
      role: user.role,
    });

  } catch (error) {
    console.error("verifyEmail error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Other functions (logout, sendResetOtp, resetPassword) remain unchanged

export const logout = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(400).json({ success: false, message: "User ID not found" });
    }

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
    };

    res.clearCookie("token", cookieOptions);
    res.setHeader("Set-Cookie", "token=; HttpOnly; Max-Age=0; SameSite=None; Path=/; Secure");

    console.log("Logout Cookie Cleared with Options:", cookieOptions);

    return res.status(200).json({ success: true, message: "Logged Out" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};


export const sendResetOtp = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.json({ success: false, message: 'Email is required' });
  }

  try {
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: 'User not found' });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    user.resetOtp = otp;
    user.resetOtpExpireAt = Date.now() + 15 * 60 * 1000;
    await user.save();

    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject: "Password Reset OTP",
      text: `Your OTP for resetting your password is ${otp}. Use this OTP for resetting your password`,
    };

    await transporter.sendMail(mailOptions);
    return res.json({ success: true, message: "OTP sent to email" });

  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res.json({ success: false, message: 'Email, OTP, and new password are required' });
  }

  try {
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: 'User not found' });
    }
    if (user.resetOtp === "" || user.resetOtp !== otp) {
      return res.json({ success: false, message: 'Invalid OTP' });
    }

    if (user.resetOtpExpireAt < Date.now()) {
      return res.json({ success: false, message: 'OTP Expired' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetOtp = '';
    user.resetOtpExpireAt = 0;

    await user.save();
    return res.json({ success: true, message: 'Password has been reset successfully' });

  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};


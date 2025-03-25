import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";
import transporter from "../config/nodemailer.js";


export const register = async (req, res) => {
  const { 
    name, 
    email, 
    phone, // Added phone
    password, 
    confirmPassword, // Added confirm password
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

  // Check if passwords match
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

    const user = new userModel({
      name,
      email,
      phone, // Added phone
      password: hashedPassword,
      role,
      ...roleSpecificFields,
    });

    await user.save();
   
    const token = jwt.sign({ id: user._id.toString(), role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
    console.log("Register Token Generated:", token); // Debug log
  
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };

    res.cookie("token", token, cookieOptions);
    res.setHeader("Set-Cookie", `token=${token}; HttpOnly; Max-Age=${cookieOptions.maxAge}; SameSite=${cookieOptions.sameSite}; ${cookieOptions.secure ? "Secure" : ""}`); // Fallback
    console.log("Register Cookie Set with Options:", cookieOptions); // Debug log
    
    const mailOptions = {
      from: `SpiceSense <${process.env.SENDER_EMAIL}>`,
      to: email,
      subject: "Welcome to SpiceSense",
      text: `Welcome to SpiceSense! Your account has been created successfully with email: ${email}.`,
    };

    try {
      const emailResponse = await transporter.sendMail(mailOptions);
      console.log("Email sent successfully:", emailResponse.response);
    } catch (emailError) {
      console.error("Error sending email:", emailError.message);
    }

    return res.status(201).json({ success: true, message: "User registered successfully. Welcome email sent." });

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

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id.toString(), role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    console.log("Login Token Generated:", token); // Debug log

    // Set token in HTTP-only cookie
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    };

    res.cookie("token", token, cookieOptions);

    // Generate OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    user.verifyOtp = otp;
    user.verifyOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours expiry
    await user.save();

    // Email OTP to user
    const mailOptions = {
      from: `SpiceSense <${process.env.SENDER_EMAIL}>`,
      to: user.email,
      subject: "Account Verification OTP",
      text: `Your OTP is ${otp}. Verify your account using this OTP.`,
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({
      success: true,
      message: "Login successful. OTP sent to email.",
      userId: user._id,
    });

  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};



export const logout = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(400).json({ success: false, message: "User ID not found" });
    }

    const userId = req.user.id;
    await userModel.findByIdAndUpdate(userId, { isAccountVerified: false });

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/", // Ensure correct path
    };

    res.clearCookie("token", cookieOptions);
    res.setHeader("Set-Cookie", "token=; HttpOnly; Max-Age=0; SameSite=None; Path=/; Secure"); // Fallback for some browsers

    console.log("Logout Cookie Cleared with Options:", cookieOptions); // Debug log

    return res.status(200).json({ success: true, message: "Logged Out" });

  } catch (error) {
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

    // Generate JWT Token with consistent structure
    const token = jwt.sign(
      { 
        id: user._id.toString(), 
        role: user.role,
        email: user.email 
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: "7d" }
    );
    
    console.log("Verify Token Generated:", token);

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/" // Ensure cookie is available for all paths
    };

    res.cookie("token", token, cookieOptions);
    console.log("Cookie set in verification response:", token);

    user.isAccountVerified = true;
    user.verifyOtp = "";
    user.verifyOtpExpireAt = 0;

    await user.save();
    
    return res.json({ 
      success: true, 
      message: "Email verified successfully", 
      token: token, 
      userId: user._id.toString(),
      role: user.role
    });

  } catch (error) {
    console.error("verifyEmail error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
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
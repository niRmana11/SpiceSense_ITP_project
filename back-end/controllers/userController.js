import userModel from "../models/userModel.js";
import transporter from "../config/nodemailer.js";
import bcrypt from "bcryptjs";

export const getUserData = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: "Unauthorized: No user ID found" });
    }

    const userId = req.user.id;
    console.log("Getting data for user ID:", userId);

    const user = await userModel.findById(userId).select(
      "name email role phone isAccountVerified shippingAddress billingAddress companyName contactPerson jobTitle department"
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    console.log("User data found:", user);
    return res.json({ success: true, userData: user });
  } catch (error) {
    console.error("getUserData error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};



export const getAllUsers = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied. Admin only." });
    }

    const users = await userModel.find().select("-password -verifyOtp -resetOtp -resetOtpExpireAt");

    return res.json({ success: true, users });
  } catch (error) {
    console.error("getAllUsers error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const getUsersByRole = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied. Admin only." });
    }

    const { role } = req.params;

    if (!["admin", "supplier", "customer", "employee"].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role specified" });
    }

    const users = await userModel.find({ role }).select("-password -verifyOtp -resetOtp -resetOtpExpireAt");

    return res.json({ success: true, users });
  } catch (error) {
    console.error("getUsersByRole error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const updateUser = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ success: false, address: "Access denied. Admin only." });
    }

    const { userId } = req.params;
    const updateData = req.body;

    if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: "Invalid user ID format" });
    }

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    if (updateData.role && user.role === "admin" && updateData.role !== "admin") {
      const adminCount = await userModel.countDocuments({ role: "admin" });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: "Cannot change the role of the only admin",
        });
      }
    }

    const updatedUser = await userModel
      .findByIdAndUpdate(userId, updateData, { new: true, runValidators: true })
      .select("-password -verifyOtp -resetOtp -resetOtpExpireAt");

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "Failed to update user" });
    }

    if (user.email && process.env.SENDER_EMAIL) {
      const mailOptions = {
        from: `SpiceSense <${process.env.SENDER_EMAIL}>`,
        to: user.email,
        subject: "Your Account Has Been Updated",
        text: `Dear ${user.name || "User"},\n\nYour account information has been updated by an administrator.\n\nIf you did not request this change, please contact support immediately.\n\nRegards,\nSpiceSense Team`,
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log("Account update notification email sent to:", user.email);
      } catch (emailError) {
        console.error("Error sending email notification:", emailError);
      }
    }

    return res.json({
      success: true,
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("updateUser error:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const deleteUser = async (req, res) => {
  try {
    
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized: No user data" });
    }
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied. Admin only." });
    }

    const { userId } = req.params;

    
    if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: "Invalid user ID format" });
    }

    
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Prevent deleting the only admin
    if (user.role === "admin") {
      const adminCount = await userModel.countDocuments({ role: "admin" });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: "Cannot delete the only admin account",
        });
      }
      // Prevent logged-in admin from deleting themselves
      if (userId === req.user.id.toString()) {
        return res.status(400).json({
          success: false,
          message: "Cannot delete your own admin account while logged in",
        });
      }
    }

    
    const userEmail = user.email;
    const userName = user.name || "User";

    
    await userModel.findByIdAndDelete(userId);

    
    if (userEmail && process.env.SENDER_EMAIL) {
      const mailOptions = {
        from: `SpiceSense <${process.env.SENDER_EMAIL}>`,
        to: userEmail,
        subject: "Your Account Has Been Removed",
        text: `Dear ${userName},\n\nYour SpiceSense account has been removed by an administrator.\n\nIf you wish to continue using our services, please register for a new account.\n\nRegards,\nSpiceSense Team`,
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log("Account deletion notification email sent to:", userEmail);
      } catch (emailError) {
        console.error("Error sending email notification:", emailError);
      }
    } else {
      console.warn("Email notification skipped: Missing user email or SENDER_EMAIL");
    }

    return res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("deleteUser error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: "Unauthorized: No user ID found" });
    }

    const userId = req.user.id;
    const updateData = req.body;

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    delete updateData.email;
    delete updateData.role;
    delete updateData.password;
    delete updateData.isAccountVerified;

    const allowedFields = ["name", "phone"];

    switch (user.role) {
      case "customer":
        allowedFields.push("shippingAddress", "billingAddress");
        break;
      case "supplier":
        allowedFields.push("companyName", "contactPerson");
        break;
      case "employee":
        allowedFields.push("jobTitle", "department");
        break;
      default:
        break;
    }

    const filteredUpdateData = {};
    Object.keys(updateData).forEach((key) => {
      if (allowedFields.includes(key)) {
        filteredUpdateData[key] = updateData[key];
      }
    });

    const updatedUser = await userModel
      .findByIdAndUpdate(userId, filteredUpdateData, { new: true, runValidators: true })
      .select("-password -verifyOtp -resetOtp -resetOtpExpireAt");

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "Failed to update profile" });
    }

    return res.json({
      success: true,
      message: "Profile updated successfully",
      userData: updatedUser,
    });
  } catch (error) {
    console.error("updateUserProfile error:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};


export const toggleAccountStatus = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied. Admin only." });
    }

    const { userId } = req.params;
    const { isActive } = req.body;

    if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: "Invalid user ID format" });
    }

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.role === "admin" && !isActive) {
      const adminCount = await userModel.countDocuments({ role: "admin", isActive: true });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: "Cannot deactivate the only active admin account",
        });
      }
    }

    user.isActive = isActive;
    await user.save();

    const action = isActive ? "activated" : "deactivated";
    if (user.email && process.env.SENDER_EMAIL) {
      const mailOptions = {
        from: `SpiceSense <${process.env.SENDER_EMAIL}>`,
        to: user.email,
        subject: `Your Account Has Been ${action.charAt(0).toUpperCase() + action.slice(1)}`,
        text: `Dear ${user.name || "User"},\n\nYour SpiceSense account has been ${action} by an administrator.\n\n${
          isActive
            ? "You can now log in to your account."
            : "Please contact support if you believe this is an error."
        }\n\nRegards,\nSpiceSense Team`,
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log(`Account ${action} notification email sent to:`, user.email);
      } catch (emailError) {
        console.error("Error sending email notification:", emailError);
      }
    }

    return res.json({
      success: true,
      message: `User account ${action} successfully`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("toggleAccountStatus error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const getUserSummaryReport = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied. Admin only." });
    }

    const total = await userModel.countDocuments();
    const admins = await userModel.countDocuments({ role: "admin" });
    const suppliers = await userModel.countDocuments({ role: "supplier" });
    const customers = await userModel.countDocuments({ role: "customer" });
    const employees = await userModel.countDocuments({ role: "employee" });
    const active = await userModel.countDocuments({ isActive: true });
    const deactivated = await userModel.countDocuments({ isActive: false });

    const adminUsers = await userModel.find({ role: "admin" }).select("name email phone role isActive");
    const supplierUsers = await userModel.find({ role: "supplier" }).select("name email phone role isActive companyName");
    const customerUsers = await userModel.find({ role: "customer" }).select("name email phone role isActive shippingAddress");
    const employeeUsers = await userModel.find({ role: "employee" }).select("name email phone role isActive jobTitle");

    const summary = {
      total,
      admins,
      suppliers,
      customers,
      employees,
      active,
      deactivated,
      userDetails: {
        admins: adminUsers,
        suppliers: supplierUsers,
        customers: customerUsers,
        employees: employeeUsers,
      },
    };

    console.log("getUserSummaryReport: Summary:", summary);
    return res.json({ success: true, summary });
  } catch (error) {
    console.error("getUserSummaryReport error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// userController.js
export const createUser = async (req, res) => {
  try {
    // Verify that the requester is an admin
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied. Admin only." });
    }

    const {
      name,
      email,
      phone,
      password,
      role,
      companyName,
      contactPerson,
      jobTitle,
      department,
      shippingAddress,
      billingAddress,
    } = req.body;

    
    if (!name || !email || !phone || !password || !role) {
      return res.status(400).json({ success: false, message: "Name, email, phone, password, and role are required" });
    }

    
    if (!["admin", "supplier", "customer", "employee"].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role specified" });
    }

    
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Email already in use" });
    }

    
    const hashedPassword = await bcrypt.hash(password, 10);

    
    const userData = {
      name,
      email,
      phone,
      password: hashedPassword,
      role,
      companyName: role === "supplier" ? companyName : undefined,
      contactPerson: role === "supplier" ? contactPerson : undefined,
      jobTitle: role === "employee" ? jobTitle : undefined,
      department: role === "employee" ? department : undefined,
      shippingAddress: role === "customer" ? shippingAddress : undefined,
      billingAddress: role === "customer" ? billingAddress : undefined,
      isActive: true,
      isAccountVerified: false,
    };

    
    const newUser = await userModel.create(userData);

    
    if (newUser.email && process.env.SENDER_EMAIL) {
      const mailOptions = {
        from: `SpiceSense <${process.env.SENDER_EMAIL}>`,
        to: newUser.email,
        subject: "Welcome to SpiceSense!",
        text: `Dear ${newUser.name},\n\nYour account has been created successfully!\n\nRole: ${newUser.role}\nEmail: ${newUser.email}\nPassword: ${password}\n\nPlease log in to verify your account and start using our services. If you did not request this account, please contact support.\n\nRegards,\nSpiceSense Team`,
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log("Welcome email sent to:", newUser.email);
      } catch (emailError) {
        console.error("Error sending welcome email:", emailError);
      }
    } else {
      console.warn("Email notification skipped: Missing user email or SENDER_EMAIL");
    }


    
    const userResponse = await userModel
      .findById(newUser._id)
      .select("-password -verifyOtp -resetOtp -resetOtpExpireAt");

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      user: userResponse,
    });
  } catch (error) {
    console.error("createUser error:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
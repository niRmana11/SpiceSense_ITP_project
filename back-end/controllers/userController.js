// SPICESENSE/back-end/controllers/userController.js

import userModel from "../models/userModel.js";
import transporter from "../config/nodemailer.js";
import bcrypt from "bcryptjs";

export const getUserData = async (req, res) => {
  try {
    // Extract userId from the JWT payload properly
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: "Unauthorized: No user ID found" });
    }

    const userId = req.user.id;
    console.log("Getting data for user ID:", userId);

    // Find user and include role in the response
    const user = await userModel.findById(userId).select("name email role phone isAccountVerified shippingAddress billingAddress companyName contactPerson jobTitle department");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    console.log("User data found:", user);
    return res.json({ success: true, userData: user });

  } catch (error) {
    console.error("getUserData error:", error.message);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Get all users (admin only)
export const getAllUsers = async (req, res) => {
  try {
    // Verify that the requester is an admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: "Access denied. Admin only." });
    }

    // Get all users excluding sensitive data like password
    const users = await userModel.find().select("-password -verifyOtp -resetOtp -resetOtpExpireAt");
    
    return res.json({ success: true, users });

  } catch (error) {
    console.error("getAllUsers error:", error.message);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Get users by role (admin only)
export const getUsersByRole = async (req, res) => {
  try {
    // Verify that the requester is an admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: "Access denied. Admin only." });
    }

    const { role } = req.params;
    
    // Validate role
    if (!['admin', 'supplier', 'customer', 'employee'].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role specified" });
    }

    // Get users by role excluding sensitive data
    const users = await userModel.find({ role }).select("-password -verifyOtp -resetOtp -resetOtpExpireAt");
    
    return res.json({ success: true, users });

  } catch (error) {
    console.error("getUsersByRole error:", error.message);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Update user (admin only)
export const updateUser = async (req, res) => {
  try {
    // Verify that the requester is an admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: "Access denied. Admin only." });
    }

    const { userId } = req.params;
    const updateData = req.body;
    
    // Find user first to get their email
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    // Handle password update if provided
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }
    
    // Prevent role change for the only admin (optional safety feature)
    if (updateData.role && user.role === 'admin' && updateData.role !== 'admin') {
      const adminCount = await userModel.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({ 
          success: false, 
          message: "Cannot change the role of the only admin" 
        });
      }
    }
    
    // Update the user
    const updatedUser = await userModel.findByIdAndUpdate(
      userId, 
      updateData, 
      { new: true, runValidators: true }
    ).select("-password -verifyOtp -resetOtp -resetOtpExpireAt");
    
    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "Failed to update user" });
    }
    
    // Send email notification
    const mailOptions = {
      from: `SpiceSense <${process.env.SENDER_EMAIL}>`,
      to: user.email,
      subject: "Your Account Has Been Updated",
      text: `Dear ${user.name},\n\nYour account information has been updated by an administrator.\n\nIf you did not request this change, please contact support immediately.\n\nRegards,\nSpiceSense Team`,
    };
    
    try {
      await transporter.sendMail(mailOptions);
      console.log("Account update notification email sent");
    } catch (emailError) {
      console.error("Error sending email notification:", emailError);
      // Continue with the response even if email fails
    }
    
    return res.json({ 
      success: true, 
      message: "User updated successfully",
      user: updatedUser
    });
    
  } catch (error) {
    console.error("updateUser error:", error.message);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Delete user (admin only)
export const deleteUser = async (req, res) => {
  try {
    // Verify that the requester is an admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: "Access denied. Admin only." });
    }

    const { userId } = req.params;
    
    // Find user first to get their email
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    // Prevent deleting the only admin (optional safety feature)
    if (user.role === 'admin') {
      const adminCount = await userModel.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({ 
          success: false, 
          message: "Cannot delete the only admin account" 
        });
      }
    }
    
    // Store email before deleting
    const userEmail = user.email;
    const userName = user.name;
    
    // Delete the user
    await userModel.findByIdAndDelete(userId);
    
    // Send email notification
    const mailOptions = {
      from: `SpiceSense <${process.env.SENDER_EMAIL}>`,
      to: userEmail,
      subject: "Your Account Has Been Removed",
      text: `Dear ${userName},\n\nYour SpiceSense account has been removed by an administrator.\n\nIf you wish to continue using our services, please register for a new account.\n\nRegards,\nSpiceSense Team`,
    };
    
    try {
      await transporter.sendMail(mailOptions);
      console.log("Account deletion notification email sent");
    } catch (emailError) {
      console.error("Error sending email notification:", emailError);
      // Continue with the response even if email fails
    }
    
    return res.json({ 
      success: true, 
      message: "User deleted successfully and notification email sent"
    });
    
  } catch (error) {
    console.error("deleteUser error:", error.message);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
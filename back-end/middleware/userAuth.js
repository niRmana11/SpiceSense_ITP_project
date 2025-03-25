
// SPICESENSE/back-end/middleware/userAuth.js

import jwt from "jsonwebtoken";

const userAuth = async (req, res, next) => {
  const { token } = req.cookies;
  console.log("Token from cookies:", token); // Debug log

  if (!token) {
    return res.status(401).json({ success: false, message: "Not Authorized. Login Again" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded token:", decoded); // Debug log
    
    // Fix: Extract id correctly based on the token format
    const userId = decoded.id;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: "Invalid Token" });
    }
    
    // Store the full decoded object in req.user (not just the ID)
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Token verification error:", error.message);
    return res.status(401).json({ success: false, message: "Invalid or Expired Token" });
  }
};

export default userAuth;
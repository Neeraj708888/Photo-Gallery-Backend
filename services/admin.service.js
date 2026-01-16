import CryptoJS from "crypto-js";
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.model.js"; // ✅ ensure correct path and filename
import TokenBlacklistModel from "../models/TokenBlacklist.model.js";

// Admin Register Service
export const adminRegisterService = async ({ email, password }) => {
  try {
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return { success: false, message: "Email already registered!" };
    }

    // Encrypt password
    const encryptedPassword = CryptoJS.AES.encrypt(
      password,
      process.env.PASS_SEC_KEY
    ).toString();

    // Create admin
    const newAdmin = new Admin({
      email,
      password: encryptedPassword,
    });

    const savedAdmin = await newAdmin.save();

    return {
      success: true,
      message: "Admin created successfully!",
      admin: savedAdmin,
    };
  } catch (error) {
    return {
      success: false,
      message: "Register service error!",
      error: error.message,
    };
  }
};

//  Admin Login Service
export const adminLoginService = async (email, password) => {
  try {
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return { success: false, message: "Invalid email or password!" };
    }

    const decryptedPassword = CryptoJS.AES.decrypt(
      admin.password,
      process.env.PASS_SEC_KEY
    ).toString(CryptoJS.enc.Utf8);

    if (decryptedPassword !== password) {
      return { success: false, message: "Invalid email or password!" };
    }

    const token = jwt.sign(
      {
        id: admin._id,
        isAdmin: admin.isAdmin,
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "3d" }
    );

    const { password: pwd, ...others } = admin._doc;

    return {
      success: true,
      message: "Login successful!",
      admin: others,
      token,
    };
  } catch (error) {
    return { success: false, message: "Login service error!", error: error.message };
  }
};

// Admin Logout Service
export const logoutAdmin = async (token) => {
  try {
    if (!token) return { success: false, message: 'Token is missing !' };

    const decodedToken = jwt.decode(token);
    const expiry = decodedToken?.exp ? new Date(decodedToken.exp * 1000) : null;

    await TokenBlacklistModel.create({
      token,
      expiresAt: expiry,
    });

    return { success: true, message: 'Logout Successfully !' }
  } catch (error) {
    return {
      success: false,
      message: "Logout service error occured !",
      error: error.message
    }
  }
};

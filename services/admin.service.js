import CryptoJS from "crypto-js";
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.model.js"; // ✅ ensure correct path and filename
import TokenBlacklistModel from "../models/TokenBlacklist.model.js"; 

// Register Service Function
// export const registerAdmin = async (req, res) => {
// try {
//     const existingAdmin = await AdminModel.findOne({ email: req.body.email });
//     if (existingAdmin) {
//       return res.status(400).json({ message: "Email already registered!" });
//     }

//     const encryptedPassword = CryptoJS.AES.encrypt(
//       req.body.password,
//       process.env.PASS_SEC_KEY
//     ).toString();

//     const newAdmin = new Admin({
//       email: req.body.email,
//       password: encryptedPassword,
//     });

//     const savedAdmin = await newAdmin.save();
//     res.status(201).json({
//       success: true,
//       message: "Admin created successfully!",
//       admin: savedAdmin,
//     });
//   } catch (error) {
//     console.error("❌ Error saving admin:", error);
//     res.status(500).json({
//       message: "Internal server error. Please try again later.",
//     });
//   }
// }

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


// Login Admin Service
// export const loginAdmin = async (req, res) => {
// try {
//     const admin = await AdminModel.findOne({ email: req.body.email });
//     if (!admin) {
//       return res.status(401).json({ message: "Invalid email or password!" });
//     }

//     const decryptedPassword = CryptoJS.AES.decrypt(
//       admin.password,
//       process.env.PASS_SEC_KEY
//     ).toString(CryptoJS.enc.Utf8);

//     console.log("Decrypted Password:", decryptedPassword); // Debugging line
//     console.log("Entered Password:", req.body.password); // Debugging line

//     if (decryptedPassword !== req.body.password) {
//       return res.status(401).json({ message: "Invalid email or password!" });
//     }


//     const accessToken = jwt.sign(
//       {
//         id: admin._id,
//         isAdmin: admin.isAdmin,
//       },
//       process.env.JWT_SECRET_KEY,
//       { expiresIn: "3d" }
//     );

//     const { password, ...others } = admin._doc;

//     res.status(200).json({
//       success: true,
//       message: "Login successful!",
//       admin: { ...others },
//       token: accessToken,
//     });
//   } catch (error) {
//     console.error("❌ Login error:", error);
//     res
//       .status(500)
//       .json({ message: "Internal server error during login!" });
//   }
// }

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


// Logout Admin Service
export const logoutAdmin = async (token) => {
  try {
    if (!token) return  { success: false, message: 'Token is missing !'};

    const decodedToken = jwt.decode(token);
    const expiry = decodedToken?.exp ? new Date(decodedToken.exp * 1000) : null;

    await TokenBlacklistModel.create({
        token, 
        expiresAt: expiry,
    });

    return { success: true, message: 'Logout Successfully !'}
  } catch (error) {
    return {
        success: false,
        message: "Logout service error occured !",
        error: error.message
    }
  }
};

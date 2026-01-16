import {
  adminRegisterService,
  adminLoginService,
  logoutAdmin
} from "../../services/admin.service.js";

// 🟢 Register Admin
export const registerAdmin = async (req, res) => {
  try {
    console.log("HEADERS:", req.headers["content-type"]);
    console.log("BODY =>", req.body);
    const { email, password } = req.body;

    const result = await adminRegisterService({ email, password });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(201).json(result);

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};


// 🟡 Login Admin
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const response = await adminLoginService(email, password);

    if (!response.success) {
      return res.status(400).json(response);
    }

    return res.status(200).json(response);

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};


// 🔴 Logout Admin
export const adminLogout = async (req, res) => {
  try {
    // ⭐ FIX: Token should come from verifyToken middleware, not headers
    const token = req.token; // 👍 Cleaner & recommended

    const response = await logoutAdmin(token);

    if (!response.success) {
      return res.status(400).json(response);
    }

    return res.status(200).json(response);

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};


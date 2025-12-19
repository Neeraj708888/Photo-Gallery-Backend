import express from "express";
import { verifyToken } from "../../middlewares/auth.middlewares.js";

import { 
  adminRegisterService, 
  adminLoginService,  
  logoutAdmin 
} from "../../services/admin.service.js";

const router = express.Router();


// 🟢 Register Admin
router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await adminRegisterService({ email, password });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(201).json(result);

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});


// 🟡 Login Admin
router.post("/login", async (req, res) => {
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
});


// 🔴 Logout Admin
router.post("/logout", verifyToken, async (req, res) => {
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
});


export default router;

import express from "express";
import { adminLogin, adminLogout, registerAdmin } from "../../controllers/Auth/admin.controller.js"
import { verifyToken } from "../../middlewares/auth.middlewares.js";

const router = express.Router();

router.post("/register", registerAdmin);
router.post("/login", adminLogin);
router.post("/logout", verifyToken, adminLogout);

export default router;
import express from "express";
import { changePasswordUser, loginUser, registerUser, verifyTokenUser } from "../controllers/userController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/login", loginUser);
router.post("/register", registerUser);
router.post("/verifyToken", requireAuth, verifyTokenUser);
router.post("/changePassword", requireAuth, changePasswordUser);
export default router;
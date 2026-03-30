import express from "express";
import { changePasswordUser, loginUser, registerUser, verifyTokenUser } from "../controllers/userController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { loginRateLimiter, registerRateLimiter } from "../middlewares/rateLimitMiddleware.js";

const router = express.Router();

router.post("/login", loginRateLimiter, loginUser);
router.post("/register", registerRateLimiter, registerUser);
router.post("/verifyToken", requireAuth, verifyTokenUser);
router.post("/changePassword", requireAuth, changePasswordUser);
export default router;
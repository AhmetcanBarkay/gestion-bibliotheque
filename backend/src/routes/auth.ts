import express from "express";
import { loginUser, registerUser, verifyTokenUser } from "../controllers/userController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/login", loginUser);
router.post("/register", registerUser);
router.post("/verifyToken", requireAuth, verifyTokenUser);
export default router;
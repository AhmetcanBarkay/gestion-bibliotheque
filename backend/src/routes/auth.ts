import express from "express";
import { loginUser, verifyTokenUser } from "../controllers/userController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/login", loginUser);
router.post("/verifyToken", requireAuth, verifyTokenUser);
export default router;
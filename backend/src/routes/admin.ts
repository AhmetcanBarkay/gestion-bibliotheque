import express from "express";
import { createBibliothecaire, deleteBibliothecaire, getBibliothecaires } from "../controllers/adminController.js";
import { requireAdmin, requireAuth } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/bibliothecaire/create", requireAuth, requireAdmin, createBibliothecaire);
router.post("/bibliothecaire/delete", requireAuth, requireAdmin, deleteBibliothecaire);
router.get("/bibliothecaires", requireAuth, requireAdmin, getBibliothecaires);

export default router;

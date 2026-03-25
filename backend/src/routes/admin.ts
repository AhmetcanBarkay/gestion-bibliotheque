import express from "express";
import { createBibliothecaire, deleteBibliothecaire, getBibliothecaires } from "../controllers/adminController.js";

const router = express.Router();

router.post("/bibliothecaire/create", createBibliothecaire);
router.post("/bibliothecaire/delete", deleteBibliothecaire);
router.get("/bibliothecaires", getBibliothecaires);

export default router;

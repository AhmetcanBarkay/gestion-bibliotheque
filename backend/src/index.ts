import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import auth from './routes/auth.js';
import admin from './routes/admin.js';

import dotenv from 'dotenv';
import { requireAdmin, requireAuth } from './middlewares/authMiddleware.js';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// routes
app.use('/auth', auth);
app.use('/admin', requireAuth, requireAdmin, admin);

// non trouvée
app.use((req: Request, res: Response) => {
    res.status(404).json({
        error: 'Route non trouvée'
    });
});

app.listen(PORT, () => {
    console.log(`Serveur local démarré sur le port ${PORT}`);
});

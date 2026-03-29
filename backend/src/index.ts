import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import auth from './routes/auth.js';
import admin from './routes/admin.js';
import bibliothecaire from './routes/bibliothecaire.js';
import client from './routes/client.js';
import { initDatabase } from './db/initDatabase.js';

import { requireAdmin, requireAuth, requireBibliothecaire, requireClient } from './middlewares/authMiddleware.js';

const app = express();
const PORT = process.env.PORT || 3000;

// middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// routes
app.use('/auth', auth);
app.use('/admin', requireAuth, requireAdmin, admin);
app.use('/bibliothecaire', requireAuth, requireBibliothecaire, bibliothecaire);
app.use('/client', requireAuth, requireClient, client);

// non trouvée
app.use((req: Request, res: Response) => {
    res.status(404).json({
        error: 'Route non trouvée'
    });
});

async function startServer() {
    await initDatabase();
    app.listen(PORT, () => {
        console.log(`Serveur local démarré sur le port ${PORT}`);
    });
}

startServer().catch((error) => {
    console.error('Erreur de demarrage du serveur:', error);
    process.exit(1);
});

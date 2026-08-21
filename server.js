// server.js

import 'dotenv/config'; // charge .env AVANT les autres modules

import express, { json } from 'express';
import { testConnection } from './src/db.js'; // On importe la fonction de test
import routes from './src/routes/index.js';

const app = express();
app.use(json());
app.use(routes);

const PORT = process.env.PORT || 3000;

// Fonction principale async pour gérer l'ordre des opérations
const startServer = async () => {
  // 1. Tester la DB avant tout
  const isDbConnected = await testConnection();

  if (!isDbConnected) {
    console.error('Arrêt du serveur car la base de données est inaccessible.');
    process.exit(1); // Arrête le processus Node avec un code d'erreur
  }

  // 2. Si la DB est OK, on lance le serveur HTTP
  app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  });
};

startServer();
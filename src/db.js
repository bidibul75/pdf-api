// src/db.js
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  // utile si la connexion reste ouverte trop longtemps sur mutualisé :
  max: 5,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Erreur inattendue sur le client PostgreSQL inactif', err);
  process.exit(-1);
});

// Fonction pour tester la connexion
export const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Connexion à la base de données établie avec succès.');
    client.release(); // On libère le client immédiatement
    return true;
  } catch (err) {
    console.error('❌ Échec de la connexion à la base de données:', err.message);
    return false;
  }
};

export default pool;
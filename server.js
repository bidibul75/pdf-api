// server.js

import dotenv from 'dotenv';
dotenv.config();

import express, { json } from 'express';
import routes from './src/routes/index.js';

const app = express();
app.use(json());

app.use(routes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
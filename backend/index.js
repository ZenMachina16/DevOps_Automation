import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import scanRouter from './src/routes/scan.js';

dotenv.config();

const app = express();

app.use(cors({
  origin: 'http://localhost:3000',
}));

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', scanRouter);

const PORT = process.env.PORT ?? 5000;
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on port ${PORT}`);
});



// src/app.ts

import express from 'express';
import bodyParser from 'body-parser';
import authRoutes from './routes/auth';
import bookRoutes from './routes/books';

const app = express();

app.use(bodyParser.json());
app.use('/auth', authRoutes);
app.use('/books', bookRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

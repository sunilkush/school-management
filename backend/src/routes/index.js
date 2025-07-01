// routes/index.js
import express from 'express';
const router = express.Router();

router.get('/', (req, res) => {
  res.render('index', { title: 'Welcome to Express App' });
});

export default router;

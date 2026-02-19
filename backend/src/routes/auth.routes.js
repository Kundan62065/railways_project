import express from 'express';
import { register, login, refreshToken, getCurrentUser, logout } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.get('/me', authenticate, getCurrentUser);
router.post('/logout', authenticate, logout);

export default router;

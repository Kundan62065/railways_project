import express from 'express';
import { getDashboardStats, getRecentActivities, getAlertsSummary } from '../controllers/dashboard.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);
router.get('/stats', getDashboardStats);
router.get('/recent-activities', getRecentActivities);
router.get('/alerts-summary', getAlertsSummary);

export default router;

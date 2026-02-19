import express from 'express';
import { createShift, getShiftById, listShifts, updateShift, deleteShift, getActiveShiftsSummary } from '../controllers/shift.controller.js';
import { submitAlertResponse, getShiftAlertHistory, completeShiftController } from '../controllers/alert.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/active/summary', getActiveShiftsSummary);
router.get('/', listShifts);
router.post('/', authorize('ADMIN', 'SUPERADMIN'), createShift);
router.get('/:id', getShiftById);
router.patch('/:id', authorize('ADMIN', 'SUPERADMIN'), updateShift);
router.delete('/:id', authorize('SUPERADMIN'), deleteShift);
router.get('/:id/alerts', getShiftAlertHistory);
router.post('/:id/alert-response', authorize('ADMIN', 'SUPERADMIN'), submitAlertResponse);
router.post('/:id/complete', authorize('ADMIN', 'SUPERADMIN'), completeShiftController);

export default router;

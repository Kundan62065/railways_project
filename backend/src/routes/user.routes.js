import express from 'express';
import { getAllUsers, getPendingRequests, getUserById, approveUser, rejectUser, changeUserRole, updateUser, activateUser, deactivateUser, deleteUser } from '../controllers/user.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize('ADMIN', 'SUPERADMIN'));

router.get('/', getAllUsers);
router.get('/pending', getPendingRequests);
router.get('/:id', getUserById);
router.patch('/:id', updateUser);
router.delete('/:id', authorize('SUPERADMIN'), deleteUser);
router.post('/:id/approve', authorize('SUPERADMIN'), approveUser);
router.post('/:id/reject', authorize('SUPERADMIN'), rejectUser);
router.patch('/:id/role', authorize('SUPERADMIN'), changeUserRole);
router.patch('/:id/activate', activateUser);
router.patch('/:id/deactivate', deactivateUser);

export default router;

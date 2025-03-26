import express from 'express';
import { 
  getUserData, 
  getAllUsers, 
  getUsersByRole, 
  updateUser, 
  deleteUser, 
  updateUserProfile
} from '../controllers/userController.js';
import userAuth from '../middleware/userAuth.js';

const userRouter = express.Router();

// Existing route
userRouter.get('/data', userAuth, getUserData);

// New admin routes
userRouter.get('/all', userAuth, getAllUsers); // Get all users (admin only)
userRouter.get('/role/:role', userAuth, getUsersByRole); // Get users by role (admin only)
userRouter.put('/update/:userId', userAuth, updateUser); // Update a user (admin only)
userRouter.delete('/delete/:userId', userAuth, deleteUser); // Delete a user (admin only)
userRouter.put('/update-profile', userAuth, updateUserProfile);

export default userRouter;
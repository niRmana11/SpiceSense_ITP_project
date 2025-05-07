import express from 'express';
import { 
  getUserData, 
  getAllUsers, 
  getUsersByRole, 
  updateUser, 
  deleteUser, 
  updateUserProfile,
  toggleAccountStatus,
  getUserSummaryReport,
  createUser
} from '../controllers/userController.js';
import userAuth from '../middleware/userAuth.js';

const userRouter = express.Router();


userRouter.get('/data', userAuth, getUserData);


userRouter.get('/all', userAuth, getAllUsers); 
userRouter.get('/role/:role', userAuth, getUsersByRole); 
userRouter.put('/update/:userId', userAuth, updateUser); 
userRouter.delete('/delete/:userId', userAuth, deleteUser); 
userRouter.put('/update-profile', userAuth, updateUserProfile);
userRouter.put('/toggle-status/:userId', userAuth,toggleAccountStatus);
userRouter.get("/reports/summary", userAuth, getUserSummaryReport); 
userRouter.post('/create-user', userAuth, createUser);

export default userRouter;
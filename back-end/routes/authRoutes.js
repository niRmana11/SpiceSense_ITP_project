import express from 'express';
import { login, logout, register, resetPassword, sendResetOtp, verifyEmail,} from '../controllers/authController.js';
import userAuth from '../middleware/userAuth.js';

const authRouter = express.Router();

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/logout', userAuth, logout);
authRouter.post('/verify-account', verifyEmail); // Remove userAuth middleware
authRouter.post('/send-reset-otp', sendResetOtp);
authRouter.post('/reset-password', resetPassword);

export default authRouter;
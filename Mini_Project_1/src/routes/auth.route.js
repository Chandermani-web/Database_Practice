import express from 'express';
import { login, signup } from '../controllers/auth.controller.js';
import { profile } from '../controllers/profile.controller.js';
import { loggedIn } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post("/register", signup);
router.post("/login", login);

router.post("/profile", loggedIn, profile);

export default router;
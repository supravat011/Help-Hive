import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthService } from '../services/authService.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { UserModel } from '../models/User.js';

const router = Router();

// Register
router.post(
    '/register',
    [
        body('email').isEmail().normalizeEmail(),
        body('password').isLength({ min: 6 }),
        body('full_name').trim().notEmpty(),
        body('role').isIn(['user', 'volunteer']),
        body('phone').optional().trim(),
        body('latitude').optional().isFloat(),
        body('longitude').optional().isFloat()
    ],
    async (req, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const result = await AuthService.register(req.body);
            res.status(201).json(result);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }
);

// Login
router.post(
    '/login',
    [
        body('email').isEmail().normalizeEmail(),
        body('password').notEmpty()
    ],
    async (req, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const result = await AuthService.login(req.body);
            res.json(result);
        } catch (error: any) {
            res.status(401).json({ error: error.message });
        }
    }
);

// Get current user
router.get('/me', authenticateToken, (req: AuthRequest, res: Response) => {
    try {
        const user = AuthService.getUserById(req.userId!);
        res.json(user);
    } catch (error: any) {
        res.status(404).json({ error: error.message });
    }
});

// Update profile
router.put(
    '/profile',
    authenticateToken,
    [
        body('full_name').optional().trim().notEmpty(),
        body('phone').optional().trim()
    ],
    (req: AuthRequest, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            UserModel.updateProfile(req.userId!, req.body);
            const user = AuthService.getUserById(req.userId!);
            res.json(user);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }
);

// Update location
router.put(
    '/location',
    authenticateToken,
    [
        body('latitude').isFloat({ min: -90, max: 90 }),
        body('longitude').isFloat({ min: -180, max: 180 })
    ],
    (req: AuthRequest, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            UserModel.updateLocation(req.userId!, req.body.latitude, req.body.longitude);
            res.json({ message: 'Location updated successfully' });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }
);

export default router;

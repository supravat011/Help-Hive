import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { HelpRequestModel } from '../models/HelpRequest.js';

const router = Router();

// Get user's created requests
router.get('/my-requests', authenticateToken, (req: AuthRequest, res: Response) => {
    try {
        const requests = HelpRequestModel.findAll({ userId: req.userId });
        res.json(requests);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get volunteer's accepted requests
router.get('/my-responses', authenticateToken, (req: AuthRequest, res: Response) => {
    try {
        const requests = HelpRequestModel.findByVolunteer(req.userId!);
        res.json(requests);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;

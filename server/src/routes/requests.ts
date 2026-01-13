import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { HelpRequestModel } from '../models/HelpRequest.js';
import { UserModel } from '../models/User.js';
import { addDistanceToRequests } from '../services/locationService.js';

const router = Router();

// Get all help requests (with distance calculation)
router.get('/', authenticateToken, (req: AuthRequest, res: Response) => {
    try {
        // Expire old requests first
        HelpRequestModel.expireOldRequests();

        const status = req.query.status as string | undefined;
        const requests = HelpRequestModel.findAll({ status });

        // Get current user's location
        const user = UserModel.findById(req.userId!);

        // Add distance and user name to each request
        const enrichedRequests = requests.map(request => {
            const requestUser = UserModel.findById(request.user_id);
            return {
                ...request,
                userName: requestUser?.full_name || 'Unknown User'
            };
        });

        // Calculate distances
        const requestsWithDistance = addDistanceToRequests(
            enrichedRequests,
            user?.latitude || null,
            user?.longitude || null
        );

        res.json(requestsWithDistance);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get single help request
router.get('/:id', authenticateToken, (req: AuthRequest, res: Response) => {
    try {
        const request = HelpRequestModel.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }

        const requestUser = UserModel.findById(request.user_id);
        const enrichedRequest = {
            ...request,
            userName: requestUser?.full_name || 'Unknown User'
        };

        res.json(enrichedRequest);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Create new help request
router.post(
    '/',
    authenticateToken,
    [
        body('title').trim().notEmpty().isLength({ max: 200 }),
        body('description').trim().notEmpty().isLength({ max: 2000 }),
        body('help_type').isIn(['medical', 'transport', 'shelter', 'supplies', 'other']),
        body('urgency_level').isIn(['high', 'medium', 'low']),
        body('location_name').trim().notEmpty(),
        body('latitude').isFloat({ min: -90, max: 90 }),
        body('longitude').isFloat({ min: -180, max: 180 }),
        body('expires_in_hours').optional().isInt({ min: 1, max: 72 })
    ],
    (req: AuthRequest, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const expiresInHours = req.body.expires_in_hours || 24;
            const expires_at = Date.now() + expiresInHours * 60 * 60 * 1000;

            const request = HelpRequestModel.create({
                user_id: req.userId!,
                title: req.body.title,
                description: req.body.description,
                help_type: req.body.help_type,
                urgency_level: req.body.urgency_level,
                location_name: req.body.location_name,
                latitude: req.body.latitude,
                longitude: req.body.longitude,
                expires_at
            });

            res.status(201).json(request);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }
);

// Accept help request (volunteers only)
router.put('/:id/accept', authenticateToken, (req: AuthRequest, res: Response) => {
    try {
        const request = HelpRequestModel.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }

        if (request.status !== 'open') {
            return res.status(400).json({ error: 'Request is not available' });
        }

        // Check if user is a volunteer
        const user = UserModel.findById(req.userId!);
        if (user?.role !== 'volunteer') {
            return res.status(403).json({ error: 'Only volunteers can accept requests' });
        }

        HelpRequestModel.updateStatus(req.params.id, 'accepted', req.userId!);
        const updatedRequest = HelpRequestModel.findById(req.params.id);

        res.json(updatedRequest);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// Complete help request
router.put('/:id/complete', authenticateToken, (req: AuthRequest, res: Response) => {
    try {
        const request = HelpRequestModel.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }

        // Only the creator or assigned volunteer can complete
        if (request.user_id !== req.userId && request.volunteer_id !== req.userId) {
            return res.status(403).json({ error: 'Not authorized to complete this request' });
        }

        HelpRequestModel.updateStatus(req.params.id, 'completed');
        const updatedRequest = HelpRequestModel.findById(req.params.id);

        res.json(updatedRequest);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// Delete/cancel help request
router.delete('/:id', authenticateToken, (req: AuthRequest, res: Response) => {
    try {
        const request = HelpRequestModel.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }

        // Only the creator can delete
        if (request.user_id !== req.userId) {
            return res.status(403).json({ error: 'Not authorized to delete this request' });
        }

        HelpRequestModel.delete(req.params.id);
        res.json({ message: 'Request deleted successfully' });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

export default router;

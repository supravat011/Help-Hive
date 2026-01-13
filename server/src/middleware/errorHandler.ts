import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Error:', err);

    if (err.name === 'ValidationError') {
        return res.status(400).json({ error: err.message });
    }

    if (err.code === 'SQLITE_CONSTRAINT') {
        return res.status(409).json({ error: 'Database constraint violation' });
    }

    res.status(500).json({ error: 'Internal server error' });
};

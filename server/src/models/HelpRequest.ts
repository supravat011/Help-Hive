import db from '../config/database.js';
import { randomUUID } from 'crypto';

export interface HelpRequest {
    id: string;
    user_id: string;
    title: string;
    description: string;
    help_type: 'medical' | 'transport' | 'shelter' | 'supplies' | 'other';
    urgency_level: 'high' | 'medium' | 'low';
    location_name: string;
    latitude: number;
    longitude: number;
    status: 'open' | 'accepted' | 'completed' | 'expired';
    volunteer_id: string | null;
    created_at: number;
    expires_at: number;
    completed_at: number | null;
}

export interface HelpRequestCreate {
    user_id: string;
    title: string;
    description: string;
    help_type: 'medical' | 'transport' | 'shelter' | 'supplies' | 'other';
    urgency_level: 'high' | 'medium' | 'low';
    location_name: string;
    latitude: number;
    longitude: number;
    expires_at: number;
}

export class HelpRequestModel {
    static create(data: HelpRequestCreate): HelpRequest {
        const id = randomUUID();
        const now = Date.now();

        const stmt = db.prepare(`
      INSERT INTO help_requests (
        id, user_id, title, description, help_type, urgency_level,
        location_name, latitude, longitude, status, volunteer_id,
        created_at, expires_at, completed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', NULL, ?, ?, NULL)
    `);

        stmt.run(
            id,
            data.user_id,
            data.title,
            data.description,
            data.help_type,
            data.urgency_level,
            data.location_name,
            data.latitude,
            data.longitude,
            now,
            data.expires_at
        );

        return this.findById(id)!;
    }

    static findById(id: string): HelpRequest | null {
        const stmt = db.prepare('SELECT * FROM help_requests WHERE id = ?');
        return stmt.get(id) as HelpRequest | null;
    }

    static findAll(filters?: { status?: string; userId?: string }): HelpRequest[] {
        let query = 'SELECT * FROM help_requests WHERE 1=1';
        const params: any[] = [];

        if (filters?.status) {
            query += ' AND status = ?';
            params.push(filters.status);
        }

        if (filters?.userId) {
            query += ' AND user_id = ?';
            params.push(filters.userId);
        }

        query += ' ORDER BY created_at DESC';

        const stmt = db.prepare(query);
        return stmt.all(...params) as HelpRequest[];
    }

    static findByVolunteer(volunteerId: string): HelpRequest[] {
        const stmt = db.prepare(`
      SELECT * FROM help_requests 
      WHERE volunteer_id = ? 
      ORDER BY created_at DESC
    `);
        return stmt.all(volunteerId) as HelpRequest[];
    }

    static updateStatus(id: string, status: HelpRequest['status'], volunteerId?: string): void {
        const updates: string[] = ['status = ?'];
        const params: any[] = [status];

        if (volunteerId) {
            updates.push('volunteer_id = ?');
            params.push(volunteerId);
        }

        if (status === 'completed') {
            updates.push('completed_at = ?');
            params.push(Date.now());
        }

        params.push(id);

        const stmt = db.prepare(`
      UPDATE help_requests SET ${updates.join(', ')} WHERE id = ?
    `);
        stmt.run(...params);
    }

    static expireOldRequests(): number {
        const stmt = db.prepare(`
      UPDATE help_requests 
      SET status = 'expired' 
      WHERE status = 'open' AND expires_at < ?
    `);
        const result = stmt.run(Date.now());
        return result.changes;
    }

    static delete(id: string): void {
        const stmt = db.prepare('DELETE FROM help_requests WHERE id = ?');
        stmt.run(id);
    }
}

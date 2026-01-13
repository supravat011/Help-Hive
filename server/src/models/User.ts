import db from '../config/database.js';
import { randomUUID } from 'crypto';

export interface User {
    id: string;
    email: string;
    password_hash: string;
    full_name: string;
    phone: string | null;
    role: 'user' | 'volunteer';
    is_verified: number;
    latitude: number | null;
    longitude: number | null;
    created_at: number;
    updated_at: number;
}

export interface UserCreate {
    email: string;
    password_hash: string;
    full_name: string;
    phone?: string;
    role: 'user' | 'volunteer';
    latitude?: number;
    longitude?: number;
}

export class UserModel {
    static create(userData: UserCreate): User {
        const id = randomUUID();
        const now = Date.now();

        const stmt = db.prepare(`
      INSERT INTO users (id, email, password_hash, full_name, phone, role, is_verified, latitude, longitude, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)
    `);

        stmt.run(
            id,
            userData.email,
            userData.password_hash,
            userData.full_name,
            userData.phone || null,
            userData.role,
            userData.latitude || null,
            userData.longitude || null,
            now,
            now
        );

        return this.findById(id)!;
    }

    static findById(id: string): User | null {
        const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
        return stmt.get(id) as User | null;
    }

    static findByEmail(email: string): User | null {
        const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
        return stmt.get(email) as User | null;
    }

    static updateLocation(userId: string, latitude: number, longitude: number): void {
        const stmt = db.prepare(`
      UPDATE users SET latitude = ?, longitude = ?, updated_at = ? WHERE id = ?
    `);
        stmt.run(latitude, longitude, Date.now(), userId);
    }

    static updateProfile(userId: string, updates: Partial<Pick<User, 'full_name' | 'phone'>>): void {
        const fields: string[] = [];
        const values: any[] = [];

        if (updates.full_name) {
            fields.push('full_name = ?');
            values.push(updates.full_name);
        }
        if (updates.phone !== undefined) {
            fields.push('phone = ?');
            values.push(updates.phone);
        }

        if (fields.length === 0) return;

        fields.push('updated_at = ?');
        values.push(Date.now());
        values.push(userId);

        const stmt = db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`);
        stmt.run(...values);
    }
}

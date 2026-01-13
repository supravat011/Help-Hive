import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserModel, UserCreate } from '../models/User.js';

const SALT_ROUNDS = 10;

export interface RegisterData {
    email: string;
    password: string;
    full_name: string;
    phone?: string;
    role: 'user' | 'volunteer';
    latitude?: number;
    longitude?: number;
}

export interface LoginData {
    email: string;
    password: string;
}

export class AuthService {
    static async register(data: RegisterData) {
        // Check if user already exists
        const existingUser = UserModel.findByEmail(data.email);
        if (existingUser) {
            throw new Error('User with this email already exists');
        }

        // Hash password
        const password_hash = await bcrypt.hash(data.password, SALT_ROUNDS);

        // Create user
        const userData: UserCreate = {
            email: data.email,
            password_hash,
            full_name: data.full_name,
            phone: data.phone,
            role: data.role,
            latitude: data.latitude,
            longitude: data.longitude
        };

        const user = UserModel.create(userData);

        // Generate JWT token
        const token = this.generateToken(user.id, user.role);

        // Return user without password
        const { password_hash: _, ...userWithoutPassword } = user;
        return { user: userWithoutPassword, token };
    }

    static async login(data: LoginData) {
        // Find user by email
        const user = UserModel.findByEmail(data.email);
        if (!user) {
            throw new Error('Invalid email or password');
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(data.password, user.password_hash);
        if (!isValidPassword) {
            throw new Error('Invalid email or password');
        }

        // Generate JWT token
        const token = this.generateToken(user.id, user.role);

        // Return user without password
        const { password_hash: _, ...userWithoutPassword } = user;
        return { user: userWithoutPassword, token };
    }

    static generateToken(userId: string, role: string): string {
        return jwt.sign(
            { userId, role },
            process.env.JWT_SECRET!,
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );
    }

    static getUserById(userId: string) {
        const user = UserModel.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        const { password_hash: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
}

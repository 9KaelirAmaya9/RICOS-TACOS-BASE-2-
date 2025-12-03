const request = require('supertest');
const { query } = require('../../config/database');

// Mock database
jest.mock('../../config/database', () => ({
    query: jest.fn(),
    pool: {
        connect: jest.fn(),
        end: jest.fn(),
        on: jest.fn()
    },
    getClient: jest.fn()
}));

// Mock email utils
jest.mock('../../utils/email', () => ({
    sendVerificationEmail: jest.fn(() => Promise.resolve(true)),
    sendWelcomeEmail: jest.fn(() => Promise.resolve(true)),
    sendPasswordResetEmail: jest.fn(() => Promise.resolve(true))
}));

// Mock auth utils
jest.mock('../../utils/auth', () => ({
    hashPassword: jest.fn().mockResolvedValue('hashed_password'),
    comparePassword: jest.fn().mockResolvedValue(true),
    generateToken: jest.fn().mockReturnValue('mock_token'),
    generateVerificationToken: jest.fn().mockReturnValue('mock_verify_token'),
    generateTokenExpiry: jest.fn().mockReturnValue(new Date())
}));

// Mock stripe
jest.mock('stripe', () => {
    return jest.fn(() => ({
        paymentIntents: {
            retrieve: jest.fn()
        }
    }));
});

const { comparePassword, generateToken } = require('../../utils/auth');
const { sendVerificationEmail } = require('../../utils/email');

// Import app after mocking
const app = require('../../server');

describe('Auth Routes Integration', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/auth/register', () => {
        test('should register a new user', async () => {
            sendVerificationEmail.mockResolvedValue(true);
            // Mock user check (not found)
            query.mockResolvedValueOnce({ rows: [] });
            // Mock user insertion
            query.mockResolvedValueOnce({
                rows: [{
                    id: 1,
                    email: 'test@example.com',
                    name: 'Test User',
                    email_verified: false,
                    role: 'CUSTOMER'
                }]
            });

            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'test@example.com',
                    password: 'Password123!',
                    name: 'Test User'
                });

            expect(res.statusCode).toBe(201);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body.user).toHaveProperty('email', 'test@example.com');
        });

        test('should fail if email already exists', async () => {
            // Mock user check (found)
            query.mockResolvedValueOnce({ rows: [{ id: 1 }] });

            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'existing@example.com',
                    password: 'Password123!',
                    name: 'Existing User'
                });

            expect(res.statusCode).toBe(400);
            expect(res.body).toHaveProperty('message', 'User already exists with this email');
        });
    });

    describe('POST /api/auth/login', () => {
        test('should login successfully', async () => {
            // Mock user lookup
            query.mockResolvedValueOnce({
                rows: [{
                    id: 1,
                    email: 'test@example.com',
                    password_hash: '$2a$10$hashedpassword', // Mocked hash
                    auth_provider: 'email',
                    email_verified: true,
                    role: 'CUSTOMER'
                }]
            });

            // Mock update last login
            query.mockResolvedValueOnce({});

            // Explicitly mock auth utils
            comparePassword.mockResolvedValue(true);
            generateToken.mockReturnValue('mock_token');

            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'Password123!'
                });

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body).toHaveProperty('token', 'mock_token');
        });

        test('should fail with invalid credentials', async () => {
            // Mock user lookup (not found)
            query.mockResolvedValueOnce({ rows: [] });

            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'wrong@example.com',
                    password: 'password123'
                });

            expect(res.statusCode).toBe(401);
        });
    });
});

const authController = require('../controllers/authController');
const { validationResult } = require('express-validator');
const { query } = require('../config/database');
const { hashPassword, comparePassword, generateToken, generateVerificationToken, generateTokenExpiry } = require('../utils/auth');
const { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail } = require('../utils/email');

jest.mock('express-validator');
jest.mock('../config/database');
jest.mock('../utils/auth');
jest.mock('../utils/email');

describe('Auth Controller', () => {
    let req, res;

    beforeEach(() => {
        req = {
            body: {},
            params: {},
            user: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        jest.clearAllMocks();
        validationResult.mockReturnValue({ isEmpty: () => true });
    });

    describe('register', () => {
        test('should register new user successfully', async () => {
            req.body = { email: 'test@example.com', password: 'password123', name: 'Test User' };
            query.mockResolvedValueOnce({ rows: [] }); // Check existing
            hashPassword.mockResolvedValue('hashedPassword');
            generateVerificationToken.mockReturnValue('token');
            generateTokenExpiry.mockReturnValue(new Date());
            query.mockResolvedValueOnce({ rows: [{ id: 1, email: 'test@example.com', name: 'Test User', email_verified: false, role: 'CUSTOMER' }] }); // Insert

            await authController.register(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
            expect(sendVerificationEmail).toHaveBeenCalled();
        });

        test('should return 400 if validation fails', async () => {
            validationResult.mockReturnValue({ isEmpty: () => false, array: () => ['error'] });
            await authController.register(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        test('should return 400 if user already exists', async () => {
            req.body = { email: 'test@example.com' };
            query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
            await authController.register(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe('login', () => {
        test('should login user successfully', async () => {
            req.body = { email: 'test@example.com', password: 'password123' };
            const user = { id: 1, email: 'test@example.com', password_hash: 'hashed', auth_provider: 'email', email_verified: true };
            query.mockResolvedValueOnce({ rows: [user] }); // Get user
            comparePassword.mockResolvedValue(true);
            generateToken.mockReturnValue('jwt-token');
            query.mockResolvedValueOnce({}); // Update last login

            await authController.login(req, res);

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, token: 'jwt-token' }));
        });

        test('should return 401 if invalid credentials', async () => {
            req.body = { email: 'test@example.com', password: 'wrong' };
            query.mockResolvedValueOnce({ rows: [] }); // User not found
            await authController.login(req, res);
            expect(res.status).toHaveBeenCalledWith(401);
        });
    });

    describe('verifyEmail', () => {
        test('should verify email successfully', async () => {
            req.params.token = 'valid-token';
            const user = { id: 1, email: 'test@example.com', name: 'Test User' };
            query.mockResolvedValueOnce({ rows: [user] }); // Find user
            query.mockResolvedValueOnce({}); // Update user
            generateToken.mockReturnValue('jwt-token');

            await authController.verifyEmail(req, res);

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, token: 'jwt-token' }));
            expect(sendWelcomeEmail).toHaveBeenCalledWith(user.email, user.name);
        });

        test('should return 400 if token invalid', async () => {
            req.params.token = 'invalid-token';
            query.mockResolvedValueOnce({ rows: [] });
            await authController.verifyEmail(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe('resendVerification', () => {
        test('should resend verification email successfully', async () => {
            req.body.email = 'test@example.com';
            const user = { id: 1, email: 'test@example.com', name: 'Test User', email_verified: false };
            query.mockResolvedValueOnce({ rows: [user] }); // Find user
            generateVerificationToken.mockReturnValue('new-token');
            generateTokenExpiry.mockReturnValue(new Date());
            query.mockResolvedValueOnce({}); // Update user

            await authController.resendVerification(req, res);

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
            expect(sendVerificationEmail).toHaveBeenCalledWith(user.email, user.name, 'new-token');
        });

        test('should return 404 if user not found', async () => {
            req.body.email = 'notfound@example.com';
            query.mockResolvedValueOnce({ rows: [] });
            await authController.resendVerification(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
        });

        test('should return 400 if already verified', async () => {
            req.body.email = 'verified@example.com';
            query.mockResolvedValueOnce({ rows: [{ email_verified: true }] });
            await authController.resendVerification(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe('forgotPassword', () => {
        test('should send password reset email successfully', async () => {
            req.body.email = 'test@example.com';
            const user = { id: 1, email: 'test@example.com', name: 'Test User', auth_provider: 'email' };
            query.mockResolvedValueOnce({ rows: [user] }); // Find user
            generateVerificationToken.mockReturnValue('reset-token');
            generateTokenExpiry.mockReturnValue(new Date());
            query.mockResolvedValueOnce({}); // Update user

            await authController.forgotPassword(req, res);

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
            expect(sendPasswordResetEmail).toHaveBeenCalledWith(user.email, user.name, 'reset-token');
        });

        test('should return success message even if user not found (security)', async () => {
            req.body.email = 'notfound@example.com';
            query.mockResolvedValueOnce({ rows: [] });
            await authController.forgotPassword(req, res);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });
    });

    describe('resetPassword', () => {
        test('should reset password successfully', async () => {
            req.params.token = 'valid-token';
            req.body.password = 'newpassword';
            const user = { id: 1, email: 'test@example.com' };
            query.mockResolvedValueOnce({ rows: [user] }); // Find user
            hashPassword.mockResolvedValue('new-hashed-password');
            query.mockResolvedValueOnce({}); // Update user

            await authController.resetPassword(req, res);

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });

        test('should return 400 if token invalid', async () => {
            req.params.token = 'invalid-token';
            query.mockResolvedValueOnce({ rows: [] });
            await authController.resetPassword(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe('getMe', () => {
        test('should return current user', async () => {
            req.user = { id: 1 };
            const user = { id: 1, email: 'test@example.com', name: 'Test User' };
            query.mockResolvedValueOnce({ rows: [user] });

            await authController.getMe(req, res);

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, user }));
        });
    });

    describe('googleAuth', () => {
        test('should login existing google user', async () => {
            req.body = { googleId: 'gid123', email: 'test@gmail.com', name: 'Google User', picture: 'pic.jpg' };
            const user = { id: 1, email: 'test@gmail.com', name: 'Google User', auth_provider: 'google' };
            query.mockResolvedValueOnce({ rows: [user] }); // Check user
            query.mockResolvedValueOnce({}); // Update user
            generateToken.mockReturnValue('jwt-token');

            await authController.googleAuth(req, res);

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, token: 'jwt-token' }));
        });

        test('should register new google user', async () => {
            req.body = { googleId: 'gid456', email: 'new@gmail.com', name: 'New Google User', picture: 'pic.jpg' };
            query.mockResolvedValueOnce({ rows: [] }); // Check user (not found)
            const newUser = { id: 2, email: 'new@gmail.com', name: 'New Google User', auth_provider: 'google' };
            query.mockResolvedValueOnce({ rows: [newUser] }); // Insert user
            generateToken.mockReturnValue('jwt-token');

            await authController.googleAuth(req, res);

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, token: 'jwt-token' }));
        });
    });
});

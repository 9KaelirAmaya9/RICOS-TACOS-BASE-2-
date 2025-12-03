const { register, login } = require('../../../controllers/authController');
const { query } = require('../../../config/database');
const { validationResult } = require('express-validator');
const { hashPassword, comparePassword, generateToken, generateVerificationToken, generateTokenExpiry } = require('../../../utils/auth');
const { sendVerificationEmail } = require('../../../utils/email');

jest.mock('../../../config/database');
jest.mock('express-validator');
jest.mock('../../../utils/auth');
jest.mock('../../../utils/email');

describe('Auth Controller', () => {
    let req, res;

    beforeEach(() => {
        jest.clearAllMocks();
        req = {
            body: {},
            params: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        validationResult.mockReturnValue({
            isEmpty: jest.fn().mockReturnValue(true),
            array: jest.fn().mockReturnValue([])
        });
    });

    describe('register', () => {
        test('should return 400 if validation fails', async () => {
            validationResult.mockReturnValue({
                isEmpty: jest.fn().mockReturnValue(false),
                array: jest.fn().mockReturnValue([{ msg: 'Invalid email' }])
            });

            await register(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                errors: expect.any(Array)
            }));
        });

        test('should register a new user', async () => {
            req.body = { email: 'test@example.com', password: 'password', name: 'Test User' };
            query.mockResolvedValueOnce({ rows: [] }); // Check existing user
            hashPassword.mockResolvedValue('hashedPassword');
            generateVerificationToken.mockReturnValue('token');
            generateTokenExpiry.mockReturnValue(new Date());
            query.mockResolvedValueOnce({ rows: [{ id: 1, email: 'test@example.com', name: 'Test User', email_verified: false, role: 'CUSTOMER' }] }); // Insert user
            sendVerificationEmail.mockResolvedValue(true);

            await register(req, res);

            expect(query).toHaveBeenCalledTimes(2);
            expect(hashPassword).toHaveBeenCalledWith('password');
            expect(sendVerificationEmail).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                user: expect.any(Object)
            }));
        });

        test('should return 400 if user already exists', async () => {
            req.body = { email: 'test@example.com', password: 'password', name: 'Test User' };
            query.mockResolvedValueOnce({ rows: [{ id: 1 }] });

            await register(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                message: 'User already exists with this email'
            }));
        });

        test('should handle email sending failure gracefully', async () => {
            req.body = { email: 'test@example.com', password: 'password', name: 'Test User' };
            validationResult.mockReturnValue({ isEmpty: () => true });
            query.mockResolvedValueOnce({ rows: [] }); // No existing user
            hashPassword.mockResolvedValue('hashedPassword');
            query.mockResolvedValueOnce({ rows: [{ id: 1, email: 'test@example.com', name: 'Test User', role: 'CUSTOMER' }] }); // Insert result
            sendVerificationEmail.mockRejectedValue(new Error('Email failed'));

            await register(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                message: expect.stringContaining('Registration successful')
            }));
        });

        test('should return 500 on server error', async () => {
            req.body = { email: 'test@example.com', password: 'password', name: 'Test User' };
            validationResult.mockReturnValue({ isEmpty: () => true });
            query.mockRejectedValue(new Error('DB Error'));

            await register(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                message: 'Server error during registration'
            }));
        });
    });

    describe('login', () => {
        test('should return 400 if validation fails', async () => {
            validationResult.mockReturnValue({
                isEmpty: jest.fn().mockReturnValue(false),
                array: jest.fn().mockReturnValue([{ msg: 'Invalid email' }])
            });

            await login(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        test('should login user with correct credentials', async () => {
            req.body = { email: 'test@example.com', password: 'password' };
            const mockUser = { id: 1, email: 'test@example.com', password_hash: 'hashedPassword', auth_provider: 'email' };
            query.mockResolvedValueOnce({ rows: [mockUser] });
            comparePassword.mockResolvedValue(true);
            generateToken.mockReturnValue('jwtToken');

            await login(req, res);

            expect(comparePassword).toHaveBeenCalledWith('password', 'hashedPassword');
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                token: 'jwtToken'
            }));
        });

        test('should return 401 for invalid credentials', async () => {
            req.body = { email: 'test@example.com', password: 'wrongpassword' };
            const mockUser = { id: 1, email: 'test@example.com', password_hash: 'hashedPassword', auth_provider: 'email' };
            query.mockResolvedValueOnce({ rows: [mockUser] });
            comparePassword.mockResolvedValue(false);

            await login(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
        });

        test('should return 401 if user not found', async () => {
            req.body = { email: 'test@example.com', password: 'password' };
            query.mockResolvedValueOnce({ rows: [] });

            await login(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Invalid credentials'
            }));
        });

        test('should return 400 if user registered with OAuth', async () => {
            req.body = { email: 'test@example.com', password: 'password' };
            const mockUser = { id: 1, email: 'test@example.com', password_hash: 'hashedPassword', auth_provider: 'google' };
            query.mockResolvedValueOnce({ rows: [mockUser] });

            await login(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: expect.stringContaining('Please login with google')
            }));
        });

        test('should return 500 on server error', async () => {
            req.body = { email: 'test@example.com', password: 'password' };
            query.mockRejectedValue(new Error('DB Error'));

            await login(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('verifyEmail', () => {
        const { verifyEmail } = require('../../../controllers/authController');

        test('should verify email with valid token', async () => {
            req.params = { token: 'validToken' };
            const mockUser = { id: 1, email: 'test@example.com', name: 'Test User' };
            query.mockResolvedValueOnce({ rows: [mockUser] }); // Find user
            query.mockResolvedValueOnce({ rows: [] }); // Update user
            generateToken.mockReturnValue('jwtToken');

            await verifyEmail(req, res);

            expect(query).toHaveBeenCalledWith(expect.stringContaining('UPDATE users SET email_verified = TRUE'), [1]);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                message: 'Email verified successfully!'
            }));
        });

        test('should return 400 for invalid token', async () => {
            req.params = { token: 'invalidToken' };
            query.mockResolvedValueOnce({ rows: [] });

            await verifyEmail(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        test('should handle welcome email failure gracefully', async () => {
            req.params = { token: 'validToken' };
            const mockUser = { id: 1, email: 'test@example.com', name: 'Test User' };
            query.mockResolvedValueOnce({ rows: [mockUser] }); // Find user
            query.mockResolvedValueOnce({ rows: [] }); // Update user
            generateToken.mockReturnValue('jwtToken');
            const { sendWelcomeEmail } = require('../../../utils/email');
            sendWelcomeEmail.mockRejectedValue(new Error('Email failed'));

            await verifyEmail(req, res);

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                message: 'Email verified successfully!'
            }));
        });

        test('should return 500 on server error', async () => {
            req.params = { token: 'validToken' };
            query.mockRejectedValue(new Error('DB Error'));

            await verifyEmail(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('resendVerification', () => {
        const { resendVerification } = require('../../../controllers/authController');

        test('should return 404 if user not found', async () => {
            req.body = { email: 'test@example.com' };
            query.mockResolvedValueOnce({ rows: [] });

            await resendVerification(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        test('should return 400 if already verified', async () => {
            req.body = { email: 'test@example.com' };
            const mockUser = { id: 1, email: 'test@example.com', email_verified: true };
            query.mockResolvedValueOnce({ rows: [mockUser] });

            await resendVerification(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        test('should resend verification email', async () => {
            req.body = { email: 'test@example.com' };
            const mockUser = { id: 1, email: 'test@example.com', name: 'Test User', email_verified: false };
            query.mockResolvedValueOnce({ rows: [mockUser] }); // Find user
            generateVerificationToken.mockReturnValue('newToken');
            generateTokenExpiry.mockReturnValue(new Date());
            query.mockResolvedValueOnce({ rows: [] }); // Update user

            await resendVerification(req, res);

            expect(sendVerificationEmail).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                message: 'Verification email sent successfully'
            }));
        });

        test('should return 500 on server error', async () => {
            req.body = { email: 'test@example.com' };
            query.mockRejectedValue(new Error('DB Error'));

            await resendVerification(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('forgotPassword', () => {
        const { forgotPassword } = require('../../../controllers/authController');
        const { sendPasswordResetEmail } = require('../../../utils/email');

        test('should return success message even if user not found', async () => {
            req.body = { email: 'test@example.com' };
            query.mockResolvedValueOnce({ rows: [] });

            await forgotPassword(req, res);

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                message: expect.stringContaining('If an account exists')
            }));
        });

        test('should send password reset email', async () => {
            req.body = { email: 'test@example.com' };
            const mockUser = { id: 1, email: 'test@example.com', name: 'Test User', auth_provider: 'email' };
            query.mockResolvedValueOnce({ rows: [mockUser] }); // Find user
            generateVerificationToken.mockReturnValue('resetToken');
            generateTokenExpiry.mockReturnValue(new Date());
            query.mockResolvedValueOnce({ rows: [] }); // Update user

            await forgotPassword(req, res);

            expect(sendPasswordResetEmail).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                message: 'Password reset email sent successfully'
            }));
        });

        test('should return 400 if user uses OAuth', async () => {
            req.body = { email: 'test@example.com' };
            const mockUser = { id: 1, email: 'test@example.com', auth_provider: 'google' };
            query.mockResolvedValue({ rows: [mockUser] });

            await forgotPassword(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: expect.stringContaining('Password reset is not available')
            }));
        });

        test('should return 500 on server error', async () => {
            req.body = { email: 'test@example.com' };
            query.mockRejectedValue(new Error('DB Error'));

            await forgotPassword(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('resetPassword', () => {
        const { resetPassword } = require('../../../controllers/authController');

        test('should return 400 if token invalid', async () => {
            req.params = { token: 'invalidToken' };
            query.mockResolvedValueOnce({ rows: [] });

            await resetPassword(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        test('should reset password with valid token', async () => {
            req.params = { token: 'validToken' };
            req.body = { password: 'newPassword' };
            const mockUser = { id: 1, email: 'test@example.com' };
            query.mockResolvedValueOnce({ rows: [mockUser] }); // Find user
            hashPassword.mockResolvedValue('newHashedPassword');
            query.mockResolvedValueOnce({ rows: [] }); // Update user

            await resetPassword(req, res);

            expect(hashPassword).toHaveBeenCalledWith('newPassword');
            expect(query).toHaveBeenCalledWith(expect.stringContaining('UPDATE users SET password_hash'), expect.any(Array));
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                message: 'Password reset successfully'
            }));
        });

        test('should return 500 on server error', async () => {
            req.params = { token: 'validToken' };
            req.body = { password: 'newPassword' };
            query.mockRejectedValue(new Error('DB Error'));

            await resetPassword(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('getMe', () => {
        const { getMe } = require('../../../controllers/authController');

        test('should return current user data', async () => {
            req.user = { id: 1 };
            const mockUser = { id: 1, email: 'test@example.com', name: 'Test User' };
            query.mockResolvedValueOnce({ rows: [mockUser] });

            await getMe(req, res);

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                user: mockUser
            }));
        });

        test('should return 500 on server error', async () => {
            req.user = { id: 1 };
            query.mockRejectedValue(new Error('DB Error'));

            await getMe(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('googleAuth', () => {
        const { googleAuth } = require('../../../controllers/authController');

        test('should login existing google user', async () => {
            req.body = { googleId: 'gid123', email: 'test@gmail.com', name: 'Google User', picture: 'pic.jpg' };
            const mockUser = { id: 1, email: 'test@gmail.com', google_id: 'gid123' };
            query.mockResolvedValueOnce({ rows: [mockUser] }); // Check user
            query.mockResolvedValueOnce({ rows: [] }); // Update user
            generateToken.mockReturnValue('jwtToken');

            await googleAuth(req, res);

            expect(query).toHaveBeenCalledWith(expect.stringContaining('UPDATE users SET last_login'), expect.any(Array));
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                token: 'jwtToken'
            }));
        });

        test('should register new google user', async () => {
            req.body = { googleId: 'gidNew', email: 'new@gmail.com', name: 'New User', picture: 'pic.jpg' };
            query.mockResolvedValueOnce({ rows: [] }); // Check user
            const newUser = { id: 2, email: 'new@gmail.com', google_id: 'gidNew', role: 'CUSTOMER' };
            query.mockResolvedValueOnce({ rows: [newUser] }); // Insert user
            generateToken.mockReturnValue('jwtToken');

            await googleAuth(req, res);

            expect(query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO users'), expect.any(Array));
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                token: 'jwtToken'
            }));
        });
    });
});

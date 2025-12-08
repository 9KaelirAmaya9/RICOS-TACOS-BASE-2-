const { verifyToken } = require('../utils/auth');
const { query } = require('../config/database');

// Mock utils/auth
jest.mock('../utils/auth');

// Mock config/database
jest.mock('../config/database', () => ({
    query: jest.fn(),
    pool: { query: jest.fn() }
}));

// Mock middleware/auth
jest.mock('../middleware/auth');

// Now require auth middleware for testing auth logic specifically
// We need to require the actual implementation for the Auth Middleware tests
// But we mocked it above!
// This is a conflict. We want to test 'protect' implementation, but mock it for 'requireRole'.
// Solution: Split into two test files or use jest.requireActual.

// Let's split the strategy:
// 1. Test 'protect' by importing the actual function (using jest.requireActual if needed, or just testing the logic separately).
// 2. Test 'requireRole' using the mocked 'protect'.

// Actually, simpler approach:
// Don't mock middleware/auth globally.
// For Role Middleware tests, we can spy on the protect function if it was exported from the same module, but it's not.
// 'roles.js' requires './auth'.
// If we want to test roles.js in isolation, we should mock './auth'.

describe('Middleware', () => {
    let req, res, next;
    let authMiddleware;
    let requireRole;

    beforeEach(() => {
        jest.resetModules(); // Reset cache to ensure fresh require
        jest.clearAllMocks();

        // Re-require modules
        authMiddleware = require('../middleware/auth');
        // Setup mock implementation
        authMiddleware.protect.mockImplementation((req, res, next) => next());
        authMiddleware.requireVerifiedEmail.mockImplementation((req, res, next) => {
            if (req.user.email_verified) {
next();
} else {
res.status(403).json({ message: 'Email not verified' });
}
        });

        // Require roles AFTER mocking auth
        const rolesModule = require('../middleware/roles');
        requireRole = rolesModule.requireRole;

        req = {
            headers: {},
            user: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
    });

    // We will skip Auth Middleware tests here because we are mocking it for Role tests
    // We should create a separate file for Auth Middleware tests if we want to test its implementation.
    // OR, we can use jest.doMock to mock per test, but that requires requiring modules inside tests.

    // Let's try to test Role Middleware first since that was failing.
    describe('Role Middleware', () => {
        test('should call next if user has required role', async () => {
            req.user.role = 'ADMIN';
            await requireRole('ADMIN')(req, res, next);
            expect(next).toHaveBeenCalled();
        });

        test('should return 403 if user does not have required role', async () => {
            req.user.role = 'CUSTOMER';
            await requireRole('ADMIN')(req, res, next);
            expect(res.status).toHaveBeenCalledWith(403);
        });

        test('should allow multiple roles', async () => {
            req.user.role = 'KITCHEN';
            await requireRole('ADMIN', 'KITCHEN')(req, res, next);
            expect(next).toHaveBeenCalled();
        });
    });
});

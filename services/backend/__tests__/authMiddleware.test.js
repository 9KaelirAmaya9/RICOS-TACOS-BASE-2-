const { protect, requireVerifiedEmail } = require('../middleware/auth');
const { verifyToken } = require('../utils/auth');
const { query } = require('../config/database');

jest.mock('../utils/auth');
jest.mock('../config/database', () => ({
    query: jest.fn(),
    pool: { query: jest.fn() }
}));

describe('Auth Middleware', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            headers: {},
            user: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
        jest.clearAllMocks();
    });

    describe('protect', () => {
        test('should call next if token is valid', async () => {
            req.headers.authorization = 'Bearer validtoken';
            verifyToken.mockReturnValue({ id: 1 });
            query.mockResolvedValue({ rows: [{ id: 1, email: 'test@example.com' }] });

            await protect(req, res, next);

            expect(verifyToken).toHaveBeenCalledWith('validtoken');
            expect(query).toHaveBeenCalled();
            expect(req.user).toBeDefined();
            expect(next).toHaveBeenCalled();
        });

        test('should return 401 if no token', async () => {
            await protect(req, res, next);
            expect(res.status).toHaveBeenCalledWith(401);
        });

        test('should return 401 if token invalid', async () => {
            req.headers.authorization = 'Bearer invalidtoken';
            verifyToken.mockReturnValue(null);

            await protect(req, res, next);
            expect(res.status).toHaveBeenCalledWith(401);
        });
    });

    describe('requireVerifiedEmail', () => {
        test('should call next if email is verified', () => {
            req.user.email_verified = true;
            requireVerifiedEmail(req, res, next);
            expect(next).toHaveBeenCalled();
        });

        test('should return 403 if email not verified', () => {
            req.user.email_verified = false;
            requireVerifiedEmail(req, res, next);
            expect(res.status).toHaveBeenCalledWith(403);
        });
    });
});

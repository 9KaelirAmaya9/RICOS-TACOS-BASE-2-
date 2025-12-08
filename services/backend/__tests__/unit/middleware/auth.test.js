const { protect, requireVerifiedEmail } = require('../../../middleware/auth');
const { verifyToken } = require('../../../utils/auth');
const { query } = require('../../../config/database');

jest.mock('../../../utils/auth');
jest.mock('../../../config/database');

describe('Auth Middleware', () => {
    let req, res, next;

    beforeEach(() => {
        jest.clearAllMocks();
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

    describe('protect', () => {
        test('should call next if token is valid and user exists', async () => {
            req.headers.authorization = 'Bearer validtoken';
            verifyToken.mockReturnValue({ id: 1 });
            const mockUser = { id: 1, name: 'User' };
            query.mockResolvedValue({ rows: [mockUser] });

            await protect(req, res, next);

            expect(verifyToken).toHaveBeenCalledWith('validtoken');
            expect(query).toHaveBeenCalledWith(expect.stringContaining('SELECT id'), [1]);
            expect(req.user).toEqual(mockUser);
            expect(next).toHaveBeenCalled();
        });

        test('should return 401 if no token provided', async () => {
            await protect(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Not authorized to access this route'
            }));
        });

        test('should return 401 if token invalid', async () => {
            req.headers.authorization = 'Bearer invalidtoken';
            verifyToken.mockReturnValue(null);

            await protect(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Invalid token'
            }));
        });

        test('should return 401 if user not found', async () => {
            req.headers.authorization = 'Bearer validtoken';
            verifyToken.mockReturnValue({ id: 1 });
            query.mockResolvedValue({ rows: [] });

            await protect(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'User not found'
            }));
        });

        test('should return 401 on error', async () => {
            req.headers.authorization = 'Bearer validtoken';
            verifyToken.mockImplementation(() => {
 throw new Error('Error');
});

            await protect(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
        });
    });

    describe('requireVerifiedEmail', () => {
        test('should call next if email verified', () => {
            req.user = { email_verified: true };

            requireVerifiedEmail(req, res, next);

            expect(next).toHaveBeenCalled();
        });

        test('should return 403 if email not verified', () => {
            req.user = { email_verified: false };

            requireVerifiedEmail(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Please verify your email address to access this resource'
            }));
        });
    });
});

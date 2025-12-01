const { requireRole, requireAdmin, requireKitchen, requireCashier } = require('../../../middleware/roles');
const { protect } = require('../../../middleware/auth');

jest.mock('../../../middleware/auth');

describe('Roles Middleware', () => {
    let req, res, next;

    beforeEach(() => {
        jest.clearAllMocks();
        req = {
            user: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();

        // Mock protect to call next() immediately (simulating authenticated user)
        protect.mockImplementation((req, res, next) => next());
    });

    describe('requireRole', () => {
        test('should call next if user has allowed role', async () => {
            req.user.role = 'ADMIN';
            const middleware = requireRole('ADMIN');

            await middleware(req, res, next);

            expect(next).toHaveBeenCalled();
        });

        test('should return 403 if user has no role', async () => {
            req.user = {}; // No role
            const middleware = requireRole('ADMIN');

            await middleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Access denied: No role assigned to user'
            }));
        });

        test('should return 403 if user has wrong role', async () => {
            req.user.role = 'CUSTOMER';
            const middleware = requireRole('ADMIN');

            await middleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: expect.stringContaining('Access denied: Requires ADMIN role')
            }));
        });

        test('should return 401 if protect fails', async () => {
            protect.mockImplementation((req, res, next) => next(new Error('Auth failed')));
            const middleware = requireRole('ADMIN');

            await middleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
        });
    });

    describe('requireAdmin', () => {
        test('should allow ADMIN', async () => {
            req.user.role = 'ADMIN';
            await requireAdmin(req, res, next);
            expect(next).toHaveBeenCalled();
        });

        test('should deny CUSTOMER', async () => {
            req.user.role = 'CUSTOMER';
            await requireAdmin(req, res, next);
            expect(res.status).toHaveBeenCalledWith(403);
        });
    });

    describe('requireKitchen', () => {
        test('should allow KITCHEN', async () => {
            req.user.role = 'KITCHEN';
            await requireKitchen(req, res, next);
            expect(next).toHaveBeenCalled();
        });

        test('should allow ADMIN', async () => {
            req.user.role = 'ADMIN';
            await requireKitchen(req, res, next);
            expect(next).toHaveBeenCalled();
        });

        test('should deny CUSTOMER', async () => {
            req.user.role = 'CUSTOMER';
            await requireKitchen(req, res, next);
            expect(res.status).toHaveBeenCalledWith(403);
        });
    });

    describe('requireCashier', () => {
        test('should allow CASHIER', async () => {
            req.user.role = 'CASHIER';
            await requireCashier(req, res, next);
            expect(next).toHaveBeenCalled();
        });

        test('should allow ADMIN', async () => {
            req.user.role = 'ADMIN';
            await requireCashier(req, res, next);
            expect(next).toHaveBeenCalled();
        });

        test('should deny CUSTOMER', async () => {
            req.user.role = 'CUSTOMER';
            await requireCashier(req, res, next);
            expect(res.status).toHaveBeenCalledWith(403);
        });
    });
});

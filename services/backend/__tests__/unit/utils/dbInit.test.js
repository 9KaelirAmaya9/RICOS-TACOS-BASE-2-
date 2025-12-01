const { initDb } = require('../../../utils/dbInit');
const { migrate } = require('../../../database/migrate');
const { seed } = require('../../../database/seed');
const { pool } = require('../../../config/database');
const logger = require('../../../utils/logger');

jest.mock('../../../database/migrate');
jest.mock('../../../database/seed');
jest.mock('../../../config/database');
jest.mock('../../../utils/logger');

describe('DB Init Utils', () => {
    let mockClient;

    beforeEach(() => {
        jest.clearAllMocks();
        mockClient = {
            query: jest.fn(),
            release: jest.fn()
        };
        pool.connect.mockResolvedValue(mockClient);
        process.env.ADMIN_EMAIL = 'admin@example.com';
    });

    describe('initDb', () => {
        test('should initialize database successfully', async () => {
            // Mock admin check (admin exists)
            mockClient.query.mockResolvedValue({ rows: [{ 1: 1 }] });

            await initDb();

            expect(migrate).toHaveBeenCalled();
            expect(seed).toHaveBeenCalled();
            expect(logger.info).toHaveBeenCalledWith('Database initialization completed successfully');
        });

        test('should promote user to admin if admin email set', async () => {
            // Admin check (no admin)
            mockClient.query.mockResolvedValueOnce({ rows: [] });
            // User check (user found)
            mockClient.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
            // Update role
            mockClient.query.mockResolvedValueOnce({ rows: [] });

            await initDb();

            expect(mockClient.query).toHaveBeenCalledWith(
                expect.stringContaining("UPDATE users SET role = 'ADMIN'"),
                [1]
            );
            expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('promoted to admin'));
        });

        test('should warn if admin email user not found', async () => {
            // Admin check (no admin)
            mockClient.query.mockResolvedValueOnce({ rows: [] });
            // User check (user not found)
            mockClient.query.mockResolvedValueOnce({ rows: [] });
            // First user check (found)
            mockClient.query.mockResolvedValueOnce({ rows: [{ id: 2, email: 'first@example.com' }] });
            // Update role
            mockClient.query.mockResolvedValueOnce({ rows: [] });

            await initDb();

            expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('not found, cannot promote'));
            expect(mockClient.query).toHaveBeenCalledWith(
                expect.stringContaining("UPDATE users SET role = 'ADMIN'"),
                [2]
            );
        });

        test('should promote first user if no admin email set', async () => {
            delete process.env.ADMIN_EMAIL;

            // Admin check (no admin)
            mockClient.query.mockResolvedValueOnce({ rows: [] });
            // First user check (found)
            mockClient.query.mockResolvedValueOnce({ rows: [{ id: 1, email: 'first@example.com' }] });
            // Update role
            mockClient.query.mockResolvedValueOnce({ rows: [] });

            await initDb();

            expect(mockClient.query).toHaveBeenCalledWith(
                expect.stringContaining("UPDATE users SET role = 'ADMIN'"),
                [1]
            );
        });

        test('should log info if no users found to promote', async () => {
            delete process.env.ADMIN_EMAIL;

            // Admin check (no admin)
            mockClient.query.mockResolvedValueOnce({ rows: [] });
            // First user check (not found)
            mockClient.query.mockResolvedValueOnce({ rows: [] });

            await initDb();

            expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('No users found'));
        });

        test('should throw error on failure', async () => {
            migrate.mockRejectedValue(new Error('Migrate failed'));

            await expect(initDb()).rejects.toThrow('Migrate failed');
            expect(logger.error).toHaveBeenCalledWith('Database initialization failed:', expect.any(Error));
        });

        test('should throw error on bootstrap failure', async () => {
            mockClient.query.mockRejectedValue(new Error('DB Error'));

            await expect(initDb()).rejects.toThrow('DB Error');
            expect(logger.error).toHaveBeenCalledWith('Error bootstrapping admin:', expect.any(Error));
        });
    });
});

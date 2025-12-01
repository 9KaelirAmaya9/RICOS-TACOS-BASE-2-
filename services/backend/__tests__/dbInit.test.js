const { initDb } = require('../utils/dbInit');
const { migrate } = require('../database/migrate');
const { seed } = require('../database/seed');
const { pool } = require('../config/database');
const logger = require('../utils/logger');

jest.mock('../database/migrate');
jest.mock('../database/seed');
jest.mock('../config/database');
jest.mock('../utils/logger');

describe('Database Initialization', () => {
    let mockClient;

    beforeEach(() => {
        jest.clearAllMocks();
        mockClient = {
            query: jest.fn().mockResolvedValue({ rows: [] }), // Default empty result
            release: jest.fn(),
        };
        pool.connect.mockResolvedValue(mockClient);
    });

    test('should run migrations and seed successfully', async () => {
        mockClient.query.mockResolvedValue({ rows: [{ id: 1 }] }); // For admin check

        await initDb();

        expect(migrate).toHaveBeenCalled();
        expect(seed).toHaveBeenCalled();
        expect(logger.info).toHaveBeenCalledWith('Database initialization completed successfully');
    });

    test('should bootstrap admin if none exists', async () => {
        // Mock no admin exists
        mockClient.query
            .mockResolvedValueOnce({ rows: [] }) // Admin check
            .mockResolvedValueOnce({ rows: [{ id: 1, email: 'user@example.com' }] }) // First user check
            .mockResolvedValueOnce({ rows: [] }); // Update result

        await initDb();

        // Verify bootstrapAdmin logic was triggered
        // Since bootstrapAdmin is internal, we verify its side effects (queries)
        // 1. Check admin
        // 2. Check first user
        // 3. Update user
        expect(mockClient.query).toHaveBeenCalledTimes(3);
    });

    test('should promote specific admin email from env', async () => {
        process.env.ADMIN_EMAIL = 'admin@example.com';

        mockClient.query
            .mockResolvedValueOnce({ rows: [] }) // Admin check
            .mockResolvedValueOnce({ rows: [{ id: 99, email: 'admin@example.com' }] }) // Find specific user
            .mockResolvedValueOnce({ rows: [] }); // Update result

        await initDb();

        expect(mockClient.query).toHaveBeenCalledWith(
            expect.stringContaining('UPDATE users SET role'),
            [99]
        );

        delete process.env.ADMIN_EMAIL;
    });

    test('should handle admin email not found', async () => {
        process.env.ADMIN_EMAIL = 'missing@example.com';

        mockClient.query
            .mockResolvedValueOnce({ rows: [] }) // Admin check
            .mockResolvedValueOnce({ rows: [] }) // Find specific user - empty
            .mockResolvedValueOnce({ rows: [] }); // Fallback check for any users

        await initDb();

        // Should not try to update
        expect(mockClient.query).not.toHaveBeenCalledWith(
            expect.stringContaining('UPDATE users SET role'),
            expect.anything()
        );

        delete process.env.ADMIN_EMAIL;
    });

    test('should handle errors during initialization', async () => {
        const error = new Error('Migration failed');
        migrate.mockRejectedValue(error);

        // We expect the promise to reject
        await expect(initDb()).rejects.toThrow('Migration failed');

        // And logger.error to be called
        expect(logger.error).toHaveBeenCalledWith('Database initialization failed:', error);
    });
});

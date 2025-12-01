const { query, pool, getClient } = require('../../../config/database');

// Mock pg
jest.mock('pg', () => {
    const mPool = {
        query: jest.fn(),
        connect: jest.fn(),
        end: jest.fn(),
        on: jest.fn()
    };
    return { Pool: jest.fn(() => mPool) };
});

describe('Database Config', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('query', () => {
        test('should execute query on pool', async () => {
            const sql = 'SELECT * FROM users';
            const params = [];
            const mockResult = { rows: [] };
            pool.query.mockResolvedValue(mockResult);

            const result = await query(sql, params);

            expect(pool.query).toHaveBeenCalledWith(sql, params);
            expect(result).toBe(mockResult);
        });
    });

    describe('getClient', () => {
        test('should return a client with monkey-patched methods', async () => {
            jest.useFakeTimers();
            const originalQuery = jest.fn();
            const originalRelease = jest.fn();
            const mockClient = {
                query: originalQuery,
                release: originalRelease
            };
            pool.connect.mockResolvedValue(mockClient);

            // Configure mock before getClient (as it gets overwritten)
            originalQuery.mockResolvedValue({ rows: [] });

            const client = await getClient();

            expect(pool.connect).toHaveBeenCalled();
            expect(client).toBe(mockClient);

            // Test monkey-patched query
            const sql = 'SELECT 1';
            const params = [];

            await client.query(sql, params);
            expect(originalQuery).toHaveBeenCalledWith(sql, params);

            // Test monkey-patched release
            client.release();
            expect(originalRelease).toHaveBeenCalled();

            jest.useRealTimers();
        });
    });
});

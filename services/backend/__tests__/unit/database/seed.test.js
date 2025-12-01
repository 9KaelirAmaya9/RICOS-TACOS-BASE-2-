const { seed } = require('../../../database/seed');
const { pool } = require('../../../config/database');
const bcrypt = require('bcryptjs');
const fs = require('fs');

jest.mock('../../../config/database', () => ({
    pool: {
        connect: jest.fn()
    }
}));

jest.mock('bcryptjs');
jest.mock('fs');

describe('Database Seed', () => {
    let mockClient;

    beforeEach(() => {
        jest.clearAllMocks();
        mockClient = {
            query: jest.fn(),
            release: jest.fn()
        };
        pool.connect.mockResolvedValue(mockClient);
        bcrypt.hash.mockResolvedValue('hashed_password');
        fs.existsSync.mockReturnValue(true);
        fs.readFileSync.mockReturnValue(JSON.stringify([
            { name: 'Taco', category: 'TACOS', price: 5, is_special: false, image_url: 'url' }
        ]));
    });

    test('should seed database successfully', async () => {
        // Mock category ID lookup
        mockClient.query.mockImplementation((sql) => {
            if (typeof sql === 'string' && sql.includes('SELECT id FROM menu_categories')) {
                return Promise.resolve({ rows: [{ id: 1 }] });
            }
            return Promise.resolve({ rows: [] });
        });

        await seed();

        expect(pool.connect).toHaveBeenCalled();
        expect(bcrypt.hash).toHaveBeenCalledTimes(3); // admin, kitchen, client
        expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
        // Users
        expect(mockClient.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO users'), expect.any(Array));
        // Categories
        expect(mockClient.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO menu_categories'), expect.any(Array));
        // Menu Items
        expect(mockClient.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO menu_items'), expect.any(Array));

        expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
        expect(mockClient.release).toHaveBeenCalled();
    });

    test('should handle errors and rollback', async () => {
        const error = new Error('Seed failed');
        mockClient.query.mockRejectedValueOnce(error);

        await expect(seed()).rejects.toThrow('Seed failed');
        expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
        expect(mockClient.release).toHaveBeenCalled();
    });
});

const { migrate } = require('../../../database/migrate');
const { pool } = require('../../../config/database');
const fs = require('fs');

jest.mock('../../../config/database', () => ({
    pool: {
        connect: jest.fn()
    }
}));

jest.mock('fs');

describe('Database Migration', () => {
    let mockClient;

    beforeEach(() => {
        jest.clearAllMocks();
        mockClient = {
            query: jest.fn(),
            release: jest.fn()
        };
        pool.connect.mockResolvedValue(mockClient);
        fs.readFileSync.mockReturnValue('SQL STATEMENT');
    });

    test('should run migrations successfully', async () => {
        await migrate();

        expect(pool.connect).toHaveBeenCalled();
        expect(fs.readFileSync).toHaveBeenCalledTimes(2);
        expect(mockClient.query).toHaveBeenCalledTimes(2);
        expect(mockClient.query).toHaveBeenCalledWith('SQL STATEMENT');
        expect(mockClient.release).toHaveBeenCalled();
    });

    test('should handle errors', async () => {
        const error = new Error('Migration failed');
        mockClient.query.mockRejectedValueOnce(error);

        await expect(migrate()).rejects.toThrow('Migration failed');
        expect(mockClient.release).toHaveBeenCalled();
    });
});

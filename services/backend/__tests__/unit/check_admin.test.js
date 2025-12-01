const { pool } = require('../../config/database');

jest.mock('../../config/database', () => ({
    pool: {
        query: jest.fn(),
        end: jest.fn()
    }
}));

describe('check_admin script', () => {
    let consoleLogSpy;
    let consoleErrorSpy;

    beforeEach(() => {
        jest.clearAllMocks();
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
        consoleLogSpy.mockRestore();
        consoleErrorSpy.mockRestore();
    });

    test('should query admin user and log result', async () => {
        pool.query.mockResolvedValue({ rows: [{ email: 'admin@tacos.local' }] });
        pool.end.mockResolvedValue();

        // Require the file to execute it
        jest.isolateModules(() => {
            require('../../check_admin');
        });

        // Wait for async execution
        await new Promise(resolve => setTimeout(resolve, 100));

        expect(pool.query).toHaveBeenCalledWith(expect.stringContaining("SELECT email, role, password_hash FROM users"));
        expect(consoleLogSpy).toHaveBeenCalledWith('Admin User:', { email: 'admin@tacos.local' });
        expect(pool.end).toHaveBeenCalled();
    });

    test('should handle errors', async () => {
        const error = new Error('Query failed');
        pool.query.mockRejectedValue(error);

        jest.isolateModules(() => {
            require('../../check_admin');
        });

        await new Promise(resolve => setTimeout(resolve, 100));

        expect(consoleErrorSpy).toHaveBeenCalledWith(error);
        expect(pool.end).toHaveBeenCalled();
    });
});

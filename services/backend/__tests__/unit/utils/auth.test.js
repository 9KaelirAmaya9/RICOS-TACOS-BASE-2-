const {
    hashPassword,
    comparePassword,
    generateToken,
    verifyToken,
    generateVerificationToken,
    generateTokenExpiry
} = require('../../../utils/auth');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('Auth Utils', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.JWT_SECRET = 'secret';
        process.env.JWT_EXPIRE = '1h';
    });

    describe('hashPassword', () => {
        test('should hash password', async () => {
            bcrypt.genSalt.mockResolvedValue('salt');
            bcrypt.hash.mockResolvedValue('hashedPassword');

            const result = await hashPassword('password');

            expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
            expect(bcrypt.hash).toHaveBeenCalledWith('password', 'salt');
            expect(result).toBe('hashedPassword');
        });
    });

    describe('comparePassword', () => {
        test('should compare passwords', async () => {
            bcrypt.compare.mockResolvedValue(true);

            const result = await comparePassword('password', 'hashedPassword');

            expect(bcrypt.compare).toHaveBeenCalledWith('password', 'hashedPassword');
            expect(result).toBe(true);
        });
    });

    describe('generateToken', () => {
        test('should generate JWT token', () => {
            jwt.sign.mockReturnValue('token');

            const result = generateToken(1);

            expect(jwt.sign).toHaveBeenCalledWith(
                { id: 1 },
                'secret',
                { expiresIn: '1h' }
            );
            expect(result).toBe('token');
        });
    });

    describe('verifyToken', () => {
        test('should verify valid token', () => {
            jwt.verify.mockReturnValue({ id: 1 });

            const result = verifyToken('token');

            expect(jwt.verify).toHaveBeenCalledWith('token', 'secret');
            expect(result).toEqual({ id: 1 });
        });

        test('should return null for invalid token', () => {
            jwt.verify.mockImplementation(() => { throw new Error('Invalid token'); });

            const result = verifyToken('invalid');

            expect(result).toBeNull();
        });
    });

    describe('generateVerificationToken', () => {
        test('should generate random token', () => {
            const token = generateVerificationToken();
            expect(typeof token).toBe('string');
            expect(token.length).toBeGreaterThan(0);
        });
    });

    describe('generateTokenExpiry', () => {
        test('should generate expiry date', () => {
            const now = Date.now();
            const expiry = generateTokenExpiry(1); // 1 hour

            expect(expiry).toBeInstanceOf(Date);
            expect(expiry.getTime()).toBeGreaterThan(now);
            // Allow some small difference in execution time
            expect(expiry.getTime() - now).toBeLessThanOrEqual(3600000 + 1000);
            expect(expiry.getTime() - now).toBeGreaterThanOrEqual(3600000 - 1000);
        });
    });
});

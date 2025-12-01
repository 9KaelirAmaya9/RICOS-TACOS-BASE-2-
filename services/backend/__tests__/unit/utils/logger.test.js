const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');

jest.mock('winston');
jest.mock('winston-daily-rotate-file');

describe('Logger Utils', () => {
    let logger;
    let mockLoggerInstance;

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup mock logger instance
        mockLoggerInstance = {
            info: jest.fn(),
            error: jest.fn(),
            stream: {}
        };

        // Setup winston.createLogger return value
        winston.createLogger.mockReturnValue(mockLoggerInstance);

        // Setup winston.format
        winston.format = {
            combine: jest.fn(),
            timestamp: jest.fn(),
            errors: jest.fn(),
            splat: jest.fn(),
            json: jest.fn(),
            colorize: jest.fn(),
            printf: jest.fn(),
        };

        // Setup winston.transports
        winston.transports = {
            Console: jest.fn(),
        };

        jest.isolateModules(() => {
            logger = require('../../../utils/logger');
        });
    });

    test('should create logger with transports', () => {
        expect(winston.createLogger).toHaveBeenCalled();
        expect(winston.transports.Console).toHaveBeenCalled();
        expect(DailyRotateFile).toHaveBeenCalledTimes(2);
    });

    test('should have stream.write method', () => {
        expect(logger.stream).toBeDefined();
        expect(typeof logger.stream.write).toBe('function');
    });

    test('stream.write should log info', () => {
        logger.stream.write('test message\n');
        expect(mockLoggerInstance.info).toHaveBeenCalledWith('test message');
    });
});

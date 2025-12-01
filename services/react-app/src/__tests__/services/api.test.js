import axios from 'axios';
import api, { authAPI } from '../../services/api';

// Mock axios
jest.mock('axios', () => {
    const mockRequestUse = jest.fn();
    const mockResponseUse = jest.fn();
    const mockGet = jest.fn();
    const mockPost = jest.fn();

    const mockInstance = {
        interceptors: {
            request: { use: mockRequestUse },
            response: { use: mockResponseUse },
        },
        get: mockGet,
        post: mockPost,
    };

    const mockAxios = jest.fn(() => mockInstance);
    mockAxios.create = jest.fn(() => mockInstance);

    // Expose mocks on the main object for testing access
    mockAxios.mockRequestUse = mockRequestUse;
    mockAxios.mockResponseUse = mockResponseUse;
    mockAxios.mockGet = mockGet;
    mockAxios.mockPost = mockPost;

    return {
        __esModule: true,
        default: mockAxios,
    };
});

describe('API Service', () => {
    let requestSuccessHandler;
    let requestErrorHandler;
    let responseSuccessHandler;
    let responseErrorHandler;

    beforeAll(() => {
        // Capture interceptors that were registered when api.js loaded
        // We assume api.js is imported and executed once
        if (axios.mockRequestUse.mock.calls.length > 0) {
            requestSuccessHandler = axios.mockRequestUse.mock.calls[0][0];
            requestErrorHandler = axios.mockRequestUse.mock.calls[0][1];
        }
        if (axios.mockResponseUse.mock.calls.length > 0) {
            responseSuccessHandler = axios.mockResponseUse.mock.calls[0][0];
            responseErrorHandler = axios.mockResponseUse.mock.calls[0][1];
        }
    });

    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.clear();
    });

    describe('Interceptors', () => {
        test('should add token to headers if present', () => {
            const token = 'test-token';
            localStorage.setItem('token', token);

            const config = { headers: {} };
            const result = requestSuccessHandler(config);

            expect(result.headers.Authorization).toBe(`Bearer ${token}`);
        });

        test('should not add token if not present', () => {
            const config = { headers: {} };
            const result = requestSuccessHandler(config);

            expect(result.headers.Authorization).toBeUndefined();
        });

        test('should handle 401 response by clearing storage and redirecting', () => {
            // Mock window.location
            const originalLocation = window.location;
            delete window.location;
            window.location = { href: '' };

            const error = {
                response: { status: 401 }
            };

            localStorage.setItem('token', 'old-token');
            localStorage.setItem('user', 'old-user');

            expect(responseErrorHandler(error)).rejects.toEqual(error);

            expect(localStorage.getItem('token')).toBeNull();
            expect(localStorage.getItem('user')).toBeNull();
            expect(window.location.href).toBe('/');

            // Cleanup
            window.location = originalLocation;
        });

        test('should pass through other errors', () => {
            const error = {
                response: { status: 500 }
            };

            expect(responseErrorHandler(error)).rejects.toEqual(error);
        });

        test('should handle request error', () => {
            const error = new Error('Request failed');

            expect(requestErrorHandler(error)).rejects.toEqual(error);
        });

        test('should handle successful response', () => {
            const response = { data: 'success' };

            expect(responseSuccessHandler(response)).toEqual(response);
        });
    });

    describe('Auth API', () => {
        test('register should call api.post', async () => {
            axios.mockPost.mockResolvedValue({ data: { success: true } });

            const result = await authAPI.register('test@example.com', 'password', 'name');

            expect(axios.mockPost).toHaveBeenCalledWith('/auth/register', {
                email: 'test@example.com',
                password: 'password',
                name: 'name'
            });
            expect(result).toEqual({ success: true });
        });

        test('login should call api.post', async () => {
            axios.mockPost.mockResolvedValue({ data: { token: 'abc' } });

            const result = await authAPI.login('test@example.com', 'password');

            expect(axios.mockPost).toHaveBeenCalledWith('/auth/login', {
                email: 'test@example.com',
                password: 'password'
            });
            expect(result).toEqual({ token: 'abc' });
        });

        test('googleAuth should call api.post', async () => {
            axios.mockPost.mockResolvedValue({ data: { token: 'abc' } });

            const result = await authAPI.googleAuth('gid', 'email', 'name', 'pic');

            expect(axios.mockPost).toHaveBeenCalledWith('/auth/google', {
                googleId: 'gid',
                email: 'email',
                name: 'name',
                picture: 'pic'
            });
            expect(result).toEqual({ token: 'abc' });
        });

        test('verifyEmail should call api.get', async () => {
            axios.mockGet.mockResolvedValue({ data: { success: true } });

            const result = await authAPI.verifyEmail('token123');

            expect(axios.mockGet).toHaveBeenCalledWith('/auth/verify-email/token123');
            expect(result).toEqual({ success: true });
        });

        test('resendVerification should call api.post', async () => {
            axios.mockPost.mockResolvedValue({ data: { success: true } });

            const result = await authAPI.resendVerification('test@example.com');

            expect(axios.mockPost).toHaveBeenCalledWith('/auth/resend-verification', {
                email: 'test@example.com'
            });
            expect(result).toEqual({ success: true });
        });

        test('forgotPassword should call api.post', async () => {
            axios.mockPost.mockResolvedValue({ data: { success: true } });

            const result = await authAPI.forgotPassword('test@example.com');

            expect(axios.mockPost).toHaveBeenCalledWith('/auth/forgot-password', {
                email: 'test@example.com'
            });
            expect(result).toEqual({ success: true });
        });

        test('resetPassword should call api.post', async () => {
            axios.mockPost.mockResolvedValue({ data: { success: true } });

            const result = await authAPI.resetPassword('token123', 'newpass');

            expect(axios.mockPost).toHaveBeenCalledWith('/auth/reset-password/token123', {
                password: 'newpass'
            });
            expect(result).toEqual({ success: true });
        });

        test('getMe should call api.get', async () => {
            axios.mockGet.mockResolvedValue({ data: { id: 1 } });

            const result = await authAPI.getMe();

            expect(axios.mockGet).toHaveBeenCalledWith('/auth/me');
            expect(result).toEqual({ id: 1 });
        });
    });
});

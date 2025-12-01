import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';

// Mock the API module
jest.mock('../services/api');

describe('AuthContext', () => {
  const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock localStorage
    const localStorageMock = (function () {
      let store = {};
      return {
        getItem: jest.fn(key => store[key] || null),
        setItem: jest.fn((key, value) => {
          store[key] = value.toString();
        }),
        removeItem: jest.fn(key => {
          delete store[key];
        }),
        clear: jest.fn(() => {
          store = {};
        })
      };
    })();

    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock
    });
  });

  test('should provide initial auth state', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.isAuthenticated).toBe(false);
  });

  test('should load user from local storage on mount', async () => {
    const mockUser = { id: 1, name: 'Stored User' };
    window.localStorage.getItem.mockImplementation((key) => {
      if (key === 'token') return 'stored-token';
      if (key === 'user') return JSON.stringify(mockUser);
      return null;
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
    });
    expect(result.current.isAuthenticated).toBe(true);
  });

  test('should handle invalid JSON in local storage', async () => {
    window.localStorage.getItem.mockImplementation((key) => {
      if (key === 'token') return 'stored-token';
      if (key === 'user') return 'invalid-json';
      return null;
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.user).toBeNull();
    });
    expect(window.localStorage.removeItem).toHaveBeenCalledWith('user');
    expect(window.localStorage.removeItem).toHaveBeenCalledWith('token');
  });

  test('should register user successfully', async () => {
    authAPI.register.mockResolvedValue({
      success: true,
      data: { message: 'Registration successful' },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    let response;
    await act(async () => {
      response = await result.current.register('test@example.com', 'Test1234', 'Test User');
    });

    expect(response.success).toBe(true);
    expect(authAPI.register).toHaveBeenCalledWith('test@example.com', 'Test1234', 'Test User');
  });

  test('should handle register error', async () => {
    authAPI.register.mockRejectedValue({
      response: { data: { message: 'Email already exists' } },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    let response;
    await act(async () => {
      response = await result.current.register('test@example.com', 'Test1234', 'Test User');
    });

    expect(response.success).toBe(false);
    expect(response.error).toBe('Email already exists');
    expect(result.current.error).toBe('Email already exists');
  });

  test('should login user with email successfully', async () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      name: 'Test User',
    };

    authAPI.login.mockResolvedValue({
      success: true,
      token: 'test-token',
      user: mockUser,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.loginWithEmail('test@example.com', 'Test1234');
    });

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
    });

    expect(result.current.isAuthenticated).toBe(true);

    expect(window.localStorage.setItem).toHaveBeenCalledWith('token', 'test-token');
    expect(window.localStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockUser));
  });

  test('should handle login error', async () => {
    authAPI.login.mockRejectedValue({
      response: { data: { message: 'Invalid credentials' } },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    let response;
    await act(async () => {
      response = await result.current.loginWithEmail('test@example.com', 'wrong-password');
    });

    expect(response.success).toBe(false);
    expect(response.error).toBe('Invalid credentials');
    expect(result.current.user).toBeNull();
  });

  test('should handle login with invalid server response', async () => {
    authAPI.login.mockResolvedValue({ success: false });

    const { result } = renderHook(() => useAuth(), { wrapper });

    let response;
    await act(async () => {
      response = await result.current.loginWithEmail('test@example.com', 'pass');
    });

    expect(response.success).toBe(false);
    expect(response.error).toBe('Invalid response from server');
  });

  test('should login with google successfully', async () => {
    const mockUser = { id: 1, email: 'google@test.com' };
    authAPI.googleAuth.mockResolvedValue({
      success: true,
      token: 'google-token',
      user: mockUser
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.loginWithGoogle('gid', 'email', 'name', 'pic');
    });

    expect(result.current.user).toEqual(mockUser);
    expect(window.localStorage.setItem).toHaveBeenCalledWith('token', 'google-token');
  });

  test('should handle google login error', async () => {
    authAPI.googleAuth.mockRejectedValue({
      response: { data: { message: 'Google auth failed' } }
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    let response;
    await act(async () => {
      response = await result.current.loginWithGoogle('gid', 'email', 'name', 'pic');
    });

    expect(response.success).toBe(false);
    expect(response.error).toBe('Google auth failed');
  });

  test('should handle google login invalid response', async () => {
    authAPI.googleAuth.mockResolvedValue({ success: false });

    const { result } = renderHook(() => useAuth(), { wrapper });

    let response;
    await act(async () => {
      response = await result.current.loginWithGoogle('gid', 'email', 'name', 'pic');
    });

    expect(response.success).toBe(false);
    expect(response.error).toBe('Invalid response from server');
  });

  test('should logout user successfully', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    // Set initial state
    act(() => {
      result.current.login({ id: 1 }, 'token');
    });

    // Then logout
    act(() => {
      result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(window.localStorage.removeItem).toHaveBeenCalledWith('user');
    expect(window.localStorage.removeItem).toHaveBeenCalledWith('token');
  });

  test('should update user', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.login({ id: 1, name: 'Old Name' }, 'token');
    });

    act(() => {
      result.current.updateUser({ name: 'New Name' });
    });

    expect(result.current.user.name).toBe('New Name');
    expect(window.localStorage.setItem).toHaveBeenCalledWith('user', expect.stringContaining('New Name'));
  });

  test('should verify email successfully', async () => {
    const mockUser = { id: 1, verified: true };
    authAPI.verifyEmail.mockResolvedValue({
      success: true,
      token: 'new-token',
      user: mockUser,
      message: 'Verified'
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    let response;
    await act(async () => {
      response = await result.current.verifyEmail('token123');
    });

    expect(response.success).toBe(true);
    expect(result.current.user).toEqual(mockUser);
    expect(window.localStorage.setItem).toHaveBeenCalledWith('token', 'new-token');
  });

  test('should handle verify email error', async () => {
    authAPI.verifyEmail.mockRejectedValue({
      response: { data: { message: 'Invalid token' } }
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    let response;
    await act(async () => {
      response = await result.current.verifyEmail('token123');
    });

    expect(response.success).toBe(false);
    expect(response.error).toBe('Invalid token');
  });

  test('should handle verify email invalid response', async () => {
    authAPI.verifyEmail.mockResolvedValue({ success: false });

    const { result } = renderHook(() => useAuth(), { wrapper });

    let response;
    await act(async () => {
      response = await result.current.verifyEmail('token123');
    });

    expect(response.success).toBe(false);
    expect(response.error).toBe('Verification failed');
  });

  test('should resend verification email', async () => {
    authAPI.resendVerification.mockResolvedValue({
      message: 'Sent'
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    let response;
    await act(async () => {
      response = await result.current.resendVerification('test@example.com');
    });

    expect(response.success).toBe(true);
  });

  test('should handle resend verification error', async () => {
    authAPI.resendVerification.mockRejectedValue({
      response: { data: { message: 'Failed' } }
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    let response;
    await act(async () => {
      response = await result.current.resendVerification('test@example.com');
    });

    expect(response.success).toBe(false);
    expect(response.error).toBe('Failed');
  });

  test('should request password reset', async () => {
    authAPI.forgotPassword.mockResolvedValue({
      message: 'Sent'
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    let response;
    await act(async () => {
      response = await result.current.forgotPassword('test@example.com');
    });

    expect(response.success).toBe(true);
  });

  test('should handle forgot password error', async () => {
    authAPI.forgotPassword.mockRejectedValue({
      response: { data: { message: 'Failed' } }
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    let response;
    await act(async () => {
      response = await result.current.forgotPassword('test@example.com');
    });

    expect(response.success).toBe(false);
    expect(response.error).toBe('Failed');
  });

  test('should reset password', async () => {
    authAPI.resetPassword.mockResolvedValue({
      message: 'Reset'
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    let response;
    await act(async () => {
      response = await result.current.resetPassword('token', 'newpass');
    });

    expect(response.success).toBe(true);
  });

  test('should handle reset password error', async () => {
    authAPI.resetPassword.mockRejectedValue({
      response: { data: { message: 'Failed' } }
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    let response;
    await act(async () => {
      response = await result.current.resetPassword('token', 'newpass');
    });

    expect(response.success).toBe(false);
    expect(response.error).toBe('Failed');
  });
});

import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { CartProvider, useCart } from '../../contexts/CartContext';

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

describe('CartContext', () => {
    const wrapper = ({ children }) => <CartProvider>{children}</CartProvider>;

    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.clear();
    });

    test('should throw error if used outside provider', () => {
        // Suppress console.error for this test as React logs the error
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

        expect(() => renderHook(() => useCart())).toThrow('useCart must be used within a CartProvider');

        consoleSpy.mockRestore();
    });

    test('should provide initial empty cart state', () => {
        const { result } = renderHook(() => useCart(), { wrapper });

        expect(result.current.cartItems).toEqual([]);
        expect(result.current.getCartTotal()).toBe(0);
        expect(result.current.getCartItemCount()).toBe(0);
    });

    test('should load cart from local storage on mount', () => {
        const mockCart = [
            { id: 1, name: 'Item 1', price: 10, quantity: 2, customizations: '' },
            { id: 2, name: 'Item 2', price: 20, quantity: 1, customizations: '' }
        ];
        window.localStorage.getItem.mockReturnValue(JSON.stringify(mockCart));

        const { result } = renderHook(() => useCart(), { wrapper });

        expect(result.current.cartItems).toEqual(mockCart);
        // Total: (10*2) + (20*1) = 40
        expect(result.current.getCartTotal()).toBe(40);
        // Count: 2 + 1 = 3
        expect(result.current.getCartItemCount()).toBe(3);
    });

    test('should handle invalid JSON in local storage', () => {
        window.localStorage.getItem.mockReturnValue('invalid-json');

        const { result } = renderHook(() => useCart(), { wrapper });

        expect(result.current.cartItems).toEqual([]);
    });

    test('should add new item to cart', () => {
        const { result } = renderHook(() => useCart(), { wrapper });
        const item = { id: 1, name: 'Item 1', price: 10 };

        act(() => {
            result.current.addToCart(item);
        });

        expect(result.current.cartItems).toHaveLength(1);
        expect(result.current.cartItems[0]).toEqual({
            id: 1, name: 'Item 1', price: 10, quantity: 1, customizations: '', category_name: undefined
        });
        expect(window.localStorage.setItem).toHaveBeenCalledWith('tacoCart', expect.any(String));
    });

    test('should increase quantity if item already in cart', () => {
        const { result } = renderHook(() => useCart(), { wrapper });
        const item = { id: 1, name: 'Item 1', price: 10 };

        act(() => {
            result.current.addToCart(item);
        });

        act(() => {
            result.current.addToCart(item);
        });

        expect(result.current.cartItems).toHaveLength(1);
        expect(result.current.cartItems[0].quantity).toBe(2);
    });

    test('should add item with customizations as separate entry', () => {
        const { result } = renderHook(() => useCart(), { wrapper });
        const item1 = { id: 1, name: 'Item 1', price: 10 };
        const item2 = { id: 1, name: 'Item 1', price: 10 };

        act(() => {
            result.current.addToCart(item1, 1, { size: 'M' });
        });

        act(() => {
            result.current.addToCart(item2, 1, { size: 'L' });
        });

        expect(result.current.cartItems).toHaveLength(2);
        expect(result.current.cartItems[0].customizations).toEqual({ size: 'M' });
        expect(result.current.cartItems[1].customizations).toEqual({ size: 'L' });
    });

    test('should remove item from cart', () => {
        const { result } = renderHook(() => useCart(), { wrapper });
        const item = { id: 1, name: 'Item 1', price: 10 };

        act(() => {
            result.current.addToCart(item);
        });

        act(() => {
            result.current.removeFromCart(1, '');
        });

        expect(result.current.cartItems).toHaveLength(0);
        expect(window.localStorage.setItem).toHaveBeenCalledWith('tacoCart', '[]');
    });

    test('should update quantity', () => {
        const { result } = renderHook(() => useCart(), { wrapper });
        const item = { id: 1, name: 'Item 1', price: 10 };

        act(() => {
            result.current.addToCart(item);
        });

        act(() => {
            result.current.updateQuantity(1, '', 5);
        });

        expect(result.current.cartItems[0].quantity).toBe(5);
        expect(result.current.getCartTotal()).toBe(50);
    });

    test('should remove item if quantity updated to 0', () => {
        const { result } = renderHook(() => useCart(), { wrapper });
        const item = { id: 1, name: 'Item 1', price: 10 };

        act(() => {
            result.current.addToCart(item);
        });

        act(() => {
            result.current.updateQuantity(1, '', 0);
        });

        expect(result.current.cartItems).toHaveLength(0);
    });

    test('should clear cart', () => {
        const { result } = renderHook(() => useCart(), { wrapper });
        const item = { id: 1, name: 'Item 1', price: 10 };

        act(() => {
            result.current.addToCart(item);
        });

        act(() => {
            result.current.clearCart();
        });

        expect(result.current.cartItems).toHaveLength(0);
        expect(result.current.getCartTotal()).toBe(0);
        expect(window.localStorage.setItem).toHaveBeenCalledWith('tacoCart', '[]');
    });
});

import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Location from '../../pages/Location';

describe('Location Page', () => {
    test('renders location page correctly', () => {
        render(
            <MemoryRouter>
                <Location />
            </MemoryRouter>
        );

        expect(screen.getByText('📍 Location & Hours')).toBeInTheDocument();
        expect(screen.getByText('Find Us')).toBeInTheDocument();
        expect(screen.getByText('🌮 Base 2 Tacos')).toBeInTheDocument();
        expect(screen.getByText('123 Taco Street')).toBeInTheDocument();
        expect(screen.getByText('Flavor Town, CA 90210')).toBeInTheDocument();

        expect(screen.getByText(/Phone:/)).toBeInTheDocument();
        expect(screen.getByText(/Email:/)).toBeInTheDocument();
    });

    test('renders hours of operation', () => {
        render(
            <MemoryRouter>
                <Location />
            </MemoryRouter>
        );

        expect(screen.getByText('Hours of Operation')).toBeInTheDocument();
        expect(screen.getByText('Monday - Friday')).toBeInTheDocument();
        expect(screen.getByText('11:00 AM - 9:00 PM')).toBeInTheDocument();
        expect(screen.getByText('Saturday')).toBeInTheDocument();
        expect(screen.getByText('10:00 AM - 10:00 PM')).toBeInTheDocument();
        expect(screen.getByText('Sunday')).toBeInTheDocument();
        expect(screen.getByText('10:00 AM - 8:00 PM')).toBeInTheDocument();
    });

    test('renders map placeholder', () => {
        render(
            <MemoryRouter>
                <Location />
            </MemoryRouter>
        );

        expect(screen.getByText(/Map would go here/)).toBeInTheDocument();
        expect(screen.getByText(/Google Maps integration can be added/)).toBeInTheDocument();
    });

    test('renders call to action with correct link', () => {
        render(
            <MemoryRouter>
                <Location />
            </MemoryRouter>
        );

        expect(screen.getByText('Ready to Order?')).toBeInTheDocument();
        expect(screen.getByText(/Visit our menu/)).toBeInTheDocument();

        const menuLink = screen.getByText('View Menu');
        expect(menuLink).toBeInTheDocument();
        expect(menuLink.closest('a')).toHaveAttribute('href', '/menu');
    });
});

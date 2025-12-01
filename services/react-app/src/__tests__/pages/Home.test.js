import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Home from '../../pages/Home';

describe('Home Page', () => {
    const renderHome = () => {
        return render(
            <BrowserRouter>
                <Home />
            </BrowserRouter>
        );
    };

    test('renders hero section', () => {
        renderHome();
        expect(screen.getByRole('heading', { level: 1, name: /Authentic Puebla Flavors/i })).toBeInTheDocument();
        // Modern Brooklyn Vibe is in a span inside h1, so accessible name of h1 includes it.
        // But getByText might still find multiple if footer has it.
        // Footer has it in p tag.
        // Let's use getAllByText for others or scope it.
        expect(screen.getAllByText(/Modern Brooklyn Vibe/i)[0]).toBeInTheDocument();
        expect(screen.getByText(/Order Now/i)).toBeInTheDocument();
        expect(screen.getAllByText(/View Menu/i)[0]).toBeInTheDocument();
    });

    test('renders featured menu items', () => {
        renderHome();
        expect(screen.getByText('Crowd Favorites')).toBeInTheDocument();
        expect(screen.getByText('Al Pastor')).toBeInTheDocument();
        expect(screen.getByText('Cemita Poblana')).toBeInTheDocument();
        expect(screen.getByText('Guacamole')).toBeInTheDocument();
    });

    test('renders about section', () => {
        renderHome();
        expect(screen.getByText('From Puebla with Love')).toBeInTheDocument();
        expect(screen.getByText('100%')).toBeInTheDocument();
        expect(screen.getByText('Authentic')).toBeInTheDocument();
    });

    test('renders footer', () => {
        renderHome();
        expect(screen.getByText(/Visit Us/i)).toBeInTheDocument();
        expect(screen.getByText(/505 51st Street/i)).toBeInTheDocument();
        expect(screen.getByText(/\(718\) 633-4816/i)).toBeInTheDocument();
        expect(screen.getByText(/All rights reserved/i)).toBeInTheDocument();
    });
});

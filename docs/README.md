# 🌮 Ricos Tacos - Modern Redesign

Authentic Puebla flavors meet modern Brooklyn vibes. This repository contains the source code for the Ricos Tacos website, featuring a sleek, responsive design and a robust backend.

## 🚀 Features

- **Modern Aesthetic**: Glassmorphism, refined typography, and a vibrant color palette (Burnt Orange & Deep Charcoal).
- **Responsive Design**: Optimized for mobile, tablet, and desktop.
- **Online Ordering**: Frictionless pickup ordering flow with Stripe integration.
- **Kitchen Dashboard**: Real-time order management for staff.
- **Admin Panel**: Menu and order management.

## 🛠️ Tech Stack

- **Frontend**: React, CSS Modules (Design System)
- **Backend**: Node.js, Express, PostgreSQL
- **Infrastructure**: Docker, Nginx

## 📦 Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/9KaelirAmaya9/RicosTacos-1.git
    ```
2.  Install dependencies:
    ```bash
    cd base2/react-app && npm install
    cd ../backend && npm install
    ```
3.  Start with Docker:
    ```bash
    docker compose -f base2/production.docker.yml up -d --build
    ```

## 🎨 Design System

The project uses a custom design system defined in `base2/react-app/src/styles/design-system.css`.

- **Primary Color**: `#E65100` (Burnt Orange)
- **Secondary Color**: `#212121` (Deep Charcoal)
- **Fonts**: Montserrat (Headings), Inter (Body)

import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/design-system.css';
import './Home.css';

const Home = () => {
    return (
        <div className="home-page">
            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-bg"></div>
                <div className="hero-overlay"></div>
                <div className="container hero-content">
                    <div className="hero-text-box card-glass animate-fade-in">
                        <h1 className="hero-title">
                            Authentic Puebla Flavors.<br />
                            <span className="text-primary">Modern Brooklyn Vibe.</span>
                        </h1>
                        <p className="hero-subtitle">
                            Experience the soul of Mexico with our handmade tortillas,
                            slow-roasted Al Pastor, and family recipes passed down through generations.
                        </p>
                        <div className="hero-actions">
                            <Link to="/menu" className="btn btn-primary">
                                Order Now 🌮
                            </Link>
                            <Link to="/menu" className="btn btn-glass">
                                View Menu
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured Menu Preview */}
            <section className="section featured-section">
                <div className="container">
                    <div className="section-header text-center">
                        <h2 className="section-title">Crowd Favorites</h2>
                        <p className="section-subtitle text-accent">Taste the tradition in every bite</p>
                    </div>

                    <div className="featured-grid">
                        {/* Card 1: Al Pastor */}
                        <div className="card featured-card delay-100">
                            <div className="card-image-container">
                                <span className="card-badge">Bestseller</span>
                                <div className="card-image-placeholder bg-al-pastor"></div>
                            </div>
                            <div className="card-content">
                                <div className="card-header">
                                    <h3>Al Pastor</h3>
                                    <span className="price">$4.50</span>
                                </div>
                                <p className="description">
                                    Marinated pork, slow-roasted on a vertical spit with pineapple.
                                    The king of tacos.
                                </p>
                                <Link to="/menu" className="btn btn-secondary btn-full">
                                    Add to Order
                                </Link>
                            </div>
                        </div>

                        {/* Card 2: Cemita */}
                        <div className="card featured-card delay-200">
                            <div className="card-image-container">
                                <div className="card-image-placeholder bg-cemita"></div>
                            </div>
                            <div className="card-content">
                                <div className="card-header">
                                    <h3>Cemita Poblana</h3>
                                    <span className="price">$12.00</span>
                                </div>
                                <p className="description">
                                    Puebla's iconic sandwich with breaded cutlet, avocado, Oaxaca cheese,
                                    and chipotle.
                                </p>
                                <Link to="/menu" className="btn btn-secondary btn-full">
                                    Add to Order
                                </Link>
                            </div>
                        </div>

                        {/* Card 3: Guacamole */}
                        <div className="card featured-card delay-300">
                            <div className="card-image-container">
                                <span className="card-badge badge-green">Fresh</span>
                                <div className="card-image-placeholder bg-guac"></div>
                            </div>
                            <div className="card-content">
                                <div className="card-header">
                                    <h3>Guacamole</h3>
                                    <span className="price">$6.00</span>
                                </div>
                                <p className="description">
                                    Made fresh to order with ripe avocados, lime, cilantro, and serrano peppers.
                                </p>
                                <Link to="/menu" className="btn btn-secondary btn-full">
                                    Add to Order
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="text-center mt-xl">
                        <Link to="/menu" className="btn btn-primary">
                            View Full Menu
                        </Link>
                    </div>
                </div>
            </section>

            {/* About Section */}
            <section className="section section-dark about-section">
                <div className="container">
                    <div className="about-grid">
                        <div className="about-content animate-fade-in">
                            <h2 className="text-light">From Puebla with Love</h2>
                            <p className="text-light-muted">
                                Ricos Tacos isn't just a restaurant; it's a bridge between the vibrant streets of Puebla
                                and the hustle of Brooklyn.
                            </p>
                            <p className="text-light-muted">
                                Our recipes are heirlooms, passed down from our abuelas. We believe in the power of
                                <span className="text-accent"> "Hecho a Mano"</span> (Handmade). That's why we press our
                                tortillas fresh every morning and roast our chiles daily.
                            </p>
                            <div className="stats-row">
                                <div className="stat">
                                    <span className="stat-number">100%</span>
                                    <span className="stat-label">Authentic</span>
                                </div>
                                <div className="stat">
                                    <span className="stat-number">Daily</span>
                                    <span className="stat-label">Fresh Prep</span>
                                </div>
                                <div className="stat">
                                    <span className="stat-number">Family</span>
                                    <span className="stat-label">Owned</span>
                                </div>
                            </div>
                        </div>
                        <div className="about-image-wrapper card-glass">
                            <div className="about-image-placeholder"></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="footer">
                <div className="container">
                    <div className="footer-grid">
                        <div className="footer-brand">
                            <h3>Ricos Tacos</h3>
                            <p>Authentic Puebla Flavors.<br />Modern Brooklyn Vibe.</p>
                        </div>
                        <div className="footer-links">
                            <h4>Menu</h4>
                            <Link to="/menu">Tacos</Link>
                            <Link to="/menu">Especialidades</Link>
                            <Link to="/menu">Sides</Link>
                        </div>
                        <div className="footer-contact">
                            <h4>Visit Us</h4>
                            <p>505 51st Street<br />Brooklyn, NY 11220</p>
                            <p>(718) 633-4816</p>
                        </div>
                        <div className="footer-hours">
                            <h4>Hours</h4>
                            <p>Mon-Sun: 11am - 10pm</p>
                        </div>
                    </div>
                    <div className="footer-bottom">
                        <p>&copy; {new Date().getFullYear()} Ricos Tacos. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;

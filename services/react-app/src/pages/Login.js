import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/design-system.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { loginWithEmail } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setError('');
            setLoading(true);

            const result = await loginWithEmail(email, password);

            if (result.success) {
                // Redirect based on role
                if (result.user?.role === 'ADMIN') {
                    navigate('/admin');
                } else if (result.user?.role === 'KITCHEN') {
                    navigate('/kitchen');
                } else {
                    navigate('/dashboard');
                }
            } else {
                setError(result.error || 'Failed to login');
            }
        } catch (err) {
            setError('Failed to login');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="section" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="container" style={{ maxWidth: '480px' }}>
                <div className="card card-glass animate-fade-in" style={{ padding: '2rem' }}>
                    <div className="text-center" style={{ marginBottom: '2rem' }}>
                        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Welcome Back</h1>
                        <p className="text-muted">Sign in to access your account</p>
                    </div>

                    {error && (
                        <div style={{
                            backgroundColor: 'rgba(198, 40, 40, 0.1)',
                            color: 'var(--color-error)',
                            padding: '1rem',
                            borderRadius: 'var(--radius-sm)',
                            marginBottom: '1.5rem',
                            fontSize: '0.9rem'
                        }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label
                                htmlFor="email"
                                style={{
                                    display: 'block',
                                    marginBottom: '0.5rem',
                                    fontWeight: '500',
                                    fontSize: '0.9rem'
                                }}
                            >
                                Email Address
                            </label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 1rem',
                                    borderRadius: 'var(--radius-sm)',
                                    border: '1px solid rgba(0,0,0,0.1)',
                                    fontSize: '1rem',
                                    fontFamily: 'var(--font-body)',
                                    transition: 'border-color 0.2s'
                                }}
                                placeholder="Enter your email"
                            />
                        </div>

                        <div style={{ marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <label
                                    htmlFor="password"
                                    style={{
                                        fontWeight: '500',
                                        fontSize: '0.9rem'
                                    }}
                                >
                                    Password
                                </label>
                                <Link
                                    to="/forgot-password"
                                    style={{
                                        fontSize: '0.85rem',
                                        color: 'var(--color-primary)',
                                        fontWeight: '500'
                                    }}
                                >
                                    Forgot Password?
                                </Link>
                            </div>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 1rem',
                                    borderRadius: 'var(--radius-sm)',
                                    border: '1px solid rgba(0,0,0,0.1)',
                                    fontSize: '1rem',
                                    fontFamily: 'var(--font-body)'
                                }}
                                placeholder="Enter your password"
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ width: '100%' }}
                            disabled={loading}
                        >
                            {loading ? 'Signing In...' : 'Sign In'}
                        </button>
                    </form>

                    <div className="text-center" style={{ marginTop: '2rem', fontSize: '0.9rem' }}>
                        <p style={{ color: 'var(--color-text-muted)' }}>
                            Don't have an account?{' '}
                            <Link to="/register" style={{ color: 'var(--color-primary)', fontWeight: '600' }}>
                                Sign Up
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;

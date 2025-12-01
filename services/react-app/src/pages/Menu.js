import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import api from '../services/api';
import '../styles/design-system.css';
import './Menu.css';

const Menu = () => {
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [addedItems, setAddedItems] = useState({});

  const { addToCart, getCartItemCount } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/menu', {
        params: { available_only: 'true' }
      });
      setMenu(response.data.data);
    } catch (err) {
      console.error('Error fetching menu:', err);
      setError('Failed to load menu. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (item) => {
    addToCart(item, 1);

    // Show feedback
    setAddedItems(prev => ({ ...prev, [item.id]: true }));
    setTimeout(() => {
      setAddedItems(prev => {
        const updated = { ...prev };
        delete updated[item.id];
        return updated;
      });
    }, 1000);
  };

  const filteredMenu = selectedCategory === 'ALL'
    ? menu
    : menu.filter(category => category.name === selectedCategory);

  if (loading) {
    return (
      <div className="menu-page loading-container">
        <div className="spinner"></div>
        <p>Preparing the menu...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="menu-page">
        <div className="error-container">
          <h3>¡Ay, caramba!</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={fetchMenu}>Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="menu-page">
      {/* Header */}
      <header className="menu-header">
        <div className="container">
          <h1 className="menu-title">Our Menu</h1>
          <p className="menu-subtitle">Authentic flavors, handmade daily.</p>
        </div>
      </header>

      {/* Category Navigation */}
      <div className="category-nav-container">
        <div className="container">
          <div className="category-nav">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`category-btn ${selectedCategory === 'ALL' ? 'active' : ''}`}
            >
              All Items
            </button>
            {menu.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.name)}
                className={`category-btn ${selectedCategory === category.name ? 'active' : ''}`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Categories */}
      <div className="container">
        {filteredMenu.map(category => (
          <section key={category.id} className="menu-category-section animate-fade-in">
            <h2 className="category-title">{category.name}</h2>
            <div className="menu-grid">
              {category.items.map(item => (
                <div key={item.id} className="menu-item-card">
                  {/* Image placeholder could go here if we had item images */}
                  <div className="item-content">
                    <div className="item-header">
                      <h3 className="item-name">{item.name}</h3>
                      <span className="item-price">${parseFloat(item.price).toFixed(2)}</span>
                    </div>

                    <div className="item-badges">
                      {item.is_special && <span className="badge badge-special">⭐ Special</span>}
                      {/* We could add spicy badge logic here if data existed */}
                    </div>

                    <p className="item-description">{item.description}</p>

                    <button
                      onClick={() => handleAddToCart(item)}
                      className={`add-btn ${addedItems[item.id] ? 'added' : ''}`}
                    >
                      {addedItems[item.id] ? (
                        <>✓ Added</>
                      ) : (
                        <>+ Add to Order</>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Floating Cart Button */}
      {getCartItemCount() > 0 && (
        <button
          onClick={() => navigate('/cart')}
          className="floating-cart-btn animate-fade-in"
        >
          🛒 View Cart ({getCartItemCount()})
        </button>
      )}
    </div>
  );
};

export default Menu;

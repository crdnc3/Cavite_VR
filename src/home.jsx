import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';

const Home = () => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchCards = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const snapshot = await getDocs(collection(db, 'locations'));
      const fetchedCards = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCards(fetchedCards);
    } catch (err) {
      console.error('Error fetching cards:', err);
      setError('Failed to load locations. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.body.classList.add('home');
    document.documentElement.classList.add('home');

    fetchCards();

    return () => {
      document.body.classList.remove('home');
      document.documentElement.classList.remove('home');
    };
  }, [fetchCards]);

  const handleCardClick = useCallback((card) => {
    navigate(`/review/${card.id}`, { state: card });
  }, [navigate]);

  const handleRetry = () => {
    fetchCards();
  };

  if (loading) {
    return (
      <div className="home-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading locations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="home-container">
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button onClick={handleRetry} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="home-container">
        <div className="empty-state">
          <p>No locations available at the moment.</p>
          <button onClick={handleRetry} className="retry-button">
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="home-container">
      {cards.map(card => (
        <div 
          key={card.id} 
          className="card" 
          onClick={() => handleCardClick(card)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleCardClick(card);
            }
          }}
          aria-label={`View details for ${card.title}`}
        >
          <div className="card-image-container">
            <img 
              src={card.image} 
              alt={card.title}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className="image-placeholder" style={{ display: 'none' }}>
              <span>Image not available</span>
            </div>
          </div>
          <div className="card-content">
            <h3>{card.title}</h3>
            <p>{card.subtitle}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Home;
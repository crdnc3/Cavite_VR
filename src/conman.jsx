import React, { useEffect, useRef, useState } from 'react';
import Sidebar from './Sidebar';
import './conman.css';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from './firebase';

function Conman() {
  const [cards, setCards] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    body: '',
    image: '',
    mapLink: '',
  });
  const [editingId, setEditingId] = useState(null);
  const formRef = useRef(null);

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'locations'));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCards(data);
    } catch (error) {
      console.error('Error fetching cards:', error);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    try {
      if (editingId) {
        await updateDoc(doc(db, 'locations', editingId), formData);
        alert('Card updated!');
      } else {
        await addDoc(collection(db, 'locations'), formData);
        alert('Card added!');
      }
      setFormData({
        title: '',
        subtitle: '',
        body: '',
        image: '',
        mapLink: '',
      });
      setEditingId(null);
      fetchCards();
    } catch (error) {
      console.error('Error saving card:', error);
    }
  };

  const handleEdit = (card) => {
    setFormData({
      title: card.title || '',
      subtitle: card.subtitle || '',
      body: card.body || '',
      image: card.image || '',
      mapLink: card.mapLink || '',
    });
    setEditingId(card.id);

    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm('Are you sure you want to delete this card?');
    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, 'locations', id));
      alert('Card deleted!');
      fetchCards();
      if (editingId === id) {
        setEditingId(null);
        setFormData({
          title: '',
          subtitle: '',
          body: '',
          image: '',
          mapLink: '',
        });
      }
    } catch (error) {
      console.error('Error deleting card:', error);
      alert('Failed to delete the card.');
    }
  };

  return (
    <div className="conman-page">
      <Sidebar />
      <div className="conman-content">
        <h1>Content Manager</h1>

        <div ref={formRef} className="form-container">
          <input
            type="text"
            name="title"
            placeholder="Title"
            value={formData.title}
            onChange={handleChange}
          />
          <input
            type="text"
            name="subtitle"
            placeholder="Subtitle"
            value={formData.subtitle}
            onChange={handleChange}
          />
          <textarea
            name="body"
            placeholder="Description"
            value={formData.body}
            onChange={handleChange}
            rows="4"
          />
          <input
            type="text"
            name="image"
            placeholder="Image URL (Google Drive or direct)"
            value={formData.image}
            onChange={handleChange}
          />
          <input
            type="text"
            name="mapLink"
            placeholder="Embed Map Link"
            value={formData.mapLink}
            onChange={handleChange}
          />
          {formData.mapLink && (
            <iframe
              src={formData.mapLink}
              width="100%"
              height="200"
              style={{ border: 0, marginTop: '10px', borderRadius: '8px' }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="map-preview"
            />
          )}
          <button onClick={handleSubmit} style={{ marginTop: '12px' }}>
            {editingId ? 'Update Card' : 'Add Card'}
          </button>
        </div>

        <div className="card-list">
          <h2>Existing Cards</h2>
          <div className="card-grid">
            {cards.map((card) => (
              <div key={card.id} className="card-preview">
                <img src={card.image} alt={card.title} />
                <div>
                  <h3>{card.title}</h3>
                  <p>{card.subtitle}</p>
                  {/* Description intentionally hidden */}
                  <button onClick={() => handleEdit(card)}>Edit</button>
                  <button onClick={() => handleDelete(card.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Conman;

import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { FaCommentDots } from 'react-icons/fa';
import { auth, db } from './firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import './review.css';

const Review = () => {
  const location = useLocation();
  const [showReportBox, setShowReportBox] = useState(false);
  const [reportText, setReportText] = useState('');

  const { title, subtitle, body, image, mapLink } = location.state || {};

  useEffect(() => {
    document.body.classList.add('review');
    document.documentElement.classList.add('review');

    return () => {
      document.body.classList.remove('review');
      document.documentElement.classList.remove('review');
    };
  }, []);

  const toggleReportBox = () => {
    setShowReportBox(!showReportBox);
  };

  const handleSubmitReport = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        alert("You must be logged in to submit a report.");
        return;
      }

      await addDoc(collection(db, "reports"), {
        userId: user.uid,
        email: user.email,
        locationTitle: title,
        reportText: reportText,
        submittedAt: serverTimestamp()
      });

      alert('Thank you. Your feedback has been submitted.');
      setReportText('');
      setShowReportBox(false);
    } catch (error) {
      console.error("Error submitting report:", error);
      alert("An error occurred. Please try again.");
    }
  };

  return (
    <div className="review-card two-column">
      <div className="review-left">
        {image && (
          <div className="review-image-container">
            <img src={image} alt={title} className="review-image" />
          </div>
        )}
        <h2 className="review-title">{title}</h2>
        <h3 className="review-subtitle">{subtitle}</h3>
        <p className="review-body-text">
          {body.split('\n').map((line, i) => (
            <span key={i}>
              {line}
              <br />
            </span>
          ))}
        </p>
      </div>

      <div className="review-right">
        <h3>Location</h3>
        {mapLink && mapLink.startsWith('https://www.google.com/maps/embed') ? (
          <iframe
            src={mapLink}
            className="review-map"
            allowFullScreen=""
            loading="lazy"
            title="Location Map"
          />
        ) : (
          <p style={{ fontStyle: 'italic', color: '#888' }}>
            No valid map available. Please ensure the embed map link is correct.
          </p>
        )}

        <button className="report-button" onClick={toggleReportBox}>
          <FaCommentDots style={{ marginRight: '8px' }} />
          Leave Feedback
        </button>
      </div>

      {showReportBox && (
        <div className="modal-overlay">
          <div className="modal-container">
            <h4>Leave Feedback</h4>
            <textarea
              placeholder="Describe your feedback..."
              rows="4"
              className="report-textarea"
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
            />
            <div className="modal-buttons">
              <button className="submit-report-button" onClick={handleSubmitReport}>
                Submit
              </button>
              <button className="cancel-report-button" onClick={toggleReportBox}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Review;

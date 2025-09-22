import React, { useState, useEffect, useCallback } from "react";
import { collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  Church,
  MapPin,
  Clock,
  Coins,
  Info,
  X,
  Building,
  Flag,
  Shield,
  Landmark,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
} from "lucide-react";
import "./CaviteInfographic.css";

const CaviteInfographic = ({ searchTerm }) => {
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [treasures, setTreasures] = useState([]);
  const [landmarks, setLandmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  
  // Feedback states
  const [showFeedbackBox, setShowFeedbackBox] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // Auth state tracking
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoaded, setAuthLoaded] = useState(false);

  // Enhanced auth state listener
  useEffect(() => {
    console.log("Setting up auth listener...");
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("Auth state changed:", {
        email: user?.email,
        uid: user?.uid,
        timestamp: new Date().toISOString()
      });
      
      setCurrentUser(user);
      setAuthLoaded(true);
    });

    return () => {
      console.log("Cleaning up auth listener");
      unsubscribe();
    };
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const treasuresSnapshot = await getDocs(collection(db, "treasures"));
      const fetchedTreasures = treasuresSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const landmarksSnapshot = await getDocs(collection(db, "landmarks"));
      const fetchedLandmarks = landmarksSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setTreasures(fetchedTreasures);
      setLandmarks(fetchedLandmarks);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.body.classList.add("cavite-infographic");
    document.documentElement.classList.add("cavite-infographic");
    fetchData();
    return () => {
      document.body.classList.remove("cavite-infographic");
      document.documentElement.classList.remove("cavite-infographic");
    };
  }, [fetchData]);

  const allItems = [...treasures, ...landmarks];

  const filteredByCategory =
    activeCategory === "all"
      ? allItems
      : activeCategory === "treasures"
      ? treasures
      : landmarks;

  const filteredItems = filteredByCategory.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getIcon = (type) => {
    switch (type) {
      case "Church":
      case "Religious Icon":
        return <Church className="w-6 h-6" />;
      case "War Memorial":
        return <Shield className="w-6 h-6" />;
      case "Museum":
        return <Building className="w-6 h-6" />;
      case "Historical Site":
        return <Landmark className="w-6 h-6" />;
      case "Battle Site":
        return <Flag className="w-6 h-6" />;
      default:
        return <MapPin className="w-6 h-6" />;
    }
  };

  const handleNextImage = () => {
    if (selectedItem && Array.isArray(selectedItem.images)) {
      setCurrentImageIndex((prev) => (prev + 1) % selectedItem.images.length);
    }
  };

  const handlePrevImage = () => {
    if (selectedItem && Array.isArray(selectedItem.images)) {
      setCurrentImageIndex(
        (prev) => (prev - 1 + selectedItem.images.length) % selectedItem.images.length
      );
    }
  };

  const openModal = (item) => {
    setSelectedItem(item);
    setCurrentImageIndex(0);
    setLightboxOpen(false);
    setShowFeedbackBox(false);
    setFeedbackText('');
  };

  const toggleFeedbackBox = () => {
    setShowFeedbackBox(!showFeedbackBox);
  };

  const handleSubmitFeedback = async () => {
    if (submittingFeedback) return; // Prevent double submission
    
    try {
      setSubmittingFeedback(true);
      
      console.log("Starting feedback submission...");
      console.log("Auth loaded:", authLoaded);
      console.log("Current user from state:", currentUser?.email);
      console.log("Auth.currentUser:", auth.currentUser?.email);

      // Wait for auth to be loaded
      if (!authLoaded) {
        alert("Authentication is still loading. Please wait a moment and try again.");
        return;
      }

      // Double check both state and auth object
      const stateUser = currentUser;
      const authUser = auth.currentUser;
      
      console.log("State user:", stateUser?.email);
      console.log("Auth user:", authUser?.email);

      if (!stateUser || !authUser) {
        alert("You must be logged in to submit feedback. Please log in again.");
        return;
      }

      if (!feedbackText.trim()) {
        alert("Please enter your feedback before submitting.");
        return;
      }

      // Use auth.currentUser as the definitive source
      const finalUser = auth.currentUser;
      
      console.log("Final user for submission:", {
        email: finalUser.email,
        uid: finalUser.uid
      });

      // Create the feedback document
      const feedbackData = {
        userId: finalUser.uid,
        email: finalUser.email,
        locationTitle: selectedItem.name,
        reportText: feedbackText.trim(),
        submittedAt: serverTimestamp(),
        // Add additional debug info
        submissionTimestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      };

      console.log("Submitting feedback data:", feedbackData);

      const docRef = await addDoc(collection(db, "reports"), feedbackData);
      
      console.log("Feedback submitted successfully with ID:", docRef.id);

      alert('Thank you. Your feedback has been submitted successfully.');
      setFeedbackText('');
      setShowFeedbackBox(false);

    } catch (error) {
      console.error("Error submitting feedback:", error);
      console.error("Error details:", {
        code: error.code,
        message: error.message
      });
      alert("An error occurred while submitting your feedback. Please try again.");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  if (loading) {
    return (
      <div className="cavite-infographic">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cavite-infographic">
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button onClick={fetchData} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cavite-infographic">
      {/* Debug Panel - REMOVE IN PRODUCTION */}
      <div style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        fontSize: '12px',
        zIndex: 9999
      }}>
        <div>Auth Loaded: {authLoaded ? '✅' : '❌'}</div>
        <div>State User: {currentUser?.email || 'None'}</div>
        <div>Auth User: {auth.currentUser?.email || 'None'}</div>
        <div>Match: {currentUser?.email === auth.currentUser?.email ? '✅' : '❌'}</div>
      </div>

      {/* Header */}
      <div className="cavite-header">
        <div className="cavite-header-container">
          <h1 className="cavite-main-title">Cavite's Heritage</h1>
          <p className="cavite-subtitle">
            Cradle of Philippine History & Independence
          </p>
          <p className="cavite-description">
            Explore the treasures of faith and landmarks of revolution that
            shaped the Filipino nation's journey to freedom
          </p>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="cavite-content-container">
        <div className="cavite-filter-container">
          {[
            { key: "all", label: "All Sites", icon: <MapPin className="w-5 h-5" /> },
            { key: "treasures", label: "Treasures of Faith", icon: <Church className="w-5 h-5" /> },
            { key: "landmarks", label: "Landmarks of Revolution", icon: <Landmark className="w-5 h-5" /> },
          ].map((filter) => (
            <button
              key={filter.key}
              onClick={() => setActiveCategory(filter.key)}
              className={`cavite-filter-btn ${
                activeCategory === filter.key ? "active" : "inactive"
              }`}
            >
              {filter.icon}
              {filter.label}
            </button>
          ))}
        </div>

        {/* Items Grid */}
        <div className="cavite-grid">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="cavite-card"
              onClick={() => openModal(item)}
            >
              <div className="cavite-card-image-container">
                <img
                  src={Array.isArray(item.images) ? item.images[0] : item.image}
                  alt={item.name}
                  className="cavite-card-image"
                />
                <div className={`cavite-card-icon ${item.category}`}>
                  {getIcon(item.type)}
                </div>
                <div className={`cavite-card-type-badge ${item.category}`}>
                  {item.type}
                </div>
              </div>
              <div className="cavite-card-content">
                <h3 className="cavite-card-title">{item.name}</h3>
                <div className="cavite-card-location">
                  <MapPin />
                  <span>{item.location}</span>
                </div>
                <p className="cavite-card-description">{item.shortDesc}</p>
                <button className="cavite-card-learn-more">
                  <Info />
                  Learn More
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {selectedItem && (
        <div className="cavite-modal-overlay" onClick={() => setSelectedItem(null)}>
          <div className="cavite-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cavite-modal-image-container">
              <img
                src={
                  Array.isArray(selectedItem.images)
                    ? selectedItem.images[currentImageIndex]
                    : selectedItem.image
                }
                alt={`${selectedItem.name} ${currentImageIndex + 1}`}
                className={`cavite-modal-image ${lightboxOpen ? "expanded" : ""}`}
                onClick={() => setLightboxOpen(!lightboxOpen)}
              />

              {/* Carousel */}
              {Array.isArray(selectedItem.images) && selectedItem.images.length > 1 && (
                <>
                  <button
                    className={`carousel-btn prev ${lightboxOpen ? "expanded-btn" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrevImage();
                    }}
                  >
                    <ChevronLeft />
                  </button>
                  <button
                    className={`carousel-btn next ${lightboxOpen ? "expanded-btn" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNextImage();
                    }}
                  >
                    <ChevronRight />
                  </button>
                </>
              )}

              <button
                onClick={() => setSelectedItem(null)}
                className="cavite-modal-close"
              >
                <X />
              </button>
              <div className={`cavite-modal-icon ${selectedItem.category}`}>
                {getIcon(selectedItem.type)}
              </div>
            </div>

            <div className="cavite-modal-content">
              <div className="cavite-modal-header">
                <h2 className="cavite-modal-title">{selectedItem.name}</h2>
                <span className={`cavite-modal-type-badge ${selectedItem.category}`}>
                  {selectedItem.type}
                </span>
              </div>
              <div className="cavite-modal-location">
                <MapPin />
                <span>{selectedItem.location}</span>
              </div>
              <p className="cavite-modal-description">{selectedItem.description}</p>

              <div className="cavite-modal-details-grid">
                <div>
                  <div className="cavite-modal-details-section">
                    <Clock className="cavite-modal-details-icon hours" />
                    <div className="cavite-modal-details-content">
                      <h4>Operating Hours</h4>
                      <p>{selectedItem.details.hours}</p>
                    </div>
                  </div>
                  <div className="cavite-modal-details-section">
                    <Coins className="cavite-modal-details-icon fee" />
                    <div className="cavite-modal-details-content">
                      <h4>Entrance Fee</h4>
                      <p>{selectedItem.details.fee}</p>
                    </div>
                  </div>
                  <div className="cavite-modal-details-section">
                    <Building className="cavite-modal-details-icon founded" />
                    <div className="cavite-modal-details-content">
                      <h4>Founded</h4>
                      <p>{selectedItem.details.founded}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="cavite-modal-significance">
                    <h4>Historical Significance</h4>
                    <p>{selectedItem.details.significance}</p>
                  </div>
                  <div className="cavite-modal-architecture">
                    <h4>Architecture</h4>
                    <p>{selectedItem.details.architecture}</p>
                  </div>
                </div>
              </div>

              {/* Historical Note */}
              <div className="cavite-modal-historical-note">
                <h4><Info /> Historical Note</h4>
                <p>{selectedItem.details.historicalNote}</p>
              </div>

              {/* Transportation */}
              <div className="cavite-modal-transportation">
                <h4><MapPin /> How to get there?</h4>
                <ul>
                  {selectedItem.details.transportation
                    ?.split(/\r?\n|-/)
                    .map((line, idx) => {
                      const trimmed = line.trim();
                      return trimmed ? <li key={idx}>{trimmed}</li> : null;
                    })}
                </ul>
              </div>

              {/* Embedded Map */}
              {selectedItem.mapLink && (
                <div className="cavite-modal-map">
                  <h4><MapPin /> Location Map</h4>
                  <iframe
                    src={selectedItem.mapLink}
                    width="100%"
                    height="300"
                    style={{ border: 0, borderRadius: "8px", marginTop: "10px" }}
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="map"
                  />
                </div>
              )}

              {/* Feedback Button */}
              <div className="cavite-modal-feedback-section">
                <button className="cavite-feedback-button" onClick={toggleFeedbackBox}>
                  <MessageCircle className="w-5 h-5" />
                  Leave Feedback
                </button>
              </div>
            </div>
          </div>

          {/* Feedback Modal */}
          {showFeedbackBox && (
            <div className="cavite-feedback-modal-overlay" onClick={(e) => e.stopPropagation()}>
              <div className="cavite-feedback-modal-container">
                <h4>Leave Feedback for {selectedItem.name}</h4>
                <p style={{fontSize: '12px', color: '#666', marginBottom: '10px'}}>
                  Submitting as: {auth.currentUser?.email || 'Not logged in'}
                </p>
                <textarea
                  placeholder="Share your thoughts about this historical site..."
                  rows="4"
                  className="cavite-feedback-textarea"
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  disabled={submittingFeedback}
                />
                <div className="cavite-feedback-modal-buttons">
                  <button 
                    className="cavite-submit-feedback-button" 
                    onClick={handleSubmitFeedback}
                    disabled={submittingFeedback || !auth.currentUser}
                  >
                    {submittingFeedback ? 'Submitting...' : 'Submit Feedback'}
                  </button>
                  <button 
                    className="cavite-cancel-feedback-button" 
                    onClick={toggleFeedbackBox}
                    disabled={submittingFeedback}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CaviteInfographic;
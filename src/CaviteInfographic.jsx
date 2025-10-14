import React, { useState, useEffect, useCallback } from "react";
import { 
  collection, 
  getDocs, 
  addDoc, 
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc
} from "firebase/firestore";
import { db, auth } from "./firebase";
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
  Eye,
  Trash2,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import justlogo from './assets/images/justlogo.png';
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
  const [customAlert, setCustomAlert] = useState({ show: false, message: "" });

  // Feedback states
  const [showFeedbackBox, setShowFeedbackBox] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [currentUserName, setCurrentUserName] = useState('');
  
  // View Feedbacks states
  const [showViewFeedbacks, setShowViewFeedbacks] = useState(false);
  const [feedbacksList, setFeedbacksList] = useState([]);
  const [feedbacksLoading, setFeedbacksLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, feedbackId: null });

  const [showPrivacyFooter, setShowPrivacyFooter] = useState(false);
  const [showTermsFooter, setShowTermsFooter] = useState(false);

  // Fetch current user name from Firebase Auth
  useEffect(() => {
    if (auth.currentUser) {
      setCurrentUserName(auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'Anonymous');
    } else {
      setCurrentUserName('');
    }
  }, [selectedItem]);

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
    setShowViewFeedbacks(false);
    setFeedbackText('');
    setFeedbacksList([]);
  };

  // Get collection path based on item category
  const getCollectionPath = (item) => {
    const category = item.category || 'landmarks';
    return category === 'treasures' ? 'treasures' : 'landmarks';
  };

  // Fetch feedbacks for selected item
  const fetchFeedbacks = useCallback(async () => {
    if (!selectedItem) return;
    
    try {
      setFeedbacksLoading(true);
      const collectionPath = getCollectionPath(selectedItem);
      const feedbacksRef = collection(db, collectionPath, selectedItem.id, 'Feedbacks');
      const q = query(feedbacksRef, orderBy('submittedAt', 'desc'));
      
      const feedbacksSnapshot = await getDocs(q);
      const feedbacks = feedbacksSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      setFeedbacksList(feedbacks);
    } catch (err) {
      console.error("Error fetching feedbacks:", err);
      setCustomAlert({ show: true, message: "Failed to load feedbacks." });
    } finally {
      setFeedbacksLoading(false);
    }
  }, [selectedItem]);

  // Subscribe to real-time feedbacks
  useEffect(() => {
    if (!showViewFeedbacks || !selectedItem) return;
    
    try {
      const collectionPath = getCollectionPath(selectedItem);
      const feedbacksRef = collection(db, collectionPath, selectedItem.id, 'Feedbacks');
      const q = query(feedbacksRef, orderBy('submittedAt', 'desc'));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const feedbacks = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setFeedbacksList(feedbacks);
      });

      return () => unsubscribe();
    } catch (err) {
      console.error("Error setting up real-time listener:", err);
    }
  }, [showViewFeedbacks, selectedItem]);

  // Toggle feedback view with initial fetch
  const toggleViewFeedbacks = () => {
    if (!showViewFeedbacks) {
      fetchFeedbacks();
    }
    setShowViewFeedbacks(!showViewFeedbacks);
  };

  const toggleFeedbackBox = () => {
    setShowFeedbackBox(!showFeedbackBox);
  };

  const handleSubmitFeedback = async () => {
    try {
      if (!currentUserName) {
        setCustomAlert({ show: true, message: "Please log in to submit feedback." });
        return;
      }

      if (!feedbackText.trim()) {
        setCustomAlert({ show: true, message: "Please enter your feedback." });
        return;
      }

      const collectionPath = getCollectionPath(selectedItem);
      const feedbacksRef = collection(db, collectionPath, selectedItem.id, 'Feedbacks');
      
      await addDoc(feedbacksRef, {
        user: currentUserName,
        message: feedbackText,
        submittedAt: serverTimestamp()
      });

      setCustomAlert({ show: true, message: "Thank you! Your feedback has been submitted." });
      setFeedbackText('');
      setShowFeedbackBox(false);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      setCustomAlert({ show: true, message: "An error occurred. Please try again." });
    }
  };

  // Delete feedback function
  const handleDeleteFeedback = async (feedbackId) => {
    try {
      const collectionPath = getCollectionPath(selectedItem);
      const feedbackDocRef = doc(db, collectionPath, selectedItem.id, 'Feedbacks', feedbackId);
      
      await deleteDoc(feedbackDocRef);
      
      setCustomAlert({ show: true, message: "Feedback deleted successfully." });
      setDeleteConfirm({ show: false, feedbackId: null });
    } catch (error) {
      console.error("Error deleting feedback:", error);
      setCustomAlert({ show: true, message: "Failed to delete feedback." });
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
                <h4><MapPin /> How to get there from Manila?</h4>
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

              {/* Feedback Buttons */}
              <div className="cavite-modal-feedback-section">
                <button 
                  className="cavite-feedback-button" 
                  onClick={toggleViewFeedbacks}
                >
                  <Eye className="w-5 h-5" />
                  View Feedbacks
                </button>
                <button 
                  className="cavite-feedback-button" 
                  onClick={toggleFeedbackBox}
                >
                  <MessageCircle className="w-5 h-5" />
                  Leave Feedback
                </button>
              </div>
            </div>
          </div>

          {/* View Feedbacks Modal */}
          {showViewFeedbacks && (
            <div 
              className="cavite-feedback-modal-overlay" 
              onClick={() => setShowViewFeedbacks(false)}
            >
              <div 
                className="cavite-feedbacks-modal-container"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="cavite-feedbacks-modal-header">
                  <h4>Feedbacks for {selectedItem.name}</h4>
                  <button 
                    className="cavite-feedbacks-close-btn"
                    onClick={() => setShowViewFeedbacks(false)}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {feedbacksLoading ? (
                  <div className="cavite-feedbacks-loading">
                    <p>Loading feedbacks...</p>
                  </div>
                ) : feedbacksList.length === 0 ? (
                  <div className="cavite-feedbacks-empty">
                    <p>No feedbacks yet. Be the first to share!</p>
                  </div>
                ) : (
                  <div className="cavite-feedbacks-list">
                    {feedbacksList.map((feedback) => (
                      <div key={feedback.id} className="cavite-feedback-item">
                        <div className="cavite-feedback-user">
                          <strong>{feedback.user}</strong>
                          {feedback.submittedAt && (
                            <span className="cavite-feedback-date">
                              {new Date(feedback.submittedAt.seconds * 1000).toLocaleDateString()}
                            </span>
                          )}
                          {currentUserName === feedback.user && (
                            <button 
                              className="feedback-del"
                              onClick={() => setDeleteConfirm({ show: true, feedbackId: feedback.id })}
                              title="Delete this feedback"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <p className="cavite-feedback-message">{feedback.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {deleteConfirm.show && (
            <div 
              className="feedback-delete-confirm-overlay" 
              onClick={() => setDeleteConfirm({ show: false, feedbackId: null })}
            >
              <div 
                className="feedback-custom-alert-box" 
                onClick={(e) => e.stopPropagation()}
              >
                <p>Are you sure you want to delete this feedback?</p>
                <div className="feedback-cavite-feedback-modal-buttons">
                  <button 
                    className="feedback-cavite-submit-feedback-button"
                    onClick={() => handleDeleteFeedback(deleteConfirm.feedbackId)}
                  >
                    Delete
                  </button>
                  <button 
                    className="feedback-cavite-cancel-feedback-button"
                    onClick={() => setDeleteConfirm({ show: false, feedbackId: null })}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Leave Feedback Modal */}
          {showFeedbackBox && (
            <div 
              className="cavite-feedback-modal-overlay" 
              onClick={() => setShowFeedbackBox(false)}
            >
              <div 
                className="cavite-feedback-modal-container"
                onClick={(e) => e.stopPropagation()}
              >
                <h4>Leave Feedback for {selectedItem.name}</h4>
                
                <div className="cavite-feedback-user-display">
                  <p><strong>Submitting as:</strong> {currentUserName || 'Not logged in'}</p>
                </div>
                
                <textarea
                  placeholder="Share your thoughts about this historical site..."
                  rows="4"
                  className="cavite-feedback-textarea"
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                />
                
                <div className="cavite-feedback-modal-buttons">
                  <button 
                    className="cavite-submit-feedback-button" 
                    onClick={handleSubmitFeedback}
                  >
                    Submit Feedback
                  </button>
                  <button 
                    className="cavite-cancel-feedback-button" 
                    onClick={toggleFeedbackBox}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Feedback Confirmation Modal */}
          {customAlert.show && (
            <div 
              className="custom-alert-overlay" 
              onClick={() => setCustomAlert({ show: false, message: "" })}
            >
              <div 
                className="custom-alert-box" 
                onClick={(e) => e.stopPropagation()}
              >
                <p>{customAlert.message}</p>
                <button onClick={() => setCustomAlert({ show: false, message: "" })}>
                  OK
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <footer className="heritage-site-footer">
        <div className="heritage-footer-wrapper">
          <div className="heritage-footer-brand">
            <img src={justlogo} alt="Cavite VR Logo" className="heritage-footer-logo" />
            <div className="heritage-footer-branding-text">
              <h4>Cavite: VR</h4>
              <p>Heritage Through Technology</p>
            </div>
          </div>

          <nav className="heritage-footer-navigation">
            <h5>Quick Links</h5>
            <div className="heritage-footer-nav-links">
              <NavLink 
                to="/caviteinfographic" 
                className="heritage-footer-nav-item"
              >
                HOME
              </NavLink>
              <NavLink 
                to="/about" 
                className="heritage-footer-nav-item"
              >
                ABOUT
              </NavLink>
              <NavLink 
                to="/faq" 
                className="heritage-footer-nav-item"
              >
                FAQ
              </NavLink>
            </div>
          </nav>

          <div className="heritage-footer-legal">
            <h5>Legal</h5>
            <ul className="heritage-footer-legal-links">
              <li>
                <button className="footer-legal-link" onClick={() => setShowPrivacyFooter(true)}>
                  Privacy Policy
                </button>
              </li>
              <li>
                <button className="footer-legal-link" onClick={() => setShowTermsFooter(true)}>
                  Terms of Service
                </button>
              </li>
            </ul>
          </div>

          {showPrivacyFooter && (
            <div className="footer-privacy-modal-overlay">
              <div className="footer-privacy-modal">
                <span className="footer-close-modal" onClick={() => setShowPrivacyFooter(false)}>
                  &times;
                </span>
                <h2>Privacy Policy</h2>
                <p>
                  Your privacy is important to us. This Privacy Policy explains how we collect,
                  use, and protect your information when you use the Cavite VR Website.
                </p>
                <ul>
                  <li>
                    <b>Information We Collect:</b> We only collect your <b>email</b>, <b>region</b>, and
                    <b> city</b> to help us understand user interest from different areas.
                  </li>
                  <li>
                    <b>Use of Information:</b> Data is used solely for improving user experience,
                    educational content, and website functionality. We do not sell or share your
                    information with third parties.
                  </li>
                  <li>
                    <b>Data Security:</b> Reasonable technical and organizational measures are applied
                    to protect your data from unauthorized access or disclosure.
                  </li>
                  <li>
                    <b>User Control:</b> You can request access, correction, or deletion of your data by
                    contacting our support team.
                  </li>
                  <li>
                    <b>Third-Party Services:</b> Some features (e.g., Google Maps) follow their own
                    privacy policies. We are not responsible for those.
                  </li>
                  <li>
                    <b>Updates:</b> We may update this policy periodically. Continued use implies
                    acceptance of any revisions.
                  </li>
                </ul>
                <p>
                  By using the Cavite VR Website, you consent to this Privacy Policy.
                </p>
              </div>
            </div>
          )}

          {showTermsFooter && (
            <div className="footer-terms-modal-overlay">
              <div className="footer-terms-modal">
                <span className="footer-close-modal" onClick={() => setShowTermsFooter(false)}>
                  &times;
                </span>
                <h2>Terms of Use</h2>
                <p>
                  Welcome to the Cavite VR Website. By using our platform, you agree to the following
                  terms and conditions:
                </p>
                <ul>
                  <li>
                    <b>Educational Purpose:</b> Content is provided solely for educational and personal
                    use. Commercial use or redistribution without consent is prohibited.
                  </li>
                  <li>
                    <b>Intellectual Property:</b> Historical data and photographs remain the property of
                    their respective owners. Unauthorized copying or distribution is not allowed.
                  </li>
                  <li>
                    <b>Accuracy of Information:</b> While verified sources are used, some data (e.g.,
                    operating hours, fees) may change. Check official sources before visiting.
                  </li>
                  <li>
                    <b>Third-Party Links:</b> We are not responsible for external links or content.
                  </li>
                  <li>
                    <b>Limitation of Liability:</b> Use of the site is at your own risk. We are not liable
                    for damages or losses resulting from reliance on provided content.
                  </li>
                </ul>
                <p>
                  By continuing to use the Cavite VR Website, you acknowledge and agree to these Terms of
                  Use. If you do not agree, please discontinue use of the site.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="heritage-footer-copyright">
          <p>&copy; 2024 Cavite: VR. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default CaviteInfographic;
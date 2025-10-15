import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import './Support.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from './firebase';

function Support() {
  const [feedbacksByPlace, setFeedbacksByPlace] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, feedback: null });
  const [expandedPlaces, setExpandedPlaces] = useState({});
  
  // New state for filtering, sorting, and pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all'); // 'all', 'landmarks', 'treasures'
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'name-asc', 'name-desc'
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [placeFeedbackPages, setPlaceFeedbackPages] = useState({}); // Track pagination per place
  const feedbacksPerPlace = 5;

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, sortBy]);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const groupedFeedbacks = {};

      // Fetch feedbacks from landmarks collection
      const landmarksSnapshot = await getDocs(collection(db, 'landmarks'));
      for (const landmarkDoc of landmarksSnapshot.docs) {
        const landmarkData = landmarkDoc.data();
        const placeName = landmarkData.name || landmarkDoc.id;
        
        const feedbacksSnapshot = await getDocs(
          collection(db, 'landmarks', landmarkDoc.id, 'Feedbacks')
        );
        
        const feedbacksArray = [];
        feedbacksSnapshot.forEach((feedbackDoc) => {
          feedbacksArray.push({
            id: feedbackDoc.id,
            ...feedbackDoc.data(),
            collectionType: 'landmarks',
            placeId: landmarkDoc.id,
          });
        });

        if (feedbacksArray.length > 0) {
          groupedFeedbacks[placeName] = {
            feedbacks: feedbacksArray,
            type: 'Landmark',
            icon: 'fa-map-marker-alt',
          };
        }
      }

      // Fetch feedbacks from treasures collection
      const treasuresSnapshot = await getDocs(collection(db, 'treasures'));
      for (const treasureDoc of treasuresSnapshot.docs) {
        const treasureData = treasureDoc.data();
        const placeName = treasureData.name || treasureDoc.id;
        
        const feedbacksSnapshot = await getDocs(
          collection(db, 'treasures', treasureDoc.id, 'Feedbacks')
        );
        
        const feedbacksArray = [];
        feedbacksSnapshot.forEach((feedbackDoc) => {
          feedbacksArray.push({
            id: feedbackDoc.id,
            ...feedbackDoc.data(),
            collectionType: 'treasures',
            placeId: treasureDoc.id,
          });
        });

        if (feedbacksArray.length > 0) {
          groupedFeedbacks[placeName] = {
            feedbacks: feedbacksArray,
            type: 'Treasure',
            icon: 'fas fa-church',
          };
        }
      }

      // Sort feedbacks within each place by date (newest first)
      Object.keys(groupedFeedbacks).forEach((placeName) => {
        groupedFeedbacks[placeName].feedbacks.sort((a, b) => {
          const dateA = a.submittedAt?.toDate?.() || new Date(a.submittedAt);
          const dateB = b.submittedAt?.toDate?.() || new Date(b.submittedAt);
          return dateB - dateA;
        });
      });

      setFeedbacksByPlace(groupedFeedbacks);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching feedbacks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFeedback = async (feedback) => {
    try {
      const feedbackRef = doc(
        db,
        feedback.collectionType,
        feedback.placeId,
        'Feedbacks',
        feedback.id
      );
      
      await deleteDoc(feedbackRef);
      await fetchFeedbacks();
      
      setDeleteConfirm({ show: false, feedback: null });
    } catch (error) {
      console.error('Error deleting feedback:', error);
      alert('Failed to delete feedback. Please try again.');
    }
  };

  const togglePlace = (placeName) => {
    setExpandedPlaces((prev) => ({
      ...prev,
      [placeName]: !prev[placeName],
    }));
    // Initialize pagination for this place if not exists
    if (!placeFeedbackPages[placeName]) {
      setPlaceFeedbackPages((prev) => ({
        ...prev,
        [placeName]: 1
      }));
    }
  };

  const getPlaceFeedbackPage = (placeName, feedbacks) => {
    const currentPage = placeFeedbackPages[placeName] || 1;
    const startIndex = (currentPage - 1) * feedbacksPerPlace;
    const endIndex = startIndex + feedbacksPerPlace;
    return {
      feedbacks: feedbacks.slice(startIndex, endIndex),
      totalPages: Math.ceil(feedbacks.length / feedbacksPerPlace),
      currentPage
    };
  };

  const changePlaceFeedbackPage = (placeName, newPage) => {
    setPlaceFeedbackPages((prev) => ({
      ...prev,
      [placeName]: newPage
    }));
  };

  const formatDate = (timestamp) => {
    try {
      const date = timestamp?.toDate?.() || new Date(timestamp);
      const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      };
      return date.toLocaleDateString('en-US', options);
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getTotalFeedbackCount = () => {
    return Object.values(feedbacksByPlace).reduce(
      (total, place) => total + place.feedbacks.length,
      0
    );
  };

  const getPlaceStats = () => {
    return {
      totalPlaces: Object.keys(feedbacksByPlace).length,
      totalFeedbacks: getTotalFeedbackCount(),
      landmarks: Object.values(feedbacksByPlace).filter(p => p.type === 'Landmark').length,
      treasures: Object.values(feedbacksByPlace).filter(p => p.type === 'Treasure').length,
    };
  };

  // Filter and sort places
  const getFilteredAndSortedPlaces = () => {
    let places = Object.entries(feedbacksByPlace);

    // Filter by category
    if (selectedCategory === 'landmarks') {
      places = places.filter(([_, data]) => data.type === 'Landmark');
    } else if (selectedCategory === 'treasures') {
      places = places.filter(([_, data]) => data.type === 'Treasure');
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      places = places.filter(([placeName, placeData]) => {
        const nameMatch = placeName.toLowerCase().includes(query);
        const feedbackMatch = placeData.feedbacks.some(fb => 
          fb.user?.toLowerCase().includes(query) || 
          fb.message?.toLowerCase().includes(query)
        );
        return nameMatch || feedbackMatch;
      });
    }

    // Sort places
    places.sort(([nameA, dataA], [nameB, dataB]) => {
      switch (sortBy) {
        case 'oldest':
          const oldestA = Math.min(...dataA.feedbacks.map(f => {
            const date = f.submittedAt?.toDate?.() || new Date(f.submittedAt);
            return date.getTime();
          }));
          const oldestB = Math.min(...dataB.feedbacks.map(f => {
            const date = f.submittedAt?.toDate?.() || new Date(f.submittedAt);
            return date.getTime();
          }));
          return oldestA - oldestB;
        case 'name-asc':
          return nameA.localeCompare(nameB);
        case 'name-desc':
          return nameB.localeCompare(nameA);
        case 'newest':
        default:
          const newestA = Math.max(...dataA.feedbacks.map(f => {
            const date = f.submittedAt?.toDate?.() || new Date(f.submittedAt);
            return date.getTime();
          }));
          const newestB = Math.max(...dataB.feedbacks.map(f => {
            const date = f.submittedAt?.toDate?.() || new Date(f.submittedAt);
            return date.getTime();
          }));
          return newestB - newestA;
      }
    });

    return places;
  };

  // Pagination logic
  const getPaginatedPlaces = () => {
    const filteredPlaces = getFilteredAndSortedPlaces();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return {
      places: filteredPlaces.slice(startIndex, endIndex),
      totalPages: Math.ceil(filteredPlaces.length / itemsPerPage),
      totalItems: filteredPlaces.length
    };
  };

  const handleCategoryClick = (category) => {
    setSelectedCategory(category === selectedCategory ? 'all' : category);
  };

  const stats = getPlaceStats();
  const { places: paginatedPlaces, totalPages, totalItems } = getPaginatedPlaces();

  return (
    <div className="support-page">
      <Sidebar />
      <div className="support-main">
        <div className="support-header">
          <div className="header-content">
            <h1 className="page-title">
              <i className="fas fa-comments"></i>
              User Feedbacks
            </h1>
            <p className="page-subtitle">
              Manage feedbacks from treasures and landmarks
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        {!loading && !error && (
          <div className="stats-grid">
            <div 
              className={`stat-card ${selectedCategory === 'all' ? 'stat-card-active' : ''}`}
              onClick={() => setSelectedCategory('all')}
              style={{ cursor: 'pointer' }}
            >
              <div className="stat-icon total">
                <i className="fas fa-comments"></i>
              </div>
              <div className="stat-info">
                <h3>{stats.totalFeedbacks}</h3>
                <p>Total Feedbacks</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon places">
                <i className="fas fa-map-marked-alt"></i>
              </div>
              <div className="stat-info">
                <h3>{stats.totalPlaces}</h3>
                <p>Places</p>
              </div>
            </div>
            <div 
              className={`stat-card ${selectedCategory === 'landmarks' ? 'stat-card-active' : ''}`}
              onClick={() => handleCategoryClick('landmarks')}
              style={{ cursor: 'pointer' }}
            >
              <div className="stat-icon landmarks">
                <i className="fas fa-map-marker-alt"></i>
              </div>
              <div className="stat-info">
                <h3>{stats.landmarks}</h3>
                <p>Landmarks</p>
              </div>
            </div>
            <div 
              className={`stat-card ${selectedCategory === 'treasures' ? 'stat-card-active' : ''}`}
              onClick={() => handleCategoryClick('treasures')}
              style={{ cursor: 'pointer' }}
            >
              <div className="stat-icon treasures">
              <i class="fas fa-church"></i>
              </div>
              <div className="stat-info">
                <h3>{stats.treasures}</h3>
                <p>Treasures</p>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        {!loading && !error && Object.keys(feedbacksByPlace).length > 0 && (
          <div className="feedback-filters-toolbar">
            <div className="feedback-search-wrapper">
              <i className="fas fa-search"></i>
              <input
                type="text"
                placeholder="Search by place name, user, or feedback message..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="feedback-search-input"
              />
              {searchQuery && (
                <button 
                  className="feedback-search-clear"
                  onClick={() => setSearchQuery('')}
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>
            
            <div className="feedback-sort-wrapper">
              <i className="fas fa-sort"></i>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="feedback-sort-select"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
              </select>
            </div>
          </div>
        )}

        {/* Active Filters Display */}
        {!loading && !error && (selectedCategory !== 'all' || searchQuery) && (
          <div className="feedback-active-filters">
            <span className="active-filters-label">Active Filters:</span>
            {selectedCategory !== 'all' && (
              <span className="filter-tag">
                {selectedCategory === 'landmarks' ? 'Landmarks' : 'Treasures'}
                <button onClick={() => setSelectedCategory('all')}>
                  <i className="fas fa-times"></i>
                </button>
              </span>
            )}
            {searchQuery && (
              <span className="filter-tag">
                Search: "{searchQuery}"
                <button onClick={() => setSearchQuery('')}>
                  <i className="fas fa-times"></i>
                </button>
              </span>
            )}
            <button 
              className="clear-all-filters"
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
            >
              Clear All
            </button>
          </div>
        )}

        <div className="feedback-section">
          {loading && (
            <div className="loading-state">
              <i className="fas fa-spinner fa-spin"></i>
              <p>Loading feedbacks...</p>
            </div>
          )}

          {error && (
            <div className="error-state">
              <i className="fas fa-exclamation-circle"></i>
              <p>Error: {error}</p>
            </div>
          )}

          {!loading && !error && Object.keys(feedbacksByPlace).length === 0 && (
            <div className="empty-state">
              <i className="fas fa-inbox"></i>
              <h3>No feedbacks yet</h3>
              <p>Feedbacks from users will appear here</p>
            </div>
          )}

          {!loading && !error && Object.keys(feedbacksByPlace).length > 0 && totalItems === 0 && (
            <div className="empty-state">
              <i className="fas fa-search"></i>
              <h3>No results found</h3>
              <p>Try adjusting your filters or search query</p>
            </div>
          )}

          {!loading && !error && paginatedPlaces.length > 0 && (
            <>
              <div className="feedback-results-info">
                <p>Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} places</p>
              </div>
              
              <div className="feedback-places-list">
                {paginatedPlaces.map(([placeName, placeData]) => (
                  <div key={placeName} className="place-feedback-group">
                    <div 
                      className="place-header"
                      onClick={() => togglePlace(placeName)}
                    >
                      <div className="place-info">
                        <div className={`place-icon-wrapper ${placeData.type.toLowerCase()}`}>
                          <i className={`fas ${placeData.icon}`}></i>
                        </div>
                        <div className="place-details">
                          <h3>{placeName}</h3>
                          <span className="place-type">{placeData.type}</span>
                        </div>
                      </div>
                      <div className="place-meta">
                        <span className="feedback-badge">
                          {placeData.feedbacks.length}
                        </span>
                        <i className={`fas fa-chevron-${expandedPlaces[placeName] ? 'up' : 'down'} toggle-icon`}></i>
                      </div>
                    </div>

                    {expandedPlaces[placeName] && (() => {
                      const { feedbacks: paginatedFeedbacks, totalPages: placeTotalPages, currentPage: placeCurrentPage } = 
                        getPlaceFeedbackPage(placeName, placeData.feedbacks);
                      
                      return (
                        <div className="place-feedbacks-container">
                          {paginatedFeedbacks.map((feedback) => (
                            <div className="feedback-card" key={feedback.id}>
                              <div className="feedback-header">
                                <div className="user-info">
                                  <div className="user-avatar">
                                    <i className="fas fa-user"></i>
                                  </div>
                                  <div className="user-details">
                                    <h4>{feedback.user}</h4>
                                    <span className="feedback-date">
                                      <i className="fas fa-clock"></i>
                                      {formatDate(feedback.submittedAt)}
                                    </span>
                                  </div>
                                </div>
                                <button
                                  className="delete-btn"
                                  onClick={() => setDeleteConfirm({ show: true, feedback })}
                                  title="Delete feedback"
                                >
                                  <i className="fas fa-trash-alt"></i>
                                </button>
                              </div>
                              <div className="feedback-content">
                                <p>{feedback.message}</p>
                              </div>
                            </div>
                          ))}
                          
                          {/* Per-place pagination */}
                          {placeTotalPages > 1 && (
                            <div className="place-feedback-pagination">
                              <button
                                className="place-pagination-btn"
                                onClick={() => changePlaceFeedbackPage(placeName, Math.max(1, placeCurrentPage - 1))}
                                disabled={placeCurrentPage === 1}
                              >
                                <i className="fas fa-chevron-left"></i>
                              </button>
                              
                              <span className="place-pagination-info">
                                {placeCurrentPage} / {placeTotalPages}
                              </span>
                              
                              <button
                                className="place-pagination-btn"
                                onClick={() => changePlaceFeedbackPage(placeName, Math.min(placeTotalPages, placeCurrentPage + 1))}
                                disabled={placeCurrentPage === placeTotalPages}
                              >
                                <i className="fas fa-chevron-right"></i>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="feedback-pagination">
                  <button
                    className="pagination-btn"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <i className="fas fa-chevron-left"></i>
                    Previous
                  </button>
                  
                  <div className="pagination-pages">
                    {[...Array(totalPages)].map((_, index) => {
                      const page = index + 1;
                      // Show first, last, current, and pages around current
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={page}
                            className={`pagination-page-btn ${page === currentPage ? 'page-active' : ''}`}
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </button>
                        );
                      } else if (
                        page === currentPage - 2 ||
                        page === currentPage + 2
                      ) {
                        return <span key={page} className="pagination-ellipsis">...</span>;
                      }
                      return null;
                    })}
                  </div>
                  
                  <button
                    className="pagination-btn"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <i className="fas fa-chevron-right"></i>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div 
          className="modal-overlay"
          onClick={() => setDeleteConfirm({ show: false, feedback: null })}
        >
          <div 
            className="support-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <i className="fas fa-exclamation-triangle"></i>
              <h3>Delete Feedback</h3>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this feedback?</p>
              <div className="feedback-preview">
                <div className="preview-item">
                  <strong>User:</strong>
                  <span>{deleteConfirm.feedback?.user}</span>
                </div>
                <div className="preview-item">
                  <strong>Message:</strong>
                  <span>{deleteConfirm.feedback?.message}</span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-cancel"
                onClick={() => setDeleteConfirm({ show: false, feedback: null })}
              >
                Cancel
              </button>
              <button 
                className="btn-delete"
                onClick={() => handleDeleteFeedback(deleteConfirm.feedback)}
              >
                <i className="fas fa-trash"></i> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Support;
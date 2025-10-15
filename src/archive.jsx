import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Sidebar from './Sidebar';
import { collection, getDocs, doc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import './archive.css';

function Archive() {
  const [archivedReports, setArchivedReports] = useState([]);
  const [deletedReports, setDeletedReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [timeFilter, setTimeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [sortOption, setSortOption] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showDeletedModal, setShowDeletedModal] = useState(false);
  const [restoringId, setRestoringId] = useState(null);
  const [selectedDeletedIds, setSelectedDeletedIds] = useState([]);
  const [deletedSortOption, setDeletedSortOption] = useState('newest');
  const itemsPerPage = 10;

  // Fetch archived reports on mount
  useEffect(() => {
    const fetchArchivedReports = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'archive'));
        const data = querySnapshot.docs.map((doc) => {
          const d = doc.data();
          const createdAt =
            d.createdAt?.toDate?.() ||
            d.submittedAt?.toDate?.() ||
            new Date();
          return {
            id: doc.id,
            email: d.email || 'No email',
            reportText: d.reportText || 'No message provided',
            createdAt,
          };
        });
        setArchivedReports(data);
      } catch (error) {
        console.error('Error fetching archived reports:', error);
      }
    };
    fetchArchivedReports();
  }, []);

  // Fetch deleted reports on mount
  useEffect(() => {
    const fetchDeletedReports = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'deleted_archive'));
        const data = querySnapshot.docs.map((doc) => {
          const d = doc.data();
          const createdAt =
            d.createdAt?.toDate?.() ||
            new Date();
          return {
            id: doc.id,
            email: d.email || 'No email',
            locationTitle: d.locationTitle || 'No title',
            reportText: d.reportText || 'No message provided',
            createdAt,
          };
        });
        setDeletedReports(data);
      } catch (error) {
        console.error('Error fetching deleted reports:', error);
      }
    };
    fetchDeletedReports();
  }, []);

  // Auto-delete old archives (>30 days) - memoized to prevent infinite loops
  const autoDeleteOldArchives = useCallback(async () => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const expired = archivedReports.filter(
      (r) => r.createdAt < thirtyDaysAgo
    );

    if (expired.length > 0) {
      try {
        // Delete from Firebase
        await Promise.all(
          expired.map((r) => deleteDoc(doc(db, 'archive', r.id)))
        );
        
        // Update states
        setDeletedReports((prev) => [...prev, ...expired]);
        setArchivedReports((prev) => 
          prev.filter((r) => !expired.some(exp => exp.id === r.id))
        );
        
        console.log(`Auto-deleted ${expired.length} expired reports`);
      } catch (error) {
        console.error('Error auto-deleting expired reports:', error);
      }
    }
  }, [archivedReports]);

  // Run auto-delete only once when archivedReports first loads
  useEffect(() => {
    if (archivedReports.length > 0) {
      autoDeleteOldArchives();
    }
  }, [archivedReports.length > 0]);

  const getDateRange = (filter) => {
    const now = new Date();
    let start, end;

    switch (filter) {
      case 'this-week':
        start = new Date(now);
        start.setDate(now.getDate() - now.getDay());
        start.setHours(0, 0, 0, 0);
        end = new Date(now);
        return { start, end };
      case 'last-week':
        start = new Date(now);
        start.setDate(now.getDate() - now.getDay() - 7);
        start.setHours(0, 0, 0, 0);
        end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        return { start, end };
      case 'last-month':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        return { start, end };
      case 'last-year':
        start = new Date(now.getFullYear() - 1, 0, 1);
        end = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
        return { start, end };
      default:
        return null;
    }
  };

  // Filter and sort reports
  useEffect(() => {
    let filtered = [...archivedReports];

    // Time filter
    if (timeFilter !== 'all' && timeFilter !== 'custom') {
      const range = getDateRange(timeFilter);
      if (range) {
        filtered = filtered.filter(
          (report) =>
            report.createdAt >= range.start && report.createdAt <= range.end
        );
      }
    }

    // Custom date range
    if (timeFilter === 'custom' && customStartDate && customEndDate) {
      const start = new Date(customStartDate);
      const end = new Date(customEndDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(
        (report) => report.createdAt >= start && report.createdAt <= end
      );
    }

    // Search filter
    if (searchTerm.trim() !== '') {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter((report) => {
        const email = report.email?.toLowerCase() || '';
        const locationTitle = report.locationTitle?.toLowerCase() || '';
        const reportText = report.reportText?.toLowerCase() || '';
    
        return (
          email.includes(lowerSearch) ||
          locationTitle.includes(lowerSearch) ||
          reportText.includes(lowerSearch)
        );
      });
    }
    

    // Sort
    filtered.sort((a, b) => {
      if (sortOption === 'newest') return b.createdAt - a.createdAt;
      if (sortOption === 'oldest') return a.createdAt - b.createdAt;
      if (sortOption === 'email') return a.email.localeCompare(b.email);
      if (sortOption === 'location') return a.locationTitle.localeCompare(b.locationTitle);
      return 0;
    });

    setFilteredReports(filtered);
    setCurrentPage(1);
  }, [archivedReports, timeFilter, customStartDate, customEndDate, searchTerm, sortOption]);

  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
  const paginatedReports = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredReports.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredReports, currentPage]);

  const daysLeftBeforeDeletion = (createdAt) => {
    const now = new Date();
    const diff = now - createdAt;
    const days = 30 - Math.floor(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Email', 'Questions'];
    const rows = filteredReports.map(r => [
      r.createdAt.toLocaleString(),
      r.email,
      r.reportText.replace(/\n/g, ' ')
    ]);
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += headers.join(',') + '\r\n';
    rows.forEach(row => {
      csvContent += row.map(val => `"${val}"`).join(',') + '\r\n';
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'archived_reports.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;
    try {
      const deletedItem = archivedReports.find(r => r.id === id);
      
      // Save to 'deleted_archive' collection
      const docRef = await addDoc(collection(db, 'deleted_archive'), {
        email: deletedItem.email,
        reportText: deletedItem.reportText,
        createdAt: deletedItem.createdAt,
        deletedAt: serverTimestamp()
      });
      
      // Remove from archive
      await deleteDoc(doc(db, 'archive', id));
      setArchivedReports(prev => prev.filter(r => r.id !== id));
      
      // Add to deletedReports state immediately
      setDeletedReports(prev => [...prev, {
        id: docRef.id,
        email: deletedItem.email,
        reportText: deletedItem.reportText,
        createdAt: deletedItem.createdAt
      }]);
      
      alert('Report deleted successfully');
    } catch (error) {
      console.error('Delete failed', error);
      alert('Failed to delete report. Please try again.');
    }
  };

  // Restore = ibalik sa archive collection
  const handleRestore = async (report) => {
    try {
      setRestoringId(report.id);

      // 1. Save back to archive collection
      await addDoc(collection(db, "archive"), {
        email: report.email,
        locationTitle: report.locationTitle,
        reportText: report.reportText,
        createdAt: serverTimestamp(),
      });

      // 2. Delete from deleted_archive collection
      await deleteDoc(doc(db, 'deleted_archive', report.id));

      // 3. Update UI - remove from deleted reports list and add back to archived
      setDeletedReports((prev) => prev.filter((r) => r.id !== report.id));
      setArchivedReports((prev) => [...prev, {
        ...report,
        createdAt: new Date() // Update with current date since restored
      }]);

      alert("Report restored to archive!");
    } catch (error) {
      console.error("Error restoring report:", error);
      alert("Failed to restore report");
    } finally {
      setRestoringId(null);
    }
  };

  // Bulk restore selected deleted reports
  const handleBulkRestore = async () => {
    if (selectedDeletedIds.length === 0) {
      alert('Please select reports to restore');
      return;
    }

    if (!window.confirm(`Are you sure you want to restore ${selectedDeletedIds.length} report(s)?`)) return;

    try {
      const reportsToRestore = deletedReports.filter(r => selectedDeletedIds.includes(r.id));
      
      await Promise.all(
        reportsToRestore.map(async (report) => {
          // Add back to archive
          await addDoc(collection(db, "archive"), {
            email: report.email,
            locationTitle: report.locationTitle,
            reportText: report.reportText,
            createdAt: serverTimestamp(),
          });
          // Delete from deleted_archive
          await deleteDoc(doc(db, 'deleted_archive', report.id));
        })
      );

      // Update UI
      setDeletedReports((prev) => prev.filter((r) => !selectedDeletedIds.includes(r.id)));
      setArchivedReports((prev) => [...prev, ...reportsToRestore.map(r => ({
        ...r,
        createdAt: new Date()
      }))]);
      setSelectedDeletedIds([]);

      alert(`${reportsToRestore.length} report(s) restored successfully!`);
    } catch (error) {
      console.error("Error bulk restoring:", error);
      alert("Failed to restore some reports");
    }
  };

  // Bulk permanently delete selected deleted reports
  const handleBulkPermanentDelete = async () => {
    if (selectedDeletedIds.length === 0) {
      alert('Please select reports to delete permanently');
      return;
    }

    if (!window.confirm(`Are you sure you want to PERMANENTLY delete ${selectedDeletedIds.length} report(s)? This cannot be undone!`)) return;

    try {
      await Promise.all(
        selectedDeletedIds.map(id => deleteDoc(doc(db, 'deleted_archive', id)))
      );

      setDeletedReports((prev) => prev.filter((r) => !selectedDeletedIds.includes(r.id)));
      setSelectedDeletedIds([]);

      alert('Reports permanently deleted!');
    } catch (error) {
      console.error("Error bulk deleting:", error);
      alert("Failed to delete some reports");
    }
  };

  // Toggle individual checkbox
  const toggleDeletedCheckbox = (id) => {
    setSelectedDeletedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Toggle select all checkboxes
  const toggleSelectAllDeleted = () => {
    if (selectedDeletedIds.length === sortedDeletedReports.length) {
      setSelectedDeletedIds([]);
    } else {
      setSelectedDeletedIds(sortedDeletedReports.map(r => r.id));
    }
  };

  // Sort deleted reports
  const sortedDeletedReports = useMemo(() => {
    const sorted = [...deletedReports];
    sorted.sort((a, b) => {
      if (deletedSortOption === 'newest') return b.createdAt - a.createdAt;
      if (deletedSortOption === 'oldest') return a.createdAt - b.createdAt;
      if (deletedSortOption === 'email') return a.email.localeCompare(b.email);
      return 0;
    });
    return sorted;
  }, [deletedReports, deletedSortOption]);

  const highlightText = (text) => {
    if (!searchTerm) return text;
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.split(regex).map((part, i) =>
      regex.test(part) ? <mark key={i}>{part}</mark> : part
    );
  };

  return (
    <div className="archive-page">
      <Sidebar />
      <div className="archive-content">
        <h2>Archived Feedbacks</h2>

        <div className="filter-bar">
          <select value={timeFilter} onChange={e => setTimeFilter(e.target.value)}>
            <option value="all">All Time</option>
            <option value="this-week">This Week</option>
            <option value="last-week">Last Week</option>
            <option value="last-month">Last Month</option>
            <option value="last-year">Last Year</option>
            <option value="custom">Custom Range</option>
          </select>

          {timeFilter === 'custom' && (
            <div className="custom-date-range">
              <input type="date" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} />
              <span>to</span>
              <input type="date" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} />
            </div>
          )}

          <input
            type="text"
            placeholder="Search by keyword or email"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />

          <select value={sortOption} onChange={e => setSortOption(e.target.value)}>
            <option value="newest">Sort: Newest</option>
            <option value="oldest">Sort: Oldest</option>
            <option value="email">Sort: Email</option>
          </select>

          <button onClick={exportToCSV}>Export CSV</button>
          <button className="view-deleted-btn" onClick={() => setShowDeletedModal(true)}>View Deleted</button>
        </div>

        {paginatedReports.length === 0 ? (
          <p>No archived reports found.</p>
        ) : (
          <ul className="archive-list">
            {paginatedReports.map(report => (
              <li key={report.id} className="archive-report-card">
                <div><strong>Date:</strong> {highlightText(report.createdAt.toLocaleString())}</div>
                <div><strong>Email:</strong> {highlightText(report.email)}</div>
                <div><strong>Days Left:</strong> {daysLeftBeforeDeletion(report.createdAt)} days</div>
                <div>
                  <strong>Message:</strong>{' '}
                  {report.reportText.length > 120 ? (
                    <>
                      {highlightText(report.reportText.slice(0, 120))}...
                      <button
                        className="archive-modal-open-btn"
                        onClick={() => setSelectedMessage(report.reportText)}
                      >
                        Read More
                      </button>
                    </>
                  ) : (
                    highlightText(report.reportText)
                  )}
                </div>
                <button className="del-btn" onClick={() => handleDelete(report.id)}>Delete</button>
              </li>
            ))}
          </ul>
        )}

        {totalPages > 1 && (
          <div className="pagination">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Prev</button>
            <span>{currentPage} / {totalPages}</span>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next</button>
          </div>
        )}

        {/* Full message modal */}
        {selectedMessage && (
          <div className="archive-modal-backdrop" onClick={() => setSelectedMessage(null)}>
            <div className="archive-modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>Full Feedback Message</h3>
              <p>{selectedMessage}</p>
              <button className="archive-modal-close-btn" onClick={() => setSelectedMessage(null)}>Close</button>
            </div>
          </div>
        )}

        {/* Deleted reports modal */}
        {showDeletedModal && (
          <div className="archive-modal-backdrop" onClick={() => setShowDeletedModal(false)}>
            <div className="archive-deleted-modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>Deleted Questions</h3>
              
              <div className="archive-deleted-modal-controls">
                <select 
                  className="archive-deleted-sort-select"
                  value={deletedSortOption} 
                  onChange={e => setDeletedSortOption(e.target.value)}
                >
                  <option value="newest">Sort: Newest</option>
                  <option value="oldest">Sort: Oldest</option>
                  <option value="email">Sort: Email</option>
                </select>

                {selectedDeletedIds.length > 0 && (
                  <div className="archive-deleted-bulk-actions">
                    <button 
                      className="archive-deleted-bulk-restore-btn"
                      onClick={handleBulkRestore}
                    >
                      Restore ({selectedDeletedIds.length})
                    </button>
                    <button 
                      className="archive-deleted-bulk-delete-btn"
                      onClick={handleBulkPermanentDelete}
                    >
                      Delete Permanently ({selectedDeletedIds.length})
                    </button>
                  </div>
                )}
              </div>

              {sortedDeletedReports.length === 0 ? (
                <p>No deleted questions yet.</p>
              ) : (
                <>
                  <div className="archive-deleted-select-all">
                    <label>
                      <input 
                        type="checkbox"
                        checked={selectedDeletedIds.length === sortedDeletedReports.length && sortedDeletedReports.length > 0}
                        onChange={toggleSelectAllDeleted}
                      />
                      Select All
                    </label>
                  </div>
                  <ul className="archive-deleted-list">
                    {sortedDeletedReports.map((r) => (
                      <li key={r.id} className="archive-deleted-item">
                        <div className="archive-deleted-checkbox-wrapper">
                          <input 
                            type="checkbox"
                            checked={selectedDeletedIds.includes(r.id)}
                            onChange={() => toggleDeletedCheckbox(r.id)}
                            className="archive-deleted-checkbox"
                          />
                        </div>
                        <div className="archive-deleted-content">
                          <p><strong>Date:</strong> {r.createdAt.toLocaleString()}</p>
                          <p><strong>Email:</strong> {r.email}</p>
                          <p><strong>Message:</strong> {r.reportText}</p>
                        </div>
                        <div className="archive-deleted-actions">
                          <button 
                            className="archive-deleted-restore-btn"
                            onClick={() => handleRestore(r)}
                            disabled={restoringId === r.id}
                          >
                            {restoringId === r.id ? 'Restoring...' : 'Restore'}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              <button className="archive-modal-close-btn" onClick={() => {
                setShowDeletedModal(false);
                setSelectedDeletedIds([]);
              }}>Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Archive;
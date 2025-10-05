import React, { useEffect, useState, useMemo } from 'react';
import Sidebar from './Sidebar';
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';
import './archive.css';

function Archive() {
  const [archivedReports, setArchivedReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [timeFilter, setTimeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [sortOption, setSortOption] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
            locationTitle: d.locationTitle || 'No title',
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

  // Date range helper
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

  useEffect(() => {
    let filtered = archivedReports;

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

    // Custom range
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
      filtered = filtered.filter(
        (report) =>
          report.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          report.locationTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
          report.reportText.toLowerCase().includes(searchTerm.toLowerCase())
      );
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
    setCurrentPage(1); // reset page on new filter
  }, [archivedReports, timeFilter, customStartDate, customEndDate, searchTerm, sortOption]);

  // Pagination
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
  const paginatedReports = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredReports.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredReports, currentPage]);

  // CSV export
  const exportToCSV = () => {
    const headers = ['Date', 'Email', 'Location', 'Message'];
    const rows = filteredReports.map(r => [
      r.createdAt.toLocaleString(),
      r.email,
      r.locationTitle,
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

  // Delete report
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this report?')) return;
    try {
      await deleteDoc(doc(db, 'archive', id));
      setArchivedReports(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error('Delete failed', error);
    }
  };

  // Highlight search terms
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

        {/* Filter, Search, Sort, Export */}
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
            placeholder="Search by keyword, email, or location"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />

          <select value={sortOption} onChange={e => setSortOption(e.target.value)}>
            <option value="newest">Sort: Newest</option>
            <option value="oldest">Sort: Oldest</option>
            <option value="email">Sort: Email</option>
            <option value="location">Sort: Location</option>
          </select>

          <button onClick={exportToCSV}>Export CSV</button>
        </div>

        {/* Reports */}
        {paginatedReports.length === 0 ? (
          <p>No archived reports found.</p>
        ) : (
          <ul className="archive-list">
            {paginatedReports.map(report => (
              <li key={report.id} className="archive-report-card">
                <div><strong>Date:</strong> {highlightText(report.createdAt.toLocaleString())}</div>
                <div><strong>Email:</strong> {highlightText(report.email)}</div>
                <div><strong>Location:</strong> {highlightText(report.locationTitle)}</div>
                <div><strong>Message:</strong> {highlightText(report.reportText)}</div>
                <button className="del-btn" onClick={() => handleDelete(report.id)}>Delete</button>
              </li>
            ))}
          </ul>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="pagination">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Prev</button>
            <span>{currentPage} / {totalPages}</span>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Archive;

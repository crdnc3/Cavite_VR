import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import './archive.css';

function Archive() {
  const [archivedReports, setArchivedReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [timeFilter, setTimeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

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

  // Helper: get predefined date range
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

    // Custom range filter
    if (timeFilter === 'custom' && customStartDate && customEndDate) {
      const start = new Date(customStartDate);
      const end = new Date(customEndDate);
      end.setHours(23, 59, 59, 999); // isama buong araw ng end date
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

    // Sort by newest first
    filtered.sort((a, b) => b.createdAt - a.createdAt);

    setFilteredReports(filtered);
  }, [archivedReports, timeFilter, customStartDate, customEndDate, searchTerm]);

  return (
    <div className="archive-page">
      <Sidebar />
      <div className="archive-content">
        <h2>Archived Feedbacks</h2>

        {/* Filter and Search */}
        <div className="filter-bar">
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
          >
            <option value="all">All Time</option>
            <option value="this-week">This Week</option>
            <option value="last-week">Last Week</option>
            <option value="last-month">Last Month</option>
            <option value="last-year">Last Year</option>
            <option value="custom">Custom Range</option>
          </select>

          {/* Custom date pickers */}
          {timeFilter === 'custom' && (
            <div className="custom-date-range">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
              />
              <span>to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
              />
            </div>
          )}

          <input
            type="text"
            placeholder="Search by keyword, email, or location"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* List */}
        {filteredReports.length === 0 ? (
          <p>No archived reports found.</p>
        ) : (
          <ul className="archive-list">
            {filteredReports.map((report) => (
              <li key={report.id} className="archive-report-card">
                <div><strong>Date:</strong> {report.createdAt.toLocaleString()}</div>
                <div><strong>Email:</strong> {report.email}</div>
                <div><strong>Location:</strong> {report.locationTitle}</div>
                <div><strong>Message:</strong> {report.reportText}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default Archive;

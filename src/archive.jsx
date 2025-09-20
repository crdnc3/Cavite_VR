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

  useEffect(() => {
    const fetchArchivedReports = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'archive'));
        const data = querySnapshot.docs.map((doc) => {
          const d = doc.data();
          const createdAt = d.createdAt?.toDate?.() || d.submittedAt?.toDate?.() || new Date();
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

  useEffect(() => {
    const now = new Date();
    const filtered = archivedReports.filter((report) => {
      if (!report.createdAt) return false;

      const time = report.createdAt.getTime();
      const oneWeek = 7 * 24 * 60 * 60 * 1000;
      const oneMonth = 30 * 24 * 60 * 60 * 1000;
      const oneYear = 365 * 24 * 60 * 60 * 1000;

      switch (timeFilter) {
        case 'this-week':
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay());
          return report.createdAt >= startOfWeek;
        case 'last-week':
          const lastWeekStart = new Date(now);
          lastWeekStart.setDate(now.getDate() - now.getDay() - 7);
          const lastWeekEnd = new Date(lastWeekStart);
          lastWeekEnd.setDate(lastWeekEnd.getDate() + 6);
          return report.createdAt >= lastWeekStart && report.createdAt <= lastWeekEnd;
        case 'last-month':
          return now - time <= oneMonth;
        case 'last-year':
          return now - time <= oneYear;
        default:
          return true;
      }
    }).filter((report) =>
      report.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.locationTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reportText.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort descending by date
    filtered.sort((a, b) => b.createdAt - a.createdAt);

    setFilteredReports(filtered);
  }, [archivedReports, timeFilter, searchTerm]);

  return (
    <div className="archive-page">
      <Sidebar />
      <div className="archive-content">
        <h2>Archived Feedbacks</h2>

        {/* Filter and Search */}
        <div className="filter-bar">
          <select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)}>
            <option value="all">All Time</option>
            <option value="this-week">This Week</option>
            <option value="last-week">Last Week</option>
            <option value="last-month">Last Month</option>
            <option value="last-year">Last Year</option>
          </select>

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

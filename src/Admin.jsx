import React, { useEffect, useState } from 'react';
import './Admin.css';
import Sidebar from './Sidebar';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  collection,
  getDocs,
  addDoc,
  doc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const COLORS = ['#2c3e50', '#495057', '#6c757d', '#868e96', '#adb5bd', '#ced4da'];

function Admin() {
  const [totalUsers, setTotalUsers] = useState(0);
  const [registeredWeb, setRegisteredWeb] = useState(0);
  const [registeredApp, setRegisteredApp] = useState(0);
  const [appUsers, setAppUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [reports, setReports] = useState([]);
  const [placeDistribution, setPlaceDistribution] = useState([]);
  const [usersByPlace, setUsersByPlace] = useState({});
  const [showLogModal, setShowLogModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showAppUsersModal, setShowAppUsersModal] = useState(false);
  const [resolvingReportId, setResolvingReportId] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [selectedTimeFilter, setSelectedTimeFilter] = useState('thisWeek');
  const [filteredUsers, setFilteredUsers] = useState([]);
  
  // States for landmarks data
  const [landmarksData, setLandmarksData] = useState([]);
  const [totalPlaces, setTotalPlaces] = useState(0);
  const [isLoadingLandmarks, setIsLoadingLandmarks] = useState(true);
  
  // States for print functionality
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printTimeFilter, setPrintTimeFilter] = useState('thisWeek');
  const [filteredPlaceData, setFilteredPlaceData] = useState([]);
  const [allUsersData, setAllUsersData] = useState([]);

  const navigate = useNavigate();

  // Helper function to get date range
  const getDateRange = (filter) => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());

    const startOfLastWeek = new Date(startOfWeek);
    startOfLastWeek.setDate(startOfWeek.getDate() - 7);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const startOfLastYear = new Date(now.getFullYear() - 1, 0, 1);
    const endOfLastYear = new Date(now.getFullYear() - 1, 11, 31);

    switch (filter) {
      case 'thisWeek':
        return [startOfWeek, now];
      case 'lastWeek':
        return [startOfLastWeek, startOfWeek];
      case 'thisMonth':
        return [startOfMonth, now];
      case 'lastMonth':
        return [startOfLastMonth, endOfLastMonth];
      case 'thisYear':
        return [startOfYear, now];
      case 'lastYear':
        return [startOfLastYear, endOfLastYear];
      default:
        return [null, null];
    }
  };

  // Fetch landmarks data
  const fetchLandmarks = async () => {
    try {
      setIsLoadingLandmarks(true);
      const querySnapshotLandmarks = await getDocs(collection(db, 'Landmarks'));
      
      const landmarksArray = querySnapshotLandmarks.docs.map((doc) => {
        const data = doc.data();
        
        return {
          id: doc.id,
          name: data.name || data.title || data.placeName || data.landmarkName || doc.id || 'Unknown Landmark',
          views: data.TotalVisits || data.totalVisits || data.visits || data.views || 0,
          location: data.location || data.address || '',
          description: data.description || data.desc || '',
          createdAt: data.createdAt ? data.createdAt.toDate().toLocaleString() : 'No date',
        };
      });

      landmarksArray.sort((a, b) => b.views - a.views);

      setLandmarksData(landmarksArray);
      setTotalPlaces(landmarksArray.length);
      
      toast.success('Landmarks data loaded successfully');
    } catch (error) {
      console.error('Error fetching landmarks:', error);
      toast.error('Error fetching landmarks data');
      
      setLandmarksData([]);
      setTotalPlaces(0);
    } finally {
      setIsLoadingLandmarks(false);
    }
  };

  // Filter users by date for print functionality
  const filterPlaceDataByDate = (timeFilter) => {
    const [startDate, endDate] = getDateRange(timeFilter);
    
    if (!startDate || !endDate) {
      return { filteredData: placeDistribution, filteredUsers: usersByPlace };
    }

    const regionCount = {};
    const regionUsers = {};

    allUsersData.forEach((user) => {
      if (user.createdAt && user.createdAt !== 'No date') {
        const userDate = new Date(user.createdAt);
        if (userDate >= startDate && userDate <= endDate) {
          const region = user.region || 'Unknown';
          const place = user.place || 'Unknown';
          const name = user.name || 'User';

          if (!regionUsers[region]) regionUsers[region] = [];
          regionUsers[region].push({ name, place, createdAt: user.createdAt });

          regionCount[region] = (regionCount[region] || 0) + 1;
        }
      }
    });

    const filteredData = Object.entries(regionCount).map(([name, value]) => ({ name, value }));
    
    return { filteredData, filteredUsers: regionUsers };
  };

  // Handle print time filter change
  const handlePrintTimeFilterChange = (e) => {
    const newFilter = e.target.value;
    setPrintTimeFilter(newFilter);
    const { filteredData } = filterPlaceDataByDate(newFilter);
    setFilteredPlaceData(filteredData);
  };

  // Print function
  const handlePrint = () => {
    const { filteredData, filteredUsers } = filterPlaceDataByDate(printTimeFilter);
    
    const printWindow = window.open('', '_blank');
    const currentDate = new Date().toLocaleDateString();
    const timeFilterLabel = printTimeFilter.charAt(0).toUpperCase() + printTimeFilter.slice(1);
    
    let totalFilteredUsers = 0;
    let userDetailsHTML = '';
    
    Object.entries(filteredUsers).forEach(([region, users]) => {
      totalFilteredUsers += users.length;
      userDetailsHTML += `
        <div class="region-section">
          <h3 class="region-title">
            ${region} (${users.length} user${users.length > 1 ? 's' : ''})
          </h3>
          <div class="users-list">
            ${users.map(user => `
              <div class="user-item">
                <strong>${user.name}</strong> - ${user.place}
                <br><small>Registered: ${user.createdAt}</small>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    });

    const chartDataHTML = filteredData.map(item => `
      <tr>
        <td>${item.name}</td>
        <td class="text-center">${item.value}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>User Statistics Report - ${timeFilterLabel}</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            margin: 20px; 
            line-height: 1.6;
            color: #2c3e50;
            background: #f8f9fa;
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px; 
            border-bottom: 3px solid #2c3e50;
            padding-bottom: 15px;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .stats-summary {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 25px;
            border: 1px solid #e9ecef;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
          }
          .stat-card {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 6px;
            text-align: center;
            border: 1px solid #e9ecef;
            border-left: 4px solid #2c3e50;
          }
          .stat-number {
            font-size: 2rem;
            font-weight: 700;
            color: #2c3e50;
          }
          .stat-label {
            font-size: 0.875rem;
            color: #6c757d;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 25px;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          th { 
            background-color: #2c3e50; 
            color: white; 
            padding: 12px; 
            text-align: left;
            font-weight: 600;
          }
          td { 
            padding: 12px; 
            border-bottom: 1px solid #e9ecef; 
          }
          .text-center { text-align: center; }
          tr:nth-child(even) { 
            background-color: #f8f9fa; 
          }
          .region-section {
            background: white;
            margin-bottom: 20px;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .region-title {
            background: #495057;
            color: white;
            margin: 0;
            padding: 15px 20px;
            font-size: 1.1rem;
            font-weight: 600;
          }
          .users-list {
            padding: 20px;
          }
          .user-item {
            padding: 10px;
            margin-bottom: 10px;
            background: #f8f9fa;
            border-radius: 4px;
            border-left: 3px solid #6c757d;
          }
          .user-item:last-child {
            margin-bottom: 0;
          }
          .user-item small {
            color: #6c757d;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 0.75rem;
            color: #6c757d;
            border-top: 1px solid #e9ecef;
            padding-top: 15px;
            background: white;
            padding: 20px;
            border-radius: 8px;
          }
          @media print {
            body { margin: 0; background: white; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>User Registration Statistics</h1>
          <h2>${timeFilterLabel} Period</h2>
          <p>Generated on: ${currentDate}</p>
        </div>

        <div class="stats-summary">
          <h3>Executive Summary</h3>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-number">${totalFilteredUsers}</div>
              <div class="stat-label">Total Users</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${filteredData.length}</div>
              <div class="stat-label">Active Regions</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${filteredData.reduce((sum, item) => sum + item.value, 0)}</div>
              <div class="stat-label">Total Registrations</div>
            </div>
          </div>
        </div>

        <h3>Regional Distribution</h3>
        <table>
          <thead>
            <tr>
              <th>Region/Place</th>
              <th class="text-center">User Count</th>
            </tr>
          </thead>
          <tbody>
            ${chartDataHTML || '<tr><td colspan="2" class="text-center">No data available</td></tr>'}
          </tbody>
        </table>

        <h3>Detailed User Breakdown</h3>
        ${userDetailsHTML || '<p style="text-align: center; color: #6c757d; padding: 20px;">No users found for the selected time period.</p>'}

        <div class="footer">
          <p>This report was automatically generated from the administrative dashboard.</p>
          <p>For technical support or inquiries, please contact the system administrator.</p>
        </div>
      </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
    
    setShowPrintModal(false);
    toast.success('Print report generated successfully');
  };

  const filterUsersByDate = () => {
    const [startDate, endDate] = getDateRange(selectedTimeFilter);

    const allUsers = [
      ...appUsers.map((user) => ({
        id: user.id,
        name: user.name || 'No name',
        email: user.email || 'No email',
        createdAt: user.createdAt || 'No date',
        source: 'App',
      })),
      ...logs.map((log) => ({
        id: log.id,
        name: log.logMessage.split(' ')[0] || 'No name',
        createdAt: log.createdAt || 'No date',
        source: 'Web',
      })),
    ];

    const filtered = allUsers.filter((user) => {
      if (user.createdAt === 'No date') return false;
      const userDate = new Date(user.createdAt);
      return userDate >= startDate && userDate <= endDate;
    });

    setFilteredUsers(filtered);
  };

  const handleTotalUsersClick = () => {
    filterUsersByDate();
    setShowTimeModal(true);
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshotUsers = await getDocs(collection(db, 'users'));
        setRegisteredWeb(querySnapshotUsers.size);

        const querySnapshotAppUsers = await getDocs(collection(db, 'AppUser'));
        setRegisteredApp(querySnapshotAppUsers.size);

        setTotalUsers(querySnapshotUsers.size + querySnapshotAppUsers.size);

        const regionCount = {};
        const regionUsers = {};
        const allUsers = [];

        querySnapshotUsers.docs.forEach((doc) => {
          const data = doc.data();
          const region = data.region || 'Unknown';
          const place = data.place || data.placeSelected; // wala nang 'Unknown' fallback
          const name = data.name || data.username || 'User';
          const createdAt = data.createdAt ? data.createdAt.toDate().toLocaleString() : 'No date';

          if (!place) return;
          
          if (!regionUsers[region]) regionUsers[region] = [];
          regionUsers[region].push({ name, place });

          regionCount[region] = (regionCount[region] || 0) + 1;
          allUsers.push({ region, place, name, createdAt, source: 'Web' });
        });

        querySnapshotAppUsers.docs.forEach((doc) => {
          const data = doc.data();
          const region = data.region || 'Unknown';
          const place = data.place || data.placeSelected;
          const name = data.name || data.username || 'User';
          const createdAt = data.createdAt ? data.createdAt.toDate().toLocaleString() : 'No date';

          if (!place) return;
          
          if (!regionUsers[region]) regionUsers[region] = [];
          regionUsers[region].push({ name, place });

          regionCount[region] = (regionCount[region] || 0) + 1;
          allUsers.push({ region, place, name, createdAt, source: 'App' });
        });

        setAllUsersData(allUsers);
        setPlaceDistribution(
          Object.entries(regionCount).map(([name, value]) => ({ name, value }))
        );

        setUsersByPlace(regionUsers);

        const appUsersData = querySnapshotAppUsers.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || data.username || 'No name',
            email: data.email || 'No email',
            createdAt: data.createdAt
              ? data.createdAt.toDate().toLocaleString()
              : 'No date',
          };
        });

        appUsersData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setAppUsers(appUsersData);

        const usersData = querySnapshotUsers.docs.map((doc) => {
          const data = doc.data();
          const username = data.name || data.username || 'User';
          return {
            id: doc.id,
            logMessage: data.logMessage || `${username} has created an account`,
            createdAt: data.createdAt
              ? data.createdAt.toDate().toLocaleString()
              : 'No date',
          };
        });

        usersData.sort((a, b) => {
          if (a.createdAt === 'No date') return 1;
          if (b.createdAt === 'No date') return -1;
          return new Date(b.createdAt) - new Date(a.createdAt);
        });

        setLogs(usersData);
      } catch (error) {
        toast.error('Error fetching users');
      }
    };

    const fetchReports = async () => {
      try {
        const querySnapshotReports = await getDocs(collection(db, 'reports'));
        const reportData = querySnapshotReports.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            email: data.email || 'No email',
            locationTitle: data.locationTitle || 'No title',
            reportText: data.reportText || 'No message provided',
            createdAt: data.submittedAt
              ? data.submittedAt.toDate().toLocaleString()
              : 'No date',
          };
        });

        reportData.sort((a, b) => {
          if (a.createdAt === 'No date') return 1;
          if (b.createdAt === 'No date') return -1;
          return new Date(b.createdAt) - new Date(a.createdAt);
        });

        setReports(reportData);
      } catch (error) {
        toast.error('Error fetching reports');
      }
    };

    fetchUsers();
    fetchReports();
    fetchLandmarks();
  }, []);

  useEffect(() => {
    const { filteredData } = filterPlaceDataByDate(printTimeFilter);
    setFilteredPlaceData(filteredData);
  }, [placeDistribution, allUsersData, printTimeFilter]);

  const handleTimeFilterChange = (e) => {
    setSelectedTimeFilter(e.target.value);
    setTimeout(() => filterUsersByDate(), 0);
  };

  const handleUserCardClick = () => {
    navigate('/Users');
  };

  const openConfirmModal = (report) => {
    setSelectedReport(report);
    setShowConfirmModal(true);
  };

  const handleResolveReport = async (report) => {
    setResolvingReportId(report.id);
    try {
      await addDoc(collection(db, 'archive'), {
        email: report.email,
        locationTitle: report.locationTitle,
        reportText: report.reportText,
        createdAt: serverTimestamp(),
        originalReportId: report.id,
      });

      await deleteDoc(doc(db, 'reports', report.id));
      setReports((prevReports) => prevReports.filter((r) => r.id !== report.id));
      toast.success('Report successfully archived');
    } catch (error) {
      toast.error('Failed to archive report. Please try again');
    } finally {
      setResolvingReportId(null);
      setShowConfirmModal(false);
      setSelectedReport(null);
    }
  };

  return (
    <div className="dashboard-page admin-page">
      <Sidebar />

      <div className="main-content">
        <h2 className="dashboard">Dashboard Overview</h2>

        <div className="admin-cards">
          <div className="admin-card admin-total-users" onClick={handleTotalUsersClick}>
            <h3>Total Users</h3>
            <p className="admin-number">{totalUsers}</p>
          </div>

          <div className="admin-card admin-web-users" onClick={handleUserCardClick}>
            <h3>Web Registered</h3>
            <p className="admin-number">{registeredWeb}</p>
          </div>

          <div className="admin-card admin-app-users" onClick={() => setShowAppUsersModal(true)}>
            <h3>App Registered</h3>
            <p className="admin-number">{registeredApp}</p>
          </div>

          <div className="admin-card admin-total-reports" onClick={() => setShowReportModal(true)}>
            <h3>Total Feedbacks</h3>
            <p className="admin-number">{reports.length}</p>
          </div>

          <div className="admin-card admin-log-updates" onClick={() => setShowLogModal(true)}>
            <h3>Recent Activity</h3>
            <ul>
              {logs.slice(0, 1).map((log) => (
                <li key={log.id}>
                  <strong>{log.createdAt}</strong> - {log.logMessage}
                </li>
              ))}
            </ul>
          </div>

          <div className="admin-card admin-total-places">
            <h3>Places Uploaded</h3>
            <p className="admin-number">{totalPlaces}</p>
          </div>
        </div>

        <div className="charts-container">
          <div className="chart-card">
            <div className="chart-header">
              <h3>Historic Sites Analytics</h3>
              {isLoadingLandmarks && (
                <span className="loading-indicator">Loading...</span>
              )}
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={landmarksData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="views" fill="#495057" />
              </BarChart>
            </ResponsiveContainer>
            
            <div className="landmarks-details">
              <h4>Site Details:</h4>
              {landmarksData.length > 0 ? (
                <div className="landmarks-grid">
                  {landmarksData.map((landmark) => (
                    <div key={landmark.id} className="landmark-item">
                      <strong>{landmark.name}</strong>
                      <br />
                      <span className="views-count">Views: {landmark.views}</span>
                      {landmark.location && (
                        <>
                          <br />
                          <small>Location: {landmark.location}</small>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-data">No landmarks data available.</p>
              )}
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-header">
              <h3>Regional User Distribution</h3>
              <button 
                onClick={() => setShowPrintModal(true)}
                className="print-button"
              >
                Print Statistics
              </button>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={placeDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#495057">
                  {placeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            <div className="users-by-place-container">
              {Object.entries(usersByPlace).map(([region, users]) => (
                <div key={region} className="place-card">
                <h4>
                  <span className="region">{region}</span>
                  <span className="count">
                    {users.length} web user{users.length > 1 ? 's' : ''}
                  </span>
                </h4>
                  <ul className="place-users-list">
                    {users.map((user, i) => (
                      <li key={i}>
                        {user.name} – {user.place}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Print Statistics Modal */}
      {showPrintModal && (
        <div className="modal-overlay" onClick={() => setShowPrintModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Generate Statistics Report</h3>
            <div className="form-group">
              <label htmlFor="print-time-filter" className="form-label">
                Select Time Period:
              </label>
              <select
                id="print-time-filter"
                value={printTimeFilter}
                onChange={handlePrintTimeFilterChange}
                className="form-select"
              >
                <option value="thisWeek">This Week</option>
                <option value="lastWeek">Last Week</option>
                <option value="thisMonth">This Month</option>
                <option value="lastMonth">Last Month</option>
                <option value="thisYear">This Year</option>
                <option value="lastYear">Last Year</option>
              </select>
            </div>

            <div className="preview-summary">
              <h4>Report Preview</h4>
              <p><strong>Period:</strong> {printTimeFilter.charAt(0).toUpperCase() + printTimeFilter.slice(1)}</p>
              <p><strong>Total Users:</strong> {filteredPlaceData.reduce((sum, item) => sum + item.value, 0)}</p>
              <p><strong>Active Regions:</strong> {filteredPlaceData.length}</p>
            </div>

            <div className="modal-actions">
              <button 
                onClick={() => setShowPrintModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button 
                onClick={handlePrint}
                className="btn-primary"
              >
                Generate Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Time Modal */}
      {showTimeModal && (
        <div className="time-registration-modal-overlay" onClick={() => setShowTimeModal(false)}>
          <div className="time-registration-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="time-modal-header">
              <h3 className="time-modal-title">User Registration Analysis</h3>
              <button 
                className="time-modal-close-btn"
                onClick={() => setShowTimeModal(false)}
              >
                ×
              </button>
            </div>

            <div className="time-filter-section">
              <label htmlFor="time-filter" className="time-filter-label">
                Filter by Time Period:
              </label>
              <select
                id="time-filter"
                value={selectedTimeFilter}
                onChange={handleTimeFilterChange}
                className="time-registration-dropdown"
              >
                <option value="thisWeek">This Week ({filteredUsers.length} users)</option>
                <option value="lastWeek">Last Week</option>
                <option value="thisMonth">This Month</option>
                <option value="lastMonth">Last Month</option>
                <option value="thisYear">This Year</option>
                <option value="lastYear">Last Year</option>
              </select>
            </div>

            <div className="time-stats-summary">
              <div className="time-stat-card">
                <span className="time-stat-number">{filteredUsers.length}</span>
                <span className="time-stat-label">
                  {selectedTimeFilter.charAt(0).toUpperCase() + selectedTimeFilter.slice(1)} Registrations
                </span>
              </div>
            </div>

            <div className="time-users-container">
              {filteredUsers.length > 0 ? (
                <div className="time-users-grid">
                  {filteredUsers.map((user, index) => (
                    <div key={index} className="time-user-card">
                      <div className="time-user-info">
                        <h4 className="time-user-name">{user.name || 'User'}</h4>
                        <span className="time-user-date">{user.createdAt}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="time-no-users">
                  <p>No users registered in the selected time period.</p>
                </div>
              )}
            </div>

            <div className="time-modal-footer">
              <button 
                className="time-modal-close-button" 
                onClick={() => setShowTimeModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

{/* Reports Modal */}
{showReportModal && (
  <div className="modal-overlay" onClick={() => setShowReportModal(false)}>
    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
      <h3>Submitted Feedbacks</h3>
      <div className="modal-scrollable">
        {reports.map((report) => (
          <div key={report.id} className="activity-card reports-card">
            <div className="activity-header">
              <time className="activity-date">{report.createdAt}</time>
              <button
                className="resolve-button"
                onClick={() => openConfirmModal(report)}
                disabled={resolvingReportId === report.id}
              >
                {resolvingReportId === report.id ? 'Resolving...' : 'Resolve'}
              </button>
            </div>
            <div className="activity-text">
              <strong>Email:</strong> {report.email} <br />
              <strong>Location:</strong> {report.locationTitle} <br />
              <strong>Message:</strong> {report.reportText}
            </div>
          </div>
        ))}
      </div>
      <button onClick={() => setShowReportModal(false)} className="btn-secondary">
        Close
      </button>
    </div>
  </div>
)}

{/* Log Modal */}
{showLogModal && (
  <div className="modal-overlay" onClick={() => setShowLogModal(false)}>
    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
      <h3>Activity Log</h3>
      <div className="modal-scrollable">
        {logs.map((log) => (
          <div key={log.id} className="activity-card logs-card">
            <p className="activity-text">{log.logMessage}</p>
            <span className="activity-date">{log.createdAt}</span>
          </div>
        ))}
      </div>
      <button onClick={() => setShowLogModal(false)} className="btn-secondary">
        Close
      </button>
    </div>
  </div>
)}

{/* App Users Modal */}
{showAppUsersModal && (
  <div className="modal-overlay" onClick={() => setShowAppUsersModal(false)}>
    <div className="modal-content users-modal" onClick={(e) => e.stopPropagation()}>
      <h3>App Registered Users</h3>
      <div className="modal-scrollable">
        {appUsers.map((user) => (
          <div key={user.id} className="activity-card users-card">
            <p className="activity-text"><strong>{user.name}</strong></p>
            <span className="activity-date">{user.createdAt}</span>
            <div className="activity-subtext">{user.email}</div>
          </div>
        ))}
      </div>
      <button onClick={() => setShowAppUsersModal(false)} className="btn-secondary">
        Close
      </button>
    </div>
  </div>
)}


    </div>
  );
}

export default Admin;
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
  const [resolvingReportId, setResolvingReportId] = useState(null);
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

  // NEW: Custom date states
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [printShowCustomDatePicker, setPrintShowCustomDatePicker] = useState(false);
  const [printCustomStartDate, setPrintCustomStartDate] = useState('');
  const [printCustomEndDate, setPrintCustomEndDate] = useState('');

  const navigate = useNavigate();

  

  // Enhanced date range function with custom date support
  const getDateRange = (filter, customStart = null, customEnd = null) => {
    if (filter === 'custom' && customStart && customEnd) {
      const startDate = new Date(customStart);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(customEnd);
      endDate.setHours(23, 59, 59, 999);
      return [startDate, endDate];
    }

    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfLastWeek = new Date(startOfWeek);
    startOfLastWeek.setDate(startOfWeek.getDate() - 7);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    endOfLastMonth.setHours(23, 59, 59, 999);

    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const startOfLastYear = new Date(now.getFullYear() - 1, 0, 1);
    const endOfLastYear = new Date(now.getFullYear() - 1, 11, 31);
    endOfLastYear.setHours(23, 59, 59, 999);

    now.setHours(23, 59, 59, 999);

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

  const [pageByRegion, setPageByRegion] = useState({});
  const itemsPerPage = 10;

  // Format date range for display
  const formatDateRangeDisplay = (filter, customStart = null, customEnd = null) => {
    if (filter === 'custom' && customStart && customEnd) {
      const start = new Date(customStart).toLocaleDateString();
      const end = new Date(customEnd).toLocaleDateString();
      return `Custom Range (${start} - ${end})`;
    }

    switch (filter) {
      case 'thisWeek':
        return 'This Week';
      case 'lastWeek':
        return 'Last Week';
      case 'thisMonth':
        return 'This Month';
      case 'lastMonth':
        return 'Last Month';
      case 'thisYear':
        return 'This Year';
      case 'lastYear':
        return 'Last Year';
      default:
        return 'Unknown Period';
    }
  };

  // Validate custom date range
  const validateCustomDateRange = (startDate, endDate) => {
    if (!startDate || !endDate) {
      toast.error('Please select both start and end dates');
      return false;
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
      toast.error('Start date cannot be later than end date');
      return false;
    }
    
    const today = new Date();
    if (start > today) {
      toast.error('Start date cannot be in the future');
      return false;
    }
    
    return true;
  };

  const resolveReport = async (report) => {
    try {
      setResolvingReportId(report.id);

      // 1. Save to archive
      await addDoc(collection(db, "archive"), {
        email: report.email,
        locationTitle: report.locationTitle,
        reportText: report.reportText,
        createdAt: serverTimestamp(),
      });

      // 2. Delete from reports collection
      await deleteDoc(doc(db, "reports", report.id));

      // 3. Update UI para mawala sa modal
      setReports((prev) => prev.filter((r) => r.id !== report.id));

      toast.success("Report moved to archive!");
    } catch (error) {
      console.error("Error resolving report:", error);
      toast.error("Failed to resolve report");
    } finally {
      setResolvingReportId(null);
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

  // Enhanced filter users by date for print functionality
  const filterPlaceDataByDate = (timeFilter, customStart = null, customEnd = null) => {
    const [startDate, endDate] = getDateRange(timeFilter, customStart, customEnd);
    
    if (!startDate || !endDate) {
      return { filteredData: placeDistribution, filteredUsers: usersByPlace };
    }

    const regionCount = {};
    const regionUsers = {};

    allUsersData.forEach((user) => {
      if (user.createdAt && user.createdAt !== 'No date') {
        try {
          const userDate = new Date(user.createdAt);
          if (userDate >= startDate && userDate <= endDate) {
            const region = user.region || 'Unknown';
            const place = user.place || 'Unknown';
            const name = user.name || 'User';

            if (!regionUsers[region]) regionUsers[region] = [];
            regionUsers[region].push({ name, place, createdAt: user.createdAt });

            regionCount[region] = (regionCount[region] || 0) + 1;
          }
        } catch (error) {
          console.error('Error parsing user date:', error);
        }
      }
    });

    const filteredData = Object.entries(regionCount).map(([name, value]) => ({ name, value }));
    
    return { filteredData, filteredUsers: regionUsers };
  };

  // Handle print time filter change with custom date support
  const handlePrintTimeFilterChange = (e) => {
    const newFilter = e.target.value;
    setPrintTimeFilter(newFilter);
    
    if (newFilter === 'custom') {
      setPrintShowCustomDatePicker(true);
    } else {
      setPrintShowCustomDatePicker(false);
      const { filteredData } = filterPlaceDataByDate(newFilter);
      setFilteredPlaceData(filteredData);
    }
  };

  // Apply custom date filter for print
  const applyPrintCustomDateFilter = () => {
    if (!validateCustomDateRange(printCustomStartDate, printCustomEndDate)) {
      return;
    }

    const { filteredData } = filterPlaceDataByDate('custom', printCustomStartDate, printCustomEndDate);
    setFilteredPlaceData(filteredData);
    setPrintShowCustomDatePicker(false);
    toast.success('Custom date range applied successfully');
  };

  // Enhanced print function with custom date support
  const handlePrint = () => {
    const customStart = printTimeFilter === 'custom' ? printCustomStartDate : null;
    const customEnd = printTimeFilter === 'custom' ? printCustomEndDate : null;
    const { filteredData, filteredUsers } = filterPlaceDataByDate(printTimeFilter, customStart, customEnd);
    
    const printWindow = window.open('', '_blank');
    const currentDate = new Date().toLocaleDateString();
    const timeFilterLabel = formatDateRangeDisplay(printTimeFilter, customStart, customEnd);
    
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
          <h2>${timeFilterLabel}</h2>
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

  // Enhanced filtering function for Total Users modal with custom date support
  const filterUsersByDate = (timeFilter = selectedTimeFilter, customStart = null, customEnd = null) => {
    const [startDate, endDate] = getDateRange(timeFilter, customStart, customEnd);

    if (!startDate || !endDate) {
      setFilteredUsers([]);
      return;
    }

    const allUsers = [];

    // Add App Users
    appUsers.forEach((user) => {
      if (user.createdAt && user.createdAt !== 'No date') {
        try {
          const userDate = new Date(user.createdAt);
          if (userDate >= startDate && userDate <= endDate) {
            allUsers.push({
              id: user.id,
              name: user.name || 'No name',
              email: user.email || 'No email',
              createdAt: user.createdAt,
              source: 'App',
              type: 'App User'
            });
          }
        } catch (error) {
          console.error('Error parsing app user date:', error);
        }
      }
    });

    // Add Web Users from allUsersData
    allUsersData.forEach((user) => {
      if (user.source === 'Web' && user.createdAt && user.createdAt !== 'No date') {
        try {
          const userDate = new Date(user.createdAt);
          if (userDate >= startDate && userDate <= endDate) {
            allUsers.push({
              id: `web-${user.name}-${user.createdAt}`,
              name: user.name || 'Web User',
              email: 'Not available',
              createdAt: user.createdAt,
              source: 'Web',
              type: 'Web Registration',
              region: user.region,
              place: user.place
            });
          }
        } catch (error) {
          console.error('Error parsing web user date:', error);
        }
      }
    });

    // Sort by date (newest first)
    allUsers.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return dateB - dateA;
    });

    setFilteredUsers(allUsers);
  };

  // Get total count for the selected time period with custom date support
  const getTotalUsersForPeriod = (timeFilter, customStart = null, customEnd = null) => {
    const [startDate, endDate] = getDateRange(timeFilter, customStart, customEnd);
    
    if (!startDate || !endDate) return 0;

    let count = 0;

    // Count App Users
    appUsers.forEach((user) => {
      if (user.createdAt && user.createdAt !== 'No date') {
        try {
          const userDate = new Date(user.createdAt);
          if (userDate >= startDate && userDate <= endDate) {
            count++;
          }
        } catch (error) {
          console.error('Error parsing app user date:', error);
        }
      }
    });

    // Count Web Users
    allUsersData.forEach((user) => {
      if (user.source === 'Web' && user.createdAt && user.createdAt !== 'No date') {
        try {
          const userDate = new Date(user.createdAt);
          if (userDate >= startDate && userDate <= endDate) {
            count++;
          }
        } catch (error) {
          console.error('Error parsing web user date:', error);
        }
      }
    });

    return count;
  };

  // Handle total users click
  const handleTotalUsersClick = () => {
    filterUsersByDate(selectedTimeFilter);
    setShowTimeModal(true);
  };

  // Handle time filter change with custom date support
  const handleTimeFilterChange = (e) => {
    const newTimeFilter = e.target.value;
    setSelectedTimeFilter(newTimeFilter);
    
    if (newTimeFilter === 'custom') {
      setShowCustomDatePicker(true);
    } else {
      setShowCustomDatePicker(false);
      filterUsersByDate(newTimeFilter);
    }
  };

  // Apply custom date filter for Total Users
  const applyCustomDateFilter = () => {
    if (!validateCustomDateRange(customStartDate, customEndDate)) {
      return;
    }

    filterUsersByDate('custom', customStartDate, customEndDate);
    setShowCustomDatePicker(false);
    toast.success('Custom date range applied successfully');
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
          const place = data.place || data.placeSelected;
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
            <h3>Users Analytics</h3>
            <p className="admin-number">{totalUsers}</p>
          </div>

          <div className="admin-card admin-web-users" onClick={handleUserCardClick}>
            <h3>User Registered</h3>
            <p className="admin-number">{registeredWeb}</p>
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
          <BarChart data={landmarksData} margin={{ top: 20, right: 20, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                tickFormatter={(value) => value.length > 10 ? value.slice(0, 10) + '…' : value}
              />
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
                <XAxis
                dataKey="name"
                tickFormatter={(value) => value.length > 10 ? value.slice(0, 10) + '…' : value}
                />
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
  {Object.entries(usersByPlace).map(([region, users]) => {
    // dito ka puwede magdeclare ng const
    const itemsPerPage = 10;
    const page = pageByRegion[region] || 0;
    const start = page * itemsPerPage;
    const currentUsers = users.slice(start, start + itemsPerPage);
    const totalPages = Math.ceil(users.length / itemsPerPage);

    return (
      <div key={region} className="place-card">
        <h4>
          <span className="region">{region}</span>
          <span className="count">
            {users.length} user{users.length > 1 ? 's' : ''}
          </span>
        </h4>
        <ul className="place-users-list">
          {currentUsers.map((user, i) => (
            <li key={i}>
              {user.name} – {user.place}
            </li>
          ))}
        </ul>

        {users.length > itemsPerPage && (
          <div className="pagination flex justify-between items-center mt-3">
            <button
              onClick={() =>
                setPageByRegion(prev => ({
                  ...prev,
                  [region]: Math.max((prev[region] || 0) - 1, 0),
                }))
              }
              disabled={page === 0}
              className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
            >
              Prev
            </button>

            <span className="text-sm text-gray-600">
              Page {page + 1} of {totalPages}
            </span>

            <button
              onClick={() =>
                setPageByRegion(prev => ({
                  ...prev,
                  [region]:
                    (prev[region] || 0) + 1 < totalPages
                      ? (prev[region] || 0) + 1
                      : prev[region] || 0,
                }))
              }
              disabled={page + 1 >= totalPages}
              className="px-3 py-1 bg-blue-500 text-white rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    );
  })}
</div>
          </div>
        </div>
      </div>

      {/* Enhanced Print Statistics Modal with Custom Date */}
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
                <option value="custom">Custom Date Range</option>
              </select>
            </div>

            {/* Custom Date Picker for Print */}
            {printShowCustomDatePicker && (
              <div className="custom-date-section">
                <div className="date-inputs">
                  <div className="date-input-group">
                    <label htmlFor="print-start-date" className="date-label">Start Date:</label>
                    <input
                      type="date"
                      id="print-start-date"
                      value={printCustomStartDate}
                      onChange={(e) => setPrintCustomStartDate(e.target.value)}
                      className="date-input"
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="date-input-group">
                    <label htmlFor="print-end-date" className="date-label">End Date:</label>
                    <input
                      type="date"
                      id="print-end-date"
                      value={printCustomEndDate}
                      onChange={(e) => setPrintCustomEndDate(e.target.value)}
                      className="date-input"
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>
                <button 
                  onClick={applyPrintCustomDateFilter}
                  className="btn-apply-date"
                >
                  Apply Custom Range
                </button>
              </div>
            )}

            <div className="preview-summary">
              <h4>Report Preview</h4>
              <p><strong>Period:</strong> {formatDateRangeDisplay(printTimeFilter, printCustomStartDate, printCustomEndDate)}</p>
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
                disabled={printTimeFilter === 'custom' && (!printCustomStartDate || !printCustomEndDate)}
              >
                Generate Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Time Modal for Total Users with Custom Date */}
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
                <option value="thisWeek">
                  This Week ({getTotalUsersForPeriod('thisWeek')} users)
                </option>
                <option value="lastWeek">
                  Last Week ({getTotalUsersForPeriod('lastWeek')} users)
                </option>
                <option value="thisMonth">
                  This Month ({getTotalUsersForPeriod('thisMonth')} users)
                </option>
                <option value="lastMonth">
                  Last Month ({getTotalUsersForPeriod('lastMonth')} users)
                </option>
                <option value="thisYear">
                  This Year ({getTotalUsersForPeriod('thisYear')} users)
                </option>
                <option value="lastYear">
                  Last Year ({getTotalUsersForPeriod('lastYear')} users)
                </option>
                <option value="custom">
                  Custom Date Range ({selectedTimeFilter === 'custom' && customStartDate && customEndDate ? getTotalUsersForPeriod('custom', customStartDate, customEndDate) : 0} users)
                </option>
              </select>
            </div>

            {/* Custom Date Picker for Total Users */}
            {showCustomDatePicker && (
              <div className="custom-date-section">
                <div className="date-inputs">
                  <div className="date-input-group">
                    <label htmlFor="start-date" className="date-label">Start Date:</label>
                    <input
                      type="date"
                      id="start-date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="date-input"
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="date-input-group">
                    <label htmlFor="end-date" className="date-label">End Date:</label>
                    <input
                      type="date"
                      id="end-date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="date-input"
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>
                <button 
                  onClick={applyCustomDateFilter}
                  className="btn-apply-date"
                >
                  Apply Custom Range
                </button>
              </div>
            )}

            <div className="time-stats-summary">
              <div className="time-stat-card">
                <span className="time-stat-number">{filteredUsers.length}</span>
                <span className="time-stat-label">
                  {formatDateRangeDisplay(selectedTimeFilter, customStartDate, customEndDate)} Registrations
                </span>
              </div>
            </div>

            <div className="time-users-container">
              {filteredUsers.length > 0 ? (
                <div className="time-users-grid">
                  {filteredUsers.map((user, index) => (
                    <div key={index} className={`time-user-card ${user.source.toLowerCase()}`}>
                      <div className="time-user-info">
                        <h4 className="time-user-name">{user.name}</h4>
                        <span className="time-user-date">{user.createdAt}</span>
                        {user.region && user.place && (
                          <span className="time-user-location">
                            {user.region} - {user.place}
                          </span>
                        )}
                        {user.email && user.email !== 'Not available' && (
                          <span className="time-user-email">{user.email}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="time-no-users">
                  <p>No users registered in the selected time period.</p>
                  <small>Try selecting a different time range to see more results.</small>
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
                      onClick={() => resolveReport(report)}
                      disabled={resolvingReportId === report.id}
                    >
                      {resolvingReportId === report.id ? "Resolving..." : "Resolve"}
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

    </div>
  );
}

export default Admin;
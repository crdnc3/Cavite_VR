import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './Sidebar';
import './Users.css';
import { collection, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

function Users() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [users, setUsers] = useState([]);
  const [editingUserId, setEditingUserId] = useState(null);
  const [newRole, setNewRole] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [bulkAction, setBulkAction] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const userList = usersSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            role: data.role || 'User', // ✅ ensure default role
            ...data,
          };
        });
        setUsers(userList);
        setError(null);
      } catch (error) {
        console.error('Error fetching users:', error);
        setError('Failed to fetch users. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleDeleteUser = async (userId) => {
    setUserToDelete(userId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    try {
      await deleteDoc(doc(db, "users", userToDelete));
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userToDelete));
      setSelectedUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userToDelete);
        return newSet;
      });
      console.log(`User ${userToDelete} deleted.`);
    } catch (error) {
      console.error("Error deleting user:", error);
      setError('Failed to delete user. Please try again.');
    } finally {
      setShowDeleteModal(false);
      setUserToDelete(null);
    }
  };

  const handleEditClick = (userId, currentRole) => {
    setEditingUserId(userId);
    setNewRole(currentRole || 'User');
  };

  const handleSaveRole = async (userId) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { role: newRole });

      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId ? { ...user, role: newRole } : user
        )
      );

      setEditingUserId(null);
      console.log(`User ${userId} updated.`);
    } catch (error) {
      console.error('Error updating user:', error);
      setError('Failed to update user role. Please try again.');
    }
  };

  const handleSelectUser = (userId) => {
    setSelectedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedUsers.size === paginatedUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(paginatedUsers.map(user => user.id)));
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedUsers.size === 0) return;
    try {
      if (bulkAction === 'delete') {
        const confirmBulkDelete = window.confirm(`Are you sure you want to delete ${selectedUsers.size} users?`);
        if (!confirmBulkDelete) return;
        const deletePromises = Array.from(selectedUsers).map(userId =>
          deleteDoc(doc(db, "users", userId))
        );
        await Promise.all(deletePromises);
        setUsers(prevUsers => prevUsers.filter(user => !selectedUsers.has(user.id)));
        setSelectedUsers(new Set());
      } else if (bulkAction === 'promote') {
        const updatePromises = Array.from(selectedUsers).map(userId =>
          updateDoc(doc(db, 'users', userId), { role: 'Admin' })
        );
        await Promise.all(updatePromises);
        setUsers(prevUsers => prevUsers.map(user =>
          selectedUsers.has(user.id) ? { ...user, role: 'Admin' } : user
        ));
        setSelectedUsers(new Set());
      } else if (bulkAction === 'demote') {
        const updatePromises = Array.from(selectedUsers).map(userId =>
          updateDoc(doc(db, 'users', userId), { role: 'User' })
        );
        await Promise.all(updatePromises);
        setUsers(prevUsers => prevUsers.map(user =>
          selectedUsers.has(user.id) ? { ...user, role: 'User' } : user
        ));
        setSelectedUsers(new Set());
      }
    } catch (error) {
      console.error('Error performing bulk action:', error);
      setError('Failed to perform bulk action. Please try again.');
    }
    setBulkAction('');
  };

  const filteredUsers = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase();
    return users.filter(user => {
      const role = user.role?.toLowerCase() || 'user';
      return (
        (user.username?.toLowerCase().includes(lowerSearch) ||
          user.email?.toLowerCase().includes(lowerSearch)) &&
        (filterRole === '' || role === filterRole.toLowerCase())
      );
    });
  }, [users, searchTerm, filterRole]);

  const sortedUsers = useMemo(() => {
    if (!sortConfig.key) return filteredUsers;
    return [...filteredUsers].sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      if (sortConfig.key === 'createdAt') {
        aVal = aVal?.toDate?.() || new Date(aVal);
        bVal = bVal?.toDate?.() || new Date(bVal);
      } else {
        aVal = aVal?.toString().toLowerCase() || '';
        bVal = bVal?.toString().toLowerCase() || '';
      }
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredUsers, sortConfig]);

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return sortedUsers.slice(startIndex, startIndex + rowsPerPage);
  }, [sortedUsers, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(sortedUsers.length / rowsPerPage);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = null;
      key = null;
    }
    setSortConfig({ key, direction });
  };

  const SortArrow = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return <span className="sort-arrow">⥯</span>;
    if (sortConfig.direction === 'asc') return <span className="sort-arrow">↾</span>;
    if (sortConfig.direction === 'desc') return <span className="sort-arrow">⇃</span>;
    return null;
  };

  if (loading) {
    return (
      <div className="dashboard-page user-page">
        <Sidebar />
        <div className="main-content">
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading users...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page user-page">
      <Sidebar />
      <div className="main-content">
        <div className="page-header">
          <h2 className="page-title">User Management</h2>
          <div className="page-stats">
            <span className="user-count">Total: {users.length} users</span>
            <button 
              className="refresh-btn"
              onClick={() => window.location.reload()}
              title="Refresh users"
            >
            <i className="fas fa-sync-alt"></i>
            </button>
          </div>
        </div>

        {error && (
          <div className="error-banner">
            <span>⚠️ {error}</span>
            <button onClick={() => setError(null)} className="error-close">×</button>
          </div>
        )}

        {selectedUsers.size > 0 && (
          <div className="bulk-actions-bar">
            <span className="selected-count">{selectedUsers.size} user(s) selected</span>
            <div className="bulk-controls">
              <select
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value)}
                className="bulk-select"
              >
                <option value="">Choose action...</option>
                <option value="promote">Promote to Admin</option>
                <option value="demote">Demote to User</option>
                <option value="delete">Delete Selected</option>
              </select>
              <button 
                onClick={handleBulkAction}
                disabled={!bulkAction}
                className="bulk-apply-btn"
              >
                Apply
              </button>
              <button 
                onClick={() => setSelectedUsers(new Set())}
                className="bulk-clear-btn"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        <div className="search-filter-container">
          <div className="search-wrapper">
            <input
              type="text"
              className="search-input"
              placeholder="Search user..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
            <span className="search-icon">🔍</span>
          </div>
          
          <button 
            className="filter-toggle"
            onClick={() => setShowFilters(!showFilters)}
          >
            Filters {showFilters ? '▲' : '▼'}
          </button>
          
          <div className={`filters-section ${showFilters ? 'expanded' : ''}`}>
            <select
              className="filter-select"
              value={filterRole}
              onChange={(e) => {
                setFilterRole(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Roles</option>
              <option value="User">User</option>
              <option value="Admin">Admin</option>
            </select>
            <select
              className="rows-select"
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(parseInt(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={5}>5 rows</option>
              <option value={7}>7 rows</option>
              <option value={10}>10 rows</option>
              <option value={20}>20 rows</option>
            </select>
          </div>
        </div>

        <div className="table-container">
          <table className="user-table">
            <thead>
              <tr>
                <th className="select-column">
                  <input
                    type="checkbox"
                    checked={selectedUsers.size === paginatedUsers.length && paginatedUsers.length > 0}
                    onChange={handleSelectAll}
                    className="select-checkbox"
                  />
                </th>
                <th onClick={() => requestSort('username')} className="sortable-header">
                  Name <SortArrow columnKey="username" />
                </th>
                <th onClick={() => requestSort('email')} className="sortable-header">
                  Email <SortArrow columnKey="email" />
                </th>
                <th onClick={() => requestSort('role')} className="sortable-header">
                  Role <SortArrow columnKey="role" />
                </th>
                <th onClick={() => requestSort('place')} className="sortable-header">
                  Place <SortArrow columnKey="place" />
                </th>
                <th onClick={() => requestSort('region')} className="sortable-header">
                  Region <SortArrow columnKey="region" />
                </th>
                <th onClick={() => requestSort('createdAt')} className="sortable-header">
                  Joined <SortArrow columnKey="createdAt" />
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.length === 0 ? (
                <tr><td colSpan="8" className="no-users">No users found.</td></tr>
              ) : (
                paginatedUsers.map((user, index) => {
                  const joinedDate = user.createdAt
                    ? new Date(user.createdAt?.toDate?.() || user.createdAt).toLocaleDateString()
                    : 'N/A';
                  return (
                    <tr 
                      key={user.id || index}
                      className={selectedUsers.has(user.id) ? 'selected-row' : ''}
                    >
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedUsers.has(user.id)}
                          onChange={() => handleSelectUser(user.id)}
                          className="select-checkbox"
                        />
                      </td>
                      <td>
                        <div className="user-info">
                          <div className="user-avatar">{user.username?.[0]?.toUpperCase() || '?'}</div>
                          <span>{user.username || 'No name'}</span>
                        </div>
                      </td>
                      <td>
                        <div className="email-cell">
                        <i className="fas fa-envelope"></i> {user.email || 'No email'}
                        </div>
                      </td>
                      <td>
                        {editingUserId === user.id ? (
                          <select
                            value={newRole}
                            onChange={(e) => setNewRole(e.target.value)}
                            className="role-select"
                          >
                            <option value="User">User</option>
                            <option value="Admin">Admin</option>
                          </select>
                        ) : (
                          <span className={`role-badge ${user.role?.toLowerCase() || 'user'}`}>
                            {user.role || 'User'}
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="location-cell">
                        <i className="fas fa-map-marker-alt"></i> {user.place || '—'}
                        </div>
                      </td>
                      <td>
                        <div className="region-cell">
                        <i className="fas fa-globe"></i> {user.region || '—'}
                        </div>
                      </td>
                      <td>
                        <div className="date-cell">
                        <i className="fas fa-calendar-alt"></i> {joinedDate}
                        </div>
                      </td>
                      <td>
                        <div className="actions-cell">
                          {editingUserId === user.id ? (
                            <>
                              <button
                                className="action-btn save-btn"
                                onClick={() => handleSaveRole(user.id)}
                                title="Save changes"
                              >
                                Save
                              </button>
                              <button
                                className="action-btn cancel-btn"
                                onClick={() => setEditingUserId(null)}
                                title="Cancel editing"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                className="action-btn edit-btn"
                                onClick={() => handleEditClick(user.id, user.role)}
                                title="Edit user role"
                              >
                                Edit
                              </button>
                              <button
                                className="action-btn delete-btn"
                                onClick={() => handleDeleteUser(user.id)}
                                title="Delete user"
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <div className="pagination-info">
            Showing {Math.min((currentPage - 1) * rowsPerPage + 1, sortedUsers.length)} to {Math.min(currentPage * rowsPerPage, sortedUsers.length)} of {sortedUsers.length} users
          </div>
          <div className="pagination-controls">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(1)}
              className="pagination-button"
            >
              First
            </button>
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              className="pagination-button"
            >
               Previous
            </button>
            <span className="page-info">
              Page {currentPage} of {totalPages || 1}
            </span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
              className="pagination-button"
            >
              Next
            </button>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(totalPages)}
              className="pagination-button"
            >
              Last
            </button>
          </div>
        </div>

        {showDeleteModal && (
          <div className="del-modal-overlay">
            <div className="del-modal-content">
              <h3>Confirm Delete</h3>
              <p>Are you sure you want to delete this user? This action cannot be undone.</p>
              <div className="del-modal-actions">
                <button onClick={confirmDelete} className="ucnfrm-btn">Yes, Delete</button>
                <button onClick={() => setShowDeleteModal(false)} className="ucncl-btn">Cancel</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default Users;

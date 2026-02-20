import { useState, useEffect } from 'react';
import '../styles/Friends.css';

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

export default function Friends() {
  const [activeTab, setActiveTab] = useState('friends'); // friends, requests, add
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const token = localStorage.getItem('access');

  useEffect(() => {
    if (activeTab === 'friends') {
      fetchFriends();
    } else if (activeTab === 'requests') {
      fetchPendingRequests();
    } else if (activeTab === 'add') {
      fetchAvailableUsers();
    }
  }, [activeTab, searchQuery]);

  const fetchFriends = async () => {
    try {
      const response = await fetch(`${API}/accounts/friends/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error(`${response.status}`);
      const data = await response.json();
      setFriends(data.friends);
      setError('');
    } catch (err) {
      setError('Failed to fetch friends');
      console.error(err);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const response = await fetch(`${API}/accounts/friend-requests/pending/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error(`${response.status}`);
      const data = await response.json();
      setPendingRequests(data.pending_requests);
      setError('');
    } catch (err) {
      setError('Failed to fetch pending requests');
      console.error(err);
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      const query = searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : '';
      const response = await fetch(`${API}/accounts/users/available${query}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error(`${response.status}`);
      const data = await response.json();
      setAvailableUsers(data.users);
      setError('');
    } catch (err) {
      setError('Failed to fetch available users');
      console.error(err);
    }
  };

  const sendFriendRequest = async (toUserId) => {
    try {
      const response = await fetch(`${API}/accounts/friend-request/send/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ to_user_id: toUserId })
      });

      if (response.ok) {
        setSuccess('Friend request sent!');
        setTimeout(() => setSuccess(''), 3000);
        fetchAvailableUsers();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to send request');
      }
    } catch (err) {
      setError('Error sending friend request');
      console.error(err);
    }
  };

  const acceptRequest = async (requestId) => {
    try {
      const response = await fetch(`${API}/accounts/friend-request/${requestId}/accept/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setSuccess('Friend request accepted!');
        setTimeout(() => setSuccess(''), 3000);
        fetchPendingRequests();
        fetchFriends();
      } else {
        setError('Failed to accept request');
      }
    } catch (err) {
      setError('Error accepting request');
      console.error(err);
    }
  };

  const rejectRequest = async (requestId) => {
    try {
      const response = await fetch(`${API}/accounts/friend-request/${requestId}/reject/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setSuccess('Friend request rejected');
        setTimeout(() => setSuccess(''), 3000);
        fetchPendingRequests();
      } else {
        setError('Failed to reject request');
      }
    } catch (err) {
      setError('Error rejecting request');
      console.error(err);
    }
  };

  const removeFriend = async (friendId) => {
    if (!window.confirm('Are you sure you want to remove this friend?')) return;

    try {
      const response = await fetch(`${API}/accounts/friend/${friendId}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setSuccess('Friend removed');
        setTimeout(() => setSuccess(''), 3000);
        fetchFriends();
      } else {
        setError('Failed to remove friend');
      }
    } catch (err) {
      setError('Error removing friend');
      console.error(err);
    }
  };

  return (
    <div className="friends-container">
      <h1>Friends</h1>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="friends-tabs">
        <button
          className={`tab-btn ${activeTab === 'friends' ? 'active' : ''}`}
          onClick={() => setActiveTab('friends')}
        >
          Friends ({friends.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
          onClick={() => setActiveTab('requests')}
        >
          Requests ({pendingRequests.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'add' ? 'active' : ''}`}
          onClick={() => setActiveTab('add')}
        >
          Add Friends
        </button>
      </div>

      <div className="friends-content">
        {/* Friends Tab */}
        {activeTab === 'friends' && (
          <div className="friends-list">
            {friends.length === 0 ? (
              <p className="empty-message">You don't have any friends yet. Start adding friends!</p>
            ) : (
              friends.map(friend => (
                <div key={friend.id} className="friend-card">
                  <div className="friend-info">
                    <h3>{friend.username}</h3>
                    <p className="friend-email">{friend.email}</p>
                    {friend.bio && <p className="friend-bio">{friend.bio}</p>}
                  </div>
                  <button
                    className="btn-remove"
                    onClick={() => removeFriend(friend.id)}
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Pending Requests Tab */}
        {activeTab === 'requests' && (
          <div className="requests-list">
            {pendingRequests.length === 0 ? (
              <p className="empty-message">No pending friend requests</p>
            ) : (
              pendingRequests.map(request => (
                <div key={request.id} className="request-card">
                  <div className="request-info">
                    <h3>{request.from_user.username}</h3>
                    <p className="request-email">{request.from_user.email}</p>
                    {request.from_user.bio && <p className="request-bio">{request.from_user.bio}</p>}
                  </div>
                  <div className="request-actions">
                    <button
                      className="btn-accept"
                      onClick={() => acceptRequest(request.id)}
                    >
                      Accept
                    </button>
                    <button
                      className="btn-reject"
                      onClick={() => rejectRequest(request.id)}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Add Friends Tab */}
        {activeTab === 'add' && (
          <div className="add-friends-section">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search users by username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="users-list">
              {availableUsers.length === 0 ? (
                <p className="empty-message">No available users found</p>
              ) : (
                availableUsers.map(user => (
                  <div key={user.id} className="user-card">
                    <div className="user-info">
                      <h3>{user.username}</h3>
                      <p className="user-email">{user.email}</p>
                      {user.bio && <p className="user-bio">{user.bio}</p>}
                    </div>
                    <button
                      className="btn-add-friend"
                      onClick={() => sendFriendRequest(user.id)}
                    >
                      Add Friend
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

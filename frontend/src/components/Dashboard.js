import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useProfile } from '../hooks/useAuth';
import Card, { StatCard, RequestCard } from './ui/Card';
import Button, { HeartIcon, LocationIcon, PlusIcon } from './ui/Button';
import RewardsWidget from './RewardsWidget';
import './Dashboard.css';

const Dashboard = () => {
  const { user, profile: userProfile } = useProfile();
  const [stats, setStats] = useState({
    totalRequests: 0,
    activeRequests: 0,
    donationsReceived: 0,
    nearbyDonors: 0
  });
  const [recentRequests, setRecentRequests] = useState([]);
  const [nearbyRequests, setNearbyRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Mock data - replace with real API calls
      setTimeout(() => {
        setStats({
          totalRequests: 12,
          activeRequests: 3,
          donationsReceived: 8,
          nearbyDonors: 45
        });

        setRecentRequests([
          {
            id: 1,
            patientName: 'John Doe',
            bloodGroup: 'O+',
            component: 'Whole Blood',
            urgency: 'SOS',
            unitsRequired: 2,
            location: 'City Hospital, Mumbai',
            timeAgo: '5 minutes ago',
            status: 'Open'
          },
          {
            id: 2,
            patientName: 'Sarah Smith',
            bloodGroup: 'A-',
            component: 'Platelets',
            urgency: 'Urgent',
            unitsRequired: 1,
            location: 'Apollo Hospital, Delhi',
            timeAgo: '2 hours ago',
            status: 'In Progress'
          }
        ]);

        setNearbyRequests([
          {
            id: 3,
            patientName: 'Mike Johnson',
            bloodGroup: 'B+',
            component: 'RBC',
            urgency: 'Scheduled',
            unitsRequired: 1,
            location: 'Max Hospital, Bangalore',
            timeAgo: '1 day ago',
            status: 'Open'
          }
        ]);

        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  const handleRequestResponse = (requestId, action) => {
    console.log(`${action} request ${requestId}`);
    // Handle request response logic
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="dashboard__container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard__container">
        {/* Header */}
        <div className="dashboard__header">
          <div className="dashboard__welcome">
            <h1 className="dashboard__title">
              Welcome back, {userProfile?.name || user?.email?.split('@')[0] || 'Warrior'}! 👋
            </h1>
            <p className="dashboard__subtitle">
              Your blood donation journey continues. Every drop counts in saving lives.
            </p>
          </div>
          
          <div className="dashboard__quick-actions">
            <Link to="/app/sos">
              <Button variant="sos" size="lg" icon={<HeartIcon />}>
                Emergency SOS
              </Button>
            </Link>
            <Link to="/app/requests/new">
              <Button variant="primary" size="lg" icon={<PlusIcon />}>
                New Request
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="dashboard__stats">
          <StatCard
            title="Total Requests"
            value={stats.totalRequests}
            subtitle="All time"
            icon={<RequestIcon />}
            trend="up"
            trendValue="+2 this month"
            color="primary"
          />
          
          <StatCard
            title="Active Requests"
            value={stats.activeRequests}
            subtitle="Currently open"
            icon={<ActiveIcon />}
            color="warning"
          />
          
          <StatCard
            title="Donations Received"
            value={stats.donationsReceived}
            subtitle="Successfully completed"
            icon={<HeartIcon />}
            trend="up"
            trendValue="+3 this month"
            color="success"
          />
          
          <StatCard
            title="Nearby Donors"
            value={stats.nearbyDonors}
            subtitle="Within 15km"
            icon={<LocationIcon />}
            color="primary"
          />
        </div>

        {/* Main Content Grid */}
        <div className="dashboard__content">
          <div className="dashboard__main-column">
            {/* Recent Requests */}
            <div className="dashboard__section">
              <div className="dashboard__section-header">
                <h2 className="dashboard__section-title">Your Recent Requests</h2>
                <Link to="/app/requests" className="dashboard__section-link">
                  View All
                </Link>
              </div>
              
              <div className="dashboard__requests">
                {recentRequests.length > 0 ? (
                  recentRequests.map(request => (
                    <RequestCard
                      key={request.id}
                      {...request}
                      onRespond={(action) => handleRequestResponse(request.id, action)}
                    />
                  ))
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">📋</div>
                    <h3 className="empty-title">No Recent Requests</h3>
                    <p className="empty-message">
                      You haven't made any blood requests yet. Create your first request to get started.
                    </p>
                    <Link to="/app/requests/new">
                      <Button variant="primary" icon={<PlusIcon />}>
                        Create Request
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Nearby Requests */}
            <div className="dashboard__section">
              <div className="dashboard__section-header">
                <h2 className="dashboard__section-title">Nearby Requests</h2>
                <Link to="/app/requests?filter=nearby" className="dashboard__section-link">
                  View All
                </Link>
              </div>
              
              <div className="dashboard__requests">
                {nearbyRequests.length > 0 ? (
                  nearbyRequests.map(request => (
                    <RequestCard
                      key={request.id}
                      {...request}
                      onRespond={(action) => handleRequestResponse(request.id, action)}
                    />
                  ))
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">📍</div>
                    <h3 className="empty-title">No Nearby Requests</h3>
                    <p className="empty-message">
                      There are no blood requests in your area right now. Check back later.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="dashboard__side-column">
            {/* Rewards Widget */}
            <RewardsWidget />
            
            {/* CareBot Shortcut */}
            <div className="carebot-shortcut">
              <Card variant="primary" padding="md">
                <div className="carebot-shortcut__content">
                  <div className="carebot-shortcut__icon">🤖</div>
                  <div className="carebot-shortcut__text">
                    <h3>Need Support?</h3>
                    <p>Chat with CareBot, your AI health assistant</p>
                  </div>
                  <Link to="/app/carebot" className="carebot-shortcut__button">
                    <Button variant="secondary" size="sm">
                      Open CareBot
                    </Button>
                  </Link>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="dashboard__quick-access">
          <Card variant="glass" padding="lg">
            <div className="quick-access__header">
              <h3 className="quick-access__title">Quick Actions</h3>
              <p className="quick-access__subtitle">
                Common tasks to help you manage your blood donation journey
              </p>
            </div>
            
            <div className="quick-access__grid">
              <Link to="/app/profile" className="quick-access__item">
                <div className="quick-access__icon">
                  <ProfileIcon />
                </div>
                <h4>Update Profile</h4>
                <p>Keep your information current</p>
              </Link>
              
              <Link to="/app/donors" className="quick-access__item">
                <div className="quick-access__icon">
                  <DonorIcon />
                </div>
                <h4>Find Donors</h4>
                <p>Search for compatible donors</p>
              </Link>
              
              <Link to="/app/history" className="quick-access__item">
                <div className="quick-access__icon">
                  <HistoryIcon />
                </div>
                <h4>View History</h4>
                <p>Track your donation history</p>
              </Link>
              
              <Link to="/app/help" className="quick-access__item">
                <div className="quick-access__icon">
                  <HelpIcon />
                </div>
                <h4>Get Help</h4>
                <p>Support and resources</p>
              </Link>
            </div>
          </Card>
        </div>

        {/* Health Tips */}
        <div className="dashboard__tips">
          <Card variant="primary" padding="lg">
            <div className="health-tips">
              <div className="health-tips__icon">
                <HealthIcon />
              </div>
              <div className="health-tips__content">
                <h3 className="health-tips__title">Today's Health Tip</h3>
                <p className="health-tips__message">
                  Stay hydrated! Drinking plenty of water helps maintain healthy blood volume 
                  and makes donation easier. Aim for 8-10 glasses of water daily.
                </p>
              </div>
              <Link to="/app/health-tips">
                <Button variant="secondary" size="sm">
                  More Tips
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Icon Components
const RequestIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
    <polyline points="14,2 14,8 20,8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10,9 9,9 8,9"/>
  </svg>
);

const ActiveIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12,6 12,12 16,14"/>
  </svg>
);

const ProfileIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const DonorIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const HistoryIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12,6 12,12 16,14"/>
  </svg>
);

const HelpIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="10"/>
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const HealthIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
  </svg>
);

export default Dashboard;
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import { 
  FaUsers, 
  FaTrain, 
  FaClock, 
  FaExclamationTriangle, 
  FaCheckCircle, 
  FaCalendarAlt,
  FaChartLine,
  FaBell,
  FaUserCheck
} from 'react-icons/fa';
import useAuthStore from '../../stores/useAuthStore';
import useToastStore from '../../stores/useToastStore';
import dashboardService from '../../services/dashboardService';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const HomeDashboard = () => {
  const navigate = useNavigate();
  const { role } = useAuthStore();
  const { error: showError } = useToastStore();
  
  // State
  const [dashboardStats, setDashboardStats] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch stats and recent activities in parallel
        const [statsResponse, activitiesResponse] = await Promise.all([
          dashboardService.getStats(),
          dashboardService.getRecentActivities({ limit: 10 })
        ]);

        console.log('📊 Dashboard Stats:', statsResponse);
        console.log('📋 Recent Activities:', activitiesResponse);

        if (statsResponse.success) {
          setDashboardStats(statsResponse.data);
        }

        if (activitiesResponse.success) {
          setRecentActivities(activitiesResponse.data.activities || []);
        }
      } catch (err) {
        console.error('❌ Failed to fetch dashboard data:', err);
        setError(err.response?.data?.message || 'Failed to load dashboard data');
        showError('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();

    // Refresh every 5 minutes
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [showError]);

  // Activity type display helpers
  const getActivityIcon = (type) => {
    if (type.includes('ALERT')) return FaBell;
    if (type === 'RELEASE' || type === 'SIGN_OFF') return FaCheckCircle;
    if (type.includes('RELIEF')) return FaUserCheck;
    return FaClock;
  };

  const getActivityColor = (type) => {
    if (type.includes('ALERT_14HR') || type.includes('ALERT_11HR')) return 'text-red-600';
    if (type.includes('ALERT')) return 'text-yellow-600';
    if (type === 'RELEASE' || type === 'SIGN_OFF') return 'text-green-600';
    if (type.includes('RELIEF')) return 'text-blue-600';
    return 'text-gray-600';
  };

  const getActivityBadge = (type) => {
    if (type.includes('ALERT_14HR') || type.includes('ALERT_11HR')) {
      return { text: 'CRITICAL', color: 'bg-red-100 text-red-700' };
    }
    if (type.includes('ALERT')) {
      return { text: 'ALERT', color: 'bg-yellow-100 text-yellow-700' };
    }
    if (type === 'RELEASE' || type === 'SIGN_OFF') {
      return { text: 'COMPLETED', color: 'bg-green-100 text-green-700' };
    }
    if (type.includes('RELIEF')) {
      return { text: 'RELIEF', color: 'bg-blue-100 text-blue-700' };
    }
    return { text: 'INFO', color: 'bg-gray-100 text-gray-700' };
  };

  if (isLoading) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  if (error && !dashboardStats) {
    return (
      <Layout>
        <ErrorMessage 
          message={error} 
          onRetry={() => window.location.reload()} 
        />
      </Layout>
    );
  }

  const stats = dashboardStats || {};
  const overview = stats.overview || {};
  const today = stats.today || {};
  const alerts = stats.alerts || {};

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold text-[#003d82]">Dashboard</h2>
          <p className="text-gray-600 mt-1">
            Overview of shift management system - Last updated {dayjs().format('HH:mm')}
          </p>
        </div>

        {/* Primary Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Active Shifts</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{overview.activeShifts || 0}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {today.activeShifts || 0} started today
                </p>
              </div>
              <div className="bg-blue-500 p-4 rounded-full">
                <FaClock className="text-white text-2xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Completed Today</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{today.shiftsCompleted || 0}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {overview.completedShifts || 0} total completed
                </p>
              </div>
              <div className="bg-green-500 p-4 rounded-full">
                <FaCheckCircle className="text-white text-2xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Shifts</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{overview.totalShifts || 0}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {today.shiftsCreated || 0} created today
                </p>
              </div>
              <div className="bg-purple-500 p-4 rounded-full">
                <FaTrain className="text-white text-2xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Active Alerts</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{alerts.totalAlerts || 0}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {overview.reliefPlannedShifts || 0} relief planned
                </p>
              </div>
              <div className="bg-red-500 p-4 rounded-full">
                <FaExclamationTriangle className="text-white text-2xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Alert Breakdown */}
        {alerts.totalAlerts > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-[#003d82] mb-4">Alert Breakdown</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">7 Hour</p>
                <p className="text-2xl font-bold text-blue-600">{alerts.alert7Hr || 0}</p>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">8 Hour</p>
                <p className="text-2xl font-bold text-yellow-600">{alerts.alert8Hr || 0}</p>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">9 Hour</p>
                <p className="text-2xl font-bold text-orange-600">{alerts.alert9Hr || 0}</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">10 Hour</p>
                <p className="text-2xl font-bold text-red-600">{alerts.alert10Hr || 0}</p>
              </div>
              <div className="text-center p-3 bg-red-100 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">11 Hour</p>
                <p className="text-2xl font-bold text-red-700">{alerts.alert11Hr || 0}</p>
              </div>
              <div className="text-center p-3 bg-red-200 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">14 Hour</p>
                <p className="text-2xl font-bold text-red-800">{alerts.alert14Hr || 0}</p>
              </div>
            </div>
          </div>
        )}

        {/* Additional Stats */}
        {(role === 'ADMIN' || role === 'SUPERADMIN') && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Duty Hours Stats */}
            {stats.dutyHours && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-bold text-[#003d82] mb-4 flex items-center gap-2">
                  <FaChartLine />
                  Duty Hours Statistics
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Average Hours</span>
                    <span className="text-lg font-bold text-blue-600">
                      {stats.dutyHours.averageHours?.toFixed(1)}h
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Max Hours</span>
                    <span className="text-lg font-bold text-red-600">
                      {stats.dutyHours.maxHours?.toFixed(1)}h
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Min Hours</span>
                    <span className="text-lg font-bold text-green-600">
                      {stats.dutyHours.minHours?.toFixed(1)}h
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Hours</span>
                    <span className="text-lg font-bold text-purple-600">
                      {stats.dutyHours.totalHours?.toFixed(1)}h
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Staff Stats */}
            {stats.staff && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-bold text-[#003d82] mb-4 flex items-center gap-2">
                  <FaUsers />
                  Staff Overview
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Staff</span>
                    <span className="text-lg font-bold text-gray-800">
                      {stats.staff.total}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">On Duty</span>
                    <span className="text-lg font-bold text-blue-600">
                      {stats.staff.onDuty}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Available</span>
                    <span className="text-lg font-bold text-green-600">
                      {stats.staff.available}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Unavailable</span>
                    <span className="text-lg font-bold text-red-600">
                      {stats.staff.unavailable}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Weekly Stats */}
            {stats.thisWeek && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-bold text-[#003d82] mb-4 flex items-center gap-2">
                  <FaCalendarAlt />
                  This Week
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Shifts Created</span>
                    <span className="text-lg font-bold text-blue-600">
                      {stats.thisWeek.shiftsCreated}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Shifts Completed</span>
                    <span className="text-lg font-bold text-green-600">
                      {stats.thisWeek.shiftsCompleted}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Completion Rate</span>
                    <span className="text-lg font-bold text-purple-600">
                      {stats.thisWeek.shiftsCreated > 0
                        ? ((stats.thisWeek.shiftsCompleted / stats.thisWeek.shiftsCreated) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recent Activity Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-[#003d82]">Recent Activity</h3>
            <button
              onClick={() => navigate('/dashboard/active-shifts')}
              className="text-sm text-[#003d82] hover:underline font-medium"
            >
              View All →
            </button>
          </div>
          <div className="space-y-3">
            {recentActivities.length === 0 ? (
              <p className="text-gray-500 text-center py-6">No recent activities</p>
            ) : (
              recentActivities.slice(0, 5).map((activity) => {
                const ActivityIcon = getActivityIcon(activity.type);
                const badge = getActivityBadge(activity.type);
                
                return (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between py-3 border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => activity.shift?.id && navigate(`/dashboard/shifts/${activity.shift.id}`)}
                  >
                    <div className="flex items-center gap-4">
                      <ActivityIcon className={`text-xl ${getActivityColor(activity.type)}`} />
                      <div>
                        <p className="font-medium text-gray-800">
                          {activity.type.replace(/_/g, ' ')} - Train #{activity.shift?.trainNumber || 'N/A'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {activity.staff?.name || 'Unknown'} ({activity.staff?.employeeId || 'N/A'}) - 
                          {' '}{dayjs(activity.timestamp).fromNow()}
                        </p>
                        {activity.remarks && (
                          <p className="text-xs text-gray-400 mt-1">{activity.remarks}</p>
                        )}
                      </div>
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full ${badge.color}`}>
                      {badge.text}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-[#003d82] mb-4">Quick Actions</h3>
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${role === 'SUPERADMIN' ? '4' : '3'} gap-4`}>
            {(role === 'ADMIN' || role === 'SUPERADMIN') && (
              <button 
                onClick={() => navigate('/dashboard/create-shift')}
                className="bg-[#003d82] text-white py-3 px-6 rounded-md hover:bg-[#002b5c] transition-colors font-medium"
              >
                Create New Shift
              </button>
            )}
            <button 
              onClick={() => navigate('/dashboard/active-shifts')}
              className="bg-white text-[#003d82] py-3 px-6 rounded-md border-2 border-[#003d82] hover:bg-[#003d82] hover:text-white transition-colors font-medium"
            >
              View Active Shifts
            </button>
            <button 
              onClick={() => navigate('/dashboard/completed-shifts')}
              className="bg-green-600 text-white py-3 px-6 rounded-md hover:bg-green-700 transition-colors font-medium"
            >
              Completed Shifts
            </button>
            {role === 'SUPERADMIN' && (
              <button 
                onClick={() => navigate('/dashboard/user-management')}
                className="bg-purple-600 text-white py-3 px-6 rounded-md hover:bg-purple-700 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <FaUsers />
                User Management
              </button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default HomeDashboard;

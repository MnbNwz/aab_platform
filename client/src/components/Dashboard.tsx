import { useSelector, useDispatch } from 'react-redux';
import { Users, DollarSign, Calendar, Settings, LogOut, Home, FileText, User, Briefcase, TrendingUp, ShoppingCart } from 'lucide-react';
import type { RootState, AppDispatch } from '../store';
import { logoutThunk } from '../store/thunks/authThunks';

export const Dashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  
  const handleLogout = () => {
    dispatch(logoutThunk());
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading user data...</p>
        </div>
      </div>
    );
  }

  // Admin Dashboard Content
  const AdminDashboard = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">1,234</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Revenue</p>
              <p className="text-2xl font-bold text-gray-900">$45,231</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Bookings</p>
              <p className="text-2xl font-bold text-gray-900">89</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-indigo-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Growth</p>
              <p className="text-2xl font-bold text-gray-900">+12%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <p className="text-sm text-gray-600">New contractor John Doe registered</p>
              <span className="text-xs text-gray-400">2 mins ago</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <p className="text-sm text-gray-600">Payment of $150 processed successfully</p>
              <span className="text-xs text-gray-400">5 mins ago</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              <p className="text-sm text-gray-600">Service booking updated by customer</p>
              <span className="text-xs text-gray-400">10 mins ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Customer Dashboard Content
  const CustomerDashboard = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Bookings</p>
              <p className="text-2xl font-bold text-gray-900">3</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900">$1,250</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <ShoppingCart className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Services Used</p>
              <p className="text-2xl font-bold text-gray-900">12</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Calendar className="h-5 w-5 text-blue-600 mr-3" />
              <span className="text-sm font-medium">Book New Service</span>
            </button>
            <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <FileText className="h-5 w-5 text-green-600 mr-3" />
              <span className="text-sm font-medium">View Service History</span>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Bookings</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <div>
                <p className="font-medium text-gray-900">Plumbing Service</p>
                <p className="text-sm text-gray-600">Scheduled for Dec 15, 2024</p>
              </div>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">Pending</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <div>
                <p className="font-medium text-gray-900">House Cleaning</p>
                <p className="text-sm text-gray-600">Completed on Dec 10, 2024</p>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">Completed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Contractor Dashboard Content
  const ContractorDashboard = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Briefcase className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Jobs</p>
              <p className="text-2xl font-bold text-gray-900">8</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Earnings (This Month)</p>
              <p className="text-2xl font-bold text-gray-900">$2,850</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Rating</p>
              <p className="text-2xl font-bold text-gray-900">4.8/5</p>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Jobs */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Upcoming Jobs</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <div>
                <p className="font-medium text-gray-900">Kitchen Renovation</p>
                <p className="text-sm text-gray-600">Customer: Sarah Johnson</p>
                <p className="text-sm text-gray-600">Dec 16, 2024 at 9:00 AM</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-green-600">$450</p>
                <button className="text-sm text-blue-600 hover:text-blue-800">View Details</button>
              </div>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <div>
                <p className="font-medium text-gray-900">Bathroom Plumbing</p>
                <p className="text-sm text-gray-600">Customer: Mike Davis</p>
                <p className="text-sm text-gray-600">Dec 18, 2024 at 2:00 PM</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-green-600">$280</p>
                <button className="text-sm text-blue-600 hover:text-blue-800">View Details</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDashboardContent = () => {
    switch (user.role) {
      case 'admin':
        return <AdminDashboard />;
      case 'customer':
        return <CustomerDashboard />;
      case 'contractor':
        return <ContractorDashboard />;
      default:
        return <CustomerDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Home className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {user.role === 'admin' ? 'Admin Dashboard' : 
                   user.role === 'contractor' ? 'Contractor Dashboard' : 
                   'Customer Dashboard'}
                </h1>
                <p className="text-sm text-gray-600">Welcome back, {user.firstName || user.email}!</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-700 capitalize">{user.role}</span>
              </div>
              <button className="flex items-center space-x-2 text-gray-600 hover:text-gray-800">
                <Settings className="h-5 w-5" />
                <span className="text-sm">Settings</span>
              </button>
              <button 
                onClick={handleLogout}
                className="flex items-center space-x-2 text-red-600 hover:text-red-800"
              >
                <LogOut className="h-5 w-5" />
                <span className="text-sm">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {renderDashboardContent()}
        </div>
      </main>
    </div>
  );
};

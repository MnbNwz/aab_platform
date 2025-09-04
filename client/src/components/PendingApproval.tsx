import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Clock, CheckCircle, XCircle, User, Shield, LogOut } from 'lucide-react';
import type { User as UserType } from '../types';
import type { AppDispatch } from '../store';
import { getProfileThunk, logoutThunk } from '../store/thunks/authThunks';
import { showToast } from '../utils/toast';
import Loader from './ui/Loader';

interface PendingApprovalProps {
  user: UserType;
}

export const PendingApproval: React.FC<PendingApprovalProps> = ({ user }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [isChecking, setIsChecking] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Handle potential nested user object from API response
  const actualUser = (user as any)?.user || user;

  const handleRefreshStatus = async () => {
    if (isChecking) return; // Prevent multiple simultaneous requests
    
    setIsChecking(true);
    try {
      // Show user feedback
      showToast.loading('Checking your account status...');
      
      // Call the API to get fresh user data
      const result = await dispatch(getProfileThunk()).unwrap();
      
      // Dismiss loading toast
      showToast.dismiss();
      
      // Provide feedback based on the result
      if (result.approval === 'approved') {
        showToast.success('🎉 Great! Your account has been approved!');
        // The Dashboard component will automatically redirect when the user state updates
      } else if (result.approval === 'pending') {
        showToast.loading('⏳ Your account is still under review. Please check back later.');
      } else if (result.approval === 'rejected') {
        showToast.error('❌ Your account application has been rejected. Please contact support.');
      } else {
        showToast.success('✅ Account status updated successfully.');
      }
      
    } catch (error) {
      console.error('❌ Failed to refresh status:', error);
      showToast.dismiss();
      showToast.error('Failed to check account status. Please try again.');
    } finally {
      setIsChecking(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await dispatch(logoutThunk()).unwrap();
      showToast.success('✅ Logged out successfully');
    } catch (error) {
      console.error('❌ Failed to logout:', error);
      showToast.error('Failed to logout. Please try again.');
    } finally {
      setIsLoggingOut(false);
    }
  };
  const getStatusIcon = () => {
    switch (actualUser?.approval) {
      case 'pending':
        return <Clock className="h-16 w-16 text-accent-400" />;
      case 'approved':
        return <CheckCircle className="h-16 w-16 text-green-400" />;
      case 'rejected':
        return <XCircle className="h-16 w-16 text-red-400" />;
      default:
        return <User className="h-16 w-16 text-white/70" />;
    }
  };

  const getStatusMessage = () => {
    switch (actualUser?.approval) {
      case 'pending':
        return {
          title: 'Account Under Review',
          message: 'Your account is currently being reviewed by our admin team. You will be notified once the review is complete.',
        };
      case 'approved':
        return {
          title: 'Account Approved!',
          message: 'Your account has been approved. Please refresh the page to access your dashboard.',
        };
      case 'rejected':
        return {
          title: 'Account Application Rejected',
          message: 'Unfortunately, your account application has been rejected. Please contact support for more information.',
        };
      default:
        return {
          title: 'Account Status Unknown',
          message: 'Please contact support for assistance.',
        };
    }
  };

  const statusInfo = getStatusMessage();

  return (
    <div className="min-h-screen bg-primary-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Main Card */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg p-8">
          <div className="text-center">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              {getStatusIcon()}
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-white mb-4">
              {statusInfo.title}
            </h1>

            {/* User Info */}
            <div className="mb-6">
              <p className="text-white/80 text-sm mb-2">Welcome back,</p>
              <p className="text-lg font-semibold text-white">
                {actualUser?.firstName || 'Unknown'} {actualUser?.lastName || 'User'}
              </p>
              <p className="text-sm text-white/70">{actualUser?.email || 'No email'}</p>
              <div className="flex items-center justify-center mt-2">
                <div className="flex items-center space-x-1">
                  {actualUser?.role === 'admin' ? (
                    <Shield className="h-4 w-4 text-white/80" />
                  ) : (
                    <User className="h-4 w-4 text-white/70" />
                  )}
                  <span className="text-sm font-medium text-white/80 capitalize">
                    {actualUser?.role || 'unknown'}
                  </span>
                </div>
              </div>
            </div>

            {/* Message */}
            <p className="text-white/90 text-center mb-6 leading-relaxed">
              {statusInfo.message}
            </p>

            {/* Status Badge */}
            <div className="flex justify-center mb-6">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                  ${actualUser?.approval === 'pending' ? 'bg-accent-100 text-accent-800' : ''}
                  ${actualUser?.approval === 'approved' ? 'bg-green-100 text-green-800' : ''}
                  ${actualUser?.approval === 'rejected' ? 'bg-red-100 text-red-800' : ''}
                `}
              >
                Status: {actualUser?.approval || 'unknown'}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {actualUser?.approval === 'approved' && (
                <button
                  onClick={handleRefreshStatus}
                  disabled={isChecking}
                  className="w-full text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 disabled:opacity-50"
                >
                  {isChecking ? (
                    <>
                      <Loader size="small" color="white" />
                      <span>Checking Account Status...</span>
                    </>
                  ) : (
                    <span>Check Status</span>
                  )}
                </button>
              )}
              
              {actualUser?.approval === 'pending' && (
                <button
                  onClick={handleRefreshStatus}
                  disabled={isChecking}
                  className="w-full text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 bg-accent-600 hover:bg-accent-700 disabled:opacity-50"
                >
                  {isChecking ? (
                    <>
                      <Loader size="small" color="white" />
                      <span>Checking Account Status...</span>
                    </>
                  ) : (
                    <span>Check Status</span>
                  )}
                </button>
              )}
              
              {actualUser?.approval === 'rejected' && (
                <a
                  href="mailto:support@example.com"
                  className="w-full text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 inline-block text-center bg-primary-600 hover:bg-primary-700"
                >
                  Contact Support
                </a>
              )}
              
              {/* Logout Button - Always available */}
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full text-white/80 font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 bg-white/10 hover:bg-white/20 border border-white/20 disabled:opacity-50"
              >
                {isLoggingOut ? (
                  <>
                    <Loader size="small" color="white" />
                    <span>Logging out...</span>
                  </>
                ) : (
                  <>
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-white/60">
            Need help? Contact us at{' '}
            <a
              href="mailto:support@example.com"
              className="text-white/80 hover:text-white font-medium"
            >
              support@example.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PendingApproval;

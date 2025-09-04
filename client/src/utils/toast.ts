import toast from 'react-hot-toast';

// Simple toast wrapper with consistent styling
const toastConfig = {
  duration: 4000,
  position: 'top-right' as const,
  style: {
    background: '#363636',
    color: '#fff',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    padding: '12px 16px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  },
};

export const showToast = {
  success: (message: string) => toast.success(message, toastConfig),
  error: (message: string) => toast.error(message, toastConfig),
  loading: (message: string) => toast.loading(message, toastConfig),
  dismiss: () => toast.dismiss(),
};

export default showToast;

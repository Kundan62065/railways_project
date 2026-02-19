import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import authService from '../services/authService';

const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      role: null, // 'SUPERADMIN', 'ADMIN', 'USER'
      isLoading: false,
      error: null,

      // Actions
      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const { user, accessToken, refreshToken } = await authService.login(credentials);
          
          // Store tokens in localStorage
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
          localStorage.setItem('railway_token', accessToken);
          
          set({
            user,
            token: accessToken,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            role: user.role,
            isLoading: false,
            error: null,
          });
          
          return { success: true };
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Login failed';
          set({ 
            isLoading: false, 
            error: errorMessage,
            isAuthenticated: false,
          });
          return { success: false, error: errorMessage };
        }
      },

      logout: async () => {
        try {
          await authService.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          // Clear tokens from localStorage
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('railway_token');
          
          set({
            user: null,
            token: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            role: null,
            error: null,
          });
        }
      },

      // Get current user
      fetchCurrentUser: async () => {
        set({ isLoading: true });
        try {
          const user = await authService.getCurrentUser();
          set({
            user,
            isAuthenticated: true,
            role: user.role,
            isLoading: false,
          });
          return user;
        } catch (error) {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
          throw error;
        }
      },

      updateUser: (userData) => {
        set((state) => ({
          user: { ...state.user, ...userData },
        }));
      },

      // Clear error
      clearError: () => {
        set({ error: null });
      },

      // Check if user has permission
      hasPermission: (requiredRole) => {
        const { role } = get();
        const roleHierarchy = {
          SUPERADMIN: 3,
          ADMIN: 2,
          USER: 1,
        };
        
        return roleHierarchy[role] >= roleHierarchy[requiredRole];
      },

      // Check if user can edit/create
      canEdit: () => {
        const { role } = get();
        return role === 'SUPERADMIN' || role === 'ADMIN';
      },

      // Check if user can only view
      isViewOnly: () => {
        const { role } = get();
        return role === 'USER';
      },
    }),
    {
      name: 'railway-auth-storage', // localStorage key
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        role: state.role,
      }),
    }
  )
);

export default useAuthStore;

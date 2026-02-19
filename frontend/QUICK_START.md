# Quick Start Guide - Phase 1

## Prerequisites
- Node.js v18+ installed
- Backend running at `http://localhost:8080`
- npm or yarn package manager

## Installation

```bash
# Already completed - dependencies installed
npm install
```

## Running the Application

### Development Mode
```bash
npm run dev
```
The application will start at `http://localhost:5173`

### Production Build
```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Default Credentials

### Admin User
- **Email:** admin@railway.com
- **Password:** admin123

### Regular User
- **Email:** user@railway.com
- **Password:** user123

*(Update these based on your backend users)*

## Available Pages

### Public Routes
- `/` - Home/Landing page (redirects to login if not authenticated)
- `/login` - Login page
- `/signup` - Registration page

### Protected Routes (Requires Authentication)
- `/dashboard` - Home dashboard with stats and activities
- `/dashboard/create-shift` - Create new shift (admin only)
- `/dashboard/active-shifts` - View and manage active shifts
- `/dashboard/completed-shifts` - View completed shifts with Excel export
- `/dashboard/shifts/:id` - View shift details
- `/dashboard/shifts/:id/edit` - Edit shift details (admin only)
- `/dashboard/user-management` - Manage users (admin only)

## Key Features

### Dashboard
- View primary statistics (active shifts, completed today, total shifts)
- Alert breakdown (7HR-14HR counts)
- Recent activity feed
- Auto-refreshes every 5 minutes

### Active Shifts
- View all in-progress shifts
- Color-coded duty hours (green < 10h, yellow 10-12h, orange 12-14h, red > 14h)
- Plan relief for shifts
- Release/complete shifts
- Real-time duty hour calculations

### Completed Shifts
- Filter by train number, section, date range
- Pagination (10 per page)
- Summary statistics
- **Excel Export** (52 columns) - Click "Export to Excel" button

### Shift Management
- Create new shifts with all required details
- Edit existing shifts
- View detailed shift information
- Manual shift completion with sign-off details

## Troubleshooting

### Backend Not Running
If you see "Network Error" or API errors:
1. Ensure backend is running at `http://localhost:8080`
2. Check backend console for errors
3. Verify CORS is enabled on backend

### Authentication Issues
If login fails:
1. Check backend authentication endpoint
2. Verify user credentials exist in database
3. Check browser console for error messages
4. Clear localStorage and try again

### Excel Export Not Working
If Excel export fails:
1. Ensure you have completed shifts data
2. Check browser console for errors
3. Verify shift data has all required fields

### Pages Not Loading
If pages show blank or errors:
1. Check browser console for JavaScript errors
2. Ensure all dependencies are installed (`npm install`)
3. Clear browser cache and reload
4. Check Network tab for failed API requests

## Development Tips

### API Configuration
API base URL is set in `src/services/api.js`:
```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';
```

You can override this with environment variables:
```bash
# Create .env file
VITE_API_URL=http://your-backend-url/api/v1
```

### State Management
- **Authentication:** Persisted in localStorage via Zustand
- **Toast Notifications:** In-memory via Zustand
- **Shift Data:** Fetched from API on demand (no global state)

### Code Organization
- **Services:** API calls (`src/services/`)
- **Components:** Reusable UI components (`src/components/`)
- **Pages:** Route-based pages (`src/pages/`)
- **Stores:** Zustand state management (`src/stores/`)

## Testing Workflow

1. **Start Backend**
   ```bash
   cd backend-folder
   npm run dev
   ```

2. **Start Frontend**
   ```bash
   npm run dev
   ```

3. **Login**
   - Navigate to `http://localhost:5173`
   - Login with admin credentials

4. **Test Dashboard**
   - Verify stats are loading
   - Check recent activities
   - Ensure auto-refresh works

5. **Test Shifts**
   - Create a new shift
   - View active shifts
   - Complete a shift
   - View completed shifts
   - Export to Excel

## Common Issues & Solutions

### Issue: "Failed to fetch"
**Solution:** Backend is not running or wrong URL
- Check `http://localhost:8080/api/v1/health` in browser
- Verify API_BASE_URL in `api.js`

### Issue: "Unauthorized" / Token expired
**Solution:** Re-login to get fresh token
- Click logout
- Login again
- Token expires after X hours (check backend config)

### Issue: Excel export missing columns
**Solution:** Backend data incomplete
- Verify shift has all fields populated
- Check `CompletedShiftsPage.jsx` line 150+ for export logic
- Update export logic if backend fields differ

### Issue: Dashboard shows no data
**Solution:** Dashboard APIs not implemented
- Check backend has `/dashboard/stats` endpoint
- Verify `/dashboard/recent-activities` endpoint
- See `PHASE_1_COMPLETION.md` for required endpoints

## Performance Optimization

### Current Optimizations
- ✅ Lazy loading for routes
- ✅ Debounced search/filters
- ✅ Pagination for large datasets
- ✅ Auto-refresh intervals (5 minutes)
- ✅ Error boundaries for crash prevention

### Future Optimizations (Phase 2)
- React Query for caching
- Virtual scrolling for large lists
- Service workers for offline support
- WebSocket for real-time updates

## Security Features

- ✅ JWT token authentication
- ✅ Protected routes
- ✅ Role-based access control (admin/user)
- ✅ Token persistence in localStorage
- ✅ Automatic token refresh on API calls
- ✅ Logout on 401/403 responses

## Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## Need Help?

1. Check browser console for errors
2. Review `PHASE_1_COMPLETION.md` for detailed changes
3. Check backend logs for API errors
4. Verify all endpoints in Postman/Thunder Client

---

**Happy Development! 🚀**

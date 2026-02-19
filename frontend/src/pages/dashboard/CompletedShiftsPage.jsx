import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import EmptyState from '../../components/EmptyState';
import { 
  FaCheckCircle, 
  FaTrain, 
  FaUser, 
  FaClock, 
  FaCalendarAlt, 
  FaFilter,
  FaChevronLeft,
  FaChevronRight,
  FaEye,
  FaDownload
} from 'react-icons/fa';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import shiftService from '../../services/shiftService';
import useToastStore from '../../stores/useToastStore';
import * as XLSX from 'xlsx';

dayjs.extend(duration);

const CompletedShiftsPage = () => {
  const navigate = useNavigate();
  const { error: showError } = useToastStore();
  
  const [shifts, setShifts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  
  // Filters
  const [filters, setFilters] = useState({
    trainNumber: '',
    section: '',
    dateFrom: dayjs().subtract(30, 'days').format('YYYY-MM-DD'),
    dateTo: dayjs().format('YYYY-MM-DD'),
  });

  // Fetch completed shifts
  const fetchCompletedShifts = async (page = 1) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const params = {
        status: 'COMPLETED',
        page,
        limit: pagination.limit,
        sortBy: 'signOffTime',
        sortOrder: 'desc',
      };
      
      // Add filters if set
      if (filters.trainNumber) params.trainNumber = filters.trainNumber;
      if (filters.section) params.section = filters.section;
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;
      
      console.log('📥 Fetching completed shifts with params:', params);
      
      const response = await shiftService.getAllShifts(params);
      
      console.log('✅ Completed shifts response:', response);
      
      if (response.success) {
        // Map backend DateTime fields to frontend field names
        const mappedShifts = (response.data || []).map(shift => ({
          ...shift,
          signOnTime: shift.signOnDateTime,
          departureTime: shift.departureDateTime,
          trainArrivalTime: shift.trainArrivalDateTime,
          signOffTime: shift.signOffDateTime, // Map signOffDateTime to signOffTime for display
        }));
        setShifts(mappedShifts);
        setPagination(response.pagination || {
          page: 1,
          limit: 10,
          total: response.data?.length || 0,
          pages: 1,
        });
      }
    } catch (err) {
      console.error('❌ Failed to fetch completed shifts:', err);
      setError(err.response?.data?.message || 'Failed to load completed shifts');
      showError('Failed to load completed shifts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCompletedShifts(1);
  }, []);

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  const handleApplyFilters = () => {
    fetchCompletedShifts(1);
  };

  const handleResetFilters = () => {
    setFilters({
      trainNumber: '',
      section: '',
      dateFrom: dayjs().subtract(30, 'days').format('YYYY-MM-DD'),
      dateTo: dayjs().format('YYYY-MM-DD'),
    });
    setTimeout(() => fetchCompletedShifts(1), 100);
  };

  const handlePageChange = (newPage) => {
    fetchCompletedShifts(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewDetails = (shiftId) => {
    navigate(`/dashboard/shifts/${shiftId}`);
  };

  const handleExportExcel = () => {
    if (shifts.length === 0) {
      showError('No data to export');
      return;
    }

    const workbook = XLSX.utils.book_new();
    
    // Prepare comprehensive data with all shift information
    const worksheetData = [
      ['Indian Railways - Completed Shifts Report'],
      [],
      ['Generated On:', dayjs().format('DD MMM YYYY HH:mm:ss')],
      ['Date Range:', `${dayjs(filters.dateFrom).format('DD MMM YYYY')} to ${dayjs(filters.dateTo).format('DD MMM YYYY')}`],
      ['Total Shifts:', shifts.length],
      [],
      [
        'Shift ID',
        'Status',
        'Train Number',
        'Train Name',
        'Locomotive Number',
        'Duty Type',
        'Section',
        'Sign On Station',
        'Sign On Date & Time',
        'Train Arrival Date & Time',
        'Time of TO (Take Over)',
        'Departure Date & Time',
        'Sign Off Station',
        'Sign Off Date & Time',
        'Duty Hours',
        'Relief Planned',
        'Relief Required',
        'Relief Time',
        'Relief Reason',
        'Loco Pilot Name',
        'Loco Pilot Employee ID',
        'Loco Pilot Phone',
        'Train Manager Name',
        'Train Manager Employee ID',
        'Train Manager Phone',
        'Locomotive Status',
        'Alert 7HR Sent',
        'Alert 7HR Sent At',
        'Alert 8HR Sent',
        'Alert 8HR Response',
        'Alert 8HR Sent At',
        'Alert 9HR Sent',
        'Alert 9HR Response',
        'Alert 9HR Sent At',
        'Alert 10HR Sent',
        'Alert 10HR Response',
        'Alert 10HR Sent At',
        'Alert 11HR Sent',
        'Alert 11HR Response',
        'Alert 11HR Sent At',
        'Alert 14HR Sent',
        'Alert 14HR Response',
        'Alert 14HR Sent At',
        'Created At',
        'Created By',
        'Updated At',
      ]
    ];
    
    shifts.forEach(shift => {
      worksheetData.push([
        shift.id || 'N/A',
        shift.status || 'N/A',
        shift.trainNumber || 'N/A',
        shift.trainName || 'N/A',
        shift.locomotive?.locomotiveNo || 'N/A',
        shift.dutyType || 'N/A',
        shift.section || 'N/A',
        shift.signOnStation || 'N/A',
        shift.signOnTime ? dayjs(shift.signOnTime).format('DD/MM/YYYY HH:mm:ss') : 'N/A',
        shift.trainArrivalTime ? dayjs(shift.trainArrivalTime).format('DD/MM/YYYY HH:mm:ss') : 'N/A',
        shift.timeOfTO ? dayjs(shift.timeOfTO).format('DD/MM/YYYY HH:mm:ss') : 'N/A',
        shift.departureTime ? dayjs(shift.departureTime).format('DD/MM/YYYY HH:mm:ss') : 'N/A',
        shift.signOffStation || 'N/A',
        shift.signOffTime ? dayjs(shift.signOffTime).format('DD/MM/YYYY HH:mm:ss') : 'N/A',
        shift.dutyHours ? shift.dutyHours.toFixed(2) + ' hours' : 'N/A',
        shift.reliefPlanned ? 'Yes' : 'No',
        shift.reliefRequired ? 'Yes' : 'No',
        shift.reliefTime ? dayjs(shift.reliefTime).format('DD/MM/YYYY HH:mm:ss') : 'N/A',
        shift.reliefReason || 'N/A',
        shift.locoPilot?.name || 'N/A',
        shift.locoPilot?.employeeId || 'N/A',
        shift.locoPilot?.phone || 'N/A',
        shift.trainManager?.name || 'N/A',
        shift.trainManager?.employeeId || 'N/A',
        shift.trainManager?.phone || 'N/A',
        shift.locomotive?.status || 'N/A',
        shift.alert7HrSent ? 'Yes' : 'No',
        shift.alert7HrSentAt ? dayjs(shift.alert7HrSentAt).format('DD/MM/YYYY HH:mm:ss') : 'N/A',
        shift.alert8HrSent ? 'Yes' : 'No',
        shift.alert8HrResponse || 'N/A',
        shift.alert8HrSentAt ? dayjs(shift.alert8HrSentAt).format('DD/MM/YYYY HH:mm:ss') : 'N/A',
        shift.alert9HrSent ? 'Yes' : 'No',
        shift.alert9HrResponse || 'N/A',
        shift.alert9HrSentAt ? dayjs(shift.alert9HrSentAt).format('DD/MM/YYYY HH:mm:ss') : 'N/A',
        shift.alert10HrSent ? 'Yes' : 'No',
        shift.alert10HrResponse || 'N/A',
        shift.alert10HrSentAt ? dayjs(shift.alert10HrSentAt).format('DD/MM/YYYY HH:mm:ss') : 'N/A',
        shift.alert11HrSent ? 'Yes' : 'No',
        shift.alert11HrResponse || 'N/A',
        shift.alert11HrSentAt ? dayjs(shift.alert11HrSentAt).format('DD/MM/YYYY HH:mm:ss') : 'N/A',
        shift.alert14HrSent ? 'Yes' : 'No',
        shift.alert14HrResponse || 'N/A',
        shift.alert14HrSentAt ? dayjs(shift.alert14HrSentAt).format('DD/MM/YYYY HH:mm:ss') : 'N/A',
        shift.createdAt ? dayjs(shift.createdAt).format('DD/MM/YYYY HH:mm:ss') : 'N/A',
        shift.createdBy?.name || 'N/A',
        shift.updatedAt ? dayjs(shift.updatedAt).format('DD/MM/YYYY HH:mm:ss') : 'N/A',
      ]);
    });
    
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // Set column widths (44 columns total)
    worksheet['!cols'] = [
      { wch: 38 }, // Shift ID
      { wch: 12 }, // Status
      { wch: 12 }, // Train Number
      { wch: 25 }, // Train Name
      { wch: 18 }, // Locomotive Number
      { wch: 12 }, // Duty Type
      { wch: 20 }, // Section
      { wch: 18 }, // Sign On Station
      { wch: 20 }, // Sign On Date & Time
      { wch: 20 }, // Train Arrival Date & Time
      { wch: 20 }, // Time of TO
      { wch: 20 }, // Departure Date & Time
      { wch: 18 }, // Sign Off Station
      { wch: 20 }, // Sign Off Date & Time
      { wch: 12 }, // Duty Hours
      { wch: 12 }, // Relief Planned
      { wch: 12 }, // Relief Required
      { wch: 20 }, // Relief Time
      { wch: 25 }, // Relief Reason
      { wch: 20 }, // Loco Pilot Name
      { wch: 18 }, // Loco Pilot Employee ID
      { wch: 15 }, // Loco Pilot Phone
      { wch: 20 }, // Train Manager Name
      { wch: 18 }, // Train Manager Employee ID
      { wch: 15 }, // Train Manager Phone
      { wch: 15 }, // Locomotive Status
      { wch: 12 }, // Alert 7HR Sent
      { wch: 20 }, // Alert 7HR Sent At
      { wch: 12 }, // Alert 8HR Sent
      { wch: 18 }, // Alert 8HR Response
      { wch: 20 }, // Alert 8HR Sent At
      { wch: 12 }, // Alert 9HR Sent
      { wch: 18 }, // Alert 9HR Response
      { wch: 20 }, // Alert 9HR Sent At
      { wch: 12 }, // Alert 10HR Sent
      { wch: 18 }, // Alert 10HR Response
      { wch: 20 }, // Alert 10HR Sent At
      { wch: 12 }, // Alert 11HR Sent
      { wch: 18 }, // Alert 11HR Response
      { wch: 20 }, // Alert 11HR Sent At
      { wch: 12 }, // Alert 14HR Sent
      { wch: 18 }, // Alert 14HR Response
      { wch: 20 }, // Alert 14HR Sent At
      { wch: 20 }, // Created At
      { wch: 20 }, // Created By
      { wch: 20 }, // Updated At
    ];
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Completed Shifts');
    
    const filename = `Completed_Shifts_Detailed_${dayjs().format('YYYY-MM-DD_HHmmss')}.xlsx`;
    XLSX.writeFile(workbook, filename);
    
    showError(`Detailed report with all shift information exported as ${filename}`);
  };

  const getDutyHoursColor = (hours) => {
    if (!hours) return 'text-gray-600';
    if (hours >= 14) return 'text-red-700 font-bold';
    if (hours >= 12) return 'text-orange-600 font-bold';
    if (hours >= 10) return 'text-yellow-600 font-semibold';
    return 'text-green-600 font-semibold';
  };

  const formatDutyHours = (hours) => {
    if (!hours) return 'N/A';
    const duration = dayjs.duration(hours, 'hours');
    const h = Math.floor(duration.asHours());
    const m = duration.minutes();
    return `${h}h ${m}m`;
  };

  if (isLoading && shifts.length === 0) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <h2 className="text-3xl font-bold text-[#003d82] flex items-center gap-3">
              <FaCheckCircle className="text-green-600" />
              Completed Shifts
            </h2>
            <p className="text-gray-600 mt-2">
              View all completed shifts with duty hours and sign-off details
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 bg-white border-2 border-[#003d82] text-[#003d82] rounded-md hover:bg-[#003d82] hover:text-white transition-colors flex items-center gap-2"
            >
              <FaFilter />
              {showFilters ? 'Hide' : 'Show'} Filters
            </button>
            <button
              onClick={handleExportExcel}
              disabled={shifts.length === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaDownload />
              Export Excel
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-[#003d82] mb-4 flex items-center gap-2">
              <FaFilter />
              Filters
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Train Number
                </label>
                <input
                  type="text"
                  name="trainNumber"
                  value={filters.trainNumber}
                  onChange={handleFilterChange}
                  placeholder="e.g., 12345"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#003d82] focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Section
                </label>
                <input
                  type="text"
                  name="section"
                  value={filters.section}
                  onChange={handleFilterChange}
                  placeholder="e.g., HTE-HWH"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#003d82] focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  From Date
                </label>
                <input
                  type="date"
                  name="dateFrom"
                  value={filters.dateFrom}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#003d82] focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  To Date
                </label>
                <input
                  type="date"
                  name="dateTo"
                  value={filters.dateTo}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#003d82] focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="mt-4 flex gap-3">
              <button
                onClick={handleApplyFilters}
                className="px-6 py-2 bg-[#003d82] text-white rounded-md hover:bg-[#002b5c] transition-colors font-semibold"
              >
                Apply Filters
              </button>
              <button
                onClick={handleResetFilters}
                className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition-colors font-semibold"
              >
                Reset
              </button>
            </div>
          </div>
        )}

        {/* Summary Stats */}
        {!isLoading && shifts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-md p-4">
              <p className="text-sm text-gray-600 mb-1">Total Completed</p>
              <p className="text-2xl font-bold text-[#003d82]">{pagination.total || shifts.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <p className="text-sm text-gray-600 mb-1">Average Duty Hours</p>
              <p className="text-2xl font-bold text-blue-600">
                {shifts.length > 0 
                  ? (shifts.reduce((sum, s) => sum + (s.dutyHours || 0), 0) / shifts.length).toFixed(1) + 'h'
                  : 'N/A'}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <p className="text-sm text-gray-600 mb-1">Over 12 Hours</p>
              <p className="text-2xl font-bold text-orange-600">
                {shifts.filter(s => s.dutyHours >= 12).length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <p className="text-sm text-gray-600 mb-1">Over 14 Hours</p>
              <p className="text-2xl font-bold text-red-600">
                {shifts.filter(s => s.dutyHours >= 14).length}
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <ErrorMessage message={error} onRetry={() => fetchCompletedShifts(pagination.page)} />
        )}

        {/* Empty State */}
        {!isLoading && !error && shifts.length === 0 && (
          <EmptyState
            icon={FaCheckCircle}
            title="No Completed Shifts"
            message="No completed shifts found matching your filters. Try adjusting the date range or filters."
          />
        )}

        {/* Shifts List */}
        {!isLoading && !error && shifts.length > 0 && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Train Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Crew
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Section
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sign On
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sign Off
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duty Hours
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {shifts.map((shift) => (
                    <tr key={shift.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <FaTrain className="text-[#003d82] mt-1 shrink-0" />
                          <div>
                            <div className="text-sm font-bold text-gray-900">
                              #{shift.trainNumber}
                            </div>
                            <div className="text-sm text-gray-600">{shift.trainName}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {shift.locomotive?.locomotiveNo || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <FaUser className="text-blue-600 text-xs" />
                            <div className="text-sm">
                              <div className="font-medium text-gray-900">
                                {shift.locoPilot?.name || 'N/A'}
                              </div>
                              <div className="text-xs text-gray-500">
                                {shift.locoPilot?.employeeId || ''}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <FaUser className="text-purple-600 text-xs" />
                            <div className="text-sm">
                              <div className="font-medium text-gray-900">
                                {shift.trainManager?.name || 'N/A'}
                              </div>
                              <div className="text-xs text-gray-500">
                                {shift.trainManager?.employeeId || ''}
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {shift.section || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-2">
                          <FaClock className="text-green-600 text-xs mt-1" />
                          <div>
                            <div className="text-sm text-gray-900">
                              {dayjs(shift.signOnTime).format('DD MMM YYYY')}
                            </div>
                            <div className="text-xs text-gray-500">
                              {dayjs(shift.signOnTime).format('HH:mm')}
                            </div>
                            <div className="text-xs text-gray-500">
                              {shift.signOnStation}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-2">
                          <FaClock className="text-red-600 text-xs mt-1" />
                          <div>
                            <div className="text-sm text-gray-900">
                              {shift.signOffTime 
                                ? dayjs(shift.signOffTime).format('DD MMM YYYY')
                                : 'N/A'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {shift.signOffTime 
                                ? dayjs(shift.signOffTime).format('HH:mm')
                                : ''}
                            </div>
                            <div className="text-xs text-gray-500">
                              {shift.signOffStation || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`text-lg font-bold ${getDutyHoursColor(shift.dutyHours)}`}>
                          {formatDutyHours(shift.dutyHours)}
                        </div>
                        {shift.reliefPlanned && (
                          <span className="inline-flex mt-1 px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Relief Planned
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleViewDetails(shift.id)}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-[#003d82] text-white rounded-md hover:bg-[#002b5c] transition-colors text-sm font-medium"
                        >
                          <FaEye />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} shifts
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <FaChevronLeft className="text-xs" />
                    Previous
                  </button>
                  
                  {[...Array(pagination.pages)].map((_, idx) => {
                    const page = idx + 1;
                    // Show first page, last page, current page, and pages around current
                    if (
                      page === 1 ||
                      page === pagination.pages ||
                      (page >= pagination.page - 1 && page <= pagination.page + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-1 rounded text-sm ${
                            page === pagination.page
                              ? 'bg-[#003d82] text-white'
                              : 'border border-gray-300 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (
                      page === pagination.page - 2 ||
                      page === pagination.page + 2
                    ) {
                      return <span key={page} className="px-2 py-1 text-gray-500">...</span>;
                    }
                    return null;
                  })}
                  
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                    className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    Next
                    <FaChevronRight className="text-xs" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Loading Overlay */}
        {isLoading && shifts.length > 0 && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <LoadingSpinner />
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CompletedShiftsPage;

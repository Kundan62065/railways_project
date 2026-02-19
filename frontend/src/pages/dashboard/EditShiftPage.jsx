import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { FaTrain, FaSave, FaTimes, FaArrowLeft } from 'react-icons/fa';
import dayjs from 'dayjs';
import shiftService from '../../services/shiftService';
import useAuthStore from '../../stores/useAuthStore';
import useToastStore from '../../stores/useToastStore';

const EditShiftPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    trainNumber: '',
    trainName: '',
    locomotiveNo: '',
    dutyType: '',
    section: '',
    signOnStation: '',
    signOnTime: '',
    trainArrivalDate: '',
    departureTime: '',
    trainArrivalTime: '',
    timeOfTO: '',
    reliefPlanned: false,
    reliefTime: '',
    lobbySignOn: false,
  });

  const { user } = useAuthStore();
  const { success, error: showError } = useToastStore();

  // Fetch shift details
  useEffect(() => {
    const fetchShift = async () => {
      try {
        setIsLoading(true);
        const response = await shiftService.getShiftById(id);
        
        console.log(' Full Response from getShiftById:', response);
        console.log(' Response Data:', response.data);
        console.log(' Response Success:', response.success);
        
        if (response.success && response.data) {
          const shift = response.data;
          console.log(' Shift Object:', shift);
          // Map backend DateTime fields to frontend field names
          setFormData({
            trainNumber: shift.trainNumber || '',
            trainName: shift.trainName || '',
            locomotiveNo: shift.locomotiveNo || '',
            dutyType: shift.dutyType || '',
            section: shift.section || '',
            signOnStation: shift.signOnStation || '',
            signOnTime: shift.signOnDateTime ? dayjs(shift.signOnDateTime).format('YYYY-MM-DDTHH:mm') : '',
            trainArrivalDate: shift.trainArrivalDate ? dayjs(shift.trainArrivalDate).format('YYYY-MM-DD') : '',
            departureTime: shift.departureDateTime ? dayjs(shift.departureDateTime).format('YYYY-MM-DDTHH:mm') : '',
            trainArrivalTime: shift.trainArrivalDateTime ? dayjs(shift.trainArrivalDateTime).format('YYYY-MM-DDTHH:mm') : '',
            timeOfTO: shift.timeOfTO ? dayjs(shift.timeOfTO).format('YYYY-MM-DDTHH:mm') : '',
            reliefPlanned: shift.reliefPlanned || false,
            reliefTime: shift.reliefTime ? dayjs(shift.reliefTime).format('YYYY-MM-DDTHH:mm') : '',
            lobbySignOn: shift.lobbySignOn || false,
          });
        }
      } catch (err) {
        console.error('Failed to fetch shift:', err);
        showError('Failed to load shift details');
        navigate('/dashboard/active-shifts');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchShift();
    }
  }, [id, navigate, showError]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIsSaving(true);
      
      // Convert dates to ISO format - use new backend field names
      const updateData = {
        trainNumber: formData.trainNumber,
        trainName: formData.trainName,
        dutyType: formData.dutyType,
        section: formData.section,
        signOnStation: formData.signOnStation,
        signOnDateTime: dayjs(formData.signOnTime).toISOString(), // Backend uses signOnDateTime
        trainArrivalDate: dayjs(formData.trainArrivalDate).toISOString(),
        departureDateTime: formData.departureTime ? dayjs(formData.departureTime).toISOString() : null, // Backend uses departureDateTime
        trainArrivalDateTime: formData.trainArrivalTime ? dayjs(formData.trainArrivalTime).toISOString() : null, // Backend uses trainArrivalDateTime
        timeOfTO: formData.timeOfTO ? dayjs(formData.timeOfTO).toISOString() : null,
        reliefPlanned: formData.reliefPlanned,
        reliefTime: formData.reliefTime ? dayjs(formData.reliefTime).toISOString() : null,
        lobbySignOn: formData.lobbySignOn,
      };

      console.log('Sending Update Data:', updateData);
      
      const response = await shiftService.updateShift(id, updateData);
      
      console.log('Update Response:', response);
      console.log('Update Success:', response.success);
      
      if (response.success) {
        success('Shift updated successfully');
        navigate(`/dashboard/shifts/${id}`);
      }
    } catch (err) {
      console.error(' Update Error:', err);
      console.error(' Error Response:', err.response);
      console.error(' Error Data:', err.response?.data);
      showError(err.response?.data?.message || 'Failed to update shift');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/dashboard/shifts/${id}`)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <FaArrowLeft className="text-xl text-[#003d82]" />
            </button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-[#003d82] flex items-center gap-3">
                <FaTrain /> Edit Shift
              </h1>
              <p className="text-gray-600 mt-1">Train #{formData.trainNumber}</p>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {/* Train Information */}
          <div>
            <h2 className="text-xl font-bold text-[#003d82] mb-4 border-b-2 border-[#003d82] pb-2">
              Train Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Train Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="trainNumber"
                  value={formData.trainNumber}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#003d82] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Train Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="trainName"
                  value={formData.trainName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#003d82] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Locomotive Number
                </label>
                <input
                  type="text"
                  name="locomotiveNo"
                  value={formData.locomotiveNo}
                  onChange={handleChange}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                  title="Locomotive cannot be changed"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Duty Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="dutyType"
                  value={formData.dutyType}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#003d82] focus:border-transparent"
                >
                  <option value="">Select Duty Type</option>
                  <option value="PASSENGER">Passenger</option>
                  <option value="FREIGHT">Freight</option>
                  <option value="MAIL_EXPRESS">Mail/Express</option>
                  <option value="SHUNTING">Shunting</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Section <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="section"
                  value={formData.section}
                  onChange={handleChange}
                  required
                  placeholder="e.g., DELHI-MUMBAI"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#003d82] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Sign-On Station <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="signOnStation"
                  value={formData.signOnStation}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#003d82] focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Time Information */}
          <div>
            <h2 className="text-xl font-bold text-[#003d82] mb-4 border-b-2 border-[#003d82] pb-2">
              Schedule & Timings
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Train Arrival Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="trainArrivalDate"
                  value={formData.trainArrivalDate}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#003d82] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Sign-On Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  name="signOnTime"
                  value={formData.signOnTime}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#003d82] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Departure Time
                </label>
                <input
                  type="datetime-local"
                  name="departureTime"
                  value={formData.departureTime}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#003d82] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Train Arrival Time
                </label>
                <input
                  type="datetime-local"
                  name="trainArrivalTime"
                  value={formData.trainArrivalTime}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#003d82] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Take Over Time (Time of TO)
                </label>
                <input
                  type="datetime-local"
                  name="timeOfTO"
                  value={formData.timeOfTO}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#003d82] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Relief Time
                </label>
                <input
                  type="datetime-local"
                  name="reliefTime"
                  value={formData.reliefTime}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#003d82] focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Relief Status & Sign On */}
          <div>
            <h2 className="text-xl font-bold text-[#003d82] mb-4 border-b-2 border-[#003d82] pb-2">
              Relief Status & Sign On Details
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-md">
                <input
                  type="checkbox"
                  id="reliefPlanned"
                  name="reliefPlanned"
                  checked={formData.reliefPlanned}
                  onChange={handleChange}
                  className="w-5 h-5 text-[#003d82] border-gray-300 rounded focus:ring-[#003d82]"
                />
                <label htmlFor="reliefPlanned" className="text-sm font-semibold text-gray-700 cursor-pointer">
                  Relief Planned
                </label>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-md">
                <input
                  type="checkbox"
                  id="lobbySignOn"
                  name="lobbySignOn"
                  checked={formData.lobbySignOn}
                  onChange={handleChange}
                  className="w-5 h-5 text-[#003d82] border-gray-300 rounded focus:ring-[#003d82]"
                />
                <label htmlFor="lobbySignOn" className="text-sm font-semibold text-gray-700 cursor-pointer">
                  Lobby Sign On
                </label>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate(`/dashboard/shifts/${id}`)}
              disabled={isSaving}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaTimes /> Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 px-6 py-3 bg-[#003d82] text-white rounded-md hover:bg-[#002b5c] transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <FaSave /> Save Changes
                </>
              )}
            </button>
          </div>

          {/* Info Note */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Changes to the shift schedule will be recorded in the shift history. 
              Locomotive and crew assignments cannot be changed through this form.
            </p>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default EditShiftPage;

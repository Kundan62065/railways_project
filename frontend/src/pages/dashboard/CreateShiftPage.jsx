import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { FaTrain, FaUser, FaClock, FaCalendarAlt, FaSave } from 'react-icons/fa';
import dayjs from 'dayjs';
import useAuthStore from '../../stores/useAuthStore';
import useToastStore from '../../stores/useToastStore';
import shiftService from '../../services/shiftService';

const CreateShiftPage = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { success, error: showError } = useToastStore();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    // Train Information
    trainNumber: '',
    trainName: '',
    locomotiveNo: '',
    dutyType: 'SP', 
    signOnStation: '',
    section: '',
    
    // Separate date and time fields for each event
    trainArrivalDate: dayjs().format('YYYY-MM-DD'),
    trainArrivalTime: '',
    
    signOnDate: dayjs().format('YYYY-MM-DD'),
    signOnTime: '',
    
    timeOfTODate: dayjs().format('YYYY-MM-DD'),
    timeOfTO: '',
    
    departureDate: dayjs().format('YYYY-MM-DD'),
    departureTime: '',
    
    lobbySignOn: false,
    
    // Loco Pilot Information
    locoPilotName: '',
    locoPilotId: '',
    locoPilotPhone: '',
    
    // Train Manager/Guard Information
    trainManagerName: '',
    trainManagerId: '',
    trainManagerPhone: '',
    
    // Additional Information
    remarks: '',
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Validate required time fields
      if (!formData.trainArrivalTime) {
        showError('Train arrival time is required!');
        setIsSubmitting(false);
        return;
      }
      
      if (!formData.signOnTime) {
        showError('Sign-on time is required!');
        setIsSubmitting(false);
        return;
      }
      
      // Validate sign-on time is after train arrival
      const trainArrival = dayjs(`${formData.trainArrivalDate} ${formData.trainArrivalTime}`, 'YYYY-MM-DD HH:mm');
      const signOn = dayjs(`${formData.signOnDate} ${formData.signOnTime}`, 'YYYY-MM-DD HH:mm');
      
      if (!trainArrival.isValid() || !signOn.isValid()) {
        showError('Invalid date or time format!');
        setIsSubmitting(false);
        return;
      }
      
      if (signOn.isBefore(trainArrival)) {
        showError('Sign-on time cannot be before train arrival time!');
        setIsSubmitting(false);
        return;
      }
      
      // Validate departure time if provided
      if (formData.departureTime && formData.departureDate) {
        const departure = dayjs(`${formData.departureDate} ${formData.departureTime}`, 'YYYY-MM-DD HH:mm');
        if (!departure.isValid()) {
          showError('Invalid departure date or time format!');
          setIsSubmitting(false);
          return;
        }
        if (departure.isBefore(signOn)) {
          showError('Departure time cannot be before sign-on time!');
          setIsSubmitting(false);
          return;
        }
      }
      
      // Validate timeOfTO if provided
      if (formData.timeOfTO && formData.timeOfTODate) {
        const timeOfTO = dayjs(`${formData.timeOfTODate} ${formData.timeOfTO}`, 'YYYY-MM-DD HH:mm');
        if (!timeOfTO.isValid()) {
          showError('Invalid Time of TO date or time format!');
          setIsSubmitting(false);
          return;
        }
      }
      
      // Prepare shift data matching backend validators
      const shiftData = {
        trainNumber: formData.trainNumber,
        trainName: formData.trainName || undefined, // Optional field
        locomotiveNo: formData.locomotiveNo,
        dutyType: formData.dutyType,
        signOnStation: formData.signOnStation,
        section: formData.section,
        
        // Combined date-time fields (ISO 8601) with separate dates
        trainArrivalDateTime: formData.trainArrivalTime 
          ? dayjs(`${formData.trainArrivalDate} ${formData.trainArrivalTime}`, 'YYYY-MM-DD HH:mm').toISOString()
          : undefined,
        signOnDateTime: formData.signOnTime
          ? dayjs(`${formData.signOnDate} ${formData.signOnTime}`, 'YYYY-MM-DD HH:mm').toISOString()
          : undefined,
        timeOfTO: (formData.timeOfTO && formData.timeOfTODate) 
          ? dayjs(`${formData.timeOfTODate} ${formData.timeOfTO}`, 'YYYY-MM-DD HH:mm').toISOString()
          : undefined,
        departureDateTime: (formData.departureTime && formData.departureDate) 
          ? dayjs(`${formData.departureDate} ${formData.departureTime}`, 'YYYY-MM-DD HH:mm').toISOString()
          : undefined,
        
        lobbySignOn: formData.lobbySignOn,
        
        locoPilot: {
          name: formData.locoPilotName,
          employeeId: formData.locoPilotId,
          phone: formData.locoPilotPhone || undefined,
        },
        trainManager: {
          name: formData.trainManagerName,
          employeeId: formData.trainManagerId,
          phone: formData.trainManagerPhone || undefined,
        },
      };
      
      // Log the data being sent for debugging
      console.log('Sending shift data:', JSON.stringify(shiftData, null, 2));
      
      // Call API to create shift
      const response = await shiftService.createShift(shiftData);
      
      console.log('Shift created:', response);
      
      // Show success message
      success(`Shift created for Train ${formData.trainNumber}! Tracking started.`);
      
      // Navigate after short delay
      setTimeout(() => {
        navigate('/dashboard/active-shifts');
      }, 500);
      
    } catch (err) {
      console.error('Error creating shift:', err);
      showError(err.response?.data?.message || 'Failed to create shift. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset the form?')) {
      setFormData({
        trainNumber: '',
        trainName: '',
        locomotiveNo: '',
        dutyType: 'SP',
        signOnStation: '',
        section: '',
        trainArrivalDate: dayjs().format('YYYY-MM-DD'),
        trainArrivalTime: '',
        signOnDate: dayjs().format('YYYY-MM-DD'),
        signOnTime: '',
        timeOfTODate: dayjs().format('YYYY-MM-DD'),
        timeOfTO: '',
        departureDate: dayjs().format('YYYY-MM-DD'),
        departureTime: '',
        lobbySignOn: false,
        locoPilotName: '',
        locoPilotId: '',
        locoPilotPhone: '',
        trainManagerName: '',
        trainManagerId: '',
        trainManagerPhone: '',
        remarks: '',
      });
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-[#003d82] flex items-center gap-3">
            <FaTrain />
            Create New Shift
          </h2>
          <p className="text-gray-600 mt-2">
            Enter shift details to start tracking duty hours for loco pilot and train manager
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Train Information Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-[#003d82] mb-4 flex items-center gap-2">
              <FaTrain className="text-lg" />
              Train Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Train Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="trainNumber"
                  value={formData.trainNumber}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#003d82] focus:border-transparent"
                  placeholder="e.g., 12345"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Train Name
                </label>
                <input
                  type="text"
                  name="trainName"
                  value={formData.trainName}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#003d82] focus:border-transparent"
                  placeholder="e.g., Rajdhani Express"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duty Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="dutyType"
                  value={formData.dutyType}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#003d82] focus:border-transparent"
                  required
                >
                  <option value="SP">SP</option>
                  <option value="WR">WR</option>
                  <option value="LR">LR</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sign On Station <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="signOnStation"
                  value={formData.signOnStation}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#003d82] focus:border-transparent"
                  placeholder="e.g., New Delhi"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Locomotive Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="locomotiveNo"
                  value={formData.locomotiveNo}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#003d82] focus:border-transparent"
                  placeholder="e.g., WAP-7 30356"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Train Arrival Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="trainArrivalDate"
                  value={formData.trainArrivalDate}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#003d82] focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Train Arrival Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  name="trainArrivalTime"
                  value={formData.trainArrivalTime}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#003d82] focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sign On Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="signOnDate"
                  value={formData.signOnDate}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#003d82] focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sign On Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  name="signOnTime"
                  value={formData.signOnTime}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#003d82] focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time of TO Date
                </label>
                <input
                  type="date"
                  name="timeOfTODate"
                  value={formData.timeOfTODate}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#003d82] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time of TO (Turn Out)
                </label>
                <input
                  type="time"
                  name="timeOfTO"
                  value={formData.timeOfTO}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#003d82] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Departure Date
                </label>
                <input
                  type="date"
                  name="departureDate"
                  value={formData.departureDate}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#003d82] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Departure Time
                </label>
                <input
                  type="time"
                  name="departureTime"
                  value={formData.departureTime}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#003d82] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lobby Sign On
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="lobbySignOn"
                    checked={formData.lobbySignOn}
                    onChange={(e) => setFormData({ ...formData, lobbySignOn: e.target.checked })}
                    className="h-4 w-4 text-[#003d82] focus:ring-[#003d82] border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">Lobby Sign On</span>
                </label>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Section <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="section"
                  value={formData.section}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#003d82] focus:border-transparent"
                  placeholder="e.g., New Delhi - Mumbai Central"
                  required
                />
              </div>
            </div>
          </div>

          {/* Loco Pilot Information Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-[#003d82] mb-4 flex items-center gap-2">
              <FaUser className="text-lg" />
              Loco Pilot Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loco Pilot Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="locoPilotName"
                  value={formData.locoPilotName}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#003d82] focus:border-transparent"
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loco Pilot ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="locoPilotId"
                  value={formData.locoPilotId}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#003d82] focus:border-transparent"
                  placeholder="Enter employee ID"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Number
                </label>
                <input
                  type="tel"
                  name="locoPilotPhone"
                  value={formData.locoPilotPhone}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#003d82] focus:border-transparent"
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>
          </div>

          {/* Train Manager/Guard Information Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-[#003d82] mb-4 flex items-center gap-2">
              <FaUser className="text-lg" />
              Train Manager / Guard Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Train Manager Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="trainManagerName"
                  value={formData.trainManagerName}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#003d82] focus:border-transparent"
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Train Manager ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="trainManagerId"
                  value={formData.trainManagerId}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#003d82] focus:border-transparent"
                  placeholder="Enter employee ID"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Number
                </label>
                <input
                  type="tel"
                  name="trainManagerPhone"
                  value={formData.trainManagerPhone}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#003d82] focus:border-transparent"
                  placeholder="+91 98765 43211"
                />
              </div>
            </div>
          </div>

          {/* Remarks Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-[#003d82] mb-4">
              Additional Information
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Remarks / Notes
              </label>
              <textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                rows="4"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#003d82] focus:border-transparent"
                placeholder="Add any additional notes or remarks about this shift..."
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-end bg-white rounded-lg shadow-md p-6">
            <button
              type="button"
              onClick={handleReset}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition-colors font-medium"
            >
              Reset Form
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-[#003d82] text-white rounded-md hover:bg-[#002b5c] transition-colors font-medium flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <FaSave />
              {isSubmitting ? 'Creating Shift...' : 'Create Shift & Start Tracking'}
            </button>
          </div>
        </form>

        {/* Information Box */}
        <div className="mt-6 bg-blue-50 border-l-4 border-[#003d82] p-4 rounded">
          <div className="flex items-start">
            <FaClock className="text-[#003d82] mt-1 mr-3" />
            <div>
              <h4 className="font-bold text-[#003d82]">Duty Hours Tracking</h4>
              <p className="text-sm text-gray-700 mt-1">
                Once the shift is created, the system will automatically track duty hours from Sign On Time to Release Time.
                Notifications will be sent at 8hr, 9hr, 11hr, 12hr, and 14hr intervals with options for relief planning.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CreateShiftPage;

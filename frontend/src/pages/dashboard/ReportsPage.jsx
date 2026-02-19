import { useState } from 'react';
import Layout from '../../components/Layout';
import { FaFileAlt, FaDownload, FaFilter, FaCalendarAlt, FaTrain, FaUser, FaClock, FaChartBar } from 'react-icons/fa';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

const ReportsPage = () => {
  const [filters, setFilters] = useState({
    reportType: 'duty-hours',
    dateFrom: dayjs().subtract(7, 'days').format('YYYY-MM-DD'),
    dateTo: dayjs().format('YYYY-MM-DD'),
    trainNumber: '',
    locoPilotId: '',
    division: '',
  });

  const [showFilters, setShowFilters] = useState(true);

  // TODO: Replace with real data from API
  const reportData = {
    summary: {
      totalShifts: 156,
      averageDutyHours: 9.5,
      shiftsOver12Hours: 12,
      shiftsOver14Hours: 3,
      reliefPlanned: 8,
      complianceRate: 92.3,
    },
    shifts: [
      {
        id: 1,
        date: '2025-11-22',
        trainNumber: '12345',
        locomotiveNumber: 'WAP-7 30356',
        locoPilot: 'Rajesh Kumar',
        locoPilotId: 'LP-2345',
        trainManager: 'Amit Singh',
        trainManagerId: 'TM-5678',
        signOnTime: '08:00',
        releaseTime: '18:30',
        dutyHours: 10.5,
        status: 'Completed',
        reliefPlanned: false,
      },
      {
        id: 2,
        date: '2025-11-22',
        trainNumber: '67890',
        locomotiveNumber: 'WAG-9 31245',
        locoPilot: 'Suresh Patel',
        locoPilotId: 'LP-3456',
        trainManager: 'Vikram Sharma',
        trainManagerId: 'TM-6789',
        signOnTime: '06:00',
        releaseTime: '19:15',
        dutyHours: 13.25,
        status: 'Completed',
        reliefPlanned: true,
      },
      {
        id: 3,
        date: '2025-11-21',
        trainNumber: '11223',
        locomotiveNumber: 'WAP-5 28934',
        locoPilot: 'Pradeep Reddy',
        locoPilotId: 'LP-4567',
        trainManager: 'Ravi Verma',
        trainManagerId: 'TM-7890',
        signOnTime: '02:00',
        releaseTime: '17:45',
        dutyHours: 15.75,
        status: 'Completed',
        reliefPlanned: true,
      },
      {
        id: 4,
        date: '2025-11-21',
        trainNumber: '44556',
        locomotiveNumber: 'WAP-7 32145',
        locoPilot: 'Manoj Gupta',
        locoPilotId: 'LP-5678',
        trainManager: 'Sanjay Kumar',
        trainManagerId: 'TM-8901',
        signOnTime: '10:30',
        releaseTime: '19:00',
        dutyHours: 8.5,
        status: 'Completed',
        reliefPlanned: false,
      },
      {
        id: 5,
        date: '2025-11-20',
        trainNumber: '77889',
        locomotiveNumber: 'WAG-9 29876',
        locoPilot: 'Anil Sharma',
        locoPilotId: 'LP-6789',
        trainManager: 'Deepak Singh',
        trainManagerId: 'TM-9012',
        signOnTime: '04:15',
        releaseTime: '16:30',
        dutyHours: 12.25,
        status: 'Completed',
        reliefPlanned: false,
      },
    ],
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  const handleGenerateReport = () => {
    // TODO: API call to generate report
    console.log('Generating report with filters:', filters);
    alert('Report generated successfully!');
  };

  const handleExportPDF = () => {
    // TODO: Implement PDF export with jsPDF library
    alert('PDF export functionality will be implemented in the next phase. For now, please use Excel export.');
  };

  const handleExportExcelDetailed = () => {
    // Create a new workbook
    const workbook = XLSX.utils.book_new();
    
    // ===== SHEET 1: Summary =====
    const summaryData = [
      ['INDIAN RAILWAYS - DUTY HOURS REPORT'],
      [],
      ['Report Information'],
      ['Report Type', filters.reportType],
      ['Date From', dayjs(filters.dateFrom).format('DD MMM YYYY')],
      ['Date To', dayjs(filters.dateTo).format('DD MMM YYYY')],
      ['Generated On', dayjs().format('DD MMM YYYY HH:mm:ss')],
      [],
      ['Summary Statistics'],
      ['Metric', 'Value'],
      ['Total Shifts', reportData.summary.totalShifts],
      ['Average Duty Hours', reportData.summary.averageDutyHours + ' hours'],
      ['Shifts Over 12 Hours', reportData.summary.shiftsOver12Hours],
      ['Shifts Over 14 Hours (Critical)', reportData.summary.shiftsOver14Hours],
      ['Relief Planned', reportData.summary.reliefPlanned],
      ['Compliance Rate', reportData.summary.complianceRate + '%'],
      [],
      ['Note: This report is generated from the Indian Railways Shift Management System'],
    ];
    
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    summarySheet['!cols'] = [{ wch: 30 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
    
    // ===== SHEET 2: Detailed Shift Data =====
    const detailedData = [
      [
        'Date',
        'Train Number',
        'Locomotive Number',
        'Loco Pilot Name',
        'Loco Pilot ID',
        'Loco Pilot Phone',
        'Train Manager Name',
        'Train Manager ID',
        'Train Manager Phone',
        'Sign On Time',
        'Release Time',
        'Duty Hours',
        'Status',
        'Relief Planned',
        'Compliance'
      ]
    ];
    
    reportData.shifts.forEach(shift => {
      const compliance = shift.dutyHours <= 12 ? 'Compliant' : 
                        shift.dutyHours <= 14 ? 'Warning' : 'Critical';
      
      detailedData.push([
        dayjs(shift.date).format('DD/MM/YYYY'),
        shift.trainNumber,
        shift.locomotiveNumber,
        shift.locoPilot,
        shift.locoPilotId,
        `+91 ${shift.locoPilotId.slice(-10)}`, // Mock phone
        shift.trainManager,
        shift.trainManagerId,
        `+91 ${shift.trainManagerId.slice(-10)}`, // Mock phone
        shift.signOnTime,
        shift.releaseTime,
        shift.dutyHours,
        shift.status,
        shift.reliefPlanned ? 'Yes' : 'No',
        compliance
      ]);
    });
    
    const detailedSheet = XLSX.utils.aoa_to_sheet(detailedData);
    detailedSheet['!cols'] = [
      { wch: 12 }, { wch: 12 }, { wch: 18 }, { wch: 20 }, { wch: 12 },
      { wch: 15 }, { wch: 20 }, { wch: 12 }, { wch: 15 }, { wch: 12 },
      { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 12 }
    ];
    XLSX.utils.book_append_sheet(workbook, detailedSheet, 'Shift Details');
    
    // ===== SHEET 3: Compliance Analysis =====
    const compliantShifts = reportData.shifts.filter(s => s.dutyHours <= 12).length;
    const warningShifts = reportData.shifts.filter(s => s.dutyHours > 12 && s.dutyHours <= 14).length;
    const criticalShifts = reportData.shifts.filter(s => s.dutyHours > 14).length;
    
    const complianceData = [
      ['Compliance Analysis'],
      [],
      ['Category', 'Count', 'Percentage'],
      ['Compliant (≤12 hours)', compliantShifts, ((compliantShifts / reportData.shifts.length) * 100).toFixed(2) + '%'],
      ['Warning (12-14 hours)', warningShifts, ((warningShifts / reportData.shifts.length) * 100).toFixed(2) + '%'],
      ['Critical (>14 hours)', criticalShifts, ((criticalShifts / reportData.shifts.length) * 100).toFixed(2) + '%'],
      [],
      ['Duty Hour Distribution'],
      ['Range', 'Count'],
      ['< 8 hours', reportData.shifts.filter(s => s.dutyHours < 8).length],
      ['8-9 hours', reportData.shifts.filter(s => s.dutyHours >= 8 && s.dutyHours < 9).length],
      ['9-11 hours', reportData.shifts.filter(s => s.dutyHours >= 9 && s.dutyHours < 11).length],
      ['11-12 hours', reportData.shifts.filter(s => s.dutyHours >= 11 && s.dutyHours < 12).length],
      ['12-14 hours', reportData.shifts.filter(s => s.dutyHours >= 12 && s.dutyHours < 14).length],
      ['> 14 hours', reportData.shifts.filter(s => s.dutyHours >= 14).length],
    ];
    
    const complianceSheet = XLSX.utils.aoa_to_sheet(complianceData);
    complianceSheet['!cols'] = [{ wch: 25 }, { wch: 10 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(workbook, complianceSheet, 'Compliance Analysis');
    
    // Generate filename
    const filename = `Railway_Duty_Report_${dayjs(filters.dateFrom).format('YYYY-MM-DD')}_to_${dayjs(filters.dateTo).format('YYYY-MM-DD')}.xlsx`;
    
    // Download
    XLSX.writeFile(workbook, filename);
    
    alert(`Detailed report exported successfully!\n\nFile: ${filename}\n\nIncludes:\n- Summary Sheet\n- Detailed Shift Data\n- Compliance Analysis`);
  };

  const handleExportExcel = () => {
    // Prepare data for Excel export
    const worksheetData = [];
    
    // Add title row
    worksheetData.push(['Indian Railways - Duty Hours Report']);
    worksheetData.push([]); // Empty row
    
    // Add report metadata
    worksheetData.push(['Report Type:', filters.reportType]);
    worksheetData.push(['Date Range:', `${dayjs(filters.dateFrom).format('DD MMM YYYY')} to ${dayjs(filters.dateTo).format('DD MMM YYYY')}`]);
    worksheetData.push(['Generated On:', dayjs().format('DD MMM YYYY HH:mm:ss')]);
    worksheetData.push([]); // Empty row
    
    // Add summary statistics
    worksheetData.push(['Summary Statistics']);
    worksheetData.push(['Total Shifts', reportData.summary.totalShifts]);
    worksheetData.push(['Average Duty Hours', reportData.summary.averageDutyHours + ' hours']);
    worksheetData.push(['Shifts Over 12 Hours', reportData.summary.shiftsOver12Hours]);
    worksheetData.push(['Shifts Over 14 Hours', reportData.summary.shiftsOver14Hours]);
    worksheetData.push(['Relief Planned', reportData.summary.reliefPlanned]);
    worksheetData.push(['Compliance Rate', reportData.summary.complianceRate + '%']);
    worksheetData.push([]); // Empty row
    
    // Add column headers for shift details
    worksheetData.push([
      'Date',
      'Train Number',
      'Locomotive Number',
      'Loco Pilot Name',
      'Loco Pilot ID',
      'Train Manager Name',
      'Train Manager ID',
      'Sign On Time',
      'Release Time',
      'Duty Hours',
      'Status',
      'Relief Planned'
    ]);
    
    // Add shift data
    reportData.shifts.forEach(shift => {
      worksheetData.push([
        dayjs(shift.date).format('DD MMM YYYY'),
        shift.trainNumber,
        shift.locomotiveNumber,
        shift.locoPilot,
        shift.locoPilotId,
        shift.trainManager,
        shift.trainManagerId,
        shift.signOnTime,
        shift.releaseTime,
        shift.dutyHours,
        shift.status,
        shift.reliefPlanned ? 'Yes' : 'No'
      ]);
    });
    
    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // Set column widths
    worksheet['!cols'] = [
      { wch: 15 }, // Date
      { wch: 12 }, // Train Number
      { wch: 18 }, // Locomotive Number
      { wch: 20 }, // Loco Pilot Name
      { wch: 12 }, // Loco Pilot ID
      { wch: 20 }, // Train Manager Name
      { wch: 12 }, // Train Manager ID
      { wch: 12 }, // Sign On Time
      { wch: 12 }, // Release Time
      { wch: 10 }, // Duty Hours
      { wch: 12 }, // Status
      { wch: 12 }  // Relief Planned
    ];
    
    // Style the title
    worksheet['A1'].s = {
      font: { bold: true, sz: 16 },
      alignment: { horizontal: 'center' }
    };
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Duty Hours Report');
    
    // Generate filename with timestamp
    const filename = `Indian_Railways_Duty_Report_${dayjs().format('YYYY-MM-DD_HHmmss')}.xlsx`;
    
    // Download the file
    XLSX.writeFile(workbook, filename);
    
    // Show success message
    alert(`Report exported successfully as ${filename}`);
  };

  const getDutyHoursColor = (hours) => {
    if (hours >= 14) return 'text-red-700 font-bold';
    if (hours >= 12) return 'text-red-600 font-bold';
    if (hours >= 11) return 'text-orange-600 font-semibold';
    if (hours >= 9) return 'text-yellow-700 font-semibold';
    if (hours >= 8) return 'text-blue-600';
    return 'text-green-600';
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold text-[#003d82] flex items-center gap-3">
              <FaFileAlt />
              Reports & Analytics
            </h2>
            <p className="text-gray-600 mt-2">
              Generate comprehensive reports on duty hours, shift history, and compliance
            </p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-[#003d82] text-white rounded-md hover:bg-[#002b5c] transition-colors flex items-center gap-2"
          >
            <FaFilter />
            {showFilters ? 'Hide' : 'Show'} Filters
          </button>
        </div>

        {/* Filters Section */}
        {showFilters && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-[#003d82] mb-4 flex items-center gap-2">
              <FaFilter />
              Report Filters
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Report Type
                </label>
                <select
                  name="reportType"
                  value={filters.reportType}
                  onChange={handleFilterChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#003d82] focus:border-transparent"
                >
                  <option value="duty-hours">Duty Hours Report</option>
                  <option value="shift-history">Shift History</option>
                  <option value="compliance">Compliance Report</option>
                  <option value="pilot-wise">Loco Pilot Wise</option>
                  <option value="train-wise">Train Wise</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date From
                </label>
                <input
                  type="date"
                  name="dateFrom"
                  value={filters.dateFrom}
                  onChange={handleFilterChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#003d82] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date To
                </label>
                <input
                  type="date"
                  name="dateTo"
                  value={filters.dateTo}
                  onChange={handleFilterChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#003d82] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Train Number (Optional)
                </label>
                <input
                  type="text"
                  name="trainNumber"
                  value={filters.trainNumber}
                  onChange={handleFilterChange}
                  placeholder="e.g., 12345"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#003d82] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loco Pilot ID (Optional)
                </label>
                <input
                  type="text"
                  name="locoPilotId"
                  value={filters.locoPilotId}
                  onChange={handleFilterChange}
                  placeholder="e.g., LP-2345"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#003d82] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Division (Optional)
                </label>
                <select
                  name="division"
                  value={filters.division}
                  onChange={handleFilterChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#003d82] focus:border-transparent"
                >
                  <option value="">All Divisions</option>
                  <option value="central">Central Railway</option>
                  <option value="eastern">Eastern Railway</option>
                  <option value="northern">Northern Railway</option>
                  <option value="southern">Southern Railway</option>
                  <option value="western">Western Railway</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={handleGenerateReport}
                className="px-6 py-2 bg-[#003d82] text-white rounded-md hover:bg-[#002b5c] transition-colors font-medium flex items-center gap-2"
              >
                <FaChartBar />
                Generate Report
              </button>
              <button
                onClick={() => setFilters({
                  reportType: 'duty-hours',
                  dateFrom: dayjs().subtract(7, 'days').format('YYYY-MM-DD'),
                  dateTo: dayjs().format('YYYY-MM-DD'),
                  trainNumber: '',
                  locoPilotId: '',
                  division: '',
                })}
                className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition-colors font-medium"
              >
                Reset Filters
              </button>
            </div>
          </div>
        )}

        {/* Summary Statistics */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold text-[#003d82] mb-4 flex items-center gap-2">
            <FaChartBar />
            Summary Statistics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Total Shifts</p>
              <p className="text-2xl font-bold text-gray-800">{reportData.summary.totalShifts}</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Avg Duty Hours</p>
              <p className="text-2xl font-bold text-blue-600">{reportData.summary.averageDutyHours}h</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Over 12 Hours</p>
              <p className="text-2xl font-bold text-yellow-600">{reportData.summary.shiftsOver12Hours}</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Over 14 Hours</p>
              <p className="text-2xl font-bold text-red-600">{reportData.summary.shiftsOver14Hours}</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Relief Planned</p>
              <p className="text-2xl font-bold text-purple-600">{reportData.summary.reliefPlanned}</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Compliance</p>
              <p className="text-2xl font-bold text-green-600">{reportData.summary.complianceRate}%</p>
            </div>
          </div>
        </div>

        {/* Export Options */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#003d82] flex items-center gap-2">
              <FaDownload />
              Export Report
            </h3>
            <div className="flex gap-3">
              <button
                onClick={handleExportPDF}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium flex items-center gap-2"
              >
                <FaDownload />
                Export as PDF
              </button>
              <button
                onClick={handleExportExcel}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
              >
                <FaDownload />
                Quick Export (Excel)
              </button>
              <button
                onClick={handleExportExcelDetailed}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
              >
                <FaDownload />
                Detailed Report (Excel)
              </button>
            </div>
          </div>
        </div>

        {/* Report Data Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-bold text-[#003d82]">Shift Details</h3>
            <p className="text-sm text-gray-600 mt-1">
              Showing {reportData.shifts.length} shifts from {dayjs(filters.dateFrom).format('DD MMM YYYY')} to {dayjs(filters.dateTo).format('DD MMM YYYY')}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Train Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Loco Pilot
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Train Manager
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timings
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duty Hours
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.shifts.map((shift) => (
                  <tr key={shift.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {dayjs(shift.date).format('DD MMM YYYY')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <FaTrain className="text-[#003d82]" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">#{shift.trainNumber}</div>
                          <div className="text-xs text-gray-500">{shift.locomotiveNumber}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{shift.locoPilot}</div>
                      <div className="text-xs text-gray-500">{shift.locoPilotId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{shift.trainManager}</div>
                      <div className="text-xs text-gray-500">{shift.trainManagerId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-1 text-xs">
                        <FaClock className="text-gray-400" />
                        <span>{shift.signOnTime} - {shift.releaseTime}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-lg font-bold ${getDutyHoursColor(shift.dutyHours)}`}>
                        {shift.dutyHours}h
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          {shift.status}
                        </span>
                        {shift.reliefPlanned && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            Relief Planned
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing 1 to {reportData.shifts.length} of {reportData.summary.totalShifts} results
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-100">
                Previous
              </button>
              <button className="px-3 py-1 bg-[#003d82] text-white rounded text-sm">
                1
              </button>
              <button className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-100">
                2
              </button>
              <button className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-100">
                3
              </button>
              <button className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-100">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ReportsPage;

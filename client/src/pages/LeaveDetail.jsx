import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';
import { format, parseISO } from 'date-fns';
import { AuthContext } from '../context/AuthContext';

const LeaveDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [leaveData, setLeaveData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaveDetails = async () => {
      try {
        const { data } = await api.get(`/leaves/${id}`);
        setLeaveData(data);
      } catch (error) {
        toast.error('Failed to load leave details');
        navigate('/leaves/my');
      } finally {
        setLoading(false);
      }
    };
    fetchLeaveDetails();
  }, [id, navigate]);

  const handleCancel = async () => {
    if (window.confirm('Are you sure you want to cancel this leave application?')) {
      try {
        await api.put(`/leaves/${id}/cancel`);
        toast.success('Leave cancelled successfully');
        // Refresh data
        const { data } = await api.get(`/leaves/${id}`);
        setLeaveData(data);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to cancel leave');
      }
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-yellow-100 text-yellow-800'; // pending
    }
  };

  if (loading) return <div className="text-center py-10">Loading...</div>;
  if (!leaveData) return null;

  const { leave, logs, attachments } = leaveData;

  return (
    <div className="max-w-4xl mx-auto p-6 mt-10 space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Leave Details</h2>
            <p className="text-sm text-gray-500 mt-1">Leave ID: #{leave.id}</p>
          </div>
          <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusColor(leave.status)}`}>
            {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-medium text-gray-500">Applicant</p>
            <p className="mt-1 text-gray-900 font-semibold">{leave.user_name}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Leave Type</p>
            <p className="mt-1 text-gray-900 font-semibold">{leave.leave_type_name}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Duration</p>
            <p className="mt-1 text-gray-900 font-medium">
              {format(parseISO(leave.start_date), 'MMM d, yyyy')} to {format(parseISO(leave.end_date), 'MMM d, yyyy')}
            </p>
            <p className="text-sm text-gray-500">{leave.total_days} {leave.total_days === 1 ? 'day' : 'days'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Applied On</p>
            <p className="mt-1 text-gray-900">{format(parseISO(leave.applied_at), 'MMM d, yyyy h:mm a')}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm font-medium text-gray-500">Reason</p>
            <div className="mt-1 bg-gray-50 p-4 rounded-md text-gray-700 whitespace-pre-wrap">
              {leave.reason}
            </div>
          </div>
          
          {attachments && attachments.length > 0 && (
            <div className="md:col-span-2 mt-4">
              <p className="text-sm font-medium text-gray-500 mb-2">Attachments</p>
              <div className="flex gap-2 flex-wrap">
                {attachments.map(att => (
                  <a 
                    key={att.id} 
                    href={`http://localhost:5000${att.file_url}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-purple-50 text-purple-700 px-3 py-2 rounded border border-purple-200 hover:bg-purple-100 transition"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                    View Attachment
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {leave.status === 'pending' && user.id === leave.user_id && (
          <div className="mt-8 flex justify-end">
            <button 
              onClick={handleCancel}
              className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 px-4 py-2 rounded transition"
            >
              Cancel Leave Application
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Activity Log</h3>
        <ul className="space-y-4">
          {logs.map((log) => (
            <li key={log.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="h-3 w-3 bg-purple-500 rounded-full mt-1.5"></div>
                <div className="h-full w-px bg-gray-200 my-1"></div>
              </div>
              <div className="flex-1 pb-4">
                <p className="text-sm text-gray-500">
                  {format(parseISO(log.action_at), 'MMM d, yyyy h:mm a')}
                </p>
                <p className="text-gray-800 font-medium capitalize mt-1">{log.action}</p>
                <p className="text-gray-600 text-sm mt-1">by {log.action_by_name}</p>
                {log.comment && (
                  <p className="text-gray-500 text-sm italic mt-2 bg-gray-50 p-2 rounded">
                    "{log.comment}"
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default LeaveDetail;

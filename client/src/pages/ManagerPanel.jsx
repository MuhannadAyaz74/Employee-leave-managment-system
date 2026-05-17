import { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { format, parseISO } from 'date-fns';

const ManagerPanel = () => {
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  
  // For rejection comment modal
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedLeaveId, setSelectedLeaveId] = useState(null);
  const [rejectComment, setRejectComment] = useState('');

  // For approval comment modal
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approveLeaveId, setApproveLeaveId] = useState(null);
  const [approveComment, setApproveComment] = useState('');

  const fetchPendingLeaves = async () => {
    try {
      const { data } = await api.get('/leaves/pending');
      setPendingLeaves(data);
    } catch (error) {
      toast.error('Failed to load pending leaves');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingLeaves();
  }, []);

  const openApproveModal = (id) => {
    setApproveLeaveId(id);
    setApproveComment('');
    setShowApproveModal(true);
  };

  const handleApproveSubmit = async (e) => {
    e.preventDefault();
    setProcessingId(approveLeaveId);
    try {
      await api.put(`/leaves/${approveLeaveId}/approve`, { manager_comment: approveComment });
      toast.success('Leave approved');
      setPendingLeaves(pendingLeaves.filter(leave => leave.id !== approveLeaveId));
      setShowApproveModal(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve leave');
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectModal = (id) => {
    setSelectedLeaveId(id);
    setRejectComment('');
    setShowRejectModal(true);
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    setProcessingId(selectedLeaveId);
    try {
      await api.put(`/leaves/${selectedLeaveId}/reject`, { manager_comment: rejectComment });
      toast.success('Leave rejected');
      setPendingLeaves(pendingLeaves.filter(leave => leave.id !== selectedLeaveId));
      setShowRejectModal(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject leave');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 mt-10">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Manager Panel - Pending Leaves</h2>

      {loading ? (
        <p className="text-gray-500 text-center py-10">Loading pending requests...</p>
      ) : pendingLeaves.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-sm text-center border border-gray-100">
          <p className="text-gray-500 text-lg">You have no pending leave requests to review.</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden rounded-lg border border-gray-200">
          <ul className="divide-y divide-gray-200">
            {pendingLeaves.map((leave) => (
              <li key={leave.id} className="p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                  <div className="mb-4 md:mb-0">
                    <h3 className="text-lg font-semibold text-gray-900">{leave.user_name}</h3>
                    <p className="text-sm font-medium text-purple-600 mt-1">{leave.leave_type_name}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {format(parseISO(leave.start_date), 'MMM d, yyyy')} - {format(parseISO(leave.end_date), 'MMM d, yyyy')} 
                      <span className="mx-2">&bull;</span>
                      {leave.total_days} {leave.total_days === 1 ? 'day' : 'days'}
                    </p>
                    <div className="mt-2 bg-gray-50 p-3 rounded text-sm text-gray-700 max-w-2xl border border-gray-100">
                      <span className="font-semibold mr-2">Reason:</span>
                      {leave.reason}
                    </div>
                  </div>
                  
                  <div className="flex gap-3 mt-4 md:mt-0">
                    <button
                      onClick={() => openApproveModal(leave.id)}
                      disabled={processingId === leave.id}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition disabled:opacity-50 cursor-pointer"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => openRejectModal(leave.id)}
                      disabled={processingId === leave.id}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition disabled:opacity-50 cursor-pointer"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold mb-4 text-gray-800">Approve Leave</h3>
            <form onSubmit={handleApproveSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Approval Comment (Optional)
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 bg-white text-gray-900"
                  rows="3"
                  value={approveComment}
                  onChange={(e) => setApproveComment(e.target.value)}
                  placeholder="Add a note for the employee (optional)"
                ></textarea>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowApproveModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingId === approveLeaveId}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition disabled:opacity-50 cursor-pointer"
                >
                  Confirm Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold mb-4 text-gray-800">Reject Leave</h3>
            <form onSubmit={handleRejectSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason (Optional but recommended)
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 bg-white text-gray-900"
                  rows="3"
                  value={rejectComment}
                  onChange={(e) => setRejectComment(e.target.value)}
                  placeholder="Why is this leave being rejected?"
                ></textarea>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingId === selectedLeaveId}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition disabled:opacity-50 cursor-pointer"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerPanel;

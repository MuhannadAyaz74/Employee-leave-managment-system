import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';
import { format, parseISO } from 'date-fns';

const MyLeaves = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaves = async () => {
    try {
      const { data } = await api.get('/leaves/my');
      setLeaves(data);
    } catch (error) {
      toast.error('Failed to load your leaves');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const getStatusColor = (status) => {
    switch(status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-yellow-100 text-yellow-800'; // pending
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 mt-10">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">My Leaves</h2>
        <Link 
          to="/leaves/apply" 
          className="bg-purple-600 text-white px-4 py-2 rounded shadow hover:bg-purple-700 transition"
        >
          Apply Leave
        </Link>
      </div>

      {loading ? (
        <p className="text-gray-500 text-center py-10">Loading leaves...</p>
      ) : leaves.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-sm text-center border border-gray-100">
          <p className="text-gray-500 mb-4">You have not applied for any leaves yet.</p>
          <Link to="/leaves/apply" className="text-purple-600 font-medium hover:underline">Apply for one now</Link>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md border border-gray-200">
          <ul className="divide-y divide-gray-200">
            {leaves.map((leave) => (
              <li key={leave.id}>
                <Link to={`/leaves/${leave.id}`} className="block hover:bg-gray-50 transition">
                  <div className="px-4 py-4 sm:px-6 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-purple-600 truncate">{leave.leave_type_name}</p>
                      <p className="mt-1 flex items-center text-sm text-gray-500">
                        {format(parseISO(leave.start_date), 'MMM d, yyyy')} - {format(parseISO(leave.end_date), 'MMM d, yyyy')}
                        <span className="mx-2">&bull;</span>
                        {leave.total_days} {leave.total_days === 1 ? 'day' : 'days'}
                      </p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(leave.status)}`}>
                        {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                      </span>
                      <p className="mt-1 text-xs text-gray-400">
                        Applied on {format(parseISO(leave.applied_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MyLeaves;

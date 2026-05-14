import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import { toast } from 'react-toastify';
import { differenceInDays, parseISO } from 'date-fns';

const ApplyLeave = () => {
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const startDate = watch('start_date');
  const endDate = watch('end_date');

  useEffect(() => {
    const fetchLeaveTypes = async () => {
      try {
        const { data } = await api.get('/leaves/types');
        setLeaveTypes(data);
      } catch (error) {
        toast.error('Failed to load leave types');
      }
    };
    fetchLeaveTypes();
  }, []);

  const totalDays = startDate && endDate 
    ? differenceInDays(parseISO(endDate), parseISO(startDate)) + 1 
    : 0;

  const onSubmit = async (data) => {
    if (totalDays <= 0) {
      toast.error('End date must be after or equal to start date');
      return;
    }

    const formData = new FormData();
    formData.append('leave_type_id', data.leave_type_id);
    formData.append('start_date', data.start_date);
    formData.append('end_date', data.end_date);
    formData.append('total_days', totalDays);
    formData.append('reason', data.reason);
    if (data.attachment && data.attachment[0]) {
      formData.append('attachment', data.attachment[0]);
    }

    try {
      setLoading(true);
      await api.post('/leaves/apply', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Leave applied successfully');
      navigate('/leaves/my');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to apply leave');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md mt-10 border border-gray-100">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Apply for Leave</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Leave Type</label>
          <select 
            {...register('leave_type_id', { required: 'Leave type is required' })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 bg-white text-gray-900"
          >
            <option value="">Select a leave type</option>
            {leaveTypes.map(type => (
              <option key={type.id} value={type.id}>{type.name}</option>
            ))}
          </select>
          {errors.leave_type_id && <p className="mt-1 text-sm text-red-600">{errors.leave_type_id.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date</label>
            <input 
              type="date" 
              {...register('start_date', { required: 'Start date is required' })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-gray-900"
            />
            {errors.start_date && <p className="mt-1 text-sm text-red-600">{errors.start_date.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">End Date</label>
            <input 
              type="date" 
              {...register('end_date', { required: 'End date is required' })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-gray-900"
            />
            {errors.end_date && <p className="mt-1 text-sm text-red-600">{errors.end_date.message}</p>}
          </div>
        </div>

        {totalDays > 0 && (
          <div className="bg-purple-50 p-3 rounded text-purple-800 text-sm">
            Total leave days: <strong>{totalDays}</strong>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">Reason</label>
          <textarea 
            rows="4"
            {...register('reason', { required: 'Reason is required' })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-gray-900"
            placeholder="Please provide a reason for your leave"
          ></textarea>
          {errors.reason && <p className="mt-1 text-sm text-red-600">{errors.reason.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Attachment (Optional)</label>
          <input 
            type="file" 
            {...register('attachment')}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white"
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 transition"
        >
          {loading ? 'Applying...' : 'Apply Leave'}
        </button>
      </form>
    </div>
  );
};

export default ApplyLeave;

import { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';

const LeaveBalance = () => {
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBalances = async () => {
      try {
        const { data } = await api.get('/balance/my');
        setBalances(data);
      } catch (error) {
        toast.error('Failed to load leave balances');
      } finally {
        setLoading(false);
      }
    };
    fetchBalances();
  }, []);

  if (loading) {
    return <div className="text-center py-10 text-gray-500">Loading balances...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-6 mt-10">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">My Leave Balances</h2>
      
      {balances.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-sm text-center border border-gray-100">
          <p className="text-gray-500 text-lg">No leave balances found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {balances.map((balance) => (
            <div key={balance.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
              <div className="bg-purple-600 px-4 py-3">
                <h3 className="text-lg font-semibold text-white">{balance.leave_type_name}</h3>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
                  <span className="text-gray-500">Total Leaves</span>
                  <span className="font-semibold text-gray-800">{balance.total_leaves}</span>
                </div>
                <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
                  <span className="text-gray-500">Used</span>
                  <span className="font-semibold text-red-500">{balance.used_leaves}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">Remaining</span>
                  <span className="font-bold text-2xl text-green-600">{balance.remaining_leaves}</span>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 mt-auto">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-purple-600 h-2.5 rounded-full" 
                    style={{ width: `${(balance.used_leaves / balance.total_leaves) * 100 || 0}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 text-center mt-2">
                  {Math.round((balance.used_leaves / balance.total_leaves) * 100) || 0}% Used
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LeaveBalance;

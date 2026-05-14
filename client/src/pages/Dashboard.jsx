import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow p-6">
        <div className="flex justify-between items-center border-b pb-4 mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <button 
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            Logout
          </button>
        </div>
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Welcome, {user?.name}!</h2>
          <div className="bg-blue-50 p-4 rounded border border-blue-100">
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>Role:</strong> <span className="uppercase font-semibold text-blue-700">{user?.role}</span></p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <Link to="/leaves/apply" className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:border-purple-300 transition block text-center">
            <h3 className="text-lg font-semibold text-purple-700">Apply for Leave</h3>
            <p className="text-gray-500 text-sm mt-1">Submit a new leave application</p>
          </Link>
          <Link to="/leaves/my" className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:border-purple-300 transition block text-center">
            <h3 className="text-lg font-semibold text-purple-700">My Leaves</h3>
            <p className="text-gray-500 text-sm mt-1">View your leave history and status</p>
          </Link>
          <Link to="/balance/my" className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:border-purple-300 transition block text-center">
            <h3 className="text-lg font-semibold text-purple-700">Leave Balance</h3>
            <p className="text-gray-500 text-sm mt-1">Check your remaining leaves</p>
          </Link>
          {(user?.role === 'manager' || user?.role === 'admin') && (
            <Link to="/manager" className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:border-purple-300 transition block text-center">
              <h3 className="text-lg font-semibold text-purple-700">Manager Panel</h3>
              <p className="text-gray-500 text-sm mt-1">Review team's leave requests</p>
            </Link>
          )}
          {user?.role === 'admin' && (
            <Link to="/admin" className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:border-purple-300 transition block text-center">
              <h3 className="text-lg font-semibold text-purple-700">Admin Panel</h3>
              <p className="text-gray-500 text-sm mt-1">System administration</p>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

import { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { format, parseISO } from 'date-fns';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('users');
  
  // Data states
  const [users, setUsers] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [allLeaves, setAllLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  // New item states
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'employee', manager_id: '' });
  const [newLeaveType, setNewLeaveType] = useState({ name: '', description: '' });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'users') {
        const { data } = await api.get('/admin/users');
        setUsers(data);
      } else if (activeTab === 'types') {
        const { data } = await api.get('/admin/leave-types');
        setLeaveTypes(data);
      } else if (activeTab === 'leaves') {
        const { data } = await api.get('/admin/leaves');
        setAllLeaves(data);
      }
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/users', {
        ...newUser,
        manager_id: newUser.manager_id || null
      });
      toast.success('User created');
      setNewUser({ name: '', email: '', password: '', role: 'employee', manager_id: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create user');
    }
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm('Delete this user?')) {
      try {
        await api.delete(`/admin/users/${id}`);
        toast.success('User deleted');
        fetchData();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete user');
      }
    }
  };

  const handleCreateType = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/leave-types', newLeaveType);
      toast.success('Leave type created');
      setNewLeaveType({ name: '', description: '' });
      fetchData();
    } catch (error) {
      toast.error('Failed to create leave type');
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 mt-10">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Admin Panel</h2>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`py-2 px-4 font-medium transition ${activeTab === 'users' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('users')}
        >
          Manage Users
        </button>
        <button
          className={`py-2 px-4 font-medium transition ${activeTab === 'types' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('types')}
        >
          Leave Types
        </button>
        <button
          className={`py-2 px-4 font-medium transition ${activeTab === 'leaves' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('leaves')}
        >
          All Leaves
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">Loading...</div>
      ) : (
        <>
          {activeTab === 'users' && (
            <div className="space-y-8">
              {/* Add User Form */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold mb-4">Add New User</h3>
                <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <input type="text" placeholder="Name" required value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="border border-gray-300 rounded p-2 focus:ring-purple-500 focus:border-purple-500 outline-none" />
                  <input type="email" placeholder="Email" required value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="border border-gray-300 rounded p-2 focus:ring-purple-500 focus:border-purple-500 outline-none" />
                  <input type="password" placeholder="Password" required value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="border border-gray-300 rounded p-2 focus:ring-purple-500 focus:border-purple-500 outline-none" />
                  <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} className="border border-gray-300 rounded p-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-white">
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                  <input type="number" placeholder="Manager ID (optional)" value={newUser.manager_id} onChange={e => setNewUser({...newUser, manager_id: e.target.value})} className="border border-gray-300 rounded p-2 focus:ring-purple-500 focus:border-purple-500 outline-none" />
                  <button type="submit" className="bg-purple-600 text-white rounded p-2 hover:bg-purple-700 transition font-medium">Create User</button>
                </form>
              </div>

              {/* Users List */}
              <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID / Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Manager</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{u.name}</div>
                          <div className="text-sm text-gray-500">ID: {u.id}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${u.role === 'admin' ? 'bg-purple-100 text-purple-800' : u.role === 'manager' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.manager_name || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button onClick={() => handleDeleteUser(u.id)} className="text-red-600 hover:text-red-900">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'types' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-fit">
                <h3 className="text-lg font-semibold mb-4">Add Leave Type</h3>
                <form onSubmit={handleCreateType} className="space-y-4">
                  <input type="text" placeholder="Type Name (e.g. Sick Leave)" required value={newLeaveType.name} onChange={e => setNewLeaveType({...newLeaveType, name: e.target.value})} className="w-full border border-gray-300 rounded p-2 outline-none focus:ring-purple-500 focus:border-purple-500" />
                  <textarea placeholder="Description" required value={newLeaveType.description} onChange={e => setNewLeaveType({...newLeaveType, description: e.target.value})} className="w-full border border-gray-300 rounded p-2 outline-none focus:ring-purple-500 focus:border-purple-500 h-24" />
                  <button type="submit" className="w-full bg-purple-600 text-white rounded p-2 hover:bg-purple-700 transition font-medium">Create Type</button>
                </form>
              </div>
              <div className="md:col-span-2 space-y-4">
                {leaveTypes.map(type => (
                  <div key={type.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <h4 className="font-semibold text-lg text-purple-700">{type.name}</h4>
                    <p className="text-gray-600 mt-1">{type.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'leaves' && (
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type / Dates</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied On</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {allLeaves.map(l => (
                    <tr key={l.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{l.user_name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{l.leave_type_name} ({l.total_days} days)</div>
                        <div className="text-xs text-gray-500">{format(parseISO(l.start_date), 'MMM d')} - {format(parseISO(l.end_date), 'MMM d, yyyy')}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${l.status === 'approved' ? 'bg-green-100 text-green-800' : l.status === 'rejected' ? 'bg-red-100 text-red-800' : l.status === 'cancelled' ? 'bg-gray-100 text-gray-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {l.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(parseISO(l.applied_at), 'MMM d, yyyy')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminPanel;

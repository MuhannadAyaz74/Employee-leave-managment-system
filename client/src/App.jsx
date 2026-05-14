import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import ApplyLeave from './pages/ApplyLeave';
import MyLeaves from './pages/MyLeaves';
import LeaveDetail from './pages/LeaveDetail';
import ManagerPanel from './pages/ManagerPanel';
import LeaveBalance from './pages/LeaveBalance';
import Navbar from './components/Navbar';
import AdminPanel from './pages/AdminPanel';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route path="/leaves/apply" element={<ProtectedRoute><ApplyLeave /></ProtectedRoute>} />
            <Route path="/leaves/my" element={<ProtectedRoute><MyLeaves /></ProtectedRoute>} />
            <Route path="/leaves/:id" element={<ProtectedRoute><LeaveDetail /></ProtectedRoute>} />
            <Route path="/manager" element={<ProtectedRoute allowedRoles={['manager', 'admin']}><ManagerPanel /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminPanel /></ProtectedRoute>} />
            <Route path="/balance/my" element={<ProtectedRoute><LeaveBalance /></ProtectedRoute>} />
            
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          
          <ToastContainer position="top-right" autoClose={3000} />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

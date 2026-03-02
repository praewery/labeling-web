import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import AdminDashboard from './components/AdminDashboard';
import LabelerDashboard from './components/LabelerDashboard';
import LabelingView from './components/LabelingView';
import Auth from './components/Auth';
import { LayoutDashboard, PenTool, LogOut, User as UserIcon } from 'lucide-react';

interface User {
  id: number;
  username: string;
  role: string;
}

export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  if (!user) {
    return <Auth onLogin={setUser} />;
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-2xl tracking-tight text-orange-600">LabelFlow</span>
            </div>
            
            <div className="flex items-center gap-6">
              <nav className="flex items-center gap-4">
                {user.role === 'labeler' && (
                  <Link to="/labeler" className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2 rounded-md hover:bg-slate-100 transition-colors">
                    Labeler Mode
                  </Link>
                )}
                {user.role === 'admin' && (
                  <Link to="/admin" className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2 rounded-md hover:bg-slate-100 transition-colors flex items-center gap-2">
                    <LayoutDashboard size={16} />
                    Admin Mode
                  </Link>
                )}
              </nav>

              <div className="h-6 w-px bg-slate-200" />

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full">
                  <UserIcon size={14} className="text-slate-500" />
                  <span className="text-xs font-bold text-slate-700">{user.username}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">
                    {user.role}
                  </span>
                </div>
                <button 
                  onClick={() => setUser(null)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  title="Logout"
                >
                  <LogOut size={20} />
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<Navigate to={user.role === 'admin' ? "/admin" : "/labeler"} replace />} />
            
            {user.role === 'admin' ? (
              <>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="*" element={<Navigate to="/admin" replace />} />
              </>
            ) : (
              <>
                <Route path="/labeler" element={<LabelerDashboard />} />
                <Route path="/labeler/:id" element={<LabelingView />} />
                <Route path="*" element={<Navigate to="/labeler" replace />} />
              </>
            )}
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

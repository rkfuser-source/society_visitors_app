import React, { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  where, 
  onSnapshot,
  getDocs,
  getDocFromServer
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile, UserRole } from './types';
import { 
  Shield, 
  LogOut, 
  User, 
  LayoutDashboard, 
  ClipboardList, 
  BarChart3, 
  PlusCircle,
  ScanLine,
  Building2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ResidentDashboard from './components/ResidentDashboard';
import GuardDashboard from './components/GuardDashboard';
import AdminDashboard from './components/AdminDashboard';
import VisitorLogs from './components/VisitorLogs';
import Analytics from './components/Analytics';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          // Test connection
          await getDocFromServer(doc(db, 'test', 'connection')).catch(() => {});
          
          const profileDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (profileDoc.exists()) {
            setProfile(profileDoc.data() as UserProfile);
          } else {
            // New user - default to resident for demo purposes
            // In a real app, this would be handled by an admin invite or registration flow
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || 'User',
              role: 'resident',
              societyId: 'default-society',
              createdAt: new Date().toISOString(),
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), newProfile);
            setProfile(newProfile);
          }
        } catch (err: any) {
          console.error("Profile fetch error:", err);
          setError("Failed to load user profile. Please check your internet connection.");
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center"
        >
          <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Secure Society Entry</h1>
          <p className="text-slate-600 mb-8">Modern visitor management for gated communities.</p>
          
          <button
            onClick={handleLogin}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-indigo-200"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
            Sign in with Google
          </button>
          
          <div className="mt-8 pt-8 border-t border-slate-100">
            <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-4">Demo Roles</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-[10px] bg-slate-50 p-2 rounded-lg border border-slate-200">
                <p className="font-bold text-slate-700">Resident</p>
                <p className="text-slate-500">Pre-approve guests</p>
              </div>
              <div className="text-[10px] bg-slate-50 p-2 rounded-lg border border-slate-200">
                <p className="font-bold text-slate-700">Guard</p>
                <p className="text-slate-500">Check-in visitors</p>
              </div>
              <div className="text-[10px] bg-slate-50 p-2 rounded-lg border border-slate-200">
                <p className="font-bold text-slate-700">Admin</p>
                <p className="text-slate-500">View analytics</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className="w-full lg:w-64 bg-white border-b lg:border-r border-slate-200 flex flex-col">
        <div className="p-6 flex items-center gap-3 border-b border-slate-100">
          <Shield className="w-8 h-8 text-indigo-600" />
          <span className="font-bold text-xl text-slate-900">SecureEntry</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <NavItem 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')}
            icon={<LayoutDashboard className="w-5 h-5" />}
            label="Dashboard"
          />
          {profile?.role === 'resident' && (
            <NavItem 
              active={activeTab === 'approvals'} 
              onClick={() => setActiveTab('approvals')}
              icon={<PlusCircle className="w-5 h-5" />}
              label="Pre-Approvals"
            />
          )}
          {(profile?.role === 'guard' || profile?.role === 'admin') && (
            <NavItem 
              active={activeTab === 'checkin'} 
              onClick={() => setActiveTab('checkin')}
              icon={<ScanLine className="w-5 h-5" />}
              label="Gate Check-in"
            />
          )}
          <NavItem 
            active={activeTab === 'logs'} 
            onClick={() => setActiveTab('logs')}
            icon={<ClipboardList className="w-5 h-5" />}
            label="Visitor Logs"
          />
          {profile?.role === 'admin' && (
            <NavItem 
              active={activeTab === 'analytics'} 
              onClick={() => setActiveTab('analytics')}
              icon={<BarChart3 className="w-5 h-5" />}
              label="Analytics"
            />
          )}
          {profile?.role === 'admin' && (
            <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-100">
              <p className="text-[10px] font-bold text-amber-700 uppercase mb-2">Demo Role Switcher</p>
              <select 
                value={profile.role}
                onChange={async (e) => {
                  const newRole = e.target.value as UserRole;
                  await setDoc(doc(db, 'users', profile.uid), { ...profile, role: newRole });
                  setProfile({ ...profile, role: newRole });
                }}
                className="w-full text-xs bg-white border border-amber-200 rounded p-1"
              >
                <option value="resident">Resident</option>
                <option value="guard">Guard</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
              {profile?.displayName?.[0] || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{profile?.displayName}</p>
              <p className="text-xs text-slate-500 capitalize">{profile?.role}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4 lg:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'dashboard' && (
              <>
                {profile?.role === 'resident' && <ResidentDashboard profile={profile} />}
                {profile?.role === 'guard' && <GuardDashboard profile={profile} />}
                {profile?.role === 'admin' && <AdminDashboard profile={profile} />}
              </>
            )}
            {activeTab === 'approvals' && profile?.role === 'resident' && (
              <ResidentDashboard profile={profile} showFormOnly={true} />
            )}
            {activeTab === 'checkin' && (profile?.role === 'guard' || profile?.role === 'admin') && (
              <GuardDashboard profile={profile} />
            )}
            {activeTab === 'logs' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-900">Visitor Logs</h2>
                <VisitorLogs profile={profile} />
              </div>
            )}
            {activeTab === 'analytics' && profile?.role === 'admin' && (
              <Analytics profile={profile} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-600 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm font-medium">{error}</p>
          <button onClick={() => setError(null)} className="text-white/80 hover:text-white">×</button>
        </div>
      )}
    </div>
  );
}

function NavItem({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all",
        active 
          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" 
          : "text-slate-600 hover:bg-slate-100"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

// End of App component

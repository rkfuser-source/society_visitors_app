import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy,
  limit,
  getDocs
} from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, VisitorLog } from '../types';
import { 
  Users, 
  TrendingUp, 
  Clock, 
  AlertCircle,
  Download,
  Calendar,
  Filter,
  Search,
  ChevronRight
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';

interface AdminDashboardProps {
  profile: UserProfile;
}

export default function AdminDashboard({ profile }: AdminDashboardProps) {
  const [logs, setLogs] = useState<VisitorLog[]>([]);
  const [stats, setStats] = useState({
    totalToday: 0,
    activeNow: 0,
    peakHour: 'N/A',
    avgStay: '0m'
  });

  useEffect(() => {
    const today = startOfDay(new Date());
    const q = query(
      collection(db, 'visitorLogs'),
      where('societyId', '==', profile.societyId),
      where('entryTime', '>=', today.toISOString()),
      orderBy('entryTime', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VisitorLog));
      setLogs(data);
      
      // Calculate stats
      const active = data.filter(l => l.status === 'in').length;
      setStats({
        totalToday: data.length,
        activeNow: active,
        peakHour: '11:00 AM', // Mock logic for demo
        avgStay: '45m'
      });
    });

    return () => unsubscribe();
  }, [profile.societyId]);

  // Mock data for charts
  const chartData = [
    { name: 'Mon', count: 45 },
    { name: 'Tue', count: 52 },
    { name: 'Wed', count: 38 },
    { name: 'Thu', count: 65 },
    { name: 'Fri', count: 48 },
    { name: 'Sat', count: 85 },
    { name: 'Sun', count: 92 },
  ];

  const hourlyData = [
    { time: '08:00', visitors: 12 },
    { time: '10:00', visitors: 25 },
    { time: '12:00', visitors: 45 },
    { time: '14:00', visitors: 30 },
    { time: '16:00', visitors: 55 },
    { time: '18:00', visitors: 40 },
    { time: '20:00', visitors: 15 },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Society Overview</h2>
          <p className="text-slate-500">Real-time visitor analytics and security reports.</p>
        </div>
        <div className="flex gap-2">
          <button className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-all">
            <Calendar className="w-4 h-4" />
            Last 7 Days
          </button>
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Total Today" 
          value={stats.totalToday} 
          trend="+12%" 
          icon={<Users className="text-indigo-600" />} 
        />
        <StatCard 
          label="Currently Inside" 
          value={stats.activeNow} 
          trend="Live" 
          icon={<TrendingUp className="text-emerald-600" />} 
        />
        <StatCard 
          label="Peak Hour" 
          value={stats.peakHour} 
          trend="Busy" 
          icon={<Clock className="text-amber-600" />} 
        />
        <StatCard 
          label="Avg. Stay Time" 
          value={stats.avgStay} 
          trend="-5m" 
          icon={<AlertCircle className="text-blue-600" />} 
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-6">Weekly Visitor Traffic</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-6">Peak Hour Heatmap</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData}>
                <defs>
                  <linearGradient id="colorVis" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Area type="monotone" dataKey="visitors" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorVis)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900">Live Activity Feed</h3>
          <button className="text-indigo-600 font-bold text-sm flex items-center gap-1 hover:underline">
            View All Logs <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Visitor</th>
                <th className="px-6 py-4">Resident / House</th>
                <th className="px-6 py-4">Vehicle</th>
                <th className="px-6 py-4">Entry Time</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.slice(0, 5).map(log => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
                        {log.visitorName[0]}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{log.visitorName}</p>
                        <p className="text-xs text-slate-500">{log.visitorPhone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-slate-700">House {log.houseNumber}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs font-bold text-slate-600">{log.vehicleNumber || 'No Vehicle'}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {format(new Date(log.entryTime), 'h:mm a')}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      log.status === 'in' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, trend, icon }: { label: string, value: string | number, trend: string, icon: React.ReactNode }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-slate-50 rounded-xl">{icon}</div>
        <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${
          trend === 'Live' ? 'bg-emerald-100 text-emerald-700 animate-pulse' : 'bg-slate-100 text-slate-600'
        }`}>
          {trend}
        </span>
      </div>
      <p className="text-sm font-semibold text-slate-500 mb-1">{label}</p>
      <p className="text-3xl font-black text-slate-900">{value}</p>
    </div>
  );
}

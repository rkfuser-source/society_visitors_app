import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy,
  limit,
  getDocs,
  startAfter
} from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, VisitorLog } from '../types';
import { 
  Search, 
  Filter, 
  Download, 
  Calendar,
  User,
  Car,
  Home,
  Clock,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';

interface VisitorLogsProps {
  profile: UserProfile | null;
}

export default function VisitorLogs({ profile }: VisitorLogsProps) {
  const [logs, setLogs] = useState<VisitorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    if (!profile) return;

    let q = query(
      collection(db, 'visitorLogs'),
      where('societyId', '==', profile.societyId),
      orderBy('entryTime', 'desc'),
      limit(50)
    );

    // If resident, only show their logs
    if (profile.role === 'resident') {
      q = query(
        collection(db, 'visitorLogs'),
        where('societyId', '==', profile.societyId),
        where('residentUid', '==', profile.uid),
        orderBy('entryTime', 'desc'),
        limit(50)
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VisitorLog));
      setLogs(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile]);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.visitorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.visitorPhone.includes(searchTerm) ||
      log.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterType === 'all') return matchesSearch;
    return matchesSearch && log.status === filterType;
  });

  const exportToCSV = () => {
    const headers = ['Visitor Name', 'Phone', 'House', 'Vehicle', 'Entry Time', 'Exit Time', 'Status'];
    const rows = filteredLogs.map(log => [
      log.visitorName,
      log.visitorPhone,
      log.houseNumber,
      log.vehicleNumber,
      format(new Date(log.entryTime), 'yyyy-MM-dd HH:mm'),
      log.exitTime ? format(new Date(log.exitTime), 'yyyy-MM-dd HH:mm') : '-',
      log.status
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `visitor_logs_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col lg:flex-row gap-4 justify-between">
          <div className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text"
                placeholder="Search by name, phone, or vehicle..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
            <select 
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium text-slate-600"
            >
              <option value="all">All Status</option>
              <option value="in">Currently In</option>
              <option value="out">Exited</option>
            </select>
          </div>
          <button 
            onClick={exportToCSV}
            className="bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-all shadow-sm"
          >
            <Download className="w-5 h-5" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Visitor Details</th>
                <th className="px-6 py-4">House / Resident</th>
                <th className="px-6 py-4">Vehicle Info</th>
                <th className="px-6 py-4">Timestamps</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                    No logs found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 flex-shrink-0">
                          {log.photoUrl ? (
                            <img src={log.photoUrl} alt="Visitor" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                              <User className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{log.visitorName}</p>
                          <p className="text-xs text-slate-500 font-medium">{log.visitorPhone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-700 flex items-center gap-1">
                          <Home className="w-3 h-3" /> House {log.houseNumber}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">Resident ID: {log.residentUid.slice(0, 8)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-700 flex items-center gap-1 uppercase">
                          <Car className="w-3 h-3" /> {log.vehicleNumber || 'No Vehicle'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium capitalize">{log.vehicleType}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs font-medium text-emerald-600">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          In: {format(new Date(log.entryTime), 'MMM d, h:mm a')}
                        </div>
                        {log.exitTime && (
                          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                            <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                            Out: {format(new Date(log.exitTime), 'MMM d, h:mm a')}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        log.status === 'in' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                        <FileText className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-500">Showing {filteredLogs.length} entries</p>
          <div className="flex gap-2">
            <button className="p-2 rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-slate-600 disabled:opacity-50" disabled>
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="p-2 rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-slate-600 disabled:opacity-50" disabled>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  orderBy,
  deleteDoc,
  doc
} from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, PreApproval } from '../types';
import { 
  Plus, 
  Calendar, 
  Users, 
  Car, 
  Clock, 
  Trash2, 
  QrCode,
  CheckCircle2,
  XCircle,
  Clock3
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { format } from 'date-fns';
import { motion } from 'motion/react';

interface ResidentDashboardProps {
  profile: UserProfile;
  showFormOnly?: boolean;
}

export default function ResidentDashboard({ profile, showFormOnly = false }: ResidentDashboardProps) {
  const [approvals, setApprovals] = useState<PreApproval[]>([]);
  const [showForm, setShowForm] = useState(showFormOnly);
  const [loading, setLoading] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<PreApproval | null>(null);

  const [formData, setFormData] = useState({
    visitorName: '',
    visitorPhone: '',
    purpose: 'Guest',
    vehicleNumber: '',
    vehicleType: 'none' as 'car' | 'bike' | 'other' | 'none',
    expectedArrival: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    isRecurring: false,
    numberOfPeople: 1
  });

  useEffect(() => {
    const q = query(
      collection(db, 'preApprovals'),
      where('residentUid', '==', profile.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PreApproval));
      setApprovals(data);
    });

    return () => unsubscribe();
  }, [profile.uid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, 'preApprovals'), {
        ...formData,
        residentUid: profile.uid,
        societyId: profile.societyId,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      setShowForm(false);
      setFormData({
        visitorName: '',
        visitorPhone: '',
        purpose: 'Guest',
        vehicleNumber: '',
        vehicleType: 'none',
        expectedArrival: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        isRecurring: false,
        numberOfPeople: 1
      });
    } catch (err) {
      console.error("Error adding approval:", err);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to cancel this pre-approval?")) {
      await deleteDoc(doc(db, 'preApprovals', id));
    }
  };

  if (showForm) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Create Pre-Approval</h2>
          {!showFormOnly && (
            <button 
              onClick={() => setShowForm(false)}
              className="text-slate-500 hover:text-slate-700 font-medium"
            >
              Cancel
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Visitor Name</label>
              <input 
                required
                type="text"
                value={formData.visitorName}
                onChange={e => setFormData({...formData, visitorName: e.target.value})}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="e.g. Rahul Sharma"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Visitor Phone</label>
              <input 
                required
                type="tel"
                value={formData.visitorPhone}
                onChange={e => setFormData({...formData, visitorPhone: e.target.value})}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="10-digit mobile"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Purpose</label>
              <select 
                value={formData.purpose}
                onChange={e => setFormData({...formData, purpose: e.target.value})}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              >
                <option>Guest</option>
                <option>Delivery</option>
                <option>Service (Maid/Plumber)</option>
                <option>Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Expected Arrival</label>
              <input 
                required
                type="datetime-local"
                value={formData.expectedArrival}
                onChange={e => setFormData({...formData, expectedArrival: e.target.value})}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Vehicle Type</label>
              <div className="flex gap-2">
                {['none', 'car', 'bike', 'other'].map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData({...formData, vehicleType: type as any})}
                    className={`flex-1 py-2 rounded-lg border text-xs font-bold capitalize transition-all ${
                      formData.vehicleType === type 
                        ? 'bg-indigo-600 text-white border-indigo-600' 
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Vehicle Number (Optional)</label>
              <input 
                type="text"
                value={formData.vehicleNumber}
                onChange={e => setFormData({...formData, vehicleNumber: e.target.value.toUpperCase()})}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="CH01 AB 1234"
              />
            </div>
          </div>

          <div className="flex items-center gap-6 pt-4">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="checkbox"
                checked={formData.isRecurring}
                onChange={e => setFormData({...formData, isRecurring: e.target.checked})}
                className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">Recurring Visitor?</span>
            </label>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-700">People:</span>
              <input 
                type="number"
                min="1"
                max="10"
                value={formData.numberOfPeople}
                onChange={e => setFormData({...formData, numberOfPeople: parseInt(e.target.value)})}
                className="w-16 px-2 py-1 rounded-lg border border-slate-200 text-center font-bold"
              />
            </div>
          </div>

          <button 
            disabled={loading}
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Generate Pre-Approval Pass'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Welcome Home, {profile.displayName}</h2>
          <p className="text-slate-500">Manage your visitor pre-approvals and security logs.</p>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 transition-all"
        >
          <Plus className="w-5 h-5" />
          New Pre-Approval
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          icon={<Users className="text-blue-600" />} 
          label="Active Approvals" 
          value={approvals.filter(a => a.status === 'pending').length} 
          color="blue"
        />
        <StatCard 
          icon={<CheckCircle2 className="text-emerald-600" />} 
          label="Visitors Today" 
          value={0} 
          color="emerald"
        />
        <StatCard 
          icon={<Clock3 className="text-amber-600" />} 
          label="Pending Invites" 
          value={approvals.filter(a => a.status === 'pending').length} 
          color="amber"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900">Recent Pre-Approvals</h3>
        </div>
        
        {approvals.length === 0 ? (
          <div className="p-12 text-center">
            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-500 font-medium">No pre-approvals found.</p>
            <button 
              onClick={() => setShowForm(true)}
              className="mt-4 text-indigo-600 font-bold hover:underline"
            >
              Create your first pass
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {approvals.map(approval => (
              <div key={approval.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    approval.status === 'used' ? 'bg-slate-100 text-slate-400' : 'bg-indigo-50 text-indigo-600'
                  }`}>
                    {approval.vehicleType === 'car' ? <Car className="w-6 h-6" /> : <Users className="w-6 h-6" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{approval.visitorName}</h4>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {format(new Date(approval.expectedArrival), 'MMM d, h:mm a')}</span>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {approval.numberOfPeople} People</span>
                      {approval.isRecurring && <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">Recurring</span>}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    approval.status === 'pending' ? 'bg-amber-100 text-amber-700' : 
                    approval.status === 'used' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {approval.status}
                  </div>
                  <button 
                    onClick={() => setSelectedApproval(approval)}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                    title="View QR Pass"
                  >
                    <QrCode className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => handleDelete(approval.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    title="Cancel Approval"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      {selectedApproval && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">Visitor Pass</h3>
              <button onClick={() => setSelectedApproval(null)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="bg-slate-50 p-6 rounded-2xl mb-6 flex justify-center border-2 border-dashed border-slate-200">
              <QRCodeSVG value={selectedApproval.id} size={200} />
            </div>
            
            <div className="space-y-2 mb-8">
              <p className="text-2xl font-black text-slate-900">{selectedApproval.visitorName}</p>
              <p className="text-slate-500 font-medium">Valid for {format(new Date(selectedApproval.expectedArrival), 'MMM d, yyyy')}</p>
              <p className="text-xs text-indigo-600 font-bold uppercase tracking-widest mt-2">Pass ID: {selectedApproval.id.slice(0, 8)}</p>
            </div>
            
            <button 
              onClick={() => setSelectedApproval(null)}
              className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition-all"
            >
              Close Pass
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: number, color: string }) {
  const colors: any = {
    blue: 'bg-blue-50 border-blue-100',
    emerald: 'bg-emerald-50 border-emerald-100',
    amber: 'bg-amber-50 border-amber-100'
  };

  return (
    <div className={`p-6 rounded-2xl border ${colors[color]} flex items-center gap-4`}>
      <div className="p-3 bg-white rounded-xl shadow-sm">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-500">{label}</p>
        <p className="text-2xl font-black text-slate-900">{value}</p>
      </div>
    </div>
  );
}

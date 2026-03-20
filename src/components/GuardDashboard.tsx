import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  onSnapshot,
  orderBy,
  limit,
  getDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, PreApproval, VisitorLog } from '../types';
import { 
  Search, 
  Scan, 
  Camera, 
  CheckCircle, 
  XCircle, 
  User, 
  Car, 
  Phone, 
  Home,
  Clock,
  LogOut,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';

interface GuardDashboardProps {
  profile: UserProfile;
}

export default function GuardDashboard({ profile }: GuardDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PreApproval[]>([]);
  const [activeLogs, setActiveLogs] = useState<VisitorLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<PreApproval | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Listen for active visitors (those who haven't exited)
    const q = query(
      collection(db, 'visitorLogs'),
      where('societyId', '==', profile.societyId),
      where('status', '==', 'in'),
      orderBy('entryTime', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VisitorLog));
      setActiveLogs(logs);
    });

    return () => unsubscribe();
  }, [profile.societyId]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const q = query(
        collection(db, 'preApprovals'),
        where('societyId', '==', profile.societyId),
        where('visitorPhone', '==', searchQuery.trim()),
        where('status', '==', 'pending')
      );
      const snapshot = await getDocs(q);
      const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PreApproval));
      setSearchResults(results);
      if (results.length === 0) {
        // Try searching by name if phone fails
        const qName = query(
          collection(db, 'preApprovals'),
          where('societyId', '==', profile.societyId),
          where('visitorName', '==', searchQuery.trim()),
          where('status', '==', 'pending')
        );
        const snapName = await getDocs(qName);
        setSearchResults(snapName.docs.map(doc => ({ id: doc.id, ...doc.data() } as PreApproval)));
      }
    } catch (err) {
      console.error("Search error:", err);
    }
    setLoading(false);
  };

  const startCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      alert("Could not access camera. Please check permissions.");
      setShowCamera(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(videoRef.current, 0, 0);
      setPhoto(canvas.toDataURL('image/jpeg'));
      
      // Stop camera
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setShowCamera(false);
    }
  };

  const sendOtp = () => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(otp);
    setIsVerifyingOtp(true);
    // In a real app, integrate with Twilio/SMS gateway here
    alert(`[DEMO MODE] OTP sent to visitor's phone: ${otp}`);
  };

  const handleCheckIn = async (approval: PreApproval) => {
    if (enteredOtp !== generatedOtp) {
      alert("Invalid OTP. Please try again.");
      return;
    }

    setLoading(true);
    try {
      // 1. Create visitor log
      const residentDoc = await getDoc(doc(db, 'users', approval.residentUid));
      const residentData = residentDoc.data() as UserProfile;

      await addDoc(collection(db, 'visitorLogs'), {
        societyId: profile.societyId,
        preApprovalId: approval.id,
        visitorName: approval.visitorName,
        visitorPhone: approval.visitorPhone,
        vehicleNumber: approval.vehicleNumber,
        vehicleType: approval.vehicleType,
        houseNumber: residentData.houseNumber || 'N/A',
        residentUid: approval.residentUid,
        entryTime: new Date().toISOString(),
        photoUrl: photo || '',
        guardUid: profile.uid,
        status: 'in'
      });

      // 2. Update pre-approval status
      await updateDoc(doc(db, 'preApprovals', approval.id), {
        status: 'used'
      });

      setSelectedApproval(null);
      setSearchResults([]);
      setSearchQuery('');
      setPhoto(null);
      setGeneratedOtp(null);
      setEnteredOtp('');
      setIsVerifyingOtp(false);
      alert(`Check-in successful for ${approval.visitorName}`);
    } catch (err) {
      console.error("Check-in error:", err);
      alert("Check-in failed. Please try again.");
    }
    setLoading(false);
  };

  const handleCheckOut = async (logId: string) => {
    try {
      await updateDoc(doc(db, 'visitorLogs', logId), {
        exitTime: new Date().toISOString(),
        status: 'out'
      });
      alert("Check-out successful");
    } catch (err) {
      console.error("Check-out error:", err);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Gate Dashboard</h2>
          <p className="text-slate-500">Verify visitors and manage entries/exits.</p>
        </div>
        <div className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2">
          <Clock className="w-4 h-4" />
          {format(new Date(), 'hh:mm a')}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Search & Verification */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Search className="w-5 h-5 text-indigo-600" />
              Verify Visitor
            </h3>
            <form onSubmit={handleSearch} className="flex gap-2">
              <input 
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Enter Phone or Name"
                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <button 
                type="submit"
                disabled={loading}
                className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50"
              >
                Search
              </button>
            </form>

            {searchResults.length > 0 && (
              <div className="mt-6 space-y-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Matching Pre-Approvals</p>
                {searchResults.map(approval => (
                  <div 
                    key={approval.id}
                    onClick={() => setSelectedApproval(approval)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedApproval?.id === approval.id ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-slate-900">{approval.visitorName}</p>
                        <p className="text-sm text-slate-500">{approval.visitorPhone}</p>
                      </div>
                      <div className="bg-white px-2 py-1 rounded-lg border border-slate-200 text-[10px] font-black uppercase">
                        {approval.purpose}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedApproval && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 animate-in fade-in slide-in-from-bottom-4">
              <h3 className="font-bold text-slate-900 mb-6">Check-in Details</h3>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                <Detail icon={<User />} label="Visitor" value={selectedApproval.visitorName} />
                <Detail icon={<Phone />} label="Phone" value={selectedApproval.visitorPhone} />
                <Detail icon={<Car />} label="Vehicle" value={`${selectedApproval.vehicleType.toUpperCase()} ${selectedApproval.vehicleNumber || 'N/A'}`} />
                <Detail icon={<Clock />} label="Expected" value={format(new Date(selectedApproval.expectedArrival), 'h:mm a')} />
              </div>

              <div className="space-y-4">
                <p className="text-sm font-bold text-slate-700">Verification Steps</p>
                
                {/* Step 1: Photo */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase">1. Vehicle Photo</p>
                  {photo ? (
                    <div className="relative rounded-xl overflow-hidden border border-slate-200">
                      <img src={photo} alt="Vehicle" className="w-full h-48 object-cover" />
                      <button 
                        onClick={() => setPhoto(null)}
                        className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full shadow-lg"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={startCamera}
                      className="w-full h-32 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-indigo-600 hover:border-indigo-600 transition-all"
                    >
                      <Camera className="w-6 h-6" />
                      <span className="font-bold text-sm">Capture Photo</span>
                    </button>
                  )}
                </div>

                {/* Step 2: OTP */}
                <div className="space-y-2 pt-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase">2. Visitor OTP Verification</p>
                  {!isVerifyingOtp ? (
                    <button 
                      onClick={sendOtp}
                      disabled={!photo}
                      className="w-full py-3 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 font-bold text-sm hover:bg-amber-100 transition-all disabled:opacity-50"
                    >
                      Send OTP to {selectedApproval.visitorPhone}
                    </button>
                  ) : (
                    <div className="space-y-3 animate-in fade-in zoom-in-95">
                      <div className="flex items-center gap-2">
                        <input 
                          type="text"
                          maxLength={6}
                          value={enteredOtp}
                          onChange={e => setEnteredOtp(e.target.value)}
                          placeholder="Enter 6-digit OTP"
                          className="flex-1 px-4 py-3 rounded-xl border-2 border-indigo-100 focus:border-indigo-600 outline-none font-mono text-center text-lg tracking-widest"
                        />
                        <button 
                          onClick={() => {
                            setEnteredOtp('');
                            setIsVerifyingOtp(false);
                            setGeneratedOtp(null);
                          }}
                          className="p-3 text-slate-400 hover:text-red-600"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>
                      <p className="text-[10px] text-center text-slate-400 font-medium">OTP sent to visitor's mobile. Ask them for the code.</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-6">
                  <button 
                    onClick={() => {
                      setSelectedApproval(null);
                      setPhoto(null);
                      setEnteredOtp('');
                      setIsVerifyingOtp(false);
                      setGeneratedOtp(null);
                    }}
                    className="flex-1 px-6 py-4 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => handleCheckIn(selectedApproval)}
                    disabled={!photo || !isVerifyingOtp || enteredOtp.length !== 6 || loading}
                    className="flex-1 px-6 py-4 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 disabled:opacity-50"
                  >
                    Complete Entry
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Active Visitors */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <LogOut className="w-5 h-5 text-amber-600" />
              Active Visitors ({activeLogs.length})
            </h3>
          </div>
          
          <div className="flex-1 overflow-auto max-h-[600px] divide-y divide-slate-100">
            {activeLogs.length === 0 ? (
              <div className="p-12 text-center text-slate-400 italic">
                No visitors currently inside.
              </div>
            ) : (
              activeLogs.map(log => (
                <div key={log.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden border border-slate-200">
                      {log.photoUrl ? (
                        <img src={log.photoUrl} alt="Visitor" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <User className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{log.visitorName}</h4>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1 font-bold text-indigo-600"><Home className="w-3 h-3" /> House {log.houseNumber}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> In: {format(new Date(log.entryTime), 'h:mm a')}</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleCheckOut(log.id)}
                    className="bg-amber-100 text-amber-700 hover:bg-amber-200 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
                  >
                    Check Out
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-black z-[60] flex flex-col">
          <div className="p-4 flex justify-between items-center text-white">
            <h3 className="font-bold">Capture Vehicle Photo</h3>
            <button onClick={() => setShowCamera(false)} className="p-2"><XCircle /></button>
          </div>
          <div className="flex-1 relative bg-black flex items-center justify-center">
            <video ref={videoRef} autoPlay playsInline className="max-w-full max-h-full" />
            <div className="absolute inset-0 border-2 border-white/30 pointer-events-none m-8 rounded-2xl"></div>
          </div>
          <div className="p-8 flex justify-center">
            <button 
              onClick={capturePhoto}
              className="w-20 h-20 bg-white rounded-full border-8 border-slate-300 flex items-center justify-center shadow-2xl active:scale-90 transition-transform"
            >
              <div className="w-12 h-12 bg-indigo-600 rounded-full"></div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Detail({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-slate-400 mt-1">{icon}</div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-sm font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

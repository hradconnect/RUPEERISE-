import React, { useState, useEffect, useRef } from 'react';
import { 
  auth, 
  db, 
  storage, 
  googleProvider 
} from './firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  Timestamp,
  limit
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  BarChart as ReBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ReTooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  AreaChart, 
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Wallet, 
  PlayCircle, 
  User, 
  LayoutDashboard, 
  History, 
  ShieldCheck, 
  LogOut,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpRight,
  Shield,
  CreditCard,
  Crown,
  Users,
  Share2,
  Copy,
  ChevronRight,
  TrendingUp,
  DollarSign,
  Activity,
  Menu,
  X as CloseIcon,
  Search,
  ArrowDownRight,
  Settings,
  Mail,
  Phone,
  QrCode,
  UserPlus,
  ShieldAlert,
  Zap
} from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import AppOpenAd from './components/ads/AppOpenAd';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null, userId?: string) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: userId,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  toast.error(`Firestore Error: ${errInfo.error}`);
}

// --- Types ---
interface UserData {
  id: string;
  uid: string;
  name?: string;
  phone: string;
  age?: number;
  balance: number;
  kyc_url?: string;
  bank_details?: string;
  role: 'user' | 'admin';
  isVip?: boolean;
  referralCode: string;
  referredBy?: string;
  totalReferralEarnings?: number;
  createdAt?: any;
}

interface Withdrawal {
  id: string;
  uid: string;
  userName: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: any;
  net_payout?: number;
  reason?: string;
}

interface VipRequest {
  id: string;
  uid: string;
  userName: string;
  transactionId: string;
  status: 'pending' | 'approved';
  timestamp: any;
}

interface Enquiry {
  id?: string;
  name: string;
  contactNumber: string;
  email: string;
  enquiry: string;
  uid: string;
  timestamp: any;
}

// --- Components ---

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signingIn, setSigningIn] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [adminTab, setAdminTab] = useState('withdrawals');
  const [logoClicks, setLogoClicks] = useState(0);
  const [showAppOpenAd, setShowAppOpenAd] = useState(() => {
    if (typeof window !== 'undefined') {
      return !sessionStorage.getItem('appOpenAdShown');
    }
    return true;
  });

  const handleCloseAd = () => {
    setShowAppOpenAd(false);
    sessionStorage.setItem('appOpenAdShown', 'true');
  };

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        
        const userRef = doc(db, 'users', firebaseUser.uid);
        const unsubUser = onSnapshot(userRef, (doc) => {
          if (doc.exists()) {
            setUserData({ id: doc.id, ...doc.data() } as UserData);
          } else {
            setUserData(null);
          }
          setLoading(false);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`, firebaseUser.uid);
        });

        return () => unsubUser();
      } else {
        setUser(null);
        setUserData(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleEmailAuth = async () => {
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setSigningIn(true);
    try {
      if (authMode === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(userCredential.user);
        toast.success('Account created! A verification email has been sent to your inbox.');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success('Login successful!');
      }
    } catch (error: any) {
      console.error('Email Auth Error:', error);
      toast.error(error.message || 'Authentication failed');
    } finally {
      setSigningIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  const handleGoogleLogin = async () => {
    if (signingIn) return;
    setSigningIn(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error('Google Login Error:', error);
      if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
        toast.error('Failed to login with Google: ' + error.message);
      }
    } finally {
      setSigningIn(false);
    }
  };

  const toggleDevAdmin = async () => {
    if (!userData || !user) return;
    try {
      const newRole = userData.role === 'admin' ? 'user' : 'admin';
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { 
        role: newRole,
        updatedAt: serverTimestamp()
      });
      toast.success(`Role switched to ${newRole}!`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`, user.uid);
    }
  };

  const isDev = userData && (
    userData.phone === 'ashishnehra450@gmail.com' || 
    user?.email === 'ashishnehra450@gmail.com' ||
    userData.uid === 'ashishnehra450@gmail.com' ||
    userData.name?.toLowerCase().includes('admin') ||
    userData.role === 'admin'
  );


  // Hidden back-door: clicking logo 7 times toggles admin
  const handleLogoClick = () => {
    const newCount = logoClicks + 1;
    if (newCount < 7) {
      toast.info(`Developer tap: ${newCount}/7`, { duration: 500, id: 'dev-tap' });
    }
    if (newCount >= 7) {
      toggleDevAdmin();
      setLogoClicks(0);
    } else {
      setLogoClicks(newCount);
    }
  };

  if (loading) {
    return (
      <>
        <AnimatePresence>
          {showAppOpenAd && <AppOpenAd onClose={handleCloseAd} />}
        </AnimatePresence>
        <div className="flex items-center justify-center h-screen bg-zinc-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900"></div>
        </div>
      </>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative">
        <AnimatePresence>
          {showAppOpenAd && <AppOpenAd onClose={handleCloseAd} />}
        </AnimatePresence>
        <div className="absolute inset-0 bg-[#050505] -z-10" />
        <Card className="w-full max-w-md glass">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-4 bg-primary/10 rounded-full ring-4 ring-primary/20">
                <ArrowUpRight className="w-12 h-12 text-primary" />
              </div>
            </div>
            <CardTitle className="text-3xl font-black tracking-tighter italic text-gold gold-glow">RUPEERISE</CardTitle>
            <CardDescription className="text-zinc-400">Login to start your earning journey</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-300">Email Address</Label>
                <Input 
                  id="email" 
                  type="email"
                  placeholder="name@example.com" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-zinc-900/50 border-zinc-800 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-zinc-300">Password</Label>
                <Input 
                  id="password" 
                  type="password"
                  placeholder="Minimum 6 characters" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-zinc-900/50 border-zinc-800 text-white"
                />
              </div>
              <Button onClick={handleEmailAuth} disabled={signingIn} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black h-11 rounded-lg">
                {signingIn ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div> : (authMode === 'login' ? 'LOGIN' : 'SIGN UP')}
              </Button>
              
              <p className="text-center text-xs text-zinc-500">
                {authMode === 'login' ? "Don't have an account?" : "Already have an account?"}
                <button 
                  onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                  className="ml-1 text-primary hover:underline font-bold"
                >
                  {authMode === 'login' ? 'Sign Up' : 'Login'}
                </button>
              </p>
            </div>

            <div className="relative py-4 mt-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-zinc-800"></span>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-zinc-950 px-2 text-zinc-500 font-bold px-4">Social Login</span>
              </div>
            </div>

            <Button 
              variant="outline" 
              onClick={handleGoogleLogin} 
              className="w-full border-zinc-800 text-white hover:bg-white/5 font-bold h-11"
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Sign in with Google
            </Button>
          </CardContent>
        </Card>
        <Toaster theme="dark" position="top-center" />
      </div>
    );
  }

  if (!userData?.name) {
    return (
      <>
        <AnimatePresence>
          {showAppOpenAd && <AppOpenAd onClose={handleCloseAd} />}
        </AnimatePresence>
        <CompleteProfile user={user} onComplete={(data) => setUserData(data)} />
      </>
    );
  }

  if (userData.role === 'admin') {
    return (
      <div className="relative">
        <AnimatePresence>
          {showAppOpenAd && <AppOpenAd onClose={handleCloseAd} />}
        </AnimatePresence>
        <AdminLayout admin={userData} onLogout={handleLogout} activeTab={adminTab} onTabChange={setAdminTab}>
          <AdminDashboard admin={userData} activeTab={adminTab} onTabChange={setAdminTab} />
        </AdminLayout>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 relative">
      <AnimatePresence>
        {showAppOpenAd && <AppOpenAd onClose={handleCloseAd} />}
      </AnimatePresence>
      <header className="glass border-b border-white/5 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer select-none group" onClick={handleLogoClick}>
            <div className="p-1.5 bg-primary rounded-lg shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-transform group-active:scale-95">
              <ArrowUpRight className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-black text-xl tracking-tighter italic text-gold gold-glow">RUPEERISE</span>
          </div>
          
          <div className="flex items-center gap-4">
            {userData.isVip && (
              <Badge className="bg-primary text-primary-foreground border-none flex items-center gap-1 shadow-[0_0_10px_rgba(212,175,55,0.3)]">
                <Crown className="w-3 h-3" />
                VIP
              </Badge>
            )}
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
              <Wallet className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-white">₹{userData.balance.toFixed(2)}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-zinc-400 hover:text-white hover:bg-white/10">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 pb-24 md:pb-6 space-y-4 relative">
        {isDev && (
          <div className="fixed top-20 right-4 z-[100] sm:relative sm:top-0 sm:right-0">
            <Button 
              onClick={toggleDevAdmin} 
              size="sm" 
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-black px-4 shadow-[0_0_20px_rgba(255,215,0,0.3)] border border-white/20"
            >
              <ShieldCheck className="w-4 h-4 mr-2" />
              ADMIN MODE
            </Button>
          </div>
        )}

        <UserDashboard user={userData} activeTab={activeTab} />
      </main>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass border-t border-white/5 px-4 py-3 flex justify-between items-center z-50">
        <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard />} label="Home" />
        <NavButton active={activeTab === 'earn'} onClick={() => setActiveTab('earn')} icon={<PlayCircle />} label="Earn" />
        {isDev && (
           <NavButton active={userData.role === 'admin'} onClick={toggleDevAdmin} icon={<ShieldCheck />} label="Dev" />
        )}
        <NavButton active={activeTab === 'referral'} onClick={() => setActiveTab('referral')} icon={<Share2 />} label="Refer" />
        <NavButton active={activeTab === 'wallet'} onClick={() => setActiveTab('wallet')} icon={<Wallet />} label="Wallet" />
        <NavButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={<User />} label="Profile" />
      </nav>

      <Toaster position="top-center" theme="dark" />
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-primary scale-110' : 'text-zinc-400 hover:text-white'}`}
    >
      {React.cloneElement(icon as React.ReactElement, { className: 'w-6 h-6' })}
      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
      {active && <div className="w-1 h-1 bg-primary rounded-full mt-0.5 gold-glow" />}
    </button>
  );
}

// --- User Dashboard ---
function UserDashboard({ user, activeTab }: { user: UserData, activeTab: string }) {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [isWatching, setIsWatching] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [systemSettings, setSystemSettings] = useState({
    commission: 10,
    vipThreshold: 99,
    minWithdrawal: 500,
    upiId: 'payment.admin@upi',
    qrUrl: ''
  });

  useEffect(() => {
    const unsubSettings = onSnapshot(doc(db, 'settings', 'global'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setSystemSettings({
          commission: data.commission ?? 10,
          vipThreshold: data.vipThreshold ?? 99,
          minWithdrawal: data.minWithdrawal ?? 500,
          upiId: data.upiId ?? 'payment.admin@upi',
          qrUrl: data.qrUrl ?? ''
        });
      }
    });
    return () => unsubSettings();
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, 'withdrawals'),
      where('uid', '==', user.uid),
      orderBy('timestamp', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setWithdrawals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Withdrawal)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'withdrawals', user.uid);
    });

    return () => unsubscribe();
  }, [user.uid]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleWatchAd = async () => {
    if (cooldown > 0) return;
    setIsWatching(true);
    toast.info('Loading AdMob Rewarded Ad...');
    
    // Simulate AdMob ad playback (5 seconds for demo)
    setTimeout(async () => {
      try {
        const res = await fetch('/api/reward', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            uid: user.uid,
            adNetwork: 'admob' 
          })
        });
        const data = await res.json();
        if (data.success) {
          toast.success('AdMob Reward earned: ₹0.01');
          setCooldown(30); // 30s cooldown
        }
      } catch (error) {
        toast.error('AdMob reward failed.');
      } finally {
        setIsWatching(false);
      }
    }, 5000);
  };

  const handleRequestWithdrawal = async () => {
    const threshold = user.isVip ? 200 : systemSettings.minWithdrawal;
    if (user.balance < threshold) {
      toast.error(`Minimum withdrawal for ${user.isVip ? 'VIP' : 'Regular'} members is ₹${threshold.toFixed(2)}`);
      return;
    }

    try {
      await addDoc(collection(db, 'withdrawals'), {
        uid: user.uid,
        userName: user.name || 'User',
        amount: user.balance,
        status: 'pending',
        timestamp: new Date().toISOString(),
        // net_payout will be calculated by the server upon approval
      });
      toast.success('Withdrawal request submitted!');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'withdrawals', user.uid);
    }
  };

  const [isVipDialogOpen, setIsVipDialogOpen] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [requestingVip, setRequestingVip] = useState(false);

  const handleVipRequest = async () => {
    if (!transactionId.trim()) return toast.error('Transaction ID is required');
    setRequestingVip(true);
    try {
      const res = await fetch('/api/vip/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          uid: user.uid, 
          userName: user.name || 'User',
          transactionId 
        })
      });
      if (res.ok) {
        toast.success('VIP request submitted! Admin will verify soon.');
        setIsVipDialogOpen(false);
        setTransactionId('');
      } else {
        toast.error('Failed to submit request.');
      }
    } catch (error) {
      toast.error('Error submitting request.');
    } finally {
      setRequestingVip(false);
    }
  };

  return (
    <div className="space-y-6">
      {activeTab === 'dashboard' && (
        <>
          {!user.isVip && (
            <Card className="bg-gradient-to-br from-primary via-amber-600 to-orange-700 text-primary-foreground border-none shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                <Crown className="w-32 h-32" />
              </div>
              <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
                <div>
                  <CardTitle className="text-2xl font-black flex items-center gap-2 gold-glow">
                    <Crown className="w-8 h-8" />
                    Upgrade to VIP
                  </CardTitle>
                  <CardDescription className="text-primary-foreground/80 font-medium">
                    Unlock the 6-level referral program and earn more!
                  </CardDescription>
                </div>
                <div className="text-3xl font-black bg-white/20 px-4 py-2 rounded-xl backdrop-blur-md">₹{systemSettings.vipThreshold}</div>
              </CardHeader>
              <CardFooter className="relative z-10">
                <Dialog open={isVipDialogOpen} onOpenChange={setIsVipDialogOpen}>
                  <DialogTrigger render={
                    <Button className="w-full bg-white text-primary hover:bg-white/90 font-black text-lg h-12 rounded-xl shadow-lg">
                      GET VIP ACCESS NOW
                    </Button>
                  } />
                  <DialogContent className="glass text-white border-white/10">
                    <DialogHeader>
                      <DialogTitle className="text-gold text-2xl font-black italic">VIP UPGRADE</DialogTitle>
                      <DialogDescription className="text-zinc-400">
                        Pay ₹{systemSettings.vipThreshold} to the UPI ID or scan the QR code below and enter the Transaction ID.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      {systemSettings.qrUrl && (
                        <div className="flex justify-center">
                          <img 
                            src={systemSettings.qrUrl} 
                            alt="Payment QR" 
                            className="w-32 h-32 rounded-lg border border-white/10"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}
                      <div className="p-4 bg-primary/10 rounded-xl border border-primary/20 text-center">
                        <p className="text-sm text-zinc-400 uppercase tracking-widest mb-1">Admin UPI ID</p>
                        <p className="text-xl font-black text-gold">{systemSettings.upiId}</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="txid" className="text-zinc-300">Transaction ID / UTR</Label>
                        <Input 
                          id="txid" 
                          placeholder="Enter 12-digit UTR number" 
                          value={transactionId}
                          onChange={(e) => setTransactionId(e.target.value)}
                          className="bg-zinc-900/50 border-zinc-800"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleVipRequest} disabled={requestingVip} className="w-full bg-primary text-primary-foreground font-bold">
                        {requestingVip ? 'Submitting...' : 'Submit Request'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardFooter>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1 bg-gradient-to-br from-zinc-900 to-black border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden group border">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
                <Wallet className="w-32 h-32 text-primary" />
              </div>
              <CardHeader className="pb-2 relative z-10">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">Available Capital</span>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <TrendingUp className="w-3 h-3 text-emerald-500" />
                    <span className="text-[9px] font-bold text-emerald-500">+4.2%</span>
                  </div>
                </div>
                <CardTitle className="text-5xl font-black text-white flex items-baseline gap-1 mt-4 italic tracking-tighter shadow-sm">
                  <span className="text-2xl text-primary font-bold not-italic">₹</span>
                  {user.balance.toFixed(2)}
                </CardTitle>
                <p className="text-[10px] text-zinc-400 font-mono mt-2 uppercase tracking-widest pl-1">Settlement Pending: ₹0.00</p>
              </CardHeader>
              <CardContent className="mt-6 relative z-10">
                <Button 
                  onClick={handleRequestWithdrawal} 
                  className="w-full bg-gold hover:bg-gold/90 text-primary-foreground font-black rounded-xl h-12 shadow-lg shadow-gold/20 italic tracking-tight"
                >
                  WITHDRAW CAPITAL
                </Button>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 glass border-none shadow-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black text-white italic uppercase tracking-widest">EARNINGS TREND</h3>
                <div className="flex items-center gap-4 text-[10px] font-bold text-zinc-500">
                  <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-primary" /> AD REWARDS</span>
                  <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> REFERRALS</span>
                </div>
              </div>
              <div className="h-[120px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[
                    { name: '1', ads: 0.05, refs: 0 },
                    { name: '2', ads: 0.12, refs: 10 },
                    { name: '3', ads: 0.08, refs: 5 },
                    { name: '4', ads: 0.15, refs: 15 },
                    { name: '5', ads: 0.22, refs: 20 },
                    { name: '6', ads: 0.18, refs: user.totalReferralEarnings ? user.totalReferralEarnings / 10 : 25 },
                  ]}>
                    <defs>
                      <linearGradient id="userEarn" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="refs" stroke="#10B981" fill="transparent" strokeWidth={2} />
                    <Area type="monotone" dataKey="ads" stroke="#D4AF37" fill="url(#userEarn)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/5">
                 <div>
                    <label className="text-[9px] font-black text-primary/60 uppercase tracking-widest">Task Income</label>
                    <p className="text-lg font-black text-white italic mt-1">₹{((user.balance || 0) - (user.totalReferralEarnings || 0)).toFixed(2)}</p>
                 </div>
                 <div className="text-right">
                    <label className="text-[9px] font-black text-emerald/60 uppercase tracking-widest">Network Rewards</label>
                    <p className="text-lg font-black text-emerald italic mt-1">₹{(user.totalReferralEarnings || 0).toFixed(2)}</p>
                 </div>
              </div>
            </Card>
          </div>

          <ConnectUs user={user} />
        </>
      )}

      {activeTab === 'earn' && (
        <div className="max-w-md mx-auto">
          <Card className="glass border-none shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl font-black text-white">Watch & Earn</CardTitle>
              <CardDescription className="text-zinc-400">Watch ads to earn real money instantly.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-6 bg-white/5 rounded-2xl border border-white/10 text-center">
                <p className="text-sm text-zinc-400 uppercase tracking-widest mb-2">Reward per Ad</p>
                <p className="text-4xl font-black text-emerald">₹0.01</p>
              </div>
              <Button 
                disabled={isWatching || cooldown > 0} 
                onClick={handleWatchAd}
                className={`w-full h-16 rounded-2xl font-black text-xl transition-all ${
                  cooldown > 0 
                  ? 'bg-zinc-800 text-zinc-500' 
                  : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_30px_rgba(212,175,55,0.3)]'
                }`}
              >
                {isWatching ? (
                  <span className="flex items-center gap-2">
                    <Clock className="w-6 h-6 animate-spin" />
                    WATCHING...
                  </span>
                ) : cooldown > 0 ? (
                  `WAIT ${cooldown}s`
                ) : (
                  <span className="flex items-center gap-2">
                    <PlayCircle className="w-6 h-6" />
                    WATCH AD NOW
                  </span>
                )}
              </Button>
              <div className="space-y-2">
                <p className="text-xs text-zinc-500 flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-emerald" />
                  Instant credit to your balance
                </p>
                <p className="text-xs text-zinc-500 flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-emerald" />
                  Unlimited ads available
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'referral' && (
        <ReferralSection user={user} />
      )}

      {activeTab === 'wallet' && (
        <div className="space-y-6">
          <Card className="glass border-none shadow-xl bg-gradient-to-br from-zinc-900 to-zinc-950">
            <CardHeader>
              <CardDescription className="text-zinc-400 font-medium uppercase tracking-wider text-[10px]">Total Balance</CardDescription>
              <CardTitle className="text-5xl font-black text-white">₹{user.balance.toFixed(2)}</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleRequestWithdrawal} 
                className="w-full h-12 bg-secondary hover:bg-secondary/90 text-secondary-foreground font-bold rounded-xl text-lg"
              >
                Request Withdrawal
              </Button>
              <p className="text-[10px] text-amber-200/50 mt-4 text-center uppercase tracking-widest">
                Minimum: ₹{user.isVip ? '200' : systemSettings.minWithdrawal.toFixed(0)} • {systemSettings.commission}% Tax Deduction
              </p>
            </CardContent>
          </Card>

          <Card className="glass border-none shadow-xl overflow-hidden">
            <CardHeader className="bg-white/5 border-b border-white/5">
              <CardTitle className="text-sm font-bold text-white">Withdrawal History</CardTitle>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-zinc-400 uppercase text-[10px] tracking-widest">Date</TableHead>
                  <TableHead className="text-zinc-400 uppercase text-[10px] tracking-widest">Amount</TableHead>
                  <TableHead className="text-zinc-400 uppercase text-[10px] tracking-widest">Net Payout</TableHead>
                  <TableHead className="text-zinc-400 uppercase text-[10px] tracking-widest">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {withdrawals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-zinc-500">No withdrawal history yet.</TableCell>
                  </TableRow>
                ) : (
                  withdrawals.map((w) => (
                    <TableRow key={w.id} className="border-white/5 hover:bg-white/5">
                      <TableCell className="text-zinc-300 text-sm">{w.timestamp?.toDate().toLocaleDateString()}</TableCell>
                      <TableCell className="font-bold text-white">₹{w.amount.toFixed(2)}</TableCell>
                      <TableCell className="text-emerald font-bold">₹{(w.net_payout ?? (w.amount * (1 - systemSettings.commission / 100))).toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge className={
                          w.status === 'approved' ? 'bg-secondary text-secondary-foreground' :
                          w.status === 'rejected' ? 'bg-destructive text-white' :
                          'bg-zinc-700 text-zinc-300'
                        }>
                          {w.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {activeTab === 'profile' && (
        <ProfileSettings user={user} />
      )}
    </div>
  );
}

// --- Admin Dashboard ---
// --- Admin Layout & Components ---

function AdminLayout({ admin, onLogout, activeTab, onTabChange, children }: { admin: UserData, onLogout: () => void, activeTab: string, onTabChange: (tab: string) => void, children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 flex font-sans">
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} border-r border-white/5 bg-[#0a0a0a] transition-all duration-300 flex flex-col fixed h-full z-50`}>
        <div className="p-6 flex items-center gap-3">
          <div className="p-2 bg-primary rounded-xl shadow-lg shadow-primary/20">
            <Shield className="w-6 h-6 text-primary-foreground" />
          </div>
          {isSidebarOpen && <span className="font-black text-xl italic tracking-tighter text-gold">ADMIN</span>}
        </div>

        <nav className="flex-1 px-4 py-8 space-y-2">
          <AdminNavItem 
            icon={<LayoutDashboard />} 
            label="Overview" 
            active={activeTab === 'withdrawals'} 
            collapsed={!isSidebarOpen} 
            onClick={() => onTabChange('withdrawals')}
          />
          <AdminNavItem 
            icon={<Users />} 
            label="Accounts" 
            active={activeTab === 'users'}
            collapsed={!isSidebarOpen} 
            onClick={() => onTabChange('users')}
          />
          <AdminNavItem 
            icon={<DollarSign />} 
            label="Finance" 
            active={activeTab === 'vip'}
            collapsed={!isSidebarOpen} 
            onClick={() => onTabChange('vip')}
          />
          <AdminNavItem 
            icon={<Activity />} 
            label="Activity" 
            active={activeTab === 'activity'}
            collapsed={!isSidebarOpen} 
            onClick={() => onTabChange('activity')} 
          />
          <AdminNavItem 
            icon={<Settings />} 
            label="Settings" 
            active={activeTab === 'settings'}
            collapsed={!isSidebarOpen} 
            onClick={() => onTabChange('settings')} 
          />
        </nav>

        <div className="p-4 border-t border-white/5">
          <Button 
            variant="ghost" 
            onClick={onLogout} 
            className="w-full flex items-center gap-3 text-zinc-400 hover:text-white hover:bg-white/5 py-6"
          >
            <LogOut className="w-5 h-5" />
            {isSidebarOpen && <span>Sign Out</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <header className="h-16 border-b border-white/5 px-8 flex items-center justify-between sticky top-0 bg-[#050505]/80 backdrop-blur-xl z-40">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-zinc-400 hover:text-white">
              <Menu className="w-5 h-5" />
            </Button>
            <h1 className="text-sm font-bold uppercase tracking-widest text-zinc-500">RUPEERISE Control Panel</h1>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Live Infrastructure: Asian-South</span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-white leading-none">{admin.name}</p>
                <p className="text-[10px] text-zinc-500 font-medium mt-1">System Administrator</p>
              </div>
              <Avatar className="h-9 w-9 border border-white/10 ring-2 ring-primary/20">
                <AvatarFallback className="bg-primary/20 text-primary">{admin.name?.charAt(0)}</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

function AdminNavItem({ icon, label, onClick, active = false, collapsed = false }: { icon: React.ReactNode, label: string, onClick?: () => void, active?: boolean, collapsed?: boolean }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${active ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
    >
      <div className={active ? '' : 'text-zinc-400'}>{React.cloneElement(icon as React.ReactElement, { className: 'w-5 h-5' })}</div>
      {!collapsed && <span className="font-bold text-sm">{label}</span>}
      {!collapsed && active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_white]" />}
    </button>
  );
}

// --- Admin Dashboard ---
function AdminDashboard({ admin, activeTab, onTabChange }: { admin: UserData, activeTab: string, onTabChange: (tab: string) => void }) {
  const [users, setUsers] = useState<UserData[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [vipRequests, setVipRequests] = useState<VipRequest[]>([]);
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [systemSettings, setSystemSettings] = useState({
    commission: 10,
    vipThreshold: 99,
    minWithdrawal: 500,
    upiId: 'payment.admin@upi',
    qrUrl: ''
  });
  const [stats, setStats] = useState({ 
    totalUsers: 0, 
    pendingPayouts: 0, 
    totalCommission: 0, 
    pendingVip: 0, 
    totalVolume: 0,
    dailyGrowth: 12.5,
    activeUsers: 84
  });
  
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

  const [configField, setConfigField] = useState<{ id: string; label: string; value: string | number; isNumeric: boolean } | null>(null);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [newConfigValue, setNewConfigValue] = useState('');
  const [uploadingQr, setUploadingQr] = useState(false);

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error('QR code must be under 5MB');

    setUploadingQr(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;
        const res = await fetch('/api/admin/upload-qr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            adminUid: admin.uid, 
            base64Data, 
            fileName: file.name,
            contentType: file.type 
          })
        });

        const result = await res.json();
        if (res.ok) {
          toast.success('Payment QR Code updated via secure server!');
        } else {
          throw new Error(result.error || 'Upload failed');
        }
      } catch (error: any) {
        console.error('QR Upload error details:', error);
        toast.error(`Upload failed: ${error.message}`);
      } finally {
        setUploadingQr(false);
        e.target.value = '';
      }
    };
    reader.onerror = () => {
      toast.error("Failed to read file.");
      setUploadingQr(false);
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const us = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserData));
      setUsers(us);
      setStats(prev => ({ ...prev, totalUsers: us.length }));
    }, (error) => {
      console.error("Admin Users Listener Error:", error);
    });

    const qW = query(collection(db, 'withdrawals'), orderBy('timestamp', 'desc'));
    const unsubWithdrawals = onSnapshot(qW, (snapshot) => {
      const ws = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Withdrawal));
      setWithdrawals(ws);
      const pending = ws.filter(w => w.status === 'pending').length;
      const commission = ws.filter(w => w.status === 'approved').reduce((acc, w) => {
        // Use actually charged commission (Amount - Net Payout)
        const earned = w.amount - (w.net_payout ?? w.amount);
        return acc + earned;
      }, 0);
      const volume = ws.filter(w => w.status === 'approved').reduce((acc, w) => acc + w.amount, 0);
      setStats(prev => ({ 
        ...prev, 
        pendingPayouts: pending, 
        totalCommission: commission,
        totalVolume: volume
      }));
    }, (error) => {
      console.error("Admin Withdrawals Listener Error:", error);
    });

    const qV = query(collection(db, 'vip_requests'), orderBy('timestamp', 'desc'));
    const unsubVip = onSnapshot(qV, (snapshot) => {
      const rs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VipRequest));
      setVipRequests(rs);
      const pendingVip = rs.filter(r => r.status === 'pending').length;
      setStats(prev => ({ ...prev, pendingVip }));
    }, (error) => {
      console.error("Admin VIP Requests Listener Error:", error);
    });

    const qE = query(collection(db, 'enquiries'), orderBy('timestamp', 'desc'), limit(50));
    const unsubEnquiries = onSnapshot(qE, (snapshot) => {
      setEnquiries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Admin Enquiries Listener Error:", error);
    });

    const unsubSettings = onSnapshot(doc(db, 'settings', 'global'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setSystemSettings({
          commission: data.commission ?? 10,
          vipThreshold: data.vipThreshold ?? 99,
          minWithdrawal: data.minWithdrawal ?? 500,
          upiId: data.upiId ?? 'payment.admin@upi',
          qrUrl: data.qrUrl ?? ''
        });
      }
    });
    
    return () => { unsubUsers(); unsubWithdrawals(); unsubVip(); unsubEnquiries(); unsubSettings(); };
  }, [admin.uid]);

  // Mock analytics data based on live stats
  const performanceData = [
    { name: 'Mon', users: 12, payouts: 1200 },
    { name: 'Tue', users: 19, payouts: 1800 },
    { name: 'Wed', users: 15, payouts: 2200 },
    { name: 'Thu', users: 22, payouts: 1600 },
    { name: 'Fri', users: 30, payouts: 3400 },
    { name: 'Sat', users: 35, payouts: 4100 },
    { name: 'Sun', users: users.length || 40, payouts: stats.totalVolume / 10 || 5000 },
  ];

  const distributionData = [
    { name: 'Regular', value: users.filter(u => !u.isVip).length || 80 },
    { name: 'VIP', value: users.filter(u => u.isVip).length || 20 },
  ];

  const COLORS = ['#D4AF37', '#10B981'];

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch('/api/admin/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ withdrawalId: id, adminUid: admin.uid })
      });
      if (res.ok) toast.success('Withdrawal approved!');
      else toast.error('Failed to approve.');
    } catch (error) {
      toast.error('Error processing request.');
    }
  };

  const handleSaveConfig = async () => {
    if (!configField || !newConfigValue) return;
    
    let finalValue: string | number = newConfigValue;
    if (configField.isNumeric) {
      finalValue = parseFloat(newConfigValue);
      if (isNaN(finalValue)) return toast.error('Invalid numeric value');
    }

    try {
      await setDoc(doc(db, 'settings', 'global'), {
        [configField.id]: finalValue
      }, { merge: true });
      toast.success(`${configField.label} updated successfully`);
      setIsConfigDialogOpen(false);
    } catch (error) {
      toast.error('Failed to update setting');
    }
  };

  const openConfig = (id: string, label: string, current: string | number, isNumeric: boolean = true) => {
    setConfigField({ id, label, value: current, isNumeric });
    setNewConfigValue(current.toString());
    setIsConfigDialogOpen(true);
  };
  const handleApproveVip = async (requestId: string) => {
    try {
      const res = await fetch('/api/admin/vip/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, adminUid: admin.uid })
      });
      if (res.ok) toast.success('VIP Membership activated!');
      else toast.error('Failed to approve VIP.');
    } catch (error) {
      toast.error('Error processing VIP approval.');
    }
  };

  const handleReject = async () => {
    if (!rejectingId) return;
    try {
      const res = await fetch('/api/admin/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          withdrawalId: rejectingId, 
          adminUid: admin.uid,
          reason: rejectReason 
        })
      });
      if (res.ok) {
        toast.success('Withdrawal rejected.');
        setIsRejectDialogOpen(false);
        setRejectReason('');
        setRejectingId(null);
      } else {
        toast.error('Failed to reject.');
      }
    } catch (error) {
      toast.error('Error processing rejection.');
    }
  };

  const toggleVip = async (userId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'users', userId), { isVip: !currentStatus });
      toast.success(`VIP status ${!currentStatus ? 'enabled' : 'disabled'} for user.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`, admin.uid);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ModernStatCard 
          label="Total Users" 
          value={stats.totalUsers} 
          trend="+12% from last week"
          icon={<Users className="w-5 h-5 text-primary" />} 
          color="primary"
        />
        <ModernStatCard 
          label="Pending Payouts" 
          value={stats.pendingPayouts} 
          trend="8 urgent requests"
          icon={<Clock className="w-5 h-5 text-amber-500" />} 
          color="amber"
        />
        <ModernStatCard 
          label="VIP Requests" 
          value={stats.pendingVip} 
          trend="Action required"
          icon={<Crown className="w-5 h-5 text-gold" />} 
          color="gold"
        />
        <ModernStatCard 
          label="System Revenue" 
          value={`₹${stats.totalCommission.toFixed(2)}`} 
          trend={`${systemSettings.commission}% tax deduction`}
          icon={<TrendingUp className="w-5 h-5 text-emerald-500" />} 
          color="emerald"
        />
      </div>

      {/* Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Growth Chart */}
        <Card className="lg:col-span-2 border-white/5 bg-[#0a0a0a] shadow-2xl p-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-lg font-black text-white italic">PERFORMANCE METRICS</h2>
              <p className="text-xs text-zinc-500 uppercase tracking-widest mt-1">Weekly user growth & payout volume</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-[10px] font-bold text-zinc-400">USERS</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-bold text-zinc-400">PAYOUTS</span>
              </div>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#4b5563', fontSize: 10}} 
                  dy={10}
                />
                <YAxis hide />
                <ReTooltip 
                  contentStyle={{backgroundColor: '#0a0a0a', border: '1px solid #ffffff10', borderRadius: '8px'}}
                  itemStyle={{fontSize: '12px'}}
                />
                <Area type="monotone" dataKey="users" stroke="#D4AF37" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
                <Area type="monotone" dataKey="payouts" stroke="#10B981" strokeWidth={2} strokeDasharray="5 5" fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* User Distribution */}
        <Card className="border-white/5 bg-[#0a0a0a] shadow-2xl p-6">
          <h2 className="text-lg font-black text-white italic mb-1">USER SEGMENTATION</h2>
          <p className="text-xs text-secondary mb-8">VIP vs Regular Distribution</p>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ReTooltip 
                  contentStyle={{backgroundColor: '#0a0a0a', border: '1px solid #ffffff10', borderRadius: '8px'}}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-4 mt-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Regular Members</span>
              <span className="font-bold text-white">{distributionData[0].value}%</span>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-zinc-700" style={{width: `${distributionData[0].value}%`}} />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">VIP Exclusive</span>
              <span className="font-bold text-gold">{distributionData[1].value}%</span>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-gold shadow-[0_0_10px_rgba(212,175,55,0.4)]" style={{width: `${distributionData[1].value}%`}} />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Management Section */}
      <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
        <div className="flex items-center justify-between mb-6">
          <TabsList className="bg-white/5 p-1 border border-white/5 rounded-2xl">
            <TabsTrigger value="withdrawals" className="px-6 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold text-xs uppercase tracking-widest">Withdrawals</TabsTrigger>
            <TabsTrigger value="vip" className="px-6 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold text-xs uppercase tracking-widest">VIP Requests</TabsTrigger>
            <TabsTrigger value="users" className="px-6 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold text-xs uppercase tracking-widest">User Database</TabsTrigger>
            <TabsTrigger value="activity" className="px-6 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold text-xs uppercase tracking-widest">Activity Log</TabsTrigger>
            <TabsTrigger value="settings" className="px-6 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold text-xs uppercase tracking-widest">System</TabsTrigger>
          </TabsList>

          <div className="hidden md:flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
            <Search className="w-4 h-4 text-zinc-500" />
            <input 
              placeholder="Search data..." 
              className="bg-transparent border-none text-xs text-white focus:outline-none w-40"
            />
          </div>
        </div>

        <TabsContent value="withdrawals" className="animate-in fade-in slide-in-from-top-2 duration-500">
          <Card className="border-white/5 bg-[#0a0a0a] shadow-2xl overflow-hidden">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-zinc-400 uppercase text-[10px] tracking-widest py-6 px-8">User Identity</TableHead>
                  <TableHead className="text-zinc-400 uppercase text-[10px] tracking-widest py-6">Requested Amount</TableHead>
                  <TableHead className="text-zinc-400 uppercase text-[10px] tracking-widest py-6">Net Payout</TableHead>
                  <TableHead className="text-zinc-400 uppercase text-[10px] tracking-widest py-6">Bank/Info</TableHead>
                  <TableHead className="text-zinc-400 uppercase text-[10px] tracking-widest py-6">Status</TableHead>
                  <TableHead className="text-right text-zinc-400 uppercase text-[10px] tracking-widest py-6 px-8">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {withdrawals.length === 0 ? (
                   <TableRow>
                     <TableCell colSpan={6} className="text-center py-20 text-zinc-600 font-mono text-sm tracking-tighter italic whitespace-pre-wrap">
                       {"// No withdrawal requests currently in queue"}
                     </TableCell>
                   </TableRow>
                ) : (
                  withdrawals.map((w) => (
                    <TableRow key={w.id} className="border-white/5 hover:bg-white/[0.02] group transition-colors">
                      <TableCell className="py-6 px-8">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 border border-white/10 group-hover:ring-2 ring-primary/20 transition-all">
                            <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-black">{w.userName?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-bold text-white flex items-center gap-2">
                              {w.userName}
                              {users.find(u => u.uid === w.uid)?.isVip && <Crown className="w-3 h-3 text-gold gold-glow" />}
                            </p>
                            <p className="text-[10px] text-zinc-500 font-mono">{w.uid.substring(0, 8)}...</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-zinc-300 font-bold">₹{w.amount.toFixed(2)}</TableCell>
                      <TableCell className="text-emerald font-black emerald-glow">
                        ₹{(w.net_payout ?? (w.amount * (1 - systemSettings.commission / 100))).toFixed(2)}
                      </TableCell>
                      <TableCell className="max-w-[150px]">
                        <p className="text-[10px] text-zinc-500 truncate italic">
                          {users.find(u => u.uid === w.uid)?.bank_details || 'No bank info saved'}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          w.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                          w.status === 'rejected' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                          'bg-amber-500/10 text-amber-500 border-amber-500/20'
                        }>
                          {w.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right px-8">
                        {w.status === 'pending' && (
                          <div className="flex justify-end gap-2 transition-all">
                            <Button size="sm" onClick={() => handleApprove(w.id)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-8 px-4 rounded-lg shadow-lg shadow-emerald-900/20 active:scale-95 transition-transform">Approve</Button>
                            <Button size="sm" variant="destructive" onClick={() => {
                              setRejectingId(w.id);
                              setIsRejectDialogOpen(true);
                            }} className="font-bold h-8 px-4 rounded-lg shadow-lg shadow-red-900/20 active:scale-95 transition-transform">Reject</Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="vip" className="animate-in fade-in slide-in-from-top-2 duration-500">
          <Card className="border-white/5 bg-[#0a0a0a] shadow-2xl overflow-hidden p-8">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {vipRequests.length === 0 ? (
                  <div className="col-span-full py-20 text-center text-zinc-400 italic">No VIP requests in queue</div>
                ) : (
                  vipRequests.map((r) => (
                    <div key={r.id} className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/20 transition-all group">
                       <div className="flex items-center justify-between mb-4">
                          <Badge className={r.status === 'approved' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-amber-500/20 text-amber-500'}>
                            {r.status.toUpperCase()}
                          </Badge>
                          <Crown className={`w-5 h-5 ${r.status === 'approved' ? 'text-gold gold-glow' : 'text-zinc-500'}`} />
                       </div>
                       <h3 className="text-lg font-black text-white italic">{r.userName}</h3>
                       <div className="mt-4 space-y-2">
                          <label className="text-[10px] text-amber-200/60 uppercase font-black">Transaction ID / UTR</label>
                          <div className="p-2 bg-black border border-white/10 rounded flex items-center justify-between">
                             <code className="text-xs text-gold">{r.transactionId}</code>
                             <Button variant="ghost" size="icon" onClick={() => navigator.clipboard.writeText(r.transactionId)} className="h-6 w-6 text-zinc-400 hover:text-white">
                               <Copy className="w-3 h-3" />
                             </Button>
                          </div>
                       </div>
                       <div className="mt-6 flex gap-2 pt-6 border-t border-white/5">
                          {r.status === 'pending' && (
                            <Button onClick={() => handleApproveVip(r.id)} className="flex-1 bg-primary text-primary-foreground font-black italic">
                              ACTIVATE VIP
                            </Button>
                          )}
                          <Button variant="outline" className="border-white/10 text-zinc-400 hover:bg-white/5">
                            Details
                          </Button>
                       </div>
                    </div>
                  ))
                )}
             </div>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="animate-in fade-in slide-in-from-top-2 duration-500">
           <Card className="border-white/5 bg-[#0a0a0a] shadow-2xl overflow-hidden">
             <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="text-zinc-400 uppercase text-[10px] tracking-widest py-6 px-8">User Account</TableHead>
                    <TableHead className="text-zinc-400 uppercase text-[10px] tracking-widest py-6">Finances</TableHead>
                    <TableHead className="text-zinc-400 uppercase text-[10px] tracking-widest py-6">Authentication</TableHead>
                    <TableHead className="text-zinc-400 uppercase text-[10px] tracking-widest py-6">Privileges</TableHead>
                    <TableHead className="text-zinc-400 uppercase text-[10px] tracking-widest py-6 px-8 text-right">KYC Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                   {users.map((u) => (
                     <TableRow key={u.uid} className="border-white/5 hover:bg-white/[0.02] group transition-colors" id={`user-row-${u.uid}`}>
                        <TableCell className="py-6 px-8">
                           <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10 border border-white/10 shadow-lg">
                                 <AvatarFallback className="bg-primary/10 text-primary font-black">{u.name?.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                 <p className="font-black text-white italic">{u.name}</p>
                                 <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{u.uid}</p>
                              </div>
                           </div>
                        </TableCell>
                        <TableCell>
                           <p className="text-sm font-black text-emerald italic">₹{u.balance.toFixed(2)}</p>
                           <p className="text-[10px] text-zinc-500 uppercase mt-0.5">Withdrawable</p>
                        </TableCell>
                        <TableCell>
                           <p className="text-[11px] text-zinc-300 font-bold">{u.phone}</p>
                           <Badge variant="outline" className="mt-1 text-[9px] border-emerald-500/20 text-emerald-500 py-0 h-4">Verified</Badge>
                        </TableCell>
                        <TableCell>
                           <Button 
                              variant="ghost" 
                              onClick={() => toggleVip(u.uid, !!u.isVip)}
                              className="p-0 h-auto hover:bg-transparent"
                           >
                              {u.isVip ? (
                                <Badge className="bg-gold text-primary-foreground border-none font-black italic gold-glow px-3">VIP MEMBER</Badge>
                              ) : (
                                <Badge variant="outline" className="border-white/10 text-zinc-500 hover:border-primary hover:text-primary transition-all">Grant VIP</Badge>
                              )}
                           </Button>
                        </TableCell>
                        <TableCell className="text-right px-8">
                           {u.kyc_url ? (
                             <a 
                               href={u.kyc_url} 
                               target="_blank" 
                               rel="noreferrer" 
                               className="text-emerald hover:text-white flex items-center justify-end gap-1.5 transition-all text-[11px] font-bold uppercase"
                             >
                               <ShieldCheck className="w-3.5 h-3.5" />
                               View Identity
                               <ArrowUpRight className="w-3 h-3" />
                             </a>
                           ) : (
                             <div className="flex items-center justify-end gap-1.5 text-zinc-400 text-[10px] uppercase font-bold italic">
                               <XCircle className="w-3.5 h-3.5" />
                               Pending Upload
                             </div>
                           )}
                        </TableCell>
                     </TableRow>
                   ))}
                </TableBody>
             </Table>
           </Card>
        </TabsContent>

        <TabsContent value="activity" className="animate-in fade-in slide-in-from-top-2 duration-500">
           <Card className="border-white/5 bg-[#0a0a0a] shadow-2xl overflow-hidden">
             <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div>
                   <h3 className="text-lg font-black text-white italic uppercase tracking-tighter">CENTRAL ACTIVITY FEED</h3>
                   <p className="text-xs text-zinc-500 uppercase font-bold mt-1">Real-time engagement and support queries</p>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-500 border-none px-4 py-1 font-black italic">LIVE</Badge>
             </div>
             <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="text-zinc-400 uppercase text-[10px] tracking-widest py-6 px-8">Timestamp</TableHead>
                    <TableHead className="text-zinc-400 uppercase text-[10px] tracking-widest py-6">Context</TableHead>
                    <TableHead className="text-zinc-400 uppercase text-[10px] tracking-widest py-6">Message / Details</TableHead>
                    <TableHead className="text-zinc-400 uppercase text-[10px] tracking-widest py-6 px-8 text-right">User</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                   {enquiries.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="py-20 text-center text-zinc-600 font-mono text-sm italic whitespace-pre-wrap">
                          {"// No recent activity detected"}
                        </TableCell>
                      </TableRow>
                   ) : (
                     enquiries.map((e) => (
                       <TableRow key={e.id} className="border-white/5 hover:bg-white/[0.02] group transition-colors" id={`activity-row-${e.id}`}>
                          <TableCell className="py-6 px-8 text-zinc-500 font-mono text-[10px]">
                             {new Date(e.timestamp).toLocaleString()}
                          </TableCell>
                          <TableCell>
                             <Badge variant="outline" className="border-primary/20 text-primary font-bold px-2 py-0 text-[9px] uppercase">SUPPORT QUERY</Badge>
                          </TableCell>
                          <TableCell className="max-w-md">
                             <p className="text-sm text-zinc-300 font-medium line-clamp-2 italic">"{e.enquiry}"</p>
                             <div className="flex gap-4 mt-2">
                                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest flex items-center gap-1"><Mail className="w-3 h-3" /> {e.email}</span>
                                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest flex items-center gap-1"><Phone className="w-3 h-3" /> {e.contactNumber}</span>
                             </div>
                          </TableCell>
                          <TableCell className="text-right px-8 font-black text-white italic text-xs uppercase tracking-tighter">
                             {e.name}
                          </TableCell>
                       </TableRow>
                     ))
                   )}
                </TableBody>
             </Table>
           </Card>
        </TabsContent>

        <TabsContent value="settings" className="animate-in fade-in slide-in-from-top-2 duration-500">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="border-white/5 bg-[#0a0a0a] shadow-2xl p-8 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                    <Settings className="w-24 h-24 text-white" />
                 </div>
                 <h3 className="text-lg font-black text-white italic uppercase tracking-tighter mb-6 flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-primary" />
                    CORE SYSTEM PARAMETERS
                 </h3>
                 <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                       <div>
                          <p className="text-[10px] font-black text-amber-200/60 uppercase tracking-widest">Tax Deduction</p>
                          <p className="text-xl font-bold text-white">{systemSettings.commission}%</p>
                       </div>
                       <Button variant="ghost" size="sm" onClick={() => openConfig('commission', 'Tax Deduction', systemSettings.commission)} className="text-primary hover:bg-primary/10">Configure</Button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                       <div>
                          <p className="text-[10px] font-black text-amber-200/60 uppercase tracking-widest">VIP Entry Threshold</p>
                          <p className="text-xl font-bold text-white">₹{systemSettings.vipThreshold.toFixed(2)}</p>
                       </div>
                       <Button variant="ghost" size="sm" onClick={() => openConfig('vipThreshold', 'VIP Entry Threshold', systemSettings.vipThreshold)} className="text-primary hover:bg-primary/10">Configure</Button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                       <div>
                          <p className="text-[10px] font-black text-amber-200/60 uppercase tracking-widest">Minimum Withdrawal</p>
                          <p className="text-xl font-bold text-white">₹{systemSettings.minWithdrawal.toFixed(2)}</p>
                       </div>
                       <Button variant="ghost" size="sm" onClick={() => openConfig('minWithdrawal', 'Minimum Withdrawal', systemSettings.minWithdrawal)} className="text-primary hover:bg-primary/10">Configure</Button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                        <div className="flex-1">
                           <p className="text-[10px] font-black text-amber-200/60 uppercase tracking-widest">Admin UPI ID</p>
                           <p className="text-lg font-bold text-white truncate max-w-[150px]">{systemSettings.upiId}</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => openConfig('upiId', 'Admin UPI ID', systemSettings.upiId, false)} className="text-primary hover:bg-primary/10">Edit ID</Button>
                     </div>
                     <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-4">
                        <div className="flex items-center justify-between">
                           <div>
                              <p className="text-[10px] font-black text-amber-200/60 uppercase tracking-widest">Payment QR Code</p>
                              <p className="text-[10px] text-zinc-500 font-bold uppercase mt-1">{systemSettings.qrUrl ? 'ACTIVE' : 'NOT SET'}</p>
                           </div>
                           <div className="flex items-center gap-2">
                             <input 
                                type="file" 
                                id="admin-qr-upload" 
                                className="hidden" 
                                accept="image/*"
                                onChange={handleQrUpload} 
                             />
                             <Button 
                                variant="ghost" 
                                size="sm" 
                                disabled={uploadingQr}
                                onClick={() => document.getElementById('admin-qr-upload')?.click()}
                                className="text-primary hover:bg-primary/10"
                             >
                                {uploadingQr ? 'Uploading...' : 'Upload New'}
                             </Button>
                           </div>
                        </div>
                        {systemSettings.qrUrl && (
                          <div className="flex justify-center bg-black/40 p-4 rounded-xl">
                            <img 
                              src={systemSettings.qrUrl} 
                              alt="Admin QR" 
                              className="w-24 h-24 rounded border border-white/10"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        )}
                     </div>
                 </div>
              </Card>

              <Card className="border-white/5 bg-[#0a0a0a] shadow-2xl p-8">
                 <h3 className="text-lg font-black text-white italic uppercase tracking-tighter mb-6">INFRASTRUCTURE STATUS</h3>
                 <div className="space-y-4">
                    <div className="flex items-center gap-4">
                       <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                       <span className="text-xs font-bold text-zinc-300">Firebase Auth Engine: STABLE</span>
                    </div>
                    <div className="flex items-center gap-4">
                       <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                       <span className="text-xs font-bold text-zinc-300">Firestore Persistence: OPTIMIZED</span>
                    </div>
                    <div className="flex items-center gap-4">
                       <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                       <span className="text-xs font-bold text-zinc-300">Cloud Function Edge: DEPLOYED</span>
                    </div>
                    <div className="mt-8 p-4 bg-zinc-900 rounded-xl border border-white/5">
                       <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Build Identifier</p>
                       <p className="text-xs font-mono text-zinc-400">RUP-MAIN-2026-04-18-INDIA</p>
                    </div>
                 </div>
              </Card>
           </div>
        </TabsContent>
      </Tabs>

      {/* Reject Reason Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="bg-[#0a0a0a] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-black italic text-destructive">REJECT WITHDRAWAL</DialogTitle>
            <DialogDescription className="text-zinc-400">Please provide a valid reason for rejection.</DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <Label htmlFor="reason" className="text-zinc-500 uppercase text-[10px] font-black tracking-widest mb-2 block">Reason for Rejection</Label>
            <textarea 
               id="reason"
               className="w-full h-32 bg-black border border-white/10 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-destructive/50"
               placeholder="Example: Incorrect bank details, Suspicious activity..."
               value={rejectReason}
               onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
          <DialogFooter>
             <Button variant="ghost" onClick={() => setIsRejectDialogOpen(false)} className="text-zinc-500 hover:text-white hover:bg-white/5">Cancel Action</Button>
             <Button variant="destructive" onClick={handleReject} className="bg-destructive hover:bg-destructive/90 font-bold px-8">Confirm Rejection</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* System Config Dialog */}
      <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
        <DialogContent className="bg-[#0a0a0a] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-black italic text-primary uppercase">CONFIGURE SYSTEM</DialogTitle>
            <DialogDescription className="text-zinc-400">Update global platform parameters.</DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <div>
              <Label className="text-zinc-500 uppercase text-[10px] font-black tracking-widest mb-2 block">{configField?.label}</Label>
              <Input 
                type={configField?.isNumeric ? "number" : "text"}
                value={newConfigValue}
                onChange={(e) => setNewConfigValue(e.target.value)}
                className="bg-black border-white/10 text-white rounded-xl h-12 text-lg font-bold"
              />
            </div>
            <p className="text-[10px] text-zinc-600 uppercase tracking-widest italic font-medium">Changes take effect immediately for all users.</p>
          </div>
          <DialogFooter>
             <Button variant="ghost" onClick={() => setIsConfigDialogOpen(false)} className="text-zinc-500 hover:text-white hover:bg-white/5">Cancel</Button>
             <Button onClick={handleSaveConfig} className="bg-primary text-primary-foreground font-black px-8">UPDATE SYSTEM</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ModernStatCard({ label, value, trend, icon, color }: { label: string, value: string | number, trend: string, icon: React.ReactNode, color: string }) {
  const getColors = () => {
    switch(color) {
      case 'amber': return 'bg-amber-500/10 border-amber-500/20 text-amber-500';
      case 'gold': return 'bg-gold/10 border-gold/20 text-gold';
      case 'emerald': return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500';
      default: return 'bg-primary/10 border-primary/20 text-primary';
    }
  };

  return (
    <Card className="border-white/5 bg-[#0a0a0a] shadow-xl p-6 group hover:border-primary/20 transition-all duration-500 overflow-hidden relative">
      <div className="absolute -right-2 -bottom-2 opacity-5 scale-150 transform group-hover:scale-110 transition-transform duration-700">
        {icon}
      </div>
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-xl border ${getColors()}`}>
          {icon}
        </div>
        <div className="flex items-center gap-1.5">
           <div className={`w-1.5 h-1.5 rounded-full ${color === 'emerald' ? 'bg-emerald-500' : 'bg-zinc-700'}`} />
           <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{trend}</span>
        </div>
      </div>
      <div>
        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-tighter italic">{label}</p>
        <p className="text-3xl font-black text-white mt-1 group-hover:translate-x-1 transition-transform">{value}</p>
      </div>
    </Card>
  );
}

function StatCard({ label, value, icon }: { label: string, value: string | number, icon: React.ReactNode }) {
  return (
    <Card className="glass border-none shadow-xl">
      <CardContent className="p-6 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{label}</p>
          <p className="text-3xl font-black text-white mt-1">{value}</p>
        </div>
        <div className="p-3 bg-white/5 rounded-xl border border-white/10">
          {React.cloneElement(icon as React.ReactElement, { className: 'w-6 h-6' })}
        </div>
      </CardContent>
    </Card>
  );
}

// --- Referral Section ---
function ReferralSection({ user }: { user: UserData }) {
  const [earnings, setEarnings] = useState<any[]>([]);
  const [directReferrals, setDirectReferrals] = useState<UserData[]>([]);
  const [referralCount, setReferralCount] = useState(0);

  useEffect(() => {
    const qEarnings = query(collection(db, 'referral_earnings'), where('uid', '==', user.uid), orderBy('timestamp', 'desc'));
    const unsubEarnings = onSnapshot(qEarnings, (snapshot) => {
      setEarnings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Referral Earnings Listener Error:", error);
    });

    const qUsers = query(collection(db, 'users'), where('referredBy', '==', user.uid), orderBy('createdAt', 'desc'));
    const unsubUsers = onSnapshot(qUsers, (snapshot) => {
      setDirectReferrals(snapshot.docs.slice(0, 10).map(doc => ({ uid: doc.id, ...doc.data() } as UserData)));
      setReferralCount(snapshot.size);
    }, (error) => {
      console.error("Referral Users Listener Error:", error);
    });
    
    return () => { unsubEarnings(); unsubUsers(); };
  }, [user.uid]);

  const copyCode = () => {
    navigator.clipboard.writeText(user.referralCode);
    toast.success('Referral code copied!');
  };

  const shareReferral = async () => {
    const shareData = {
      title: 'Join RupeeRise',
      text: `Earn passive income by joining RupeeRise! Use my referral code: ${user.referralCode}`,
      url: window.location.origin
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        copyCode();
      }
    } catch (err) {
      copyCode();
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass border-none shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:rotate-12 transition-transform">
             <QrCode className="w-20 h-20" />
          </div>
          <CardContent className="p-6 relative z-10">
            <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest">Network Token</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-3xl font-black tracking-widest text-gold gold-glow">{user.referralCode}</span>
              <div className="flex gap-2">
                <Button size="icon" variant="ghost" onClick={copyCode} className="text-zinc-400 hover:text-white hover:bg-white/5 h-9 w-9 rounded-xl">
                  <Copy className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={shareReferral} className="text-zinc-400 hover:text-white hover:bg-white/5 h-9 w-9 rounded-xl">
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-none shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:-rotate-12 transition-transform">
             <Users className="w-20 h-20" />
          </div>
          <CardContent className="p-6 relative z-10">
            <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest">Direct Lineage</p>
            <p className="text-3xl font-black text-white mt-1 group-hover:translate-x-1 transition-transform">{referralCount} Users</p>
            <div className="mt-2 flex -space-x-2">
               {[1,2,3,4].map(i => (
                 <div key={i} className="w-6 h-6 rounded-full border-2 border-zinc-900 bg-zinc-800 flex items-center justify-center text-[8px] font-bold text-zinc-500">?</div>
               ))}
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-none shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
             <TrendingUp className="w-20 h-20" />
          </div>
          <CardContent className="p-6 relative z-10">
            <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest">Cumulative Yield</p>
            <p className="text-3xl font-black text-emerald mt-1 emerald-glow">₹{(user.totalReferralEarnings || 0).toFixed(2)}</p>
            <div className="h-1 w-full bg-white/5 rounded-full mt-4 overflow-hidden">
               <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: '70%' }}
                 className="h-full bg-emerald shadow-[0_0_10px_rgba(16,185,129,0.5)]"
               />
            </div>
          </CardContent>
        </Card>
      </div>

      {!user.isVip && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 glass border border-amber-500/20 rounded-2xl flex items-start gap-4 shadow-lg shadow-amber-900/10"
        >
          <div className="p-2 bg-amber-500/10 rounded-xl">
            <ShieldAlert className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <p className="text-sm font-black text-white italic tracking-wide uppercase">Elite Membership Required</p>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Your accounts current status is <span className="text-amber-500 font-bold uppercase">Standard</span>. 
              Referral yields are restricted to <span className="text-gold font-bold">VIP Members</span>. 
              Upgrade now to unlock 5-level recursive commission streams.
            </p>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass border-none shadow-xl overflow-hidden self-start">
          <CardHeader className="bg-white/5 border-b border-white/5 py-4 px-6">
            <CardTitle className="text-xs font-black text-white uppercase tracking-widest italic flex items-center gap-2">
               <History className="w-4 h-4 text-zinc-400" />
               Recent Yield Logs
            </CardTitle>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-zinc-500 uppercase text-[9px] font-black tracking-widest pl-6">Sector</TableHead>
                <TableHead className="text-zinc-500 uppercase text-[9px] font-black tracking-widest">Yield</TableHead>
                <TableHead className="text-zinc-500 uppercase text-[9px] font-black tracking-widest pr-6 text-right">Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {earnings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-12 text-zinc-600 text-[10px] uppercase font-black tracking-[0.2em] italic">No active data streams</TableCell>
                </TableRow>
              ) : (
                earnings.map((e) => (
                  <TableRow key={e.id} className="border-white/5 hover:bg-white/5 transition-colors">
                    <TableCell className="pl-6">
                      <Badge variant="outline" className="text-[9px] font-black border-white/10 text-primary/80 px-2 py-0.5 rounded-md italic">L{e.level} RECURSION</Badge>
                    </TableCell>
                    <TableCell className="font-black text-emerald italic">+₹{e.amount.toFixed(2)}</TableCell>
                    <TableCell className="text-[10px] text-zinc-500 pr-6 text-right font-mono">
                      {e.timestamp?.toDate().toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        <Card className="glass border-none shadow-xl overflow-hidden self-start">
          <CardHeader className="bg-white/5 border-b border-white/5 py-4 px-6">
            <CardTitle className="text-xs font-black text-white uppercase tracking-widest italic flex items-center gap-2">
               <Users className="w-4 h-4 text-zinc-400" />
               Your Direct Network
            </CardTitle>
          </CardHeader>
          <div className="p-0">
             {directReferrals.length === 0 ? (
                <div className="py-20 text-center">
                   <UserPlus className="w-10 h-10 text-zinc-800 mx-auto mb-4" />
                   <p className="text-[10px] text-zinc-600 uppercase font-black tracking-widest italic">No direct connections established</p>
                </div>
             ) : (
                <div className="divide-y divide-white/5">
                   {directReferrals.map((ref) => (
                      <div key={ref.id} className="p-4 hover:bg-white/5 transition-colors flex items-center justify-between px-6">
                         <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xs font-black">
                               {ref.name?.charAt(0) || '?'}
                            </div>
                            <div>
                               <p className="text-sm font-bold text-white italic">{ref.name || 'Anonymous'}</p>
                               <p className="text-[10px] text-zinc-500 font-mono tracking-widest">{ref.referralCode}</p>
                            </div>
                         </div>
                         <div className="text-right">
                            <p className="text-[10px] text-zinc-600 uppercase font-black mb-1">Status</p>
                            <Badge className={ref.isVip ? 'bg-gold/20 text-gold' : 'bg-zinc-800 text-zinc-500'}>
                               {ref.isVip ? 'ELITE' : 'STD'}
                            </Badge>
                         </div>
                      </div>
                   ))}
                </div>
             )}
          </div>
        </Card>
      </div>

      <div className="space-y-6 pt-10 border-t border-white/5">
        <div>
          <h3 className="text-2xl font-black text-white italic tracking-tighter flex items-center gap-3">
            <div className="w-1.5 h-8 bg-primary rounded-full shadow-[0_0_15px_rgba(212,175,55,0.4)]" />
            RECURSIVE REWARD ARCHITECTURE
          </h3>
          <p className="text-sm text-zinc-400 mt-3 leading-relaxed max-w-2xl font-medium">
            Unlock compounding passive yields through our 5-tier referral hierarchy. 
            Direct recruitments generate primary rewards, while secondary and tertiary expansions 
            fuel your long-term capital growth.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { level: 1, reward: 30, type: 'Direct Vector', desc: 'Direct connections initialized via your token.' },
              { level: 2, reward: 20, type: 'Tier-2 Expansion', desc: 'Yields from Level 1 network growth.' },
              { level: 3, reward: 15, type: 'Tier-3 Recursion', desc: '收益 from Level 2 network expansion.' },
              { level: 4, reward: 10, type: 'Tier-4 Node', desc: 'Secondary network residual yield.' },
              { level: 5, reward: 5, type: 'Terminal Node', desc: 'Deep network sustainability reward.' },
            ].map((l) => (
              <motion.div 
                whileHover={{ scale: 1.02 }}
                key={l.level} 
                className="flex items-center justify-between p-5 glass border border-white/5 rounded-2xl shadow-sm group cursor-default transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-zinc-900 to-black border border-white/10 flex items-center justify-center text-sm font-black text-gold group-hover:border-primary/40 transition-colors">
                    L{l.level}
                  </div>
                  <div>
                    <p className="text-sm font-black text-white tracking-wide uppercase italic">{l.type}</p>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">{l.desc}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-emerald emerald-glow">₹{l.reward}</span>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="p-6 bg-gradient-to-br from-zinc-900 via-black to-[#050505] text-white rounded-3xl shadow-2xl border border-white/5 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold to-transparent opacity-50" />
              <div className="absolute -right-8 -top-8 opacity-10 rotate-12">
                <Crown className="w-32 h-32 text-gold" />
              </div>
              <h4 className="text-sm font-black uppercase tracking-[0.2em] text-gold italic">Elite Network Status</h4>
              <p className="text-xs text-zinc-400 mt-4 leading-relaxed font-medium">
                Only <span className="text-white font-black italic underline decoration-gold/40">VIP OPERATIVES</span> are 
                cleared for recursive yield extraction. Standard accounts are restricted to node propagation only with zero accumulation.
              </p>
              <div className="mt-8 pt-6 border-t border-white/10 space-y-3">
                <div className="flex items-center gap-3 text-[10px] text-white font-black uppercase tracking-widest">
                  <div className="p-1 bg-emerald/10 rounded-md">
                     <CheckCircle2 className="w-3 h-3 text-emerald" />
                  </div>
                  <span>Perpetual License</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-white font-black uppercase tracking-widest">
                  <div className="p-1 bg-emerald/10 rounded-md">
                     <CheckCircle2 className="w-3 h-3 text-emerald" />
                  </div>
                  <span>5-Level Recursive Feed</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-white font-black uppercase tracking-widest">
                  <div className="p-1 bg-emerald/10 rounded-md">
                     <CheckCircle2 className="w-3 h-3 text-emerald" />
                  </div>
                  <span>Priority Node Support</span>
                </div>
              </div>
            </div>

            <div className="p-6 glass border border-emerald-500/10 rounded-3xl relative overflow-hidden group">
               <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <h4 className="text-sm font-black text-emerald italic uppercase tracking-widest flex items-center gap-2">
                 <Zap className="w-4 h-4 fill-emerald" />
                 Growth Protocol
              </h4>
              <p className="text-xs text-zinc-400 mt-3 leading-relaxed font-medium">
                Propagate your token across distributed social channels. As your nodes mature 
                and expand, your residual yield increases synchronously.
              </p>
              <div className="mt-6 flex justify-between items-center text-[9px] font-black text-zinc-600 uppercase tracking-widest">
                 <span>Active Status</span>
                 <div className="flex gap-1">
                    <div className="w-1 h-1 rounded-full bg-emerald animate-ping" />
                    <div className="w-1 h-1 rounded-full bg-emerald" />
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Profile & KYC ---
function ProfileSettings({ user }: { user: UserData }) {
  const [bankDetails, setBankDetails] = useState(user.bank_details || '');
  const [uploading, setUploading] = useState(false);

  const handleSaveBank = async () => {
    try {
      await updateDoc(doc(db, 'users', user.id), { 
        bank_details: bankDetails,
        updatedAt: serverTimestamp()
      });
      toast.success('Bank details updated!');
    } catch (error) {
      toast.error('Failed to save.');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const storageRef = ref(storage, `kyc/${user.uid}/${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      
      await updateDoc(doc(db, 'users', user.id), { 
        kyc_url: url,
        updatedAt: serverTimestamp()
      });
      toast.success('ID Document uploaded successfully!');
    } catch (error) {
      toast.error('Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="glass border-none shadow-xl">
        <CardHeader>
          <CardTitle className="text-base text-white">Bank Details</CardTitle>
          <CardDescription className="text-zinc-400">Where we should send your payouts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 pb-4 border-b border-white/5">
            <div className="space-y-1">
              <p className="text-[10px] text-zinc-400 uppercase font-black tracking-widest">Account ID</p>
              <p className="text-xs text-white font-mono truncate">{user.uid}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-zinc-400 uppercase font-black tracking-widest">Age</p>
              <p className="text-sm text-white font-bold">{user.age || 'N/A'}</p>
            </div>
            <div className="space-y-1 col-span-2">
              <p className="text-[10px] text-zinc-400 uppercase font-black tracking-widest">Registered Phone</p>
              <p className="text-sm text-white font-bold">{user.phone}</p>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-300">Account / Bank Info</Label>
            <textarea 
              className="w-full min-h-[100px] p-3 rounded-xl border border-white/10 bg-white/5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Bank Name, Account Number, IFSC/Routing Code..."
              value={bankDetails}
              onChange={(e) => setBankDetails(e.target.value)}
            />
          </div>
          <Button onClick={handleSaveBank} className="w-full bg-primary text-primary-foreground font-bold rounded-xl">Save Details</Button>
        </CardContent>
      </Card>

      <Card className="glass border-none shadow-xl">
        <CardHeader>
          <CardTitle className="text-base text-white">Identity Verification (KYC)</CardTitle>
          <CardDescription className="text-zinc-400">Upload a clear photo of your ID card</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-xl p-8 bg-white/5">
            {user.kyc_url ? (
              <div className="flex flex-col items-center gap-2">
                <CheckCircle2 className="w-12 h-12 text-emerald" />
                <span className="text-sm font-medium text-white">Document Uploaded</span>
                <a href={user.kyc_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">View Document</a>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <ShieldCheck className="w-12 h-12 text-zinc-600" />
                <input 
                  type="file" 
                  id="kyc-upload" 
                  className="hidden" 
                  onChange={handleFileUpload}
                  accept="image/*"
                />
                <Button variant="outline" disabled={uploading} onClick={() => document.getElementById('kyc-upload')?.click()} className="border-white/10 text-white hover:bg-white/5">
                  {uploading ? 'Uploading...' : 'Select File'}
                </Button>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Max size 5MB • JPG, PNG</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// --- Connect Us Section ---
function ConnectUs({ user }: { user: UserData }) {
  const [name, setName] = useState(user.name || '');
  const [contactNumber, setContactNumber] = useState(user.phone || '');
  const [email, setEmail] = useState('');
  const [enquiry, setEnquiry] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !contactNumber || !email || !enquiry) {
      return toast.error('All fields are required');
    }
    if (enquiry.split(/\s+/).length > 1000) {
      return toast.error('Enquiry must be within 1000 words');
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'enquiries'), {
        name,
        contactNumber,
        email,
        enquiry,
        uid: user.uid,
        timestamp: new Date().toISOString()
      });
      toast.success('Query logged. Our executive will reach out shortly.');
      setEnquiry('');
      setEmail('');
    } catch (error) {
      toast.error('Failed to submit enquiry.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800 shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-10 transition-opacity">
        <Share2 className="w-32 h-32 text-white" />
      </div>
      <CardHeader>
        <CardTitle className="text-xl font-black text-white italic tracking-widest flex items-center gap-2">
          <div className="w-1 h-6 bg-primary" />
          ELITE SUPPORT
        </CardTitle>
        <CardDescription className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest pl-3">Priority Concierge Connectivity</CardDescription>
      </CardHeader>
      <CardContent className="relative z-10">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-zinc-500 font-black text-[10px] uppercase tracking-widest">Full Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-black border-zinc-800 text-white rounded-lg h-11" />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-500 font-black text-[10px] uppercase tracking-widest">Phone Axis</Label>
              <Input value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} className="bg-black border-zinc-800 text-white rounded-lg h-11" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-500 font-black text-[10px] uppercase tracking-widest">Email Node</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-black border-zinc-800 text-white rounded-lg h-11" />
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-500 font-black text-[10px] uppercase tracking-widest">Enquiry Stream</Label>
            <textarea 
              className="w-full min-h-[120px] p-4 rounded-xl border border-zinc-800 bg-black text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all font-medium"
              placeholder="State your objective..."
              value={enquiry}
              onChange={(e) => setEnquiry(e.target.value)}
            />
            <div className="flex justify-between items-center px-1">
               <p className="text-[9px] text-zinc-600 uppercase font-black">{enquiry.split(/\s+/).filter(Boolean).length} / 1000 WORDS</p>
               <div className="flex gap-1">
                  <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                  <div className="w-1 h-1 rounded-full bg-primary/40" />
               </div>
            </div>
          </div>
          <Button type="submit" disabled={submitting} className="w-full bg-white text-zinc-950 hover:bg-zinc-200 font-black rounded-lg h-12 shadow-xl shadow-white/5 italic">
            {submitting ? 'TRANSMITTING...' : 'INTIATE CONNECTION'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// --- Complete Profile ---
function CompleteProfile({ user, onComplete }: { user: any, onComplete: (data: UserData) => void }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return toast.error('Full Name is mandatory');
    if (!phone.trim()) return toast.error('Mobile Number is mandatory');
    if (!age || parseInt(age) < 1) return toast.error('Valid Age is mandatory');
    if (!agreed) return toast.error('You must accept the Privacy Policy to continue');

    setSaving(true);
    try {
      const myReferralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const newUserData: any = {
        uid: user.uid,
        name: name.trim(),
        phone: phone.trim(),
        age: parseInt(age),
        balance: 0,
        role: 'user',
        referralCode: myReferralCode,
        totalReferralEarnings: 0,
        referredBy: referralCode.trim() || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(doc(db, 'users', user.uid), newUserData);
      onComplete({ id: user.uid, ...newUserData });
      toast.success('Account setup complete! Welcome.');
    } catch (error: any) {
      console.error('Setup Error:', error);
      toast.error('Failed to save profile: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md glass shadow-2xl border-white/10">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 bg-primary/10 rounded-full ring-4 ring-primary/20">
              <User className="w-12 h-12 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-black text-white italic">Create Your Profile</CardTitle>
          <CardDescription className="text-zinc-400">Please provide your details to start earning</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-zinc-300">Full Name *</Label>
            <Input placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} className="bg-zinc-900/50 border-zinc-800 text-white" />
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-300">Mobile Number *</Label>
            <Input placeholder="+91..." value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-zinc-900/50 border-zinc-800 text-white" />
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-300">Age *</Label>
            <Input type="number" placeholder="Enter your age" value={age} onChange={(e) => setAge(e.target.value)} className="bg-zinc-900/50 border-zinc-800 text-white" />
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-300">Referral Code (Optional)</Label>
            <Input placeholder="ENTER CODE" value={referralCode} onChange={(e) => setReferralCode(e.target.value.toUpperCase())} className="bg-zinc-900/50 border-zinc-800 text-white" />
          </div>

          <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-3">
            <div className="h-24 overflow-y-auto text-[10px] text-zinc-400 space-y-2 pr-2 scrollbar-thin scrollbar-thumb-zinc-800">
              <p className="font-bold text-zinc-300 uppercase tracking-widest">Privacy Policy</p>
              <p>By using RUPEERISE, you consent to the collection and use of your personal details (Name, Age, Phone) for account verification and service delivery.</p>
              <p>We take security seriously and do not share your data with unauthorized third parties.</p>
            </div>
            <div className="flex items-start gap-2 pt-2">
              <input 
                type="checkbox" 
                id="agree" 
                checked={agreed} 
                onChange={(e) => setAgreed(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border-zinc-800 bg-zinc-900 text-primary focus:ring-primary cursor-pointer"
              />
              <Label htmlFor="agree" className="text-[11px] leading-tight text-zinc-300 cursor-pointer">
                I have read and agree to the Privacy Policy and confirm that all details provided are correct.
              </Label>
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full bg-primary text-primary-foreground font-black text-lg h-12 rounded-xl gold-glow hover:scale-[1.02] transition-transform">
            {saving ? 'SETTING UP...' : 'LET\'S EARN'}
          </Button>
        </CardContent>
      </Card>
      <Toaster theme="dark" position="top-center" />
    </div>
  );
}


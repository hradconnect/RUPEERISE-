import React, { useState, useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured } from './supabase';
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
  ChevronLeft,
  TrendingUp,
  DollarSign,
  Activity,
  Menu,
  X as CloseIcon,
  Search,
  ArrowDownRight,
  ArrowRight,
  Settings,
  Mail,
  Phone,
  QrCode,
  UserPlus,
  ShieldAlert,
  Zap,
  ArrowLeft,
  RefreshCw,
  Download
} from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

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

function handleDatabaseError(error: unknown, operationType: OperationType, path: string | null, userId?: string) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: userId,
    },
    operationType,
    path
  }
  console.error('Database Error: ', JSON.stringify(errInfo));
  toast.error(`Database Error: ${errInfo.error}`);
}

// --- Types ---
interface UserData {
  id: string;
  name?: string;
  phone: string;
  age?: number;
  balance: number;
  kyc_url?: string;
  bank_details?: string;
  role: 'user' | 'admin';
  "isVip"?: boolean;
  email?: string;
  vipPurchasedAt?: string;
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

function DownloadAppButton() {
  const [apkUrl, setApkUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApkUrl = async () => {
      try {
        // Try 'global' first as it's used elsewhere, then fallback to id=1
        let { data, error } = await supabase
          .from('settings')
          .select('apkUrl, apkurl')
          .eq('id', 'global')
          .maybeSingle();
        
        if (!data || error) {
          const { data: altData } = await supabase
            .from('settings')
            .select('apkUrl, apkurl')
            .eq('id', '1')
            .maybeSingle();
          if (altData) data = altData;
        }
        
        if (data) {
          const url = data.apkUrl || data.apkurl;
          setApkUrl(url || null);
        }
      } catch (err) {
        console.error('Error fetching APK URL:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchApkUrl();
  }, []);

  const handleDownload = () => {
    if (apkUrl) {
      window.open(apkUrl, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center mt-8">
        <Button disabled className="bg-emerald-600/50 text-white font-black rounded-xl h-12 px-8 flex items-center gap-3 animate-pulse border border-emerald-500/20">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span className="tracking-widest italic">LOADING APK...</span>
        </Button>
      </div>
    );
  }

  if (!apkUrl) {
    return (
      <div className="flex justify-center mt-8">
        <Button disabled className="bg-zinc-800/80 border border-white/5 text-zinc-500 font-black rounded-xl h-12 px-8 flex items-center gap-3 italic tracking-tighter">
          <Download className="w-5 h-5" />
          UPDATE COMING SOON
        </Button>
      </div>
    );
  }

  return (
    <div className="flex justify-center mt-8">
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button 
          onClick={handleDownload}
          className="bg-gradient-to-br from-emerald-600 via-emerald-500 to-emerald-700 hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] text-white font-black rounded-xl h-14 px-10 flex items-center gap-4 transition-all duration-300 border border-emerald-400/30 group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-black/20 group-hover:bg-black/30 transition-colors">
             <Download className="w-5 h-5 text-gold group-hover:animate-bounce" />
          </div>
          <div className="flex flex-col items-start leading-none">
            <span className="text-[10px] text-emerald-200/80 font-black tracking-[0.2em] uppercase mb-0.5">Mobile Android</span>
            <span className="text-lg italic tracking-tighter">DOWNLOAD APP</span>
          </div>
        </Button>
      </motion.div>
    </div>
  );
}

function Logo({ className = "", onClick }: { className?: string, onClick?: () => void }) {
  return (
    <div 
      className={`flex items-center gap-2 select-none group focus:outline-none ${onClick ? 'cursor-pointer' : ''} ${className}`} 
      onClick={(e) => {
        e.preventDefault();
        onClick?.();
      }}
    >
      <div className="relative flex items-center justify-center w-10 h-10">
        <div className="absolute inset-0 rounded-full border-2 border-gold shadow-[0_0_15px_rgba(251,191,36,0.4)] opacity-80" />
        <div className="relative z-10 p-1.5 rounded-lg transition-all group-hover:scale-110 duration-300">
          <TrendingUp className="w-6 h-6 text-gold" />
        </div>
      </div>
      <span className="font-black text-2xl tracking-tighter italic flex items-center">
        <span className="text-white">RUPEE</span>
        <span className="text-gold ml-1">RISE</span>
      </span>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signingIn, setSigningIn] = useState(false);
  const [authCooldown, setAuthCooldown] = useState(0);

  useEffect(() => {
    if (authCooldown > 0) {
      const timer = setTimeout(() => setAuthCooldown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [authCooldown]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [adminTab, setAdminTab] = useState('withdrawals');
  const [isAdminUI, setIsAdminUI] = useState(false);
  const [systemSettings, setSystemSettings] = useState({
    commission: 10,
    vipThreshold: 99,
    minWithdrawal: 500,
    upiId: 'payment.admin@upi',
    qrUrl: '',
    apkUrl: ''
  });

  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('id', 'global')
        .single();

      if (data) {
        setSystemSettings({
          commission: data.commission ?? 10,
          vipThreshold: data.vipThreshold ?? 99,
          minWithdrawal: data.minWithdrawal ?? 500,
          upiId: data.upiId ?? 'payment.admin@upi',
          qrUrl: data.qrUrl || data.qrurl || '',
          apkUrl: data.apkUrl || data.apkurl || ''
        });
      }
    };

    fetchSettings();

    const channel = supabase
      .channel('global-settings-app')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings', filter: 'id=eq.global' }, (payload) => {
        const data = payload.new as any;
        setSystemSettings({
          commission: data.commission ?? 10,
          vipThreshold: data.vipThreshold ?? 99,
          minWithdrawal: data.minWithdrawal ?? 500,
          upiId: data.upiId ?? 'payment.admin@upi',
          qrUrl: data.qrUrl ?? '',
          apkUrl: data.apkUrl ?? ''
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Auth Listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const supabaseUser = session?.user;
      if (supabaseUser) {
        setUser(supabaseUser);
      } else {
        setUser(null);
        setUserData(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // User Data Sync Effect
  useEffect(() => {
    if (!user) return;

    let isMounted = true;

    const fetchUserData = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!isMounted) return;

      if (data) {
        setUserData(data as any as UserData);
      } else {
        setUserData(null);
      }
      setLoading(false);
    };

    fetchUserData();

    const channel = supabase
      .channel(`user-data-${user.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'users',
        filter: `id=eq.${user.id}` 
      }, (payload) => {
        if (isMounted) {
          console.log('User data sync update:', payload.new);
          setUserData(payload.new as any as UserData);
        }
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const handleEmailAuth = async () => {
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }
    if (authCooldown > 0) {
      toast.error(`Please wait ${authCooldown}s before trying again.`);
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setSigningIn(true);
    try {
      if (authMode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        toast.success('Account created! Please check your email for verification.');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success('Login successful!');
      }
    } catch (error: any) {
      console.error('Email Auth Error:', error);
      let message = error.message || 'Authentication failed';
      if (message.includes('Invalid API key') || message.includes('apikey')) {
        message = 'Supabase API Key is invalid or missing. Please check your environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY).';
      } else if (message.includes('Email not confirmed')) {
        message = 'Your email is not yet confirmed. Please check your inbox for a verification link.';
      } else if (message.toLowerCase().includes('rate limit')) {
        message = 'Slow down! Too many requests. Please wait a few minutes before trying again.';
        setAuthCooldown(60); // 1 minute cooldown for rate limit
      } else {
        setAuthCooldown(10); // Standard 10s cooldown for other errors to prevent spam
      }
      toast.error(message);
    } finally {
      setSigningIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  const handleGoogleLogin = async () => {
    if (signingIn) return;
    setSigningIn(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (error: any) {
      console.error('Google Login Error:', error);
      toast.error('Failed to login with Google: ' + error.message);
    } finally {
      setSigningIn(false);
    }
  };

  const handleAdminSync = async () => {
    if (!user) return;
    setSigningIn(true);
    try {
      const res = await fetch('/api/admin/promote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user.id })
      });
      if (res.ok) {
        toast.success('Admin role synchronized! Refreshing profile...');
        // Refresh local user data
        const { data } = await supabase.from('users').select('*').eq('id', user.id).single();
        if (data) setUserData(data as any as UserData);
      } else {
        const err = await res.json();
        toast.error(err.error || 'Promotion failed');
      }
    } catch (error: any) {
      toast.error('Sync failed: ' + error.message);
    } finally {
      setSigningIn(false);
    }
  };

  const superAdminEmails = ['ashishnehra450@gmail.com'];
  const isSuper = user && user.email && superAdminEmails.includes(user.email.toLowerCase());

  const isDev = userData && (isSuper || userData.role === 'admin');

  // Logo strictly redirects to dashboard and closes admin UI
  const handleLogoClick = () => {
    setActiveTab('dashboard');
    if (isAdminUI) setIsAdminUI(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#020617]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-400 drop-shadow-[0_0_10px_rgba(56,189,248,0.5)]"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-[#020617] scrollbar-hide">
        {/* Dynamic Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#020617] via-[#0c4a6e] to-[#1e1b4b] -z-10" />
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-sky-500/10 rounded-full blur-[120px] -z-10 animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] -z-10 animate-pulse delay-1000" />
        
        {/* Configuration Warning */}
        {!isSupabaseConfigured && (
          <div className="fixed top-4 left-4 right-4 z-[100] animate-in slide-in-from-top duration-500">
            <div className="max-w-xl mx-auto bg-amber-500/15 border border-amber-500/30 backdrop-blur-xl rounded-2xl p-4 flex items-center gap-4 shadow-2xl">
              <div className="p-2 bg-amber-500/20 rounded-full text-amber-500">
                <ShieldAlert className="w-5 h-5 shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] leading-none mb-1">System Notice</p>
                <p className="text-[11px] text-amber-200/80 font-bold">Supabase credentials missing. Authentication is currently disabled. Please configure secrets.</p>
              </div>
            </div>
          </div>
        )}

        <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in-95 duration-700">
          <Card className="border-white/10 bg-black/40 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden border">
            <CardHeader className="text-center pt-10 pb-6">
              <motion.div 
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="flex flex-col items-center gap-6"
              >
                <Logo className="scale-[1.5]" />
                <Badge variant="outline" className="border-sky-500/30 bg-sky-500/10 text-sky-400 text-[9px] font-black tracking-[0.4em] px-4 py-1">
                  FINANCIAL ASCENSION
                </Badge>
              </motion.div>
              <CardDescription className="text-sky-200/60 mt-6 font-medium">
                {authMode === 'login' ? 'Welcome back! Log in to continue' : 'Join RupeeRise and start earning'}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6 px-8">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-[11px] font-black text-sky-400 tracking-widest uppercase ml-1">Email Address</Label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-500/50 group-focus-within:text-sky-400 transition-colors" />
                    <Input 
                      id="email" 
                      type="email"
                      placeholder="name@example.com" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-sky-950/40 border-white/5 text-white placeholder:text-sky-700 pl-11 rounded-xl h-12 focus:border-sky-500/50 focus:ring-sky-500/20"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-[11px] font-black text-sky-400 tracking-widest uppercase ml-1">Password</Label>
                  <div className="relative group">
                    <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-500/50 group-focus-within:text-sky-400 transition-colors" />
                    <Input 
                      id="password" 
                      type="password"
                      placeholder="••••••••" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-sky-950/40 border-white/5 text-white placeholder:text-sky-700 pl-11 rounded-xl h-12 focus:border-sky-500/50 focus:ring-sky-500/20"
                    />
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleEmailAuth} 
                disabled={signingIn || authCooldown > 0} 
                className="w-full bg-gradient-to-br from-sky-500 to-indigo-600 hover:shadow-[0_10px_25px_rgba(56,189,248,0.3)] text-white font-black h-12 rounded-xl transition-all duration-300 active:scale-95"
              >
                {signingIn ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : authCooldown > 0 ? (
                  `WAIT ${authCooldown}S`
                ) : (
                  <span className="flex items-center gap-2">
                    {authMode === 'login' ? <ArrowRight className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                    {authMode === 'login' ? 'ACCESS ACCOUNT' : 'CREATE ACCOUNT'}
                  </span>
                )}
              </Button>

              <div className="text-center">
                <button 
                  onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                  className="text-[11px] text-sky-400/60 hover:text-sky-400 font-bold transition-all uppercase tracking-widest"
                >
                  {authMode === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Login"}
                </button>
              </div>

              <div className="relative pt-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-white/5"></span>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-black/0 px-4 text-[9px] font-black text-sky-500/30 uppercase tracking-[0.3em]">Quick Access</span>
                </div>
              </div>

              <Button 
                variant="outline" 
                onClick={handleGoogleLogin} 
                className="w-full border-white/10 bg-white/5 text-white hover:bg-white/10 font-black h-12 rounded-xl group transition-all"
              >
                <div className="bg-white rounded-full p-1 mr-3 flex items-center justify-center">
                  <svg className="w-3 h-3" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                </div>
                CONTINUE WITH GOOGLE
              </Button>
            </CardContent>
            
            <CardFooter className="pb-10 pt-2 flex justify-center">
              <p className="text-[10px] text-sky-400/30 font-bold tracking-tighter">
                &copy; 2026 RupeeRise Platforms. Secure & Encrypted.
              </p>
            </CardFooter>
          </Card>
          
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
            <DownloadAppButton />
          </div>
        </div>
        
        <Toaster theme="dark" position="top-center" richColors />
      </div>
    );
  }

  if (!userData || !userData.name || !userData.phone || !userData.age || userData.name === '' || userData.phone === '') {
    return (
      <CompleteProfile user={user} onComplete={(data) => setUserData(data)} />
    );
  }

  if (isSuper && userData.role === 'admin' && isAdminUI) {
    return (
      <AdminLayout 
        admin={userData} 
        onLogout={handleLogout} 
        activeTab={adminTab} 
        onTabChange={setAdminTab}
        onSwitchToUser={() => setIsAdminUI(false)}
      >
        <AdminDashboard 
          admin={userData} 
          activeTab={adminTab} 
          onTabChange={setAdminTab} 
          systemSettings={systemSettings} 
          setSystemSettings={setSystemSettings}
        />
      </AdminLayout>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#020617] relative">
      <header className="glass border-b border-white/5 sticky top-0 z-50 shrink-0">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo onClick={handleLogoClick} />
            <div className="hidden lg:flex items-center gap-6 ml-8">
              <button onClick={() => setActiveTab('dashboard')} className={`text-[9px] font-black tracking-[0.2em] uppercase transition-all ${activeTab === 'dashboard' ? 'text-sky-400' : 'text-sky-400/30 hover:text-sky-400'}`}>OVERVIEW</button>
              <button onClick={() => setActiveTab('earn')} className={`text-[9px] font-black tracking-[0.2em] uppercase transition-all ${activeTab === 'earn' ? 'text-sky-400' : 'text-sky-400/30 hover:text-sky-400'}`}>EARN</button>
              <button onClick={() => setActiveTab('referral')} className={`text-[9px] font-black tracking-[0.2em] uppercase transition-all ${activeTab === 'referral' ? 'text-sky-400' : 'text-sky-400/30 hover:text-sky-400'}`}>REFERRAL</button>
              <button onClick={() => setActiveTab('wallet')} className={`text-[9px] font-black tracking-[0.2em] uppercase transition-all ${activeTab === 'wallet' ? 'text-sky-400' : 'text-sky-400/30 hover:text-sky-400'}`}>WALLET</button>
              <button onClick={() => setActiveTab('profile')} className={`text-[9px] font-black tracking-[0.2em] uppercase transition-all ${activeTab === 'profile' ? 'text-sky-400' : 'text-sky-400/30 hover:text-sky-400'}`}>PROFILE</button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {isSuper && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsAdminUI(true)}
                className="border-sky-500/50 text-white hover:bg-sky-500/10 flex items-center gap-2 font-black italic tracking-tighter px-2 sm:px-4"
              >
                <ShieldCheck className="w-4 h-4 text-sky-400" />
                <span className="hidden sm:inline">ADMIN PANEL</span>
                <span className="sm:hidden text-[10px]">ADMIN</span>
              </Button>
            )}
            {userData["isVip"] && (
              <Badge className="bg-gold/20 text-gold border-gold/30 gold-glow font-black italic tracking-tighter py-1 px-3">
                <Crown className="w-3.5 h-3.5 animate-pulse" />
                VIP MEMBER
              </Badge>
            )}
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
              <Wallet className="w-4 h-4 text-sky-400" />
              <span className="text-sm font-bold text-white">₹{userData.balance.toFixed(2)}</span>
            </div>

            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-sky-400 hover:text-white hover:bg-white/10">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar for User View */}
        <aside className="hidden lg:flex w-20 flex-col border-r border-white/5 bg-black/20 backdrop-blur-3xl shrink-0">
          <div className="flex-1 py-12 flex flex-col items-center gap-8">
            <SidebarIcon active={activeTab === 'dashboard'} icon={<LayoutDashboard />} onClick={() => setActiveTab('dashboard')} label="Overview" />
            <SidebarIcon active={activeTab === 'earn'} icon={<PlayCircle />} onClick={() => setActiveTab('earn')} label="Earn Money" />
            <SidebarIcon active={activeTab === 'referral'} icon={<Users />} onClick={() => setActiveTab('referral')} label="Network" />
            <SidebarIcon active={activeTab === 'wallet'} icon={<Wallet />} onClick={() => setActiveTab('wallet')} label="Capital" />
            <SidebarIcon active={activeTab === 'profile'} icon={<User />} onClick={() => setActiveTab('profile')} label="My Account" />
            
            {systemSettings.apkUrl && (
              <div className="mt-auto mb-8 flex flex-col items-center">
                <SidebarIcon 
                  active={false} 
                  icon={<Download className="w-5 h-5 text-gold animate-bounce" />} 
                  onClick={() => {
                    toast.success("Starting App Download...");
                    window.open(systemSettings.apkUrl);
                  }} 
                  label="Get App" 
                />
              </div>
            )}
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto custom-scrollbar bg-[#020617]/50">
          <div className="max-w-7xl mx-auto p-4 md:p-8 pb-40 lg:pb-12">
            <UserDashboard 
              user={userData} 
              activeTab={activeTab} 
              isAdminUI={isAdminUI}
              setIsAdminUI={setIsAdminUI}
              onTabChange={setActiveTab}
              handleAdminSync={handleAdminSync}
              signingIn={signingIn}
              systemSettings={systemSettings}
            />
          </div>
        </main>
      </div>

      {/* Mobile Navigation */}
      <nav className="lg:hidden fixed bottom-6 left-6 right-6 bg-black/90 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] flex items-center justify-around z-[100] p-4 shadow-2xl">
        <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard />} label="HOME" />
        <NavButton active={activeTab === 'earn'} onClick={() => setActiveTab('earn')} icon={<PlayCircle />} label="EARN" />
        <NavButton active={activeTab === 'referral'} onClick={() => setActiveTab('referral')} icon={<Users />} label="NETWORK" />
        <NavButton active={activeTab === 'wallet'} onClick={() => setActiveTab('wallet')} icon={<Wallet />} label="WALLET" />
        <NavButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={<User />} label="PROFILE" />
      </nav>

      <Toaster position="top-center" theme="dark" />
    </div>
  );
}


// --- User Dashboard ---
function UserDashboard({ user, activeTab, isAdminUI, setIsAdminUI, onTabChange, handleAdminSync, signingIn, systemSettings }: { user: UserData, activeTab: string, isAdminUI: boolean, setIsAdminUI: (val: boolean) => void, onTabChange: (tab: string) => void, handleAdminSync: () => void, signingIn: boolean, systemSettings: any }) {
  const isSuper = user.email === 'ashishnehra450@gmail.com' || user.id === 'ashishnehra450@gmail.com';
  const isAdmin = user.role === 'admin';
  const isDev = isSuper || isAdmin;

  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [isWatching, setIsWatching] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    const fetchWithdrawals = async () => {
      const { data, error } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('uid', user.id)
        .order('timestamp', { ascending: false });

      if (data) {
        setWithdrawals(data as any as Withdrawal[]);
      }
    };

    fetchWithdrawals();

    const channel = supabase
      .channel(`user-withdrawals-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'withdrawals', filter: `uid=eq.${user.id}` }, () => {
        fetchWithdrawals();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user.id]);

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
            uid: user.id,
            adNetwork: 'admob' 
          })
        });
        const data = await res.json();
        if (data.success) {
          toast.success(`Reward earned: ₹${data.reward.toFixed(2)}`);
          setCooldown(30); // 30s cooldown
        } else {
          console.error('Reward API Error:', data);
          toast.error(data.error || 'Failed to claim reward');
        }
      } catch (error) {
        toast.error('AdMob reward failed.');
      } finally {
        setIsWatching(false);
      }
    }, 5000);
  };

  const handleRequestWithdrawal = async () => {
    const isVip = user?.["isVip"];
    const threshold = isVip ? 200 : systemSettings.minWithdrawal;
    if (user && user.balance < threshold) {
      toast.error(`Minimum withdrawal for ${isVip ? 'VIP' : 'Regular'} members is ₹${threshold.toFixed(2)}`);
      return;
    }

    try {
      const { error } = await supabase.from('withdrawals').insert({
        uid: user.id,
        userName: user?.name || 'User',
        amount: user?.balance || 0,
        status: 'pending',
        timestamp: new Date().toISOString(),
      });
      if (error) throw error;
      toast.success('Withdrawal request submitted!');
    } catch (error) {
      handleDatabaseError(error, OperationType.CREATE, 'withdrawals', user.id);
    }
  };

  const [isVipDialogOpen, setIsVipDialogOpen] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [requestingVip, setRequestingVip] = useState(false);

  const handleVipRequest = async () => {
    if (!transactionId.trim()) return toast.error('Transaction ID is required');
    setRequestingVip(true);
    console.log('Submitting VIP request:', { uid: user.id, userName: user.name, transactionId });
    try {
      const res = await fetch('/api/vip/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          uid: user.id, 
          userName: user.name || 'User',
          transactionId 
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`VIP request submitted (Ref: ${transactionId.substring(0, 5)}...)! Admin will verify soon.`);
        setIsVipDialogOpen(false);
        setTransactionId('');
      } else {
        console.error('VIP Request API Error:', data);
        toast.error(data.error || 'Failed to submit request.');
      }
    } catch (error) {
      console.error('VIP Request Catch Error:', error);
      toast.error('Error submitting request.');
    } finally {
      setRequestingVip(false);
    }
  };

  return (
    <div className="space-y-6 text-white">
      {/* GLOBAL MEMBERSHIP STATUS HEADER */}
        <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative overflow-hidden rounded-[2rem] border p-0.5 transition-all duration-700 ${user["isVip"] ? 'border-gold/40 shadow-[0_0_40px_rgba(251,191,36,0.15)] bg-gold/10' : 'border-sky-800 bg-sky-950/40'}`}
      >
        <div className={`px-6 py-5 rounded-[1.9rem] flex items-center justify-between relative z-10 backdrop-blur-3xl ${user["isVip"] ? 'bg-gradient-to-br from-sky-900/90 via-sky-900/95 to-sky-950' : 'bg-sky-950/60'}`}>
          <div className="flex items-center gap-5">
            <div className={`relative ${user["isVip"] ? 'text-gold' : 'text-sky-600'}`}>
              {user["isVip"] && <div className="absolute inset-0 blur-lg bg-gold/40 animate-pulse rounded-full" />}
              <div className={`p-4 rounded-2xl relative z-10 ${user["isVip"] ? 'bg-gold/10 border border-gold/30' : 'bg-sky-800/50 border border-sky-700/50'}`}>
                <Crown className={`w-8 h-8 ${user["isVip"] ? 'animate-bounce' : ''}`} />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className={`text-[10px] font-black uppercase tracking-[0.4em] ${user["isVip"] ? 'text-gold' : 'text-sky-500'}`}>
                  {user["isVip"] ? 'ELITE STATUS' : 'BASIC CLEARANCE'}
                </span>
                {user["isVip"] && <Badge className="bg-gold/20 text-gold border-gold/30 text-[8px] font-black uppercase tracking-tighter h-4 px-1.5 flex items-center justify-center">VERIFIED</Badge>}
              </div>
              <h1 className={`text-3xl font-black italic tracking-tighter leading-none ${user["isVip"] ? 'text-gold gold-glow' : 'text-zinc-400'}`}>
                {user["isVip"] ? 'VIP MEMBERSHIP' : 'STANDARD MEMBER'}
              </h1>
            </div>
          </div>

          <div className="hidden md:flex flex-col items-end">
            {user["isVip"] ? (
              <>
                <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  REVENUE STREAM ACTIVE
                </div>
                <div className="flex items-center gap-2 bg-white/5 py-1 px-3 rounded-full border border-white/5">
                    <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[10px] font-mono text-zinc-400">UID: {user.id.slice(0, 8)}...</span>
                  </div>
              </>
            ) : (
              <Button 
                onClick={() => onTabChange('earn')}
                className="bg-gold hover:bg-gold/80 text-black font-black italic tracking-tighter px-8 py-6 rounded-2xl shadow-[0_10px_30px_rgba(251,191,36,0.3)] hover:scale-[1.02] transition-all text-base"
              >
                UPGRADE TO VIP →
              </Button>
            )}
          </div>
        </div>
        {/* Decorative elements */}
        {user["isVip"] && (
          <>
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] -mr-32 -mt-32 rounded-full" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/5 blur-[60px] -ml-16 -mb-16 rounded-full" />
          </>
        )}
      </motion.div>

      {activeTab === 'dashboard' && (
        <>
          {user["isVip"] ? (
            <div className="mb-0 overflow-hidden relative">
               {/* Redundant banner removed in favor of global header */}
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="group relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-amber-500 via-primary to-orange-700 p-0.5 shadow-2xl transition-all duration-500 hover:shadow-primary/30 mb-8"
            >
              <div className="relative z-10 flex flex-col items-center justify-between gap-8 bg-zinc-950/20 backdrop-blur-2xl px-8 py-10 rounded-[2.4rem] md:flex-row">
                 <div className="flex-1 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-4 mb-4">
                       <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10 shadow-xl">
                          <Crown className="w-10 h-10 text-white" />
                       </div>
                       <Badge className="bg-white/20 text-white border-white/30 font-black italic tracking-tighter px-4 py-1">LIMITED TIME OFFER</Badge>
                    </div>

                    <h2 className="text-4xl md:text-5xl font-black text-white italic tracking-tighter leading-none mb-3 drop-shadow-[0_2px_10px_rgba(251,191,36,0.3)]">
                       VIP MEMBERSHIP
                    </h2>
                    <p className="text-white/80 font-bold text-sm md:text-base max-w-lg">
                       Unlock the recursive 6-level referral commission engine and double your task rewards instantly. Join the elite network.
                    </p>
                    <div className="flex flex-wrap gap-3 mt-6 justify-center md:justify-start">
                       {['6-TIER COMMISSIONS', '2X AD REWARDS', 'PRIORITY PAYOUTS'].map(perk => (
                         <div key={perk} className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[9px] font-black text-white/90 tracking-widest">{perk}</div>
                        ))}

                    </div>
                 </div>


                 <div className="flex flex-col items-center gap-4 min-w-[200px]">
                    <div className="text-center">
                       <p className="text-[10px] font-black text-white/60 uppercase tracking-[0.3em] mb-1">Lifetime Access</p>
                       <p className="text-6xl font-black text-white tracking-tighter drop-shadow-lg">₹{systemSettings.vipThreshold}</p>
                    </div>
                    <Dialog open={isVipDialogOpen} onOpenChange={setIsVipDialogOpen}>
                      <DialogTrigger className="w-full">
                        <div className="w-full bg-gold text-black hover:bg-gold/90 font-black text-xl h-16 rounded-3xl shadow-2xl hover:scale-105 transition-all shadow-gold/20 flex items-center justify-center cursor-pointer">
                          GET VIP ACCESS
                        </div>
                      </DialogTrigger>
                      <DialogContent className="glass text-white border-white/10">
                        <DialogHeader>
                          <DialogTitle className="text-gold text-2xl font-black italic">VIP UPGRADE</DialogTitle>
                    <DialogDescription className="text-sky-300">
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
                    <div className="p-4 bg-sky-900/50 rounded-xl border border-sky-800 text-center">
                      <p className="text-sm text-sky-400 uppercase tracking-widest mb-1">Admin UPI ID</p>
                      <p className="text-xl font-black text-gold">{systemSettings.upiId}</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="txid" className="text-sky-200">Transaction ID / UTR</Label>
                      <Input 
                        id="txid" 
                        placeholder="Enter 12-digit UTR number" 
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        className="bg-sky-900 border-sky-800 text-white"
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
                  </div>
               </div>



              {/* Background patterns */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-10 pointer-events-none">
                 <div className="absolute top-0 right-0 p-12">
                    <TrendingUp className="w-64 h-64 text-white" />
                 </div>
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className={`lg:col-span-1 bg-gradient-to-br from-sky-800 to-sky-950 border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden group border ${user["isVip"] ? 'ring-2 ring-sky-400/30' : ''}`}>
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
                <Wallet className="w-32 h-32 text-sky-400" />
              </div>
              
              <CardHeader className="pb-2 relative z-10">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-400/60">Available Capital</span>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <TrendingUp className="w-3 h-3 text-emerald-500" />
                    <span className="text-[9px] font-bold text-emerald-500">+4.2%</span>
                  </div>
                </div>

                <CardTitle className="text-5xl font-black text-white flex items-baseline gap-1 mt-4 italic tracking-tighter shadow-sm gold-glow-intense">
                  <span className="text-2xl text-gold font-bold not-italic">₹</span>
                  {user.balance.toFixed(2)}
                </CardTitle>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-[10px] text-sky-400 font-mono uppercase tracking-widest pl-1">Settlement Pending: ₹0.00</p>
                  {user["isVip"] && (
                    <Badge className="bg-primary/20 text-primary border-none text-[9px] font-black py-0 px-2 italic">VIP BOOST</Badge>
                  )}
                </div>
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

            {/* Download App Card */}
            {systemSettings.apkUrl && (
              <Card className="lg:col-span-1 bg-gradient-to-br from-indigo-900/40 to-black border-gold/20 shadow-2xl relative overflow-hidden group border">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                  <Download className="w-32 h-32 text-gold animate-pulse" />
                </div>
                <CardHeader className="pb-2 relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-gold/20 text-gold border-gold/30 text-[8px] font-black tracking-widest px-2 py-0">OFFICIAL APP</Badge>
                  </div>
                  <CardTitle className="text-3xl font-black text-white italic tracking-tighter shadow-sm gold-glow">ANDROID APP</CardTitle>
                  <p className="text-[10px] text-zinc-400 font-bold uppercase mt-1">Download for a better experience</p>
                </CardHeader>
                <CardContent className="mt-6 relative z-10">
                  <Button 
                    onClick={() => {
                      toast.success("Downloading Android Application...");
                      window.open(systemSettings.apkUrl);
                    }} 
                    className="w-full bg-white/10 hover:bg-gold text-white hover:text-black font-black rounded-xl h-12 shadow-lg transition-all border border-white/10 hover:border-gold italic"
                  >
                    DOWNLOAD APK
                  </Button>
                </CardContent>
              </Card>
            )}

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
                          <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="refs" stroke="#10B981" fill="transparent" strokeWidth={2} />
                      <Area type="monotone" dataKey="ads" stroke="#fbbf24" fill="url(#userEarn)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/5">
                 <div>
                    <label className="text-[9px] font-black text-primary/60 uppercase tracking-widest">Task Income</label>
                    <p className="text-lg font-black text-white italic mt-1">₹{((user.balance || 0) - (user.totalReferralEarnings || 0)).toFixed(2)}</p>
                 </div>
                 <div className="text-right">
                    <label className="text-[9px] font-black text-gold/60 uppercase tracking-widest">Network Rewards</label>
                    <p className="text-lg font-black text-gold italic mt-1 gold-glow">₹{(user.totalReferralEarnings || 0).toFixed(2)}</p>
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
                <CardDescription className="text-sky-300">Watch ads to earn real money instantly.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
              <div className="p-6 bg-white/5 rounded-2xl border border-white/10 text-center">
                <p className="text-sm text-sky-400 uppercase tracking-widest mb-2">Reward per Ad</p>
        <p className="text-4xl font-black text-emerald">₹{user["isVip"] ? '0.02' : '0.01'}</p>
              </div>

              <Button 
                disabled={isWatching || cooldown > 0} 
                onClick={handleWatchAd}
                className={`w-full h-16 rounded-2xl font-black text-xl transition-all ${
                  cooldown > 0 
                  ? 'bg-sky-900/50 text-sky-700' 
                  : 'bg-gradient-to-r from-sky-500 to-indigo-600 hover:scale-[1.02] active:scale-[0.98] text-white shadow-[0_0_30px_rgba(56,189,248,0.3)]'
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
                  {user.isVip ? 'Premium Reward Enabled (₹0.02)' : 'Standard Reward (₹0.01)'}
                </p>
                <p className="text-xs text-zinc-500 flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-emerald" />
                  {user.isVip ? 'Priority processing enabled' : 'Standard processing time'}
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
          <Card className="glass border-none shadow-xl bg-gradient-to-br from-sky-900 to-sky-950">
            <CardHeader>
              <CardDescription className="text-sky-300 font-medium uppercase tracking-wider text-[10px]">Total Balance</CardDescription>
              <CardTitle className="text-5xl font-black text-white">₹{user.balance.toFixed(2)}</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleRequestWithdrawal} 
                className="w-full h-12 bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-xl text-lg shadow-lg shadow-sky-500/20"
              >
                Request Withdrawal
              </Button>
              <p className="text-[10px] text-amber-200/50 mt-4 text-center uppercase tracking-widest">
                Minimum: ₹{user["isVip"] ? '200' : systemSettings.minWithdrawal.toFixed(0)} • {systemSettings.commission}% Tax Deduction
              </p>
            </CardContent>
          </Card>

          <Card className="glass border-none shadow-xl overflow-hidden">
            <CardHeader className="bg-white/5 border-b border-white/5">
              <CardTitle className="text-sm font-bold text-white">Withdrawal History</CardTitle>
            </CardHeader>
            <div className="overflow-x-auto custom-scrollbar touch-pan-x">
              <Table className="min-w-[600px]">
                <TableHeader>
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="text-sky-400 uppercase text-[10px] tracking-widest">Date</TableHead>
                    <TableHead className="text-sky-400 uppercase text-[10px] tracking-widest">Amount</TableHead>
                    <TableHead className="text-sky-400 uppercase text-[10px] tracking-widest">Net Payout</TableHead>
                    <TableHead className="text-sky-400 uppercase text-[10px] tracking-widest">Status</TableHead>
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
                        <TableCell className="text-zinc-300 text-sm">{new Date(w.timestamp).toLocaleDateString()}</TableCell>
                        <TableCell className="font-bold text-white">₹{w.amount.toFixed(2)}</TableCell>
                        <TableCell className="text-gold font-bold gold-glow">₹{(w.net_payout ?? (w.amount * (1 - systemSettings.commission / 100))).toFixed(2)}</TableCell>
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
            </div>
          </Card>
        </div>
      )}

          {activeTab === 'profile' && (
            <>
              <ProfileSettings user={user} />
              {isSuper && user?.role !== 'admin' && (
                <div className="mt-4 px-6 text-center">
                  <Button 
                    variant="outline" 
                    onClick={handleAdminSync} 
                    disabled={signingIn}
                    className="w-full border-primary/20 text-primary hover:bg-primary/10 font-bold h-12 rounded-xl border-dashed"
                  >
                    {signingIn ? 'Synchronizing Cluster Permissions...' : 'DEVELOPER: SYNC ADMIN PERMISSIONS'}
                  </Button>
                  <p className="text-[9px] text-zinc-600 uppercase tracking-widest mt-2">Required one-time to bypass RLS after cluster migration</p>
                </div>
              )}
              {isSuper && user?.role === 'admin' && !isAdminUI && (
                <div className="mt-8 pt-8 border-t border-white/5">
                  <Card className="bg-primary/5 border border-primary/20 rounded-2xl overflow-hidden">
                    <CardHeader className="bg-primary/10">
                      <CardTitle className="text-sm font-black text-primary italic uppercase tracking-widest flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4" />
                        Administrative Access
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <p className="text-xs text-zinc-400 leading-relaxed font-medium mb-4">
                        You have been identified as a system administrator. Elevate your interface 
                        to access the RupeeRise control panel and managed infrastructure.
                      </p>
                      <Button 
                        onClick={() => setIsAdminUI(true)}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black italic rounded-xl h-11"
                      >
                        ACCESS ADMIN DASHBOARD
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}
        </>
      )}
    </div>
  );
}

// --- Admin Dashboard ---
// --- Admin Layout & Components ---

function AdminLayout({ admin, onLogout, activeTab, onTabChange, onSwitchToUser, children }: { admin: UserData, onLogout: () => void, activeTab: string, onTabChange: (tab: string) => void, onSwitchToUser: () => void, children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);

  return (
    <div className="min-h-screen bg-[#020617] text-sky-50 flex lg:flex-row flex-col font-sans">
      {/* Mobile Sidebar Backdrop */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[45]"
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Hidden on mobile, drawer-like on Tablet/Desktop */}
      <aside className={`${isSidebarOpen ? 'w-72 lg:w-64 translate-x-0' : 'w-0 -translate-x-full lg:w-20 lg:translate-x-0'} border-r border-white/5 bg-[#0a0a0a] transition-all duration-300 flex flex-col fixed h-full z-50 overflow-y-auto no-scrollbar`}>
        <div className="p-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-500 rounded-xl shadow-lg shadow-sky-500/20">
              <Shield className="w-6 h-6 text-white" />
            </div>
            {(isSidebarOpen || window.innerWidth < 1024) && (
              <span className="font-black text-xl italic tracking-tighter">
                RUPEE<span className="text-sky-400">RISE</span>
              </span>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-sky-500 hover:text-white">
            {isSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
        <nav className="flex-1 px-4 py-8 space-y-2">
          <AdminNavItem 
            icon={<DollarSign />} 
            label="Payouts" 
            active={activeTab === 'withdrawals'} 
            collapsed={!isSidebarOpen} 
            onClick={() => { onTabChange('withdrawals'); if (window.innerWidth < 1024) setIsSidebarOpen(false); }}
          />
          <AdminNavItem 
            icon={<Crown />} 
            label="Membership" 
            active={activeTab === 'vip'}
            collapsed={!isSidebarOpen} 
            onClick={() => { onTabChange('vip'); if (window.innerWidth < 1024) setIsSidebarOpen(false); }}
          />
          <AdminNavItem 
            icon={<Users />} 
            label="User Base" 
            active={activeTab === 'users'}
            collapsed={!isSidebarOpen} 
            onClick={() => { onTabChange('users'); if (window.innerWidth < 1024) setIsSidebarOpen(false); }}
          />
          <AdminNavItem 
            icon={<Activity />} 
            label="Activity Log" 
            active={activeTab === 'activity'}
            collapsed={!isSidebarOpen} 
            onClick={() => { onTabChange('activity'); if (window.innerWidth < 1024) setIsSidebarOpen(false); }} 
          />
          <AdminNavItem 
            icon={<Settings />} 
            label="Config" 
            active={activeTab === 'settings'}
            collapsed={!isSidebarOpen} 
            onClick={() => { onTabChange('settings'); if (window.innerWidth < 1024) setIsSidebarOpen(false); }} 
          />

          <div className="pt-6 mt-6 border-t border-white/5">
            <AdminNavItem 
              icon={<ArrowLeft />} 
              label="User Mode" 
              active={false}
              collapsed={!isSidebarOpen} 
              onClick={onSwitchToUser} 
            />
          </div>
        </nav>

        <div className="p-4 border-t border-white/5">
          <Button 
            variant="ghost" 
            onClick={onLogout} 
            className="w-full flex items-center gap-3 text-sky-400 hover:text-white hover:bg-white/5 py-6"
          >
            <LogOut className="w-5 h-5" />
            {isSidebarOpen && <span>Sign Out</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'} min-h-screen flex flex-col bg-[#020617]`}>
        <header className="h-16 border-b border-white/5 px-4 lg:px-8 flex items-center justify-between sticky top-0 bg-[#020617]/80 backdrop-blur-xl z-40 shrink-0">
          <div className="flex items-center gap-4">
            {!isSidebarOpen && (
              <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-sky-400 hover:text-white">
                <Menu className="w-5 h-5" />
              </Button>
            )}
            <h1 className="text-[10px] sm:text-lg font-black italic uppercase tracking-tighter text-sky-500 whitespace-nowrap">
               ADMIN <span className="text-white">OS</span>
            </h1>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Live Infrastructure: Asian-South</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-white leading-none">{admin.name}</p>
                <p className="text-[10px] text-sky-500 font-medium mt-1">System Administrator</p>
              </div>
              <Avatar className="h-8 w-8 lg:h-9 lg:w-9 border border-white/10 ring-2 ring-sky-400/20">
                <AvatarFallback className="bg-sky-400/20 text-sky-400">{admin.name?.charAt(0)}</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        <div className="flex-1 w-full">
          <div className="max-w-7xl mx-auto p-4 lg:p-8 pb-40 lg:pb-12">
            {children}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-4 left-4 right-4 bg-black/80 backdrop-blur-3xl border border-white/10 rounded-2xl flex items-center justify-around z-50 p-3 shadow-2xl">
        <NavButton active={activeTab === 'withdrawals'} onClick={() => onTabChange('withdrawals')} icon={<DollarSign />} label="Finance" />
        <NavButton active={activeTab === 'users'} onClick={() => onTabChange('users')} icon={<Users />} label="Users" />
        <NavButton active={activeTab === 'vip'} onClick={() => onTabChange('vip')} icon={<Crown />} label="VIP" />
        <NavButton active={activeTab === 'settings'} onClick={() => onTabChange('settings')} icon={<Settings />} label="Config" />
      </nav>
    </div>
  );
}

function SidebarIcon({ active, icon, onClick, label }: { active: boolean, icon: React.ReactNode, onClick: () => void, label: string }) {
  return (
    <button 
      onClick={onClick}
      title={label}
      className={`relative flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 group ${active ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'text-sky-400/40 hover:bg-white/5 hover:text-sky-300'}`}
    >
      {React.cloneElement(icon as React.ReactElement, { size: 20 })}
      <div className="absolute top-1/2 -translate-y-1/2 left-full ml-4 px-3 py-1.5 bg-black/90 border border-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap shadow-2xl">
        {label}
      </div>
      {active && (
        <motion.div 
          layoutId="sidebar-active"
          className="absolute -left-1 w-1 h-6 bg-sky-400 rounded-r-full shadow-[0_0_10px_rgba(56,189,248,0.5)]"
        />
      )}
    </button>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-sky-400 scale-110' : 'text-sky-400/40 hover:text-white'}`}
    >
      {React.cloneElement(icon as React.ReactElement, { className: 'w-6 h-6' })}
      <span className="text-[10px] font-black uppercase tracking-[0.1em]">{label}</span>
      {active && <motion.div layoutId="nav-active" className="w-1 h-1 bg-sky-400 rounded-full mt-0.5 shadow-[0_0_5px_rgba(56,189,248,0.8)]" />}
    </button>
  );
}

function AdminNavItem({ icon, label, onClick, active = false, collapsed = false }: { icon: React.ReactNode, label: string, onClick?: () => void, active?: boolean, collapsed?: boolean }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${active ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'text-sky-400 hover:text-white hover:bg-white/5'}`}
    >
      <div className={active ? '' : 'text-sky-400'}>
        {React.cloneElement(icon as React.ReactElement, { className: 'w-5 h-5' })}
      </div>
      {!collapsed && <span className="font-bold text-sm">{label}</span>}
      {!collapsed && active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_white]" />}
    </button>
  );
}

// --- Admin Dashboard ---
function AdminDashboard({ admin, activeTab, onTabChange, systemSettings, setSystemSettings }: { admin: UserData, activeTab: string, onTabChange: (tab: string) => void, systemSettings: any, setSystemSettings: (val: any) => void }) {
  const [users, setUsers] = useState<UserData[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [vipRequests, setVipRequests] = useState<VipRequest[]>([]);
  const [enquiries, setEnquiries] = useState<any[]>([]);
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
  const [uploadingApk, setUploadingApk] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const handleReferralSync = async () => {
    if (syncing) return;
    setSyncing(true);
    toast.info('Initiating platform-wide yield audit. This may take a moment...');
    try {
      const res = await fetch('/api/admin/referral/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminUid: admin.id })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Platform yield audit complete.');
      } else {
        throw new Error(data.error || 'Audit failed');
      }
    } catch (error: any) {
      toast.error(`Referral sync failed: ${error.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) return toast.error('QR code must be under 20MB');

    setUploadingQr(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;
        const res = await fetch('/api/admin/upload-qr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            adminUid: admin.id, 
            base64Data, 
            fileName: file.name,
            contentType: file.type 
          })
        });

        const result = await res.json();
        if (res.ok) {
          toast.success('Payment QR Code updated via secure server!');
          fetchAllData();
        } else {
          console.error('QR Upload failed:', result);
          throw new Error(result.error || 'Upload failed');
        }
      } catch (error: any) {
        console.error('QR Upload error details:', error);
        toast.error(`QR Upload failed: ${error.message || 'Check server logs'}`);
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

  const handleApkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 200 * 1024 * 1024) return toast.error('APK file must be under 200MB');

    setUploadingApk(true);
    toast.info(`Uploading ${file.name}... Please wait, this may take a moment for large files.`);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;
        const res = await fetch('/api/admin/upload-apk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            adminUid: admin.id, 
            base64Data, 
            fileName: file.name
          })
        });

        const result = await res.json();
        if (res.ok) {
          toast.success('Android App APK updated successfully!');
          fetchAllData();
        } else {
          throw new Error(result.error || 'Upload failed');
        }
      } catch (error: any) {
        console.error('APK Upload error:', error);
        toast.error(`APK Upload failed: ${error.message}`);
      } finally {
        setUploadingApk(false);
        e.target.value = '';
      }
    };
    reader.onerror = () => {
      toast.error("Failed to read file.");
      setUploadingApk(false);
    };
    reader.readAsDataURL(file);
  };

  const fetchAllData = async () => {
    try {
      // Users
      const { data: usersData, error: uError } = await supabase.from('users').select('*');
      if (uError) console.error('Users fetch error:', uError);
      if (usersData) {
        setUsers(usersData as any as UserData[]);
        setStats(prev => ({ ...prev, totalUsers: usersData.length }));
      }

      // Withdrawals
      const { data: wsData, error: wError } = await supabase
        .from('withdrawals')
        .select('*')
        .order('timestamp', { ascending: false });
      if (wError) console.error('Withdrawals fetch error:', wError);
      if (wsData) {
        const ws = wsData as any as Withdrawal[];
        setWithdrawals(ws);
        const pending = ws.filter(w => w.status === 'pending').length;
        const commission = ws.filter(w => w.status === 'approved').reduce((acc, w) => {
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
      }

      // VIP Requests
      const { data: vipsData, error: vError } = await supabase
        .from('vip_requests')
        .select('*')
        .order('timestamp', { ascending: false });
      if (vError) {
        console.error('VIP requests fetch error:', JSON.stringify(vError, null, 2));
      }
      if (vipsData) {
        console.log('Fetched VIP requests:', vipsData.length);
        const rs = vipsData as any as VipRequest[];
        setVipRequests(rs);
        setStats(prev => ({ ...prev, pendingVip: rs.filter(r => r.status === 'pending').length }));
      }

      // Enquiries
      const { data: enqsData, error: eError } = await supabase
        .from('enquiries')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(50);
      if (eError) {
        if (eError.code === 'PGRST205') {
          console.warn('Enquiries table missing or schema cache stale. Please ensure the enquiries table exists in Supabase.');
        } else {
          console.error('Enquiries fetch error:', eError);
        }
      }
      if (enqsData) setEnquiries(enqsData);

      // Settings
      const { data: settingsData, error: sError } = await supabase
        .from('settings')
        .select('*')
        .eq('id', 'global')
        .single();
      if (sError) console.error('Settings fetch error:', sError);
      if (settingsData) {
        setSystemSettings({
          commission: settingsData.commission ?? 10,
          vipThreshold: settingsData.vipThreshold ?? 99,
          minWithdrawal: settingsData.minWithdrawal ?? 500,
          upiId: settingsData.upiId ?? 'payment.admin@upi',
          qrUrl: settingsData.qrUrl || settingsData.qrurl || '',
          apkUrl: settingsData.apkUrl || settingsData.apkurl || ''
        });
      }
    } catch (error) {
      console.error('Fatal error in fetchAllData:', error);
      toast.error('Failed to sync dashboard data.');
    }
  };

  useEffect(() => {
    fetchAllData();

    const channel = supabase
      .channel('admin-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => fetchAllData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'withdrawals' }, () => fetchAllData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vip_requests' }, () => fetchAllData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'enquiries' }, () => fetchAllData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings', filter: 'id=eq.global' }, () => fetchAllData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [admin.id]);

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
    { name: 'Regular', value: users.filter(u => !u["isVip"]).length || 80 },
    { name: 'VIP', value: users.filter(u => u["isVip"]).length || 20 },
  ];

  const COLORS = ['#D4AF37', '#10B981'];

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch('/api/admin/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ withdrawalId: id, adminUid: admin.id })
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
      const res = await fetch('/api/admin/update-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          adminUid: admin.id, 
          settings: { [configField.id]: finalValue } 
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Update failed');
      }

      toast.success(`${configField.label} updated successfully`);
      setIsConfigDialogOpen(false);
    } catch (error: any) {
      toast.error(`Failed to update setting: ${error.message}`);
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
        body: JSON.stringify({ requestId, adminUid: admin.id })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('VIP Membership activated!');
        fetchAllData();
      } else {
        const errorMsg = data.error || 'Unknown error';
        const errorDetails = data.details ? (typeof data.details === 'object' ? JSON.stringify(data.details, null, 2) : data.details) : '';
        toast.error(`Approval failed: ${errorMsg}
${errorDetails}`);
        console.error('Approval failed:', data);
      }
    } catch (error: any) {
      toast.error(`Error processing VIP approval: ${error.message}`);
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
          adminUid: admin.id,
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
      const { error } = await supabase
        .from('users')
        .update({ "isVip": !currentStatus })
        .eq('id', userId);

      if (error) throw error;
      toast.success(`VIP status ${!currentStatus ? 'enabled' : 'disabled'} for user.`);
    } catch (error) {
      handleDatabaseError(error, OperationType.UPDATE, `users/${userId}`, admin.id);
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
        <Card className="border-white/5 bg-sky-950/40 shadow-2xl p-6">
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
                  contentStyle={{backgroundColor: '#011e3b', border: '1px solid #ffffff10', borderRadius: '8px'}}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-4 mt-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-sky-300">Regular Members</span>
              <span className="font-bold text-white">{distributionData[0].value}%</span>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-sky-800" style={{width: `${distributionData[0].value}%`}} />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-sky-300">VIP Exclusive</span>
              <span className="font-bold text-sky-400">{distributionData[1].value}%</span>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.4)]" style={{width: `${distributionData[1].value}%`}} />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Management Section */}
      <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div className="w-full sm:w-auto overflow-x-auto custom-scrollbar pb-2">
            <TabsList className="bg-white/5 p-1.5 border border-white/5 rounded-3xl flex-nowrap flex w-max h-auto">
              <TabsTrigger value="withdrawals" className="px-8 py-3 rounded-2xl data-[state=active]:bg-sky-500 data-[state=active]:text-white font-black text-[10px] uppercase tracking-widest shrink-0 transition-all duration-300">ADMIN PAYOUTS</TabsTrigger>
              <TabsTrigger value="vip" className="px-8 py-3 rounded-2xl data-[state=active]:bg-sky-500 data-[state=active]:text-white font-black text-[10px] uppercase tracking-widest shrink-0 transition-all duration-300">MEMBERSHIP</TabsTrigger>
              <TabsTrigger value="users" className="px-8 py-3 rounded-2xl data-[state=active]:bg-sky-500 data-[state=active]:text-white font-black text-[10px] uppercase tracking-widest shrink-0 transition-all duration-300">USERS</TabsTrigger>
              <TabsTrigger value="activity" className="px-8 py-3 rounded-2xl data-[state=active]:bg-sky-500 data-[state=active]:text-white font-black text-[10px] uppercase tracking-widest shrink-0 transition-all duration-300">LOGS</TabsTrigger>
              <TabsTrigger value="settings" className="px-8 py-3 rounded-2xl data-[state=active]:bg-sky-500 data-[state=active]:text-white font-black text-[10px] uppercase tracking-widest shrink-0 transition-all duration-300">CONFIG</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchAllData} 
              className="border-white/10 hover:bg-white/5 h-9 rounded-xl text-sky-400 hover:text-white transition-all flex items-center gap-2 px-4 group"
            >
              <RefreshCw className="w-3 h-3 group-active:rotate-180 transition-transform duration-500" />
              <span className="text-[10px] font-black uppercase tracking-widest">Manual Sync</span>
            </Button>
            <div className="hidden md:flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
              <Search className="w-4 h-4 text-sky-500" />
              <input 
                placeholder="Search data..." 
                className="bg-transparent border-none text-xs text-white focus:outline-none w-40 placeholder:text-sky-700"
              />
            </div>
          </div>
        </div>

        {/* Tabs for Table/Card Toggle could go here, but let's just make the table scrollable for everyone */}
        <TabsContent value="withdrawals" className="animate-in fade-in slide-in-from-top-2 duration-500">
          <Card className="border-white/5 bg-sky-950/40 shadow-2xl overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar touch-pan-x">
              <Table className="min-w-[800px] lg:min-w-[1000px]">
                <TableHeader className="bg-white/5">
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="text-sky-400 uppercase text-[10px] tracking-widest py-6 px-8">User Identity</TableHead>
                    <TableHead className="text-sky-400 uppercase text-[10px] tracking-widest py-6">Requested Amount</TableHead>
                    <TableHead className="text-sky-400 uppercase text-[10px] tracking-widest py-6">Net Payout</TableHead>
                    <TableHead className="text-sky-400 uppercase text-[10px] tracking-widest py-6">Bank/Info</TableHead>
                    <TableHead className="text-sky-400 uppercase text-[10px] tracking-widest py-6">Status</TableHead>
                    <TableHead className="text-right text-sky-400 uppercase text-[10px] tracking-widest py-6 px-8">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {withdrawals.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-20 text-sky-600/60 font-mono text-sm tracking-tighter italic whitespace-pre-wrap">
                        {"// No withdrawal requests currently in queue"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    withdrawals.map((w) => (
                      <TableRow key={w.id} className="border-white/5 hover:bg-white/[0.02] group transition-colors">
                        <TableCell className="py-6 px-8">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8 border border-white/10 group-hover:ring-2 ring-sky-400/20 transition-all">
                              <AvatarFallback className="bg-sky-400/10 text-sky-400 text-[10px] font-black">{w.userName?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-bold text-white flex items-center gap-2">
                                {w.userName}
                                {users.find(u => u.id === w.uid)?.["isVip"] && <Crown className="w-3 h-3 text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]" />}
                              </p>
                              <p className="text-[10px] text-sky-500/60 font-mono">{w.uid.substring(0, 8)}...</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sky-100 font-bold">₹{w.amount.toFixed(2)}</TableCell>
                        <TableCell className="text-gold font-black gold-glow">
                          ₹{(w.net_payout ?? (w.amount * (1 - systemSettings.commission / 100))).toFixed(2)}
                        </TableCell>
                        <TableCell className="max-w-[150px]">
                          <p className="text-[10px] text-sky-500/70 truncate italic">
                            {users.find(u => u.id === w.uid)?.bank_details || 'No bank info saved'}
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
                              <Button size="sm" onClick={() => handleApprove(w.id)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-8 px-4 rounded-lg shadow-lg shadow-emerald-900/20">Approve</Button>
                              <Button size="sm" variant="destructive" onClick={() => {
                                setRejectingId(w.id);
                                setIsRejectDialogOpen(true);
                              }} className="font-bold h-8 px-4 rounded-lg shadow-lg shadow-red-900/20">Reject</Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="vip" className="animate-in fade-in slide-in-from-top-2 duration-500">
          <Card className="border-white/5 bg-sky-950/40 shadow-2xl overflow-hidden p-4 lg:p-8">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                {vipRequests.length === 0 ? (
                  <div className="col-span-full py-20 text-center text-sky-600 font-mono italic">{"// No VIP requests in queue"}</div>
                ) : (
                  vipRequests.map((r) => (
                    <div key={r.id} className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-sky-400/20 transition-all group relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                          <Crown className="w-16 h-16 text-sky-400" />
                       </div>

                       <div className="flex items-center justify-between mb-4">
                          <Badge className={r.status === 'approved' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-amber-500/20 text-amber-500'}>
                            {r.status.toUpperCase()}
                          </Badge>
                          <Crown className={`w-5 h-5 ${r.status === 'approved' ? 'text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]' : 'text-sky-800'}`} />
                       </div>

                       <h3 className="text-lg font-black text-white italic">{r.userName}</h3>
                       <div className="mt-4 space-y-2">
                          <label className="text-[10px] text-sky-500/60 uppercase font-black tracking-widest">Transaction ID / UTR</label>
                          <div className="p-3 bg-black/40 border border-white/10 rounded-xl flex items-center justify-between">
                             <code className="text-xs text-sky-300 font-mono">{r.transactionId}</code>
                             <Button variant="ghost" size="icon" onClick={() => { navigator.clipboard.writeText(r.transactionId); toast.success('Copied ID'); }} className="h-8 w-8 text-sky-500 hover:text-white">
                               <Copy className="w-4 h-4" />
                             </Button>
                          </div>
                       </div>

                       <div className="mt-6 flex gap-2 pt-6 border-t border-white/5">
                          {r.status === 'pending' && (
                            <Button onClick={() => handleApproveVip(r.id)} className="flex-1 bg-sky-500 hover:bg-sky-600 text-white font-black italic rounded-xl shadow-lg shadow-sky-500/20">
                              ACTIVATE VIP
                            </Button>
                          )}
                          <Button variant="outline" className="border-white/10 text-sky-500 hover:bg-white/5 rounded-xl">
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
           <Card className="border-white/5 bg-sky-950/40 shadow-2xl overflow-hidden">
             <div className="overflow-x-auto custom-scrollbar touch-pan-x">
               <Table className="min-w-[800px] lg:min-w-[1000px]">
                  <TableHeader className="bg-white/5">
                    <TableRow className="border-white/5 hover:bg-transparent">
                      <TableHead className="text-sky-400 uppercase text-[10px] tracking-widest py-6 px-8">User Account</TableHead>
                      <TableHead className="text-sky-400 uppercase text-[10px] tracking-widest py-6">Finances</TableHead>
                      <TableHead className="text-sky-400 uppercase text-[10px] tracking-widest py-6">Authentication</TableHead>
                      <TableHead className="text-sky-400 uppercase text-[10px] tracking-widest py-6">Privileges</TableHead>
                      <TableHead className="text-sky-400 uppercase text-[10px] tracking-widest py-6 px-8 text-right">KYC Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                     {users.map((u) => (
                       <TableRow key={u.id} className="border-white/5 hover:bg-white/[0.02] group transition-colors" id={`user-row-${u.id}`}>
                          <TableCell className="py-6 px-8">
                             <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10 border border-white/10 shadow-lg group-hover:ring-2 ring-sky-400/20 transition-all">
                                   <AvatarFallback className="bg-sky-400/10 text-sky-400 font-black">{u.name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                   <p className="font-black text-white italic">{u.name}</p>
                                   <p className="text-[10px] text-sky-500/60 font-mono mt-0.5">{u.id.substring(0, 8)}...</p>
                                </div>
                             </div>
                          </TableCell>
                          <TableCell>
                             <p className="text-sm font-black text-emerald italic">₹{u.balance.toFixed(2)}</p>
                             <p className="text-[10px] text-sky-500/60 uppercase mt-0.5">Withdrawable</p>
                          </TableCell>
                          <TableCell>
                             <p className="text-[11px] text-sky-200 font-bold">{u.phone}</p>
                             <Badge variant="outline" className="mt-1 text-[9px] border-emerald-500/20 text-emerald-500 py-0 h-4">Verified</Badge>
                          </TableCell>
                          <TableCell>
                             <Button 
                                variant="ghost" 
                                onClick={() => toggleVip(u.id, !!u["isVip"])}
                                className="p-0 h-auto hover:bg-transparent"
                             >
                                {u["isVip"] ? (
                                  <Badge className="bg-gold text-black border-none font-black italic shadow-[0_0_12px_rgba(251,191,36,0.4)] px-3 py-1">VIP MEMBER</Badge>
                                ) : (
                                  <Badge variant="outline" className="border-white/10 text-gold/60 hover:border-gold hover:text-gold transition-all">Grant VIP</Badge>
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
                               <div className="flex items-center justify-end gap-1.5 text-sky-700 text-[10px] uppercase font-bold italic">
                                 <XCircle className="w-3.5 h-3.5" />
                                 Pending Upload
                               </div>
                             )}
                          </TableCell>
                       </TableRow>
                     ))}
                   </TableBody>
                </Table>
              </div>
           </Card>
        </TabsContent>

        <TabsContent value="activity" className="animate-in fade-in slide-in-from-top-2 duration-500">
           <Card className="border-white/5 bg-sky-950/40 shadow-2xl overflow-hidden">
             <div className="p-6 lg:p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div>
                   <h3 className="text-lg font-black text-white italic uppercase tracking-tighter">CENTRAL ACTIVITY FEED</h3>
                   <p className="text-xs text-sky-500 uppercase font-bold mt-1">Real-time engagement logs</p>
                 </div>

                <Badge className="bg-emerald-500/10 text-emerald-500 border-none px-4 py-1 font-black italic">LIVE</Badge>
              </div>

             <div className="overflow-x-auto custom-scrollbar touch-pan-x">
               <Table className="min-w-[800px] lg:min-w-[1000px]">
                  <TableHeader className="bg-white/5">
                    <TableRow className="border-white/5 hover:bg-transparent">
                      <TableHead className="text-sky-400 uppercase text-[10px] tracking-widest py-6 px-8">Timestamp</TableHead>
                      <TableHead className="text-sky-400 uppercase text-[10px] tracking-widest py-6">Context</TableHead>
                      <TableHead className="text-sky-400 uppercase text-[10px] tracking-widest py-6">Message / Details</TableHead>
                      <TableHead className="text-sky-400 uppercase text-[10px] tracking-widest py-6 px-8 text-right">User</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                     {enquiries.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="py-20 text-center text-sky-600 font-mono text-sm italic whitespace-pre-wrap">
                            {"// No recent activity detected"}
                          </TableCell>
                        </TableRow>
                     ) : (
                       enquiries.map((e) => (
                         <TableRow key={e.id} className="border-white/5 hover:bg-white/[0.02] group transition-colors">
                            <TableCell className="py-6 px-8 text-sky-500/60 font-mono text-[10px]">
                               {new Date(e.timestamp).toLocaleString()}
                            </TableCell>
                            <TableCell>
                               <Badge variant="outline" className="border-sky-500/20 text-sky-400 font-bold px-2 py-0 text-[9px] uppercase">SUPPORT QUERY</Badge>
                            </TableCell>
                            <TableCell className="max-w-md">
                               <p className="text-sm text-sky-100 font-medium line-clamp-2 italic">"{e.enquiry}"</p>
                               <div className="flex gap-4 mt-2">
                                  <span className="text-[10px] text-sky-500 font-bold uppercase tracking-widest flex items-center gap-1"><Mail className="w-3 h-3" /> {e.email}</span>
                                  <span className="text-[10px] text-sky-500 font-bold uppercase tracking-widest flex items-center gap-1"><Phone className="w-3 h-3" /> {e.contactNumber}</span>
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
              </div>
            </Card>
         </TabsContent>

        <TabsContent value="settings" className="animate-in fade-in slide-in-from-top-2 duration-500">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              <Card className="border-white/5 bg-sky-950/40 shadow-2xl p-6 lg:p-8 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                    <Settings className="w-24 h-24 text-white" />
                  </div>

                 <h3 className="text-lg font-black text-white italic uppercase tracking-tighter mb-6 flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-sky-500 shadow-[0_0_8px_rgba(56,189,248,0.5)]" />
                    SYSTEM CONFIG
                 </h3>
                 <div className="space-y-4 lg:space-y-6">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                       <div>
                          <p className="text-[10px] font-black text-sky-500/60 uppercase tracking-widest">Tax (Commission)</p>
                          <p className="text-xl font-bold text-white">{systemSettings.commission}%</p>
                        </div>
                       <Button variant="ghost" size="sm" onClick={() => openConfig('commission', 'Tax Deduction', systemSettings.commission)} className="text-sky-400 hover:bg-sky-400/10">Edit</Button>
                     </div>

                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                       <div>
                          <p className="text-[10px] font-black text-sky-500/60 uppercase tracking-widest">VIP Entry Amt</p>
                          <p className="text-xl font-bold text-white">₹{systemSettings.vipThreshold.toFixed(2)}</p>
                        </div>
                       <Button variant="ghost" size="sm" onClick={() => openConfig('vipThreshold', 'VIP Entry Threshold', systemSettings.vipThreshold)} className="text-sky-400 hover:bg-sky-400/10">Edit</Button>
                     </div>

                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                       <div>
                          <p className="text-[10px] font-black text-sky-500/60 uppercase tracking-widest">Min Payout</p>
                          <p className="text-xl font-bold text-white">₹{systemSettings.minWithdrawal.toFixed(2)}</p>
                        </div>
                       <Button variant="ghost" size="sm" onClick={() => openConfig('minWithdrawal', 'Minimum Withdrawal', systemSettings.minWithdrawal)} className="text-sky-400 hover:bg-sky-400/10">Edit</Button>
                     </div>

                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                        <div className="flex-1 overflow-hidden">
                           <p className="text-[10px] font-black text-sky-500/60 uppercase tracking-widest">Collection UPI</p>
                           <p className="text-sm font-bold text-white truncate pr-2">{systemSettings.upiId}</p>
                         </div>
                        <Button variant="ghost" size="sm" onClick={() => openConfig('upiId', 'Admin UPI ID', systemSettings.upiId, false)} className="text-sky-400 hover:bg-sky-400/10 shrink-0">Edit</Button>
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

                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-4">
                           <div className="flex items-center justify-between">
                              <div>
                                 <p className="text-[10px] font-black text-sky-500/60 uppercase tracking-widest">Mobile App (APK)</p>
                                 <p className="text-[10px] text-zinc-500 font-bold uppercase mt-1">{systemSettings.apkUrl ? 'UPLOADED' : 'MISSING'}</p>
                              </div>

                              <div className="flex items-center gap-2">
                                <input 
                                   type="file" 
                                   id="admin-apk-upload" 
                                   className="hidden" 
                                   accept=".apk"
                                   onChange={handleApkUpload} 
                                />
                                <Button 
                                   variant="ghost" 
                                   size="sm" 
                                   disabled={uploadingApk}
                                   onClick={() => document.getElementById('admin-apk-upload')?.click()}
                                   className="text-primary hover:bg-primary/10"
                                >
                                   {uploadingApk ? 'Uploading...' : 'Upload APK'}
                                </Button>
                              </div>
                           </div>
                           {systemSettings.apkUrl && (
                             <div className="p-3 bg-black/40 rounded-xl border border-white/5 flex items-center justify-between">
                                <p className="text-[9px] text-sky-500 font-mono truncate max-w-[200px]">{systemSettings.apkUrl}</p>
                                <Button size="sm" variant="ghost" onClick={() => window.open(systemSettings.apkUrl)} className="text-[9px] h-7 px-2">Test Download</Button>
                             </div>
                           )}
                      </div>
                   </div>
                </div>
             </Card>

              <Card className="border-white/5 bg-sky-950/40 shadow-2xl p-6 lg:p-8">
                 <h3 className="text-lg font-black text-white italic uppercase tracking-tighter mb-6">SERVICES</h3>
                 <div className="space-y-4">
                    <StatusItem label="Firebase Core" status="STABLE" />
                    <StatusItem label="Database Edge" status="FAST" />
                    <StatusItem label="Ad Engine" status="SYNCED" />

                    <div className="mt-8 p-4 bg-black/40 rounded-xl border border-white/5">
                       <p className="text-[9px] font-black text-sky-500/40 uppercase tracking-widest mb-1">NODE VERSION</p>
                       <p className="text-xs font-mono text-sky-400">RUP-SRV-2026.4.X</p>
                     </div>

                     <div className="pt-6 mt-6 border-t border-white/5">
                        <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-4 italic flex items-center gap-2">
                           <RefreshCw className="w-3 h-3" />
                           Maintenance Utilities
                        </h4>
                        <Button 
                          onClick={handleReferralSync}
                          disabled={syncing}
                          variant="outline" 
                          className="w-full border-zinc-800 text-zinc-400 hover:text-white hover:bg-white/5 font-bold h-11"
                        >
                          {syncing ? 'RECALCULATING NETWORK YIELDS...' : 'REPAIR REFERRAL INCOME (VIP ONLY)'}
                        </Button>
                        <p className="text-[9px] text-zinc-600 mt-2 leading-relaxed">
                          Retroactively audits and distributes missed referral rewards to VIP ancestors who were previously skipped due to legacy logic.
                        </p>
                      </div>
                  </div>
               </Card>
            </div>
        </TabsContent>


      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="bg-sky-950 border-white/10 text-white rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black italic text-destructive">REJECT WITHDRAWAL</DialogTitle>
            <DialogDescription className="text-sky-400/60 font-medium">Please provide a valid reason for rejection.</DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <Label htmlFor="reason" className="text-sky-500 uppercase text-[10px] font-black tracking-widest mb-2 block">Reason for Rejection</Label>
            <textarea 
               id="reason"
               className="w-full h-32 bg-black/40 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-destructive/50 text-white"
               placeholder="Example: Incorrect bank details, Suspicious activity..."
               value={rejectReason}
               onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>

          <DialogFooter className="gap-2">
             <Button variant="ghost" onClick={() => setIsRejectDialogOpen(false)} className="text-sky-500 hover:text-white hover:bg-white/5 rounded-xl">Cancel</Button>
             <Button variant="destructive" onClick={handleReject} className="bg-destructive hover:bg-destructive/90 font-black italic rounded-xl px-8">CONFIRM REJECT</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
        <DialogContent className="bg-sky-950 border-white/10 text-white rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black italic text-sky-400 uppercase">CONFIGURE SYSTEM</DialogTitle>
            <DialogDescription className="text-sky-400/60 font-medium">Update global platform parameters.</DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <div>
              <Label className="text-sky-500 uppercase text-[10px] font-black tracking-widest mb-2 block">{configField?.label}</Label>
              <Input 
                type={configField?.isNumeric ? "number" : "text"}
                value={newConfigValue}
                onChange={(e) => setNewConfigValue(e.target.value)}
                className="bg-black/40 border-white/10 text-white rounded-2xl h-12 text-lg font-bold"
              />
            </div>

            <p className="text-[10px] text-sky-500/40 uppercase tracking-widest italic font-medium">Changes take effect immediately for all users.</p>
          </div>

          <DialogFooter className="gap-2">
             <Button variant="ghost" onClick={() => setIsConfigDialogOpen(false)} className="text-sky-500 hover:text-white hover:bg-white/5 rounded-xl">Cancel</Button>
             <Button onClick={handleSaveConfig} className="bg-sky-500 hover:bg-sky-600 text-white font-black italic rounded-xl px-8 shadow-lg shadow-sky-500/20">UPDATE SYSTEM</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Tabs>
  </div>
  );
}

function StatusItem({ label, status }: { label: string, status: string }) {
  return (
    <div className="flex items-center gap-4">
       <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
       <span className="text-xs font-bold text-sky-200/80">{label}: {status}</span>
     </div>
  );
}

function ModernStatCard({ label, value, trend, icon, color }: { label: string, value: string | number, trend: string, icon: React.ReactNode, color: string }) {
  const getColors = () => {
    switch(color) {
      case 'amber': return 'bg-amber-500/10 border-amber-500/20 text-amber-500';
      case 'gold': return 'bg-gold/10 border-gold/30 text-gold';
      case 'emerald': return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500';
      default: return 'bg-sky-500/10 border-sky-400/20 text-sky-400';
    }
  };

  return (
    <Card className="border-white/5 bg-sky-950/20 shadow-xl p-6 group hover:border-sky-400/30 transition-all duration-500 overflow-hidden relative rounded-[2rem]">
      <div className="absolute -right-4 -bottom-4 opacity-[0.03] rotate-12 scale-150 transform group-hover:scale-125 transition-transform duration-700 text-white">
        {icon}
      </div>

      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className={`p-3 rounded-2xl border ${getColors()} shadow-lg`}>
          {icon}
        </div>

        <div className="flex items-center gap-1.5">
           <div className={`w-1.5 h-1.5 rounded-full ${color === 'emerald' ? 'bg-emerald-500' : (color === 'gold' ? 'bg-gold' : 'bg-sky-800')}`} />
           <span className="text-[10px] font-bold text-sky-500/50 uppercase tracking-widest">{trend}</span>
        </div>
      </div>

      <div className="relative z-10">
        <p className="text-[10px] font-black text-sky-500/60 uppercase tracking-widest italic">{label}</p>
        <p className="text-3xl font-black text-white mt-1 group-hover:translate-x-1 transition-transform tracking-tighter">{value}</p>
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
    const fetchEarnings = async () => {
      const { data, error } = await supabase
        .from('referral_earnings')
        .select('*')
        .eq('uid', user.id)
        .order('timestamp', { ascending: false });
      if (data) setEarnings(data);
    };

    const fetchDirectReferrals = async () => {
      const { data, error, count } = await supabase
        .from('users')
        .select('*', { count: 'exact' })
        .eq('referredBy', user.referralCode) // Using referralCode as link
        .order('createdAt', { ascending: false });

      if (data) {
        setDirectReferrals(data.slice(0, 10) as any as UserData[]);
        setReferralCount(count || 0);
      }
    };

    fetchEarnings();
    fetchDirectReferrals();

    const channel = supabase
      .channel(`referrals-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'referral_earnings', filter: `uid=eq.${user.id}` }, () => fetchEarnings())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users', filter: `referredBy=eq.${user.referralCode}` }, () => fetchDirectReferrals())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user.id, user.referralCode]);

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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
        <Card className="glass border-none shadow-xl relative overflow-hidden group" style={{ minWidth: '400px' }}>
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


      {!user["isVip"] && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 glass border border-amber-500/20 rounded-[2.5rem] flex items-start gap-5 shadow-2xl relative overflow-hidden group"
        >
          <div className="p-4 bg-amber-500/10 rounded-2xl relative z-10 border border-amber-500/20">
            <ShieldAlert className="w-8 h-8 text-amber-500 animate-pulse" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-lg font-black text-white italic tracking-tight uppercase leading-none">VIP MEMBERSHIP REQUIRED</p>
              <Badge className="bg-amber-500 text-black border-none text-[8px] font-black h-4">RESTRICTED</Badge>
            </div>

            <p className="text-sm text-sky-300 leading-relaxed max-w-2xl font-medium">
              Your network node is currently operating at <span className="text-amber-500 font-black">STANDARD CLEARANCE</span>. 
              The recursive 6-tier yield engine is exclusive to <span className="text-gold font-black italic underline underline-offset-4 decoration-primary/50">VIP MEMBERS</span>. 
              Upgrade now to unlock the full potential of your referral network.
            </p>
          </div>

          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:rotate-12 transition-transform duration-1000">
             <ShieldAlert className="w-32 h-32 text-amber-500" />
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
          <div className="overflow-x-auto custom-scrollbar touch-pan-x">
            <Table className="min-w-[500px]">
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-sky-400 uppercase text-[9px] font-black tracking-widest pl-6">Sector</TableHead>
                <TableHead className="text-sky-400 uppercase text-[9px] font-black tracking-widest">Yield</TableHead>
                <TableHead className="text-sky-400 uppercase text-[9px] font-black tracking-widest pr-6 text-right">Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {earnings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-12 text-sky-600 text-[10px] uppercase font-black tracking-[0.2em] italic">No active data streams</TableCell>
                </TableRow>
              ) : (
                earnings.map((e) => (
                  <TableRow key={e.id} className="border-white/5 hover:bg-white/5 transition-colors">
                    <TableCell className="pl-6">
                      <Badge variant="outline" className="text-[9px] font-black border-white/10 text-primary/80 px-2 py-0.5 rounded-md italic">L{e.level} RECURSION</Badge>
                    </TableCell>
                    <TableCell className="font-black text-emerald italic">+₹{e.amount.toFixed(2)}</TableCell>
                    <TableCell className="text-[10px] text-sky-400 pr-6 text-right font-mono">
                      {new Date(e.timestamp).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
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
                   <UserPlus className="w-10 h-10 text-sky-800 mx-auto mb-4" />
                   <p className="text-[10px] text-sky-600 uppercase font-black tracking-widest italic">No direct connections established</p>
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
                               <p className="text-[10px] text-sky-400 font-mono tracking-widest">{ref.referralCode}</p>
                            </div>
                         </div>

                         <div className="text-right">
                            <p className="text-[10px] text-sky-600 uppercase font-black mb-1">Status</p>
                            <Badge className={ref["isVip"] ? 'bg-gold/20 text-gold' : 'bg-sky-900 text-sky-500'}>
                               {ref["isVip"] ? 'ELITE' : 'STD'}
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
            <div className="w-1.5 h-8 bg-sky-400 rounded-full shadow-[0_0_15px_rgba(56,189,248,0.4)]" />
            RECURSIVE REWARD ARCHITECTURE
          </h3>
          <p className="text-sm text-sky-300 mt-3 leading-relaxed max-w-2xl font-medium">
            Unlock compounding passive yields through our 6-tier referral hierarchy. 
            Direct recruitments generate primary rewards, while secondary and tertiary expansions 
            fuel your long-term capital growth.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { level: 1, reward: 30, type: 'Direct Vector', desc: 'Direct connections initialized via your token.' },
              { level: 2, reward: 20, type: 'Tier-2 Expansion', desc: 'Yields from Level 1 network growth.' },
              { level: 3, reward: 15, type: 'Tier-3 Recursion', desc: 'Yields from Level 2 network expansion.' },
              { level: 4, reward: 10, type: 'Tier-4 Node', desc: 'Secondary network residual yield.' },
              { level: 5, reward: 5, type: 'Tier-5 Depth', desc: 'Deep network sustainability reward.' },
              { level: 6, reward: 2, type: 'Terminal Node', desc: 'Maximum depth residual yield.' },
            ].map((l) => (
              <motion.div 
                whileHover={{ scale: 1.02 }}
                key={l.level} 
                className="flex items-center justify-between p-5 glass border border-white/5 rounded-2xl shadow-sm group cursor-default transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-900 to-black border border-white/10 flex items-center justify-center text-sm font-black text-sky-400 group-hover:border-primary/40 transition-colors">
                    L{l.level}
                  </div>
                  <div>
                    <p className="text-sm font-black text-white tracking-wide uppercase italic">{l.type}</p>
                    <p className="text-[10px] text-sky-300 font-bold uppercase tracking-widest mt-0.5">{l.desc}</p>
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
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user.name || '');
  const [editPhone, setEditPhone] = useState(user.phone || '');
  const [editAge, setEditAge] = useState(user.age?.toString() || '');
  const [updating, setUpdating] = useState(false);
  const [referrerName, setReferrerName] = useState<string | null>(null);
  const [isEditingReferral, setIsEditingReferral] = useState(false);
  const [newReferralCode, setNewReferralCode] = useState(user.referredBy || '');
  const [verifyingReferral, setVerifyingReferral] = useState(false);

  useEffect(() => {
    const fetchReferrerName = async () => {
      if (!user.referredBy) return;
      try {
        const res = await fetch(`/api/referrer/${user.referredBy}`);
        const data = await res.json();
        if (data.name) {
          setReferrerName(data.name);
        }
      } catch (err) {
        console.error('Error fetching referrer details:', err);
      }
    };
    fetchReferrerName();
  }, [user.referredBy]);

  const handleUpdateReferral = async () => {
    const code = newReferralCode.trim().toUpperCase();
    if (!code) {
      toast.error('Please enter a referral code');
      return;
    }
    if (code === user.referralCode) {
      toast.error('You cannot refer yourself');
      return;
    }

    setVerifyingReferral(true);
    try {
      const res = await fetch(`/api/referrer/${code}`);
      if (!res.ok) {
        toast.error('Invalid referral code');
        return;
      }
      const data = await res.json();
      
      const { error } = await supabase
        .from('users')
        .update({ referredBy: code })
        .eq('id', user.id);

      if (error) throw error;

      setReferrerName(data.name);
      setIsEditingReferral(false);
      toast.success('Referral connection updated!');
    } catch (err: any) {
      toast.error(`Failed to update referral: ${err.message}`);
    } finally {
      setVerifyingReferral(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!editName.trim()) return toast.error('Name cannot be empty');
    if (!editPhone.trim()) return toast.error('Mobile Number cannot be empty');
    if (!editAge || parseInt(editAge) < 1) return toast.error('Valid Age is required');

    setUpdating(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: editName.trim(),
          phone: editPhone.trim(),
          age: parseInt(editAge),
          updatedAt: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error: any) {
      toast.error('Failed to update profile: ' + error.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveBank = async () => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          bank_details: bankDetails,
          updatedAt: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;
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
      const filePath = `kyc/${user.id}/${Date.now()}_${file.name}`;
      const { data, error: uploadError } = await supabase.storage
        .from('kyc')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('kyc')
        .getPublicUrl(filePath);

      const { error: patchError } = await supabase
        .from('users')
        .update({ 
          kyc_url: publicUrl,
          updatedAt: new Date().toISOString()
        })
        .eq('id', user.id);

      if (patchError) throw patchError;
      toast.success('ID Document uploaded successfully!');
    } catch (error: any) {
      console.error('KYC Upload error:', error);
      toast.error(`Upload failed: ${error.message || 'Check Supabase storage buckets'}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="glass border-none shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base text-white">Profile Details</CardTitle>
            <CardDescription className="text-sky-300">Personal information and bank details</CardDescription>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsEditing(!isEditing)}
            className="text-primary hover:bg-primary/10 font-bold"
          >
            {isEditing ? 'Cancel Edit' : 'Edit Profile'}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 pb-4 border-b border-white/5">
            {isEditing ? (
              <>
                <div className="space-y-2 col-span-2">
                  <Label className="text-[10px] text-sky-400 uppercase font-black tracking-widest">Full Name</Label>
                  <Input 
                    value={editName} 
                    onChange={(e) => setEditName(e.target.value)} 
                    className="bg-sky-900 border-sky-800 text-white" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] text-sky-400 uppercase font-black tracking-widest">Mobile Number</Label>
                  <Input 
                    value={editPhone} 
                    onChange={(e) => setEditPhone(e.target.value)} 
                    className="bg-sky-900 border-sky-800 text-white" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] text-sky-400 uppercase font-black tracking-widest">Age</Label>
                  <Input 
                    type="number"
                    value={editAge} 
                    onChange={(e) => setEditAge(e.target.value)} 
                    className="bg-sky-900 border-sky-800 text-white" 
                  />
                </div>
                {user.referredBy && (
                  <div className="space-y-1 col-span-2 pt-2 opacity-60 border-t border-white/5">
                    <p className="text-[10px] text-gold uppercase font-black tracking-widest">Referrer (Locked)</p>
                    <div className="flex items-center gap-2">
                       <p className="text-sm text-gold font-bold italic">{referrerName || 'Loading...'}</p>
                       <span className="text-[10px] text-white/40 font-mono">({user.referredBy})</span>
                    </div>
                  </div>
                )}
                <div className="col-span-2 pt-2">
                  <Button onClick={handleUpdateProfile} disabled={updating} className="w-full bg-primary text-primary-foreground font-bold h-10 rounded-lg">
                    {updating ? 'Saving Profile...' : 'Save Profile Changes'}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1 col-span-2">
                  <p className="text-[10px] text-sky-400/70 uppercase font-black tracking-widest">Full Name</p>
                  <p className="text-sm text-white font-bold italic">{user.name || 'N/A'}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] text-sky-400/70 uppercase font-black tracking-widest">Account ID</p>
                  <p className="text-xs text-white font-mono truncate">{user.id}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] text-sky-400/70 uppercase font-black tracking-widest">Age</p>
                  <p className="text-sm text-white font-bold">{user.age || 'N/A'}</p>
                </div>

                <div className="space-y-1 col-span-2">
                  <p className="text-[10px] text-sky-400/70 uppercase font-black tracking-widest">Registered Phone</p>
                  <p className="text-sm text-white font-bold">{user.phone}</p>
                </div>

                <div className="space-y-1 col-span-2 pt-4 border-t border-white/10 mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] text-gold uppercase font-black tracking-widest">Referral Connection</p>
                    {!isEditingReferral && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setIsEditingReferral(true)}
                        className="h-6 text-[9px] text-gold/60 hover:text-gold hover:bg-gold/10 font-bold uppercase tracking-widest"
                      >
                        {user.referredBy ? 'Modify' : 'Add Upline'}
                      </Button>
                    )}
                  </div>
                  
                  <div className="bg-gold/5 p-3 rounded-xl border border-gold/10">
                    {isEditingReferral ? (
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <Input 
                            value={newReferralCode}
                            onChange={(e) => setNewReferralCode(e.target.value)}
                            placeholder="Enter Referral Code"
                            className="bg-sky-900/50 border-gold/20 text-white font-mono text-sm uppercase"
                          />
                          <Button 
                            onClick={handleUpdateReferral}
                            disabled={verifyingReferral}
                            className="bg-gold text-black font-black italic text-xs px-4"
                          >
                            {verifyingReferral ? '...' : 'LINK'}
                          </Button>
                        </div>
                        <Button 
                          variant="ghost" 
                          onClick={() => {
                            setIsEditingReferral(false);
                            setNewReferralCode(user.referredBy || '');
                          }}
                          className="w-full text-[10px] text-zinc-500 hover:text-zinc-400 h-6"
                        >
                          CANCEL
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[9px] text-gold/60 uppercase font-black tracking-tighter">Upline Partner</p>
                          <div className="flex items-center gap-2">
                            {user.referredBy ? (
                              <>
                                <p className="text-sm text-gold font-black italic gold-glow">{referrerName || 'Searching Database...'}</p>
                                <Badge variant="outline" className="text-[9px] h-4 border-gold/30 text-gold/70 py-0 px-1 font-mono">
                                  {user.referredBy}
                                </Badge>
                              </>
                            ) : (
                              <p className="text-sm text-zinc-500 font-bold italic">Direct operative (No upline)</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>


            <div className="space-y-2 pt-2">
              <Label className="text-sky-300">Account / Bank Info</Label>
              <textarea 
                className="w-full min-h-[100px] p-3 rounded-xl border border-white/10 bg-white/5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="Bank Name, Account Number, IFSC/Routing Code..."
                value={bankDetails}
                onChange={(e) => setBankDetails(e.target.value)}
              />
            </div>

          <Button onClick={handleSaveBank} className="w-full bg-sky-600 hover:bg-sky-500 text-white border border-white/5 font-bold rounded-xl h-11">Save Bank Details</Button>
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
      const { error } = await supabase.from('enquiries').insert({
        name,
        contactNumber,
        email,
        enquiry,
        uid: user.id,
        timestamp: new Date().toISOString()
      });
      if (error) throw error;
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
    <Card className="bg-sky-950/40 border-white/10 shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-10 transition-opacity">
        <Share2 className="w-32 h-32 text-white" />
      </div>

      <CardHeader>
        <CardTitle className="text-xl font-black text-white italic tracking-widest flex items-center gap-2">
          <div className="w-1 h-6 bg-sky-500" />
          ELITE SUPPORT
        </CardTitle>
        <CardDescription className="text-sky-400 font-bold uppercase text-[10px] tracking-widest pl-3">Priority Concierge Connectivity</CardDescription>
      </CardHeader>
      <CardContent className="relative z-10">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sky-500 font-black text-[10px] uppercase tracking-widest">Full Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-black/50 border-white/10 text-white rounded-lg h-11" />
            </div>

            <div className="space-y-2">
              <Label className="text-sky-500 font-black text-[10px] uppercase tracking-widest">Phone Axis</Label>
              <Input value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} className="bg-black/50 border-white/10 text-white rounded-lg h-11" />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sky-500 font-black text-[10px] uppercase tracking-widest">Email Node</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-black/50 border-white/10 text-white rounded-lg h-11" />
          </div>

          <div className="space-y-2">
            <Label className="text-sky-500 font-black text-[10px] uppercase tracking-widest">Enquiry Stream</Label>
            <textarea 
              className="w-full min-h-[120px] p-4 rounded-xl border border-white/10 bg-black/50 text-sm text-white focus:outline-none focus:ring-1 focus:ring-sky-500/50 transition-all font-medium"
              placeholder="State your objective..."
              value={enquiry}
              onChange={(e) => setEnquiry(e.target.value)}
            />
            <div className="flex justify-between items-center px-1">
               <p className="text-[9px] text-sky-600 uppercase font-black">{enquiry.split(/\s+/).filter(Boolean).length} / 1000 WORDS</p>
               <div className="flex gap-1">
                  <div className="w-1 h-1 rounded-full bg-sky-500 animate-pulse" />
                  <div className="w-1 h-1 rounded-full bg-sky-500/40" />
               </div>
            </div>
          </div>

          <Button type="submit" disabled={submitting} className="w-full bg-sky-500 text-white hover:bg-sky-400 font-black rounded-lg h-12 shadow-xl shadow-sky-500/10 italic">
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
      let finalReferredBy = null;
      if (referralCode.trim()) {
        try {
          const res = await fetch(`/api/referrer/${referralCode.trim()}`);
          if (!res.ok) {
            toast.error('Invalid referral code. Continuing without it.');
          } else {
            finalReferredBy = referralCode.trim().toUpperCase();
          }
        } catch (err) {
          toast.error('Referral verification failed. Continuing without it.');
        }
      }

      const myReferralCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      const newUserData: any = {
        id: user.id,
        name: name.trim(),
        phone: phone.trim(),
        age: parseInt(age),
        balance: 0,
        role: 'user',
        referralCode: myReferralCode,
        totalReferralEarnings: 0,
        referredBy: finalReferredBy,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const { error } = await supabase.from('users').upsert(newUserData);
      if (error) throw error;
      onComplete(newUserData as UserData);
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
          <CardDescription className="text-sky-300">Please provide your details to start earning</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sky-200">Full Name *</Label>
            <Input placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} className="bg-sky-950/50 border-sky-800 text-white" />
          </div>

          <div className="space-y-2">
            <Label className="text-sky-200">Mobile Number *</Label>
            <Input placeholder="+91..." value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-sky-950/50 border-sky-800 text-white" />
          </div>

          <div className="space-y-2">
            <Label className="text-sky-200">Age *</Label>
            <Input type="number" placeholder="Enter your age" value={age} onChange={(e) => setAge(e.target.value)} className="bg-sky-950/50 border-sky-800 text-white" />
          </div>

          <div className="space-y-2">
            <Label className="text-sky-200">Referral Code (Optional)</Label>
            <Input placeholder="ENTER CODE" value={referralCode} onChange={(e) => setReferralCode(e.target.value.toUpperCase())} className="bg-sky-950/50 border-sky-800 text-white" />
          </div>

          <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-3">
            <div className="h-24 overflow-y-auto text-[10px] text-sky-400 space-y-2 pr-2 scrollbar-thin scrollbar-thumb-sky-800">
              <p className="font-bold text-sky-300 uppercase tracking-widest">Privacy Policy</p>
              <p>By using RupeeRise, you consent to the collection and use of your personal details (Name, Age, Phone) for account verification and service delivery.</p>
              <p>We take security seriously and do not share your data with unauthorized third parties.</p>
            </div>

            <div className="flex items-start gap-2 pt-2">
              <input 
                type="checkbox" 
                id="agree" 
                checked={agreed} 
                onChange={(e) => setAgreed(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border-sky-800 bg-sky-950 text-sky-400 focus:ring-sky-400 cursor-pointer"
              />
              <Label htmlFor="agree" className="text-[11px] leading-tight text-sky-200 cursor-pointer">
                I have read and agree to the Privacy Policy and confirm that all details provided are correct.
              </Label>
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-black text-lg h-12 rounded-xl shadow-[0_0_20px_rgba(56,189,248,0.3)] hover:scale-[1.02] transition-all">
            {saving ? 'SETTING UP...' : 'LET\'S EARN'}
          </Button>

          <Button 
            variant="ghost" 
            onClick={() => supabase.auth.signOut()} 
            className="w-full text-sky-500 hover:text-white hover:bg-white/5 text-xs font-bold uppercase tracking-widest mt-2"
          >
            Switch Account / Sign Out
          </Button>
        </CardContent>
      </Card>
      <Toaster theme="dark" position="top-center" />
    </div>
  );
}


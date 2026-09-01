import { useEffect, useState } from 'react';
import {
  Activity, Bell, Droplet, Flower, Heart, LogIn, LogOut, Lock, Menu, RefreshCw, Sparkles, User, UserPlus, X, Sun, Moon, Info, Play
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// 1. IMPORT NATIVE ONESIGNAL
import OneSignal from 'onesignal-cordova-plugin';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const CURRENT_APP_VERSION = "1.1";
const DEFAULT_TARGET_ML = 2000;
const ONESIGNAL_APP_ID = "f187475b-64ca-4313-8c8a-f70b8607d20c";

const PROS_OF_WATER = [
  'Water lubricates your joints and cushions your tissues! 💧',
  'Staying hydrated regulates body temperature and prevents overheating. 🌡️',
  'Water aids in digestion and prevents constipation. 🥗',
  'It flushes out waste and toxins through the kidneys. 🚽',
  'Hydration delivers oxygen and nutrients to cells efficiently! 🌬️',
];

const BEAUTY_TIPS = [
  'Water maintains skin elasticity, preventing premature wrinkling. ✨',
  'Applying moisturizer to damp skin locks in maximum hydration. 🧴',
  'Double cleanse at night to melt away SPF and pollutants. 🧼',
  'Hydration reduces eye puffiness and flushes out sodium. 👁️',
];

const INTIMATE_HEALTH_TIPS = [
  'Adequate hydration maintains natural vaginal lubrication and tissue elasticity. 🌸',
  'Drinking plenty of water flushes bacteria, significantly reducing UTI risks. 🛡️',
  'Proper hydration improves overall blood flow, naturally enhancing sensitivity. 💓',
  'Water helps balance hormonal fluctuations and fights cycle-related fatigue. ⚖️',
];

const getStoredNumber = (key, fallback = 0) => {
  try {
    const value = Number.parseInt(localStorage.getItem(key) ?? '', 10);
    return Number.isFinite(value) && value >= 0 ? value : fallback;
  } catch { return fallback; }
};

const getStoredUsers = () => {
  try {
    const value = JSON.parse(localStorage.getItem('usersDB') || '{}');
    return value && typeof value === 'object' ? value : {};
  } catch { return {}; }
};

const BackgroundEffects = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
    <div className="absolute top-10 left-10 text-barbie-pink/10 animate-bounce" style={{ animationDuration: '3s' }}><Heart size={60} fill="currentColor" /></div>
    <div className="absolute top-40 right-10 text-barbie-cyan/20 animate-pulse" style={{ animationDuration: '4s' }}><Sparkles size={50} /></div>
    <div className="absolute bottom-1/4 left-5 text-barbie-deep/10 animate-bounce" style={{ animationDuration: '5s' }}><Heart size={40} fill="currentColor" /></div>
  </div>
);

export default function App() {
  const [username, setUsername] = useState(() => localStorage.getItem('hannahydrate_session') || '');
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(localStorage.getItem('hannahydrate_session')));
  const [authMode, setAuthMode] = useState('login');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  
  const [target, setTarget] = useState(() => {
    const activeUser = localStorage.getItem('hannahydrate_session');
    return activeUser ? getStoredNumber(`water_target_${activeUser}`, DEFAULT_TARGET_ML) : DEFAULT_TARGET_ML;
  });
  
  const [consumed, setConsumed] = useState(() => {
    const activeUser = localStorage.getItem('hannahydrate_session');
    return activeUser ? getStoredNumber(`water_data_${activeUser}`) : 0;
  });

  const [rescued, setRescued] = useState(() => {
    const activeUser = localStorage.getItem('hannahydrate_session');
    return activeUser ? getStoredNumber(`rescued_people_${activeUser}`) : 0;
  });

  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'short' });
  const [weeklyHistory, setWeeklyHistory] = useState(() => {
    const activeUser = localStorage.getItem('hannahydrate_session');
    return JSON.parse(localStorage.getItem(`weekly_${activeUser}`)) || { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
  });

  const [homeTip, setHomeTip] = useState(PROS_OF_WATER[0]);
  const [beautyTip, setBeautyTip] = useState(BEAUTY_TIPS[0]);
  const [intimateTip, setIntimateTip] = useState(INTIMATE_HEALTH_TIPS[0]);
  const [isRunning, setIsRunning] = useState(false);
  
  const waterAmmo = Math.floor(consumed / 200) - rescued;

  // 2. BOOT NATIVE ONESIGNAL ON APP LOAD
  useEffect(() => {
    try {
      // Initialize OneSignal
      OneSignal.initialize(ONESIGNAL_APP_ID);
      
      // Request permission silently on boot
      OneSignal.Notifications.requestPermission(true);
      
      // If user is already logged in, tag them in OneSignal dashboard
      if (username) {
        OneSignal.login(username);
      }
    } catch (e) {
      console.log("OneSignal not active in web preview. Compile to Android to test.");
    }
  }, [username]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (!isAuthenticated || !username) return;
    localStorage.setItem(`water_data_${username}`, String(consumed));
    localStorage.setItem(`water_target_${username}`, String(target));
    localStorage.setItem(`rescued_people_${username}`, String(rescued));
    
    const updatedHistory = { ...weeklyHistory, [todayStr]: consumed };
    setWeeklyHistory(updatedHistory);
    localStorage.setItem(`weekly_${username}`, JSON.stringify(updatedHistory));
  }, [consumed, target, rescued, isAuthenticated, username, todayStr]);

  // Rotate Tips Every 10 Seconds
  useEffect(() => {
    const tipInterval = setInterval(() => {
      setHomeTip(PROS_OF_WATER[Math.floor(Math.random() * PROS_OF_WATER.length)]);
      setBeautyTip(BEAUTY_TIPS[Math.floor(Math.random() * BEAUTY_TIPS.length)]);
      setIntimateTip(INTIMATE_HEALTH_TIPS[Math.floor(Math.random() * INTIMATE_HEALTH_TIPS.length)]);
    }, 10000);
    return () => clearInterval(tipInterval);
  }, []);

  const addWater = (amount) => setConsumed((prev) => prev + amount);

  const handleRunAndFeed = () => {
    if (waterAmmo > 0 && !isRunning) {
      setIsRunning(true);
      setTimeout(() => {
        setRescued(prev => prev + 1);
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 }, colors: ['#22D3EE', '#FFFFFF'] });
        setTimeout(() => setIsRunning(false), 500); 
      }, 800);
    }
  };

  // Manual Permission Trigger (Bell Icon)
  const requestNativeNotifications = async () => {
    try {
      const accepted = await OneSignal.Notifications.requestPermission(true);
      alert(accepted ? "Notifications Enabled! ✨" : "Notifications Declined.");
    } catch (e) {
      alert("Native push requires an Android build to prompt permissions.");
    }
  };

  const handleAuth = (event) => {
    event.preventDefault();
    setError('');
    const cleanUsername = username.trim();
    if (!cleanUsername || !password) { setError('Please enter credentials.'); return; }
    
    const usersDB = getStoredUsers();
    if (authMode === 'register') {
      if (usersDB[cleanUsername]) { setError('Username already exists!'); return; }
      usersDB[cleanUsername] = { password };
      localStorage.setItem('usersDB', JSON.stringify(usersDB));
      setAuthMode('login'); setPassword(''); return;
    } 
    
    if (!usersDB[cleanUsername] || usersDB[cleanUsername].password !== password) { setError('Invalid credentials. ❌'); return; }
    
    localStorage.setItem('hannahydrate_session', cleanUsername);
    setUsername(cleanUsername);
    setConsumed(getStoredNumber(`water_data_${cleanUsername}`));
    setRescued(getStoredNumber(`rescued_people_${cleanUsername}`));
    setTarget(getStoredNumber(`water_target_${cleanUsername}`, DEFAULT_TARGET_ML));
    setPassword(''); setIsAuthenticated(true);
  };

  const handleLogout = () => {
    try { OneSignal.logout(); } catch(e) {} // Log out of push notifications too
    localStorage.removeItem('hannahydrate_session');
    setIsAuthenticated(false); setUsername(''); setConsumed(0); setRescued(0); setPassword(''); setIsSidebarOpen(false);
  };

  const percentage = target > 0 ? Math.min(Math.round((consumed / target) * 100), 100) : 0;

  const chartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      label: 'Intake (ml)',
      data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => weeklyHistory[day] || 0),
      backgroundColor: 'rgba(34, 211, 238, 0.7)',
      borderColor: '#22D3EE',
      borderWidth: 1,
      borderRadius: 4,
    }],
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-linear-to-br from-barbie-soft to-barbie-light dark:from-gray-900 dark:to-gray-800 relative overflow-hidden transition-colors duration-300">
        <BackgroundEffects />
        <button onClick={() => setIsDarkMode(!isDarkMode)} className="absolute top-6 right-6 z-20 p-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full shadow-md text-barbie-pink dark:text-barbie-cyan hover:scale-110 transition-transform">
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md p-8 rounded-3xl shadow-2xl border-4 border-white/50 dark:border-gray-700 max-w-sm w-full text-center z-10 relative">
          <Sparkles className="w-12 h-12 text-barbie-pink dark:text-barbie-cyan mx-auto mb-4 animate-bounce" />
          <h1 className="text-3xl font-bold text-barbie-deep dark:text-white mb-2">HannaHydrate</h1>
          <p className="text-gray-500 dark:text-gray-300 mb-6 text-sm">{authMode === 'login' ? 'Welcome back! ✨' : 'Create an account! ✨'}</p>

          {error && <div className="bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-300 p-3 rounded-lg text-sm mb-4">{error}</div>}

          <form onSubmit={handleAuth} className="flex flex-col gap-4">
            <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-barbie-light dark:border-gray-600 focus:border-barbie-pink bg-white/80 dark:bg-gray-700 dark:text-white outline-none" required />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-barbie-light dark:border-gray-600 focus:border-barbie-pink bg-white/80 dark:bg-gray-700 dark:text-white outline-none" required />
            <button type="submit" className="w-full bg-linear-to-r from-barbie-pink to-barbie-deep dark:from-barbie-cyan dark:to-blue-600 text-white font-bold py-3 rounded-xl shadow-lg mt-2">
              {authMode === 'login' ? 'Let\'s Glow' : 'Register Now'}
            </button>
          </form>
          <button type="button" onClick={() => { setAuthMode((mode) => (mode === 'login' ? 'register' : 'login')); setError(''); }} className="text-barbie-pink dark:text-barbie-cyan text-sm mt-6 hover:underline font-medium">
            {authMode === 'login' ? 'Need an account? Sign up here.' : 'Already have an account? Log in.'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-barbie-soft to-[#FFE4F2] dark:from-gray-900 dark:to-gray-800 flex flex-col items-center p-3 relative overflow-hidden transition-colors duration-300">
      <BackgroundEffects />
      
      {isSidebarOpen && <div className="fixed inset-0 bg-barbie-deep/20 dark:bg-black/50 backdrop-blur-sm z-40 transition-opacity" onClick={() => setIsSidebarOpen(false)} />}

      {/* Sidebar: Beauty & Health */}
      <div className={`fixed inset-y-0 right-0 w-72 max-w-[85vw] bg-white dark:bg-gray-900 shadow-2xl z-50 transform transition-transform duration-300 ease-out ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col border-l-4 border-barbie-pink/20 dark:border-gray-700`}>
        <div className="p-4 border-b-2 flex justify-between items-center bg-linear-to-r from-barbie-soft to-white dark:from-gray-800 dark:to-gray-900 border-barbie-light dark:border-gray-800">
          <h2 className="text-lg font-bold text-barbie-deep dark:text-white flex items-center gap-2"><Heart className="w-5 h-5 text-barbie-pink" fill="currentColor" /> Women's Wellness</h2>
          <button onClick={() => setIsSidebarOpen(false)}><X className="w-6 h-6 text-gray-500" /></button>
        </div>
        <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-6">
          <div className="bg-pink-50 dark:bg-gray-800 p-4 rounded-2xl border border-pink-100 dark:border-gray-700">
            <h3 className="font-bold text-barbie-deep dark:text-white flex items-center gap-2 mb-2"><Flower className="w-4 h-4" /> Beauty Tip</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">{beautyTip}</p>
          </div>
          <div className="bg-red-50 dark:bg-gray-800 p-4 rounded-2xl border border-red-100 dark:border-gray-700">
            <h3 className="font-bold text-red-600 dark:text-red-400 flex items-center gap-2 mb-2"><Activity className="w-4 h-4" /> Intimate Health</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">{intimateTip}</p>
          </div>
        </div>
      </div>

      {/* Compact Header for Mobile (Logout Button Visible) */}
      <header className="w-full max-w-md flex justify-between items-center py-2 px-1 z-10">
        <h1 className="text-lg font-bold text-barbie-pink dark:text-white flex items-center gap-1 bg-white/60 dark:bg-gray-800/60 px-3 py-2 rounded-full backdrop-blur-sm border border-white/50">
          <Sparkles className="w-4 h-4 text-barbie-deep dark:text-barbie-cyan" /> HannaHydrate
        </h1>
        <div className="flex gap-1.5">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 bg-white/80 dark:bg-gray-800/80 rounded-full shadow-sm text-barbie-deep dark:text-barbie-cyan"><Sun className="w-4 h-4" /></button>
          <button onClick={requestNativeNotifications} className="p-2 bg-white/80 dark:bg-gray-800/80 rounded-full shadow-sm text-barbie-deep dark:text-white"><Bell className="w-4 h-4" /></button>
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-white/80 dark:bg-gray-800/80 rounded-full shadow-sm text-barbie-deep dark:text-white"><Menu className="w-4 h-4" /></button>
          <button onClick={handleLogout} className="p-2 bg-white/80 dark:bg-gray-800/80 rounded-full shadow-sm text-red-400 hover:text-red-600"><LogOut className="w-4 h-4" /></button>
        </div>
      </header>

      <main className="w-full max-w-md flex flex-col items-center gap-4 mt-2 z-10 pb-10">
        
        {/* User Greeting & Intake */}
        <div className="w-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-3xl p-5 shadow-xl border-t-4 border-barbie-pink dark:border-barbie-cyan text-center">
          <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Hey, {username}! ✨</p>
          <h2 className="text-4xl font-extrabold text-barbie-deep dark:text-white my-1">{consumed} <span className="text-lg font-medium text-gray-400">/ {target} ml</span></h2>
          <div className="w-full bg-gray-100 dark:bg-gray-700 h-6 rounded-full overflow-hidden p-1 my-3 shadow-inner">
            <div className="bg-linear-to-r from-barbie-pink to-barbie-cyan dark:from-barbie-cyan dark:to-blue-500 h-full rounded-full transition-all duration-700 flex items-center justify-end pr-2" style={{ width: `${percentage}%` }}></div>
          </div>
        </div>

        {/* Quick Add Buttons */}
        <div className="w-full grid grid-cols-3 gap-3">
          {[100, 200, 500].map((amount) => (
            <button key={amount} onClick={() => addWater(amount)} className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-gray-100 dark:border-gray-700 text-barbie-deep dark:text-white font-bold py-3 rounded-2xl shadow-sm hover:shadow-md active:scale-95 transition-all flex flex-col items-center">
              <Droplet className="w-5 h-5 text-barbie-cyan mb-1" /> +{amount}
            </button>
          ))}
        </div>

        {/* The Runner Game */}
        <div className="w-full bg-linear-to-b from-yellow-50 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 rounded-3xl p-5 shadow-xl border border-yellow-200 dark:border-yellow-700 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-orange-400 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg uppercase tracking-wider">Mini-Game</div>
          <h3 className="font-bold text-orange-600 dark:text-orange-400 flex items-center gap-1 mb-1"><Play className="w-4 h-4" fill="currentColor"/> Desert Runner</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Convert 200ml of your water into ammo. Run to rescue thirsty travelers!</p>
          
          <div className="flex justify-between text-xs font-bold text-gray-500 dark:text-gray-400 px-2 mb-2">
            <span>Ammo: <span className="text-blue-500 text-lg">{waterAmmo}</span></span>
            <span>Rescued: <span className="text-green-500 text-lg">{rescued}</span></span>
          </div>

          <div className="w-full h-20 bg-yellow-200/50 dark:bg-yellow-800/50 rounded-xl relative overflow-hidden border-2 border-dashed border-yellow-400 dark:border-yellow-600 flex items-center shadow-inner">
            <div className={`absolute left-2 text-3xl transition-transform duration-700 ease-in z-10 ${isRunning ? 'translate-x-32' : 'translate-x-0'}`}>
              🏃‍♀️
            </div>
            <div className={`absolute left-10 text-xl transition-all duration-500 ease-out z-0 ${isRunning ? 'translate-x-44 opacity-100' : 'translate-x-0 opacity-0'}`}>
              💧
            </div>
            <div className="absolute right-4 text-3xl transition-all duration-300">
              {isRunning ? '🥰' : '🥵'}
            </div>
          </div>

          <button 
            onClick={handleRunAndFeed} 
            disabled={waterAmmo <= 0 || isRunning}
            className="w-full mt-4 py-3 rounded-xl font-bold text-white bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 transition-colors shadow-md active:scale-95"
          >
            {waterAmmo > 0 ? "Run & Feed Water!" : "Drink 200ml for Ammo"}
          </button>
        </div>

        {/* Homepage Tip */}
        <div className="w-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl p-4 shadow-sm border border-barbie-light dark:border-gray-700 flex items-start gap-3">
          <Info className="w-5 h-5 text-barbie-cyan shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{homeTip}</p>
        </div>

        {/* Weekly Chart */}
        <div className="w-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-3xl p-5 shadow-xl border border-gray-100 dark:border-gray-700">
          <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-4 uppercase tracking-widest text-center">Weekly History</h3>
          <Bar data={chartData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
        </div>

      </main>
    </div>
  );
}
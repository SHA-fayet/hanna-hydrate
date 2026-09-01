import { useEffect, useState } from 'react';
import {
  Activity, AlertCircle, Bell, Droplet, Flower, Heart, LogIn, LogOut, Lock, Menu, RefreshCw, Sparkles, User, UserPlus, X, Sun, Moon, Settings, Users, Info, DownloadCloud
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// IMPORTANT: Change this number locally when you build a new APK
const CURRENT_APP_VERSION = "1.1";
const DEFAULT_TARGET_ML = 2000;

const PROS_OF_WATER = [
  'Lubricates joints and cushions tissues.',
  'Regulates body temperature and prevents overheating.',
  'Aids in digestion and prevents constipation.',
  'Flushes out waste and toxins through the kidneys.',
  'Delivers oxygen and nutrients to cells efficiently.',
];

const BEAUTY_TIPS = [
  'Water maintains skin elasticity, preventing premature wrinkling.',
  'Applying moisturizer to damp skin locks in maximum hydration.',
  'Double cleanse at night to melt away SPF and pollutants.',
  'Hydration reduces eye puffiness and flushes out sodium.',
];

const INTIMATE_HEALTH_TIPS = [
  'Adequate hydration maintains natural vaginal lubrication and tissue elasticity.',
  'Drinking plenty of water flushes bacteria, significantly reducing UTI and yeast infection risks.',
  'Proper hydration improves overall blood flow, which can naturally enhance arousal and sensitivity.',
  'Water helps balance hormonal fluctuations and fights cycle-related fatigue.',
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
  const [updateInfo, setUpdateInfo] = useState(null);
  const [username, setUsername] = useState(() => localStorage.getItem('hannahydrate_session') || '');
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(localStorage.getItem('hannahydrate_session')));
  const [authMode, setAuthMode] = useState('login');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
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
  
  const [newTargetInput, setNewTargetInput] = useState(target);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

  // Auto-Update Engine
  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        const response = await fetch(`https://hanna-hydrate.vercel.app/version.json?t=${Date.now()}`);
        const data = await response.json();
        if (data.version && data.version !== CURRENT_APP_VERSION) {
          setUpdateInfo(data.downloadUrl);
        }
      } catch (err) {
        console.error('Update check bypassed');
      }
    };
    checkForUpdates();
  }, []);

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
  }, [consumed, target, rescued, isAuthenticated, username]);

  useEffect(() => {
    if (consumed >= target && target > 0 && consumed > 0) {
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#E0218A', '#22D3EE', '#FCE7F3'] });
    }
  }, [consumed, target]);

  const addWater = (amount) => {
    setConsumed((previous) => previous + amount);
  };

  const handleRescue = () => {
    const totalDropsEarned = Math.floor(consumed / 250);
    const availableDrops = totalDropsEarned - rescued;
    if (availableDrops > 0) {
      setRescued(prev => prev + 1);
      confetti({ particleCount: 50, spread: 50, origin: { y: 0.7 }, colors: ['#22D3EE', '#FFFFFF'] });
    }
  };

  const handleUpdateTarget = (e) => {
    e.preventDefault();
    if (newTargetInput > 0) {
      setTarget(newTargetInput);
      setSuccessMsg('Daily target updated! ✨');
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const requestNativeNotifications = () => {
    if (window.plugins && window.plugins.OneSignal) {
      window.plugins.OneSignal.promptForPushNotificationsWithUserResponse(function(accepted) {
        alert(accepted ? "Notifications Enabled! ✨" : "Notifications Declined.");
      });
    } else {
      alert("Native notifications are active and handled by the Android OS.");
    }
  };

  const handleAuth = (event) => {
    event.preventDefault();
    setError(''); setSuccessMsg('');
    const cleanUsername = username.trim();
    if (!cleanUsername || !password) { setError('Please enter credentials.'); return; }
    
    const usersDB = getStoredUsers();
    if (authMode === 'register') {
      if (usersDB[cleanUsername]) { setError('Username already exists!'); return; }
      usersDB[cleanUsername] = { password };
      localStorage.setItem('usersDB', JSON.stringify(usersDB));
      setAuthMode('login'); setSuccessMsg('✨ Registration successful! Please log in.'); setPassword(''); return;
    } 
    
    if (!usersDB[cleanUsername] || usersDB[cleanUsername].password !== password) { setError('Invalid credentials. ❌'); return; }
    
    localStorage.setItem('hannahydrate_session', cleanUsername);
    setUsername(cleanUsername);
    setConsumed(getStoredNumber(`water_data_${cleanUsername}`));
    setRescued(getStoredNumber(`rescued_people_${cleanUsername}`));
    const userTarget = getStoredNumber(`water_target_${cleanUsername}`, DEFAULT_TARGET_ML);
    setTarget(userTarget); setNewTargetInput(userTarget);
    setPassword(''); setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('hannahydrate_session');
    setIsAuthenticated(false); setUsername(''); setConsumed(0); setRescued(0); setPassword(''); setIsSidebarOpen(false);
  };

  if (updateInfo) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-linear-to-br from-barbie-soft to-barbie-cyan dark:from-gray-900 dark:to-gray-800 text-center relative overflow-hidden">
        <BackgroundEffects />
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md p-8 rounded-3xl shadow-2xl z-10 max-w-sm border-t-4 border-barbie-pink">
          <DownloadCloud className="w-16 h-16 text-barbie-cyan mx-auto mb-4 animate-bounce" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Update Required</h2>
          <p className="text-gray-500 dark:text-gray-300 mb-6 text-sm">A new version of HannaHydrate is available with exciting features. Download it now to continue!</p>
          <a href={updateInfo} className="block w-full py-4 rounded-xl font-bold text-white bg-linear-to-r from-barbie-pink to-barbie-cyan hover:opacity-90 transition-opacity shadow-lg">
            Download Update
          </a>
        </div>
      </div>
    );
  }

  const percentage = target > 0 ? Math.min(Math.round((consumed / target) * 100), 100) : 0;
  const totalDropsEarned = Math.floor(consumed / 250);
  const availableDrops = totalDropsEarned - rescued;

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
          {successMsg && <div className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 p-3 rounded-lg text-sm mb-4">{successMsg}</div>}

          <form onSubmit={handleAuth} className="flex flex-col gap-4">
            <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-barbie-light dark:border-gray-600 focus:border-barbie-pink dark:focus:border-barbie-cyan bg-white/80 dark:bg-gray-700 dark:text-white outline-none" required />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-barbie-light dark:border-gray-600 focus:border-barbie-pink dark:focus:border-barbie-cyan bg-white/80 dark:bg-gray-700 dark:text-white outline-none" required />
            <button type="submit" className="w-full bg-linear-to-r from-barbie-pink to-barbie-deep dark:from-barbie-cyan dark:to-blue-600 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all mt-2">
              {authMode === 'login' ? 'Let\'s Glow' : 'Register Now'}
            </button>
          </form>
          <button type="button" onClick={() => { setAuthMode((mode) => (mode === 'login' ? 'register' : 'login')); setError(''); setSuccessMsg(''); }} className="text-barbie-pink dark:text-barbie-cyan text-sm mt-6 hover:underline font-medium">
            {authMode === 'login' ? 'Need an account? Sign up here.' : 'Already have an account? Log in.'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-barbie-soft to-[#FFE4F2] dark:from-gray-900 dark:to-gray-800 flex flex-col items-center p-4 relative overflow-hidden transition-colors duration-300">
      <BackgroundEffects />
      {isSidebarOpen && <div className="fixed inset-0 bg-barbie-deep/20 dark:bg-black/50 backdrop-blur-sm z-40 transition-opacity" onClick={() => setIsSidebarOpen(false)} />}

      <div className={`fixed inset-y-0 right-0 w-80 max-w-[90vw] bg-white dark:bg-gray-900 shadow-2xl z-50 transform transition-transform duration-300 ease-out ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col border-l-4 border-barbie-pink/20 dark:border-gray-700`}>
        <div className="p-5 border-b-2 flex justify-between items-center bg-linear-to-r from-barbie-soft to-white dark:from-gray-800 dark:to-gray-900 border-barbie-light dark:border-gray-800">
          <h2 className="text-xl font-bold text-barbie-deep dark:text-white flex items-center gap-2"><Heart className="w-5 h-5 text-barbie-pink dark:text-barbie-cyan fill-current" /> Wellness Guide</h2>
          <button onClick={() => setIsSidebarOpen(false)}><X className="w-6 h-6 text-gray-500" /></button>
        </div>
        <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-6">
          
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700">
            <h3 className="font-bold text-gray-800 dark:text-white mb-3 text-sm">Daily Target (ml)</h3>
            <form onSubmit={handleUpdateTarget} className="flex gap-2">
              <input type="number" value={newTargetInput} onChange={(e) => setNewTargetInput(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white outline-none" min="500" step="100" />
              <button type="submit" className="bg-barbie-pink dark:bg-barbie-cyan text-white px-3 py-2 rounded-lg font-bold text-sm">Save</button>
            </form>
          </div>

          <div>
            <h3 className="font-bold text-barbie-deep dark:text-white flex items-center gap-2 mb-2"><Info className="w-4 h-4 text-barbie-cyan" /> Pros of Water</h3>
            <ul className="text-sm text-gray-600 dark:text-gray-300 list-disc pl-5 space-y-1">
              {PROS_OF_WATER.map((pro, i) => <li key={i}>{pro}</li>)}
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-barbie-deep dark:text-white flex items-center gap-2 mb-2"><Flower className="w-4 h-4 text-barbie-pink" /> Beauty Tips</h3>
            <ul className="text-sm text-gray-600 dark:text-gray-300 list-disc pl-5 space-y-1">
              {BEAUTY_TIPS.map((tip, i) => <li key={i}>{tip}</li>)}
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-barbie-deep dark:text-white flex items-center gap-2 mb-2"><Activity className="w-4 h-4 text-red-500" /> Intimate Health</h3>
            <ul className="text-sm text-gray-600 dark:text-gray-300 list-disc pl-5 space-y-1">
              {INTIMATE_HEALTH_TIPS.map((tip, i) => <li key={i}>{tip}</li>)}
            </ul>
          </div>
          
        </div>
      </div>

      <header className="w-full max-w-md flex justify-between items-center py-4 px-2 z-10">
        <h1 className="text-xl font-bold text-barbie-pink dark:text-white flex items-center gap-2 bg-white/50 dark:bg-gray-800/50 px-4 py-2 rounded-full backdrop-blur-sm border border-white dark:border-gray-700">
          <Sparkles className="w-5 h-5 text-barbie-deep dark:text-barbie-cyan" /> HannaHydrate
        </h1>
        <div className="flex gap-2">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 bg-white/80 dark:bg-gray-800/80 rounded-full shadow-md text-barbie-deep dark:text-barbie-cyan"><Sun className="w-5 h-5" /></button>
          <button onClick={requestNativeNotifications} className="p-2 bg-white/80 dark:bg-gray-800/80 rounded-full shadow-md text-barbie-deep dark:text-white"><Bell className="w-5 h-5" /></button>
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-white/80 dark:bg-gray-800/80 rounded-full shadow-md text-barbie-deep dark:text-white"><Menu className="w-5 h-5" /></button>
          <button onClick={handleLogout} className="p-2 bg-white/80 dark:bg-gray-800/80 rounded-full shadow-md text-red-400 hover:text-red-600"><LogOut className="w-5 h-5" /></button>
        </div>
      </header>

      <main className="w-full max-w-md flex flex-col items-center gap-6 mt-2 z-10">
        
        <div className="w-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-3xl p-6 shadow-xl border-t-4 border-barbie-pink dark:border-barbie-cyan text-center">
          <p className="text-sm font-semibold text-gray-400 uppercase">Daily Intake</p>
          <h2 className="text-4xl font-extrabold text-barbie-deep dark:text-white my-2">{consumed} <span className="text-lg font-medium text-gray-400">/ {target} ml</span></h2>
          <div className="w-full bg-gray-100 dark:bg-gray-700 h-8 rounded-full overflow-hidden p-1 my-4 shadow-inner">
            <div className="bg-linear-to-r from-barbie-pink to-barbie-cyan dark:from-barbie-cyan dark:to-blue-500 h-full rounded-full transition-all duration-700 flex items-center justify-end pr-2" style={{ width: `${percentage}%` }}>
              {percentage > 15 && <Droplet className="w-4 h-4 text-white opacity-90" />}
            </div>
          </div>
          <p className="text-sm font-bold text-barbie-pink dark:text-barbie-cyan">{percentage}% Hydrated</p>
        </div>

        <div className="w-full grid grid-cols-3 gap-3">
          {[200, 350, 500].map((amount) => (
            <button key={amount} onClick={() => addWater(amount)} className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border-2 border-white dark:border-gray-700 text-barbie-deep dark:text-white font-bold py-4 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col items-center">
              <Droplet className="w-6 h-6 text-barbie-cyan mb-1" /> +{amount}
            </button>
          ))}
        </div>

        <div className="w-full bg-linear-to-br from-blue-50 to-cyan-100 dark:from-gray-800 dark:to-gray-700 rounded-3xl p-6 shadow-xl border border-cyan-200 dark:border-gray-600 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-barbie-cyan text-white text-xs font-bold px-3 py-1 rounded-bl-lg">Game</div>
          <h3 className="font-extrabold text-gray-800 dark:text-white flex items-center justify-center gap-2 mb-2"><Users className="w-5 h-5 text-blue-500" /> Oasis Rescue</h3>
          <p className="text-xs text-gray-500 dark:text-gray-300 mb-4">Every 250ml you drink earns 1 Water Drop. Use drops to hydrate thirsty travelers!</p>
          
          <div className="flex justify-around items-center mb-4">
            <div className="text-center">
              <p className="text-3xl font-black text-blue-500">{availableDrops}</p>
              <p className="text-xs font-bold text-gray-400 uppercase">Drops</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-black text-green-500">{rescued}</p>
              <p className="text-xs font-bold text-gray-400 uppercase">Rescued</p>
            </div>
          </div>

          <button 
            onClick={handleRescue} 
            disabled={availableDrops <= 0}
            className="w-full py-3 rounded-xl font-bold text-white bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors shadow-md flex items-center justify-center gap-2"
          >
            <Droplet className="w-5 h-5" /> Give Water (Cost: 1 Drop)
          </button>
        </div>
        
        <div className="flex w-full justify-center pb-8">
          <button type="button" onClick={() => {setConsumed(0); setRescued(0);}} className="text-gray-500 dark:text-gray-400 text-xs font-semibold flex items-center gap-1 bg-white/50 dark:bg-gray-800/50 px-3 py-2 rounded-full hover:bg-white dark:hover:bg-gray-700">
            <RefreshCw className="w-3 h-3" /> Reset Tracker & Game
          </button>
        </div>
        
      </main>
    </div>
  );
}
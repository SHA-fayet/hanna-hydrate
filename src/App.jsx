import React, { useState, useEffect } from 'react';
import { Droplet, Sparkles, Bell, RefreshCw, Heart, LogIn, LogOut, Lock, UserPlus, AlertCircle, User, Menu, X, Flower, Activity } from 'lucide-react';
import confetti from 'canvas-confetti';
import OneSignal from 'react-onesignal';

const MOTIVATION_TIPS = [
  "Water gives your skin that natural glowing highlight! ✨",
  "Hydration boosts your energy level—stay fabulous all day! 💖",
  "Drinking water regularly keeps your hair shiny and strong! 💅",
  "Flush away toxins and keep your focus sharp!",
  "A glass of water right after waking up jumpstarts your metabolism! ☀️"
];

const SKINCARE_TIPS = [
  "Always double cleanse at night to melt away SPF and makeup.",
  "Apply moisturizer to damp skin to lock in maximum hydration.",
  "Don't forget SPF on your neck and hands—they show aging first!",
  "Vitamin C serum in the morning protects against environmental stress.",
  "Ice rolling your face in the morning reduces puffiness instantly! 🧊"
];

const HEALTH_TIPS = [
  "Drinking adequate water flushes bacteria and prevents UTIs. 🌸",
  "Hydration needs increase during your luteal phase. Drink up to reduce bloating!",
  "Wear breathable cotton fabrics to maintain natural flora.",
  "Stretching for 5 minutes before bed improves sleep quality and circulation.",
  "Iron and Vitamin C together absorb better—pair your supplements! 💊"
];

const BackgroundEffects = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
    <div className="absolute top-10 left-10 text-barbie-pink/10 animate-bounce" style={{ animationDuration: '3s' }}><Heart size={60} fill="currentColor" /></div>
    <div className="absolute top-40 right-10 text-barbie-cyan/20 animate-pulse" style={{ animationDuration: '4s' }}><Sparkles size={50} /></div>
    <div className="absolute bottom-1/4 left-5 text-barbie-deep/10 animate-bounce" style={{ animationDuration: '5s' }}><Heart size={40} fill="currentColor" /></div>
    <div className="absolute bottom-10 right-20 text-barbie-pink/20 animate-pulse" style={{ animationDuration: '2.5s' }}><Flower size={70} /></div>
  </div>
);

// Global flag to prevent React StrictMode double-initialization crashes
let oneSignalInitialized = false;

export default function App() {
  const [username, setUsername] = useState(() => localStorage.getItem('hannahydrate_session') || "");
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('hannahydrate_session'));
  const [authMode, setAuthMode] = useState('login');
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [target, setTarget] = useState(2000);
  const [consumed, setConsumed] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
  const [currentSkinTip, setCurrentSkinTip] = useState("");
  const [currentHealthTip, setCurrentHealthTip] = useState("");

  useEffect(() => {
    if (!oneSignalInitialized) {
      OneSignal.init({
        appId: "f187475b-64ca-4313-8c8a-f70b8607d20c",
        allowLocalhostAsSecureOrigin: true,
      }).then(() => {
        oneSignalInitialized = true;
        console.log("OneSignal Successfully Initialized");
      }).catch(err => {
        console.error("OneSignal Init Error:", err);
      });
    }
  }, []);

  useEffect(() => {
    const randomizeContent = () => {
      setTipIndex(Math.floor(Math.random() * MOTIVATION_TIPS.length));
      setCurrentSkinTip(SKINCARE_TIPS[Math.floor(Math.random() * SKINCARE_TIPS.length)]);
      setCurrentHealthTip(HEALTH_TIPS[Math.floor(Math.random() * HEALTH_TIPS.length)]);
    };
    randomizeContent();
    const contentInterval = setInterval(randomizeContent, 6 * 60 * 60 * 1000);
    return () => clearInterval(contentInterval);
  }, []);

  useEffect(() => {
    if (isAuthenticated && oneSignalInitialized) {
      const savedData = localStorage.getItem(`water_data_${username}`);
      setConsumed(savedData ? JSON.parse(savedData) : 0);
      
      try {
        OneSignal.User.addTag("is_active", "true");
      } catch (err) {
        console.error("Tagging error:", err);
      }
    }
  }, [isAuthenticated, username]);

  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem(`water_data_${username}`, JSON.stringify(consumed));
      if (consumed >= target && target > 0) {
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#E0218A', '#22D3EE', '#FCE7F3'] });
      }
    }
  }, [consumed, target, isAuthenticated, username]);

  const addWater = (amount) => {
    setConsumed((prev) => prev + amount);
    setTipIndex((prev) => (prev + 1) % MOTIVATION_TIPS.length); 
  };

  const handleAuth = (e) => {
    e.preventDefault();
    setError("");
    const usersDB = JSON.parse(localStorage.getItem('usersDB')) || {};

    if (authMode === 'register') {
      if (usersDB[username]) {
        setError("Username already exists! Try logging in.");
        return;
      }
      usersDB[username] = { password };
      localStorage.setItem('usersDB', JSON.stringify(usersDB));
      localStorage.setItem('hannahydrate_session', username);
      setIsAuthenticated(true);
    } else {
      if (!usersDB[username] || usersDB[username].password !== password) {
        setError("Invalid username or password. ❌");
        return;
      }
      localStorage.setItem('hannahydrate_session', username);
      setIsAuthenticated(true);
    }
  };

  const handleLogout = () => {
    if (oneSignalInitialized) {
      try {
        OneSignal.User.removeTag("is_active");
      } catch (err) {
        console.error("Untagging error:", err);
      }
    }
    localStorage.removeItem('hannahydrate_session');
    setIsAuthenticated(false);
    setUsername("");
    setPassword("");
  };

const requestNotificationPermission = async () => {
    try {
      console.log("Current Notification Permission State:", Notification.permission);
      
      // Force direct native browser prompt, bypassing wrapper locks
      const permissionResult = await OneSignal.Notifications.requestPermission();
      console.log("Permission request result:", permissionResult);

      const optedIn = OneSignal.User.PushSubscription.optedIn;
      const token = OneSignal.User.PushSubscription.token;

      console.log("Opted In Status:", optedIn);
      console.log("Generated Token:", token);

      if (optedIn && token) {
        alert("✨ Push notifications successfully enabled and token secured!");
      } else {
        alert(`⚠️ Prompt finished, but subscription token is missing. Permission state: ${Notification.permission}`);
      }
    } catch (error) {
      console.error("Critical permission dispatch failure:", error);
      alert("⚠️ Push registration error. Check F12 console logs.");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-linear-to-br from-barbie-soft to-barbie-light relative overflow-hidden">
        <BackgroundEffects />
        <div className="bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-2xl border-4 border-white/50 max-w-sm w-full text-center z-10 relative">
          <Sparkles className="w-12 h-12 text-barbie-pink mx-auto mb-4 animate-bounce" />
          <h1 className="text-3xl font-bold text-barbie-deep mb-2">HannaHydrate</h1>
          <p className="text-gray-500 mb-6 text-sm">{authMode === 'login' ? "Welcome back, gorgeous! ✨" : "Create your tracker account! ✨"}</p>
          {error && <div className="bg-red-100 text-red-600 p-3 rounded-lg text-sm mb-4 flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" /> {error}</div>}
          <form onSubmit={handleAuth} className="flex flex-col gap-4">
            <div className="relative">
              <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-barbie-light focus:border-barbie-pink focus:outline-none pl-10 bg-white/80" required />
              <User className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
            </div>
            <div className="relative">
              <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-barbie-light focus:border-barbie-pink focus:outline-none pl-10 bg-white/80" required />
              <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
            </div>
            <button type="submit" className="w-full bg-linear-to-r from-barbie-pink to-barbie-deep text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex justify-center items-center gap-2 mt-2">
              {authMode === 'login' ? <><LogIn className="w-5 h-5" /> Let's Glow</> : <><UserPlus className="w-5 h-5" /> Register Now</>}
            </button>
          </form>
          <button onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setError(""); }} className="text-barbie-pink text-sm mt-6 hover:underline font-medium">
            {authMode === 'login' ? "Need an account? Sign up here." : "Already have an account? Log in."}
          </button>
        </div>
      </div>
    );
  }

  const percentage = Math.min(Math.round((consumed / target) * 100), 100);

  return (
    <div className="min-h-screen bg-linear-to-br from-barbie-soft to-[#FFE4F2] flex flex-col items-center p-4 relative overflow-hidden">
      <BackgroundEffects />
      
      {isSidebarOpen && <div className="fixed inset-0 bg-barbie-deep/20 backdrop-blur-sm z-40 transition-opacity" onClick={() => setIsSidebarOpen(false)} />}
      
      <div className={`fixed inset-y-0 right-0 w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col border-l-4 border-barbie-pink/20`}>
        <div className="p-5 border-b-2 border-barbie-light flex justify-between items-center bg-linear-to-r from-barbie-soft to-white">
          <h2 className="text-xl font-bold text-barbie-deep flex items-center gap-2"><Heart className="w-5 h-5 text-barbie-pink fill-current" /> Wellness Guide</h2>
          <button onClick={() => setIsSidebarOpen(false)} className="p-1 hover:bg-barbie-light rounded-full transition"><X className="w-6 h-6 text-gray-500" /></button>
        </div>
        <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-6">
          <div className="bg-linear-to-br from-white to-barbie-light/40 p-4 rounded-2xl border border-barbie-pink/20 shadow-sm">
            <h3 className="font-bold text-barbie-deep flex items-center gap-2 mb-3"><Flower className="w-5 h-5 text-barbie-pink"/> Beauty Tip</h3>
            <p className="text-sm text-gray-700 leading-relaxed font-medium">{currentSkinTip}</p>
          </div>
          <div className="bg-linear-to-br from-white to-barbie-cyan/10 p-4 rounded-2xl border border-barbie-cyan/20 shadow-sm">
            <h3 className="font-bold text-barbie-deep flex items-center gap-2 mb-3"><Activity className="w-5 h-5 text-barbie-cyan"/> Health Tip</h3>
            <p className="text-sm text-gray-700 leading-relaxed font-medium">{currentHealthTip}</p>
          </div>
        </div>
      </div>

      <header className="w-full max-w-md flex justify-between items-center py-4 px-2 z-10">
        <h1 className="text-xl font-bold text-barbie-pink flex items-center gap-2 drop-shadow-sm bg-white/50 px-4 py-2 rounded-full backdrop-blur-sm border border-white">
          <Sparkles className="w-5 h-5 animate-pulse text-barbie-deep" /> HannaHydrate
        </h1>
        <div className="flex gap-2">
          <button onClick={requestNotificationPermission} className="p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md text-barbie-pink hover:scale-110 transition-transform title='Enable Push Notifications'">
            <Bell className="w-5 h-5" />
          </button>
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md text-barbie-deep hover:scale-110 transition-transform">
            <Menu className="w-5 h-5" />
          </button>
          <button onClick={handleLogout} className="p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md text-gray-400 hover:text-red-500 hover:scale-110 transition-transform">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="w-full max-w-md flex flex-col items-center gap-6 mt-2 z-10">
        <div className="w-full bg-white/90 backdrop-blur-md rounded-3xl p-6 shadow-xl border-t-4 border-barbie-pink text-center">
          <p className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Hey {username}!</p>
          <h2 className="text-4xl font-extrabold text-barbie-deep my-2 drop-shadow-sm">{consumed} <span className="text-lg font-medium text-gray-400">/ {target} ml</span></h2>
          <div className="w-full bg-gray-100 h-8 rounded-full overflow-hidden p-1 my-4 border border-barbie-light shadow-inner">
            <div className="bg-linear-to-r from-barbie-pink via-barbie-deep to-barbie-cyan h-full rounded-full transition-all duration-700 ease-out flex items-center justify-end pr-2 relative overflow-hidden" style={{ width: `${percentage}%` }}>
              <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              {percentage > 15 && <Droplet className="w-4 h-4 text-white opacity-90 z-10" />}
            </div>
          </div>
          <p className="text-sm font-bold text-barbie-pink">{percentage}% Hydrated 💦</p>
        </div>

        <div className="w-full grid grid-cols-3 gap-3">
          {[200, 350, 500].map((amount) => (
            <button key={amount} onClick={() => addWater(amount)} className="bg-white/90 backdrop-blur-md border-2 border-white hover:border-barbie-pink text-barbie-deep font-bold py-4 px-2 rounded-2xl shadow-sm hover:shadow-lg transform hover:-translate-y-1 transition-all flex flex-col items-center gap-2">
              <Droplet className="w-6 h-6 text-barbie-cyan" /> +{amount}ml
            </button>
          ))}
        </div>

        <div className="w-full bg-linear-to-br from-barbie-pink to-barbie-deep rounded-3xl p-6 text-white shadow-xl hover:shadow-2xl transition-shadow">
          <div className="flex items-center justify-between mb-3 border-b border-white/30 pb-2">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-barbie-cyan fill-current" />
              <span className="font-bold text-sm tracking-widest uppercase">Motivation</span>
            </div>
          </div>
          <p className="text-lg font-medium italic drop-shadow-md">"{MOTIVATION_TIPS[tipIndex]}"</p>
        </div>

        <div className="flex w-full mt-2 justify-center">
          <button onClick={() => setConsumed(0)} className="text-gray-500 hover:text-barbie-deep text-xs font-semibold flex items-center gap-1 transition-colors bg-white/50 px-3 py-2 rounded-full">
            <RefreshCw className="w-3 h-3" /> Reset Tracker
          </button>
        </div>
      </main>
    </div>
  );
}
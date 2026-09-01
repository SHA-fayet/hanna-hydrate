import { useEffect, useState } from 'react';
import {
  Activity,
  AlertCircle,
  Bell,
  Droplet,
  Flower,
  Heart,
  LogIn,
  LogOut,
  Lock,
  Menu,
  RefreshCw,
  Sparkles,
  User,
  UserPlus,
  X,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import OneSignal from 'react-onesignal';

const ONESIGNAL_APP_ID = 'f187475b-64ca-4313-8c8a-f70b8607d20c';
const SERVICE_WORKER_PATH = '/OneSignalSDKWorker.js';
const DEFAULT_TARGET_ML = 2000;

const MOTIVATION_TIPS = [
  'Water gives your skin that natural glowing highlight! ✨',
  'Hydration boosts your energy level—stay fabulous all day! 💖',
  'Drinking water regularly keeps your hair shiny and strong! 💅',
  'Flush away toxins and keep your focus sharp!',
  'A glass of water right after waking up jumpstarts your metabolism! ☀️',
];

const SKINCARE_TIPS = [
  'Always double cleanse at night to melt away SPF and makeup.',
  'Apply moisturizer to damp skin to lock in maximum hydration.',
  "Don't forget SPF on your neck and hands—they show aging first!",
  'Vitamin C serum in the morning protects against environmental stress.',
  'Ice rolling your face in the morning reduces puffiness instantly! 🧊',
];

const HEALTH_TIPS = [
  'Drink enough water throughout the day to support normal body functions. 🌸',
  'Hydration needs can increase with heat and activity. Sip regularly!',
  'Choose breathable fabrics and keep your body comfortable in warm weather.',
  'Gentle stretching before bed can help you wind down and relax.',
  'Pair iron-rich foods with vitamin C-rich foods to support iron absorption. 💊',
];

const getStoredNumber = (key, fallback = 0) => {
  try {
    const value = Number.parseInt(localStorage.getItem(key) ?? '', 10);
    return Number.isFinite(value) && value >= 0 ? value : fallback;
  } catch {
    return fallback;
  }
};

const getStoredUsers = () => {
  try {
    const value = JSON.parse(localStorage.getItem('usersDB') || '{}');
    return value && typeof value === 'object' ? value : {};
  } catch {
    return {};
  }
};

const waitForPushSubscription = async (timeoutMs = 15000) => {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const subscription = OneSignal.User.PushSubscription;

    if (subscription?.optedIn && subscription?.id) {
      return subscription;
    }

    await new Promise((resolve) => window.setTimeout(resolve, 500));
  }

  return OneSignal.User.PushSubscription;
};

// One shared promise prevents duplicate OneSignal.init() calls.
let oneSignalInitPromise = null;

const initOneSignal = () => {
  if (!oneSignalInitPromise) {
    oneSignalInitPromise = OneSignal.init({
      appId: ONESIGNAL_APP_ID,
      autoRegister: false,
      autoResubscribe: true,
      serviceWorkerPath: SERVICE_WORKER_PATH,
      allowLocalhostAsSecureOrigin: true,
    });
  }

  return oneSignalInitPromise;
};

const BackgroundEffects = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
    <div
      className="absolute top-10 left-10 text-barbie-pink/10 animate-bounce"
      style={{ animationDuration: '3s' }}
    >
      <Heart size={60} fill="currentColor" />
    </div>
    <div
      className="absolute top-40 right-10 text-barbie-cyan/20 animate-pulse"
      style={{ animationDuration: '4s' }}
    >
      <Sparkles size={50} />
    </div>
    <div
      className="absolute bottom-1/4 left-5 text-barbie-deep/10 animate-bounce"
      style={{ animationDuration: '5s' }}
    >
      <Heart size={40} fill="currentColor" />
    </div>
    <div
      className="absolute bottom-10 right-20 text-barbie-pink/20 animate-pulse"
      style={{ animationDuration: '2.5s' }}
    >
      <Flower size={70} />
    </div>
  </div>
);

export default function App() {
  const [username, setUsername] = useState(
    () => localStorage.getItem('hannahydrate_session') || '',
  );
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => Boolean(localStorage.getItem('hannahydrate_session')),
  );
  const [authMode, setAuthMode] = useState('login');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [target] = useState(DEFAULT_TARGET_ML);
  const [consumed, setConsumed] = useState(() => {
    const activeUser = localStorage.getItem('hannahydrate_session');
    return activeUser ? getStoredNumber(`water_data_${activeUser}`) : 0;
  });
  const [tipIndex, setTipIndex] = useState(0);
  const [currentSkinTip, setCurrentSkinTip] = useState('');
  const [currentHealthTip, setCurrentHealthTip] = useState('');
  const [oneSignalReady, setOneSignalReady] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState('checking');
  const [notificationBusy, setNotificationBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const setupOneSignal = async () => {
      try {
        await initOneSignal();

        if (cancelled) return;

        setOneSignalReady(true);

        const current = OneSignal.User.PushSubscription;
        setNotificationStatus(current?.optedIn && current?.id ? 'enabled' : 'disabled');

        console.info('✅ OneSignal initialized');
        console.info('Push supported:', OneSignal.Notifications.isPushSupported());
        console.info('Native permission:', OneSignal.Notifications.permissionNative);
      } catch (err) {
        console.error('❌ OneSignal initialization failed:', err);

        if (!cancelled) {
          setOneSignalReady(false);
          setNotificationStatus('error');
        }
      }
    };

    setupOneSignal();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!oneSignalReady) return undefined;

    const handleSubscriptionChange = (change) => {
      const current = change?.current;
      const enabled = Boolean(current?.optedIn && current?.id);

      console.info('🔔 Push subscription changed:', current);
      setNotificationStatus(enabled ? 'enabled' : 'disabled');
    };

    OneSignal.User.PushSubscription.addEventListener('change', handleSubscriptionChange);

    return () => {
      OneSignal.User.PushSubscription.removeEventListener('change', handleSubscriptionChange);
    };
  }, [oneSignalReady]);

  useEffect(() => {
    const randomizeContent = () => {
      setTipIndex(Math.floor(Math.random() * MOTIVATION_TIPS.length));
      setCurrentSkinTip(
        SKINCARE_TIPS[Math.floor(Math.random() * SKINCARE_TIPS.length)],
      );
      setCurrentHealthTip(
        HEALTH_TIPS[Math.floor(Math.random() * HEALTH_TIPS.length)],
      );
    };

    randomizeContent();
    const contentInterval = window.setInterval(
      randomizeContent,
      6 * 60 * 60 * 1000,
    );

    return () => window.clearInterval(contentInterval);
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !username) return undefined;

    let cancelled = false;

    const syncUserWithOneSignal = async () => {
      try {
        await initOneSignal();
        if (cancelled) return;

        await OneSignal.login(username);
        OneSignal.User.addTag('is_active', 'true');
        console.info(`✅ OneSignal user logged in as: ${username}`);
      } catch (err) {
        console.error('OneSignal user sync error:', err);
      }
    };

    syncUserWithOneSignal();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, username]);

  useEffect(() => {
    if (!isAuthenticated || !username) return;

    localStorage.setItem(`water_data_${username}`, String(consumed));
  }, [consumed, isAuthenticated, username]);

  useEffect(() => {
    if (consumed === target && target > 0) {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#E0218A', '#22D3EE', '#FCE7F3'],
      });
    }
  }, [consumed, target]);

  const addWater = (amount) => {
    setConsumed((previous) => previous + amount);
    setTipIndex((previous) => (previous + 1) % MOTIVATION_TIPS.length);
  };

  const handleAuth = (event) => {
    event.preventDefault();
    setError('');

    const cleanUsername = username.trim();
    if (!cleanUsername || !password) {
      setError('Please enter both a username and password.');
      return;
    }

    const usersDB = getStoredUsers();

    if (authMode === 'register') {
      if (usersDB[cleanUsername]) {
        setError('Username already exists! Try logging in.');
        return;
      }

      usersDB[cleanUsername] = { password };
      localStorage.setItem('usersDB', JSON.stringify(usersDB));
    } else if (!usersDB[cleanUsername] || usersDB[cleanUsername].password !== password) {
      setError('Invalid username or password. ❌');
      return;
    }

    localStorage.setItem('hannahydrate_session', cleanUsername);
    setUsername(cleanUsername);
    setConsumed(getStoredNumber(`water_data_${cleanUsername}`));
    setPassword('');
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    try {
      if (oneSignalReady) {
        OneSignal.User.removeTag('is_active');
        await OneSignal.logout();
      }
    } catch (err) {
      console.error('OneSignal logout error:', err);
    } finally {
      localStorage.removeItem('hannahydrate_session');
      setIsAuthenticated(false);
      setUsername('');
      setConsumed(0);
      setPassword('');
      setIsSidebarOpen(false);
    }
  };

  const requestNotificationPermission = async () => {
    if (notificationBusy) return;

    setNotificationBusy(true);

    try {
      console.info('🔔 Notification setup started');
      await initOneSignal();
      setOneSignalReady(true);

      if (!OneSignal.Notifications.isPushSupported()) {
        setNotificationStatus('error');
        alert('❌ This browser does not support web push notifications.');
        return;
      }

      const nativePermission = OneSignal.Notifications.permissionNative;
      console.info('Browser notification permission:', nativePermission);

      if (nativePermission === 'denied') {
        setNotificationStatus('denied');
        alert(
          '❌ Notifications are blocked for HannaHydrate. Open your browser site settings, allow Notifications, reload the page, and try again.',
        );
        return;
      }

      if (nativePermission === 'default') {
        const accepted = await OneSignal.Notifications.requestPermission();
        console.info('Native permission request result:', accepted);

        if (!accepted) {
          setNotificationStatus('disabled');
          alert('Notifications were not enabled. Please choose Allow in the browser prompt.');
          return;
        }
      }

      // Calling optIn after native permission ensures OneSignal creates the web push subscription.
      await OneSignal.User.PushSubscription.optIn();

      const subscription = await waitForPushSubscription();

      console.info('🔔 OneSignal subscription:', {
        id: subscription?.id,
        token: subscription?.token,
        optedIn: subscription?.optedIn,
      });

      if (subscription?.optedIn && subscription?.id) {
        setNotificationStatus('enabled');
        alert('✨ Notifications are enabled! Now send a test push from OneSignal → Audience → Subscriptions.');
      } else {
        setNotificationStatus('disabled');
        alert(
          '⚠️ Browser permission is enabled, but OneSignal did not create a push subscription yet. Check the browser console and the service-worker URL.',
        );
      }
    } catch (err) {
      console.error('❌ Push registration failed:', err);
      setNotificationStatus('error');
      alert(`⚠️ Push registration failed. ${err?.message || 'Check the browser console for details.'}`);
    } finally {
      setNotificationBusy(false);
    }
  };

  const percentage = target > 0
    ? Math.min(Math.round((consumed / target) * 100), 100)
    : 0;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-linear-to-br from-barbie-soft to-barbie-light relative overflow-hidden">
        <BackgroundEffects />

        <div className="bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-2xl border-4 border-white/50 max-w-sm w-full text-center z-10 relative">
          <Sparkles className="w-12 h-12 text-barbie-pink mx-auto mb-4 animate-bounce" />
          <h1 className="text-3xl font-bold text-barbie-deep mb-2">HannaHydrate</h1>
          <p className="text-gray-500 mb-6 text-sm">
            {authMode === 'login'
              ? 'Welcome back, gorgeous! ✨'
              : 'Create your tracker account! ✨'}
          </p>

          {error && (
            <div className="bg-red-100 text-red-600 p-3 rounded-lg text-sm mb-4 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleAuth} className="flex flex-col gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                className="w-full px-4 py-3 rounded-xl border-2 border-barbie-light focus:border-barbie-pink focus:outline-none pl-10 bg-white/80"
                required
              />
              <User className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
            </div>

            <div className="relative">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                className="w-full px-4 py-3 rounded-xl border-2 border-barbie-light focus:border-barbie-pink focus:outline-none pl-10 bg-white/80"
                required
              />
              <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
            </div>

            <button
              type="submit"
              className="w-full bg-linear-to-r from-barbie-pink to-barbie-deep text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex justify-center items-center gap-2 mt-2"
            >
              {authMode === 'login' ? (
                <>
                  <LogIn className="w-5 h-5" />
                  Let's Glow
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Register Now
                </>
              )}
            </button>
          </form>

          <button
            type="button"
            onClick={() => {
              setAuthMode((mode) => (mode === 'login' ? 'register' : 'login'));
              setError('');
            }}
            className="text-barbie-pink text-sm mt-6 hover:underline font-medium"
          >
            {authMode === 'login'
              ? 'Need an account? Sign up here.'
              : 'Already have an account? Log in.'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-barbie-soft to-[#FFE4F2] flex flex-col items-center p-4 relative overflow-hidden">
      <BackgroundEffects />

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-barbie-deep/20 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <div
        className={`fixed inset-y-0 right-0 w-80 max-w-[90vw] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out ${
          isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
        } flex flex-col border-l-4 border-barbie-pink/20`}
      >
        <div className="p-5 border-b-2 border-barbie-light flex justify-between items-center bg-linear-to-r from-barbie-soft to-white">
          <h2 className="text-xl font-bold text-barbie-deep flex items-center gap-2">
            <Heart className="w-5 h-5 text-barbie-pink fill-current" />
            Wellness Guide
          </h2>
          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="p-1 hover:bg-barbie-light rounded-full transition"
            aria-label="Close wellness guide"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-6">
          <div className="bg-linear-to-br from-white to-barbie-light/40 p-4 rounded-2xl border border-barbie-pink/20 shadow-sm">
            <h3 className="font-bold text-barbie-deep flex items-center gap-2 mb-3">
              <Flower className="w-5 h-5 text-barbie-pink" />
              Beauty Tip
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed font-medium">{currentSkinTip}</p>
          </div>

          <div className="bg-linear-to-br from-white to-barbie-cyan/10 p-4 rounded-2xl border border-barbie-cyan/20 shadow-sm">
            <h3 className="font-bold text-barbie-deep flex items-center gap-2 mb-3">
              <Activity className="w-5 h-5 text-barbie-cyan" />
              Health Tip
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed font-medium">{currentHealthTip}</p>
          </div>
        </div>
      </div>

      <header className="w-full max-w-md flex justify-between items-center py-4 px-2 z-10">
        <h1 className="text-xl font-bold text-barbie-pink flex items-center gap-2 drop-shadow-sm bg-white/50 px-4 py-2 rounded-full backdrop-blur-sm border border-white">
          <Sparkles className="w-5 h-5 animate-pulse text-barbie-deep" />
          HannaHydrate
        </h1>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={requestNotificationPermission}
            disabled={!oneSignalReady || notificationBusy}
            title={
              notificationStatus === 'enabled'
                ? 'Push notifications enabled'
                : notificationStatus === 'checking'
                  ? 'Connecting to notification service…'
                  : 'Enable push notifications'
            }
            aria-label="Enable push notifications"
            className="p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md text-barbie-pink hover:scale-110 transition-transform disabled:opacity-40 disabled:hover:scale-100"
          >
            <Bell
              className={
                notificationStatus === 'enabled'
                  ? 'w-5 h-5 fill-current'
                  : 'w-5 h-5'
              }
            />
          </button>

          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md text-barbie-deep hover:scale-110 transition-transform"
            aria-label="Open wellness guide"
          >
            <Menu className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md text-gray-400 hover:text-red-500 hover:scale-110 transition-transform"
            aria-label="Log out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="w-full max-w-md flex flex-col items-center gap-6 mt-2 z-10">
        <div className="w-full bg-white/90 backdrop-blur-md rounded-3xl p-6 shadow-xl border-t-4 border-barbie-pink text-center">
          <p className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Hey {username}!</p>
          <h2 className="text-4xl font-extrabold text-barbie-deep my-2 drop-shadow-sm">
            {consumed}{' '}
            <span className="text-lg font-medium text-gray-400">/ {target} ml</span>
          </h2>

          <div className="w-full bg-gray-100 h-8 rounded-full overflow-hidden p-1 my-4 border border-barbie-light shadow-inner">
            <div
              className="bg-linear-to-r from-barbie-pink via-barbie-deep to-barbie-cyan h-full rounded-full transition-all duration-700 ease-out flex items-center justify-end pr-2 relative overflow-hidden"
              style={{ width: `${percentage}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
              {percentage > 15 && <Droplet className="w-4 h-4 text-white opacity-90 z-10" />}
            </div>
          </div>

          <p className="text-sm font-bold text-barbie-pink">{percentage}% Hydrated 💦</p>
        </div>

        <div className="w-full grid grid-cols-3 gap-3">
          {[200, 350, 500].map((amount) => (
            <button
              type="button"
              key={amount}
              onClick={() => addWater(amount)}
              className="bg-white/90 backdrop-blur-md border-2 border-white hover:border-barbie-pink text-barbie-deep font-bold py-4 px-2 rounded-2xl shadow-sm hover:shadow-lg transform hover:-translate-y-1 transition-all flex flex-col items-center gap-2"
            >
              <Droplet className="w-6 h-6 text-barbie-cyan" />
              +{amount}ml
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
          <button
            type="button"
            onClick={() => setConsumed(0)}
            className="text-gray-500 hover:text-barbie-deep text-xs font-semibold flex items-center gap-1 transition-colors bg-white/50 px-3 py-2 rounded-full"
          >
            <RefreshCw className="w-3 h-3" />
            Reset Tracker
          </button>
        </div>
      </main>
    </div>
  );
}

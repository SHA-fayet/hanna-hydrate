import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Activity, Award, Bell, BellRing, Droplet, Dumbbell, Flame, Flower2, Gamepad2,
  Heart, Info, LogOut, Menu, Moon, Play, Sparkles, Sprout, Sun, Trophy, Waves, X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

/* ------------------------------------------------------------------ */
/* Constants                                                          */
/* ------------------------------------------------------------------ */

const DEFAULT_TARGET_ML = 2000;
const ML_PER_RESCUE = 200;
const REMINDER_INTERVAL_MS = 2 * 60 * 60 * 1000;
const QUIET_HOURS_START = 8;
const QUIET_HOURS_END = 22;
const ML_PER_OZ = 29.5735;

const GAME_DURATION_S = 45;
const GAME_TICK_MS = 40;
const GAME_START_LIVES = 3;
const ARENA_HEIGHT = 280;

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/* Three onboarding "vibes" — each swaps the CSS variables in index.css
   via document.documentElement.dataset.gender, so nothing else in this
   file needs to branch on gender except copy and which tip set to show. */
const THEMES = {
  female: { id: 'female', name: 'Bloom', tagline: 'Hydrate & glow', icon: Heart, swatches: ['#E0218A', '#22D3EE'] },
  male: { id: 'male', name: 'Tide', tagline: 'Fuel your grind', icon: Dumbbell, swatches: ['#2563EB', '#10B981'] },
  neutral: { id: 'neutral', name: 'Aurora', tagline: 'Balance, your way', icon: Waves, swatches: ['#7C3AED', '#14B8A6'] },
};

const GARDEN_STAGES = [
  { min: 0, emoji: '🌱', label: 'Seedling' },
  { min: 2, emoji: '🌿', label: 'Sprout' },
  { min: 7, emoji: '🪴', label: 'Potted' },
  { min: 14, emoji: '🌻', label: 'Blossoming' },
  { min: 30, emoji: '🌳', label: 'Full Bloom' },
];

const PROS_OF_WATER = [
  'Water lubricates your joints and cushions your tissues! 💧',
  'Staying hydrated regulates body temperature and prevents overheating. 🌡️',
  'Water aids in digestion and prevents constipation. 🥗',
  'It flushes out waste and toxins through the kidneys. 🚽',
  'Hydration delivers oxygen and nutrients to cells efficiently! 🌬️',
  'Even mild dehydration can zap your energy and focus. ⚡',
  'Water helps carry nutrients to give you more energy. 🔋',
];

const BEAUTY_TIPS = [
  'Water maintains skin elasticity, preventing premature wrinkling. ✨',
  'Applying moisturizer to damp skin locks in maximum hydration. 🧴',
  'Double cleanse at night to melt away SPF and pollutants. 🧼',
  'Hydration reduces eye puffiness and flushes out sodium. 👁️',
  'A hydrated scalp means fewer flakes and shinier hair. 💇‍♀️',
];
const INTIMATE_HEALTH_TIPS = [
  'Adequate hydration maintains natural vaginal lubrication and tissue elasticity. 🌸',
  'Drinking plenty of water flushes bacteria, significantly reducing UTI risks. 🛡️',
  'Proper hydration improves overall blood flow, naturally enhancing sensitivity. 💓',
  'Water helps balance hormonal fluctuations and fights cycle-related fatigue. ⚖️',
  'Staying hydrated can help ease period bloating and cramps. 🌙',
];

const PERFORMANCE_TIPS = [
  'Even 2% dehydration can measurably drop your strength and power output. 💪',
  'Water regulates body temperature so you can push harder for longer. 🔥',
  'Proper hydration helps maintain healthy testosterone and hormone balance. ⚙️',
  'Staying hydrated sharpens reaction time and focus during training. 🎯',
  'Water helps deliver oxygen to muscles for better endurance. 🫁',
];
const RECOVERY_TIPS = [
  'Hydration helps flush lactic acid, easing post-workout soreness. 🏋️',
  'Water supports joint lubrication, protecting your knees and shoulders. 🦵',
  'Rehydrating after exercise speeds up muscle glycogen replenishment. 🔋',
  'Good hydration supports quality sleep, key for muscle repair. 😴',
  'Water helps regulate heart rate for a faster return to baseline. ❤️',
];

const FOCUS_TIPS = [
  'Mild dehydration can shrink your attention span and short-term memory. 🧠',
  'Water helps balance mood and reduce feelings of anxiety. 🌤️',
  'Staying hydrated keeps headaches and brain fog at bay. 🌫️',
  'Drinking water first thing kickstarts your metabolism for the day. ☀️',
  'Proper hydration supports steady energy without the caffeine crash. ⚡',
];
const SLEEP_TIPS = [
  'A well-hydrated body regulates temperature better for deeper sleep. 🌙',
  'Avoid chugging water right before bed to skip 3am wake-ups. 🛏️',
  'Hydration supports healthy digestion, which can mean fewer disrupted nights. 🍽️',
  'Water helps your body clear toxins overnight through natural processes. 🌿',
  'Staying hydrated during the day reduces next-morning fatigue. 🌅',
];

const SIDEBAR_CONTENT = {
  female: {
    heading: "Women's Wellness",
    sectionA: { title: 'Beauty Tip', icon: Flower2, tips: BEAUTY_TIPS },
    sectionB: { title: 'Intimate Health', icon: Activity, tips: INTIMATE_HEALTH_TIPS },
  },
  male: {
    heading: "Men's Performance",
    sectionA: { title: 'Performance Tip', icon: Dumbbell, tips: PERFORMANCE_TIPS },
    sectionB: { title: 'Recovery', icon: Activity, tips: RECOVERY_TIPS },
  },
  neutral: {
    heading: 'Wellness Hub',
    sectionA: { title: 'Mind & Focus', icon: Sparkles, tips: FOCUS_TIPS },
    sectionB: { title: 'Rest & Recovery', icon: Moon, tips: SLEEP_TIPS },
  },
};

const BADGE_DEFS = [
  { id: 'first_sip', label: 'First Sip', desc: 'Logged your first glass of water', icon: Droplet, check: (s) => s.totalLifetimeMl > 0 },
  { id: 'streak_7', label: 'Week Warrior', desc: '7-day hydration streak', icon: Flame, check: (s) => s.streak >= 7 },
  { id: 'streak_30', label: 'Month Master', desc: '30-day hydration streak', icon: Trophy, check: (s) => s.streak >= 30 },
  { id: 'rescuer_10', label: 'Rescue Squad', desc: 'Rescued 10 thirsty travelers', icon: Heart, check: (s) => s.rescued >= 10 },
  { id: 'rescuer_50', label: 'Hydration Hero', desc: 'Rescued 50 thirsty travelers', icon: Award, check: (s) => s.rescued >= 50 },
  { id: 'goal_getter', label: 'Goal Getter', desc: 'Hit your daily goal 10 times', icon: Sparkles, check: (s) => s.goalHitCount >= 10 },
  { id: 'high_scorer', label: 'Splash Champion', desc: 'Scored 300+ in Splash Catch', icon: Gamepad2, check: (s) => s.highScore >= 300 },
];

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

const getStoredNumber = (key, fallback = 0) => {
  try {
    const value = Number.parseFloat(localStorage.getItem(key) ?? '');
    return Number.isFinite(value) && value >= 0 ? value : fallback;
  } catch { return fallback; }
};

const getStoredUsers = () => {
  try {
    const value = JSON.parse(localStorage.getItem('usersDB') || '{}');
    return value && typeof value === 'object' ? value : {};
  } catch { return {}; }
};

const withOneSignal = (callback) => {
  try {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(callback);
  } catch (e) {
    console.warn('OneSignal unavailable:', e);
  }
};

const gardenStageFor = (streak) => {
  let stage = GARDEN_STAGES[0];
  for (const s of GARDEN_STAGES) if (streak >= s.min) stage = s;
  return stage;
};

const BackgroundEffects = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
    <div className="absolute top-10 left-10 text-gray-300/30 dark:text-gray-600/20 animate-bounce" style={{ animationDuration: '3s' }}><Sparkles size={50} /></div>
    <div className="absolute top-40 right-10 text-gray-300/30 dark:text-gray-600/20 animate-pulse" style={{ animationDuration: '4s' }}><Droplet size={46} /></div>
    <div className="absolute bottom-1/4 left-5 text-gray-300/30 dark:text-gray-600/20 animate-bounce" style={{ animationDuration: '5s' }}><Sparkles size={36} /></div>
  </div>
);

/* ------------------------------------------------------------------ */
/* Splash Catch — a dedicated arcade mini-game. Drag or use arrow keys */
/* to steer the cup, catch water and stars, dodge the coffee.         */
/* ------------------------------------------------------------------ */

function SplashCatchGame({ onExit, onGameEnd, highScore }) {
  const [status, setStatus] = useState('idle'); // idle | playing | over
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(GAME_START_LIVES);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [items, setItems] = useState([]);
  const [pops, setPops] = useState([]);
  const [flash, setFlash] = useState(false);
  const [cupX, setCupX] = useState(50);

  const cupXRef = useRef(50);
  const spawnCounterRef = useRef(700);
  const arenaRef = useRef(null);
  const finalScoreRef = useRef(0);

  useEffect(() => { cupXRef.current = cupX; }, [cupX]);
  useEffect(() => { finalScoreRef.current = score; }, [score]);

  const moveCupToClientX = useCallback((clientX) => {
    const el = arenaRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setCupX(Math.min(93, Math.max(7, pct)));
  }, []);

  useEffect(() => {
    if (status !== 'playing') return;
    const id = setInterval(() => {
      setElapsedMs((prev) => prev + GAME_TICK_MS);
      spawnCounterRef.current -= GAME_TICK_MS;

      setItems((prevItems) => {
        let list = prevItems;
        if (spawnCounterRef.current <= 0) {
          const roll = Math.random();
          const type = roll < 0.1 ? 'star' : roll < 0.32 ? 'hazard' : 'water';
          list = [...list, {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            x: 10 + Math.random() * 80,
            y: -10,
            type,
            speed: 2.4 + Math.random() * 1.3,
          }];
          spawnCounterRef.current = Math.max(420, 900 - elapsedMs / 45);
        }

        const next = [];
        let scoreDelta = 0;
        let livesDelta = 0;
        const newPops = [];
        for (const it of list) {
          const ny = it.y + it.speed;
          const inZone = ny > ARENA_HEIGHT - 78 && ny < ARENA_HEIGHT - 8;
          const dx = Math.abs(it.x - cupXRef.current);
          if (inZone && dx < 10) {
            if (it.type === 'hazard') {
              livesDelta -= 1;
              newPops.push({ id: `${it.id}p`, x: it.x, y: ny, text: '-1 life', color: '#EF4444' });
            } else if (it.type === 'star') {
              scoreDelta += 25;
              newPops.push({ id: `${it.id}p`, x: it.x, y: ny, text: '+25', color: '#F59E0B' });
            } else {
              scoreDelta += 10;
              newPops.push({ id: `${it.id}p`, x: it.x, y: ny, text: '+10', color: 'var(--accent)' });
            }
            continue;
          }
          if (ny > ARENA_HEIGHT + 20) continue;
          next.push({ ...it, y: ny });
        }
        if (scoreDelta) setScore((s) => s + scoreDelta);
        if (livesDelta) {
          setLives((l) => Math.max(0, l + livesDelta));
          setFlash(true);
          setTimeout(() => setFlash(false), 350);
        }
        if (newPops.length) {
          setPops((p) => [...p, ...newPops]);
          newPops.forEach((p) => setTimeout(() => {
            setPops((cur) => cur.filter((x) => x.id !== p.id));
          }, 600));
        }
        return next;
      });
    }, GAME_TICK_MS);
    return () => clearInterval(id);
  }, [status, elapsedMs]);

  useEffect(() => {
    if (status === 'playing' && (elapsedMs >= GAME_DURATION_S * 1000 || lives <= 0)) {
      setStatus('over');
      onGameEnd(finalScoreRef.current);
    }
  }, [elapsedMs, lives, status, onGameEnd]);

  const startGame = () => {
    setScore(0); setLives(GAME_START_LIVES); setElapsedMs(0); setItems([]); setPops([]);
    spawnCounterRef.current = 700;
    setStatus('playing');
  };

  const timeLeft = Math.max(0, GAME_DURATION_S - Math.floor(elapsedMs / 1000));

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-60 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border-4 border-white/60 dark:border-gray-700">
        <div className="flex items-center justify-between px-4 py-3 bg-(--accent) text-white">
          <h3 className="font-bold flex items-center gap-1.5"><Gamepad2 className="w-4 h-4" /> Splash Catch</h3>
          <button onClick={onExit} aria-label="Close game"><X className="w-5 h-5" /></button>
        </div>

        {status !== 'playing' && (
          <div className="p-6 text-center flex flex-col items-center gap-3">
            <p className="text-5xl">{status === 'over' ? (score >= highScore ? '🏆' : '🥤') : '💧'}</p>
            {status === 'over' ? (
              <>
                <p className="font-bold text-lg text-gray-800 dark:text-white">Score: {score}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {score >= highScore ? 'New high score!' : `Best so far: ${Math.max(score, highScore)}`}
                </p>
              </>
            ) : (
              <>
                <p className="font-bold text-gray-800 dark:text-white">Catch the drops, dodge the coffee!</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Drag the arena or use arrow keys. {GAME_DURATION_S}s, {GAME_START_LIVES} lives, ⭐ for bonus points.</p>
              </>
            )}
            <button onClick={startGame} className="mt-2 px-6 py-3 rounded-xl font-bold text-white bg-(--accent) hover:bg-(--accent-deep) shadow-md active:scale-95 transition-all">
              {status === 'over' ? 'Play Again' : 'Start'}
            </button>
          </div>
        )}

        {status === 'playing' && (
          <div className="p-3">
            <div className="flex items-center justify-between text-xs font-bold text-gray-600 dark:text-gray-300 px-1 mb-2">
              <span>⏱ {timeLeft}s</span>
              <span>Score: {score}</span>
              <span>{'❤️'.repeat(lives)}{'🤍'.repeat(GAME_START_LIVES - lives)}</span>
            </div>
            <div
              ref={arenaRef}
              className={`splash-arena rounded-2xl border-2 border-dashed border-(--accent-border) ${flash ? 'splash-flash' : ''}`}
              style={{ height: ARENA_HEIGHT }}
              onMouseMove={(e) => moveCupToClientX(e.clientX)}
              onTouchMove={(e) => e.touches[0] && moveCupToClientX(e.touches[0].clientX)}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'ArrowLeft') setCupX((x) => Math.max(7, x - 6));
                if (e.key === 'ArrowRight') setCupX((x) => Math.min(93, x + 6));
              }}
            >
              {items.map((it) => (
                <span key={it.id} className="splash-item" style={{ left: `${it.x}%`, top: it.y }}>
                  {it.type === 'water' ? '💧' : it.type === 'star' ? '⭐' : '☕'}
                </span>
              ))}
              {pops.map((p) => (
                <span key={p.id} className="splash-pop" style={{ left: `${p.x}%`, top: p.y, color: p.color }}>{p.text}</span>
              ))}
              <span className="splash-cup" style={{ left: `${cupX}%` }}>🥤</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main App                                                            */
/* ------------------------------------------------------------------ */

export default function App() {
  const [username, setUsername] = useState(() => localStorage.getItem('hannahydrate_session') || '');
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(localStorage.getItem('hannahydrate_session')));
  const [authMode, setAuthMode] = useState('login'); // login | register | theme
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState('tips'); // tips | badges | settings
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [isGameOpen, setIsGameOpen] = useState(false);
  const [toast, setToast] = useState('');

  const [gender, setGender] = useState('neutral');
  const [unit, setUnit] = useState('ml');

  const [target, setTarget] = useState(DEFAULT_TARGET_ML);
  const [consumed, setConsumed] = useState(0);
  const [lifetimeMl, setLifetimeMl] = useState(0);
  const [rescued, setRescued] = useState(0);
  const [streak, setStreak] = useState(0);
  const [goalHitCount, setGoalHitCount] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [unlockedBadges, setUnlockedBadges] = useState([]);
  const [remindersOn, setRemindersOn] = useState(false);

  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'short' });
  const [weeklyHistory, setWeeklyHistory] = useState({ Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 });

  const [homeTip, setHomeTip] = useState(PROS_OF_WATER[0]);
  const [tipA, setTipA] = useState(BEAUTY_TIPS[0]);
  const [tipB, setTipB] = useState(INTIMATE_HEALTH_TIPS[0]);
  const [isRunning, setIsRunning] = useState(false);
  const [justRescued, setJustRescued] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [targetInput, setTargetInput] = useState('');

  const waterAmmo = Math.floor(consumed / ML_PER_RESCUE) - rescued;
  const gardenStage = gardenStageFor(streak);
  const sidebarContent = SIDEBAR_CONTENT[gender] || SIDEBAR_CONTENT.neutral;
  const ThemeIcon = (THEMES[gender] || THEMES.neutral).icon;

  const applyGenderTheme = (g) => {
    document.documentElement.setAttribute('data-gender', g || 'neutral');
  };

  /* ---------------- theme + dark mode ---------------- */

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => { applyGenderTheme(gender); }, [gender]);

  /* ---------------- persistence ---------------- */

  useEffect(() => {
    if (!isAuthenticated || !username) return;
    localStorage.setItem(`water_data_${username}`, String(consumed));
    localStorage.setItem(`water_target_${username}`, String(target));
    localStorage.setItem(`rescued_people_${username}`, String(rescued));
    localStorage.setItem(`lifetime_${username}`, String(lifetimeMl));
    localStorage.setItem(`unit_${username}`, unit);

    const updatedHistory = { ...weeklyHistory, [todayStr]: consumed };
    setWeeklyHistory(updatedHistory);
    localStorage.setItem(`weekly_${username}`, JSON.stringify(updatedHistory));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consumed, target, rescued, lifetimeMl, unit, isAuthenticated, username, todayStr]);

  /* ---------------- daily rollover: streaks & goal hits ---------------- */

  useEffect(() => {
    if (!isAuthenticated || !username) return;
    const todayKey = new Date().toDateString();
    const lastDate = localStorage.getItem(`lastDate_${username}`);
    if (lastDate && lastDate !== todayKey) {
      const yesterdayConsumed = getStoredNumber(`water_data_${username}`);
      const dayTarget = getStoredNumber(`water_target_${username}`, DEFAULT_TARGET_ML);
      const metGoal = dayTarget > 0 && yesterdayConsumed >= dayTarget;
      const prevStreak = getStoredNumber(`streak_${username}`);
      const newStreak = metGoal ? prevStreak + 1 : 0;
      localStorage.setItem(`streak_${username}`, String(newStreak));
      setStreak(newStreak);
      if (metGoal) {
        const newGoalCount = getStoredNumber(`goalHits_${username}`) + 1;
        localStorage.setItem(`goalHits_${username}`, String(newGoalCount));
        setGoalHitCount(newGoalCount);
      }
      localStorage.setItem(`water_data_${username}`, '0');
      setConsumed(0);
    }
    localStorage.setItem(`lastDate_${username}`, todayKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, username]);

  /* ---------------- badge unlocking ---------------- */

  useEffect(() => {
    if (!isAuthenticated || !username) return;
    const stats = { totalLifetimeMl: lifetimeMl, streak, rescued, highScore, goalHitCount };
    const nowUnlocked = BADGE_DEFS.filter((b) => b.check(stats)).map((b) => b.id);
    const newlyUnlocked = nowUnlocked.filter((id) => !unlockedBadges.includes(id));
    if (newlyUnlocked.length) {
      const merged = [...unlockedBadges, ...newlyUnlocked];
      setUnlockedBadges(merged);
      localStorage.setItem(`badges_${username}`, JSON.stringify(merged));
      const badge = BADGE_DEFS.find((b) => b.id === newlyUnlocked[0]);
      setToast(`🏅 Badge unlocked: ${badge?.label}`);
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.5 } });
      setTimeout(() => setToast(''), 3300);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, username, lifetimeMl, streak, rescued, highScore, goalHitCount]);

  /* ---------------- OneSignal tagging ---------------- */

  useEffect(() => {
    if (!isAuthenticated || !username) return;
    withOneSignal(async (OneSignal) => {
      try { await OneSignal.login(username); } catch (e) { console.warn('OneSignal login failed', e); }
    });
  }, [isAuthenticated, username]);

  /* ---------------- rotating tips ---------------- */

  useEffect(() => {
    let timeoutId;
    const rotate = () => {
      setHomeTip((prev) => {
        const options = PROS_OF_WATER.filter((tip) => tip !== prev);
        return options[Math.floor(Math.random() * options.length)];
      });
      timeoutId = setTimeout(rotate, 8000 + Math.random() * 7000);
    };
    timeoutId = setTimeout(rotate, 8000 + Math.random() * 7000);
    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    const tipsA = sidebarContent.sectionA.tips;
    const tipsB = sidebarContent.sectionB.tips;
    setTipA(tipsA[0]);
    setTipB(tipsB[0]);
    let timeoutId;
    const rotate = () => {
      setTipA((prev) => {
        const options = tipsA.filter((t) => t !== prev);
        return options[Math.floor(Math.random() * options.length)] || prev;
      });
      setTipB((prev) => {
        const options = tipsB.filter((t) => t !== prev);
        return options[Math.floor(Math.random() * options.length)] || prev;
      });
      timeoutId = setTimeout(rotate, 10000 + Math.random() * 8000);
    };
    timeoutId = setTimeout(rotate, 10000 + Math.random() * 8000);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gender]);

  /* ---------------- local reminders ---------------- */

  useEffect(() => {
    if (!isAuthenticated || !remindersOn) return;
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

    const fireReminder = () => {
      const hour = new Date().getHours();
      if (hour < QUIET_HOURS_START || hour >= QUIET_HOURS_END) return;
      if (consumed >= target) {
        new Notification('Goal smashed! 🎉', { body: `You've hit your ${target}ml goal today, superstar! 💖`, icon: '/favicon.svg' });
      } else {
        const remaining = target - consumed;
        new Notification('Time to hydrate! 💧', { body: `${remaining}ml to go to hit today's goal. Take a sip! ✨`, icon: '/favicon.svg' });
      }
    };

    const id = setInterval(fireReminder, REMINDER_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isAuthenticated, remindersOn, consumed, target]);

  /* ---------------- actions ---------------- */

  const addWater = (amountMl) => {
    setConsumed((prev) => prev + amountMl);
    setLifetimeMl((prev) => prev + amountMl);
  };

  const handleCustomAdd = () => {
    const val = parseFloat(customAmount);
    if (!val || val <= 0) return;
    const ml = unit === 'oz' ? Math.round(val * ML_PER_OZ) : Math.round(val);
    addWater(ml);
    setCustomAmount('');
  };

  const handleRunAndFeed = () => {
    if (waterAmmo > 0 && !isRunning) {
      setIsRunning(true);
      setTimeout(() => {
        setRescued((prev) => prev + 1);
        setJustRescued(true);
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 }, colors: ['#22D3EE', '#FFFFFF', '#E0218A'] });
        setTimeout(() => setIsRunning(false), 500);
        setTimeout(() => setJustRescued(false), 1800);
      }, 800);
    }
  };

  const handleGameEnd = useCallback((finalScore) => {
    setHighScore((prev) => {
      const next = Math.max(prev, finalScore);
      if (username) localStorage.setItem(`highscore_${username}`, String(next));
      return next;
    });
  }, [username]);

  const enableReminders = useCallback(async () => {
    try {
      if (typeof Notification === 'undefined') {
        alert("This browser/app doesn't support notifications.");
        return;
      }
      let permission = Notification.permission;
      if (permission === 'default') {
        permission = await Notification.requestPermission();
      }
      if (permission !== 'granted') {
        alert('Please allow notifications in your browser or system settings to get reminders. 🔔');
        return;
      }
      withOneSignal(async (OneSignal) => {
        try { await OneSignal.Notifications.requestPermission(); } catch (e) { console.warn(e); }
      });
      localStorage.setItem(`reminders_${username}`, 'on');
      setRemindersOn(true);
      new Notification('HannaHydrate 💧', { body: "Reminders are on! I'll nudge you to sip water. ✨" });
    } catch (e) {
      console.warn('Could not enable reminders', e);
    }
  }, [username]);

  const disableReminders = useCallback(() => {
    localStorage.setItem(`reminders_${username}`, 'off');
    setRemindersOn(false);
  }, [username]);

  const toggleReminders = () => (remindersOn ? disableReminders() : enableReminders());

  const finishLogin = (name) => {
    const usersDB = getStoredUsers();
    const g = usersDB[name]?.gender || 'neutral';
    setGender(g);
    applyGenderTheme(g);
    localStorage.setItem('hannahydrate_session', name);
    setUsername(name);
    setConsumed(getStoredNumber(`water_data_${name}`));
    setRescued(getStoredNumber(`rescued_people_${name}`));
    setTarget(getStoredNumber(`water_target_${name}`, DEFAULT_TARGET_ML));
    setLifetimeMl(getStoredNumber(`lifetime_${name}`));
    setStreak(getStoredNumber(`streak_${name}`));
    setGoalHitCount(getStoredNumber(`goalHits_${name}`));
    setHighScore(getStoredNumber(`highscore_${name}`));
    setUnit(localStorage.getItem(`unit_${name}`) || 'ml');
    setRemindersOn(localStorage.getItem(`reminders_${name}`) === 'on');
    try {
      setUnlockedBadges(JSON.parse(localStorage.getItem(`badges_${name}`)) || []);
    } catch { setUnlockedBadges([]); }
    try {
      const stored = JSON.parse(localStorage.getItem(`weekly_${name}`));
      setWeeklyHistory(stored || { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 });
    } catch { /* keep default */ }
    setPassword('');
    setIsAuthenticated(true);
    setAuthMode('login');
  };

  // Rehydrate state from localStorage on a fresh page load when a session
  // token is already present (finishLogin does the actual state population).
  useEffect(() => {
    if (isAuthenticated && username) {
      finishLogin(username);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAuth = (event) => {
    event.preventDefault();
    setError('');
    const cleanUsername = username.trim();
    if (!cleanUsername || !password) { setError('Please enter credentials.'); return; }
    const usersDB = getStoredUsers();

    if (authMode === 'register') {
      if (usersDB[cleanUsername]) { setError('Username already exists!'); return; }
      usersDB[cleanUsername] = { password, gender: null };
      localStorage.setItem('usersDB', JSON.stringify(usersDB));
      setUsername(cleanUsername);
      setAuthMode('theme');
      return;
    }

    if (!usersDB[cleanUsername] || usersDB[cleanUsername].password !== password) {
      setError('Invalid credentials. ❌');
      return;
    }
    finishLogin(cleanUsername);
  };

  const handleThemePick = (themeId) => {
    const usersDB = getStoredUsers();
    if (usersDB[username]) {
      usersDB[username].gender = themeId;
      localStorage.setItem('usersDB', JSON.stringify(usersDB));
    }
    finishLogin(username);
  };

  const changeTheme = (themeId) => {
    const usersDB = getStoredUsers();
    if (usersDB[username]) {
      usersDB[username].gender = themeId;
      localStorage.setItem('usersDB', JSON.stringify(usersDB));
    }
    setGender(themeId);
  };

  const saveTarget = () => {
    const val = parseFloat(targetInput);
    if (!val || val <= 0) return;
    const ml = unit === 'oz' ? Math.round(val * ML_PER_OZ) : Math.round(val);
    setTarget(ml);
    setTargetInput('');
  };

  const handleLogout = () => {
    withOneSignal(async (OneSignal) => {
      try { await OneSignal.logout(); } catch (e) { console.warn(e); }
    });
    localStorage.removeItem('hannahydrate_session');
    setIsAuthenticated(false);
    setUsername('');
    setConsumed(0);
    setRescued(0);
    setRemindersOn(false);
    setPassword('');
    setIsSidebarOpen(false);
    setIsGameOpen(false);
  };

  const mlToDisplay = (ml) => (unit === 'oz' ? Math.round(ml / ML_PER_OZ) : Math.round(ml));
  const unitLabel = unit === 'oz' ? 'oz' : 'ml';
  const quickAdds = unit === 'oz'
    ? [{ ml: 237, label: '8oz' }, { ml: 473, label: '16oz' }, { ml: 710, label: '24oz' }]
    : [{ ml: 100, label: '100ml' }, { ml: 200, label: '200ml' }, { ml: 500, label: '500ml' }];

  const percentage = target > 0 ? Math.min(Math.round((consumed / target) * 100), 100) : 0;

  // Canvas fillStyle can't resolve CSS custom properties, so the chart reads
  // the actual hex straight from the theme config rather than var(--accent-2).
  const chartAccentHex = (THEMES[gender] || THEMES.neutral).swatches[1];
  const chartData = {
    labels: WEEK_DAYS,
    datasets: [{
      label: `Intake (${unitLabel})`,
      data: WEEK_DAYS.map((day) => mlToDisplay(weeklyHistory[day] || 0)),
      backgroundColor: `${chartAccentHex}B3`,
      borderColor: chartAccentHex,
      borderWidth: 1,
      borderRadius: 4,
    }],
  };

  /* ---------------- auth screens ---------------- */

  if (!isAuthenticated) {
    if (authMode === 'theme') {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-linear-to-br from-(--bg-soft) to-(--bg-soft-2) dark:from-gray-900 dark:to-gray-800 relative overflow-hidden transition-colors duration-300">
          <BackgroundEffects />
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md p-8 rounded-3xl shadow-2xl border-4 border-white/50 dark:border-gray-700 max-w-md w-full text-center z-10 relative">
            <Sparkles className="w-10 h-10 text-(--accent) mx-auto mb-3" />
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">Pick your vibe</h1>
            <p className="text-gray-500 dark:text-gray-300 mb-6 text-sm">You can change this anytime from settings.</p>
            <div className="grid grid-cols-1 gap-3">
              {Object.values(THEMES).map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => handleThemePick(t.id)}
                    className="flex items-center gap-4 p-4 rounded-2xl border-2 border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-500 transition-colors text-left"
                  >
                    <span className="flex -space-x-2 shrink-0">
                      <span className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800" style={{ background: t.swatches[0] }} />
                      <span className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800" style={{ background: t.swatches[1] }} />
                    </span>
                    <span className="flex-1">
                      <span className="font-bold text-gray-800 dark:text-white flex items-center gap-1.5">
                        <Icon className="w-4 h-4" style={{ color: t.swatches[0] }} /> {t.name}
                      </span>
                      <span className="block text-xs text-gray-400 dark:text-gray-400">{t.tagline}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-linear-to-br from-(--bg-soft) to-(--bg-soft-2) dark:from-gray-900 dark:to-gray-800 relative overflow-hidden transition-colors duration-300">
        <BackgroundEffects />
        <button onClick={() => setIsDarkMode(!isDarkMode)} className="absolute top-[calc(env(safe-area-inset-top)+1.5rem)] right-6 z-20 p-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full shadow-md text-(--accent) hover:scale-110 transition-transform">
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md p-8 rounded-3xl shadow-2xl border-4 border-white/50 dark:border-gray-700 max-w-sm w-full text-center z-10 relative">
          <Sparkles className="w-12 h-12 text-(--accent) mx-auto mb-4 animate-bounce" />
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">HannaHydrate</h1>
          <p className="text-gray-500 dark:text-gray-300 mb-6 text-sm">{authMode === 'login' ? 'Welcome back! ✨' : 'Create an account! ✨'}</p>

          {error && <div className="bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-300 p-3 rounded-lg text-sm mb-4">{error}</div>}

          <form onSubmit={handleAuth} className="flex flex-col gap-4">
            <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 dark:border-gray-600 focus:border-(--accent) bg-white/80 dark:bg-gray-700 dark:text-white outline-none" required />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 dark:border-gray-600 focus:border-(--accent) bg-white/80 dark:bg-gray-700 dark:text-white outline-none" required />
            <button type="submit" className="w-full bg-linear-to-r from-(--accent) to-(--accent-deep) text-white font-bold py-3 rounded-xl shadow-lg mt-2">
              {authMode === 'login' ? "Let's Glow" : 'Continue'}
            </button>
          </form>
          <button type="button" onClick={() => { setAuthMode((mode) => (mode === 'login' ? 'register' : 'login')); setError(''); }} className="text-(--accent) text-sm mt-6 hover:underline font-medium">
            {authMode === 'login' ? 'Need an account? Sign up here.' : 'Already have an account? Log in.'}
          </button>
        </div>
      </div>
    );
  }

  /* ---------------- authenticated dashboard ---------------- */

  return (
    <div className="min-h-screen bg-linear-to-br from-(--bg-soft) to-(--bg-soft-2) dark:from-gray-900 dark:to-gray-800 flex flex-col items-center p-3 pt-[max(0.75rem,env(safe-area-inset-top))] relative overflow-x-hidden transition-colors duration-300">
      <BackgroundEffects />

      {toast && (
        <div className="app-toast fixed top-[calc(env(safe-area-inset-top)+0.5rem)] left-1/2 -translate-x-1/2 z-70 bg-gray-900 text-white text-sm font-semibold px-4 py-2 rounded-full shadow-xl">
          {toast}
        </div>
      )}

      {isGameOpen && (
        <SplashCatchGame onExit={() => setIsGameOpen(false)} onGameEnd={handleGameEnd} highScore={highScore} />
      )}

      {isSidebarOpen && <div className="fixed inset-0 bg-black/20 dark:bg-black/50 backdrop-blur-sm z-40 transition-opacity" onClick={() => setIsSidebarOpen(false)} />}

      {/* Sidebar: wellness tips, achievements, settings */}
      <div className={`fixed inset-y-0 right-0 w-80 max-w-[90vw] bg-white dark:bg-gray-900 shadow-2xl z-50 transform transition-transform duration-300 ease-out ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col border-l-4 border-(--accent-bg) dark:border-gray-700 pt-[env(safe-area-inset-top)]`}>
        <div className="p-4 border-b-2 flex justify-between items-center bg-linear-to-r from-(--bg-soft) to-white dark:from-gray-800 dark:to-gray-900 border-(--accent-bg) dark:border-gray-800">
          <h2 className="text-lg font-bold text-(--accent-deep) dark:text-white flex items-center gap-2">
            <ThemeIcon className="w-5 h-5 text-(--accent)" /> {sidebarContent.heading}
          </h2>
          <button onClick={() => setIsSidebarOpen(false)} aria-label="Close panel"><X className="w-6 h-6 text-gray-500" /></button>
        </div>

        <div className="flex border-b border-gray-100 dark:border-gray-800 shrink-0">
          {[
            { id: 'tips', label: 'Tips' },
            { id: 'badges', label: 'Achievements' },
            { id: 'settings', label: 'Settings' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSidebarTab(tab.id)}
              className={`flex-1 py-3 text-sm font-bold transition-colors ${sidebarTab === tab.id ? 'text-(--accent) border-b-2 border-(--accent)' : 'text-gray-400 dark:text-gray-500'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-6">
          {sidebarTab === 'tips' && (
            <>
              <div className="bg-(--accent-bg) dark:bg-gray-800 p-4 rounded-2xl border border-(--accent-border)/40 dark:border-gray-700">
                <h3 className="font-bold text-(--accent-deep) dark:text-white flex items-center gap-2 mb-2">
                  <sidebarContent.sectionA.icon className="w-4 h-4" /> {sidebarContent.sectionA.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">{tipA}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
                <h3 className="font-bold dark:text-white flex items-center gap-2 mb-2" style={{ color: 'var(--accent-2)' }}>
                  <sidebarContent.sectionB.icon className="w-4 h-4" /> {sidebarContent.sectionB.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">{tipB}</p>
              </div>
            </>
          )}

          {sidebarTab === 'badges' && (
            <>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">{unlockedBadges.length}/{BADGE_DEFS.length} unlocked</p>
              <div className="grid grid-cols-2 gap-3">
                {BADGE_DEFS.map((badge) => {
                  const unlocked = unlockedBadges.includes(badge.id);
                  const Icon = badge.icon;
                  return (
                    <div key={badge.id} className={`relative overflow-hidden p-3 rounded-2xl border text-center flex flex-col items-center gap-1 ${unlocked ? 'bg-(--accent-bg) border-(--accent-border)/50' : 'bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 opacity-50'}`}>
                      <Icon className="w-6 h-6" style={{ color: unlocked ? 'var(--accent)' : '#9CA3AF' }} />
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-200 leading-tight">{badge.label}</span>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 leading-tight">{badge.desc}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {sidebarTab === 'settings' && (
            <>
              <div>
                <h3 className="font-bold text-gray-700 dark:text-white text-sm mb-2">Daily target</h3>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    placeholder={String(mlToDisplay(target))}
                    value={targetInput}
                    onChange={(e) => setTargetInput(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border-2 border-gray-100 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white outline-none focus:border-(--accent)"
                  />
                  <button onClick={saveTarget} className="px-4 rounded-xl bg-(--accent) text-white text-sm font-bold">Save</button>
                </div>
                <p className="text-xs text-gray-400 mt-1">Current: {mlToDisplay(target)}{unitLabel}</p>
              </div>

              <div>
                <h3 className="font-bold text-gray-700 dark:text-white text-sm mb-2">Units</h3>
                <div className="flex gap-2">
                  {['ml', 'oz'].map((u) => (
                    <button
                      key={u}
                      onClick={() => setUnit(u)}
                      className={`flex-1 py-2 rounded-xl text-sm font-bold border-2 ${unit === u ? 'bg-(--accent) text-white border-(--accent)' : 'border-gray-100 dark:border-gray-600 text-gray-500 dark:text-gray-300'}`}
                    >
                      {u === 'ml' ? 'Milliliters' : 'Ounces'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-gray-700 dark:text-white text-sm mb-2">Theme</h3>
                <div className="flex flex-col gap-2">
                  {Object.values(THEMES).map((t) => {
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.id}
                        onClick={() => changeTheme(t.id)}
                        className={`flex items-center gap-3 p-2.5 rounded-xl border-2 text-left ${gender === t.id ? 'border-(--accent)' : 'border-gray-100 dark:border-gray-700'}`}
                      >
                        <span className="flex -space-x-1.5">
                          <span className="w-5 h-5 rounded-full border-2 border-white dark:border-gray-800" style={{ background: t.swatches[0] }} />
                          <span className="w-5 h-5 rounded-full border-2 border-white dark:border-gray-800" style={{ background: t.swatches[1] }} />
                        </span>
                        <span className="text-sm font-semibold text-gray-700 dark:text-white flex items-center gap-1">
                          <Icon className="w-3.5 h-3.5" /> {t.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Header */}
      <header className="w-full max-w-md lg:max-w-5xl flex flex-wrap justify-between items-center gap-2 py-2 px-1 z-10">
        <h1 className="text-base sm:text-lg font-bold text-(--accent-deep) dark:text-white flex items-center gap-1 bg-white/60 dark:bg-gray-800/60 px-3 py-2 rounded-full backdrop-blur-sm border border-white/50 max-w-[55%] truncate">
          <Sparkles className="w-4 h-4 shrink-0 text-(--accent)" />
          <span className="truncate">HannaHydrate</span>
        </h1>
        <div className="flex gap-1.5 shrink-0">
          <button onClick={() => setIsDarkMode(!isDarkMode)} title="Toggle theme" className="p-2 bg-white/80 dark:bg-gray-800/80 rounded-full shadow-sm text-(--accent-deep) dark:text-(--accent-2)">
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button onClick={toggleReminders} title={remindersOn ? 'Reminders on' : 'Enable reminders'} className={`p-2 rounded-full shadow-sm transition-colors ${remindersOn ? 'bg-(--accent) text-white' : 'bg-white/80 dark:bg-gray-800/80 text-(--accent-deep) dark:text-white'}`}>
            {remindersOn ? <BellRing className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
          </button>
          <button onClick={() => { setIsSidebarOpen(true); setSidebarTab('tips'); }} title="Wellness tips" className="p-2 bg-white/80 dark:bg-gray-800/80 rounded-full shadow-sm text-(--accent-deep) dark:text-white"><Menu className="w-4 h-4" /></button>
          <button onClick={handleLogout} title="Log out" className="p-2 bg-white/80 dark:bg-gray-800/80 rounded-full shadow-sm text-red-400 hover:text-red-600"><LogOut className="w-4 h-4" /></button>
        </div>
      </header>

      <main className="w-full max-w-md lg:max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5 mt-2 z-10 pb-10">

        {/* Greeting & Intake */}
        <div className="lg:col-span-2 w-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-3xl p-5 shadow-xl border-t-4 border-(--accent) text-center">
          <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Hey, {username}! ✨</p>
          <h2 className="text-4xl font-extrabold text-(--accent-deep) dark:text-white my-1">
            {mlToDisplay(consumed)} <span className="text-lg font-medium text-gray-400">/ {mlToDisplay(target)} {unitLabel}</span>
          </h2>
          <div className="w-full bg-gray-100 dark:bg-gray-700 h-6 rounded-full overflow-hidden p-1 my-3 shadow-inner">
            <div className="h-full rounded-full transition-all duration-700 bg-linear-to-r from-(--accent) to-(--accent-2)" style={{ width: `${percentage}%` }}></div>
          </div>
          <div className="flex items-center justify-center gap-4 text-xs font-bold text-gray-500 dark:text-gray-300">
            <span className="flex items-center gap-1"><Flame className="w-4 h-4 text-orange-400" /> {streak} day streak</span>
            <span className="flex items-center gap-1"><Award className="w-4 h-4 text-(--accent)" /> {unlockedBadges.length} badges</span>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-4">
            {quickAdds.map((q) => (
              <button key={q.ml} onClick={() => addWater(q.ml)} className="bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-600 text-(--accent-deep) dark:text-white font-bold py-3 rounded-2xl shadow-sm hover:shadow-md active:scale-95 transition-all flex flex-col items-center">
                <Droplet className="w-5 h-5 text-(--accent-2) mb-1" /> +{q.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2 mt-3">
            <input
              type="number"
              min="1"
              placeholder={`Custom (${unitLabel})`}
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl border-2 border-gray-100 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white text-sm outline-none focus:border-(--accent)"
            />
            <button onClick={handleCustomAdd} className="px-4 rounded-xl bg-(--accent) text-white text-sm font-bold">Add</button>
          </div>
        </div>

        {/* Hydration Garden */}
        <div className="w-full bg-linear-to-b from-emerald-50 to-lime-50 dark:from-emerald-900/20 dark:to-lime-900/10 rounded-3xl p-5 shadow-xl border border-emerald-100 dark:border-emerald-800 text-center flex flex-col items-center">
          <h3 className="font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1 mb-1"><Sprout className="w-4 h-4" /> Hydration Garden</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Meet your goal each day to grow it.</p>
          <div key={gardenStage.label} className="garden-stage text-6xl mb-2">{gardenStage.emoji}</div>
          <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{gardenStage.label}</p>
          <p className="text-xs text-gray-400 mt-1">Next stage at {GARDEN_STAGES.find((s) => s.min > streak)?.min ?? '∞'} days</p>
        </div>

        {/* Rescue Mission */}
        <div className="w-full bg-linear-to-b from-yellow-50 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 rounded-3xl p-5 shadow-xl border border-yellow-200 dark:border-yellow-700 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-orange-400 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg uppercase tracking-wider">Game</div>
          <h3 className="font-bold text-orange-600 dark:text-orange-400 flex items-center gap-1 mb-1"><Play className="w-4 h-4" fill="currentColor" /> Rescue Mission</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Every {ML_PER_RESCUE}ml you drink becomes 1 rescue. Run out and hydrate a thirsty traveler!</p>

          <div className="flex justify-between text-xs font-bold text-gray-500 dark:text-gray-400 px-2 mb-2">
            <span>Ammo: <span className="text-blue-500 text-lg">{Math.max(waterAmmo, 0)}</span></span>
            <span>Rescued: <span className="text-green-500 text-lg">{rescued}</span></span>
          </div>

          <div className="w-full h-20 bg-yellow-200/50 dark:bg-yellow-800/50 rounded-xl relative overflow-hidden border-2 border-dashed border-yellow-400 dark:border-yellow-600 flex items-center shadow-inner">
            <div className={`absolute left-2 text-3xl transition-transform duration-700 ease-in z-10 ${isRunning ? 'translate-x-32' : 'translate-x-0'}`}>🏃‍♀️</div>
            <div className={`absolute left-10 text-xl transition-all duration-500 ease-out z-0 ${isRunning ? 'translate-x-44 opacity-100' : 'translate-x-0 opacity-0'}`}>💧</div>
            <div className="absolute right-4 text-3xl transition-all duration-300">{justRescued ? '🥰' : isRunning ? '🏃' : '🥵'}</div>
          </div>

          {justRescued && <p className="text-center text-xs font-bold text-green-600 dark:text-green-400 mt-2 animate-pulse">+1 person hydrated! 💚</p>}

          <button
            onClick={handleRunAndFeed}
            disabled={waterAmmo <= 0 || isRunning}
            className="w-full mt-4 py-3 rounded-xl font-bold text-white bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 transition-colors shadow-md active:scale-95"
          >
            {waterAmmo > 0 ? 'Run & Feed Water!' : `Drink ${ML_PER_RESCUE}ml for Ammo`}
          </button>
        </div>

        {/* Splash Catch launcher */}
        <div className="lg:col-span-2 w-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-3xl p-5 shadow-xl border border-gray-100 dark:border-gray-700 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-1.5"><Gamepad2 className="w-4 h-4 text-(--accent)" /> Splash Catch</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">A quick arcade break — catch drops, dodge coffee. High score: <span className="font-bold text-(--accent)">{highScore}</span></p>
          </div>
          <button onClick={() => setIsGameOpen(true)} className="px-5 py-2.5 rounded-xl font-bold text-white bg-(--accent) hover:bg-(--accent-deep) shadow-md active:scale-95 transition-all shrink-0">Play now</button>
        </div>

        {/* Homepage Tip */}
        <div className="lg:col-span-2 w-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex items-start gap-3">
          <Info className="w-5 h-5 text-(--accent-2) shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{homeTip}</p>
        </div>

        {/* Weekly Chart */}
        <div className="lg:col-span-2 w-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-3xl p-5 shadow-xl border border-gray-100 dark:border-gray-700">
          <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-4 uppercase tracking-widest text-center">Weekly History</h3>
          <Bar data={chartData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
        </div>

      </main>
    </div>
  );
}
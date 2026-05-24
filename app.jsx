/* MoneyWise — root app + state + routing + Supabase persistence */

const { useState: aState, useEffect: aEffect, useMemo: aMemo, useCallback: aCallback } = React;

const DEFAULTS = {
  accent: '#6E5BFF',
  rescueStyle: 'streak',
  showStreaks: true,
  showCoachTips: true,
};

const ACCENT_PALETTES = {
  '#6E5BFF': { primary: '#6E5BFF', dark: '#4A3CCC', soft: '#EEEBFF' },
  '#2E9E6A': { primary: '#2E9E6A', dark: '#1F7A4F', soft: '#DFF4E8' },
  '#FF6B5B': { primary: '#FF6B5B', dark: '#C73E2F', soft: '#FFE3DE' },
  '#3590E0': { primary: '#3590E0', dark: '#1A6CB5', soft: '#DCEEFE' },
};

function applyAccent(hex) {
  const p = ACCENT_PALETTES[hex] || ACCENT_PALETTES['#6E5BFF'];
  const root = document.documentElement;
  root.style.setProperty('--mw-indigo', p.primary);
  root.style.setProperty('--mw-indigo-dark', p.dark);
  root.style.setProperty('--mw-indigo-soft', p.soft);
  root.style.setProperty('--cat-goal', p.primary);
}

/* ── date helpers ── */
function todayISO() { return toISODate(new Date()); }
function addDays(iso, n) { const d = fromISODate(iso); d.setDate(d.getDate() + n); return toISODate(d); }

const DEMO_USER = { name: 'Aiman Haziq', email: 'aimanhaziq@edu.com', initials: 'AH' };

function initialsOf(email) {
  if (!email) return '?';
  const local = email.split('@')[0];
  const parts = local.split(/[._-]/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (local[0] + (local[1] || '')).toUpperCase();
}
function nameOf(email) {
  if (!email) return 'Guest';
  const local = email.split('@')[0];
  return local.split(/[._-]/).filter(Boolean).map(p => p[0].toUpperCase() + p.slice(1)).join(' ');
}

/* ── fresh state ── */
function freshState() {
  const t = todayISO();
  return {
    income: 0, savingGoal: 0,
    startDate: t, endDate: addDays(t, 30),
    categories: [], mostSpent: '',
    logs: [], locked: false,
  };
}

/* ── demo seed ── */
function seedAtRisk() {
  const today = todayISO();
  const start = addDays(today, -12);
  const end = addDays(today, 18);
  let id = 1000;
  const mk = (date, category, expense, earn) => ({ id: id++, date, category, expense, earn });
  return {
    income: 1200, savingGoal: 500,
    startDate: start, endDate: end,
    categories: ['food', 'transportation', 'entertainment'],
    mostSpent: 'food', locked: true,
    logs: [
      mk(addDays(today, -11), 'food', 28, 0),
      mk(addDays(today, -10), 'transportation', 22, 0),
      mk(addDays(today, -9),  'food', 32, 0),
      mk(addDays(today, -8),  'entertainment', 85, 0),
      mk(addDays(today, -7),  'food', 41, 0),
      mk(addDays(today, -6),  'transportation', 18, 0),
      mk(addDays(today, -5),  'food', 27, 0),
      mk(addDays(today, -5),  'entertainment', 0, 50),
      mk(addDays(today, -4),  'food', 95, 0),
      mk(addDays(today, -4),  'entertainment', 65, 0),
      mk(addDays(today, -3),  'food', 24, 0),
      mk(addDays(today, -2),  'transportation', 35, 0),
      mk(addDays(today, -2),  'entertainment', 45, 0),
      mk(addDays(today, -1),  'food', 38, 0),
      mk(addDays(today, -1),  'transportation', 14, 0),
      mk(today, 'food', 22, 0),
    ],
  };
}

/* ── Supabase helpers ── */
async function sbLoadProfile(userId) {
  const sb = await getSupabase();
  if (!sb) return null;
  const { data, error } = await sb.from('profiles').select('*').eq('user_id', userId).maybeSingle();
  if (error) {
    console.error('[MW] load profile error:', error.code, error.message);
    throw new Error(error.message);
  }
  return data || null;
}

async function sbLoadLogs(userId) {
  const sb = await getSupabase();
  if (!sb) return [];
  const { data, error } = await sb.from('daily_logs').select('*').eq('user_id', userId).order('log_date', { ascending: false });
  if (error) {
    console.error('[MW] load logs error:', error.code, error.message);
    throw new Error(error.message);
  }
  return data || [];
}

async function sbSaveProfile(userId, state) {
  const sb = await getSupabase();
  if (!sb) return;
  const { error } = await sb.from('profiles').upsert({
    user_id: userId,
    income: state.income,
    saving_goal: state.savingGoal,
    goal_start_date: state.startDate,
    goal_date: state.endDate,
    selected_categories: state.categories,
    most_category: state.mostSpent,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });
  if (error) console.error('[MW] save profile error:', error.code, error.message);
}

async function sbInsertLog(userId, log) {
  const sb = await getSupabase();
  if (!sb) return null;
  const { data } = await sb.from('daily_logs').insert({
    user_id: userId,
    log_date: log.date,
    category: log.category,
    expense: log.expense,
    earn: log.earn,
    note: log.note || null,
  }).select().maybeSingle();
  return data;
}

async function sbDeleteLog(logId) {
  const sb = await getSupabase();
  if (!sb) return;
  await sb.from('daily_logs').delete().eq('id', logId);
}

async function sbDeleteUserData(userId) {
  const sb = await getSupabase();
  if (!sb) return;
  await sb.from('daily_logs').delete().eq('user_id', userId);
  await sb.from('profiles').update({
    income: null,
    saving_goal: null,
    goal_start_date: null,
    goal_date: null,
    selected_categories: null,
    most_category: null,
    updated_at: null,
  }).eq('user_id', userId);
}

function profileToState(profile, logs) {
  const today = todayISO();
  const endDate = profile.goal_date
    ? profile.goal_date.slice(0, 10)   // handles both 'YYYY-MM-DD' and ISO timestamp
    : addDays(today, 30);
  const startDate = profile.goal_start_date
    ? profile.goal_start_date.slice(0, 10)
    : today;
  const categories = Array.isArray(profile.selected_categories)
    ? profile.selected_categories
    : [];
  return {
    income: Number(profile.income) || 0,
    savingGoal: Number(profile.saving_goal) || 0,
    startDate,
    endDate,
    categories,
    mostSpent: profile.most_category || '',
    locked: categories.length > 0,
    logs: (logs || []).map(l => ({
      id: l.id,
      date: l.log_date,
      category: l.category || 'others',
      expense: Number(l.expense) || 0,
      earn: Number(l.earn) || 0,
      note: l.note || '',
    })),
  };
}

/* ── Root ── */
function App() {
  const tweaks = DEFAULTS;

  const [session, setSession] = aState({ loggedIn: false, name: '', email: '', initials: '?', lastEmail: '', userId: null });
  const [state, setState] = aState(freshState);
  const [current, setCurrent] = aState('auth');
  const [drawerOpen, setDrawerOpen] = aState(false);
  const [toastNode, showToast] = useToast();
  const [today, setToday] = aState(() => toISODate(new Date()));

  aEffect(() => {
    const refresh = () => setToday(toISODate(new Date()));

    // Re-check when user returns to the tab (e.g. opens app next morning)
    const onVisible = () => { if (document.visibilityState === 'visible') refresh(); };
    document.addEventListener('visibilitychange', onVisible);

    // Also fire exactly at midnight so an open tab auto-advances
    const scheduleAtMidnight = () => {
      const now = new Date();
      const ms = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) - now;
      return setTimeout(() => { refresh(); scheduleAtMidnight(); }, ms);
    };
    const t = scheduleAtMidnight();

    return () => { document.removeEventListener('visibilitychange', onVisible); clearTimeout(t); };
  }, []);

  aEffect(() => { applyAccent(tweaks.accent); }, []);

  /* ── Detect Supabase password-recovery hash on page load ── */
  aEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      setCurrent('reset-password');
    }
  }, []);

  const updateState = aCallback((patch) => setState((s) => ({ ...s, ...patch })), []);

  /* ── Auth ── */
  const handleLogin = aCallback(async ({ email, isNew, user }) => {
    const userId = user?.id || null;
    setSession({ loggedIn: true, name: nameOf(email), email, initials: initialsOf(email), lastEmail: email, userId });

    if (isNew || !userId) {
      setState(freshState());
      setCurrent('setup');
      showToast('Welcome to MoneyWise');
      return;
    }

    /* load saved data */
    showToast('Loading your data…');
    try {
      const sb = await getSupabase();
      if (!sb) {
        console.warn('[MW] no Supabase client — check /api/config');
        setState(freshState());
        setCurrent('setup');
        showToast('Supabase not connected — check server config');
        return;
      }
      console.log('[MW] userId:', userId);
      const [profile, logs] = await Promise.all([sbLoadProfile(userId), sbLoadLogs(userId)]);
      console.log('[MW] profile:', profile, '| logs:', logs?.length);
      if (profile) {
        const converted = profileToState(profile, logs);
        setState(converted);
        setCurrent('budget');
        showToast(`Welcome back, ${nameOf(email).split(' ')[0]}`);
      } else {
        setState(freshState());
        setCurrent('setup');
        showToast('No saved budget found — let\'s set one up');
      }
    } catch (err) {
      console.error('[MW] login load error:', err);
      setState(freshState());
      setCurrent('setup');
      showToast(`Load error: ${err.message || 'unknown error'}`);
    }
  }, []);

  const handleDemo = aCallback(() => {
    setSession({ loggedIn: true, ...DEMO_USER, lastEmail: DEMO_USER.email, userId: null });
    setState(seedAtRisk());
    setCurrent('budget');
  }, []);

  const handleLogout = aCallback(async () => {
    const sb = await getSupabase();
    if (sb) await sb.auth.signOut();
    setSession((s) => ({ loggedIn: false, name: '', email: '', initials: '?', lastEmail: s.lastEmail || '', userId: null }));
    setState(freshState());
    setCurrent('auth');
    setDrawerOpen(false);
  }, []);

  const handleSwitchAccount = aCallback(async () => {
    const sb = await getSupabase();
    if (sb) await sb.auth.signOut();
    setSession((s) => ({ ...s, loggedIn: false, userId: null }));
    setState(freshState());
    setCurrent('auth');
    setDrawerOpen(false);
  }, []);

  const go = aCallback((id) => {
    if (state.locked && ['setup', 'categories', 'most'].includes(id)) {
      showToast('Budget is locked. Cancel it to redo setup.');
      return;
    }
    setCurrent(id);
    requestAnimationFrame(() => {
      const body = document.querySelector('.mw-body');
      if (body) body.scrollTop = 0;
    });
  }, [state.locked]);

  const addLog = aCallback(async (log) => {
    const tempId = Date.now();
    setState((s) => ({ ...s, logs: [...s.logs, { ...log, id: tempId }] }));

    if (session.userId) {
      const saved = await sbInsertLog(session.userId, log);
      if (saved) {
        setState((s) => ({
          ...s,
          logs: s.logs.map(l => l.id === tempId ? { ...l, id: saved.id } : l),
        }));
      }
    }
  }, [session.userId]);

  const removeLog = aCallback(async (logId) => {
    setState((s) => ({ ...s, logs: s.logs.filter(l => l.id !== logId) }));
    if (session.userId) await sbDeleteLog(logId);
  }, [session.userId]);

  const onAILoadDone = aCallback(async () => {
    setState((s) => {
      const next = { ...s, locked: true };
      if (session.userId) sbSaveProfile(session.userId, next);
      return next;
    });
    setCurrent('budget');
  }, [session.userId]);

  const cancelBudget = aCallback(async () => {
    if (session.userId) await sbDeleteUserData(session.userId);
    setState(freshState());
    setCurrent('setup');
    showToast('Budget cleared');
  }, [session.userId]);

  const user = session.loggedIn
    ? { name: session.name, email: session.email, initials: session.initials }
    : DEMO_USER;

  const wallet = aMemo(() => computeBudget(state).wallet, [state]);

  const handleResetDone = aCallback(() => {
    window.location.hash = '';
    setCurrent('auth');
    showToast('Password updated — please log in');
  }, []);

  const renderScreen = () => {
    if (current === 'reset-password') {
      return <ResetPasswordScreen onDone={handleResetDone} />;
    }
    if (!session.loggedIn || current === 'auth') {
      return <AuthScreen onLogin={handleLogin} onDemo={handleDemo} defaultEmail={session.lastEmail} />;
    }
    switch (current) {
      case 'setup':      return <SetupScreen state={state} set={updateState} go={go} />;
      case 'categories': return <CategoriesScreen state={state} set={updateState} go={go} />;
      case 'most':       return <MostSpentScreen state={state} set={updateState} go={go} />;
      case 'ai-load':    return <AILoadScreen state={state} onDone={onAILoadDone} />;
      case 'budget':     return <BudgetScreen state={state} go={go} onCancel={cancelBudget} toast={showToast} showStreaks={tweaks.showStreaks} showCoachTips={tweaks.showCoachTips} />;
      case 'calendar':   return <CalendarScreen state={state} go={go} />;
      case 'rescue':     return <RescueScreen state={state} go={go} rescueStyle={tweaks.rescueStyle} />;
      case 'daily-log':  return <DailyLogScreen state={state} addLog={addLog} removeLog={removeLog} go={go} toast={showToast} today={today} />;
      default:           return <BudgetScreen state={state} go={go} onCancel={cancelBudget} toast={showToast} showStreaks={tweaks.showStreaks} showCoachTips={tweaks.showCoachTips} />;
    }
  };

  const hideHeader = current === 'ai-load' || !session.loggedIn || current === 'auth';

  return (
    <div className="mw-stage">
      <div className="mw-phone">
        <StatusBar />
        {!hideHeader && (
          <WalletHeader
            wallet={wallet}
            onMenu={() => setDrawerOpen(true)}
            onSwitch={handleSwitchAccount}
            onLogout={handleLogout}
            user={user}
          />
        )}
        <div className="mw-body">
          {renderScreen()}
        </div>
        <Drawer
          open={drawerOpen}
          current={current}
          locked={state.locked}
          onClose={() => setDrawerOpen(false)}
          onNavigate={go}
          onLogout={handleLogout}
          user={user}
          hasLogToday={state.logs.some(l => l.date === today)}
        />
        {toastNode}
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);

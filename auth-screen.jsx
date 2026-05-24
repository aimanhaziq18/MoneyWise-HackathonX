/* MoneyWise auth — login / create / forgot password — Supabase wired */

const { useState: auState, useEffect: auEffect } = React;

/* Supabase client — initialised once after /api/config loads */
let _sb = null;
async function getSupabase() {
  if (_sb) return _sb;
  try {
    const cfg = await fetch('/api/config').then(r => r.json());
    if (cfg.supabaseUrl && cfg.supabaseAnonKey) {
      _sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
    }
  } catch (e) { /* no supabase config — stay in demo mode */ }
  return _sb;
}

function AuthScreen({ onLogin, onDemo, defaultEmail = '' }) {
  const [mode, setMode] = auState('login');   // 'login' | 'create' | 'forgot'
  const [email, setEmail] = auState(defaultEmail);
  const [password, setPassword] = auState('');
  const [confirm, setConfirm] = auState('');
  const [showPw, setShowPw] = auState(false);
  const [loading, setLoading] = auState(false);
  const [status, setStatus] = auState({ msg: '', kind: '' });
  const [checklist, setChecklist] = auState([]);

  const tick = (items) => setChecklist(items);

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const pwOK = password.length >= 6;
  const matchOK = mode !== 'create' || password === confirm;

  const submit = async () => {
    setStatus({ msg: '', kind: '' });
    if (!validEmail) { setStatus({ msg: 'Enter a valid email.', kind: 'err' }); return; }

    if (mode === 'forgot') {
      setLoading(true);
      tick(['☐ Locating your account', '☐ Sending reset link', '☐ Email queued']);
      const sb = await getSupabase();
      if (sb) {
        const { error } = await sb.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        tick(['☑ Locating your account', '☑ Sending reset link', '☑ Email queued']);
        setLoading(false);
        if (error) { setStatus({ msg: error.message, kind: 'err' }); }
        else { setStatus({ msg: `Reset link sent to ${email}. Check your inbox.`, kind: 'ok' }); }
      } else {
        /* no supabase — simulate */
        setTimeout(() => tick(['☑ Locating your account', '☐ Sending reset link', '☐ Email queued']), 500);
        setTimeout(() => tick(['☑ Locating your account', '☑ Sending reset link', '☐ Email queued']), 1100);
        setTimeout(() => {
          tick(['☑ Locating your account', '☑ Sending reset link', '☑ Email queued']);
          setLoading(false);
          setStatus({ msg: `Reset link sent to ${email}. Check your inbox.`, kind: 'ok' });
        }, 1700);
      }
      return;
    }

    if (!pwOK) { setStatus({ msg: 'Password must be at least 6 characters.', kind: 'err' }); return; }
    if (!matchOK) { setStatus({ msg: "Passwords don't match.", kind: 'err' }); return; }

    setLoading(true);

    const sb = await getSupabase();

    if (mode === 'create') {
      tick(['☐ Checking email', '☐ Creating your MoneyWise account', '☐ Setting up your budget space']);
      if (sb) {
        const { data, error } = await sb.auth.signUp({ email, password });
        tick(['☑ Checking email', '☑ Creating your MoneyWise account', '☑ Setting up your budget space']);
        setLoading(false);
        if (error) { setStatus({ msg: error.message, kind: 'err' }); setChecklist([]); }
        else { onLogin({ email, isNew: true, user: data.user }); }
      } else {
        /* simulate */
        setTimeout(() => tick(['☑ Checking email', '☐ Creating your MoneyWise account', '☐ Setting up your budget space']), 500);
        setTimeout(() => tick(['☑ Checking email', '☑ Creating your MoneyWise account', '☐ Setting up your budget space']), 1100);
        setTimeout(() => {
          tick(['☑ Checking email', '☑ Creating your MoneyWise account', '☑ Setting up your budget space']);
          setLoading(false);
          onLogin({ email, isNew: true });
        }, 1700);
      }
    } else {
      tick(['☐ Checking email and password', '☐ Connecting securely', '☐ Loading your saved setup']);
      if (sb) {
        const { data, error } = await sb.auth.signInWithPassword({ email, password });
        tick(['☑ Checking email and password', '☑ Connecting securely', '☑ Loading your saved setup']);
        setLoading(false);
        if (error) { setStatus({ msg: error.message, kind: 'err' }); setChecklist([]); }
        else { onLogin({ email, isNew: false, user: data.user }); }
      } else {
        /* simulate */
        setTimeout(() => tick(['☑ Checking email and password', '☐ Connecting securely', '☐ Loading your saved setup']), 500);
        setTimeout(() => tick(['☑ Checking email and password', '☑ Connecting securely', '☐ Loading your saved setup']), 1000);
        setTimeout(() => {
          tick(['☑ Checking email and password', '☑ Connecting securely', '☑ Loading your saved setup']);
          setLoading(false);
          onLogin({ email, isNew: false });
        }, 1500);
      }
    }
  };

  return (
    <div className="mw-auth-stage">
      <div className="mw-auth-hero">
        <div className="mw-auth-logo">
          <div className="mw-logo" style={{ width: 56, height: 56, borderRadius: 18, fontSize: 24 }}>M</div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--mw-ink)' }}>MoneyWise</div>
            <div style={{ fontSize: 12, color: 'var(--mw-ink-3)', fontWeight: 600 }}>stay calm, stay saving</div>
          </div>
        </div>
        <p className="mw-auth-tag">
          {mode === 'forgot'
            ? "We'll send a reset link to your email."
            : mode === 'create'
              ? 'A clean budget for students who actually want to save.'
              : "Welcome back. Let's see how the goal is going."}
        </p>
      </div>

      {mode !== 'forgot' && (
        <div className="mw-auth-tabs">
          <button className={`mw-auth-tab${mode === 'login' ? ' active' : ''}`} onClick={() => { setMode('login'); setStatus({msg:'',kind:''}); }}>
            Log in
          </button>
          <button className={`mw-auth-tab${mode === 'create' ? ' active' : ''}`} onClick={() => { setMode('create'); setStatus({msg:'',kind:''}); }}>
            Create account
          </button>
        </div>
      )}

      <div className="mw-auth-form">
        <div className="mw-field">
          <label className="mw-field-label">Email</label>
          <div className="mw-input-shell compact">
            <input type="email" autoComplete="email" placeholder="you@school.edu"
              value={email} onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()} />
          </div>
        </div>

        {mode !== 'forgot' && (
          <div className="mw-field">
            <label className="mw-field-label">Password</label>
            <div className="mw-input-shell compact">
              <input type={showPw ? 'text' : 'password'}
                autoComplete={mode === 'create' ? 'new-password' : 'current-password'}
                placeholder="At least 6 characters"
                value={password} onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()} />
              <button type="button" className="mw-pw-toggle" onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? 'Hide password' : 'Show password'}>
                {showPw ? '🙈' : '👁'}
              </button>
            </div>
          </div>
        )}

        {mode === 'create' && (
          <div className="mw-field">
            <label className="mw-field-label">Confirm password</label>
            <div className="mw-input-shell compact">
              <input type={showPw ? 'text' : 'password'} autoComplete="new-password"
                placeholder="Type it again"
                value={confirm} onChange={(e) => setConfirm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()} />
            </div>
            <PwStrength value={password} />
          </div>
        )}

        {mode === 'login' && (
          <button className="mw-auth-link" onClick={() => { setMode('forgot'); setStatus({msg:'',kind:''}); }}>
            Forgot password?
          </button>
        )}

        {status.msg && (
          <div className={`mw-auth-status ${status.kind}`}>
            {status.kind === 'ok' ? <Icon.Check width="14" height="14" /> : <Icon.Warn width="14" height="14" />}
            <span>{status.msg}</span>
          </div>
        )}

        {checklist.length > 0 && (
          <div className="mw-auth-checklist">
            {checklist.map((item, i) => (
              <div key={i} className={item.startsWith('☑') ? 'done' : ''}>
                <span className="box">{item.startsWith('☑') ? <Icon.Check width="11" height="11" /> : ''}</span>
                <span>{item.replace(/^[☑☐]\s*/, '')}</span>
              </div>
            ))}
          </div>
        )}

        <button className="mw-btn mw-btn-primary mw-btn-block" onClick={submit} disabled={loading}>
          {loading
            ? <span className="mw-spin-dot"></span>
            : (mode === 'forgot' ? 'Send reset link'
                : mode === 'create' ? 'Create account'
                : 'Log in')}
          {!loading && <Icon.Chev width="14" height="14" />}
        </button>

        {mode === 'forgot' && (
          <button className="mw-btn mw-btn-ghost mw-btn-block" onClick={() => { setMode('login'); setStatus({msg:'',kind:''}); setChecklist([]); }}>
            ← Back to login
          </button>
        )}

        <div className="mw-auth-foot">
          By {mode === 'create' ? 'creating an account' : 'logging in'}, you agree to our
          <a href="#" onClick={(e) => e.preventDefault()}> Terms</a> and
          <a href="#" onClick={(e) => e.preventDefault()}> Privacy Policy</a>.
        </div>
      </div>
    </div>
  );
}

function PwStrength({ value }) {
  const checks = [
    { t: '6+ chars', ok: value.length >= 6 },
    { t: 'number', ok: /\d/.test(value) },
    { t: 'uppercase', ok: /[A-Z]/.test(value) },
  ];
  const done = checks.filter((c) => c.ok).length;
  const colors = ['#E4E6F0', '#E55C5C', '#F5A524', '#2E9E6A'];
  return (
    <div className="mw-pw-meter">
      <div className="bars">
        {[0,1,2].map((i) => (
          <span key={i} style={{ background: i < done ? colors[done] : 'var(--mw-line-2)' }}></span>
        ))}
      </div>
      <div className="reqs">
        {checks.map((c, i) => (
          <span key={i} className={c.ok ? 'ok' : ''}>{c.ok ? '✓' : '·'} {c.t}</span>
        ))}
      </div>
    </div>
  );
}

/* ─────────────── Reset password (from email link) ─────────────── */
function ResetPasswordScreen({ onDone }) {
  const [password, setPassword] = auState('');
  const [confirm, setConfirm] = auState('');
  const [showPw, setShowPw] = auState(false);
  const [loading, setLoading] = auState(false);
  const [status, setStatus] = auState({ msg: '', kind: '' });

  const submit = async () => {
    if (password.length < 6) { setStatus({ msg: 'Password must be at least 6 characters.', kind: 'err' }); return; }
    if (password !== confirm) { setStatus({ msg: "Passwords don't match.", kind: 'err' }); return; }
    setLoading(true);
    const sb = await getSupabase();
    if (!sb) { setLoading(false); setStatus({ msg: 'Could not connect — try again.', kind: 'err' }); return; }
    const { error } = await sb.auth.updateUser({ password });
    setLoading(false);
    if (error) { setStatus({ msg: error.message, kind: 'err' }); }
    else { onDone(); }
  };

  return (
    <div className="mw-auth-stage">
      <div className="mw-auth-hero">
        <div className="mw-auth-logo">
          <div className="mw-logo" style={{ width: 56, height: 56, borderRadius: 18, fontSize: 24 }}>M</div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--mw-ink)' }}>MoneyWise</div>
            <div style={{ fontSize: 12, color: 'var(--mw-ink-3)', fontWeight: 600 }}>stay calm, stay saving</div>
          </div>
        </div>
        <p className="mw-auth-tag">Choose a new password for your account.</p>
      </div>

      <div className="mw-auth-form">
        <div className="mw-field">
          <label className="mw-field-label">New password</label>
          <div className="mw-input-shell compact">
            <input type={showPw ? 'text' : 'password'} autoComplete="new-password"
              placeholder="At least 6 characters"
              value={password} onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()} autoFocus />
            <button type="button" className="mw-pw-toggle" onClick={() => setShowPw(v => !v)}
              aria-label={showPw ? 'Hide password' : 'Show password'}>
              {showPw ? '🙈' : '👁'}
            </button>
          </div>
          <PwStrength value={password} />
        </div>

        <div className="mw-field">
          <label className="mw-field-label">Confirm new password</label>
          <div className="mw-input-shell compact">
            <input type={showPw ? 'text' : 'password'} autoComplete="new-password"
              placeholder="Type it again"
              value={confirm} onChange={(e) => setConfirm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()} />
          </div>
        </div>

        {status.msg && (
          <div className={`mw-auth-status ${status.kind}`}>
            {status.kind === 'ok' ? <Icon.Check width="14" height="14" /> : <Icon.Warn width="14" height="14" />}
            <span>{status.msg}</span>
          </div>
        )}

        <button className="mw-btn mw-btn-primary mw-btn-block" onClick={submit} disabled={loading}>
          {loading ? <span className="mw-spin-dot"></span> : 'Set new password'}
          {!loading && <Icon.Chev width="14" height="14" />}
        </button>
      </div>
    </div>
  );
}

Object.assign(window, { AuthScreen, ResetPasswordScreen, getSupabase });

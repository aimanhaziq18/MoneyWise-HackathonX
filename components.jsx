/* MoneyWise shared components — Header, Drawer, Donut, etc. */

const { useState, useEffect, useRef, useMemo } = React;

/* ─────────────── Status bar (faux device chrome) ─────────────── */
function StatusBar({ time = '9:41' }) {
  return (
    <div className="mw-status">
      <span>{time}</span>
      <div className="mw-status-right">
        <svg width="16" height="11" viewBox="0 0 16 11" fill="currentColor"><path d="M1 7h2v4H1zM5 5h2v6H5zM9 3h2v8H9zM13 0h2v11h-2z"/></svg>
        <svg width="14" height="11" viewBox="0 0 14 11" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M7 2.5c2 0 4 1 5 2"/><path d="M7 5c1.4 0 2.8.7 3.5 1.5"/><circle cx="7" cy="8.5" r="1" fill="currentColor"/><path d="M1 4.5c1.5-1.5 3.5-2.5 6-2.5"/></svg>
        <svg width="22" height="11" viewBox="0 0 22 11" fill="none" stroke="currentColor" strokeWidth="1"><rect x="0.5" y="0.5" width="18" height="10" rx="2"/><rect x="2" y="2" width="14" height="7" rx="1" fill="currentColor"/><path d="M20 4v3"/></svg>
      </div>
    </div>
  );
}

/* ─────────────── Wallet + account popover ─────────────── */
function WalletHeader({ wallet, onMenu, onSwitch, onLogout, user }) {
  const [open, setOpen] = useState(false);
  const popRef = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (popRef.current && !popRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  return (
    <header className="mw-app-header">
      <button className="mw-burger" onClick={onMenu} aria-label="Open menu">
        <span className="b-line"></span>
      </button>

      <div className="mw-wallet">
        <div className="mw-wallet-glyph">
          <Icon.Wallet width="14" height="14" />
        </div>
        <div className="mw-wallet-body">
          <div className="mw-wallet-label">Wallet</div>
          <div className={`mw-wallet-amount${wallet < 0 ? ' neg' : ''}`}>RM{formatNum(wallet)}</div>
        </div>
        <div style={{ position: 'relative' }} ref={popRef}>
          <button className="mw-wallet-menu" onClick={() => setOpen((v) => !v)} aria-label="Account">
            <Icon.ChevDown width="13" height="13" />
          </button>
          {open && (
            <div className="mw-account-pop" onClick={(e) => e.stopPropagation()}>
              <div className="row-user">
                <div className="avatar">{user.initials}</div>
                <div>
                  <div className="user-name">{user.name}</div>
                  <div className="user-email">{user.email}</div>
                </div>
              </div>
              <button className="row" onClick={() => { setOpen(false); onSwitch(); }}>
                <Icon.Tags width="16" height="16" /> Switch account
              </button>

              <button className="row danger" onClick={() => { setOpen(false); onLogout(); }}>
                <Icon.Close width="16" height="16" /> Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

/* ─────────────── Side drawer (hamburger nav) ─────────────── */
function Drawer({ open, current, locked, onClose, onNavigate, onLogout, user, hasLogToday }) {
  const navInput = [
    { id: 'setup', label: 'Setup', Ico: Icon.Setup, lockable: true },
    { id: 'categories', label: 'Categories', Ico: Icon.Tags, lockable: true },
    { id: 'most', label: 'Most spent', Ico: Icon.Star, lockable: true },
    { id: 'daily-log', label: 'Daily log', Ico: Icon.Log },
  ];
  const navView = [
    { id: 'budget', label: 'Budget', Ico: Icon.Donut },
    { id: 'calendar', label: 'Calendar', Ico: Icon.Calendar },
    { id: 'rescue', label: 'Rescue', Ico: Icon.Lifebuoy },
    { id: 'ai-load', label: 'AI plan', Ico: Icon.BrainAI },
  ];
  const renderRow = (item) => {
    const disabled = locked && item.lockable;
    const showBadge = item.id === 'daily-log' && !hasLogToday && !locked;
    return (
      <button
        key={item.id}
        className={`mw-drawer-item${current === item.id ? ' active' : ''}${disabled ? ' disabled' : ''}`}
        onClick={() => { if (!disabled) { onNavigate(item.id); onClose(); } }}
      >
        <span className="ico" style={{ position: 'relative' }}>
          <item.Ico />
          {showBadge && (
            <span style={{
              position: 'absolute', top: -2, right: -2,
              width: 8, height: 8, borderRadius: '50%',
              background: 'var(--mw-danger)',
              border: '1.5px solid var(--mw-card)',
            }} />
          )}
        </span>
        <span>{item.label}</span>
        {disabled && <span className="lock"><Icon.Lock width="13" height="13" /></span>}
      </button>
    );
  };
  return (
    <>
      <div className={`mw-drawer-backdrop${open ? ' open' : ''}`} onClick={onClose}></div>
      <aside className={`mw-drawer${open ? ' open' : ''}`} aria-hidden={!open}>
        <div className="mw-drawer-head">
          <div className="mw-logo">M</div>
          <div>
            <div className="mw-logo-name">MoneyWise</div>
            <div className="mw-logo-sub">stay calm, stay saving</div>
          </div>
        </div>
        <div className="mw-drawer-section">
          <h4>Input</h4>
          {navInput.map(renderRow)}
        </div>
        <div className="mw-drawer-section">
          <h4>View</h4>
          {navView.map(renderRow)}
        </div>
        <div className="mw-drawer-foot">
          <div className="avatar mw-logo" style={{ background: '#1A1F36' }}>{user.initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{user.name}</div>
            <div style={{ fontSize: 11, color: 'var(--mw-ink-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
          </div>
          <button className="mw-btn mw-btn-sm mw-btn-ghost" onClick={onLogout}>Log out</button>
        </div>
      </aside>
    </>
  );
}

/* ─────────────── Donut chart (SVG) ─────────────── */
function Donut({ rows, total, centerLabel, centerAmount, centerPrefix = '', centerSub, negative }) {
  const cx = 110, cy = 110, r = 88;
  const C = 2 * Math.PI * r;
  let acc = 0;
  const safeTotal = total > 0 ? total : 1;
  return (
    <div className="mw-donut">
      <svg viewBox="0 0 220 220">
        {/* base ring */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--mw-line-2)" strokeWidth="22" />
        {rows.map((row, i) => {
          const len = (row.amount / safeTotal) * C;
          const dasharray = `${len} ${C - len}`;
          const dashoffset = -acc;
          acc += len;
          return (
            <circle
              key={i}
              className="seg"
              cx={cx} cy={cy} r={r}
              stroke={row.color}
              strokeDasharray={dasharray}
              strokeDashoffset={dashoffset}
              strokeLinecap="butt"
            />
          );
        })}
      </svg>
      <div className="mw-donut-center">
        <div className="label">{centerLabel}</div>
        <div className={`amount${negative ? ' neg' : ''}`}>{centerPrefix}RM{formatNum(centerAmount)}</div>
        {centerSub && <div className="sub">{centerSub}</div>}
      </div>
    </div>
  );
}

/* ─────────────── Toast ─────────────── */
function useToast() {
  const [msg, setMsg] = useState('');
  const tRef = useRef(null);
  const show = (m) => {
    setMsg(m);
    clearTimeout(tRef.current);
    tRef.current = setTimeout(() => setMsg(''), 2200);
  };
  const node = <div className={`mw-toast${msg ? ' show' : ''}`}>{msg}</div>;
  return [node, show];
}

/* ─────────────── Helpers ─────────────── */
function formatNum(n) {
  const v = Math.round(Number(n) || 0);
  return Math.abs(v).toLocaleString('en-US');
}

function toISODate(date) {
  const d = new Date(date);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function fromISODate(str) {
  return new Date(str + 'T00:00:00');
}

function formatShortDate(iso) {
  const d = fromISODate(iso);
  return { d: String(d.getDate()), m: d.toLocaleDateString('en-US', { month: 'short' }) };
}

function daysBetween(a, b) {
  return Math.max(1, Math.ceil((fromISODate(b) - fromISODate(a)) / 86400000) + 1);
}

/* ─────────────── Confirm modal ─────────────── */
function ConfirmModal({ open, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', destructive, onCancel, onConfirm }) {
  if (!open) return null;
  return (
    <div className="mw-modal-back" onClick={onCancel}>
      <div className="mw-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ttl">{title}</div>
        <div className="msg">{message}</div>
        <div className="row">
          <button className="mw-btn mw-btn-ghost" onClick={onCancel}>{cancelLabel}</button>
          <button className={`mw-btn ${destructive ? 'mw-btn-danger' : 'mw-btn-primary'}`} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  StatusBar, WalletHeader, Drawer, Donut,
  useToast, formatNum, toISODate, fromISODate, formatShortDate, daysBetween,
  ConfirmModal,
});

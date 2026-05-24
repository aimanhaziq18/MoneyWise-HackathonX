/* MoneyWise screens — Setup, Categories, Most-spent, AI Load, Budget, Calendar, Rescue, Daily Log */

const { useState: rState, useEffect: rEffect, useMemo: rMemo, useRef: rRef } = React;

const ALL_CATS = ['food', 'transportation', 'entertainment', 'shopping', 'bills', 'education', 'others'];
const CAT_WEIGHTS = {
  food: 0.25, transportation: 0.15, entertainment: 0.10,
  shopping: 0.10, bills: 0.20, education: 0.10, others: 0.10,
};

/* ─────────────── Setup ─────────────── */
function SetupScreen({ state, set, go }) {
  const errors = [];
  if (state.income > 0 && state.savingGoal >= state.income) errors.push('Saving goal should be less than income.');
  if (state.startDate && state.endDate && state.startDate > state.endDate) errors.push('End date must be after start date.');
  const valid = state.income > 0 && state.savingGoal > 0 && state.startDate && state.endDate && errors.length === 0;
  const days = state.startDate && state.endDate ? daysBetween(state.startDate, state.endDate) : 0;
  const perDay = days && state.income ? Math.round((state.income - state.savingGoal) / days) : 0;

  return (
    <div className="mw-screen">
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 4 }}>
        <span className="mw-chip mw-chip-indigo"><Icon.Sparkle width="12" height="12" /> Step 1 of 3</span>
      </div>
      <h1>Welcome to <br/>MoneyWise <span style={{ color: 'var(--mw-indigo)' }}>👋</span></h1>
      <p className="lead">Tell us what you earn and what you want to save. We'll do the math.</p>

      <div className="mw-field">
        <label className="mw-field-label">Monthly income</label>
        <div className="mw-input-shell">
          <span className="prefix">RM</span>
          <input type="number" inputMode="decimal" placeholder="0"
            value={state.income || ''}
            onChange={(e) => set({ income: Number(e.target.value) || 0 })} />
          <span className="mw-input-suffix">/ month</span>
        </div>
      </div>

      <div className="mw-field">
        <label className="mw-field-label">Saving goal</label>
        <div className="mw-input-shell">
          <span className="prefix">RM</span>
          <input type="number" inputMode="decimal" placeholder="0"
            value={state.savingGoal || ''}
            onChange={(e) => set({ savingGoal: Number(e.target.value) || 0 })} />
          <span className="mw-input-suffix">total</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div className="mw-field">
          <label className="mw-field-label">Start date</label>
          <div className="mw-input-shell compact">
            <input type="date" value={state.startDate}
              onChange={(e) => set({ startDate: e.target.value })} />
          </div>
        </div>
        <div className="mw-field">
          <label className="mw-field-label">End date</label>
          <div className="mw-input-shell compact">
            <input type="date" value={state.endDate}
              onChange={(e) => set({ endDate: e.target.value })} />
          </div>
        </div>
      </div>

      {valid && (
        <div className="mw-card" style={{ background: 'linear-gradient(135deg, var(--mw-indigo-soft) 0%, #F3EEFF 100%)', borderColor: 'transparent' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--mw-indigo-dark)', letterSpacing: 0.5, textTransform: 'uppercase' }}>Quick math</div>
          <div style={{ fontSize: 14, marginTop: 6, color: 'var(--mw-ink-2)' }}>
            That's <strong>RM{formatNum(perDay)}</strong>/day to spend after your goal,
            across <strong>{days}</strong> day{days === 1 ? '' : 's'}.
          </div>
        </div>
      )}

      {errors.map((e, i) => (
        <div key={i} className="mw-chip mw-chip-danger" style={{ alignSelf: 'flex-start' }}>
          <Icon.Warn width="12" height="12" /> {e}
        </div>
      ))}

      <button className="mw-btn mw-btn-primary mw-btn-block" disabled={!valid} onClick={() => go('categories')}>
        Continue <Icon.Chev width="16" height="16" />
      </button>
    </div>
  );
}

/* ─────────────── Categories ─────────────── */
function CategoriesScreen({ state, set, go }) {
  const sel = state.categories;
  const toggle = (c) => {
    if (sel.includes(c)) set({ categories: sel.filter((x) => x !== c) });
    else if (sel.length < 3) set({ categories: [...sel, c] });
  };
  const valid = sel.length === 3;
  return (
    <div className="mw-screen">
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 4 }}>
        <span className="mw-chip mw-chip-indigo"><Icon.Sparkle width="12" height="12" /> Step 2 of 3</span>
      </div>
      <h1>What do you spend on?</h1>
      <p className="lead">Pick 3 expense buckets. We'll watch them for you.</p>

      <div className="mw-section-h" style={{ marginTop: 6 }}>
        <span className="title">{sel.length}/3 selected</span>
        <span className="sub">tap to choose</span>
      </div>
      <div className="mw-cat-grid">
        {ALL_CATS.map((c) => {
          const m = CAT_META[c];
          const isSel = sel.includes(c);
          const disabled = !isSel && sel.length >= 3;
          return (
            <button key={c} type="button"
              className={`mw-cat-tile${isSel ? ' selected' : ''}${disabled ? ' disabled' : ''}`}
              onClick={() => toggle(c)}
              disabled={disabled}>
              <span className="ico-wrap" style={{ background: m.color }}><m.Ico width="18" height="18" /></span>
              <span className="name">{c}</span>
              <span className="check"><Icon.Check /></span>
            </button>
          );
        })}
      </div>

      <button className="mw-btn mw-btn-primary mw-btn-block" disabled={!valid} onClick={() => go('most')}>
        Continue <Icon.Chev width="16" height="16" />
      </button>
    </div>
  );
}

/* ─────────────── Most-spent ─────────────── */
function MostSpentScreen({ state, set, go }) {
  return (
    <div className="mw-screen">
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 4 }}>
        <span className="mw-chip mw-chip-indigo"><Icon.Sparkle width="12" height="12" /> Step 3 of 3</span>
      </div>
      <h1>Where does most of your money go?</h1>
      <p className="lead">We'll give that category a little more breathing room in your budget.</p>

      <div className="mw-cat-grid" style={{ gridTemplateColumns: '1fr', gap: 10 }}>
        {state.categories.map((c) => {
          const m = CAT_META[c];
          const isSel = state.mostSpent === c;
          return (
            <button key={c} type="button"
              className={`mw-cat-tile${isSel ? ' selected' : ''}`}
              onClick={() => set({ mostSpent: c })}
              style={{ padding: '16px 16px' }}>
              <span className="ico-wrap" style={{ background: m.color, width: 44, height: 44, flex: '0 0 44px', borderRadius: 13 }}>
                <m.Ico width="22" height="22" />
              </span>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div className="name" style={{ fontSize: 15 }}>{c}</div>
                <div style={{ fontSize: 12, color: 'var(--mw-ink-3)', marginTop: 2, fontWeight: 600 }}>
                  +5% extra weight
                </div>
              </div>
              <span className="check"><Icon.Check /></span>
            </button>
          );
        })}
      </div>

      <button className="mw-btn mw-btn-primary mw-btn-block" disabled={!state.mostSpent} onClick={() => go('ai-load')}>
        Generate my budget <Icon.Sparkle width="14" height="14" />
      </button>
    </div>
  );
}

/* ─────────────── AI loading hero ─────────────── */
function AILoadScreen({ state, onDone }) {
  const steps = [
    'Reading your income and goal',
    `Analyzing your ${state.mostSpent || 'top'} habit`,
    'Allocating safe daily limits',
    'Plan ready',
  ];
  const [active, setActive] = rState(0);
  rEffect(() => {
    const id = setInterval(() => {
      setActive((a) => a + 1);
    }, 700);
    return () => clearInterval(id);
  }, []);
  rEffect(() => {
    if (active >= steps.length) {
      const t = setTimeout(onDone, 450);
      return () => clearTimeout(t);
    }
  }, [active]);

  return (
    <div className="mw-ai-stage">
      <div className="mw-ai-orbit">
        <div className="mw-ai-orbit-ring"></div>
        <div className="mw-ai-orbit-ring r2"></div>
        <div className="mw-ai-orbit-spinner">
          <div className="mw-ai-coin c1">RM</div>
          <div className="mw-ai-coin c2" style={{ background: 'linear-gradient(135deg,#B47AFF,#6E5BFF)', color: '#fff' }}>★</div>
          <div className="mw-ai-coin c3" style={{ background: 'linear-gradient(135deg,#5BC0EB,#3590E0)', color: '#fff' }}>$</div>
          <div className="mw-ai-coin c4" style={{ background: 'linear-gradient(135deg,#4DAA7A,#2E9E6A)', color: '#fff' }}>✓</div>
        </div>
        <div className="mw-ai-orbit-core"></div>
      </div>
      <div className="mw-ai-title">Building your money plan…</div>
      <div className="mw-ai-sub">Our model is balancing your goal against real-world spending patterns.</div>
      <div className="mw-ai-steps">
        {steps.map((s, i) => (
          <div key={i} className={`mw-ai-step${i === active ? ' active' : ''}${i < active ? ' done' : ''}`}>
            <span className="num">{i < active ? <Icon.Check width="12" height="12" /> : i + 1}</span>
            <span>{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────── Budget computation ─────────────── */
function computeBudget(state) {
  const income = Number(state.income) || 0;
  const earned = state.logs.reduce((s, l) => s + (l.earn || 0), 0);
  const spent = state.logs.reduce((s, l) => s + (l.expense || 0), 0);
  const totalIncome = income + earned;
  const wallet = totalIncome - spent;
  const savingGoal = Number(state.savingGoal) || 0;
  const spendable = Math.max(income - savingGoal, 0);           // base plan (income only)
  const categoryBase = Math.max(totalIncome - savingGoal, 0);   // full budget including earned
  const totalWeight = state.categories.reduce((sum, name) => {
    return sum + (CAT_WEIGHTS[name] || 0.1) + (name === state.mostSpent ? 0.05 : 0);
  }, 0);
  const rows = state.categories.map((name) => {
    const w = (CAT_WEIGHTS[name] || 0.1) + (name === state.mostSpent ? 0.05 : 0);
    const pct = totalWeight ? Math.round((w / totalWeight) * 100) : 0;
    const amount = totalWeight ? Math.round(categoryBase * (w / totalWeight)) : 0;
    const used = state.logs.filter((l) => l.category === name).reduce((s, l) => s + l.expense, 0);
    return { name, amount, used, pct, color: getComputedStyle(document.documentElement).getPropertyValue(`--cat-${name}`).trim() || '#888', meta: CAT_META[name] };
  });
  const totalSpendable = categoryBase;
  const budgetLeft = wallet - savingGoal;  // actual remaining (can be negative)
  const totalBudget = rows.reduce((s, r) => s + r.amount, 0);

  // goal status
  const start = state.startDate, end = state.endDate;
  const totalDays = start && end ? daysBetween(start, end) : 30;
  const elapsed = start ? Math.max(0, Math.min(totalDays, Math.ceil((new Date() - fromISODate(start)) / 86400000))) : 0;
  const expectedSpent = (elapsed / totalDays) * categoryBase;
  const overspend = Math.max(0, spent - expectedSpent);

  // status verdict
  let goalStatus, goalDetail, goalKind;
  const progressPct = savingGoal > 0 ? Math.max(0, Math.min(100, (wallet - savingGoal + savingGoal * (elapsed / totalDays)) / savingGoal * 100)) : 100;
  if (wallet < savingGoal && spent > expectedSpent + 50) {
    goalStatus = 'At risk';
    goalDetail = `You've spent RM${formatNum(spent)} of RM${formatNum(spendable)} — that's RM${formatNum(Math.round(overspend))} above pace.`;
    goalKind = 'danger';
  } else if (wallet < savingGoal) {
    goalStatus = 'On track but tight';
    goalDetail = `Keep daily spending under RM${formatNum(Math.round(spendable / totalDays))} to hit RM${formatNum(savingGoal)}.`;
    goalKind = 'warn';
  } else {
    goalStatus = 'Very likely';
    goalDetail = `You're RM${formatNum(wallet - savingGoal)} ahead of your goal of RM${formatNum(savingGoal)}.`;
    goalKind = 'success';
  }

  return {
    wallet, totalIncome, income, savingGoal, spent, earned, spendable, totalSpendable, totalBudget, budgetLeft,
    rows, overspend, totalDays, elapsed, expectedSpent,
    goalStatus, goalDetail, goalKind,
    safeDaily: Math.max(0, Math.floor((wallet - savingGoal) / Math.max(1, totalDays - elapsed))),
  };
}

/* ─────────────── Budget dashboard ─────────────── */
function BudgetScreen({ state, go, onCancel, toast, showStreaks = true, showCoachTips = true }) {
  const b = rMemo(() => computeBudget(state), [state]);
  const GOAL_COLOR = '#6E5BFF';
  const pieRows = rMemo(() => [
    ...b.rows.map((r) => ({ name: r.name, amount: r.amount, color: r.color })),
    { name: 'Saving goal', amount: b.savingGoal, color: GOAL_COLOR },
  ].filter((r) => r.amount > 0), [b]);
  const pieTotal = pieRows.reduce((s, r) => s + r.amount, 0);

  const [cancelOpen, setCancelOpen] = rState(false);

  const daysLogged = rMemo(() => {
    const saved = new Set(state.logs.map(l => l.date));
    let count = 0;
    if (!state.startDate || !state.endDate) return 0;
    const start = fromISODate(state.startDate);
    for (let i = 0; i < b.totalDays; i++) {
      const iso = toISODate(new Date(start.getTime() + i * 86400000));
      if (saved.has(iso)) count++;
    }
    return count;
  }, [state.logs, state.startDate, state.endDate, b.totalDays]);

  return (
    <div className="mw-screen">
      {/* Hero */}
      <div className="mw-hero-card">
        <div className="mw-hero-row">
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', opacity: 0.75 }}>
              {state.startDate?.slice(5)} — {state.endDate?.slice(5)}
            </div>
            <div style={{ fontSize: 14, marginTop: 4, opacity: 0.9 }}>
              <strong>{daysLogged}</strong> / <strong>{b.totalDays}</strong> days logged
            </div>
          </div>
        </div>

        <div className="mw-donut-wrap" style={{ marginTop: 12 }}>
          <Donut
            rows={pieRows}
            total={pieTotal}
            centerLabel={b.budgetLeft < 0 ? 'Overspent' : 'Budget left'}
            centerAmount={Math.abs(b.budgetLeft)}
            centerPrefix={b.budgetLeft < 0 ? '−' : ''}
            centerSub={b.budgetLeft < 0 ? `RM${formatNum(Math.abs(b.budgetLeft))} over limit` : b.budgetLeft < b.totalSpendable * 0.25 ? 'Slow down a bit' : `of RM${formatNum(Math.max(b.totalSpendable, b.totalBudget))}`}
            negative={b.budgetLeft < 0}
          />
        </div>

        <div className="mw-legend" style={{ marginTop: 6, color: '#fff' }}>
          {[...b.rows.map(r => ({ name: r.name, amount: r.amount, color: r.color })),
            { name: 'Saving goal', amount: b.savingGoal, color: GOAL_COLOR }
          ].map((r) => (
            <div key={r.name} className="mw-legend-item" style={{ color: 'rgba(255,255,255,.92)' }}>
              <span className="mw-legend-dot" style={{ background: r.color }}></span>
              <span className="name" style={{ color: 'rgba(255,255,255,.85)' }}>{r.name}</span>
              <span className="amt" style={{ color: '#fff' }}>RM{formatNum(r.amount)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Explainer */}
      {showCoachTips && (
      <div className="mw-card">
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--mw-ink-3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>How we got there</div>
        <div style={{ fontSize: 13, marginTop: 8, lineHeight: 1.5, color: 'var(--mw-ink-2)' }}>
          Income <strong>RM{formatNum(b.income)}</strong> + earned <strong style={{ color: 'var(--mw-success)' }}>+RM{formatNum(b.earned)}</strong> − spent <strong style={{ color: 'var(--mw-danger)' }}>−RM{formatNum(b.spent)}</strong> = wallet <strong>RM{formatNum(b.wallet)}</strong>.
        </div>
        <div style={{ marginTop: 10, padding: '10px 12px', background: 'var(--mw-bg-2)', borderRadius: 12, fontSize: 12, color: 'var(--mw-ink-2)', display: 'flex', gap: 8 }}>
          <Icon.Sparkle width="14" height="14" style={{ color: 'var(--mw-indigo)', flexShrink: 0, marginTop: 2 }} />
          <span><strong>Tip:</strong> {b.wallet >= b.savingGoal
            ? `Keep daily spending under RM${b.safeDaily} to protect your RM${b.savingGoal} goal.`
            : `Cap daily spend at RM${b.safeDaily} to get back on track.`}</span>
        </div>
      </div>
      )}

      {/* Per-category cards */}
      <div className="mw-section-h">
        <span className="title">Category budgets</span>
        <span className="sub">Period spending plan</span>
      </div>
      {(() => {
        const actualLeft = Math.max(0, b.budgetLeft);
        const totalTrackedRemaining = b.rows.reduce((s, r) => r.used <= r.amount ? s + (r.amount - r.used) : s, 0);
        const walletInDeficit = b.budgetLeft < 0;

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {b.rows.map((r) => {
              const over = r.used > r.amount;
              const ownOverspend = over ? r.used - r.amount : 0;
              const remaining = over ? 0 : r.amount - r.used;
              const effectiveRemaining = !over && totalTrackedRemaining > 0
                ? Math.round((remaining / totalTrackedRemaining) * actualLeft)
                : 0;

              // Only show danger if wallet is in deficit — if earned income covers it, no warning
              const coveredByEarnings = over && !walletInDeficit;
              const showWarn = over && walletInDeficit;

              const usedPct = r.amount > 0 ? Math.min(100, (r.used / r.amount) * 100) : 0;
              const isMost = r.name === state.mostSpent;
              const explain = b.earned > 0
                ? `${r.pct}% of RM${formatNum(b.totalIncome - b.savingGoal)} (income + earned)${isMost ? ' · top spend boost' : ''}`
                : `${r.pct}% of RM${formatNum(b.spendable)} income${isMost ? ' · top spend boost' : ''}`;

              const subText = showWarn
                ? `RM${formatNum(ownOverspend)} over budget`
                : coveredByEarnings
                  ? `RM${formatNum(ownOverspend)} over allocation · covered by earnings`
                  : `You may use RM${formatNum(effectiveRemaining)} for ${r.name}`;

              return (
                <div key={r.name} className={`mw-bcat${showWarn ? ' warn' : ''}`}>
                  <div className="ico-wrap" style={{ background: r.color }}>
                    <r.meta.Ico width="18" height="18" />
                  </div>
                  <div className="meta">
                    <div className="name">{r.name}</div>
                    <div className="sub" style={{ color: showWarn ? 'var(--mw-danger)' : coveredByEarnings ? 'var(--mw-success)' : undefined }}>
                      {subText}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--mw-ink-3)', marginTop: 2 }}>{explain}</div>
                    <div className="bar" style={{ marginTop: 6 }}>
                      <div className="bar-fill" style={{ width: `${usedPct}%`, background: showWarn ? 'var(--mw-danger)' : r.color }}></div>
                    </div>
                  </div>
                  <div className="amt" style={{ color: showWarn ? 'var(--mw-danger)' : 'var(--mw-ink)' }}>
                    RM{formatNum(showWarn ? 0 : effectiveRemaining)}
                  </div>
                </div>
              );
            })}
            {walletInDeficit && (
              <div style={{ padding: '10px 14px', borderRadius: 'var(--r-md)', background: 'var(--mw-danger-soft)', border: '1px solid rgba(229,92,92,.25)', fontSize: 13, color: 'var(--mw-danger)', fontWeight: 700 }}>
                RM{formatNum(Math.abs(b.budgetLeft))} total overspend — wallet is in deficit.
              </div>
            )}
          </div>
        );
      })()}

      {/* Goal status */}
      <div className="mw-goal-card">
        <div className="mw-goal-head">
          <div>
            <div className="mw-goal-label">Goal status</div>
            <div className="mw-goal-title">{b.goalStatus}</div>
          </div>
          <span className={`mw-chip mw-chip-${b.goalKind === 'danger' ? 'danger' : b.goalKind === 'warn' ? 'warn' : 'success'}`}>
            {b.goalKind === 'danger' ? <Icon.Warn width="12" height="12" /> : b.goalKind === 'warn' ? <Icon.Warn width="12" height="12" /> : <Icon.Trophy width="12" height="12" />}
            RM{formatNum(b.savingGoal)}
          </span>
        </div>
        <div style={{ fontSize: 13, color: 'var(--mw-ink-2)', lineHeight: 1.5 }}>{b.goalDetail}</div>
        <div className="mw-goal-progress">
          <div style={{ width: `${Math.max(0, Math.min(100, ((b.elapsed / b.totalDays) * 100)))}%` }}></div>
        </div>
        <div style={{ fontSize: 11, color: 'var(--mw-ink-3)', display: 'flex', justifyContent: 'space-between' }}>
          <span>Period elapsed {Math.round((b.elapsed / b.totalDays) * 100)}%</span>
          <span>{b.totalDays - b.elapsed} days left</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <button className="mw-btn mw-btn-ghost" onClick={() => go('calendar')}>
          <Icon.Calendar width="14" height="14" /> Calendar
        </button>
        <button className="mw-btn mw-btn-primary" onClick={() => go('rescue')}>
          <Icon.Lifebuoy width="14" height="14" /> Rescue plan
        </button>
      </div>

      <button className="mw-btn mw-btn-danger mw-btn-block" style={{ marginTop: 4 }} onClick={() => setCancelOpen(true)}>
        Cancel budget
      </button>

      <ConfirmModal
        open={cancelOpen}
        title="Cancel this budget?"
        message="Your setup, categories, dates, and daily logs will be cleared. You'll stay logged in."
        confirmLabel="Yes, cancel"
        cancelLabel="Keep budget"
        destructive
        onCancel={() => setCancelOpen(false)}
        onConfirm={() => { setCancelOpen(false); onCancel(); }}
      />
    </div>
  );
}

/* ─────────────── Calendar ─────────────── */
function CalendarScreen({ state, go }) {
  const [view, setView] = rState(() => {
    if (state.startDate) {
      const d = fromISODate(state.startDate);
      return { y: d.getFullYear(), m: d.getMonth() };
    }
    const n = new Date();
    return { y: n.getFullYear(), m: n.getMonth() };
  });
  const today = new Date();
  const start = state.startDate ? fromISODate(state.startDate) : null;
  const end = state.endDate ? fromISODate(state.endDate) : null;

  const minView = start ? { y: start.getFullYear(), m: start.getMonth() } : null;
  const maxView = end   ? { y: end.getFullYear(),   m: end.getMonth()   } : null;
  const canGoPrev = !minView || view.y > minView.y || (view.y === minView.y && view.m > minView.m);
  const canGoNext = !maxView || view.y < maxView.y || (view.y === maxView.y && view.m < maxView.m);

  const totalsByDate = rMemo(() => {
    const map = {};
    state.logs.forEach((l) => {
      if (!map[l.date]) map[l.date] = { expense: 0, earn: 0 };
      map[l.date].expense += l.expense;
      map[l.date].earn += l.earn;
    });
    return map;
  }, [state.logs]);

  const b = rMemo(() => computeBudget(state), [state]);
  const safeDaily = b.safeDaily;

  const firstDay = new Date(view.y, view.m, 1);
  const startWeekday = firstDay.getDay();
  const daysIn = new Date(view.y, view.m + 1, 0).getDate();
  const prevDays = new Date(view.y, view.m, 0).getDate();

  // build 6 weeks of cells
  const cells = [];
  for (let i = 0; i < startWeekday; i++) {
    cells.push({ outside: true, day: prevDays - startWeekday + 1 + i });
  }
  for (let d = 1; d <= daysIn; d++) {
    const iso = toISODate(new Date(view.y, view.m, d));
    const totals = totalsByDate[iso];
    const dateObj = new Date(view.y, view.m, d);
    const inPeriod = (!start || dateObj >= new Date(start.getFullYear(), start.getMonth(), start.getDate())) &&
                     (!end || dateObj <= new Date(end.getFullYear(), end.getMonth(), end.getDate()));
    const isToday = today.getFullYear() === view.y && today.getMonth() === view.m && today.getDate() === d;
    let kind = inPeriod ? 'in-period' : '';
    if (totals && totals.expense > 0) {
      kind = totals.expense > safeDaily ? 'over' : 'safe';
    }
    cells.push({ day: d, iso, totals, kind, isToday });
  }
  while (cells.length < 42) cells.push({ outside: true, day: cells.length - daysIn - startWeekday + 1 });


  const monthName = new Date(view.y, view.m, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="mw-screen">
      <h1>Calendar</h1>
      <p className="lead">Spending shows up here. Red days are risky.</p>

      <div className="mw-card" style={{ padding: 16 }}>
        <div className="mw-cal-head">
          <button className="mw-cal-nav" disabled={!canGoPrev} onClick={() => canGoPrev && setView((v) => ({ y: v.m === 0 ? v.y - 1 : v.y, m: v.m === 0 ? 11 : v.m - 1 }))} style={{ opacity: canGoPrev ? 1 : 0.25 }}>
            <Icon.Chev width="14" height="14" style={{ transform: 'rotate(180deg)' }} />
          </button>
          <div className="mw-cal-month">{monthName}</div>
          <button className="mw-cal-nav" disabled={!canGoNext} onClick={() => canGoNext && setView((v) => ({ y: v.m === 11 ? v.y + 1 : v.y, m: v.m === 11 ? 0 : v.m + 1 }))} style={{ opacity: canGoNext ? 1 : 0.25 }}>
            <Icon.Chev width="14" height="14" />
          </button>
        </div>
        <div className="mw-cal-dows">
          {['S','M','T','W','T','F','S'].map((d, i) => <span key={i}>{d}</span>)}
        </div>
        <div className="mw-cal-grid">
          {cells.map((c, i) => (
            <div key={i} className={`mw-cal-day ${c.outside ? 'outside' : c.kind || ''} ${c.isToday ? 'today' : ''}`}>
              {c.day}
              {c.totals && (
                <span style={{
                  position: 'absolute', left: 4, top: 'auto', bottom: 4, right: 4,
                  fontSize: 9, fontWeight: 700, opacity: 0.9, lineHeight: 1.1, textAlign: 'left',
                }}>
                  −{c.totals.expense > 999 ? `${(c.totals.expense/1000).toFixed(1)}k` : c.totals.expense}
                </span>
              )}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 12, fontSize: 11, color: 'var(--mw-ink-3)', fontWeight: 600 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: '#E8F5EE', border: '1px solid #A8DDB8' }}></span> Safe (≤ RM{formatNum(safeDaily)})
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: '#FFEAE5', border: '1px solid #FFB8AA' }}></span> Overspent
          </span>
        </div>
      </div>

      <button className="mw-btn mw-btn-primary mw-btn-block" onClick={() => go('rescue')}>
        See rescue plan <Icon.Chev width="14" height="14" />
      </button>
    </div>
  );
}

/* ─────────────── Rescue ─────────────── */
function RescueScreen({ state, go }) {
  const b = rMemo(() => computeBudget(state), [state]);

  const daysLogged = rMemo(() => {
    const saved = new Set(state.logs.map(l => l.date));
    let count = 0;
    if (!state.startDate || !state.endDate) return 0;
    const start = fromISODate(state.startDate);
    for (let i = 0; i < b.totalDays; i++) {
      const iso = toISODate(new Date(start.getTime() + i * 86400000));
      if (saved.has(iso)) count++;
    }
    return count;
  }, [state.logs, state.startDate, state.endDate, b.totalDays]);

  const daysLeft = b.totalDays - daysLogged;

  // Use totalSpendable (includes earned) for pace — fixes false overspend when earned is large
  const expectedByNow = Math.round(b.totalSpendable * (daysLogged / b.totalDays));
  const paceOverspend = Math.max(0, b.spent - expectedByNow);
  const isOver = b.budgetLeft < 0;

  const [aiData, setAiData] = rState(null);
  const [loading, setLoading] = rState(true);

  rEffect(() => {
    let cancelled = false;
    setLoading(true);
    setAiData(null);

    fetch('/api/rescue-tips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        income: state.income,
        earned: b.earned,
        wallet: b.wallet,
        savingGoal: state.savingGoal,
        budgetLeft: b.budgetLeft,
        daysLeft,
        totalDays: b.totalDays,
        paceOverspend,
        spent: b.spent,
        totalSpendable: b.totalSpendable,
        categories: b.rows.map(r => ({ name: r.name, amount: r.amount, used: r.used })),
        logs: state.logs.map(l => ({ date: l.date, category: l.category, expense: l.expense, earn: l.earn, note: l.note || '' })),
      }),
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => { if (!cancelled && data.tips) setAiData(data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, []);


  const sentimentColors = {
    positive: { bg: 'linear-gradient(135deg,#1a3a2a 0%,#1e4d35 100%)', pill: '#2E9E6A', amt: '#4DD9A0' },
    warning:  { bg: 'linear-gradient(135deg,#3a2a0a 0%,#4d3a10 100%)', pill: '#c97a00', amt: '#f5a623' },
    danger:   { bg: 'linear-gradient(135deg,#1A1F36 0%,#2E2475 100%)', pill: '#E55C5C', amt: '#FF8A8A' },
  };
  const sentiment = aiData?.status?.sentiment || (isOver ? 'danger' : paceOverspend > 0 ? 'warning' : 'positive');
  const sc = sentimentColors[sentiment] || sentimentColors.danger;

  const staticTips = isOver || paceOverspend > 0 ? [
    { title: `Reduce ${[...b.rows].sort((a,x)=>x.used-a.used)[0]?.name||'top'} spending`, subtitle: 'Your highest spend category this period', detail: `You've spent the most here. Cutting back even 20% makes a real difference.`, action: 'Set a hard cap for the rest of the period', save: Math.ceil(paceOverspend * 0.5) },
    { title: 'Pause non-essential purchases', subtitle: 'Wait 7 days before buying anything new', detail: 'Delaying purchases by a week often removes the urge entirely.', action: 'Write down what you want — revisit in 7 days', save: Math.ceil(paceOverspend * 0.25) },
    { title: 'Cook meals at home', subtitle: 'Saves RM10–20 per meal vs eating out', detail: 'Food is typically the largest flexible expense. Home cooking resets the habit.', action: 'Plan 3 home meals this week', save: Math.max(0, paceOverspend - Math.ceil(paceOverspend * 0.75)) },
  ] : [
    { title: `Stay under RM${b.safeDaily}/day`, subtitle: 'Your safe daily limit to hit goal', detail: `At this rate you'll protect your RM${formatNum(state.savingGoal)} goal with ${daysLeft} days left.`, action: `Set a phone reminder at RM${b.safeDaily} each day`, save: null },
    { title: 'Pre-move your saving goal', subtitle: 'Transfer before you can spend it', detail: 'Automating your saving goal removes the temptation to dip into it.', action: `Transfer RM${formatNum(state.savingGoal)} to savings now`, save: null },
    { title: 'Weekly category check-in', subtitle: '15 min every Sunday keeps you on track', detail: 'Small weekly reviews prevent month-end surprises. Check which category crept up.', action: 'Set a Sunday 9am calendar reminder', save: null },
  ];

  const displayTips = aiData?.tips || staticTips;
  const statusHeadline = aiData?.status?.headline || (isOver ? 'Budget in deficit' : paceOverspend > 0 ? 'Spending ahead of pace' : 'You\'re on track');
  const statusDetail = aiData?.status?.detail || (isOver
    ? `Wallet is RM${formatNum(Math.abs(b.budgetLeft))} below your saving goal.`
    : paceOverspend > 0
      ? `RM${formatNum(expectedByNow)} expected by today — you're RM${formatNum(paceOverspend)} ahead of pace.`
      : `RM${formatNum(b.budgetLeft)} remaining with ${daysLeft} days to go.`);

  return (
    <div className="mw-screen">
      <h1>Rescue plan</h1>
      <p className="lead">Your AI financial coach — real advice from your real numbers.</p>

      {/* Claude-powered status hero */}
      <div className="mw-rescue-game" style={{ background: sc.bg }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          {loading ? (
            <>
              <div className="mw-shimmer-bar" style={{ width: 80, height: 22, borderRadius: 11, marginBottom: 12 }}></div>
              <div className="mw-shimmer-bar" style={{ width: '70%', height: 36, borderRadius: 8, marginBottom: 10 }}></div>
              <div className="mw-shimmer-bar" style={{ width: '90%', height: 14, borderRadius: 6 }}></div>
            </>
          ) : (
            <>
              <span className="mw-rescue-pill" style={{ background: sc.pill }}>{statusHeadline}</span>
              <div className="mw-rescue-amt" style={{ color: sc.amt, fontSize: 28, marginTop: 10, lineHeight: 1.3 }}>
                {statusDetail}
              </div>
              {aiData && (
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 5, opacity: 0.7 }}>
                  <Icon.Sparkle width="11" height="11" />
                  <span style={{ fontSize: 11, fontWeight: 600 }}>Claude analysis</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Key stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 16, position: 'relative', zIndex: 1 }}>
          {[
            { label: 'Wallet', value: `RM${formatNum(b.wallet)}` },
            { label: 'Safe/day', value: `RM${formatNum(b.safeDaily)}` },
            { label: 'Days left', value: `${daysLeft}` },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: 'rgba(255,255,255,.10)', borderRadius: 10, padding: '8px 10px', textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,.6)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Behaviour summary */}
      {(loading || aiData?.behaviour) && (
        <div className="mw-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <Icon.BrainAI width="14" height="14" style={{ color: 'var(--mw-indigo)', flexShrink: 0 }} />
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--mw-ink-3)' }}>Spending behaviour</span>
          </div>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="mw-shimmer-bar" style={{ width: '100%', height: 13, borderRadius: 6 }}></div>
              <div className="mw-shimmer-bar" style={{ width: '88%', height: 13, borderRadius: 6 }}></div>
              <div className="mw-shimmer-bar" style={{ width: '72%', height: 13, borderRadius: 6 }}></div>
              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                <div className="mw-shimmer-bar" style={{ width: 88, height: 26, borderRadius: 999 }}></div>
                <div className="mw-shimmer-bar" style={{ width: 112, height: 26, borderRadius: 999 }}></div>
                <div className="mw-shimmer-bar" style={{ width: 76, height: 26, borderRadius: 999 }}></div>
              </div>
            </div>
          ) : (
            <>
              <p style={{ fontSize: 13, color: 'var(--mw-ink-2)', lineHeight: 1.65, margin: 0 }}>
                {aiData.behaviour.summary}
              </p>
              {aiData.behaviour.patterns?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {aiData.behaviour.patterns.map((p, i) => (
                    <span key={i} title={p.description} style={{
                      display: 'inline-flex', alignItems: 'center',
                      background: 'var(--mw-indigo-soft)',
                      border: '1px solid rgba(108,99,255,.18)',
                      borderRadius: 999,
                      padding: '5px 12px',
                      fontSize: 11, fontWeight: 700,
                      color: 'var(--mw-indigo-dark)',
                      cursor: 'default',
                    }}>{p.label}</span>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Tips */}
      <div className="mw-section-h">
        <span className="title">{isOver || paceOverspend > 0 ? '3 ways to recover' : '3 ways to stay safe'}</span>
        <span className="sub" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {loading
            ? <><span className="mw-rescue-ai-dot"></span> Claude thinking…</>
            : aiData ? <><Icon.Sparkle width="11" height="11" /> AI personalised</> : 'Pick what fits'}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading ? (
          [1,2,3].map(i => (
            <div key={i} className="mw-rescue-action" style={{ flexDirection: 'column', gap: 10, alignItems: 'stretch' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div className="num">{i}</div>
                <div className="mw-shimmer-bar" style={{ flex: 1, height: 14, borderRadius: 6 }}></div>
                <div className="mw-shimmer-bar" style={{ width: 52, height: 14, borderRadius: 6 }}></div>
              </div>
              <div className="mw-shimmer-bar" style={{ width: '85%', height: 11, borderRadius: 5, marginLeft: 36 }}></div>
              <div className="mw-shimmer-bar" style={{ width: '95%', height: 11, borderRadius: 5, marginLeft: 36 }}></div>
            </div>
          ))
        ) : displayTips.map((tip, i) => (
          <div key={i} className="mw-rescue-action" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 0, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
              <div className="num" style={{ flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="t">{tip.title}</div>
                <div className="s" style={{ marginTop: 2 }}>{tip.subtitle}</div>
              </div>
              {tip.save != null && (
                <div className="save" style={{ flexShrink: 0 }}>+RM{formatNum(tip.save)}</div>
              )}
            </div>
            {tip.detail && (
              <div style={{ fontSize: 12, color: 'var(--mw-ink-2)', lineHeight: 1.6, paddingLeft: 36, borderTop: '1px solid var(--mw-line)', paddingTop: 10, marginTop: 0 }}>
                {tip.detail}
              </div>
            )}
            {tip.action && (
              <div style={{ marginTop: 8, paddingLeft: 36, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon.Check width="12" height="12" style={{ color: 'var(--mw-success)', flexShrink: 0 }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--mw-success)' }}>{tip.action}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <button className="mw-btn mw-btn-ghost" onClick={() => go('budget')}>Back to budget</button>
        <button className="mw-btn mw-btn-primary" onClick={() => go('daily-log')}>
          <Icon.Plus width="14" height="14" /> Log a spend
        </button>
      </div>
    </div>
  );
}

function RecoveryGauge({ value }) {
  // semi-circle gauge
  const cx = 100, cy = 100, r = 80;
  const C = Math.PI * r;
  const len = (value / 100) * C;
  return (
    <svg width="200" height="120" viewBox="0 0 200 120" style={{ margin: '8px auto' }}>
      <defs>
        <linearGradient id="g1" x1="0" x2="1">
          <stop offset="0%" stopColor="#E55C5C"/>
          <stop offset="50%" stopColor="#F5A524"/>
          <stop offset="100%" stopColor="#2E9E6A"/>
        </linearGradient>
      </defs>
      <path d={`M${cx-r},${cy} A${r},${r} 0 0 1 ${cx+r},${cy}`}
        fill="none" stroke="var(--mw-line-2)" strokeWidth="14" strokeLinecap="round"/>
      <path d={`M${cx-r},${cy} A${r},${r} 0 0 1 ${cx+r},${cy}`}
        fill="none" stroke="url(#g1)" strokeWidth="14" strokeLinecap="round"
        strokeDasharray={`${len} ${C}`} />
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize="32" fontWeight="800" letterSpacing="-0.02em" fill="var(--mw-ink)">{Math.round(value)}%</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--mw-ink-3)" letterSpacing="0.4" style={{ textTransform: 'uppercase' }}>SCORE</text>
    </svg>
  );
}

/* ─────────────── Daily log ─────────────── */
function DailyLogScreen({ state, addLog, removeLog, go, toast, today = toISODate(new Date()) }) {
  const [expense, setExpense] = rState('');
  const [earn, setEarn] = rState('');
  const [category, setCategory] = rState('');
  const [customCat, setCustomCat] = rState('');
  const [note, setNote] = rState('');
  const [date, setDate] = rState(() => {
    if (state.startDate && today < state.startDate) return state.startDate;
    if (state.endDate && today > state.endDate) return state.endDate;
    return today;
  });
  const [tab, setTab] = rState('expense');
  const [stagedByDate, setStagedByDate] = rState({});

  const slotRef = rRef(null);
  const slots = rMemo(() => {
    if (!state.startDate || !state.endDate) return [];
    const start = fromISODate(state.startDate);
    const total = daysBetween(state.startDate, state.endDate);
    return Array.from({ length: total }, (_, i) => {
      const d = new Date(start.getTime() + i * 86400000);
      const iso = toISODate(d);
      return { day: i + 1, iso, label: formatShortDate(iso) };
    });
  }, [state.startDate, state.endDate]);

  rEffect(() => {
    if (!slotRef.current) return;
    const idx = slots.findIndex(s => s.iso === date);
    if (idx < 0) return;
    const el = slotRef.current.children[idx];
    if (el) el.scrollIntoView({ inline: 'center', behavior: 'smooth', block: 'nearest' });
  }, [date, slots]);

  const resolvedCategory = category === 'custom' ? customCat.trim() : category;
  const currentStaged = stagedByDate[date] || [];

  const daysLogged = rMemo(() => {
    const savedDates = new Set(state.logs.map(l => l.date));
    return slots.filter(s => savedDates.has(s.iso)).length;
  }, [state.logs, slots]);

  const periodLogs = state.logs.slice().sort((a, b) => b.date.localeCompare(a.date));
  const totalExp = periodLogs.reduce((s, l) => s + l.expense, 0);
  const totalErn = periodLogs.reduce((s, l) => s + l.earn, 0);

  const addToList = () => {
    const exp = Number(expense) || 0;
    const ern = Number(earn) || 0;
    if (exp <= 0 && ern <= 0) { toast('Add an amount first'); return; }
    if (tab === 'expense' && exp <= 0) { toast('Enter an expense amount'); return; }
    if (tab === 'earn' && ern <= 0) { toast('Enter an earned amount'); return; }
    if (tab === 'expense' && !resolvedCategory) { toast('Pick or type a category'); return; }
    const item = {
      _id: Date.now() + Math.random(),
      expense: tab === 'expense' ? exp : 0,
      earn: tab === 'earn' ? ern : 0,
      category: tab === 'expense' ? (resolvedCategory || 'others') : 'income',
      note: note.trim(),
    };
    setStagedByDate(prev => ({ ...prev, [date]: [...(prev[date] || []), item] }));
    setExpense(''); setEarn(''); setCategory(''); setCustomCat(''); setNote('');
  };

  const removeStagedItem = (id) => {
    setStagedByDate(prev => ({ ...prev, [date]: (prev[date] || []).filter(i => i._id !== id) }));
  };

  const submitDay = async () => {
    if (currentStaged.length === 0) { toast('Add at least one entry first'); return; }
    for (const item of currentStaged) {
      await addLog({ expense: item.expense, earn: item.earn, category: item.category, date, note: item.note });
    }
    setStagedByDate(prev => { const next = { ...prev }; delete next[date]; return next; });
    const slot = slots.find(s => s.iso === date);
    toast(`Day ${slot ? slot.day : ''} logged!`);
  };

  const currentSlot = slots.find(s => s.iso === date);

  return (
    <div className="mw-screen">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
        <h1 style={{ margin: 0 }}>Daily log</h1>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          background: 'var(--mw-indigo-soft)', borderRadius: 20,
          padding: '5px 12px', fontSize: 12, fontWeight: 700, color: 'var(--mw-indigo)',
        }}>
          <span style={{ fontSize: 16, fontWeight: 800 }}>{daysLogged}</span>
          <span style={{ opacity: 0.7 }}>/ {slots.length} days logged</span>
        </div>
      </div>
      <p className="lead">Build your list, then confirm to lock the day.</p>

      {/* Day slots — placed above tabs so user picks day first */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--mw-ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Day</div>
        <div ref={slotRef} style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '2px 0', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {slots.map((s) => {
            const active = s.iso === date;
            const hasEntry = state.logs.some(l => l.date === s.iso);
            const hasStaged = (stagedByDate[s.iso] || []).length > 0;
            const isPast = s.iso <= today;
            const needsLog = isPast && !hasEntry && !hasStaged;
            const logged = hasEntry && !active;
            const staged = hasStaged && !hasEntry && !active;
            return (
              <button key={s.iso} type="button" onClick={() => setDate(s.iso)} style={{
                flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '8px 10px', borderRadius: 12, minWidth: 52,
                border: '1.5px solid ' + (active ? 'var(--mw-indigo)' : logged ? 'var(--mw-success)' : staged ? 'var(--mw-warning, #F59E0B)' : needsLog ? 'var(--mw-danger)' : 'var(--mw-line)'),
                background: active ? 'var(--mw-indigo)' : logged ? 'rgba(46,158,106,0.08)' : staged ? 'rgba(245,158,11,0.08)' : 'var(--mw-card)',
                color: active ? '#fff' : logged ? 'var(--mw-success)' : staged ? '#B45309' : needsLog ? 'var(--mw-danger)' : 'var(--mw-ink-2)',
                cursor: 'pointer', transition: 'all .15s ease', position: 'relative',
                animation: needsLog && !active ? 'mw-slot-pulse 2s ease-in-out infinite' : 'none',
              }}>
                <span style={{ fontSize: 9, fontWeight: 700, opacity: active ? 0.8 : 0.5, textTransform: 'uppercase', letterSpacing: 0.3 }}>Day {s.day}</span>
                <span style={{ fontSize: 14, fontWeight: 800, marginTop: 2 }}>{s.label.d}</span>
                <span style={{ fontSize: 10, fontWeight: 600, opacity: active ? 0.85 : 0.6 }}>{s.label.m}</span>
                {staged && (
                  <span style={{ position: 'absolute', top: -3, right: -3, minWidth: 16, height: 16, borderRadius: 8, background: '#F59E0B', border: '1.5px solid var(--mw-card)', fontSize: 9, fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px' }}>
                    {(stagedByDate[s.iso] || []).length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tabs */}
      <div className="mw-tabs">
        <button className={`mw-tab${tab === 'expense' ? ' active' : ''}`} onClick={() => setTab('expense')}>Expense</button>
        <button className={`mw-tab${tab === 'earn' ? ' active' : ''}`} onClick={() => setTab('earn')}>Earn</button>
      </div>

      <div className="mw-card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {tab === 'expense' ? (
          <>
            <div className="mw-field">
              <label className="mw-field-label">Amount spent</label>
              <div className="mw-input-shell">
                <span className="prefix" style={{ color: 'var(--mw-danger)' }}>−RM</span>
                <input type="number" inputMode="decimal" placeholder="0"
                  value={expense} onChange={(e) => setExpense(e.target.value)} />
              </div>
            </div>
            <div className="mw-field">
              <label className="mw-field-label">Category</label>
              <div className="mw-input-shell compact" style={{ padding: 8 }}>
                <div style={{ display: 'flex', gap: 8, overflowX: 'auto', width: '100%' }}>
                  {state.categories.map((c) => {
                    const m = CAT_META[c];
                    const active = category === c;
                    return (
                      <button key={c} type="button" onClick={() => setCategory(c)} style={{
                        flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 6,
                        padding: '8px 12px', borderRadius: 10,
                        border: '1.5px solid ' + (active ? m.color : 'var(--mw-line)'),
                        background: active ? m.color : 'var(--mw-card)',
                        color: active ? '#fff' : 'var(--mw-ink-2)',
                        fontSize: 13, fontWeight: 700, textTransform: 'capitalize', cursor: 'pointer',
                        transition: 'all .15s ease',
                      }}>
                        <m.Ico width="14" height="14" />
                        {c}
                      </button>
                    );
                  })}
                  <button type="button" onClick={() => setCategory('custom')} style={{
                    flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 12px', borderRadius: 10,
                    border: '1.5px solid ' + (category === 'custom' ? 'var(--mw-indigo)' : 'var(--mw-line)'),
                    background: category === 'custom' ? 'var(--mw-indigo)' : 'var(--mw-card)',
                    color: category === 'custom' ? '#fff' : 'var(--mw-ink-2)',
                    fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all .15s ease',
                  }}>
                    + Other
                  </button>
                </div>
              </div>
              {category === 'custom' && (
                <div className="mw-input-shell" style={{ marginTop: 8 }}>
                  <input type="text" placeholder="e.g. petrol, wedding gift…"
                    value={customCat} onChange={(e) => setCustomCat(e.target.value)}
                    style={{ textTransform: 'lowercase' }} autoFocus />
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="mw-field">
            <label className="mw-field-label">Amount earned</label>
            <div className="mw-input-shell">
              <span className="prefix" style={{ color: 'var(--mw-success)' }}>+RM</span>
              <input type="number" inputMode="decimal" placeholder="0"
                value={earn} onChange={(e) => setEarn(e.target.value)} />
            </div>
          </div>
        )}
        <div className="mw-field">
          <label className="mw-field-label">Note <span style={{ fontWeight: 400, color: 'var(--mw-ink-3)' }}>(optional)</span></label>
          <div className="mw-input-shell">
            <input type="text" placeholder="e.g. lunch with team, Grab to KLCC…"
              value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>
        <button className="mw-btn mw-btn-primary mw-btn-block" onClick={addToList}>
          <Icon.Plus width="14" height="14" /> Add to list
        </button>
      </div>

      {/* Staged list for selected day */}
      {currentStaged.length > 0 && (
        <div className="mw-card" style={{ padding: 16, marginTop: 0, border: '1.5px solid var(--mw-indigo-soft)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--mw-ink-1)' }}>
                {currentSlot ? `Day ${currentSlot.day}` : 'Today'}'s list
              </div>
              <div style={{ fontSize: 11, color: 'var(--mw-ink-3)', marginTop: 1 }}>Review before confirming</div>
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--mw-indigo)' }}>
              {currentStaged.length} item{currentStaged.length !== 1 ? 's' : ''}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 12 }}>
            {currentStaged.map((item) => {
              const m = resolveCatMeta(item.category);
              return (
                <div key={item._id} className="mw-log-row" style={{ background: 'var(--mw-bg)' }}>
                  <div className="ico-wrap" style={{ background: m.color }}>
                    <m.Ico width="16" height="16" />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div className="mw-log-cat">{item.category}</div>
                    {item.note && <div className="mw-log-note">{item.note}</div>}
                  </div>
                  <div className="mw-log-amts">
                    {item.expense > 0 && <div className="exp">−RM{formatNum(item.expense)}</div>}
                    {item.earn > 0 && <div className="ern">+RM{formatNum(item.earn)}</div>}
                  </div>
                  <button className="mw-log-del" onClick={() => removeStagedItem(item._id)} title="Remove">×</button>
                </div>
              );
            })}
          </div>
          <button className="mw-btn mw-btn-primary mw-btn-block" onClick={submitDay}>
            Confirm &amp; lock {currentSlot ? `Day ${currentSlot.day}` : 'day'}
          </button>
        </div>
      )}

      {/* Totals */}
      <div className="mw-stat-row">
        <div className="mw-stat">
          <div className="l">Total expense</div>
          <div className="v exp">−RM{formatNum(totalExp)}</div>
        </div>
        <div className="mw-stat">
          <div className="l">Total earn</div>
          <div className="v ern">+RM{formatNum(totalErn)}</div>
        </div>
      </div>

      {/* Saved log list */}
      <div className="mw-section-h">
        <span className="title">Confirmed logs</span>
        <span className="sub">{periodLogs.length} entries</span>
      </div>

      {periodLogs.length === 0 ? (
        <div className="mw-card mw-empty">
          <div className="emoji">📝</div>
          No confirmed logs yet. Build your list above and confirm.
        </div>
      ) : (() => {
        const groups = [];
        let lastDate = null;
        periodLogs.forEach((l) => {
          if (l.date !== lastDate) {
            const slot = slots.find(s => s.iso === l.date);
            const sd = formatShortDate(l.date);
            const label = slot ? `Day ${slot.day} · ${sd.d} ${sd.m}` : `${sd.d} ${sd.m}`;
            groups.push({ date: l.date, label, entries: [] });
            lastDate = l.date;
          }
          groups[groups.length - 1].entries.push(l);
        });
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {groups.map((g) => (
              <div key={g.date}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--mw-ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{g.label}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {g.entries.map((l) => {
                    const m = resolveCatMeta(l.category);
                    return (
                      <div key={l.id} className="mw-log-row">
                        <div className="ico-wrap" style={{ background: m.color }}>
                          <m.Ico width="16" height="16" />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div className="mw-log-cat">{l.category}</div>
                          {l.note && <div className="mw-log-note">{l.note}</div>}
                        </div>
                        <div className="mw-log-amts">
                          {l.expense > 0 && <div className="exp">−RM{formatNum(l.expense)}</div>}
                          {l.earn > 0 && <div className="ern">+RM{formatNum(l.earn)}</div>}
                        </div>
                        <button className="mw-log-del" onClick={() => removeLog(l.id)} title="Delete">×</button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        );
      })()}
    </div>
  );
}

Object.assign(window, {
  SetupScreen, CategoriesScreen, MostSpentScreen, AILoadScreen,
  BudgetScreen, CalendarScreen, RescueScreen, DailyLogScreen,
  computeBudget, ALL_CATS, CAT_WEIGHTS,
});

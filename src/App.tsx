import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import type { Session, User } from '@supabase/supabase-js'
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Bike,
  CalendarDays,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  LayoutDashboard,
  Menu,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  UsersRound,
  X,
} from 'lucide-react'
import LetterSwapText from './components/letter-swap-text'
import { isSupabaseConfigured, supabase } from './lib/supabase'

type SaleCategory = '实体车' | '头盔' | '配件' | '改装' | '其他'
type Sale = { id: number; category: SaleCategory; name: string; amount: number; time: string }
type Need = { id: number; reason: string; future: string; time: string }

const initialSales: Sale[] = [
  { id: 1, category: '实体车', name: '450MT', amount: 26800, time: '15:42' },
  { id: 2, category: '头盔', name: '全盔 · 哑光黑', amount: 1280, time: '14:18' },
  { id: 3, category: '改装', name: '护杠安装', amount: 520, time: '11:06' },
]

const initialNeeds: Need[] = [
  { id: 1, reason: '周末想和朋友跑山，想换一台更轻便的车。', future: '护杠、尾箱，之后可能会做轻度改装。', time: '15:20' },
  { id: 2, reason: '第一次买车，主要是上下班通勤。', future: '通勤头盔、防水手套。', time: '13:45' },
]

const links = [
  { to: '/', label: '经营总览', icon: LayoutDashboard, end: true },
  { to: '/daily', label: '每日记录', icon: CalendarDays },
  { to: '/customers', label: '顾客需求', icon: UsersRound },
]

function dateLabels() {
  const now = new Date()
  const opts = { timeZone: 'Asia/Shanghai' }
  const parts = new Intl.DateTimeFormat('zh-CN', { ...opts, weekday: 'short', month: '2-digit', day: '2-digit', year: 'numeric' }).formatToParts(now)
  const val = (key: string) => parts.find((item) => item.type === key)?.value ?? ''
  return {
    eyebrow: new Intl.DateTimeFormat('en-US', { ...opts, weekday: 'long', month: 'long', day: '2-digit' }).format(now).toUpperCase(),
    short: `${val('month')}.${val('day')} · ${val('weekday')}`,
    full: `${val('year')}年${val('month')}月${val('day')}日`,
  }
}

function todayRecordDate() {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date())
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? ''
  return `${part('year')}-${part('month')}-${part('day')}`
}

function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const dates = dateLabels()
  const [sales, setSales] = useState(initialSales)
  const [needs, setNeeds] = useState(initialNeeds)
  const [note, setNote] = useState('一位新骑士为了周末跑山来店里看车。聊到后续用车，他提了护杠、尾箱和轻度改装——这周已经是第三次听到类似需求。')
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(isSupabaseConfigured)
  const [journalLoading, setJournalLoading] = useState(false)
  const [journalSaving, setJournalSaving] = useState(false)
  const [journalLoaded, setJournalLoaded] = useState(false)
  const [journalError, setJournalError] = useState('')
  const [modal, setModal] = useState<'sale' | 'need' | null>(null)
  const [toast, setToast] = useState('')
  const revenue = useMemo(() => sales.reduce((sum, item) => sum + item.amount, 0), [sales])
  const title = location.pathname === '/daily' ? '每日记录' : location.pathname === '/customers' ? '顾客需求' : '经营总览'
  const recordDate = todayRecordDate()

  useEffect(() => {
    if (!supabase) return
    let active = true
    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return
      if (error) setJournalError('无法确认登录状态，请刷新后重试。')
      setUser(data.session?.user ?? null)
      setAuthLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session: Session | null) => {
      setUser(session?.user ?? null)
      setAuthLoading(false)
      setJournalError('')
    })
    return () => { active = false; subscription.unsubscribe() }
  }, [])

  useEffect(() => {
    if (!supabase || !user) {
      setJournalLoaded(false)
      if (isSupabaseConfigured) setNote('')
      return
    }
    let active = true
    setJournalLoading(true)
    setJournalLoaded(false)
    setJournalError('')
    void (async () => {
      try {
        const { data, error } = await supabase.from('daily_records').select('note').eq('record_date', recordDate).maybeSingle()
        if (!active) return
        if (error) setJournalError('读取今日记录失败。请确认数据库迁移已运行，然后重试。')
        else {
          setNote(data?.note ?? '')
          setJournalLoaded(true)
        }
      } catch {
        if (active) setJournalError('网络连接失败，检查网络后刷新页面重试。')
      } finally {
        if (active) setJournalLoading(false)
      }
    })()
    return () => { active = false }
  }, [user, recordDate])

  function notify(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(''), 2600)
  }

  async function saveJournal() {
    if (!supabase || !user) {
      notify('请先登录，才能保存到云端。')
      return false
    }
    setJournalSaving(true)
    setJournalError('')
    try {
      const { error } = await supabase.from('daily_records').upsert(
        { user_id: user.id, record_date: recordDate, note },
        { onConflict: 'user_id,record_date' },
      )
      if (error) {
        setJournalError('保存失败。请检查数据库迁移和网络连接后重试。')
        return false
      }
      setJournalLoaded(true)
      notify('今日记录已保存到云端。')
      return true
    } catch {
      setJournalError('保存失败。请检查数据库迁移和网络连接后重试。')
      return false
    } finally {
      setJournalSaving(false)
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <NavLink to="/" className="brand-lockup" aria-label="栖点经营总览">
          <div className="brand-seal"><span className="seal-top">MOTO</span><Bike size={20} strokeWidth={1.8} /><span className="seal-bottom">STORE</span></div>
          <div className="brand-copy"><strong>栖点</strong><span>门店经营情报</span></div>
        </NavLink>

        <div className="store-switcher"><div className="store-avatar"><Bike size={16} /></div><div className="store-copy"><strong>我的门店</strong><span>个人工作台</span></div><ChevronDown size={15} /></div>
        <div className="nav-label">经营空间 <span>01</span></div>
        <nav className="main-nav" aria-label="主导航">
          {links.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}><Icon size={17} strokeWidth={1.8} /><span>{label}</span>{to === '/daily' && <span className="nav-count">今日</span>}</NavLink>)}
        </nav>

        <div className="sidebar-note"><div className="note-stamp"><Sparkles size={15} /></div><span className="section-kicker">GROWTH SIGNAL</span><strong>机会来自重复</strong><p>留下真实需求，让趋势自己说话。</p><div className="note-progress"><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /></div><div className="note-foot"><span>改装需求</span><b>16 / 20</b></div></div>
        <div className="sidebar-bottom"><button className="side-action" type="button" onClick={() => notify('帮助中心将在后续版本开放。')}><CircleHelp size={16} />使用说明</button><button className="profile-button" type="button" onClick={async () => { if (!supabase) { navigate('/daily'); return } if (user) { await supabase.auth.signOut(); notify('已退出登录。') } else navigate('/daily') }}><div className="profile-avatar">{user?.email?.slice(0, 1).toUpperCase() ?? '林'}</div><div className="profile-copy"><strong>{user?.email ?? '门店主理人'}</strong><span>{user ? '已登录云端账户 · 点击退出' : '登录以保存云端记录'}</span></div><Settings2 size={16} /></button></div>
      </aside>

      <main className="main-area">
        <header className="topbar"><div className="breadcrumbs"><button className="mobile-menu" aria-label="打开菜单" type="button"><Menu size={18} /></button><span>栖点</span><span className="crumb-slash">/</span><strong>{title}</strong></div><div className="topbar-actions"><div className="demo-badge"><span />{user ? '云端已连接' : isSupabaseConfigured ? '登录后连接' : '演示数据'}</div><div className="today-chip"><CalendarDays size={14} /><span>{dates.short}</span></div><button className="icon-button" aria-label="搜索" type="button" onClick={() => notify('搜索功能将在后续版本开放。')}><Search size={17} /></button><div className="topbar-divider" /><button className="quick-add" type="button" onClick={() => navigate('/daily')}><Plus size={15} /><span>记一笔</span></button></div></header>

        <div className="page-content">
          <Routes>
            <Route path="/" element={<Dashboard dates={dates} sales={sales} needs={needs} note={isSupabaseConfigured && !user ? '' : note} revenue={revenue} setNote={setNote} openModal={setModal} notify={notify} onSaveNote={saveJournal} user={user} saving={journalSaving} configured={isSupabaseConfigured} />} />
            <Route path="/daily" element={<DailyPage dates={dates} sales={sales} note={note} revenue={revenue} setNote={setNote} openSale={() => setModal('sale')} user={user} configured={isSupabaseConfigured} authLoading={authLoading} journalLoading={journalLoading} journalSaving={journalSaving} journalLoaded={journalLoaded} journalError={journalError} onSaveNote={saveJournal} />} />
            <Route path="/customers" element={<CustomersPage needs={needs} openNeed={() => setModal('need')} />} />
          </Routes>
          <footer className="page-footer"><span>栖点 · 门店经营情报</span><span>记录今天，发现下一次机会。</span></footer>
        </div>
      </main>

      {modal && <EntryModal type={modal} close={() => setModal(null)} onSave={(entry) => {
        if ('category' in entry) setSales((current) => [{ ...entry, id: Date.now(), time: '刚刚' }, ...current])
        else setNeeds((current) => [{ ...entry, id: Date.now(), time: '刚刚' }, ...current])
        setModal(null)
        notify('已加入本次演示记录（刷新后会重置）')
      }} />}
      {toast && <div className="toast"><Check size={15} />{toast}</div>}
    </div>
  )
}

function MotorcycleBlueprint() {
  return <svg className="motorcycle-art" viewBox="0 0 620 290" role="img" aria-label="几何蓝图风格的摩托车线稿">
    <defs><pattern id="blueprintGrid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="currentColor" strokeWidth=".55" opacity=".24" /></pattern></defs>
    <rect x="2" y="2" width="616" height="286" rx="16" fill="url(#blueprintGrid)" opacity=".4" />
    <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="166" cy="204" r="53" strokeWidth="2.2" /><circle cx="166" cy="204" r="7" strokeWidth="1.5" /><path d="M166 151v106M113 204h106M129 167l74 74m0-74-74 74" strokeWidth=".9" opacity=".65" />
      <circle cx="454" cy="204" r="53" strokeWidth="2.2" /><circle cx="454" cy="204" r="7" strokeWidth="1.5" /><path d="M454 151v106M401 204h106M417 167l74 74m0-74-74 74" strokeWidth=".9" opacity=".65" />
      <path d="M166 204l55-75 65 6 46 69H219l-33-43m45-32 36 75 64-69 65 3 58 66m-79-70 15-35 42-5 30 39m-196-3-24-24h-25m191 21 34-27 47 3 26 27m-80-26 3-19 23-8 23 9 2 18m-244 60 53 7 50-16m140 10 47-5m-208-88 43-5 29 11 19 27m-91-32-6-10 15-9 17 2" strokeWidth="2.4" />
      <path d="M267 136l27-1 14 22-33 2m-74-27-11-28m219 40 31-1m-126 62h89m-90 0-13 12m105-12 12 12" strokeWidth="1.1" opacity=".7" />
    </g>
    <g fill="currentColor" opacity=".68"><circle cx="166" cy="204" r="2.3" /><circle cx="454" cy="204" r="2.3" /></g>
    <g className="blueprint-label" fill="currentColor" fontFamily="monospace" fontSize="8" letterSpacing="1.2"><text x="36" y="34">MOTO / LINE STUDY 01</text><text x="487" y="270">SIDE VIEW — 01</text></g>
    <path d="M420 47h54M447 36v22M93 251h38" stroke="#8d2332" strokeWidth="2" opacity=".8" />
  </svg>
}

function Dashboard({ dates, sales, needs, note, revenue, setNote, openModal, notify, onSaveNote, user, saving, configured }: {
  dates: ReturnType<typeof dateLabels>; sales: Sale[]; needs: Need[]; note: string; revenue: number; setNote: (value: string) => void; openModal: (type: 'sale' | 'need') => void; notify: (message: string) => void; onSaveNote: () => Promise<boolean>; user: User | null; saving: boolean; configured: boolean
}) {
  const [saved, setSaved] = useState(false)
  return <>
    <section className="hero-panel">
      <div className="hero-copy"><div className="hero-eyebrow"><span className="eyebrow-rule" />MOTO BUSINESS INTELLIGENCE <span className="hero-date">{dates.eyebrow}</span></div><h1 className="hero-title"><LetterSwapText>把今天，记下来。</LetterSwapText><br /><em><LetterSwapText>把需求，变成机会。</LetterSwapText></em></h1><p>真实的经营记录，会告诉你下一步该往哪里走。</p><div className="hero-meta"><span><span className="status-dot" />今日营业中</span><i /><span>个人经营观察工具</span></div></div>
      <div className="hero-art-wrap"><div className="art-accent" /><MotorcycleBlueprint /><div className="art-caption"><span>FIELD NOTES</span><b>RIDING INTO WHAT'S NEXT</b></div></div>
      <div className="hero-seal" aria-hidden="true"><span>RIDE</span><Bike size={19} /><span>RECORD</span></div>
    </section>

    <div className="section-heading"><div><span className="section-kicker">AT A GLANCE</span><h2>今天的经营切面</h2></div><span className="as-of">更新于 {dates.full}</span></div>
    <section className="stats-grid" aria-label="今日经营数据">
      <article className="stat-card stat-revenue"><div className="stat-top"><span>今日营业额</span><span className="stat-icon"><ShoppingBag size={16} /></span></div><div className="stat-value"><small>¥</small>{revenue.toLocaleString('zh-CN')}<i>.00</i></div><div className="stat-bottom"><span className="stat-trend"><ArrowUpRight size={13} />销售事项合计</span><span className="stat-caption">TODAY'S REVENUE</span></div></article>
      <article className="stat-card"><div className="stat-top"><span>销售事项</span><span className="stat-icon navy"><Bike size={16} /></span></div><div className="stat-value">{sales.length}<i className="unit">笔</i></div><div className="stat-bottom"><span className="stat-caption">实体车与其他销售</span><span className="stat-caption">SALES</span></div></article>
      <article className="stat-card"><div className="stat-top"><span>顾客需求</span><span className="stat-icon pink"><UsersRound size={16} /></span></div><div className="stat-value">{needs.length + 2}<i className="unit">位</i></div><div className="stat-bottom"><span className="stat-caption">今天留下的真实声音</span><span className="stat-caption">CUSTOMER VOICE</span></div></article>
    </section>

    <section className="dashboard-grid">
      <article className="panel daily-panel"><div className="panel-head"><div><span className="section-kicker">TODAY'S JOURNAL</span><h2>今天发生了什么</h2></div><span className="panel-date"><Clock3 size={13} />今天 · 营业记录</span></div><textarea className="journal-input" value={note} onChange={(event) => { setNote(event.target.value); setSaved(false) }} aria-label="今天发生了什么" placeholder={user ? '写下今天值得留下的事…' : '登录后开始记录今日门店情况'} /><div className="panel-foot"><span className="privacy-note"><ShieldCheck size={14} />{user ? '仅自己可见 · 保存到 Supabase' : configured ? '登录后安全保存到云端' : '仅为本地演示内容'}</span><button className="primary-button" type="button" disabled={saving} onClick={async () => { if (user) { const ok = await onSaveNote(); if (ok) setSaved(true) } else if (configured) notify('请先进入每日记录并登录。'); else { setSaved(true); notify('演示记录已暂存，刷新页面会恢复示例内容。') } }}>{saving ? '保存中…' : saved ? <><Check size={14} />已保存</> : <>保存今天 <ArrowRight size={14} /></>}</button></div></article>

      <article className="panel signals-panel"><div className="panel-head"><div><span className="section-kicker">DEMAND SIGNALS · OCT</span><h2>重复出现的需求</h2></div><button className="period-button" type="button" onClick={() => notify('当前展示 10 月演示数据。')}>本月 <ChevronDown size={13} /></button></div><div className="signals-intro"><div className="signal-stamp"><Sparkles size={17} /></div><p>一个月出现 <strong>20 次</strong><br />它就值得被认真看见。</p></div><div className="signal-rows"><SignalRow label="改装" count={16} color="wine" /><SignalRow label="配件" count={11} color="navy" /><SignalRow label="头盔" count={7} color="slate" /></div><div className="signals-foot"><span>本月最接近的机会</span><strong>改装 · 还差 4 次</strong><ArrowDownRight size={15} /></div></article>
    </section>

    <section className="bottom-grid"><article className="panel transactions-panel"><div className="panel-head"><div><span className="section-kicker">SALES ACTIVITY</span><h2>今日销售事项</h2></div><button className="inline-link" type="button" onClick={() => openModal('sale')}><Plus size={14} />添加事项</button></div><div className="sale-list">{sales.slice(0, 4).map((sale) => <div className="sale-row" key={sale.id}><span className={`sale-category ${sale.category === '实体车' ? 'bike' : ''}`}>{sale.category === '实体车' ? <Bike size={15} /> : sale.category.slice(0, 1)}</span><div className="sale-name"><strong>{sale.name}</strong><span>{sale.category} <i>·</i> {sale.time}</span></div><strong className="sale-amount">{sale.amount < 0 ? '−' : '+'}¥{Math.abs(sale.amount).toLocaleString('zh-CN')}</strong></div>)}</div><div className="list-total"><span>今日合计</span><strong>¥ {revenue.toLocaleString('zh-CN')}.00</strong></div></article>
      <article className="panel customer-panel"><div className="panel-head"><div><span className="section-kicker">CUSTOMER NOTES</span><h2>顾客的下一步</h2></div><button className="inline-link" type="button" onClick={() => openModal('need')}><Plus size={14} />记录需求</button></div><div className="need-list">{needs.slice(0, 2).map((need) => <div className="need-item" key={need.id}><span className="need-mark"><UsersRound size={14} /></span><div><p>{need.reason}</p><div className="need-next"><span>未来可能</span>{need.future}</div></div><span className="need-time">{need.time}</span></div>)}</div><button className="see-all" type="button" onClick={() => window.location.assign('/customers')}>查看全部顾客需求 <ArrowRight size={13} /></button></article></section>
    <div className="demo-footnote"><span className="demo-footnote-mark">i</span>当前展示为演示数据，可通过「添加事项」「记录需求」体验操作；数据暂存在页面内存中，刷新后恢复示例内容。</div>
  </>
}

function SignalRow({ label, count, color }: { label: string; count: number; color: string }) {
  return <div className="signal-row"><span className={`signal-label ${color}`}>{label}</span><div className="signal-track"><span className={color} style={{ width: `${Math.min(count / 20 * 100, 100)}%` }} /></div><strong>{count}<small> / 20</small></strong></div>
}

function DailyPage({ dates, sales, note, revenue, setNote, openSale, user, configured, authLoading, journalLoading, journalSaving, journalLoaded, journalError, onSaveNote }: {
  dates: ReturnType<typeof dateLabels>; sales: Sale[]; note: string; revenue: number; setNote: (value: string) => void; openSale: () => void;
  user: User | null; configured: boolean; authLoading: boolean; journalLoading: boolean; journalSaving: boolean; journalLoaded: boolean; journalError: string; onSaveNote: () => Promise<boolean>
}) {
  const journalAccess = !configured
    ? <div className="connection-notice"><strong>连接配置还差一步</strong><p>在项目根目录的 <code>.env.local</code> 中填入 Supabase 公开 anon / publishable key，再重启本地服务。</p></div>
    : authLoading
      ? <div className="connection-notice">正在确认登录状态…</div>
      : !user
        ? <MagicLinkCard />
        : journalLoading
          ? <div className="connection-notice">正在读取今天的云端记录…</div>
          : <textarea className="journal-input expanded" value={note} onChange={(event) => setNote(event.target.value)} aria-label="今天发生了什么" placeholder="写下今天值得留下的事…" />

  return <><div className="subpage-heading"><div><span className="section-kicker">DAILY JOURNAL</span><h1>每日记录<span className="heading-period">{dates.full}</span></h1><p>把今天值得留下的事和经营数字，放在一起看。</p></div><div className="demo-badge"><span />{user ? '云端记录' : '演示数据'}</div></div><div className="daily-page-grid"><article className="panel daily-page-note"><div className="panel-head"><div><span className="section-kicker">STORE NOTE</span><h2>今天发生了什么</h2></div><span className="panel-date">{journalLoaded ? '已从云端读取' : '今天'}</span></div>{journalAccess}{journalError && <p className="journal-error" role="alert">{journalError}</p>}{user && <button className="primary-button" type="button" disabled={journalLoading || journalSaving} onClick={onSaveNote}>{journalSaving ? '保存中…' : <>保存今天 <ArrowRight size={14} /></>}</button>}</article><article className="panel daily-page-sales"><div className="panel-head"><div><span className="section-kicker">SALES ACTIVITY</span><h2>产生销售额的事项</h2></div><button className="inline-link" type="button" onClick={openSale}><Plus size={14} />添加事项</button></div><div className="sale-list">{sales.map((sale) => <div className="sale-row" key={sale.id}><span className={`sale-category ${sale.category === '实体车' ? 'bike' : ''}`}>{sale.category === '实体车' ? <Bike size={15} /> : sale.category.slice(0, 1)}</span><div className="sale-name"><strong>{sale.name}</strong><span>{sale.category} <i>·</i> {sale.time}</span></div><strong className="sale-amount">{sale.amount < 0 ? '−' : '+'}¥{Math.abs(sale.amount).toLocaleString('zh-CN')}</strong></div>)}</div><div className="list-total"><span>每日营业额</span><strong>¥ {revenue.toLocaleString('zh-CN')}.00</strong></div></article></div><div className="demo-footnote"><span className="demo-footnote-mark">i</span>{user ? '今日门店记录保存在 Supabase；销售事项仍为示例数据。' : '登录配置完成后，今日门店记录会保存在 Supabase。销售事项接入在后续步骤。'}</div></>
}

function MagicLinkCard() {
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase) return
    setSending(true)
    setError('')
    const { error: signInError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
    setSending(false)
    if (signInError) setError('登录邮件发送失败，请检查邮箱或 Supabase 邮件设置后重试。')
    else setSent(true)
  }

  return <form className="magic-link-card" onSubmit={submit}>
    <div className="auth-lock"><ShieldCheck size={17} /></div>
    <strong>{sent ? '请查看你的邮箱' : '登录后安全保存到云端'}</strong>
    <p>{sent ? `登录链接已发送至 ${email}，点击邮件中的链接返回工作台。` : '输入自己的邮箱，我们会发送一次性登录链接，不需要设置密码。'}</p>
    {!sent && <><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="你的邮箱地址" autoComplete="email" required /><button className="primary-button" type="submit" disabled={sending}>{sending ? '发送中…' : '发送登录链接'} <ArrowRight size={14} /></button></>}
    {error && <span className="journal-error" role="alert">{error}</span>}
  </form>
}

function CustomersPage({ needs, openNeed }: { needs: Need[]; openNeed: () => void }) {
  return <><div className="subpage-heading"><div><span className="section-kicker">CUSTOMER VOICE</span><h1>顾客需求<span className="heading-period">需求是新的起点</span></h1><p>只记下顾客为什么买车，以及他们未来可能需要什么。</p></div><button className="primary-button" type="button" onClick={openNeed}><Plus size={14} />记录一位顾客</button></div><div className="customer-summary"><div><span>本月需求记录</span><strong>{needs.length + 18}<small> 位</small></strong></div><div><span>最常出现的后续需求</span><strong>轻度改装</strong></div><div><span>记录方式</span><strong>自由文字</strong></div></div><section className="customer-records"><div className="panel-head"><div><span className="section-kicker">RECENT NOTES</span><h2>最近记录</h2></div><span className="demo-badge"><span />示例</span></div>{needs.map((need) => <article className="customer-record" key={need.id}><div className="record-avatar"><UsersRound size={16} /></div><div className="record-body"><div className="record-top"><strong>到店顾客</strong><span>今日 · {need.time}</span></div><div className="record-columns"><div><span>购车原因</span><p>{need.reason}</p></div><div><span>未来可能的需求</span><p>{need.future}</p></div></div></div></article>)}</section><div className="demo-footnote"><span className="demo-footnote-mark">i</span>演示内容为虚构示例，真实记录可在后续步骤接入数据库后持续保存。</div></>
}

function EntryModal({ type, close, onSave }: { type: 'sale' | 'need'; close: () => void; onSave: (entry: Omit<Sale, 'id' | 'time'> | Omit<Need, 'id' | 'time'>) => void }) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    if (type === 'sale') {
      onSave({ category: form.get('category') as SaleCategory, name: String(form.get('name') || form.get('category')), amount: Number(form.get('amount') || 0) })
    } else {
      onSave({ reason: String(form.get('reason') || ''), future: String(form.get('future') || '') })
    }
  }
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) close() }}><form className="entry-modal" onSubmit={submit}><div className="modal-head"><div><span className="section-kicker">QUICK ENTRY</span><h2>{type === 'sale' ? '添加销售事项' : '记录顾客需求'}</h2></div><button className="icon-button" type="button" aria-label="关闭" onClick={close}><X size={18} /></button></div>{type === 'sale' ? <><label>销售类别<select name="category"><option>实体车</option><option>头盔</option><option>配件</option><option>改装</option><option>其他</option></select></label><label>事项名称 / 车型型号<input name="name" placeholder="例如：450MT / 护杠安装" /></label><label>金额（退款请填负数）<input name="amount" type="number" step="0.01" placeholder="0.00" required /></label></> : <><label>购车原因<textarea name="reason" placeholder="顾客为什么想买车？" /></label><label>未来可能的需求<textarea name="future" placeholder="配件、头盔、改装或其他想法" /></label></>}<div className="modal-foot"><span>仅为本地演示，刷新后会重置</span><button className="primary-button" type="submit">添加到演示 <ArrowRight size={14} /></button></div></form></div>
}

export default App

import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import type { Session, User } from '@supabase/supabase-js'
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
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
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  UsersRound,
  X,
} from 'lucide-react'
import LetterSwapText from './components/letter-swap-text'
import CustomerResearchForm from './components/customer-research-form'
import CustomerResearchStats from './components/customer-research-stats'
import type { CustomerResearchDraft, CustomerResearchRecord } from './lib/customer-research'
import { labelFor } from './lib/customer-research'
import { loadCustomerResearch, saveCustomerResearch } from './lib/customer-research-data'
import { isSupabaseConfigured, logSupabaseError, supabase } from './lib/supabase'

type SaleCategory = '实体车' | '头盔' | '配件' | '改装' | '其他'
type Sale = { id: number; category: SaleCategory; name: string; amount: number; time: string }
type Need = CustomerResearchRecord

const initialSales: Sale[] = [
  { id: 1, category: '实体车', name: '450MT', amount: 26800, time: '15:42' },
  { id: 2, category: '头盔', name: '全盔 · 哑光黑', amount: 1280, time: '14:18' },
  { id: 3, category: '改装', name: '护杠安装', amount: 520, time: '11:06' },
]

const initialNeeds: Need[] = [
  { ...emptyNeed('demo-1'), purchase_reason: '周末想和朋友跑山，想换一台更轻便的车。', future_needs: '护杠、尾箱，之后可能会做轻度改装。', time: '15:20' },
  { ...emptyNeed('demo-2'), purchase_reason: '第一次买车，主要是上下班通勤。', future_needs: '通勤头盔、防水手套。', time: '13:45' },
]

const links = [
  { to: '/', label: '经营总览', icon: LayoutDashboard, end: true },
  { to: '/daily', label: '每日记录', icon: CalendarDays },
  { to: '/customers', label: '顾客需求', icon: UsersRound },
  { to: '/research', label: '人群调研', icon: BarChart3 },
]

function emptyNeed(id: string): Need {
  return {
    id,
    recorded_on: todayRecordDate(),
    purchase_reason: '',
    future_needs: '',
    gender: null,
    age_group: null,
    hometown_province: null,
    residence_area: null,
    discovery_source: null,
    payer_role: null,
    decision_role: null,
    core_needs: [],
    core_need_note: null,
  }
}

function needTime(need: Need) {
  if (need.time) return need.time
  if (need.created_at) return new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', hour: '2-digit', minute: '2-digit' }).format(new Date(need.created_at))
  return need.recorded_on
}

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
  const [needs, setNeeds] = useState<Need[]>(isSupabaseConfigured ? [] : initialNeeds)
  const [note, setNote] = useState('一位新骑士为了周末跑山来店里看车。聊到后续用车，他提了护杠、尾箱和轻度改装——这周已经是第三次听到类似需求。')
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(isSupabaseConfigured)
  const [authError, setAuthError] = useState('')
  const [journalLoading, setJournalLoading] = useState(false)
  const [journalSaving, setJournalSaving] = useState(false)
  const [journalLoaded, setJournalLoaded] = useState(false)
  const [journalError, setJournalError] = useState('')
  const [customerLoading, setCustomerLoading] = useState(isSupabaseConfigured)
  const [customerError, setCustomerError] = useState('')
  const [modal, setModal] = useState<'sale' | 'need' | null>(null)
  const [toast, setToast] = useState('')
  const revenue = useMemo(() => sales.reduce((sum, item) => sum + item.amount, 0), [sales])
  const title = location.pathname === '/daily' ? '每日记录' : location.pathname === '/customers' ? '顾客需求' : location.pathname === '/research' ? '人群调研' : '经营总览'
  const recordDate = todayRecordDate()

  async function connectAnonymous() {
    if (!supabase) return
    setAuthLoading(true)
    setAuthError('')
    try {
      const { data, error } = await supabase.auth.getSession()
      if (error) throw error
      if (data.session) {
        setUser(data.session.user)
        return
      }
      const { data: anonymous, error: signInError } = await supabase.auth.signInAnonymously()
      if (signInError) throw signInError
      setUser(anonymous.user)
    } catch (error) {
      logSupabaseError('anonymous sign-in / session', error)
      setUser(null)
      setAuthError('匿名云端连接失败。请确认 Supabase 已开启匿名登录，并检查网络后重试。')
    } finally {
      setAuthLoading(false)
    }
  }

  useEffect(() => {
    if (!supabase) return
    let active = true
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session: Session | null) => {
      if (!active) return
      setUser(session?.user ?? null)
      setAuthLoading(false)
      if (session) setAuthError('')
    })
    void connectAnonymous()
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
        if (error) {
          logSupabaseError('daily_records select', error)
          setJournalError('读取今日记录失败。请确认数据库迁移已运行，然后重试。')
        }
        else {
          setNote(data?.note ?? '')
          setJournalLoaded(true)
        }
      } catch (error) {
        logSupabaseError('daily_records select', error)
        if (active) setJournalError('网络连接失败，检查网络后刷新页面重试。')
      } finally {
        if (active) setJournalLoading(false)
      }
    })()
    return () => { active = false }
  }, [user, recordDate])

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setNeeds(initialNeeds)
      setCustomerLoading(false)
      return
    }
    if (authLoading) return
    if (!supabase || !user) {
      setNeeds([])
      setCustomerLoading(false)
      setCustomerError(authError || '匿名云端未连接，暂时无法读取顾客调研记录。')
      return
    }
    let active = true
    setCustomerLoading(true)
    setCustomerError('')
    void loadCustomerResearch(user)
      .then((records) => {
        console.info('[Supabase] customer_needs read succeeded', { rowCount: records.length })
        if (active) setNeeds(records)
      })
      .catch((error) => {
        logSupabaseError('customer_needs select', error)
        if (active) setCustomerError('顾客调研读取失败。请确认数据库迁移已运行，然后重试。')
      })
      .finally(() => { if (active) setCustomerLoading(false) })
    return () => { active = false }
  }, [user, authLoading, authError])

  function notify(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(''), 2600)
  }

  async function saveJournal() {
    if (!supabase || !user) {
      notify('云端尚未连接，请检查每日记录页的连接状态。')
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
        logSupabaseError('daily_records upsert', error)
        setJournalError('保存失败。请检查数据库迁移和网络连接后重试。')
        return false
      }
      setJournalLoaded(true)
      notify('今日记录已保存到云端。')
      return true
    } catch (error) {
      logSupabaseError('daily_records upsert', error)
      setJournalError('保存失败。请检查数据库迁移和网络连接后重试。')
      return false
    } finally {
      setJournalSaving(false)
    }
  }

  async function saveNeed(draft: CustomerResearchDraft) {
    if (isSupabaseConfigured) {
      if (!supabase || !user) {
        setCustomerError('匿名云端尚未连接，调研记录还没有保存。')
        notify('云端尚未连接，记录未保存。')
        return false
      }
      try {
        const saved = await saveCustomerResearch(user, draft)
        setNeeds((current) => [saved, ...current])
        setCustomerError('')
        notify('顾客调研已保存到云端。')
        return true
      } catch (error) {
        logSupabaseError('customer_needs insert', error)
        setCustomerError('顾客调研保存失败。请检查新迁移是否已运行，然后重试。')
        notify('保存失败，表单内容仍保留。')
        return false
      }
    }
    setNeeds((current) => [{ ...draft, id: `demo-${Date.now()}` }, ...current])
    notify('演示记录已添加，刷新页面会重置。')
    return true
  }

  async function reloadCustomerResearch() {
    if (!supabase) return
    if (!user) {
      await connectAnonymous()
      return
    }
    setCustomerLoading(true)
    setCustomerError('')
    try {
      const records = await loadCustomerResearch(user)
      console.info('[Supabase] customer_needs read succeeded', { rowCount: records.length })
      setNeeds(records)
    } catch (error) {
      logSupabaseError('customer_needs select', error)
      setCustomerError('顾客调研读取失败。请确认数据库迁移已运行，然后重试。')
    } finally {
      setCustomerLoading(false)
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
        <div className="sidebar-bottom"><button className="side-action" type="button" onClick={() => notify('帮助中心将在后续版本开放。')}><CircleHelp size={16} />使用说明</button><div className="profile-button"><div className="profile-avatar">林</div><div className="profile-copy"><strong>门店主理人</strong><span>{user ? '匿名云端已连接' : isSupabaseConfigured ? '正在连接云端…' : '本地演示模式'}</span></div></div></div>
      </aside>

      <main className="main-area">
        <header className="topbar"><div className="breadcrumbs"><button className="mobile-menu" aria-label="打开菜单" type="button"><Menu size={18} /></button><span>栖点</span><span className="crumb-slash">/</span><strong>{title}</strong></div><div className="topbar-actions"><div className="demo-badge"><span />{user ? '云端匿名模式' : isSupabaseConfigured ? '正在连接云端' : '演示数据'}</div><div className="today-chip"><CalendarDays size={14} /><span>{dates.short}</span></div><button className="icon-button" aria-label="搜索" type="button" onClick={() => notify('搜索功能将在后续版本开放。')}><Search size={17} /></button><div className="topbar-divider" /><button className="quick-add" type="button" onClick={() => navigate('/daily')}><Plus size={15} /><span>记一笔</span></button></div></header>

        <div className="page-content">
          <Routes>
            <Route path="/" element={<Dashboard dates={dates} sales={sales} needs={needs} note={isSupabaseConfigured && !user ? '' : note} revenue={revenue} setNote={setNote} openModal={setModal} notify={notify} onSaveNote={saveJournal} user={user} saving={journalSaving} configured={isSupabaseConfigured} />} />
            <Route path="/daily" element={<DailyPage dates={dates} sales={sales} note={note} revenue={revenue} setNote={setNote} openSale={() => setModal('sale')} user={user} configured={isSupabaseConfigured} authLoading={authLoading} authError={authError} journalLoading={journalLoading} journalSaving={journalSaving} journalLoaded={journalLoaded} journalError={journalError} onRetry={connectAnonymous} onSaveNote={saveJournal} />} />
            <Route path="/customers" element={<CustomersPage needs={needs} openNeed={() => setModal('need')} loading={customerLoading} error={customerError} configured={isSupabaseConfigured} />} />
            <Route path="/research" element={<CustomerResearchStats records={needs} loading={customerLoading} error={customerError} configured={isSupabaseConfigured} onRetry={reloadCustomerResearch} />} />
          </Routes>
          <footer className="page-footer"><span>栖点 · 门店经营情报</span><span>记录今天，发现下一次机会。</span></footer>
        </div>
      </main>

      {modal === 'need' && <CustomerResearchForm close={() => setModal(null)} onSave={saveNeed} />}
      {modal === 'sale' && <EntryModal close={() => setModal(null)} onSave={(entry) => {
        setSales((current) => [{ ...entry, id: Date.now(), time: '刚刚' }, ...current])
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
      <article className="stat-card"><div className="stat-top"><span>顾客需求</span><span className="stat-icon pink"><UsersRound size={16} /></span></div><div className="stat-value">{needs.length}<i className="unit">条</i></div><div className="stat-bottom"><span className="stat-caption">已记录的接待需求</span><span className="stat-caption">CUSTOMER VOICE</span></div></article>
    </section>

    <section className="dashboard-grid">
      <article className="panel daily-panel"><div className="panel-head"><div><span className="section-kicker">TODAY'S JOURNAL</span><h2>今天发生了什么</h2></div><span className="panel-date"><Clock3 size={13} />今天 · 营业记录</span></div><textarea className="journal-input" value={note} onChange={(event) => { setNote(event.target.value); setSaved(false) }} aria-label="今天发生了什么" placeholder={user ? '写下今天值得留下的事…' : configured ? '正在连接安全的云端记录…' : '开始记录今日门店情况'} /><div className="panel-foot"><span className="privacy-note"><ShieldCheck size={14} />{user ? '仅自己可见 · 自动匿名云端保存' : configured ? '正在建立匿名云端会话' : '仅为本地演示内容'}</span><button className="primary-button" type="button" disabled={saving} onClick={async () => { if (user) { const ok = await onSaveNote(); if (ok) setSaved(true) } else if (configured) notify('云端尚未连接，请检查每日记录页的连接状态。'); else { setSaved(true); notify('演示记录已暂存，刷新页面会恢复示例内容。') } }}>{saving ? '保存中…' : saved ? <><Check size={14} />已保存</> : <>保存今天 <ArrowRight size={14} /></>}</button></div></article>

      <article className="panel signals-panel"><div className="panel-head"><div><span className="section-kicker">DEMAND SIGNALS · OCT</span><h2>重复出现的需求</h2></div><button className="period-button" type="button" onClick={() => notify('当前展示 10 月演示数据。')}>本月 <ChevronDown size={13} /></button></div><div className="signals-intro"><div className="signal-stamp"><Sparkles size={17} /></div><p>一个月出现 <strong>20 次</strong><br />它就值得被认真看见。</p></div><div className="signal-rows"><SignalRow label="改装" count={16} color="wine" /><SignalRow label="配件" count={11} color="navy" /><SignalRow label="头盔" count={7} color="slate" /></div><div className="signals-foot"><span>本月最接近的机会</span><strong>改装 · 还差 4 次</strong><ArrowDownRight size={15} /></div></article>
    </section>

    <section className="bottom-grid"><article className="panel transactions-panel"><div className="panel-head"><div><span className="section-kicker">SALES ACTIVITY</span><h2>今日销售事项</h2></div><button className="inline-link" type="button" onClick={() => openModal('sale')}><Plus size={14} />添加事项</button></div><div className="sale-list">{sales.slice(0, 4).map((sale) => <div className="sale-row" key={sale.id}><span className={`sale-category ${sale.category === '实体车' ? 'bike' : ''}`}>{sale.category === '实体车' ? <Bike size={15} /> : sale.category.slice(0, 1)}</span><div className="sale-name"><strong>{sale.name}</strong><span>{sale.category} <i>·</i> {sale.time}</span></div><strong className="sale-amount">{sale.amount < 0 ? '−' : '+'}¥{Math.abs(sale.amount).toLocaleString('zh-CN')}</strong></div>)}</div><div className="list-total"><span>今日合计</span><strong>¥ {revenue.toLocaleString('zh-CN')}.00</strong></div></article>
      <article className="panel customer-panel"><div className="panel-head"><div><span className="section-kicker">CUSTOMER NOTES</span><h2>顾客的下一步</h2></div><button className="inline-link" type="button" onClick={() => openModal('need')}><Plus size={14} />记录需求</button></div><div className="need-list">{needs.slice(0, 2).map((need) => <div className="need-item" key={need.id}><span className="need-mark"><UsersRound size={14} /></span><div><p>{need.purchase_reason || need.core_need_note || '已记录顾客调研'}</p><div className="need-next"><span>未来可能</span>{need.future_needs || (need.core_needs.length ? need.core_needs.map((value) => labelFor('core_needs', value)).join('、') : '暂未填写')}</div></div><span className="need-time">{needTime(need)}</span></div>)}</div><NavLink className="see-all" to="/customers">查看全部顾客需求 <ArrowRight size={13} /></NavLink></article></section>
    <div className="demo-footnote"><span className="demo-footnote-mark">i</span>当前展示为演示数据，可通过「添加事项」「记录需求」体验操作；数据暂存在页面内存中，刷新后恢复示例内容。</div>
  </>
}

function SignalRow({ label, count, color }: { label: string; count: number; color: string }) {
  return <div className="signal-row"><span className={`signal-label ${color}`}>{label}</span><div className="signal-track"><span className={color} style={{ width: `${Math.min(count / 20 * 100, 100)}%` }} /></div><strong>{count}<small> / 20</small></strong></div>
}

function DailyPage({ dates, sales, note, revenue, setNote, openSale, user, configured, authLoading, authError, journalLoading, journalSaving, journalLoaded, journalError, onRetry, onSaveNote }: {
  dates: ReturnType<typeof dateLabels>; sales: Sale[]; note: string; revenue: number; setNote: (value: string) => void; openSale: () => void;
  user: User | null; configured: boolean; authLoading: boolean; authError: string; journalLoading: boolean; journalSaving: boolean; journalLoaded: boolean; journalError: string; onRetry: () => void; onSaveNote: () => Promise<boolean>
}) {
  const journalAccess = !configured
    ? <div className="connection-notice"><strong>连接配置还差一步</strong><p>在项目根目录的 <code>.env.local</code> 中填入 Supabase 公开 anon / publishable key，再重启本地服务。</p></div>
    : authLoading
      ? <div className="connection-notice">正在建立匿名云端连接…</div>
      : !user
        ? <div className="connection-notice"><strong>暂时无法连接云端</strong><p>{authError || '请检查 Supabase 项目的匿名登录设置和网络连接。'}</p><button className="primary-button" type="button" onClick={onRetry}>重试连接 <ArrowRight size={14} /></button></div>
        : journalLoading
          ? <div className="connection-notice">正在读取今天的云端记录…</div>
          : <textarea className="journal-input expanded" value={note} onChange={(event) => setNote(event.target.value)} aria-label="今天发生了什么" placeholder="写下今天值得留下的事…" />

  return <><div className="subpage-heading"><div><span className="section-kicker">DAILY JOURNAL</span><h1>每日记录<span className="heading-period">{dates.full}</span></h1><p>把今天值得留下的事和经营数字，放在一起看。</p></div><div className="demo-badge"><span />{user ? '匿名云端记录' : configured ? '云端连接中' : '演示数据'}</div></div><div className="daily-page-grid"><article className="panel daily-page-note"><div className="panel-head"><div><span className="section-kicker">STORE NOTE</span><h2>今天发生了什么</h2></div><span className="panel-date">{journalLoaded ? '已从云端读取' : '今天'}</span></div>{journalAccess}{journalError && <p className="journal-error" role="alert">{journalError}</p>}{user && <button className="primary-button" type="button" disabled={journalLoading || journalSaving} onClick={onSaveNote}>{journalSaving ? '保存中…' : <>保存今天 <ArrowRight size={14} /></>}</button>}</article><article className="panel daily-page-sales"><div className="panel-head"><div><span className="section-kicker">SALES ACTIVITY</span><h2>产生销售额的事项</h2></div><button className="inline-link" type="button" onClick={openSale}><Plus size={14} />添加事项</button></div><div className="sale-list">{sales.map((sale) => <div className="sale-row" key={sale.id}><span className={`sale-category ${sale.category === '实体车' ? 'bike' : ''}`}>{sale.category === '实体车' ? <Bike size={15} /> : sale.category.slice(0, 1)}</span><div className="sale-name"><strong>{sale.name}</strong><span>{sale.category} <i>·</i> {sale.time}</span></div><strong className="sale-amount">{sale.amount < 0 ? '−' : '+'}¥{Math.abs(sale.amount).toLocaleString('zh-CN')}</strong></div>)}</div><div className="list-total"><span>每日营业额</span><strong>¥ {revenue.toLocaleString('zh-CN')}.00</strong></div></article></div><div className="demo-footnote"><span className="demo-footnote-mark">i</span>{user ? '今日门店记录保存在 Supabase 匿名账户中；只能在当前浏览器找回。销售事项仍为示例数据。' : configured ? '匿名云端连接失败时，请确认项目已开启匿名登录。' : '连接配置完成后，今日门店记录会保存在 Supabase。销售事项接入在后续步骤。'}</div></>
}

function CustomersPage({ needs, openNeed, loading, error, configured }: { needs: Need[]; openNeed: () => void; loading: boolean; error: string; configured: boolean }) {
  const thisMonth = todayRecordDate().slice(0, 7)
  const monthlyCount = needs.filter((need) => need.recorded_on.startsWith(thisMonth)).length
  return <><div className="subpage-heading"><div><span className="section-kicker">CUSTOMER VOICE</span><h1>顾客需求<span className="heading-period">需求是新的起点</span></h1><p>保留顾客的原话，再记录哪些人群和需求反复出现。</p></div><div className="research-form-actions"><NavLink className="secondary-button" to="/research">查看人群统计 <ArrowRight size={14} /></NavLink><button className="primary-button" type="button" onClick={openNeed}><Plus size={14} />记录一位顾客</button></div></div><div className="customer-summary"><div><span>本月接待记录</span><strong>{monthlyCount}<small> 条</small></strong></div><div><span>累计接待记录</span><strong>{needs.length}<small> 条</small></strong></div><div><span>记录方式</span><strong>匿名调研</strong></div></div>{error && <div className="research-error" role="alert">{error}</div>}<section className="customer-records"><div className="panel-head"><div><span className="section-kicker">RECENT NOTES</span><h2>最近记录</h2></div><span className="demo-badge"><span />{configured ? '云端数据' : '演示数据'}</span></div>{loading ? <div className="research-empty">正在读取顾客记录…</div> : needs.length === 0 ? <div className="research-empty"><strong>还没有顾客记录</strong><p>记录一位顾客后，购车原因和调研信息会显示在这里。</p></div> : needs.map((need) => <article className="customer-record" key={need.id}><div className="record-avatar"><UsersRound size={16} /></div><div className="record-body"><div className="record-top"><strong>到店顾客</strong><span>{need.recorded_on} · {needTime(need)}</span></div><div className="record-columns"><div><span>购车原因</span><p>{need.purchase_reason || '未填写'}</p></div><div><span>未来可能的需求</span><p>{need.future_needs || '未填写'}</p></div></div>{need.core_needs.length > 0 && <div className="research-record-needs"><span>核心需求</span>{need.core_needs.map((value) => <i key={value}>{labelFor('core_needs', value)}</i>)}</div>}</div></article>)}</section><div className="demo-footnote"><span className="demo-footnote-mark">i</span>{configured ? '每次接待记一条，不收集姓名、电话或详细住址。' : '当前为演示模式，新增记录只保存在页面内存中，刷新后会重置。'}</div></>
}

function EntryModal({ close, onSave }: { close: () => void; onSave: (entry: Omit<Sale, 'id' | 'time'>) => void }) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    onSave({ category: form.get('category') as SaleCategory, name: String(form.get('name') || form.get('category')), amount: Number(form.get('amount') || 0) })
  }
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) close() }}><form className="entry-modal" onSubmit={submit}><div className="modal-head"><div><span className="section-kicker">QUICK ENTRY</span><h2>添加销售事项</h2></div><button className="icon-button" type="button" aria-label="关闭" onClick={close}><X size={18} /></button></div><label>销售类别<select name="category"><option>实体车</option><option>头盔</option><option>配件</option><option>改装</option><option>其他</option></select></label><label>事项名称 / 车型型号<input name="name" placeholder="例如：450MT / 护杠安装" /></label><label>金额（退款请填负数）<input name="amount" type="number" step="0.01" placeholder="0.00" required /></label><div className="modal-foot"><span>仅为本地演示，刷新后会重置</span><button className="primary-button" type="submit">添加到演示 <ArrowRight size={14} /></button></div></form></div>
}

export default App

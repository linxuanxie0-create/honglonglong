import { NavLink, Route, Routes, useLocation } from 'react-router-dom'
import {
  ArrowDownRight,
  ArrowUpRight,
  Bike,
  CalendarDays,
  ChevronDown,
  CircleHelp,
  Clock3,
  Command,
  Gauge,
  LayoutDashboard,
  Plus,
  Search,
  Settings2,
  ShoppingBag,
  Sparkles,
  UsersRound,
} from 'lucide-react'
import { isSupabaseConfigured } from './lib/supabase'

const navItems = [
  { to: '/', label: '经营总览', icon: LayoutDashboard, end: true },
  { to: '/daily', label: '每日记录', icon: CalendarDays },
  { to: '/customers', label: '顾客需求', icon: UsersRound },
]

const pageMeta: Record<string, { eyebrow: string; title: string; subtitle: string }> = {
  '/': { eyebrow: 'THURSDAY, OCTOBER 01', title: '把今天，记下来。', subtitle: '每一条真实的需求，都可能成为下一次增长的起点。' },
  '/daily': { eyebrow: 'DAILY JOURNAL', title: '每日记录', subtitle: '留下门店每天发生的事，让经营有迹可循。' },
  '/customers': { eyebrow: 'CUSTOMER NOTES', title: '顾客需求', subtitle: '记住顾客为什么来，也留意他们下一步需要什么。' },
}

function getTodayLabels() {
  const parts = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    weekday: 'short',
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  }).formatToParts(new Date())
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? ''
  const english = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Shanghai',
    weekday: 'long',
    month: 'long',
    day: '2-digit',
  }).format(new Date()).toUpperCase()
  return {
    english,
    topbar: `${value('month')}.${value('day')} ${value('weekday')}`,
    full: `${value('year')}年${value('month')}月${value('day')}日`,
  }
}

function App() {
  const location = useLocation()
  const meta = pageMeta[location.pathname] ?? pageMeta['/']
  const today = getTodayLabels()

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-lockup">
          <div className="brand-mark"><Gauge size={19} strokeWidth={2.2} /></div>
          <div><div className="brand-name">栖点</div><div className="brand-caption">MOTO BUSINESS INTELLIGENCE</div></div>
        </div>

        <div className="store-switcher">
          <div className="store-avatar"><Bike size={18} /></div>
          <div className="store-copy"><strong>我的门店</strong><span>个人工作台</span></div>
          <ChevronDown size={15} className="muted-icon" />
        </div>

        <div className="nav-label">工作台</div>
        <nav className="main-nav" aria-label="主导航">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <Icon size={17} strokeWidth={1.8} /><span>{label}</span>
              {to === '/daily' && <span className="nav-dot" />}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-spacer" />
        <div className="sidebar-note">
          <div className="note-orbit"><Sparkles size={15} /></div>
          <div className="note-title">从记录开始</div>
          <p>持续记录真实需求，机会会慢慢浮现。</p>
          <div className="note-progress"><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /></div>
          <div className="note-foot"><span>数据积累中</span><span>01 / 20</span></div>
        </div>
        <button className="profile-button" type="button">
          <div className="profile-avatar">林</div><div className="profile-copy"><strong>门店主理人</strong><span>个人账户</span></div><Settings2 size={16} className="muted-icon" />
        </button>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumbs"><span>工作台</span><span className="crumb-slash">/</span><strong>{location.pathname === '/' ? '经营总览' : location.pathname === '/daily' ? '每日记录' : '顾客需求'}</strong></div>
          <div className="topbar-actions">
          <div className="today-chip"><span className="today-pulse" />营业日 <strong>{today.topbar}</strong></div>
            <button className="icon-button" aria-label="搜索" type="button"><Search size={17} /></button>
            <button className="icon-button help-button" aria-label="帮助" type="button"><CircleHelp size={17} /></button>
            <div className="topbar-divider" />
            <button className="quick-add" type="button" onClick={() => document.getElementById('daily-note')?.focus()}><Plus size={16} /> <span>记录今天</span><kbd>N</kbd></button>
          </div>
        </header>

        <div className="page-content">
          <div className="page-heading">
            <div><div className="eyebrow"><span className="eyebrow-line" />{location.pathname === '/' ? today.english : meta.eyebrow}</div><h1>{meta.title}</h1><p className="page-subtitle">{meta.subtitle}</p></div>
            <button className="date-picker" type="button"><CalendarDays size={16} /><span>{today.full}</span><ChevronDown size={14} /></button>
          </div>

          {!isSupabaseConfigured && <SetupNotice />}

          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/daily" element={<PlaceholderPage icon={<CalendarDays size={21} />} title="每日经营记录" text="在这里记录每天的门店日况与经营事项。" />} />
            <Route path="/customers" element={<PlaceholderPage icon={<UsersRound size={21} />} title="顾客需求记录" text="在这里整理顾客的购车原因与未来可能需求。" />} />
            <Route path="*" element={<Dashboard />} />
          </Routes>
          <footer className="page-footer"><span>栖点 · 门店经营情报</span><span>让每一次记录，都更接近下一次机会。</span></footer>
        </div>
      </main>
    </div>
  )
}

function SetupNotice() {
  return (
    <section className="setup-notice" aria-live="polite">
      <div className="setup-icon"><Command size={17} /></div>
      <div className="setup-copy"><strong>连接你的数据空间</strong><span>添加 Supabase 配置后，即可开始保存门店记录。</span></div>
      <code>.env.local</code>
      <span className="setup-status"><span />待配置</span>
    </section>
  )
}

function Dashboard() {
  return (
    <>
      <section className="stats-grid" aria-label="今日经营数据">
        <article className="stat-card revenue-card">
          <div className="stat-top"><span>今日营业额</span><span className="stat-icon revenue-icon"><ShoppingBag size={17} /></span></div>
          <div className="stat-value"><span className="currency">¥</span>0<span className="stat-decimal">.00</span></div>
          <div className="stat-bottom"><span className="neutral-tag"><Clock3 size={12} /> 今日数据待记录</span><span className="stat-caption">销售事项汇总</span></div>
        </article>
        <article className="stat-card">
          <div className="stat-top"><span>今日销售事项</span><span className="stat-icon sales-icon"><Bike size={17} /></span></div>
          <div className="stat-value">0<span className="stat-unit">笔</span></div>
          <div className="stat-bottom"><span className="stat-caption">实体车与其他销售</span><span className="stat-arrow"><ArrowUpRight size={14} /></span></div>
        </article>
        <article className="stat-card">
          <div className="stat-top"><span>顾客需求记录</span><span className="stat-icon people-icon"><UsersRound size={17} /></span></div>
          <div className="stat-value">0<span className="stat-unit">位</span></div>
          <div className="stat-bottom"><span className="stat-caption">今天留下的真实声音</span><span className="stat-arrow"><ArrowUpRight size={14} /></span></div>
        </article>
      </section>

      <section className="workspace-grid">
        <article className="panel journal-panel">
          <div className="panel-header"><div><div className="section-kicker">TODAY'S JOURNAL</div><h2>今天发生了什么</h2></div><span className="live-label"><span />今日记录</span></div>
          <div className="journal-editor">
            <div className="editor-gutter"><span>01</span><span className="editor-line" /><span className="editor-cursor" /></div>
            <textarea id="daily-note" placeholder="写下今天值得记住的事……\n\n一位顾客的故事、一个重复出现的需求，或任何让你停下来想一想的细节。" aria-label="今日门店记录" />
          </div>
          <div className="journal-footer"><span><Command size={13} /> 只有你能看到这条记录</span><button className="save-button" type="button">保存记录 <ArrowUpRight size={14} /></button></div>
        </article>

        <article className="panel opportunity-panel">
          <div className="panel-header"><div><div className="section-kicker">SIGNALS IN THE MAKING</div><h2>需求正在积累</h2></div><button className="text-link" type="button">本月 <ChevronDown size={13} /></button></div>
          <div className="opportunity-intro"><div className="opportunity-symbol"><Sparkles size={17} /></div><p>当某类需求一个月出现 <strong>20 次</strong><br />它就值得被认真看见。</p></div>
          <div className="signal-list">
            <SignalRow icon="改" label="改装" count="0" color="orange" />
            <SignalRow icon="配" label="配件" count="0" color="blue" />
            <SignalRow icon="盔" label="头盔" count="0" color="green" />
          </div>
          <div className="opportunity-footer"><span>距第一个经营机会</span><strong>还差 20 次记录</strong><ArrowDownRight size={15} /></div>
        </article>
      </section>

      <section className="lower-grid">
        <article className="panel sales-panel">
          <div className="panel-header"><div><div className="section-kicker">SALES ACTIVITY</div><h2>今日销售事项</h2></div><button className="add-inline" type="button"><Plus size={14} />添加事项</button></div>
          <div className="empty-sales"><div className="empty-icon"><ShoppingBag size={19} /></div><div><strong>今天还没有销售记录</strong><span>有销售或退款时，在这里记一笔。</span></div><button aria-label="添加销售事项" type="button"><Plus size={17} /></button></div>
          <div className="sales-total"><span>今日合计</span><strong>¥ 0.00</strong></div>
        </article>
        <article className="panel customer-panel">
          <div className="panel-header"><div><div className="section-kicker">CUSTOMER VOICE</div><h2>顾客的下一步</h2></div><button className="round-link" type="button" aria-label="查看顾客需求"><ArrowUpRight size={16} /></button></div>
          <div className="customer-empty"><div className="customer-illustration"><div className="illustration-ring ring-one" /><div className="illustration-ring ring-two" /><div className="illustration-person"><UsersRound size={20} /></div><span className="sparkle sparkle-a">✳</span><span className="sparkle sparkle-b">✳</span></div><strong>真实需求，从一次对话开始</strong><span>记下顾客为什么买车，以及他们未来可能需要什么。</span><button type="button" className="outline-button"><Plus size={14} />记录一位顾客</button></div>
        </article>
      </section>
    </>
  )
}

function SignalRow({ icon, label, count, color }: { icon: string; label: string; count: string; color: string }) {
  return <div className="signal-row"><div className={`signal-icon ${color}`}>{icon}</div><span className="signal-label">{label}</span><div className="signal-track"><span style={{ width: '0%' }} /></div><strong>{count}<small> / 20</small></strong></div>
}

function PlaceholderPage({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <section className="placeholder-panel"><div className="placeholder-icon">{icon}</div><h2>{title}</h2><p>{text}</p><span className="coming-soon"><span />记录流程将在下一步 build step 实现</span></section>
}

export default App

import { useMemo, useState } from 'react'
import { ArrowRight, BarChart3, UsersRound } from 'lucide-react'
import { coreNeedOptions, labelFor, researchSections } from '../lib/customer-research'
import type { CustomerResearchRecord } from '../lib/customer-research'

type Props = {
  records: CustomerResearchRecord[]
  loading: boolean
  error: string
  configured: boolean
  onRetry: () => void
}

export default function CustomerResearchStats({ records, loading, error, configured, onRetry }: Props) {
  const [month, setMonth] = useState(() => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit' }).format(new Date()))
  const [allTime, setAllTime] = useState(false)
  const filtered = useMemo(() => allTime ? records : records.filter((record) => record.recorded_on.startsWith(month)), [allTime, month, records])
  const coreRespondents = filtered.filter((record) => (record.core_needs ?? []).length > 0).length
  const coreCounts = coreNeedOptions.map((option) => ({
    value: option.value,
    label: option.label,
    count: filtered.filter((record) => (record.core_needs ?? []).includes(option.value)).length,
  })).filter((row) => row.count > 0)
  const totalCoreSelections = coreCounts.reduce((sum, row) => sum + row.count, 0)
  const completedSurveys = filtered.filter((record) => hasAnyResearch(record)).length

  return <>
    <div className="subpage-heading research-page-heading">
      <div><span className="section-kicker">CUSTOMER RESEARCH</span><h1>人群调研<span className="heading-period">听见顾客，也看见趋势</span></h1><p>用持续记录了解顾客从哪里来、谁参与购买，以及他们真正需要什么。</p></div>
      <div className="research-filter"><label htmlFor="research-month">统计周期</label><input id="research-month" type="month" value={month} onChange={(event) => { setMonth(event.target.value); setAllTime(false) }} /><button className={`period-button${allTime ? ' selected' : ''}`} type="button" onClick={() => setAllTime(true)}>全部记录</button></div>
    </div>

    {error && <div className="research-error" role="alert"><span>{error}</span><button className="inline-link" type="button" onClick={onRetry}>重新加载 <ArrowRight size={13} /></button></div>}

    <section className="research-overview" aria-label="调研概况">
      <article className="research-total-card"><span className="research-total-icon"><UsersRound size={17} /></span><div><span>本期接待记录</span><strong>{filtered.length}<small> 条</small></strong></div><span className="research-card-caption">VISIT NOTES</span></article>
      <article className="research-total-card"><span className="research-total-icon wine"><BarChart3 size={17} /></span><div><span>填写过调研内容</span><strong>{completedSurveys}<small> 条</small></strong></div><span className="research-card-caption">SURVEY RESPONSES</span></article>
      <article className="research-total-card"><span className="research-total-icon navy"><UsersRound size={17} /></span><div><span>填写核心需求</span><strong>{coreRespondents}<small> 位</small></strong></div><span className="research-card-caption">CORE NEEDS</span></article>
    </section>

    {loading ? <div className="research-empty">正在读取调研记录…</div> : filtered.length === 0 ? <div className="research-empty"><span className="research-empty-icon"><BarChart3 size={20} /></span><strong>本期还没有调研记录</strong><p>{configured ? '在“顾客需求”页面记录一位顾客后，这里会显示统计。' : '当前为演示模式；配置 Supabase 后，记录会持续保存并累计。'}</p></div> : <>
      <section className="research-grid" aria-label="顾客群体统计">
        {researchSections.map((section, index) => {
          const entries = section.options.map((option) => ({ ...option, count: filtered.filter((record) => record[section.key] === option.value).length })).filter((option) => option.count > 0)
          const blankCount = filtered.length - filtered.filter((record) => Boolean(record[section.key])).length
          return <article className="panel research-chart-card" key={section.key}>
            <div className="panel-head"><div><span className="section-kicker">PROFILE {String(index + 1).padStart(2, '0')}</span><h2>{section.title}</h2></div><span className="research-answer-count">{filtered.length - blankCount} / {filtered.length} 条已填写</span></div>
            {entries.length === 0 ? <div className="research-chart-empty">暂无已填写数据</div> : <div className="research-bars">{entries.map((entry) => <ResearchBar key={entry.value} label={entry.label} count={entry.count} total={filtered.length} />)}</div>}
            {blankCount > 0 && <div className="research-unfilled">未填写 <strong>{blankCount}</strong></div>}
          </article>
        })}
      </section>

      <section className="panel research-chart-card research-core-card">
        <div className="panel-head"><div><span className="section-kicker">CORE NEEDS</span><h2>顾客的核心需求</h2></div><span className="research-answer-count">{coreRespondents} / {filtered.length} 条已填写</span></div>
        {coreCounts.length === 0 ? <div className="research-chart-empty">暂无已填写数据</div> : <div className="research-bars core-bars">{coreCounts.map((entry) => <ResearchBar key={entry.value} label={labelFor('core_needs', entry.value)} count={entry.count} total={coreRespondents} />)}</div>}
        <p className="research-multi-note">核心需求可以多选；每项占比按填写核心需求的记录数计算，总和可能超过 100%。{totalCoreSelections > 0 && <span> 本期共勾选 {totalCoreSelections} 项。</span>}</p>
      </section>
      <div className="demo-footnote"><span className="demo-footnote-mark">i</span>每次接待记录为一条，未收集姓名和联系方式，因此统计的是接待记录数，不是去重后的独立顾客数。</div>
    </>}
  </>
}

function ResearchBar({ label, count, total }: { label: string; count: number; total: number }) {
  const percent = total > 0 ? Math.round(count / total * 100) : 0
  return <div className="research-bar-row"><span className="research-bar-label">{label}</span><div className="research-bar-track"><span style={{ width: `${percent}%` }} /></div><strong>{count}<small> · {percent}%</small></strong></div>
}

function hasAnyResearch(record: CustomerResearchRecord) {
  return Boolean(record.gender || record.age_group || record.hometown_province || record.residence_area || record.discovery_source || record.payer_role || record.decision_role || record.core_needs?.length || record.core_need_note)
}

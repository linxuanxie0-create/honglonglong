import { useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowRight, X } from 'lucide-react'
import {
  ageOptions,
  coreNeedOptions,
  createEmptyResearchDraft,
  discoveryOptions,
  genderOptions,
  provinceOptions,
  residenceOptions,
  roleOptions,
} from '../lib/customer-research'
import type { CustomerResearchDraft } from '../lib/customer-research'

type Props = {
  close: () => void
  onSave: (draft: CustomerResearchDraft) => Promise<boolean>
}

export default function CustomerResearchForm({ close, onSave }: Props) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const empty = createEmptyResearchDraft()

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')
    const form = new FormData(event.currentTarget)
    const draft: CustomerResearchDraft = {
      recorded_on: String(form.get('recorded_on') || empty.recorded_on),
      purchase_reason: String(form.get('purchase_reason') || '').trim(),
      future_needs: String(form.get('future_needs') || '').trim(),
      gender: nullable(form.get('gender')),
      age_group: nullable(form.get('age_group')),
      hometown_province: nullable(form.get('hometown_province')),
      residence_area: nullable(form.get('residence_area')),
      discovery_source: nullable(form.get('discovery_source')),
      payer_role: nullable(form.get('payer_role')),
      decision_role: nullable(form.get('decision_role')),
      core_needs: form.getAll('core_needs').map(String),
      core_need_note: nullable(form.get('core_need_note')),
    }
    if (!hasContent(draft)) {
      setError('至少填写一项内容，再保存这条记录。')
      setSaving(false)
      return
    }
    const saved = await onSave(draft)
    setSaving(false)
    if (saved) close()
  }

  return <div className="modal-backdrop research-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) close() }}>
    <form className="entry-modal research-modal" onSubmit={submit}>
      <div className="modal-head"><div><span className="section-kicker">CUSTOMER RESEARCH</span><h2>记录一位顾客</h2><p>不记姓名和联系方式；每次接待记一条。</p></div><button className="icon-button" type="button" aria-label="关闭" onClick={close}><X size={18} /></button></div>

      <label className="research-date">记录日期<input name="recorded_on" type="date" defaultValue={empty.recorded_on} required /></label>
      <div className="research-form-section"><span className="research-form-heading">顾客情况 <small>可跳过</small></span><div className="research-form-grid">
        <SelectField name="gender" label="性别" options={genderOptions} />
        <SelectField name="age_group" label="年龄段" options={ageOptions} />
        <SelectField name="hometown_province" label="哪里人（省份）" options={provinceOptions.map((label) => ({ value: label, label }))} />
        <SelectField name="residence_area" label="住哪里（大致范围）" options={residenceOptions} />
        <SelectField name="discovery_source" label="从哪里看到门店信息" options={discoveryOptions} />
        <SelectField name="payer_role" label="谁出钱" options={roleOptions} />
        <SelectField name="decision_role" label="谁决策" options={roleOptions} />
      </div></div>

      <fieldset className="research-form-section research-needs-fieldset"><legend className="research-form-heading">核心需求 <small>可多选</small></legend><div className="research-check-grid">{coreNeedOptions.map((option) => <label className="research-check" key={option.value}><input type="checkbox" name="core_needs" value={option.value} /><span>{option.label}</span></label>)}</div><label className="research-detail-label">补充说明<textarea name="core_need_note" placeholder="顾客最在意什么？可以用一句话记录" /></label></fieldset>

      <div className="research-form-section"><span className="research-form-heading">顾客需求 <small>保留原有自由记录</small></span><div className="research-form-grid"><label>购车原因<textarea name="purchase_reason" placeholder="顾客为什么想买车？" /></label><label>未来可能的需求<textarea name="future_needs" placeholder="配件、头盔、改装或其他后续需求" /></label></div></div>

      {error && <p className="journal-error" role="alert">{error}</p>}
      <div className="modal-foot"><span>性别、年龄和地区均可不填</span><div className="research-form-actions"><button className="secondary-button" type="button" onClick={close}>取消</button><button className="primary-button" type="submit" disabled={saving}>{saving ? '保存中…' : <>保存记录 <ArrowRight size={14} /></>}</button></div></div>
    </form>
  </div>
}

function SelectField({ name, label, options }: { name: string; label: string; options: readonly { value: string; label: string }[] }) {
  return <label>{label}<select name={name} defaultValue=""><option value="">未填写</option>{options.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>
}

function nullable(value: FormDataEntryValue | null) {
  const text = String(value ?? '').trim()
  return text || null
}

function hasContent(draft: CustomerResearchDraft) {
  return Boolean(
    draft.purchase_reason || draft.future_needs || draft.gender || draft.age_group
    || draft.hometown_province || draft.residence_area || draft.discovery_source
    || draft.payer_role || draft.decision_role || draft.core_needs.length || draft.core_need_note,
  )
}

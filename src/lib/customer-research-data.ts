import type { User } from '@supabase/supabase-js'
import { supabase } from './supabase'
import type { CustomerResearchDraft, CustomerResearchRecord } from './customer-research'

export async function loadCustomerResearch(user: User): Promise<CustomerResearchRecord[]> {
  if (!supabase) throw new Error('Supabase is not configured.')
  const { data, error } = await supabase
    .from('customer_needs')
    .select('id, user_id, recorded_on, purchase_reason, future_needs, gender, age_group, hometown_province, residence_area, discovery_source, payer_role, decision_role, core_needs, core_need_note, created_at, updated_at')
    .eq('user_id', user.id)
    .order('recorded_on', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((row) => ({ ...row, core_needs: row.core_needs ?? [] })) as CustomerResearchRecord[]
}

export async function saveCustomerResearch(user: User, draft: CustomerResearchDraft): Promise<CustomerResearchRecord> {
  if (!supabase) throw new Error('Supabase is not configured.')
  const { data, error } = await supabase
    .from('customer_needs')
    .insert({ ...draft, user_id: user.id })
    .select('id, user_id, recorded_on, purchase_reason, future_needs, gender, age_group, hometown_province, residence_area, discovery_source, payer_role, decision_role, core_needs, core_need_note, created_at, updated_at')
    .single()
  if (error) throw error
  return { ...data, core_needs: data.core_needs ?? [] } as CustomerResearchRecord
}

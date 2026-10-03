export const genderOptions = [
  { value: 'male', label: '男' },
  { value: 'female', label: '女' },
  { value: 'other', label: '其他' },
  { value: 'prefer_not_to_say', label: '不方便透露' },
] as const

export const ageOptions = [
  { value: '18_24', label: '18–24 岁' },
  { value: '25_34', label: '25–34 岁' },
  { value: '35_44', label: '35–44 岁' },
  { value: '45_54', label: '45–54 岁' },
  { value: '55_plus', label: '55 岁及以上' },
  { value: 'prefer_not_to_say', label: '不方便透露' },
] as const

export const provinceOptions = [
  '北京', '天津', '上海', '重庆', '河北', '山西', '辽宁', '吉林', '黑龙江', '江苏', '浙江', '安徽', '福建', '江西', '山东', '河南', '湖北', '湖南', '广东', '海南', '四川', '贵州', '云南', '陕西', '甘肃', '青海', '台湾', '内蒙古', '广西', '西藏', '宁夏', '新疆', '香港', '澳门', '海外 / 其他', '不方便透露',
] as const

export const residenceOptions = [
  { value: 'same_district', label: '本区' },
  { value: 'same_city_other_district', label: '本市其他区' },
  { value: 'nearby_city', label: '邻近城市' },
  { value: 'other_province', label: '外省 / 其他地区' },
  { value: 'prefer_not_to_say', label: '不方便透露' },
] as const

export const discoveryOptions = [
  { value: 'douyin', label: '抖音 / 短视频' },
  { value: 'xiaohongshu', label: '小红书 / 社交平台' },
  { value: 'map_search', label: '地图 / 搜索' },
  { value: 'friend', label: '朋友介绍' },
  { value: 'passerby', label: '路过看到' },
  { value: 'offline_event', label: '线下活动' },
  { value: 'other', label: '其他' },
  { value: 'unknown', label: '不清楚' },
] as const

export const roleOptions = [
  { value: 'self', label: '本人' },
  { value: 'family', label: '家人' },
  { value: 'partner', label: '伴侣' },
  { value: 'shared', label: '共同承担 / 决定' },
  { value: 'unknown', label: '不清楚' },
] as const

export const coreNeedOptions = [
  { value: 'commute', label: '日常通勤' },
  { value: 'weekend_touring', label: '周末骑行 / 长途' },
  { value: 'sport_offroad', label: '运动 / 越野' },
  { value: 'first_motorcycle', label: '入门购车' },
  { value: 'upgrade', label: '置换升级' },
  { value: 'other', label: '其他' },
] as const

export type CustomerResearchDraft = {
  recorded_on: string
  purchase_reason: string
  future_needs: string
  gender: string | null
  age_group: string | null
  hometown_province: string | null
  residence_area: string | null
  discovery_source: string | null
  payer_role: string | null
  decision_role: string | null
  core_needs: string[]
  core_need_note: string | null
}

export type CustomerResearchRecord = CustomerResearchDraft & {
  id: string
  user_id?: string
  created_at?: string
  updated_at?: string
  time?: string
}

export type ResearchField = 'gender' | 'age_group' | 'hometown_province' | 'residence_area' | 'discovery_source' | 'payer_role' | 'decision_role'

export const researchSections: { key: ResearchField; title: string; options: readonly { value: string; label: string }[] }[] = [
  { key: 'gender', title: '性别', options: genderOptions },
  { key: 'age_group', title: '年龄段', options: ageOptions },
  { key: 'hometown_province', title: '籍贯区域', options: provinceOptions.map((label) => ({ value: label, label })) },
  { key: 'residence_area', title: '居住范围', options: residenceOptions },
  { key: 'discovery_source', title: '门店信息来源', options: discoveryOptions },
  { key: 'payer_role', title: '付款角色', options: roleOptions },
  { key: 'decision_role', title: '决策角色', options: roleOptions },
]

export function createEmptyResearchDraft(): CustomerResearchDraft {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date())
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? ''
  return {
    recorded_on: `${part('year')}-${part('month')}-${part('day')}`,
    purchase_reason: '', future_needs: '', gender: null, age_group: null,
    hometown_province: null, residence_area: null, discovery_source: null,
    payer_role: null, decision_role: null, core_needs: [], core_need_note: null,
  }
}

export function labelFor(field: ResearchField | 'core_needs', value: string) {
  if (field === 'core_needs') return coreNeedOptions.find((option) => option.value === value)?.label ?? value
  const options = researchSections.find((section) => section.key === field)?.options ?? []
  return options.find((option) => option.value === value)?.label ?? value
}

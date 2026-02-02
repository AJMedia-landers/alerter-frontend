export type RuleScope = 'account' | 'campaign'
export type ConditionType = 'cpa_threshold' | 'zero_conv_spend' | 'weekly_cpa_increase'
export type Platform = 'taboola' | 'outbrain'

export interface AlerterRule {
  id?: number
  name: string
  platform: Platform
  scope: RuleScope
  account_name: string
  timeframe_hours: number
  condition_type: ConditionType
  threshold: number
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

export interface AlerterRuleResponse {
  data?: AlerterRule
  message?: string
  rule_id?: number
  error?: string
  details?: string
}

export interface AlerterRulesListResponse {
  data?: AlerterRule[]
  count?: number
  account_name?: string
  scope?: RuleScope
  error?: string
  details?: string
}

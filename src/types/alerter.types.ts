// TypeScript types for Alerter Rules API - matches campaign-creation-backend

export type RuleScope = 'account' | 'campaign'
export type ConditionType = 'cpa_threshold' | 'zero_conv_spend' | 'weekly_cpa_increase'

export interface AlerterRule {
  id?: number
  name: string
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

export interface AlerterStatsResponse {
  data?: {
    total_rules: number
    active_rules: number
    inactive_rules: number
  }
  error?: string
  details?: string
}

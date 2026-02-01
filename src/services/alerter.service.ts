// API service for Alerter Rules

import type {
  AlerterRule,
  AlerterRuleResponse,
  AlerterRulesListResponse,
  AlerterStatsResponse,
} from '../types/alerter.types'
import { AuthService } from './auth.service'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export class AlerterService {
  /**
   * Get statistics about alerter rules
   */
  static async getStats(): Promise<AlerterStatsResponse> {
    const token = AuthService.getToken()
    const response = await fetch(`${API_BASE_URL}/api/alerter-rules/stats`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.json()
  }

  /**
   * Get all alerter rules (active by default)
   */
  static async getAllRules(activeOnly: boolean = true): Promise<AlerterRulesListResponse> {
    const token = AuthService.getToken()
    const url = activeOnly
      ? `${API_BASE_URL}/api/alerter-rules?active=true`
      : `${API_BASE_URL}/api/alerter-rules`
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.json()
  }

  /**
   * Get a specific rule by ID
   */
  static async getRuleById(id: number): Promise<AlerterRuleResponse> {
    const token = AuthService.getToken()
    const response = await fetch(`${API_BASE_URL}/api/alerter-rules/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.json()
  }

  /**
   * Get rules for a specific account
   */
  static async getRulesByAccount(
    accountName: string,
    activeOnly: boolean = true
  ): Promise<AlerterRulesListResponse> {
    const token = AuthService.getToken()
    const url = activeOnly
      ? `${API_BASE_URL}/api/alerter-rules/account/${accountName}?active=true`
      : `${API_BASE_URL}/api/alerter-rules/account/${accountName}`
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.json()
  }

  /**
   * Get rules by scope (account or campaign)
   */
  static async getRulesByScope(
    scope: 'account' | 'campaign',
    activeOnly: boolean = true
  ): Promise<AlerterRulesListResponse> {
    const token = AuthService.getToken()
    const url = activeOnly
      ? `${API_BASE_URL}/api/alerter-rules/scope/${scope}?active=true`
      : `${API_BASE_URL}/api/alerter-rules/scope/${scope}`
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.json()
  }

  /**
   * Create a new alerter rule
   */
  static async createRule(rule: Omit<AlerterRule, 'id' | 'created_at' | 'updated_at'>): Promise<AlerterRuleResponse> {
    const token = AuthService.getToken()
    const response = await fetch(`${API_BASE_URL}/api/alerter-rules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(rule),
    })
    return response.json()
  }

  /**
   * Update an existing rule
   */
  static async updateRule(
    id: number,
    updates: Partial<Omit<AlerterRule, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<AlerterRuleResponse> {
    const token = AuthService.getToken()
    const response = await fetch(`${API_BASE_URL}/api/alerter-rules/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    })
    return response.json()
  }

  /**
   * Delete a rule permanently
   */
  static async deleteRule(id: number): Promise<AlerterRuleResponse> {
    const token = AuthService.getToken()
    const response = await fetch(`${API_BASE_URL}/api/alerter-rules/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.json()
  }

  /**
   * Activate a rule
   */
  static async activateRule(id: number): Promise<AlerterRuleResponse> {
    const token = AuthService.getToken()
    const response = await fetch(`${API_BASE_URL}/api/alerter-rules/${id}/activate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.json()
  }

  /**
   * Deactivate a rule
   */
  static async deactivateRule(id: number): Promise<AlerterRuleResponse> {
    const token = AuthService.getToken()
    const response = await fetch(`${API_BASE_URL}/api/alerter-rules/${id}/deactivate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.json()
  }
}

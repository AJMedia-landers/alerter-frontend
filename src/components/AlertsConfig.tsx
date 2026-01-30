import { useState, useEffect, useCallback } from 'react'
import { AlerterService } from '../services/alerter.service'
import type { AlerterRule, RuleScope, ConditionType } from '../types/alerter.types'
import '../styles/AlertsConfig.css'

const SCOPE_OPTIONS: { value: RuleScope; label: string; description: string; icon: string }[] = [
  {
    value: 'account',
    label: 'Account Level',
    description: 'Alert when aggregated metrics across all campaigns exceed threshold',
    icon: '🏢',
  },
  {
    value: 'campaign',
    label: 'Campaign Level',
    description: 'Alert for individual campaigns that exceed threshold',
    icon: '📊',
  },
]

const CONDITION_OPTIONS: {
  value: ConditionType
  label: string
  description: string
  icon: string
}[] = [
  {
    value: 'cpa_threshold',
    label: 'CPA Threshold',
    description: 'Alert when Cost Per Action (CPA) reaches or exceeds threshold',
    icon: '💰',
  },
  {
    value: 'zero_conv_spend',
    label: 'Zero Conversions',
    description: 'Alert when spend reaches threshold with zero conversions',
    icon: '❌',
  },
  {
    value: 'weekly_cpa_increase',
    label: 'Weekly CPA Increase',
    description: 'Alert when CPA increases by percentage vs same period last week',
    icon: '📈',
  },
]

export function AlertsConfig() {
  const [rules, setRules] = useState<AlerterRule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingRule, setEditingRule] = useState<AlerterRule | null>(null)
  const [showInactive, setShowInactive] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterScope, setFilterScope] = useState<RuleScope | 'all'>('all')
  const [filterCondition, setFilterCondition] = useState<ConditionType | 'all'>('all')

  // Form states
  const [formData, setFormData] = useState<Omit<AlerterRule, 'id' | 'created_at' | 'updated_at'>>({
    name: '',
    scope: 'account',
    account_name: '',
    timeframe_hours: 2,
    condition_type: 'cpa_threshold',
    threshold: 0,
    is_active: true,
  })

  const loadRules = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await AlerterService.getAllRules(!showInactive)

      if (response.data) {
        setRules(response.data)
      } else {
        setError('Failed to load rules')
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load rules'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [showInactive])

  useEffect(() => {
    loadRules()
  }, [loadRules])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)

    // Validation
    if (!formData.name.trim()) {
      setError('Rule name is required')
      return
    }
    if (!formData.account_name.trim()) {
      setError('Account name is required')
      return
    }
    if (formData.threshold <= 0) {
      setError('Threshold must be greater than 0')
      return
    }
    if (formData.timeframe_hours <= 0) {
      setError('Timeframe must be greater than 0 hours')
      return
    }

    try {
      let response
      if (editingRule && editingRule.id) {
        response = await AlerterService.updateRule(editingRule.id, formData)
      } else {
        response = await AlerterService.createRule(formData)
      }

      if (response.data) {
        setSuccessMessage(
          editingRule ? `Successfully updated rule "${formData.name}"` : `Successfully created rule "${formData.name}"`
        )
        setShowCreateForm(false)
        setEditingRule(null)
        resetForm()
        loadRules()
      } else {
        setError(response.message || 'Failed to save rule')
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save rule'
      setError(message)
    }
  }

  const handleDelete = async (rule: AlerterRule) => {
    if (!rule.id) return
    if (!confirm(`Are you sure you want to delete the rule "${rule.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      setError(null)
      setSuccessMessage(null)
      const response = await AlerterService.deleteRule(rule.id)

      if (response.message) {
        setSuccessMessage(`Successfully deleted rule "${rule.name}"`)
        loadRules()
      } else {
        setError('Failed to delete rule')
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete rule'
      setError(message)
    }
  }

  const handleToggleActive = async (rule: AlerterRule) => {
    if (!rule.id) return

    try {
      setError(null)
      setSuccessMessage(null)

      const response = rule.is_active
        ? await AlerterService.deactivateRule(rule.id)
        : await AlerterService.activateRule(rule.id)

      if (response.message) {
        setSuccessMessage(`Successfully ${rule.is_active ? 'deactivated' : 'activated'} rule "${rule.name}"`)
        loadRules()
      } else {
        setError(`Failed to ${rule.is_active ? 'deactivate' : 'activate'} rule`)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to toggle rule status'
      setError(message)
    }
  }

  const startEdit = (rule: AlerterRule) => {
    setEditingRule(rule)
    setFormData({
      name: rule.name,
      scope: rule.scope,
      account_name: rule.account_name,
      timeframe_hours: rule.timeframe_hours,
      condition_type: rule.condition_type,
      threshold: rule.threshold,
      is_active: rule.is_active ?? true,
    })
    setShowCreateForm(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      scope: 'account',
      account_name: '',
      timeframe_hours: 2,
      condition_type: 'cpa_threshold',
      threshold: 0,
      is_active: true,
    })
  }

  const cancelEdit = () => {
    setShowCreateForm(false)
    setEditingRule(null)
    resetForm()
    setError(null)
  }

  // Filter rules based on search and filters
  const filteredRules = rules.filter((rule) => {
    const matchesSearch =
      searchQuery === '' ||
      rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.account_name.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesScope = filterScope === 'all' || rule.scope === filterScope
    const matchesCondition = filterCondition === 'all' || rule.condition_type === filterCondition

    return matchesSearch && matchesScope && matchesCondition
  })

  if (loading) {
    return (
      <div className="alerts-config-container loading">
        <div className="spinner"></div>
        <p>Loading alerter rules...</p>
      </div>
    )
  }

  return (
    <div className="alerts-config-container">
      <div className="header">
        <div className="header-content">
          <h1>🔔 Alerter Rules</h1>
          <p className="header-description">
            Create and manage intelligent alert rules for monitoring campaign performance
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            resetForm()
            setEditingRule(null)
            setShowCreateForm(true)
          }}
        >
          + Create New Rule
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          <strong>Error:</strong> {error}
          <button className="close-btn" onClick={() => setError(null)}>
            ×
          </button>
        </div>
      )}

      {successMessage && (
        <div className="alert alert-success">
          <strong>Success:</strong> {successMessage}
          <button className="close-btn" onClick={() => setSuccessMessage(null)}>
            ×
          </button>
        </div>
      )}

      {showCreateForm && (
        <div className="create-form-card">
          <div className="form-header">
            <h2>{editingRule ? `Edit Rule: ${editingRule.name}` : 'Create New Alerter Rule'}</h2>
            <button className="close-icon" onClick={cancelEdit}>
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              {/* Rule Name */}
              <div className="form-group full-width">
                <label htmlFor="name">
                  Rule Name <span className="required">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., ReadingGlasses - High CPA Alert"
                  required
                />
                <small className="form-help">A descriptive name to identify this rule</small>
              </div>

              {/* Account Name */}
              <div className="form-group">
                <label htmlFor="account_name">
                  Account Name <span className="required">*</span>
                </label>
                <input
                  id="account_name"
                  type="text"
                  value={formData.account_name}
                  onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                  placeholder="e.g., readingglasses, ketomax"
                  required
                />
                <small className="form-help">Account identifier (case-insensitive match)</small>
              </div>

              {/* Timeframe Hours */}
              <div className="form-group">
                <label htmlFor="timeframe_hours">
                  Timeframe (hours) <span className="required">*</span>
                </label>
                <input
                  id="timeframe_hours"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="e.g., 2"
                  value={formData.timeframe_hours}
                  onChange={(e) => {
                    const value = e.target.value === '' ? '' : Math.round(Number(e.target.value));
                    setFormData({ ...formData, timeframe_hours: value === '' ? 2 : value });
                  }}
                  required
                />
                <small className="form-help">Time window for checking metrics (whole hours only)</small>
              </div>

              {/* Scope Selection */}
              <div className="form-group full-width">
                <label>
                  Alert Scope <span className="required">*</span>
                </label>
                <div className="radio-group">
                  {SCOPE_OPTIONS.map((option) => (
                    <label key={option.value} className={`radio-card ${formData.scope === option.value ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="scope"
                        value={option.value}
                        checked={formData.scope === option.value}
                        onChange={(e) => setFormData({ ...formData, scope: e.target.value as RuleScope })}
                      />
                      <div className="radio-content">
                        <span className="radio-icon">{option.icon}</span>
                        <div>
                          <strong>{option.label}</strong>
                          <p>{option.description}</p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Condition Type Selection */}
              <div className="form-group full-width">
                <label>
                  Condition Type <span className="required">*</span>
                </label>
                <div className="radio-group">
                  {CONDITION_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      className={`radio-card ${formData.condition_type === option.value ? 'selected' : ''}`}
                    >
                      <input
                        type="radio"
                        name="condition_type"
                        value={option.value}
                        checked={formData.condition_type === option.value}
                        onChange={(e) => setFormData({ ...formData, condition_type: e.target.value as ConditionType })}
                      />
                      <div className="radio-content">
                        <span className="radio-icon">{option.icon}</span>
                        <div>
                          <strong>{option.label}</strong>
                          <p>{option.description}</p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Threshold */}
              <div className="form-group">
                <label htmlFor="threshold">
                  Threshold Value <span className="required">*</span>
                </label>
                <div className="input-with-prefix">
                  <span className="input-prefix">
                    {formData.condition_type === 'weekly_cpa_increase' ? '%' : '$'}
                  </span>
                  <input
                    id="threshold"
                    type="number"
                    min="0"
                    step={formData.condition_type === 'weekly_cpa_increase' ? '1' : '0.01'}
                    placeholder={
                      formData.condition_type === 'weekly_cpa_increase' ? 'e.g., 20' : 'e.g., 65.00'
                    }
                    value={formData.threshold || ''}
                    onChange={(e) => {
                      const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                      setFormData({ ...formData, threshold: value });
                    }}
                    required
                  />
                </div>
                <small className="form-help">
                  {formData.condition_type === 'cpa_threshold'
                    ? 'Alert when CPA reaches this amount'
                    : formData.condition_type === 'zero_conv_spend'
                    ? 'Alert when spend reaches this amount with 0 conversions'
                    : 'Alert when CPA increases by this percentage vs last week'}
                </small>
              </div>

              {/* Active Toggle */}
              <div className="form-group">
                <label htmlFor="is_active">Status</label>
                <label className="toggle-switch">
                  <input
                    id="is_active"
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                  <span className="toggle-slider"></span>
                  <span className="toggle-label">{formData.is_active ? 'Active' : 'Inactive'}</span>
                </label>
                <small className="form-help">Only active rules will trigger alerts</small>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                {editingRule ? 'Update Rule' : 'Create Rule'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={cancelEdit}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters and Search */}
      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search rules by name or account..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <select value={filterScope} onChange={(e) => setFilterScope(e.target.value as RuleScope | 'all')}>
            <option value="all">All Scopes</option>
            <option value="account">🏢 Account Level</option>
            <option value="campaign">📊 Campaign Level</option>
          </select>

          <select
            value={filterCondition}
            onChange={(e) => setFilterCondition(e.target.value as ConditionType | 'all')}
          >
            <option value="all">All Conditions</option>
            <option value="cpa_threshold">💰 CPA Threshold</option>
            <option value="zero_conv_spend">❌ Zero Conversions</option>
          </select>

          <label className="checkbox-label">
            <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
            Show inactive rules
          </label>
        </div>
      </div>

      {/* Rules List */}
      <div className="rules-section">
        <div className="section-header">
          <h2>Active Rules ({filteredRules.length})</h2>
        </div>

        {filteredRules.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <p>No rules found</p>
            <p className="empty-subtext">
              {searchQuery || filterScope !== 'all' || filterCondition !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first alerter rule to get started'}
            </p>
          </div>
        ) : (
          <div className="rules-grid">
            {filteredRules.map((rule) => (
              <div key={rule.id} className={`rule-card ${!rule.is_active ? 'inactive' : ''}`}>
                <div className="rule-header">
                  <h3>{rule.name}</h3>
                  <div className="rule-badges">
                    <span className={`badge ${rule.is_active ? 'active' : 'inactive'}`}>
                      {rule.is_active ? '✓ Active' : '○ Inactive'}
                    </span>
                  </div>
                </div>

                <div className="rule-body">
                  <div className="rule-detail">
                    <span className="detail-label">Account:</span>
                    <span className="detail-value">{rule.account_name}</span>
                  </div>

                  <div className="rule-detail">
                    <span className="detail-label">Scope:</span>
                    <span className="detail-value">
                      {rule.scope === 'account' ? '🏢 Account Level' : '📊 Campaign Level'}
                    </span>
                  </div>

                  <div className="rule-detail">
                    <span className="detail-label">Condition:</span>
                    <span className="detail-value">
                      {rule.condition_type === 'cpa_threshold'
                        ? '💰 CPA Threshold'
                        : rule.condition_type === 'zero_conv_spend'
                        ? '❌ Zero Conversions'
                        : '📈 Weekly CPA Increase'}
                    </span>
                  </div>

                  <div className="rule-detail">
                    <span className="detail-label">Threshold:</span>
                    <span className="detail-value threshold">
                      {rule.condition_type === 'weekly_cpa_increase'
                        ? `${Number(rule.threshold).toFixed(0)}%`
                        : `$${Number(rule.threshold).toFixed(2)}`}
                    </span>
                  </div>

                  <div className="rule-detail">
                    <span className="detail-label">Timeframe:</span>
                    <span className="detail-value">{Number(rule.timeframe_hours)} hour{Number(rule.timeframe_hours) !== 1 ? 's' : ''}</span>
                  </div>
                </div>

                <div className="rule-footer">
                  <div className="rule-timestamps">
                    <small>Created: {new Date(rule.created_at!).toLocaleString()}</small>
                  </div>
                  <div className="rule-actions">
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleToggleActive(rule)}
                      title={rule.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {rule.is_active ? '⏸' : '▶'}
                    </button>
                    <button className="btn btn-sm btn-secondary" onClick={() => startEdit(rule)}>
                      ✏️ Edit
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(rule)}>
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

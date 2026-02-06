"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { AlerterRule, RuleScope, ConditionType, Platform, Severity } from "@/types/alerter";

// Debug/Cron types and constants
interface AlertResult {
  endpoint: string;
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
  errors?: string[];
}

const alertEndpoints = [
  { name: "Taboola", endpoint: "taboola/sync-realtime-reports-threshold" },
  { name: "Outbrain", endpoint: "outbrain/sync-realtime-reports-threshold" },
];

const SCOPE_OPTIONS: { value: RuleScope; label: string; description: string; icon: string }[] = [
  {
    value: "account",
    label: "Account Level",
    description: "Alert when aggregated metrics across all campaigns exceed threshold",
    icon: "",
  },
  {
    value: "campaign",
    label: "Campaign Level",
    description: "Alert for individual campaigns that exceed threshold",
    icon: "",
  },
];

const CONDITION_OPTIONS: {
  value: ConditionType;
  label: string;
  description: string;
  icon: string;
}[] = [
  {
    value: "cpa_threshold",
    label: "CPA Threshold",
    description: "Alert when Cost Per Action (CPA) reaches or exceeds threshold",
    icon: "",
  },
  {
    value: "zero_conv_spend",
    label: "Zero Conversions",
    description: "Alert when spend reaches threshold with zero conversions",
    icon: "",
  },
  {
    value: "weekly_cpa_increase",
    label: "Weekly CPA Increase",
    description: "Alert when CPA increases by percentage vs same period last week",
    icon: "",
  },
];

const PLATFORM_OPTIONS: {
  value: Platform;
  label: string;
  description: string;
}[] = [
  {
    value: "taboola",
    label: "Taboola",
    description: "Monitor Taboola campaigns and accounts",
  },
  {
    value: "outbrain",
    label: "Outbrain",
    description: "Monitor Outbrain campaigns and accounts",
  },
];

const TIMEZONE_OPTIONS = [
  { value: "America/New_York", label: "Eastern Time (ET) - New York" },
  { value: "America/Chicago", label: "Central Time (CT) - Chicago" },
  { value: "America/Denver", label: "Mountain Time (MT) - Denver" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT) - Los Angeles" },
  { value: "Europe/London", label: "GMT/BST - London" },
  { value: "Europe/Paris", label: "CET/CEST - Paris" },
  { value: "Europe/Berlin", label: "CET/CEST - Berlin" },
  { value: "Asia/Jerusalem", label: "IST/IDT - Jerusalem" },
  { value: "Asia/Tokyo", label: "JST - Tokyo" },
  { value: "Asia/Shanghai", label: "CST - Shanghai" },
  { value: "Asia/Kolkata", label: "IST - Kolkata" },
  { value: "Australia/Sydney", label: "AEST/AEDT - Sydney" },
  { value: "Pacific/Auckland", label: "NZST/NZDT - Auckland" },
  { value: "UTC", label: "UTC" },
];

const SEVERITY_OPTIONS: {
  value: Severity;
  label: string;
  description: string;
  color: string;
}[] = [
  {
    value: 1,
    label: "SEV-1 (Critical)",
    description: "Critical alerts requiring immediate attention",
    color: "#dc2626",
  },
  {
    value: 2,
    label: "SEV-2 (Warning)",
    description: "Warning alerts for monitoring",
    color: "#f59e0b",
  },
  {
    value: 3,
    label: "SEV-3 (Info)",
    description: "Informational alerts",
    color: "#3b82f6",
  },
];

export default function AlertsPage() {
  const formRef = useRef<HTMLDivElement>(null);
  const [rules, setRules] = useState<AlerterRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRule, setEditingRule] = useState<AlerterRule | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterScope, setFilterScope] = useState<RuleScope | "all">("all");
  const [filterCondition, setFilterCondition] = useState<ConditionType | "all">("all");
  const [filterPlatform, setFilterPlatform] = useState<Platform | "all">("all");
  const [filterSeverity, setFilterSeverity] = useState<Severity | "all">("all");

  // Debug/Manual trigger state
  const [debugLoading, setDebugLoading] = useState(false);
  const [debugResults, setDebugResults] = useState<AlertResult[]>([]);

  const [formData, setFormData] = useState<
    Omit<AlerterRule, "id" | "created_at" | "updated_at" | "timeframe_hours" | "threshold" | "min_spend"> & {
      timeframe_hours: number | "";
      threshold: number | "";
      min_spend: number | "" | null;
    }
  >({
    name: "",
    platform: "taboola",
    scope: "account",
    account_name: "",
    timeframe_hours: 2,
    condition_type: "cpa_threshold",
    threshold: "",
    severity: 2,
    timezone: null,
    min_spend: null,
    is_active: true,
  });

  const loadRules = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const url = showInactive ? "/api/alerter-rules" : "/api/alerter-rules?active=true";
      const response = await fetch(url);
      const data = await response.json();

      if (data.data) {
        setRules(data.data);
      } else {
        setError("Failed to load rules");
      }
    } catch {
      setError("Failed to load rules");
    } finally {
      setLoading(false);
    }
  }, [showInactive]);

  useEffect(() => {
    loadRules();
  }, [loadRules]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!formData.name.trim()) {
      setError("Rule name is required");
      return;
    }
    if (!formData.account_name.trim()) {
      setError("Account name is required");
      return;
    }
    if (formData.threshold === "" || formData.threshold <= 0) {
      setError("Threshold must be greater than 0");
      return;
    }
    if (formData.timeframe_hours === "" || formData.timeframe_hours <= 0) {
      setError("Timeframe must be greater than 0 hours");
      return;
    }
    if (formData.platform === "outbrain" && !formData.timezone) {
      setError("Timezone is required for Outbrain rules");
      return;
    }

    try {
      const submitData = {
        ...formData,
        timeframe_hours: Number(formData.timeframe_hours),
        threshold: Number(formData.threshold),
        timezone: formData.platform === "outbrain" ? formData.timezone : null,
        min_spend: formData.min_spend === "" || formData.min_spend === null ? null : Number(formData.min_spend),
      };

      let response;
      if (editingRule && editingRule.id) {
        response = await fetch(`/api/alerter-rules/${editingRule.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(submitData),
        });
      } else {
        response = await fetch("/api/alerter-rules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(submitData),
        });
      }

      const data = await response.json();

      if (data.data || data.rule_id) {
        setSuccessMessage(
          editingRule
            ? `Successfully updated rule "${formData.name}"`
            : `Successfully created rule "${formData.name}"`
        );
        setShowCreateForm(false);
        setEditingRule(null);
        resetForm();
        loadRules();
      } else {
        setError(data.message || "Failed to save rule");
      }
    } catch {
      setError("Failed to save rule");
    }
  };

  const handleDelete = async (rule: AlerterRule) => {
    if (!rule.id) return;
    if (!confirm(`Are you sure you want to delete the rule "${rule.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setError(null);
      setSuccessMessage(null);
      const response = await fetch(`/api/alerter-rules/${rule.id}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (data.message) {
        setSuccessMessage(`Successfully deleted rule "${rule.name}"`);
        loadRules();
      } else {
        setError("Failed to delete rule");
      }
    } catch {
      setError("Failed to delete rule");
    }
  };

  const handleToggleActive = async (rule: AlerterRule) => {
    if (!rule.id) return;

    try {
      setError(null);
      setSuccessMessage(null);

      const endpoint = rule.is_active
        ? `/api/alerter-rules/${rule.id}/deactivate`
        : `/api/alerter-rules/${rule.id}/activate`;

      const response = await fetch(endpoint, { method: "POST" });
      const data = await response.json();

      if (data.message) {
        setSuccessMessage(
          `Successfully ${rule.is_active ? "deactivated" : "activated"} rule "${rule.name}"`
        );
        loadRules();
      } else {
        setError(`Failed to ${rule.is_active ? "deactivate" : "activate"} rule`);
      }
    } catch {
      setError("Failed to toggle rule status");
    }
  };

  const startEdit = (rule: AlerterRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      platform: rule.platform ?? "taboola",
      scope: rule.scope,
      account_name: rule.account_name,
      timeframe_hours: rule.timeframe_hours,
      condition_type: rule.condition_type,
      threshold: rule.threshold,
      severity: rule.severity ?? 2,
      timezone: rule.timezone ?? null,
      min_spend: rule.min_spend ?? null,
      is_active: rule.is_active ?? true,
    });
    setShowCreateForm(true);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      platform: "taboola",
      scope: "account",
      account_name: "",
      timeframe_hours: 2,
      condition_type: "cpa_threshold",
      threshold: "",
      severity: 2,
      timezone: null,
      min_spend: null,
      is_active: true,
    });
  };

  const cancelEdit = () => {
    setShowCreateForm(false);
    setEditingRule(null);
    resetForm();
    setError(null);
  };

  const duplicateRule = (rule: AlerterRule) => {
    setEditingRule(null);
    setFormData({
      name: `${rule.name} (Copy)`,
      platform: rule.platform ?? "taboola",
      scope: rule.scope,
      account_name: rule.account_name,
      timeframe_hours: rule.timeframe_hours,
      condition_type: rule.condition_type,
      threshold: rule.threshold,
      severity: rule.severity ?? 2,
      timezone: rule.timezone ?? null,
      min_spend: rule.min_spend ?? null,
      is_active: true,
    });
    setShowCreateForm(true);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };

  const triggerAllAlerts = async () => {
    setDebugLoading(true);
    setDebugResults([]);

    const allResults: AlertResult[] = [];

    for (const { name, endpoint } of alertEndpoints) {
      try {
        const res = await fetch(`/api/cron/${endpoint}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        const data = await res.json();
        allResults.push({
          endpoint: name,
          success: data.success,
          message: data.message,
          data: data.data,
          errors: data.errors,
        });
      } catch {
        allResults.push({
          endpoint: name,
          success: false,
          message: "Request failed",
        });
      }
    }

    setDebugResults(allResults);
    setDebugLoading(false);
  };

  const getAvailableConditions = (platform: Platform) => {
    return CONDITION_OPTIONS.filter(
      (option) => !(platform === "outbrain" && option.value === "weekly_cpa_increase")
    );
  };

  const filteredRules = rules.filter((rule) => {
    const matchesSearch =
      searchQuery === "" ||
      rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.account_name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesScope = filterScope === "all" || rule.scope === filterScope;
    const matchesCondition = filterCondition === "all" || rule.condition_type === filterCondition;
    const matchesPlatform = filterPlatform === "all" || (rule.platform ?? "taboola") === filterPlatform;
    const matchesSeverity = filterSeverity === "all" || (rule.severity ?? 2) === filterSeverity;

    return matchesSearch && matchesScope && matchesCondition && matchesPlatform && matchesSeverity;
  });

  if (loading) {
    return (
      <div className="alerts-config-container loading">
        <div className="spinner"></div>
        <p>Loading alerter rules...</p>
      </div>
    );
  }

  return (
    <div className="alerts-config-container">
      <div className="header">
        <div className="header-content">
          <h1>Alerter Rules</h1>
          <p className="header-description">
            Create and manage intelligent alert rules for monitoring campaign performance
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            resetForm();
            setEditingRule(null);
            setShowCreateForm(true);
          }}
        >
          + Create New Rule
        </button>
      </div>

      <div className="debug-section">
        <div className="debug-row">
          <span className="debug-label">Debug: Manual trigger (runs automatically every hour)</span>
          <button
            className="btn btn-secondary btn-sm"
            onClick={triggerAllAlerts}
            disabled={debugLoading}
          >
            {debugLoading ? "Running..." : "Run Now"}
          </button>
          {debugResults.length > 0 && (
            <span className={`debug-status-inline ${debugResults.every((r) => r.success) ? "success" : "error"}`}>
              {debugResults.every((r) => r.success) ? "Alerter ran successfully!" : "Alerter failed to run"}
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <strong>Error:</strong> {error}
          <button className="close-btn" onClick={() => setError(null)}>
            x
          </button>
        </div>
      )}

      {successMessage && (
        <div className="alert alert-success">
          <strong>Success:</strong> {successMessage}
          <button className="close-btn" onClick={() => setSuccessMessage(null)}>
            x
          </button>
        </div>
      )}

      {showCreateForm && (
        <div className="create-form-card" ref={formRef}>
          <div className="form-header">
            <h2>{editingRule ? `Edit Rule: ${editingRule.name}` : "Create New Alerter Rule"}</h2>
            <button className="close-icon" onClick={cancelEdit}>
              x
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
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

              <div className="form-group full-width">
                <label>
                  Platform <span className="required">*</span>
                </label>
                <div className="radio-group">
                  {PLATFORM_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      className={`radio-card ${formData.platform === option.value ? "selected" : ""}`}
                    >
                      <input
                        type="radio"
                        name="platform"
                        value={option.value}
                        checked={formData.platform === option.value}
                        onChange={(e) => {
                          const newPlatform = e.target.value as Platform;
                          const availableConditions = getAvailableConditions(newPlatform);
                          // Reset to first available condition if current one is not available
                          const isCurrentConditionAvailable = availableConditions.some(
                            (opt) => opt.value === formData.condition_type
                          );
                          const newConditionType = isCurrentConditionAvailable
                            ? formData.condition_type
                            : availableConditions[0].value;
                          setFormData({ ...formData, platform: newPlatform, condition_type: newConditionType });
                        }}
                      />
                      <div className="radio-content">
                        <div>
                          <strong>{option.label}</strong>
                          <p>{option.description}</p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

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
                    const value = e.target.value === "" ? "" : Math.round(Number(e.target.value));
                    setFormData({ ...formData, timeframe_hours: value });
                  }}
                  required
                />
                <small className="form-help">Time window for checking metrics (whole hours only)</small>
              </div>

              {formData.platform === "outbrain" && (
                <div className="form-group">
                  <label htmlFor="timezone">
                    Timezone <span className="required">*</span>
                  </label>
                  <select
                    id="timezone"
                    value={formData.timezone ?? ""}
                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value || null })}
                    required
                  >
                    <option value="">Select a timezone...</option>
                    {TIMEZONE_OPTIONS.map((tz) => (
                      <option key={tz.value} value={tz.value}>
                        {tz.label}
                      </option>
                    ))}
                  </select>
                  <small className="form-help">Timezone used for alert time display in Slack notifications</small>
                </div>
              )}

              <div className="form-group full-width">
                <label>
                  Alert Scope <span className="required">*</span>
                </label>
                <div className="radio-group">
                  {SCOPE_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      className={`radio-card ${formData.scope === option.value ? "selected" : ""}`}
                    >
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

              <div className="form-group full-width">
                <label>
                  Condition Type <span className="required">*</span>
                </label>
                <div className="radio-group">
                  {CONDITION_OPTIONS.filter(
                    (option) =>
                      // Hide weekly_cpa_increase for Outbrain (not supported)
                      !(formData.platform === "outbrain" && option.value === "weekly_cpa_increase")
                  ).map((option) => (
                    <label
                      key={option.value}
                      className={`radio-card ${formData.condition_type === option.value ? "selected" : ""}`}
                    >
                      <input
                        type="radio"
                        name="condition_type"
                        value={option.value}
                        checked={formData.condition_type === option.value}
                        onChange={(e) => {
                          const newConditionType = e.target.value as ConditionType;
                          // Clear min_spend when switching to zero_conv_spend (uses threshold as spend)
                          const newMinSpend = newConditionType === "zero_conv_spend" ? null : formData.min_spend;
                          setFormData({ ...formData, condition_type: newConditionType, min_spend: newMinSpend });
                        }}
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

              <div className="form-group">
                <label htmlFor="threshold">
                  Threshold Value <span className="required">*</span>
                </label>
                <div className="input-with-prefix">
                  <span className="input-prefix">
                    {formData.condition_type === "weekly_cpa_increase" ? "%" : "$"}
                  </span>
                  <input
                    id="threshold"
                    type="number"
                    min="0"
                    step={formData.condition_type === "weekly_cpa_increase" ? "1" : "0.01"}
                    placeholder={formData.condition_type === "weekly_cpa_increase" ? "e.g., 20" : "e.g., 65.00"}
                    value={formData.threshold}
                    onChange={(e) => {
                      const value = e.target.value === "" ? "" : parseFloat(e.target.value);
                      setFormData({ ...formData, threshold: value });
                    }}
                    required
                  />
                </div>
                <small className="form-help">
                  {formData.condition_type === "cpa_threshold"
                    ? "Alert when CPA reaches this amount"
                    : formData.condition_type === "zero_conv_spend"
                    ? "Alert when spend reaches this amount with 0 conversions"
                    : "Alert when CPA increases by this percentage vs last week"}
                </small>
              </div>

              {formData.condition_type !== "zero_conv_spend" && (
                <div className="form-group">
                  <label htmlFor="min_spend">Minimum Spend (optional)</label>
                  <div className="input-with-prefix">
                    <span className="input-prefix">$</span>
                    <input
                      id="min_spend"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="e.g., 50.00"
                      value={formData.min_spend ?? ""}
                      onChange={(e) => {
                        const value = e.target.value === "" ? "" : parseFloat(e.target.value);
                        setFormData({ ...formData, min_spend: value });
                      }}
                    />
                  </div>
                  <small className="form-help">
                    Only trigger alert if spend exceeds this amount (leave empty to ignore)
                  </small>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="severity">
                  Severity Level <span className="required">*</span>
                </label>
                <select
                  id="severity"
                  value={formData.severity}
                  onChange={(e) => setFormData({ ...formData, severity: Number(e.target.value) as Severity })}
                  required
                >
                  {SEVERITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <small className="form-help">
                  Determines which Slack channel receives alerts (SEV-1: critical, SEV-2: warning, SEV-3: info)
                </small>
              </div>

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
                  <span className="toggle-label">{formData.is_active ? "Active" : "Inactive"}</span>
                </label>
                <small className="form-help">Only active rules will trigger alerts</small>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                {editingRule ? "Update Rule" : "Create Rule"}
              </button>
              <button type="button" className="btn btn-secondary" onClick={cancelEdit}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

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
          <select value={filterPlatform} onChange={(e) => setFilterPlatform(e.target.value as Platform | "all")}>
            <option value="all">All Platforms</option>
            <option value="taboola">Taboola</option>
            <option value="outbrain">Outbrain</option>
          </select>

          <select value={filterScope} onChange={(e) => setFilterScope(e.target.value as RuleScope | "all")}>
            <option value="all">All Scopes</option>
            <option value="account">Account Level</option>
            <option value="campaign">Campaign Level</option>
          </select>

          <select
            value={filterCondition}
            onChange={(e) => setFilterCondition(e.target.value as ConditionType | "all")}
          >
            <option value="all">All Conditions</option>
            <option value="cpa_threshold">CPA Threshold</option>
            <option value="zero_conv_spend">Zero Conversions</option>
            <option value="weekly_cpa_increase">Weekly CPA Increase</option>
          </select>

          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value === "all" ? "all" : (Number(e.target.value) as Severity))}
          >
            <option value="all">All Severities</option>
            <option value="1">SEV-1 (Critical)</option>
            <option value="2">SEV-2 (Warning)</option>
            <option value="3">SEV-3 (Info)</option>
          </select>

          <label className="checkbox-label">
            <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
            Show inactive rules
          </label>
        </div>
      </div>

      <div className="rules-section">
        <div className="section-header">
          <h2>Active Rules ({filteredRules.length})</h2>
        </div>

        {filteredRules.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">?</div>
            <p>No rules found</p>
            <p className="empty-subtext">
              {searchQuery || filterScope !== "all" || filterCondition !== "all"
                ? "Try adjusting your filters"
                : "Create your first alerter rule to get started"}
            </p>
          </div>
        ) : (
          <div className="rules-grid">
            {filteredRules.map((rule) => (
              <div key={rule.id} className={`rule-card ${!rule.is_active ? "inactive" : ""}`}>
                <div className="rule-header">
                  <h3>{rule.name}</h3>
                  <div className="rule-badges">
                    <span className={`badge platform ${rule.platform ?? "taboola"}`}>
                      {(rule.platform ?? "taboola").charAt(0).toUpperCase() + (rule.platform ?? "taboola").slice(1)}
                    </span>
                    <span className={`badge severity sev-${rule.severity ?? 2}`}>
                      SEV-{rule.severity ?? 2}
                    </span>
                    <span className={`badge ${rule.is_active ? "active" : "inactive"}`}>
                      {rule.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                <div className="rule-body">
                  <div className="rule-detail">
                    <span className="detail-label">Platform:</span>
                    <span className={`detail-value platform-badge ${rule.platform ?? "taboola"}`}>
                      {(rule.platform ?? "taboola").charAt(0).toUpperCase() + (rule.platform ?? "taboola").slice(1)}
                    </span>
                  </div>

                  <div className="rule-detail">
                    <span className="detail-label">Account:</span>
                    <span className="detail-value">{rule.account_name}</span>
                  </div>

                  <div className="rule-detail">
                    <span className="detail-label">Scope:</span>
                    <span className="detail-value">
                      {rule.scope === "account" ? "Account Level" : "Campaign Level"}
                    </span>
                  </div>

                  <div className="rule-detail">
                    <span className="detail-label">Condition:</span>
                    <span className="detail-value">
                      {rule.condition_type === "cpa_threshold"
                        ? "CPA Threshold"
                        : rule.condition_type === "zero_conv_spend"
                        ? "Zero Conversions"
                        : "Weekly CPA Increase"}
                    </span>
                  </div>

                  <div className="rule-detail">
                    <span className="detail-label">Threshold:</span>
                    <span className="detail-value threshold">
                      {rule.condition_type === "weekly_cpa_increase"
                        ? `${Number(rule.threshold).toFixed(0)}%`
                        : `$${Number(rule.threshold).toFixed(2)}`}
                    </span>
                  </div>

                  {rule.condition_type !== "zero_conv_spend" && rule.min_spend != null && (
                    <div className="rule-detail">
                      <span className="detail-label">Min Spend:</span>
                      <span className="detail-value">${Number(rule.min_spend).toFixed(2)}</span>
                    </div>
                  )}

                  <div className="rule-detail">
                    <span className="detail-label">Timeframe:</span>
                    <span className="detail-value">
                      {Number(rule.timeframe_hours)} hour{Number(rule.timeframe_hours) !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {rule.timezone && (
                    <div className="rule-detail">
                      <span className="detail-label">Timezone:</span>
                      <span className="detail-value">{rule.timezone}</span>
                    </div>
                  )}

                  <div className="rule-detail">
                    <span className="detail-label">Severity:</span>
                    <span className={`detail-value severity-badge sev-${rule.severity ?? 2}`}>
                      {SEVERITY_OPTIONS.find((s) => s.value === (rule.severity ?? 2))?.label ?? "SEV-2 (Warning)"}
                    </span>
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
                      title={rule.is_active ? "Deactivate" : "Activate"}
                    >
                      {rule.is_active ? "Pause" : "Play"}
                    </button>
                    <button className="btn btn-sm btn-secondary" onClick={() => duplicateRule(rule)} title="Duplicate rule">
                      Duplicate
                    </button>
                    <button className="btn btn-sm btn-secondary" onClick={() => startEdit(rule)}>
                      Edit
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(rule)}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

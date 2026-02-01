"use client";

import { useState } from "react";

interface SyncResponse {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
  syncStatus?: string;
  errors?: string[];
}

interface CronEndpoint {
  title: string;
  description: string;
  endpoint: string;
  params?: { name: string; defaultValue: number; min: number; max: number; label: string }[];
}

const realtimeEndpoints: CronEndpoint[] = [
  {
    title: "Realtime Threshold Alerts",
    description: "Run rule-based threshold alerts (uses alerter rules - no hours parameter needed)",
    endpoint: "taboola/sync-realtime-reports-threshold",
  },
  {
    title: "Realtime Comparison",
    description: "Compare current X hours vs previous X hours",
    endpoint: "taboola/sync-realtime-reports-comparison",
    params: [{ name: "hours", defaultValue: 2, min: 1, max: 24, label: "Hours" }],
  },
  {
    title: "Weekly Comparison",
    description: "Run rule-based weekly CPA comparison (uses alerter rules - no hours parameter needed)",
    endpoint: "taboola/sync-weekly-comparison",
  },
  {
    title: "Realtime vs Historical",
    description: "Compare realtime X hours vs Y days historical average",
    endpoint: "taboola/sync-realtime-vs-historical",
    params: [
      { name: "hours", defaultValue: 2, min: 1, max: 24, label: "Hours (Realtime)" },
      { name: "days", defaultValue: 2, min: 1, max: 30, label: "Days (Historical)" },
    ],
  },
];

export default function CronPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [response, setResponse] = useState<SyncResponse | null>(null);
  const [paramValues, setParamValues] = useState<Record<string, Record<string, number>>>({});

  const handleSync = async (endpoint: string, params?: Record<string, number>) => {
    setLoading(endpoint);
    setResponse(null);

    try {
      const queryParams = params
        ? new URLSearchParams(
            Object.entries(params).reduce((acc, [key, value]) => {
              acc[key] = String(value);
              return acc;
            }, {} as Record<string, string>)
          )
        : "";

      const url = `/api/cron/${endpoint}${queryParams ? `?${queryParams}` : ""}`;

      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();
      setResponse(data);
    } catch {
      setResponse({
        success: false,
        message: "Request failed",
      });
    } finally {
      setLoading(null);
    }
  };

  const getParamValue = (endpoint: string, paramName: string, defaultValue: number) => {
    return paramValues[endpoint]?.[paramName] ?? defaultValue;
  };

  const setParamValue = (endpoint: string, paramName: string, value: number) => {
    setParamValues((prev) => ({
      ...prev,
      [endpoint]: {
        ...prev[endpoint],
        [paramName]: value,
      },
    }));
  };

  return (
    <div className="cron-sync-container">
      <section className="sync-section">
        <h2>Realtime Reports</h2>
        <div className="sync-grid">
          {realtimeEndpoints.map((item) => (
            <div key={item.endpoint} className="form-card">
              <h3>{item.title}</h3>
              <p className="description">{item.description}</p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const params = item.params?.reduce((acc, param) => {
                    acc[param.name] = getParamValue(item.endpoint, param.name, param.defaultValue);
                    return acc;
                  }, {} as Record<string, number>);
                  handleSync(item.endpoint, params);
                }}
              >
                {item.params?.map((param) => (
                  <div key={param.name} className="form-group">
                    <label htmlFor={`${item.endpoint}-${param.name}`}>{param.label}:</label>
                    <input
                      id={`${item.endpoint}-${param.name}`}
                      type="number"
                      min={param.min}
                      max={param.max}
                      value={getParamValue(item.endpoint, param.name, param.defaultValue)}
                      onChange={(e) =>
                        setParamValue(item.endpoint, param.name, Number(e.target.value))
                      }
                    />
                  </div>
                ))}
                <button type="submit" disabled={loading === item.endpoint}>
                  {loading === item.endpoint ? "Syncing..." : "Sync"}
                </button>
              </form>
            </div>
          ))}
        </div>
      </section>

      {response && (
        <div className={`response-card ${response.success ? "success" : "error"}`}>
          <h3>Response</h3>
          <div className="response-status">
            <strong>Status:</strong> {response.success ? "Success" : "Failed"}
            {response.syncStatus && <span> ({response.syncStatus})</span>}
          </div>
          <div className="response-message">
            <strong>Message:</strong> {response.message}
          </div>

          {response.data && (
            <details className="response-data">
              <summary>Response Data</summary>
              <pre>{JSON.stringify(response.data, null, 2)}</pre>
            </details>
          )}

          {response.errors && response.errors.length > 0 && (
            <details className="response-errors">
              <summary>Errors ({response.errors.length})</summary>
              <ul>
                {response.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

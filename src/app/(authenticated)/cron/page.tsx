"use client";

import { useState } from "react";

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

export default function ManualTriggerAlertsPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AlertResult[]>([]);

  const triggerAllAlerts = async () => {
    setLoading(true);
    setResults([]);

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

    setResults(allResults);
    setLoading(false);
  };

  const allSuccess = results.length > 0 && results.every((r) => r.success);
  const hasErrors = results.some((r) => !r.success);

  return (
    <div className="manual-trigger-container">
      <div className="trigger-header">
        <h1>Manual Trigger Alerts</h1>
        <p className="trigger-description">
          Run all rule-based alert checks across all platforms (Taboola &amp; Outbrain)
        </p>
        <p>Note: these checks are also automatically run every hour</p>
      </div>

      <div className="trigger-action">
        <button
          className="trigger-all-btn"
          onClick={triggerAllAlerts}
          disabled={loading}
        >
          {loading ? "Running All Checks..." : "Run All Alert Checks"}
        </button>
      </div>

      {results.length > 0 && (
        <div className={`results-container ${allSuccess ? "all-success" : hasErrors ? "has-errors" : ""}`}>
          <h2>Results</h2>
          <div className="results-grid">
            {results.map((result) => (
              <div
                key={result.endpoint}
                className={`result-card ${result.success ? "success" : "error"}`}
              >
                <h3>{result.endpoint}</h3>
                <div className="result-status">
                  {result.success ? "Success" : "Failed"}
                </div>
                <p className="result-message">{result.message}</p>

                {result.data && (
                  <details className="result-data">
                    <summary>Response Data</summary>
                    <pre>{JSON.stringify(result.data, null, 2)}</pre>
                  </details>
                )}

                {result.errors && result.errors.length > 0 && (
                  <details className="result-errors">
                    <summary>Errors ({result.errors.length})</summary>
                    <ul>
                      {result.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

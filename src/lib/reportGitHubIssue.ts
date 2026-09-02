const GITHUB_OWNER = "sangeethaWeblogix";
const GITHUB_REPO = "caravansforsale-main-LIVE";
const GITHUB_API = "https://api.github.com";

export interface GitHubErrorPayload {
  errorSource: "FRONTEND" | "BACKEND";
  errorType: string;
  message: string;
  pageUrl?: string;
  digest?: string;
}

// Module-level dedup — persists within the same serverless container lifetime.
const reportedFingerprints = new Set<string>();

function getFingerprint(errorType: string, errorSource: string): string {
  return `${errorSource}:${errorType}`;
}

function classifyError(errorType: string, errorSource: "FRONTEND" | "BACKEND"): {
  emoji: string;
  category: string;
  diagnosis: string;
  severity: "critical" | "high" | "medium";
} {
  const t = errorType.toLowerCase();

  if (t.includes("no response") || t.includes("timed out")) {
    return {
      emoji: "⏱️",
      category: "API No Response / Timeout",
      diagnosis: "Backend API did not respond within 30 seconds. Possible causes: server overload, network latency, or the API is down.",
      severity: "critical",
    };
  }
  if (t.includes("missing or invalid api key") || t.includes("api key") || t.includes("forbidden") || t.includes("401") || t.includes("403")) {
    return {
      emoji: "🔑",
      category: "Missing / Invalid API Key",
      diagnosis: "The request was rejected due to a missing or invalid API key (HTTP 401/403). Check that CFS_API_KEY is correctly set in Vercel environment variables.",
      severity: "critical",
    };
  }
  if (t.includes("fetch failed") || t.includes("load failed") || t.includes("network error")) {
    return {
      emoji: "📡",
      category: "Fetch Failed / Network Error",
      diagnosis: "The client could not reach the server. Possible causes: network offline, CORS policy blocking the request, or DNS resolution failure.",
      severity: "high",
    };
  }
  if (t.includes("backend server error") || t.includes("http 5")) {
    return {
      emoji: "💥",
      category: "Backend Server Error (5xx)",
      diagnosis: "The API returned a 5xx server error. The backend crashed or encountered an unhandled exception.",
      severity: "critical",
    };
  }
  if (t.includes("api endpoint not found") || t.includes("404")) {
    return {
      emoji: "🔍",
      category: "API Endpoint Not Found (404)",
      diagnosis: "The API endpoint URL returned 404. The endpoint may have changed or been removed.",
      severity: "high",
    };
  }
  if (t.includes("invalid api response") || t.includes("non-json")) {
    return {
      emoji: "🧩",
      category: "Invalid API Response",
      diagnosis: "The API returned a non-JSON or malformed response. The backend may be returning an error page instead of JSON.",
      severity: "high",
    };
  }
  if (errorSource === "FRONTEND") {
    return {
      emoji: "📡",
      category: "Frontend Network Error",
      diagnosis: "A client-side fetch error occurred. Check browser console and network tab for details.",
      severity: "medium",
    };
  }
  return {
    emoji: "⚙️",
    category: "Backend API Error",
    diagnosis: "An unclassified backend error occurred.",
    severity: "medium",
  };
}

export async function reportGitHubIssue(payload: GitHubErrorPayload): Promise<void> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return;

  // Only report in production — skip local dev to avoid spam
  if (process.env.NODE_ENV !== "production") return;

  // ── Layer 1: In-process dedup ─────────────────────────────────────────────
  // Prevents duplicate issues when same error fires multiple times in one container.
  const fingerprint = getFingerprint(payload.errorType, payload.errorSource);
  if (reportedFingerprints.has(fingerprint)) return;
  reportedFingerprints.add(fingerprint);

  const { emoji, category, diagnosis, severity } = classifyError(payload.errorType, payload.errorSource);
  const label = payload.errorSource === "BACKEND" ? "backend-error" : "frontend-error";
  const severityLabel = severity === "critical" ? "🔴 Critical" : severity === "high" ? "🟠 High" : "🟡 Medium";
  const title = `${emoji} [${payload.errorSource}] ${category}`;

  try {
    // ── Layer 2: GitHub List Issues dedup ─────────────────────────────────────
    // Uses the List API (not Search API) — no indexing delay, so dedup works
    // even for issues created just seconds ago.
    const listRes = await fetch(
      `${GITHUB_API}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues?state=open&per_page=100`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
        },
      }
    );
    if (listRes.ok) {
      const issues: Array<{ title: string }> = await listRes.json();
      const alreadyOpen = issues.some(
        (i) => i.title.includes(`[${payload.errorSource}]`) && i.title.includes(category)
      );
      if (alreadyOpen) return;
    }

    const body = `## ${emoji} ${payload.errorSource} Error — ${category}

### Summary
> ${diagnosis}

---

### Error Details

| Field | Value |
|---|---|
| **Source** | \`${payload.errorSource}\` |
| **Category** | ${category} |
| **Severity** | ${severityLabel} |
| **Error Message** | \`${payload.errorType}\` |
${payload.pageUrl ? `| **Page URL** | \`${payload.pageUrl}\` |` : ""}
${payload.digest ? `| **Digest** | \`${payload.digest}\` |` : ""}
| **Reported at** | \`${new Date().toISOString()}\` |

### What Happened
\`\`\`
${payload.message}
\`\`\`

### Checklist
- [ ] Verify backend API is reachable: \`https://admin.caravansforsale.com.au/wp-json/cfs/v1/new_optimize_code\`
- [ ] Check \`CFS_API_KEY\` in Vercel environment variables
- [ ] Check Vercel function logs for this timeframe
- [ ] Confirm API response time is under 30s

---
*Auto-reported by production error handler — caravansforsale.com.au*`;

    await fetch(`${GITHUB_API}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title, body, labels: ["bug", label, severity] }),
    });
  } catch {
    // Never crash the app if GitHub reporting fails
  }
}

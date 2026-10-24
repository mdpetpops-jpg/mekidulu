/**
 * Read helpers for the admin dashboard. Every function degrades to an empty
 * result when a table has not been created yet, so the shell stays usable
 * before the SQL migration runs.
 */

import { getSupabaseAdmin } from "@/lib/supabase/admin";

export type LeadRow = {
  id: string;
  email: string;
  company_name: string | null;
  volume: string | null;
  status: string;
  created_at: string;
};

export type OutreachRow = {
  id: string;
  store_name: string | null;
  email: string;
  website: string | null;
  fetch_status: string | null;
  send_status: string | null;
  reply_status: string | null;
  reply_content: string | null;
  created_at: string;
};

export type AiLogRow = {
  id: string;
  scenario: string;
  input_prompt: string | null;
  output_response: string | null;
  tokens_used: number | null;
  status: string | null;
  created_at: string;
};

export type AiPromptRow = {
  id: string;
  scenario: string;
  prompt_content: string;
  is_active: boolean;
  updated_at: string;
};

export type BlogRow = {
  id: string;
  slug: string;
  title: string;
  status: string;
  cover_image: string | null;
  created_at: string;
};

function startOfTodayUtc(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
}

async function countSince(table: string, column: string, since: string): Promise<number> {
  try {
    const supabase = getSupabaseAdmin();
    const { count } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true })
      .gte(column, since);
    return count ?? 0;
  } catch {
    return 0;
  }
}

export async function getStats() {
  const since = startOfTodayUtc();

  const [leadsToday, sentToday, blogReads, visitors] = await Promise.all([
    countSince("leads", "created_at", since),
    (async () => {
      try {
        const supabase = getSupabaseAdmin();
        const { count } = await supabase
          .from("outreach_emails")
          .select("*", { count: "exact", head: true })
          .eq("send_status", "sent")
          .gte("created_at", since);
        return count ?? 0;
      } catch {
        return 0;
      }
    })(),
    (async () => {
      try {
        const supabase = getSupabaseAdmin();
        const { count } = await supabase
          .from("traffic_logs")
          .select("*", { count: "exact", head: true })
          .like("path", "/blog%")
          .gte("created_at", since);
        return count ?? 0;
      } catch {
        return 0;
      }
    })(),
    (async () => {
      try {
        const supabase = getSupabaseAdmin();
        const { data } = await supabase
          .from("traffic_logs")
          .select("ip_hash")
          .gte("created_at", since)
          .limit(2000);
        return new Set((data ?? []).map((row) => (row as { ip_hash: string | null }).ip_hash)).size;
      } catch {
        return 0;
      }
    })(),
  ]);

  return { leadsToday, sentToday, blogReads, visitors };
}

export async function getRecentLeads(limit = 5): Promise<LeadRow[]> {
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from("leads")
      .select("id, email, company_name, volume, status, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    return (data ?? []) as LeadRow[];
  } catch {
    return [];
  }
}

export async function getAllLeads(limit = 200): Promise<LeadRow[]> {
  return getRecentLeads(limit);
}

export async function getRecentAiErrors(limit = 5): Promise<AiLogRow[]> {
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from("ai_logs")
      .select("id, scenario, input_prompt, output_response, tokens_used, status, created_at")
      .eq("status", "error")
      .order("created_at", { ascending: false })
      .limit(limit);
    return (data ?? []) as AiLogRow[];
  } catch {
    return [];
  }
}

export async function getOutreachRows(limit = 200): Promise<OutreachRow[]> {
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from("outreach_emails")
      .select("id, store_name, email, website, fetch_status, send_status, reply_status, reply_content, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    return (data ?? []) as OutreachRow[];
  } catch {
    return [];
  }
}

export async function getTrafficSummary() {
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from("traffic_logs")
      .select("path, referrer, created_at")
      .limit(5000);

    const rows = (data ?? []) as { path: string; referrer: string | null }[];
    const sources = new Map<string, number>();
    const paths = new Map<string, number>();

    for (const row of rows) {
      let source = "direct";
      if (row.referrer) {
        try {
          const host = new URL(row.referrer).hostname.replace(/^www\./, "");
          source = host.includes("google")
            ? "Google"
            : host.includes("bing")
              ? "Bing"
              : host.includes("facebook")
                ? "Facebook"
                : host.includes("instagram")
                  ? "Instagram"
                  : host.includes("reddit")
                    ? "Reddit"
                    : host.includes("amazon")
                      ? "Amazon"
                      : host;
        } catch {
          source = "direct";
        }
      }
      sources.set(source, (sources.get(source) ?? 0) + 1);
      paths.set(row.path, (paths.get(row.path) ?? 0) + 1);
    }

    const top = (map: Map<string, number>, limit: number) =>
      [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);

    return {
      total: rows.length,
      sources: top(sources, 8),
      paths: top(paths, 10),
    };
  } catch {
    return { total: 0, sources: [], paths: [] };
  }
}

export async function getPrompts(): Promise<AiPromptRow[]> {
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from("ai_prompts")
      .select("id, scenario, prompt_content, is_active, updated_at")
      .order("scenario", { ascending: true });
    return (data ?? []) as AiPromptRow[];
  } catch {
    return [];
  }
}

export async function getAiLogs(limit = 30): Promise<AiLogRow[]> {
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from("ai_logs")
      .select("id, scenario, input_prompt, output_response, tokens_used, status, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    return (data ?? []) as AiLogRow[];
  } catch {
    return [];
  }
}

export type VisitorRow = {
  id: string;
  session_id: string | null;
  country: string | null;
  device_type: string | null;
  path: string;
  duration: number;
  created_at: string;
};

export async function getVisitorRows(limit = 100): Promise<VisitorRow[]> {
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from("visitor_logs")
      .select("id, session_id, country, device_type, path, duration, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    return (data ?? []) as VisitorRow[];
  } catch {
    return [];
  }
}

export type EmailLogRow = {
  id: string;
  recipient_email: string;
  subject: string | null;
  email_body: string | null;
  email_type: string;
  status: string;
  created_at: string;
};

export async function getEmailLogs(limit = 200): Promise<EmailLogRow[]> {
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from("email_logs")
      .select("id, recipient_email, subject, email_body, email_type, status, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    return (data ?? []) as EmailLogRow[];
  } catch {
    return [];
  }
}

export type AiUsage = {
  totalCalls: number;
  totalTokens: number;
  todayCalls: number;
  todayTokens: number;
  byScenario: [string, { calls: number; tokens: number; errors: number }][];
};

export async function getAiUsage(limit = 1000): Promise<AiUsage> {
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from("ai_logs")
      .select("scenario, tokens_used, status, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    const rows = (data ?? []) as { scenario: string; tokens_used: number | null; status: string | null; created_at: string }[];
    const since = startOfTodayUtc();
    const byScenario = new Map<string, { calls: number; tokens: number; errors: number }>();

    let totalTokens = 0;
    let todayCalls = 0;
    let todayTokens = 0;

    for (const row of rows) {
      const tokens = row.tokens_used ?? 0;
      totalTokens += tokens;
      if (row.created_at >= since) {
        todayCalls += 1;
        todayTokens += tokens;
      }
      const entry = byScenario.get(row.scenario) ?? { calls: 0, tokens: 0, errors: 0 };
      entry.calls += 1;
      entry.tokens += tokens;
      if (row.status === "error") entry.errors += 1;
      byScenario.set(row.scenario, entry);
    }

    return {
      totalCalls: rows.length,
      totalTokens,
      todayCalls,
      todayTokens,
      byScenario: [...byScenario.entries()].sort((a, b) => b[1].calls - a[1].calls),
    };
  } catch {
    return { totalCalls: 0, totalTokens: 0, todayCalls: 0, todayTokens: 0, byScenario: [] };
  }
}

export async function getBlogRows(): Promise<BlogRow[]> {
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from("blog_posts")
      .select("id, slug, title, status, cover_image, created_at")
      .order("created_at", { ascending: false });
    return (data ?? []) as BlogRow[];
  } catch {
    return [];
  }
}

export async function getBlogRow(id: string): Promise<(BlogRow & { content: string }) | null> {
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from("blog_posts")
      .select("id, slug, title, status, cover_image, created_at, content")
      .eq("id", id)
      .maybeSingle();
    return (data as (BlogRow & { content: string }) | null) ?? null;
  } catch {
    return null;
  }
}

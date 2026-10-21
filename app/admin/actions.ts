"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isAdmin } from "@/lib/admin/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

export async function savePrompt(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  const scenario = String(formData.get("scenario") ?? "").trim();
  const promptContent = String(formData.get("prompt_content") ?? "");
  const isActive = formData.get("is_active") === "on";

  if (!scenario || !promptContent.trim()) return;

  const supabase = getSupabaseAdmin();
  if (id) {
    await supabase
      .from("ai_prompts")
      .update({ scenario, prompt_content: promptContent, is_active: isActive, updated_at: new Date().toISOString() })
      .eq("id", id);
  } else {
    await supabase
      .from("ai_prompts")
      .insert({ scenario, prompt_content: promptContent, is_active: isActive });
  }

  revalidatePath("/admin/ai");
}

export async function createBlogPost() {
  await requireAdmin();
  const supabase = getSupabaseAdmin();
  const title = "Untitled draft";
  const slug = `draft-${Date.now().toString(36)}`;
  const { data } = await supabase
    .from("blog_posts")
    .insert({ slug, title, content: "Write the article here in Markdown.", status: "draft" })
    .select("id")
    .single();

  revalidatePath("/admin/blog");
  if (data?.id) redirect(`/admin/blog/${data.id}`);
}

export async function saveBlogPost(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const rawSlug = String(formData.get("slug") ?? "").trim();
  const content = String(formData.get("content") ?? "");
  const cover = String(formData.get("cover_image") ?? "").trim();

  if (!id || !title) return;

  const supabase = getSupabaseAdmin();
  await supabase
    .from("blog_posts")
    .update({
      title,
      slug: slugify(rawSlug || title),
      content,
      cover_image: cover || null,
    })
    .eq("id", id);

  revalidatePath("/admin/blog");
  revalidatePath(`/admin/blog/${id}`);
  revalidatePath("/blog");
}

export async function setBlogStatus(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "draft");
  if (!id) return;

  const supabase = getSupabaseAdmin();
  await supabase.from("blog_posts").update({ status }).eq("id", id);

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  revalidatePath("/sitemap.xml");
}

export async function deleteBlogPost(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = getSupabaseAdmin();
  await supabase.from("blog_posts").delete().eq("id", id);

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  redirect("/admin/blog");
}

export async function setOutreachReply(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const replyStatus = String(formData.get("reply_status") ?? "");
  const replyContent = String(formData.get("reply_content") ?? "").trim();
  if (!id) return;

  const supabase = getSupabaseAdmin();
  await supabase
    .from("outreach_emails")
    .update({
      reply_status: replyStatus || null,
      reply_content: replyContent || null,
    })
    .eq("id", id);

  revalidatePath("/admin/outreach");
}

/**
 * Bulk import. One prospect per line, comma or pipe separated:
 *   Store Name, https://store.com, buyer@store.com
 *   https://store.com            (email left blank — the crawler fills it)
 *   buyer@store.com              (email only)
 */
export async function importProspects(formData: FormData) {
  await requireAdmin();
  const raw = String(formData.get("bulk") ?? "");
  const source = String(formData.get("source") ?? "manual").trim() || "manual";

  const lines = raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 200);

  if (lines.length === 0) return;

  const rows = lines
    .map((line) => {
      const parts = line.split(/[|,;\t]/).map((part) => part.trim()).filter(Boolean);
      let storeName: string | null = null;
      let website: string | null = null;
      let email: string | null = null;

      for (const part of parts) {
        if (/^https?:\/\//i.test(part) || /^[\w-]+\.[a-z]{2,}(\/.*)?$/i.test(part)) {
          website = /^https?:\/\//i.test(part) ? part : `https://${part}`;
        } else if (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(part)) {
          email = part.toLowerCase();
        } else if (!storeName) {
          storeName = part;
        }
      }

      if (!website && !email) return null;
      return {
        store_name: storeName,
        website,
        email: email ?? null,
        source,
        fetch_status: email ? "fetched" : "pending",
        send_status: email ? "pending" : "pending",
      };
    })
    .filter(Boolean) as Record<string, unknown>[];

  if (rows.length === 0) return;

  const supabase = getSupabaseAdmin();
  await supabase.from("outreach_emails").insert(rows);

  revalidatePath("/admin/sources");
  revalidatePath("/admin/outreach");
}

export async function requeueFetch(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = getSupabaseAdmin();
  await supabase.from("outreach_emails").update({ fetch_status: "pending" }).eq("id", id);

  revalidatePath("/admin/sources");
}

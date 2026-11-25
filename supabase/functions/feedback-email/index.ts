// Emails Kevin a copy of each new "Suggest an Idea or Report a Bug" note (table from supabase/feedback.sql).
// The site calls this right after a signed-in member sends a note. It only ever emails that member's own
// notes that haven't been emailed yet, so calling it again can't send extra emails.
//
// The one secret it needs (Supabase: Edge Functions > Secrets): RESEND_API_KEY, an API key from Resend
// (resend.com > API Keys) with access to edsidekick.com. FEEDBACK_TO is optional (default hello@edsidekick.com).
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided by Supabase automatically.
// Deploy with "Verify JWT" turned OFF: the function checks the caller's sign-in itself (auth.getUser below),
// which works with both the old and the new Supabase key styles.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

const admin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
const TO = Deno.env.get('FEEDBACK_TO') || 'hello@edsidekick.com';
const FROM = 'ED Sidekick Feedback <feedback@edsidekick.com>';
const KINDS: Record<string, [string, string, string]> = {
  tool: ['Tool Idea', '#7C5CFF', '🧰'],
  idea: ['Idea', '#E8A100', '💡'],
  bug: ['Bug', '#E5397A', '🐞'],
};
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function esc(s: unknown) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}
function when(iso: string) {
  try {
    return new Date(iso).toLocaleString('en-US', { timeZone: 'America/New_York', dateStyle: 'medium', timeStyle: 'short' }) + ' (Eastern)';
  } catch { return iso; }
}

function email(f: any) {
  const [label, color, emoji] = KINDS[f.kind] ?? ['Note', '#2563EB', '✉️'];
  const row = (k: string, v: string) => v ? `<tr><td style="padding:6px 0;color:#5E6378;font-size:14px;width:110px;vertical-align:top">${k}</td><td style="padding:6px 0;font-size:14px;color:#0E1120">${v}</td></tr>` : '';
  const html = `<!doctype html><html><body style="margin:0;background:#F4F5FA;font-family:'Segoe UI',Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F5FA;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:20px;overflow:hidden;border:1px solid #E3E6EF">
<tr><td style="background:${color};padding:18px 24px;color:#fff;font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase">${emoji} New ${esc(label)} on ED Sidekick</td></tr>
<tr><td style="padding:24px">
<p style="margin:0 0 6px;font-size:13px;color:#5E6378">From</p>
<p style="margin:0 0 18px;font-size:18px;font-weight:700;color:#0E1120">${esc(f.name || 'Someone')} <span style="font-weight:400;color:#5E6378;font-size:15px">&lt;${esc(f.email)}&gt;</span></p>
<div style="background:#F4F5FA;border-left:4px solid ${color};border-radius:12px;padding:16px 18px;font-size:16px;line-height:1.55;color:#0E1120;white-space:pre-wrap">${esc(f.message)}</div>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:18px;width:100%">
${row('Type', esc(label))}${row('Sent', esc(when(f.created_at)))}${row('Page', f.page ? `<a href="https://edsidekick.com${esc(f.page)}" style="color:#2563EB">${esc(f.page)}</a>` : '')}${row('Browser', esc(f.browser))}
</table>
<p style="margin:22px 0 0"><a href="https://edsidekick.com/owner" style="display:inline-block;background:#0E1120;color:#fff;text-decoration:none;font-weight:700;padding:12px 18px;border-radius:12px">Open the Owner Dashboard</a></p>
<p style="margin:16px 0 0;font-size:13px;color:#5E6378">Press Reply to answer ${esc(f.name || 'them')} directly.</p>
</td></tr></table></td></tr></table></body></html>`;
  const text = `New ${label} on ED Sidekick\n\nFrom: ${f.name || 'Someone'} <${f.email}>\nSent: ${when(f.created_at)}\nPage: ${f.page || ''}\nBrowser: ${f.browser || ''}\n\n${f.message}\n\nOwner Dashboard: https://edsidekick.com/owner`;
  const short = String(f.message).replace(/\s+/g, ' ').slice(0, 60);
  return { subject: `${emoji} ${label} from ${f.name || 'a member'}: ${short}${String(f.message).length > 60 ? '…' : ''}`, html, text };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
  const key = Deno.env.get('RESEND_API_KEY');
  if (!key) return json({ ok: false, reason: 'no_key' }, 500);

  const jwt = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  const { data: who } = await admin.auth.getUser(jwt);
  const user = who?.user;
  if (!user) return json({ ok: false, reason: 'signed_out' }, 401);

  // This member's notes from the last hour that haven't been emailed yet (at most 3, the spam limit).
  const since = new Date(Date.now() - 3600e3).toISOString();
  const { data: rows } = await admin.from('feedback').select('*')
    .eq('user_id', user.id).is('emailed_at', null).gte('created_at', since).order('created_at').limit(3);

  let sent = 0;
  for (const f of rows ?? []) {
    // Claim the note first so two calls at once can't both email it.
    const { data: claimed } = await admin.from('feedback').update({ emailed_at: new Date().toISOString() })
      .eq('id', f.id).is('emailed_at', null).select('id');
    if (!claimed?.length) continue;
    const m = email(f);
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, to: [TO], reply_to: f.email || undefined, subject: m.subject, html: m.html, text: m.text }),
    });
    if (res.ok) sent++;
    else await admin.from('feedback').update({ emailed_at: null }).eq('id', f.id);
  }
  return json({ ok: true, sent });
});

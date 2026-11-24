// Stripe tells this function when someone pays for Premium or cancels, and it updates their plan.
// The one secret it needs (Supabase: Edge Functions > Secrets): STRIPE_WEBHOOK_SECRET, the webhook's signing secret (whsec_...).
// It never calls Stripe back, so no Stripe secret key is needed. SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided by Supabase automatically.
// Deploy with "Verify JWT" turned OFF: Stripe proves each message with its signature instead.
import Stripe from 'npm:stripe@14.25.0';
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || 'sk_not_needed', { apiVersion: '2023-10-16', httpClient: Stripe.createFetchHttpClient() });
const cryptoProvider = Stripe.createSubtleCryptoProvider();
const admin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

async function setPlanByCustomer(customer: string, plan: 'free' | 'premium') {
  await admin.from('profiles').update({ plan }).eq('stripe_customer', customer).neq('plan', 'owner');
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('ok');
  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, req.headers.get('stripe-signature') ?? '', Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '', undefined, cryptoProvider);
  } catch {
    return new Response('Bad signature', { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const s = event.data.object as Stripe.Checkout.Session;
    // The site adds the teacher's account id to the payment link as client_reference_id.
    if (s.client_reference_id) {
      await admin.from('profiles')
        .update({ plan: 'premium', stripe_customer: typeof s.customer === 'string' ? s.customer : s.customer?.id ?? null })
        .eq('id', s.client_reference_id).neq('plan', 'owner');
    }
  } else if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription;
    const customer = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
    const active = event.type === 'customer.subscription.updated' && ['active', 'trialing', 'past_due'].includes(sub.status);
    await setPlanByCustomer(customer, active ? 'premium' : 'free');
  }
  // Record each payment for the Owner Dashboard's income numbers (table from owner-dashboard.sql).
  if (event.type === 'invoice.paid') {
    const inv = event.data.object as Stripe.Invoice;
    const customer = typeof inv.customer === 'string' ? inv.customer : inv.customer?.id;
    let { data: who } = await admin.from('profiles').select('id').eq('stripe_customer', customer ?? '').maybeSingle();
    // The very first invoice can arrive before checkout links the customer, so fall back to the email.
    if (!who && inv.customer_email) ({ data: who } = await admin.from('profiles').select('id').eq('email', inv.customer_email).maybeSingle());
    // Newer Stripe API versions no longer put the price on the invoice line, so fall back to the billing period's length.
    const line: any = inv.lines?.data?.[0];
    const days = line?.period ? (line.period.end - line.period.start) / 86400 : 0;
    const billing = line?.price?.recurring?.interval ?? (days > 60 ? 'year' : days > 0 ? 'month' : null);
    await admin.from('payments').upsert({
      user_id: who?.id ?? null, stripe_invoice: inv.id, amount_cents: inv.amount_paid ?? 0, currency: inv.currency,
      billing, status: 'paid',
      paid_at: new Date((inv.status_transitions?.paid_at ?? inv.created) * 1000).toISOString(),
    }, { onConflict: 'stripe_invoice' });
  } else if (event.type === 'charge.refunded') {
    const ch: any = event.data.object;
    const invoice = typeof ch.invoice === 'string' ? ch.invoice : ch.invoice?.id;
    if (invoice) {
      await admin.from('payments').update({ status: 'refunded' }).eq('stripe_invoice', invoice);
    } else if (ch.customer) {
      // Newer Stripe API versions leave the invoice off the charge: mark this customer's latest paid payment of the same amount.
      const customer = typeof ch.customer === 'string' ? ch.customer : ch.customer.id;
      const { data: who } = await admin.from('profiles').select('id').eq('stripe_customer', customer).maybeSingle();
      if (who) {
        const { data: pay } = await admin.from('payments').select('stripe_invoice').eq('user_id', who.id).eq('status', 'paid')
          .eq('amount_cents', ch.amount ?? -1).order('paid_at', { ascending: false }).limit(1).maybeSingle();
        if (pay) await admin.from('payments').update({ status: 'refunded' }).eq('stripe_invoice', pay.stripe_invoice);
      }
    }
  }
  return new Response('ok');
});

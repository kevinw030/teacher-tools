// Stripe tells this function when someone pays for Premium or cancels, and it updates their plan.
// Secrets it needs (Supabase: Edge Functions > Secrets): STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET.
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided by Supabase automatically.
import Stripe from 'npm:stripe@14.25.0';
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', { apiVersion: '2023-10-16' });
const admin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

async function setPlanByCustomer(customer: string, plan: 'free' | 'premium') {
  await admin.from('profiles').update({ plan }).eq('stripe_customer', customer).neq('plan', 'owner');
}

Deno.serve(async (req) => {
  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, req.headers.get('stripe-signature') ?? '', Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '');
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
  return new Response('ok');
});

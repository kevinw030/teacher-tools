// Account settings. While supabaseUrl and supabaseKey are empty, accounts are switched off:
// there is no Sign In button, nothing goes online, and every tool works with no limits,
// exactly like before. See ACCOUNTS-SETUP.md for how to fill these in.
window.TT_ACCOUNT_CONFIG = {
  // From Supabase: Project Settings > API. The "anon public" key is safe to put here.
  supabaseUrl: '',
  supabaseKey: '',

  // Show "Continue with Google" (turn on after setting up Google sign-in in Supabase).
  google: false,

  // From Stripe: Payment Links for the Premium plan. Leave empty until payments are ready.
  premiumMonthlyLink: '',
  premiumYearlyLink: '',
  // From Stripe: the customer portal link, so members can change or cancel their plan.
  manageLink: '',

  // Prices shown on the plans card.
  priceMonthly: '$3.99',
  priceYearly: '$29',

  // Class lists, class jobs, seating charts and exit tickets can hold students' names.
  // 'never' keeps them on each computer only, 'choose' gives each teacher an on/off switch,
  // 'always' saves them to the teacher's account.
  classSync: 'always'
};

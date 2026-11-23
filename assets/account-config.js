// Account settings. While supabaseUrl and supabaseKey are empty, accounts are switched off:
// there is no Sign In button, nothing goes online, and every tool works with no limits,
// exactly like before. See ACCOUNTS-SETUP.md for how to fill these in.
window.TT_ACCOUNT_CONFIG = {
  // From Supabase: Project Settings > API. The publishable (anon) key is safe to put here.
  supabaseUrl: 'https://nipdxclfxmnbfrzubmrw.supabase.co',
  supabaseKey: 'sb_publishable_w2dYfWHQZioh3fXWZt1SfA_XQEzomTk',

  // true once the sign-in email includes a typed code ({{ .Token }}), which needs custom email (SMTP)
  // in Supabase. While false, teachers sign in by tapping the link in the email.
  emailCode: false,

  // Show "Continue with Google" (turn on after setting up Google sign-in in Supabase).
  google: true,

  // The paid plans. Members see two: Plus (inside the code and the database it is still called
  // 'premium', so older accounts keep working) and Premium (the top plan, Coming Soon for now).
  // Yearly = 25% off twelve months, rounded to .99. Early Access takes earlyDiscount off for people who
  // join before earlyUntil (the early prices hide themselves after that date).

  // Plus. From Stripe: Payment Links for the four Plus prices. Leave empty until payments are ready.
  premiumMonthlyLink: '',  // Plus monthly, $3.99
  premiumYearlyLink: '',   // Plus yearly, $35.99
  earlyMonthlyLink: '',    // Plus Early Access monthly, $2.59
  earlyYearlyLink: '',     // Plus Early Access yearly, $23.39
  priceMonthly: '$3.99',
  priceYearly: '$35.99',
  earlyDiscount: 0.35,
  earlyUntil: '2027-01-01',

  // Premium (top plan, live quiz games later). While topOpen is false its column says Coming Soon
  // and nobody can buy it. Turning it on also needs the new plan in the database and the Stripe webhook. Links for when it launches: monthly, yearly, early monthly, early yearly.
  topOpen: false,
  topPriceMonthly: '$7.99',
  topPriceYearly: '$71.99',
  topMonthlyLink: '',
  topYearlyLink: '',
  topEarlyMonthlyLink: '',
  topEarlyYearlyLink: '',

  // From Stripe: the customer portal link, so members can change or cancel their plan.
  manageLink: '',

  // Class lists, class jobs, seating charts and exit tickets can hold students' names.
  // 'never' keeps them on each computer only, 'choose' gives each teacher an on/off switch,
  // 'always' saves them to the teacher's account.
  classSync: 'always'
};

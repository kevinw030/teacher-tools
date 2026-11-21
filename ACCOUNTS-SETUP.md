# Setting Up Accounts and Plans

The site already has everything built for sign-in, cloud saving and plans. It stays switched off
(no Sign In button, nothing online, no limits) until the keys in `assets/account-config.js` are filled in.

Part 1 turns on accounts (about 15 minutes, free). Part 2 turns on payments (about 20 minutes, whenever you're ready).

## Part 1: Accounts (Supabase, free)

1. Go to https://supabase.com, sign up (Sign in with GitHub is easiest) and choose **New Project**.
   Name it `teacher-tools`, make up a database password (save it somewhere), pick the region closest to you, and choose the **Free** plan.
2. When it's ready, open **SQL Editor > New query**, paste everything from `supabase/setup.sql`, and press **Run**.
3. Open **Authentication > URL Configuration**:
   - Site URL: `https://kevinw030.github.io/teacher-tools/`
   - Redirect URLs: add `https://kevinw030.github.io/teacher-tools/**`
4. Open **Authentication > Email Templates**. In both **Magic Link** and **Confirm Signup**, add this line to the message
   so the email includes a code teachers can type on another device:
   `<p>Or type this code: <b>{{ .Token }}</b></p>`
5. Open **Project Settings > API** and copy two things into `assets/account-config.js`:
   - **Project URL** goes in `supabaseUrl`
   - **anon public** key goes in `supabaseKey` (this one is safe to be public; never use the `service_role` key here)
   Or just paste both to Claude and it will do it.
6. Open the site, choose **Sign In**, and sign in with your email.
7. Back in **SQL Editor**, run this with your email, so your account has everything free:
   `update public.profiles set plan = 'owner' where email = 'your-email-here';`

### Optional: Continue with Google
Authentication > Sign In / Providers > Google. It needs a Google Cloud "OAuth client" (Supabase links the steps).
Then set `google: true` in `assets/account-config.js`.

### Before sharing with other teachers
Supabase's built-in email only sends a few sign-in emails an hour. Before inviting others, connect a free email
sender (for example Resend, 3,000 emails a month free) under **Project Settings > Authentication > SMTP Settings**.

## Part 2: Payments (Stripe)

1. Sign up at https://stripe.com and finish the account details (business info and the bank account for payouts).
2. **Product catalog > Add product**: "Teacher Tools Premium" with two prices: $3.99 monthly and $29 yearly (recurring).
3. **Payment Links**: make one link for each price. Under After Payment, choose "Don't show confirmation page" and
   redirect to `https://kevinw030.github.io/teacher-tools/#account`.
   Put the links in `premiumMonthlyLink` and `premiumYearlyLink`.
4. **Settings > Billing > Customer portal**: turn it on and copy its link into `manageLink`, so members can cancel or switch.
5. In Supabase, **Edge Functions > Deploy a new function > Via Editor**, name it `stripe-webhook`, paste
   `supabase/functions/stripe-webhook/index.ts`, and turn **off** "Verify JWT" (Stripe signs its messages instead).
6. In Stripe, **Developers > Webhooks > Add endpoint**:
   - URL: `https://YOUR-PROJECT.supabase.co/functions/v1/stripe-webhook`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copy the **Signing secret**.
7. In Supabase, **Edge Functions > Secrets**, add `STRIPE_SECRET_KEY` (Stripe: Developers > API keys > Secret key)
   and `STRIPE_WEBHOOK_SECRET` (the signing secret from step 6).
8. Test with Stripe's **Test mode** first (card 4242 4242 4242 4242), then switch to live.

## How It Works

- **Guests** (not signed in) save on that computer only, like before, with Free plan limits.
- **Signed in**: everything saves to the account a few seconds after each change, and loads on any computer.
  If something changed on another computer while the site is open, a note offers to load it.
- **No student logins, ever.** Accounts are for teachers only. Students will join with a class code instead (see `docs/STUDENT-ACCESS.md`).
- **Student names stay on the computer.** Class lists, class jobs, seating charts, exit tickets and the pet's helper are
  never sent online (`classSync: 'never'` in `assets/account-config.js`). Use the backup file to move them between computers.
  `'choose'` gives each teacher an on/off switch instead, and `'always'` saves them to the account.
- **Signing out** clears that account's things from the computer (they stay safe in the account), which suits shared school computers.
- **Plans**: Free = 1 board screen, 2 class lists, 25 of your own questions and rooms, no photo backgrounds.
  Premium and Owner = 10 screens and the rest unlimited. Nothing is deleted when someone is over a limit; they just can't add more.
  The numbers live at the top of `assets/account.js`; prices and links in `assets/account-config.js`.
- **Giving Premium by hand**: `update public.profiles set plan = 'premium' where email = '...';`

## Costs

- Supabase: free up to 50,000 monthly users and 500 MB of saved data (roughly thousands of teachers). Pro is $25/month after that.
- Stripe: no monthly fee. 2.9% + 30¢ per payment (about 42¢ of each $3.99 month, $1.14 of each $29 year).
- Email sender: free up to 3,000 emails a month.

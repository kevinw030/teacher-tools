# Setting Up Accounts and Plans

The site already has everything built for sign-in, cloud saving and plans. It stays switched off
(no Sign In button, nothing online, no limits) until the keys in `assets/account-config.js` are filled in.

Part 1 turns on accounts (about 15 minutes, free). Part 2 turns on payments (about 20 minutes, whenever you're ready).

## Part 0: The edsidekick.com Domain

The site uses only relative paths, so it works the same at `edsidekick.com` as at `kevinw030.github.io/teacher-tools/`.

1. In Namecheap: **Domain List > Manage > Advanced DNS**. Delete the default parking records, then add:
   - Four **A Records**, Host `@`, values `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - One **CNAME Record**, Host `www`, value `kevinw030.github.io.`
2. On GitHub: **kevinw030/teacher-tools > Settings > Pages > Custom domain**, type `edsidekick.com` and press **Save**.
   GitHub adds a `CNAME` file to the repository for you. When the DNS check turns green (minutes to a few hours), tick **Enforce HTTPS**.
3. After that, the old `kevinw030.github.io/teacher-tools/` address forwards to `edsidekick.com` automatically.

Do step 2 after step 1, so the old address doesn't forward to a domain that isn't pointing anywhere yet.

## Part 1: Accounts (Supabase, free)

1. Go to https://supabase.com, sign up (Sign in with GitHub is easiest) and choose **New Project**.
   Name it `teacher-tools`, make up a database password (save it somewhere), pick the region closest to you, and choose the **Free** plan.
2. When it's ready, open **SQL Editor > New query**, paste everything from `supabase/setup.sql`, and press **Run**.
3. Open **Authentication > URL Configuration**:
   - Site URL: `https://edsidekick.com`
   - Redirect URLs: add `https://edsidekick.com/**`, `https://www.edsidekick.com/**` and `https://kevinw030.github.io/teacher-tools/**`
4. Open **Authentication > Sign In / Providers > Email**:
   - Leave **Enable Email provider** on.
   - Turn **Confirm email** off for now, so new accounts can log in right away. (Supabase's built-in email only sends a few emails an hour.
     Turn it back on after setting up Custom Email below.)
   - Set **Minimum password length** to `8` and press **Save**.
   People sign up with first name, email and password, or with Google. "Forgot password?" emails a reset link (also limited to a few an hour until Custom Email is set up).
5. Done: the project URL and publishable key are already in `assets/account-config.js` (project `nipdxclfxmnbfrzubmrw`).
6. Open the site, choose **Sign In**, and sign in with your email.
7. Back in **SQL Editor**, run this with your email, so your account has everything free:
   `update public.profiles set plan = 'owner' where email = 'your-email-here';`

### Continue with Google (about 10 minutes)
This adds a "Continue with Google" button above the email sign-in, so teachers can use their school or personal Google account.

1. In Supabase, open **Authentication > Sign In / Providers > Google** and copy the **Callback URL** shown there
   (it looks like `https://YOUR-PROJECT.supabase.co/auth/v1/callback`). Leave this tab open.
2. Go to https://console.cloud.google.com and sign in with your Google account. At the top, choose
   **Select a project > New Project**, name it `Teacher Tools`, and press **Create**.
3. Open **APIs & Services > OAuth consent screen** (Google may call it **Google Auth Platform > Branding**) and press **Get Started**:
   - App name: `Teacher Tools`; support email: your email
   - Audience: **External**
   - Contact email: your email, then agree and press **Create**
4. Under **Branding**, add the app home page `https://edsidekick.com` and authorized domain `edsidekick.com`, and under **Authorized domains** add `supabase.co`.
   Under **Data Access**, the only scopes needed are `email`, `profile` and `openid` (the defaults).
5. Open **Clients > Create Client** (or **APIs & Services > Credentials > Create Credentials > OAuth client ID**):
   - Application type: **Web application**, name: `Teacher Tools`
   - Authorized JavaScript origins: `https://edsidekick.com` and `https://kevinw030.github.io`
   - Authorized redirect URIs: the **Callback URL** you copied from Supabase in step 1
   - Press **Create**, then copy the **Client ID** and **Client Secret**.
6. Back in Supabase on the Google provider page, turn **Enable Sign in with Google** on, paste the Client ID and
   Client Secret, and press **Save**.
7. In Google Cloud, open **Audience** and press **Publish App** so any teacher can sign in, not only test users.
   (Google may show an "unverified app" note until it reviews the app; with only email and profile, review is usually quick or not needed.)
8. Set `google: true` in `assets/account-config.js`, or tell Claude and it will do it.

If a school's Google Workspace blocks outside apps, those teachers can still use the email code.
### Custom Email (before sharing with other teachers)
Supabase's built-in email sends only a few sign-in emails an hour and won't let you edit the templates. Connect your own sender:

1. Sign up at https://resend.com (free: 3,000 emails a month, 100 a day).
2. **Domains > Add Domain**: `edsidekick.com`. Resend shows a few DNS records (TXT and MX). Add them in Namecheap under
   **Advanced DNS**, then press **Verify** in Resend.
3. **API Keys > Create API Key** (sending access) and copy it.
4. In Supabase: **Authentication > Emails > SMTP Settings**, turn on custom SMTP:
   - Sender email `hello@edsidekick.com`, sender name `ED Sidekick`
   - Host `smtp.resend.com`, port `465`, username `resend`, password: the API key
5. Now the templates unlock. Change the wording of **Confirm signup** and **Reset Password** to ED Sidekick if you like.
6. Turn **Confirm email** back on (Authentication > Sign In / Providers > Email).

## Part 2: Payments (Stripe)

1. Sign up at https://stripe.com and finish the account details (business info and the bank account for payouts).
2. **Product catalog > Add product**: "Teacher Tools Premium" with two prices: $3.99 monthly and $29 yearly (recurring).
3. **Payment Links**: make one link for each price. Under After Payment, choose "Don't show confirmation page" and
   redirect to `https://edsidekick.com/#account`.
   Put the links in `premiumMonthlyLink` and `premiumYearlyLink`.
   For **Early Access**, add two more prices to the same product, $2.99 monthly and $21.75 yearly (25% off), make a Payment Link
   for each, and put them in `earlyMonthlyLink` and `earlyYearlyLink`. The Early Access column hides itself on January 1, 2027
   (`earlyUntil`); people who already joined keep their discounted price in Stripe.
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
- **Anyone 13 or older can make an account** (first name, email, password, or Google). People who join an activity with a class code never make an account and nothing about them is saved (see `docs/STUDENT-ACCESS.md`).
- **Student names save to the teacher's account** (Kevin's choice): class lists, class jobs, seating charts, exit tickets and the pet's helper
  follow the teacher to any computer (`classSync: 'always'` in `assets/account-config.js`). Only the teacher can read them.
  `'never'` keeps them on each computer instead, and `'choose'` gives each teacher an on/off switch.
- **Signing out** clears that account's things from the computer (they stay safe in the account), which suits shared school computers.
- **Plans**: Free = 1 board screen, 2 class lists, 25 of your own questions and rooms, no photo backgrounds.
  Premium and Owner = 10 screens and the rest unlimited. Nothing is deleted when someone is over a limit; they just can't add more.
  The numbers live at the top of `assets/account.js`; prices and links in `assets/account-config.js`.
- **Giving Premium by hand**: `update public.profiles set plan = 'premium' where email = '...';`

## Costs

- Supabase: free up to 50,000 monthly users and 500 MB of saved data (roughly thousands of teachers). Pro is $25/month after that.
- Stripe: no monthly fee. 2.9% + 30¢ per payment (about 42¢ of each $3.99 month, $1.14 of each $29 year).
- Email sender: free up to 3,000 emails a month.

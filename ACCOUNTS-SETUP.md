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

## Part 1b: Owner Dashboard (one paste)

The Owner Dashboard (edsidekick.com/#owner, or the green Dashboard button in the top bar) shows visits, the most-used tools and games, every account, members, Premium sign-ups and income. Only accounts with plan = 'owner' can see any of it: the database checks this itself, so the public page code can't reveal anything.

1. Supabase > **SQL Editor** > **New query**.
2. Paste everything from `supabase/owner-dashboard.sql` and click **Run**. (Safe to run again later.)
3. Open the dashboard on the site. Visits count from this moment on.

Part 2's webhook step includes the two extra events (`invoice.paid`, `charge.refunded`) that fill in Income.

## Part 2: Payments (Stripe, about 30 minutes)

Everything on the site is already built. You make four Payment Links for **Plus** and one webhook in Stripe, and Claude pastes the links in.
The plan buttons say **Coming Soon** until then.

**Plan names:** members see **Free**, **Plus** and **Premium**. Plus is the paid plan that is live; inside the code and the
database it is still called `premium`, so nothing in Supabase changes. **Premium** is the new top plan (live quiz games later):
it shows as **Coming Soon** at $7.99 a month and can't be bought yet, so it needs nothing in Stripe tonight.

**Never paste a Stripe secret key (`sk_...`) or signing secret (`whsec_...`) into a chat or into the site's files.**
The signing secret goes in one place only: Supabase's Secrets page (step 5). Payment Links (`https://buy.stripe.com/...`) are safe to share.

### 1. Make the account
1. Sign up at https://stripe.com. For business type, **Individual / sole proprietor** is fine. Website: `https://edsidekick.com`.
2. Finish the details Stripe asks for (your info and the bank account for payouts). You can do steps 2 to 6 in **Test mode**
   (Stripe may call it a **Sandbox**) while it checks your details.

### 2. Make the Plus product and four prices
**Product catalog > Add product**, name it `ED Sidekick Plus`, and add four **Recurring** prices:

| Price | Amount | Billing |
|---|---|---|
| Plus Monthly | $3.99 | Monthly |
| Plus Yearly | $35.99 | Yearly |
| Plus Early Access Monthly | $2.99 | Monthly |
| Plus Early Access Yearly | $30.99 | Yearly |

(Yearly is 25% off twelve months ($47.88), rounded to $35.99. Early Access, for people who join before January 1, 2027:
monthly is 25% off ($2.99), and yearly is 35% off twelve months instead of 25% ($31.12, rounded down to $30.99).
Early members keep that price as long as they stay subscribed. The site stops showing the Early Access prices on that date.)

**Premium (later, not tonight):** when the live quiz games are ready, make a second product, `ED Sidekick Premium`, with
$7.99 monthly and $71.99 yearly (plus $5.99 monthly and $61.99 yearly early prices if Early Access is still on), four more Payment Links,
and turn on plan switching in the customer portal. The webhook and one SQL line get updated then too. Claude will walk you through it.

### 3. Make four Payment Links
**Payment Links > New**, one for each price. On each one:
- Pick the price (quantity 1, no "let customers adjust quantity").
- Open **After payment**, choose **Don't show confirmation page**, and enter `https://edsidekick.com/?paid=1`
  (this brings people back to My Account, where the site says "Your Plus plan is turning on").
- Press **Create link** and copy the link.

Send Claude the four links, labeled which is which, or paste them into `assets/account-config.js` as
`premiumMonthlyLink` (Plus monthly), `premiumYearlyLink` (Plus yearly), `earlyMonthlyLink` and `earlyYearlyLink` (the Early Access ones).
The site adds each person's account and email to the link by itself, so Stripe knows whose plan to turn on.

### 4. Turn on the customer portal (so members can cancel)
**Settings > Billing > Customer portal**: allow customers to cancel and to update payment methods, press **Save**, then
**Activate link** under "Customer portal link" and copy it (`https://billing.stripe.com/p/login/...`).
Send it to Claude too, or paste it into `manageLink`. Plus members then see **Manage My Plan**.

### 5. Connect Stripe to Supabase (turns Plus on and off by itself)
1. In Supabase: **Edge Functions > Deploy a new function > Via Editor**. Name it exactly `stripe-webhook`.
   Delete the sample code, paste everything from `supabase/functions/stripe-webhook/index.ts`, and press **Deploy**.
2. Open the function's **Details** (or Settings) and turn **Verify JWT** (also called "Enforce JWT verification") **off**, then save.
   Stripe proves who it is with a signature instead.
3. In Stripe: **Developers > Webhooks > Add endpoint** (newer dashboards: **Workbench > Webhooks > Add destination**, then "Webhook endpoint").
   - Endpoint URL: `https://nipdxclfxmnbfrzubmrw.supabase.co/functions/v1/stripe-webhook`
   - Events (5): `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`,
     plus `invoice.paid` and `charge.refunded` for the Owner Dashboard's Income numbers
   - Create it, then press **Reveal** under **Signing secret** and copy it (it starts with `whsec_`).
4. In Supabase: **Edge Functions > Secrets > Add new secret**. Name `STRIPE_WEBHOOK_SECRET`, value: the signing secret. Save.
   (No Stripe secret key is needed. The function only listens; it never charges anyone.)

### 6. Test it
1. While still in Test mode, use the test links on the site: sign in with a spare account, press **Get Plus**,
   and pay with card `4242 4242 4242 4242`, any future date, any 3 digits, any ZIP.
2. You land back on My Account. Within a few seconds the badge changes to **Plus Plan**.
3. Press **Manage My Plan**, cancel the plan, and check the badge goes back to **Free** (refresh the page).
   If it doesn't change, look at Stripe's webhook page for a red failed delivery, and tell Claude what it says.

### 7. Go live (same evening as testing)
Test links on the live site would let anyone get Plus with the fake card, so switch right after testing:
1. Turn off Test mode in Stripe. Products, Payment Links, the portal and the webhook are separate in live mode,
   so repeat steps 2 to 5 there (quickest: on each test product, **Copy to live mode**).
2. Put the new live links in the site (send them to Claude), and replace `STRIPE_WEBHOOK_SECRET` in Supabase with the live signing secret.
3. Your own plan stays **Owner** the whole time. Stripe never changes an Owner account.

## How It Works

- **Guests** (not signed in) save on that computer only, like before, with Free plan limits.
- **Signed in**: everything saves to the account a few seconds after each change, and loads on any computer.
  If something changed on another computer while the site is open, a note offers to load it.
- **Anyone 13 or older can make an account** (first name, email, password, or Google). People who join an activity with a class code never make an account and nothing about them is saved (see `docs/STUDENT-ACCESS.md`).
- **Student names save to the teacher's account** (Kevin's choice): class lists, class jobs, seating charts, exit tickets and the pet's helper
  follow the teacher to any computer (`classSync: 'always'` in `assets/account-config.js`). Only the teacher can read them.
  `'never'` keeps them on each computer instead, and `'choose'` gives each teacher an on/off switch.
- **Signing out** clears that account's things from the computer (they stay safe in the account), which suits shared school computers.
- **Plans**: Free = 2 board screens, 2 class lists, own Would You Rather questions (unlimited), last 5 exit tickets, photo backgrounds, The Locked Library escape room.
  Plus (`premium` in the code) and Owner = unlimited screens and lists, Trivia Showdown with own trivia questions, last 50 exit tickets, all 4 escape rooms, editing any room's questions, Seating Chart and Prompts.
  Signed out = everything free works, but the board does not save. Limits live in `PLANS` and `TT.PLAN_FEATURES` at the top of `assets/account.js`; locks live in `assets/premium.js`.
  Nothing is deleted when someone is over a limit; they just can't add more (exit tickets trim to the limit on the next save).
  The numbers live at the top of `assets/account.js`; prices and links in `assets/account-config.js`.
- **Giving Plus by hand**: `update public.profiles set plan = 'premium' where email = '...';`

## Costs

- Supabase: free up to 50,000 monthly users and 500 MB of saved data (roughly thousands of teachers). Pro is $25/month after that.
- Stripe: no monthly fee. 2.9% + 30¢ per payment (about 42¢ of each $3.99 month, $1.34 of each $35.99 year).
- Email sender: free up to 3,000 emails a month.

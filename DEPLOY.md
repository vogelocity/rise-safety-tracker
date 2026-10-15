# Deploy a new client

This guide puts one client's copy of the Site Readings Tracker online. It takes about an hour, plus whatever time the client needs to sign up for two accounts. You do not need to write code. You will click through two dashboards (Supabase and Vercel) and edit two small files.

One deployment is one client: a new Supabase project, a new Vercel project, the client's own domain, and the client's own logo and colors.

**Who owns what.** The client owns the accounts that hold their data and take their money: the Supabase organization (the database) and the Vercel account (the hosting and the domain). You are added to the Supabase organization as a member so you can set things up and help later. The template repository on GitHub stays yours. This keeps the client's bills on the client's card and lets you walk away cleanly if they ever take over.

## Before you start

Have these ready:

- The client's **email address** for the two accounts, and the client's **credit card** for Vercel. Only the client enters card details, in person or over the phone. Do not write the card number down.
- A **GitHub** account that can reach the template repository (the Rise Safety tracker repo). Vercel builds from it.
- The client's **name**, a **slug** (a short lowercase word with no spaces, for example `voc`), their **logo** (PNG or SVG) and their **four brand colors** as hex codes such as `#1B2A4A`.
- The **domain name** the client wants, and the client's "yes" to the exact name and the price. Check both at https://vercel.com/domains before asking. A `.com` is about $11 a year (for example `vocsitetracker.com` at $11.25).
- The **editor email**, which is `editor@<slug>.example.com` (for example `editor@voc.example.com`). It does not need to be a real inbox. Use `.example.com`, not `.local`, because Supabase may reject `.local`.
- An **editor password** chosen by Zach. Type it only into the Supabase form in step 3. Do not put it in a file, an email or a chat.

Rules to keep in mind:

- Only use the **publishable** key (it starts with `sb_publishable_`, or is the "anon" key on older projects). Never copy the **secret** or **service_role** key anywhere.
- **Never run `supabase/seed.sql` on a client's database.** It is demo data for the development project only. A client's database starts empty.
- Nothing in this guide costs money except the domain in step 6. If a screen shows a price anywhere else, stop and check you are on the free plan.

---

## Step 0. Create the client's accounts

Do this once per client, with the client present or on the phone.

### Supabase (the database)

0.1. The client goes to https://supabase.com and clicks **Start your project**, then signs up with their email address. (If you do this for them, use their email; they set their own password at the end.)

0.2. After signing in, Supabase asks for an **organization**. Name it after the client's company. Leave the plan on **Free**.

**You should see:** the Supabase dashboard with the new organization name at the top left and no projects yet.

0.3. Add yourself to the organization so you can do the setup: click the organization name at the top left, then **Team** (or **Organization settings → Team**), then **Invite**. Enter your email and choose the **Administrator** role. Administrator can create projects, run SQL, manage logins and connect tools, but cannot change the organization's settings or add owners. (Developer is not enough: it is read-only at the organization level, so it cannot create a project, and Supabase answers "Your account does not have the required privileges".)

0.4. Open the invitation email on your side and accept it.

**You should see:** the client's organization in your own Supabase organization list, next to your own.

### Vercel (the hosting and the domain)

0.5. The client goes to https://vercel.com/signup and signs up with their email address. Choose the **Hobby** plan. (Vercel's terms say Hobby is for personal, non-commercial use. If the client wants to be strictly inside the rules, they can upgrade the account to **Pro** at about $20 a month from **Settings → Billing** at any time; nothing else in this guide changes.)

0.6. In Vercel, open **Settings → Billing → Payment Method** and the client adds their card. The domain purchase in step 6 charges this card, and the yearly renewal charges it automatically.

0.7. A free Vercel account cannot add other people to it. Until handover (step 7) you work inside the client's Vercel account with their login, with their permission. At handover they change the password.

**You should see:** an empty Vercel dashboard ("No projects yet") and a saved card under Billing.

## Step 1. Create the Supabase project

1.1. Go to https://supabase.com/dashboard and sign in with **your** account.

1.2. At the top left, switch to the **client's organization** (the one you were invited to in step 0.3). Then click **New project**.

1.3. Enter the project **name**: the client's name (for example `VOC Inspections`).

1.4. Enter a **Database password**. Click **Generate a password** and save it in your password manager. The app does not use it, but you will need it if Supabase support ever asks.

1.5. Pick the **Region** closest to the client's sites (for Texas, a US East or US Central region).

1.6. Click **Create new project**. If it shows a cost, check that it says the free plan before you continue.

**You should see:** a "Setting up your project" screen for about two minutes, then the project home page, with the client's organization name at the top left (not yours).

1.7. Copy two values into a text file for later:

- **Publishable key.** In the left menu, click the gear icon (**Project Settings**), then **API Keys**. Under **Publishable key**, copy the value in the **API KEY** column, which starts with `sb_publishable_`.
- **Project URL.** It is `https://` + the project reference + `.supabase.co`. The project reference is the code in your browser's address bar right after `/project/`. For example, if the address is `https://supabase.com/dashboard/project/abcdefghijklmnop`, the URL is `https://abcdefghijklmnop.supabase.co`. (The same URL is shown as **API URL** under **Integrations → Data API**.)

**You should see:** the URL ends in `.supabase.co`, and the key starts with `sb_publishable_`. Do not copy anything from the **Secret keys** section below it, or any key labeled `service_role`.

## Step 2. Create the tables

2.1. In the left menu, click **SQL Editor**.

2.2. Click **New query**.

2.3. On your computer, open the file `supabase/migrations/0001_init.sql` from the repository. Select all the text and copy it.

2.4. Paste it into the query box.

2.5. Click **Run**.

**You should see:** "Success. No rows returned" at the bottom. If you see an error, do not edit the SQL; check that you pasted the whole file and that you did not run it twice.

2.5a. Click **New query** again and repeat 2.3 to 2.5 with `supabase/migrations/0002_site_map_url.sql`. You should see "Success. No rows returned" again.

2.6. In the left menu, click **Table Editor**.

**You should see:** five tables in the list: `sites`, `equipment`, `reading_types`, `reading_sessions`, `readings`. They are empty.

## Step 3. Set up login: turn off public signup and add the editor

3.1. In the left menu, click **Authentication**, then **Sign In / Providers**.

3.2. At the top of the page, in the box titled **User Signups**, switch **off** "Allow new users to sign up". Leave the other switches alone.

3.3. Scroll down inside the same box and click **Save changes**. The switch does not stick until you do this.

3.4. Reload the page.

**You should see:** "Allow new users to sign up" is still off. Further down, in the **Auth Providers** list, **Email** shows **ENABLED**. Email is on by default, so you do not need to change it.

3.5. In the left menu, under **Authentication**, click **Users**.

3.6. Click **Add user**, then **Create new user**.

3.7. In **Email address**, enter the editor email from "Before you start".

3.8. In **User Password**, enter the password that Zach chose.

3.9. Check that **Auto confirm user?** is ticked. It is ticked by default; leave it ticked. If it is not ticked, login fails later with a vague error.

3.10. Click **Create user**.

**You should see:** the editor email in the users list. Click the row: the panel on the right shows a date next to **Confirmed at**, and **Last signed in** shows a dash until the first login. If the email is rejected, use an address on a domain Zach controls and set `VITE_EDITOR_EMAIL` to that address in step 5.

## Step 4. Add the client's brand

Do this in the repository (on GitHub, or on your computer).

4.1. Create a folder `clients/<slug>` by copying `clients/example`. (On GitHub: open `clients/example/brand.json`, copy its contents, and use **Add file → Create new file** with the name `clients/<slug>/brand.json`.)

4.2. Open `clients/<slug>/brand.json` and change these values:

| Field | What to put |
|---|---|
| `companyName` | The client's name, for example `VOC Inspections` |
| `appTitle` | `Site Readings Tracker` (or a title the client wants) |
| `logoFile` | The exact file name of the logo, for example `logo.png` |
| `colors.primary` | Header, banner and table-header color, as a hex code |
| `colors.accent` | Highlight and main-button color, as a hex code |
| `colors.background` | Page background, as a hex code |
| `colors.text` | Text color, as a hex code |
| `footerText` | Leave as `Maintained by Rise Safety` |

Keep the quotation marks and commas exactly as they are in the example. The main buttons are the accent color with text in the primary color, so pick an accent that is readable with the primary on top of it (the example's gold on navy works).

4.3. Add the logo as `clients/<slug>/logo.png` (or `logo.svg`). The file name must match `logoFile`. The header shows it on a small white plate at up to 32 pixels tall, so a wide, short logo drawn for white paper works best, and a transparent background is fine. On phones the header shows only the logo, so the logo should carry the company name. If there is no logo, the header shows the company name as text.

4.4. Save the changes to the repository (commit them to the branch Vercel will build, normally `main`).

**You should see:** the new folder `clients/<slug>` containing `brand.json` and the logo. Do not delete any other client's folder: each deployed site is built from its own folder, and a missing folder breaks that site at the next deploy.

## Step 5. Create the Vercel project and deploy

5.1. Go to https://vercel.com/dashboard and sign in as the **client's** Vercel account (step 0.5). Check the account name at the top left before going on. A project created in your own account is in the wrong place.

5.2. Click **Add New… → Project**.

5.3. Vercel needs to see the template repository, which is on **your** GitHub. If the repository list is empty or shows "Install GitHub", click it and sign in to GitHub with **your** GitHub account, then give the Vercel app access to the template repository. This links your GitHub to the client's Vercel account, which is what you want: it is how future updates you push to the repository reach the client's site automatically.

5.4. Find the template repository in the list and click **Import**.

5.5. Set **Project Name** to the client's slug (this becomes `<slug>.vercel.app` if the name is free).

5.6. Check that **Framework Preset** says **Vite**. Leave the build command (`npm run build`) and output directory (`dist`) as they are.

5.7. Open **Environment Variables** and add these four, one at a time (name, value, **Add**):

| Name | Value |
|---|---|
| `VITE_CLIENT` | The slug, for example `voc` |
| `VITE_SUPABASE_URL` | The Project URL from step 1.7 |
| `VITE_SUPABASE_ANON_KEY` | The publishable key from step 1.7 |
| `VITE_EDITOR_EMAIL` | The editor email from step 3.7 |

The names must be typed exactly. A name without the `VITE_` prefix is silently ignored by the build.

5.8. Click **Deploy**.

**You should see:** a build log, then a "Congratulations" screen with a preview picture. This takes about one to two minutes.

5.9. Click the preview picture or the **Visit** button to open the site at its `*.vercel.app` address.

**You should see:** the header with the client's logo (or name), a dark banner that says "Site index" and "Sites", "No sites yet.", and the footer "Maintained by Rise Safety". The only button in the header is "Editor login", and there are no "+ Add site" or "Edit" buttons.

5.10. In the address bar, add `/sites/test` to the end of the address and press Enter. This checks that deep links work.

**You should see:** the page with the header and footer and the text "Site not found." (that message is correct, because no site has the id `test`). A Vercel 404 page would be a problem. The same applies after a refresh on any `/sites/...` address. This works because `vercel.json` sends every path to `index.html`.

If you see "VITE_CLIENT is not set" or "No brand.json found for VITE_CLIENT", the variable is missing or the slug does not match the folder name. Fix the variable in **Project → Settings → Environment Variables**, then **Deployments → … → Redeploy**. Changing a variable does not change a site that is already built, so you must redeploy.

## Step 6. Buy the domain and attach it (money: ask first)

**Do not buy anything until the client has said yes to the exact domain name and the price.** The purchase charges the client's card from step 0.6, and it renews every year on the same card.

6.1. Still signed in as the client's Vercel account, click **Domains** in the top navigation (the account-level page, not a project).

6.2. Click **Buy** (or type the domain in the search box). Type the domain, for example `vocsitetracker.com`.

6.3. Check that the price shown matches what the client approved, leave **auto-renew** on, and confirm the purchase.

**You should see:** the domain listed on the Domains page as registered through Vercel, with the client's account as the owner.

6.4. Open the project (step 5), then **Settings → Domains**. Type the same domain and click **Add**. Because the account already owns the domain, Vercel sets up DNS itself; there is nothing to copy anywhere.

6.5. If Vercel offers to add `www.` as a redirect to the main domain, accept it.

6.6. Wait until the domain shows a green check and **Valid Configuration**. This usually takes a few minutes.

**You should see:** opening `https://<the domain>` shows the app, with a padlock in the browser address bar.

If the domain was bought somewhere else (for example Namecheap), step 6.4 instead shows DNS records to add at that registrar. Add them exactly as shown, then wait for the green check.

## Step 7. Hand over to Zach

7.1. Send Zach the site URL. Use the domain if step 6 is done, or the `*.vercel.app` address if it is not.

7.2. Tell Zach the editor password in person or by phone, not by email or chat.

7.3. Show Zach how to change the editor password later, from the Supabase dashboard:

The dashboard has no "set password" button, and "Send password recovery" does not work because the editor address is not a real inbox. Instead, replace the user. Nothing in the database depends on the user, so no readings are lost.

1. Open https://supabase.com/dashboard and open the client's project.
2. Click **Authentication**, then **Users**.
3. Click the editor's row. In the panel on the right, scroll to **Danger zone**, click **Delete user** and confirm.
4. Click **Add user**, then **Create new user**. Enter the same editor email and the new password, leave **Auto confirm user?** ticked, and click **Create user**.
5. Tell the technicians the new password.

Nothing needs to change in Vercel, because the editor email is the same.

7.4. Tell Zach: **never run `supabase/seed.sql` on this database**. It is demo data and would put fake sites into the client's records.

7.5. Hand back the accounts. If you set the Vercel or Supabase account passwords for Zach, he changes them now (Vercel: **Settings → Authentication**; Supabase: **Account → Security**) and turns on two-factor authentication in both. You keep your Developer membership in the Supabase organization for support. You no longer need the Vercel login: updates you push to the template repository still deploy automatically through the GitHub link from step 5.3.

7.6. Tell Zach about the free-plan pause. Supabase pauses a free project after about a week with no activity, and the site then shows "Could not load data" until someone restores it (open the project in the Supabase dashboard and click **Restore**; it takes a minute or two). If readings are logged most weeks this never happens. If it keeps happening, Zach can upgrade the organization to **Pro** (about $25 a month) from the organization's **Billing** page, which also removes the pause.

## Step 8. Check it end to end on a phone

Use a real phone for this, and a second device (a laptop or another phone) for the second-device item.

- [ ] Open the site URL on the phone. It loads with the client's logo and colors, and a dark "Sites" banner.
- [ ] The only button in the header is "Editor login". There is no "+ Add site" and no "Edit".
- [ ] Tap **Editor login**, enter the editor password, tap the login button. The header now says **Editing · Log out**.
- [ ] Tap **+ Add site**, enter the name `Test Yard`, tap **Save**. A "Site added" message appears and the site is listed with "0 entries".
- [ ] Tap the Test Yard row to open it. Tap the **Equipment** tab, tap **+ Add equipment**, enter `Light Plant 1` and save. Then tap **+ Add reading type** on that equipment, enter the name `Ohms` and the unit `Ω`, and save.
- [ ] Tap the **Entries** tab, tap **+ New entry**, enter a value such as `0.4`, tap **Save**. A "Readings saved" message appears and the list shows today's date with "✓ Complete".
- [ ] On the second device, open the same URL without logging in. Test Yard is there with 1 entry. Open it: the entry is listed, and tapping it shows the reading with only a "← Back" button. There are no edit buttons anywhere.
- [ ] Back on the phone, go to the Sites page, tap **Edit** next to Test Yard, tap **Delete site**, and tap **Delete site** again to confirm. Then tap **Editing · Log out**. The page is read-only again, and the list says "No sites yet."

**You should see:** every box can be ticked. If one cannot, do not hand the site over; check step 3 (the editor user) for a login problem and step 2 (the tables) for a save problem.

---

## Problems and fixes

| What you see | Cause and fix |
|---|---|
| "Invalid login credentials" when logging in | Wrong password, or the user was created without "Auto Confirm User". Check the user's row in Authentication → Users; delete and re-create the user with the box ticked. |
| A blank page, or "VITE_CLIENT is not set" | An env var is missing or misspelled. Fix it in Vercel, then redeploy. |
| "No brand.json found for VITE_CLIENT" | The slug in Vercel does not match a folder under `clients/`, or that folder was deleted from the repository. Restore the folder or fix the variable, then redeploy. |
| Saves fail with "permission denied" or "row-level security" | Step 2 did not complete. Re-check the five tables exist, then run `0001_init.sql` again on a fresh project. |
| "Could not load data" after the site worked before | The free Supabase project paused after a week of no activity. Open it in the Supabase dashboard and click **Restore** (step 7.6). |
| The template repository does not appear when importing in Vercel | The client's Vercel account is not linked to a GitHub account that can see the repository. Do step 5.3 with your own GitHub login. |
| Header shows company name, not the logo | `logoFile` in `brand.json` does not match the logo file's exact name. |
| New brand colors or logo do not show | The change was not committed to the branch Vercel builds, or the deploy has not finished. Check **Deployments**. |

Read HANDOFF.md and ../RISE_SAFETY_TRACKER_PROMPT.md in full and follow them exactly. Work in this folder.
Phases 1, 2 and 3 are done and verified. Phase 4 (deploy docs and example client) is next. This is the last phase.

## Before writing anything
In one paragraph, tell me how you will verify Phase 4, as the spec requires. Then start.

## Phase 4 (spec sections 8, 9 and 10)
Deliver, and then prove by following it yourself:

* `README.md`: what the app is, how to run it locally, the env vars, the folder layout, and the npm scripts (`dev`, `build`, `preview`, `rls-check`).
* `DEPLOY.md`: the numbered steps in spec section 9, for a non-developer. One action per step, and what they should see after each step. It must cover: creating the Supabase project, running `0001_init.sql`, the Auth settings (Email provider on, "Allow new users to sign up" off, add the editor user with "Auto Confirm User" ticked), creating `clients/<slug>/brand.json` and the logo, creating the Vercel project and setting the four env vars, and the step-8 phone checklist. It must also say how Zach changes the editor password from the Supabase dashboard, and that `supabase/seed.sql` must never be run against a client's production database.
* `.env.example`: lists `VITE_CLIENT`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_EDITOR_EMAIL`, with a one-line comment each. No real values.
* `clients/example/`: `brand.json` and `logo.svg` complete, with placeholder values. Do not invent a real client's logo or colors.
* `vercel.json` already exists (SPA rewrite). Confirm `/sites/<id>` survives a refresh on the deployed URL.

## Verification (spec section 10, Phase 4)
Follow `DEPLOY.md` yourself from step 1, as if you were a new person, using a fresh Supabase project and a fresh Vercel project. Every step you had to improvise, fix in the document. Final check: the step-8 checklist passes on the deployed `*.vercel.app` URL:
open the URL, read-only with no edit buttons, log in, add a site, log readings, open the same URL in a second browser or device, and the data is there. Then delete the test site so the fresh database is left clean.
Report each DEPLOY.md step as followed as written, or fixed (and what you changed).

## Stop and ask before
* Creating a Supabase project or a Vercel project. The Supabase connector can ask for a cost confirmation. Tell me the price (free tier or not) and wait for a yes.
* Buying a domain. Do not buy one. Domain purchase is not part of Phase 4 verification. In DEPLOY.md, step 6 must say to ask Zach to confirm the name and price first.
* Anything else that spends money or changes billing.

## Credentials
* I create nothing for you. If you need a new project's URL, publishable key, or editor password, ask me. Never use or ask for the `service_role` / secret key.
* Do not copy any password into `.env`, source files, docs, or chat. Do not read `../rise-safety-tracker.env` for the password; ask me to type it (see the shell notes below).
* The existing dev project is ref `plpuagvohnepvdeuqvhu`. Leave it alone: 2 seed sites, 3 sessions, 12 readings. Do not use it as the "fresh" project for the DEPLOY.md walkthrough.

## Rules that are easy to break
* Do not build anything not in the spec. No per-person accounts, roles, magic links, password reset, charts, offline mode.
* No color literals in `src/`. Brand colors come from `brand.json` through the Tailwind tokens.
* Never build dates with `new Date("YYYY-MM-DD")` or `toISOString().slice(0, 10)`. `value` is text; never parse it as a number.
* Every query stays in `src/lib/db.ts`.
* If you change code in `src/` for any reason, re-run `npm run build` (zero TypeScript errors) and say what changed and why.

## Known facts
* Phase 3 is complete: login, CRUD, Log readings, edit/delete session. `npm run build` is clean and `npm run rls-check` passes 7 of 7.
* The editor email is in `.env` (`VITE_EDITOR_EMAIL`, `editor@rise-safety.example.com`).
* Windows PowerShell blocks `npm.ps1`. Tell me to run `npm.cmd run rls-check` for commands I must run myself, with `EDITOR_PASSWORD` set for that one command. Ask me to use `Read-Host -AsSecureString` so the password does not show on screen.
* In the Bash tool here, long heredocs fail. Use the Write or Edit tools to create files.
* The project is in OneDrive, which slows `node_modules`. If a build is slow, pause sync.
* The Browser pane persists the Supabase session in its own storage. I log in there once when you ask.
* The Supabase and Vercel connectors in Claude can inspect projects and deployments. Prefer read-only queries to check row counts.

## Open items carried over from Phase 3 (do not fix unless I say so; list them in DEPLOY.md or README.md "Known limits" where a user would hit them)
* Reading inputs use `inputMode="text"`, not the spec's `"decimal"`, on purpose: the iOS decimal keypad has no `<` key and no letter keys, so "<1", "OL" and "N/A" could not be typed. Keep it. Mention the deviation in README.md.
* The history "Show all" toggle (more than 10 sessions) was never tested. If it is cheap on the fresh project, test it with 11 sessions, then clean up.
* Logging a new session onto a date that already has one merges the typed values and never deletes readings for blank inputs. Editing a prefilled session deletes cleared inputs. Document this in README.md.

## When done
Stop and report: each DEPLOY.md step's result (as written or fixed), the step-8 checklist result on the `*.vercel.app` URL, anything left undone, any place the spec was ambiguous and what you chose, and the final state of both projects (what exists, what you cleaned up, what I should delete).

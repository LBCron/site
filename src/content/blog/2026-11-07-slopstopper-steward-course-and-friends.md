---
title: Slopstopper Five Months On, with a Steward, a Course and Twenty-Five Checks
date: 2026-11-07
author: dataGriff
description: Why a software factory needs deterministic gates, what slopstopper's twenty-five checks do now, the org-wide steward that keeps every repo current, the from-zero course, and what went wrong on the way
tags:
  - Slopstopper
  - Steward
  - Quality Gates
  - Software Factory
  - Claude Code
  - Dependabot
image:
  path: /assets/2026-11-07-slopstopper-steward-course-and-friends/link.png
---

<!--
Screenshots to capture for this post (paths under public/assets/2026-11-07-slopstopper-steward-course-and-friends/):
  link.png                   the share image
  pr-summary.png             the single "SlopStopper: all N checks passed" comment on a PR
  learn.png                  slopstopper.dev/learn, the lesson grid
  steward-pr.png             the body of apic#169 (agent, self-review, Reviewed, Checks sections)
  steward-report.png         the Orders table from a Steward · Run job summary (merged / green / red rows)
  dependabot-comment.png     the steward's comment on a Dependabot PR
-->

Back in [June](/blog/2026-06-21-slopstopper-cli-and-tooling/) I wrote about dropping [slopstopper](https://slopstopper.dev) onto this site: one curl, twenty workflows, and seven things it found on a website I thought was too young to have problems. Five months on it has grown up a bit. There are twenty-five checks now, a profile picks which ones a repo gets, there is a course that teaches each one on a deliberately slopped demo, and there is a second tool, the [steward](https://github.com/hungovercoders/slopstopper-steward), that keeps every repo in my org on the current version and works the issues the suite raises so I do not have to.

It has also become clearer to me what slopstopper is *for*. I write a lot less code by hand than I did a year ago. Agents write it, from a phone, in minutes, and the more of my output comes out of that pipe the more the pipe looks like a factory: prompts in, pull requests out, all day. A factory without inspection is a scrap generator with good throughput. What slopstopper brings to that factory is the inspection, and the one property that makes inspection worth anything: it is deterministic.

This post is the update: what deterministic gates mean in a software factory, what is on tap now, how the steward works and what it actually did this week, and the things that went wrong, because they always do and they are the useful part.

## Deterministic gates for a non-deterministic factory

An agent is a probabilistic machine. Ask it the same thing twice and you get two different answers, both plausible, one of them occasionally wrong in a way neither of you notices. That is fine for generating code; it is what makes it good at generating code. It is useless for deciding whether code is allowed through. A gate that gives a different verdict on the same input is not a gate, it is a second opinion.

So the factory needs two kinds of machine. Generators, which are allowed to be creative, and gates, which are not. A gate has to be:

- **Deterministic.** The same tree gives the same verdict every time, on my laptop and on the runner. Semgrep, Gitleaks, Trivy, Lizard, axe-core, Lighthouse, a thirty-line Python check of a sitemap against a crawl: none of them has a temperature.
- **Explicit about the verdict.** Every slopstopper check exits 0 when it ran clean, 1 when it ran and found something, and 2 when it could not run. That third code is the one most tooling gets wrong. A scanner that cannot download its rules and exits 0 has just told the factory the line is clear. Slopstopper treats "could not run" as its own outcome, never as a pass, and the PR summary says so.
- **The same command everywhere.** `task ss:<check>` locally is `task ss:<check>` in CI, against a CLI version pinned in `mise.toml`. A gate that can pass on one machine and fail on another is a gate with a hole in it.
- **Legible to the machines on either side.** Every red line names the file and the report that explains it, so the next step is never a guess. That is what lets an agent fix what a gate found without a human translating.

Put those together and you can let the generators run. The agent writes the change, the gates say whether it leaves the building, and a human reads the diff of the things that got through rather than the things that got written. The rest of this post is slopstopper filling in that picture: the gates themselves, the course that teaches them, and the steward, which is the factory's maintenance crew, built on the same rule.

## Still one tap

The model has not changed and I am glad about that. Every check is `task ss:<category>:<check>`, locally and in CI, and the `slopstopper-cli` version is pinned in `mise.toml` so it is the same version everywhere too. The workflows are eight lines each: set up the pinned toolchain, run the check, post the result. If a check goes red in CI you run the exact same command on your laptop and get the exact same red line, pointing at the same report under `.ss/reports/`.

What has changed is everything around that spine.

## What's on tap now

The four loops are still the four loops. The table from June is out of date in nearly every cell, so here is the current one.

| Loop | Checks | Tools under the hood |
| --- | --- | --- |
| 🔒 **Security** | SAST, DAST, secrets, dependency CVEs, dependency review, licence inventory, API response headers and CORS | Semgrep, OWASP ZAP, Gitleaks, Trivy, GitHub dependency review |
| 🧹 **Hygiene** | Complexity caps, docs structure, accuracy and size, entry-file budgets, CSP drift, privacy statement, OpenAPI drift, auto-label PRs | Lizard, the CLI's own Python, actions/labeler |
| ✅ **Reliability** | Smoke, E2E journeys, accessibility (WCAG 2.1 AA), Core Web Vitals, SEO and social metadata, broken links, robots.txt, sitemap, llms.txt, API health and latency | Playwright, axe-core, Lighthouse CI, the CLI |
| 🤖 **Operational** | One rolling PR summary comment, failed workflows raise and close their own issue, the Cloudflare post-deploy run, a weekly agentic doc updater, release-please | GitHub Actions, gh-aw |

A few of those deserve a line.

**The discoverability trio** (`robots.txt`, `sitemap.xml`, `llms.txt`) came from noticing that every site I build is now read by crawlers of two kinds, and that I kept shipping a sitemap that drifted from the pages and a robots file that de-indexed staging and then production. The llms.txt check keeps an `llms.txt`, the list of pages a model should read, honest against what the site actually serves.

**Licences** reads the full resolved dependency tree, npm and Python, and fails on anything outside the allowlist. It needs an installed environment to do that, which matters for the steward later.

**The weekly CVE re-scan** is a fix from this week. The dependency scan ran on PRs and pushes to main, so a quiet repo never learned about a CVE published after its last push. It re-scans main every Monday now and opens or closes the tracking issue like a push would.

## A profile picks the loops

The June install assumed a website. An API has no DOM to audit for accessibility, and a library has no URL at all, so on those repos nine browser checks failed rather than no-oped. There are three profiles now, picked at install time or from the repo's shape:

- `ui` (the default): everything, with the four API checks held back until the repo shows an API (an OpenAPI spec, a server framework dependency, or an `api.*` key in the config).
- `api`: drops the nine browser and SEO checks and the privacy statement, keeps the API checks, CSP exceptions and DAST in ZAP's OpenAPI mode.
- `library`: the static checks only. The steward runs on this one.

```bash
curl -fsSL https://raw.githubusercontent.com/hungovercoders/slopstopper/main/install.sh | bash -s -- --profile api
```

`slopstopper profile list` prints what each profile holds back and why, and `slopstopper profile show` says which one a repo is on and every workflow it is deliberately not carrying. The last part matters because a missing workflow used to look like a broken install.

## One comment, not nineteen

A PR with twenty-five workflows posting a comment each is a PR nobody reads. Each check now posts a compact comment only while it is red and deletes it when it passes, and one rolling summary comment per PR says where everything stands:

> ✅ SlopStopper: all 26 checks passed

A green PR carries that one line and nothing else. The first time you see a clean PR with no bot chatter it looks like the install broke. It did not.

## Learn it on a slopped repo

The thing I most wanted to exist in June and did not was a way to teach each check without a real repo to break. So the CLI now ships a demo:

```bash
pipx install slopstopper-cli
slopstopper demo        # writes slopstopper-demo/, a two-page status page called Lantern
```

Lantern is laid out the way the suite expects, AGENTS.md-first docs and all, and it is deliberately a little slopped: one finding per check, each the kind of edit a real repo needs. A complexity hotspot. A doc over budget. A missing security header. A vulnerable pin. The one finding it never carries is a secret, because a recognisably shaped key in a public repository gets found by every scanner on the internet and reported to the vendor whose shape it borrows, so that lesson adds its own fake key.

On top of the demo sits [From zero to slopstopper](https://slopstopper.dev/learn), twenty-one short lessons with a YouTube episode each. Lesson 0 is what slop is and why a gate beats a reminder. Lessons 2 to 16 take one check each: the slop it stops, the tool behind it, what it looks like when it fires on Lantern, the fix, a checkpoint command that proves the lesson took, and an exercise. Lessons 1, 17, 18 and 19 are the suite itself: the installer, the workflows, the two Claude Code skills, and profiles and tailoring. Lesson 20 is for contributors and has you add a check to the CLI, with the test suite telling you every surface you forgot to wire it into.

Every command on every lesson page runs in CI, so they work as written. That rule came from writing lesson 5 and discovering lesson 4's commands had already rotted.

## The skills, refreshed

The two Claude Code skills from June are still the way I install and fix things. `slopstopper-install` runs the pre-flight questions, picks a profile, drives the installer, lays out the docs and closes every check locally before a push; it also knows what a refresh overwrites and what it must re-apply. `slopstopper-triage` takes a red check to the report, decides whether it is a real finding, a false positive or a threshold, and knows the fourth outcome: a bug in slopstopper itself, which gets raised upstream and worked around with a marker a later refresh removes.

What changed is that they travel with the CLI now. An upgrade refreshes the skills from the pinned release, so the playbook an agent reads always matches the checks it is running.

## The steward: a bouncer for the bouncers

Here is the problem the June post set up without noticing. Slopstopper is per-repo. I now have it on apic, terminal-of-terror, this site, the steward itself and the slopstopper repo. Every release means five pin bumps, five refreshes, five reads of the release notes to see whether a knob moved. Every red check on main means an issue in five places. And every Dependabot PR across those repos is one more green tick waiting for a human to press merge.

[slopstopper-steward](https://github.com/hungovercoders/slopstopper-steward) is the org-wide operator for that. It carries no check logic and no fix knowledge of its own. Slopstopper decides what is wrong in one repo and ships how to fix it; the steward decides which repos across the org need a hand and drives slopstopper's own tooling at them.

Its first ground rule is the factory rule again: deterministic where possible, agent only for judgement. Discovery, the pin move, the install, the lockfile, verification, the wait for CI, the merge: code, the same every run. The agent is reached for exactly twice, when a refresh needs reading (did a knob move, is a workaround's upstream issue closed) and when a red check needs a fix, and whatever it does goes back through the gates before anything is pushed. A run goes:

1. **Discover** every repo in the org with slopstopper installed, from the files the installer leaves behind, never from a topic alone.
2. **Inventory** each one: the pin, the version that wrote the suite, the open issues slopstopper raised, the open steward PRs, and now Dependabot's open PRs.
3. **Plan** the orders inside a budget: an upgrade when the pin is behind, a refresh when the suite on disk is older than the pin, a triage per open finding with security first, and a Dependabot order per bump within its own budget.
4. **Execute** each order in a fresh clone on a `steward/<order>` branch. The install is code: move the pin, run `slopstopper install` from the target version, regenerate the lockfile, verify every static check. The judgement is the agent's: Claude Code runs headless inside the clone with the repo's own skills, the install's diff, the release notes and the config schema diff, and works the refresh section of the install skill or the triage skill against a finding.
5. **Self-review.** A second agent run, with no editing tool at all, reads the whole pending diff and gives a verdict. Changes requested get one correction round. A review left unsettled makes the PR a draft.
6. **Settle.** Open the PR, wait for its checks, and if a slopstopper check goes red hand the failing job's log to the agent for up to two fix rounds. Green: the body says so. Red or out of time: the PR becomes a draft naming the checks.
7. **Report** every order's outcome, with what the agent cost.

The agent is boxed hard, because it edits files that the steward then runs git and `gh` over with a push token. It runs as its own OS user in its own copy of the clone, with no token and no network, a tool allow-list built per order from the checks the pinned CLI says the clone can run, a dollar cap and a turn cap. Whatever it leaves in the tree is what the steward commits, after verifying it again. The agent never gets a vote on whether its own change passes; the gates do, and then the PR's CI does, and only then does a merge happen. That is the factory in one sentence: generators propose, gates dispose.

### Dependabot, worked and merged

The newest piece. Dependabot opens the bump; the steward waits for the PR's checks, and if they are red it hands every failing job to the agent with its log tail and the bump's release notes, under a brief that says a fix adapts the repo to the new version and never loosens a test or pins back. The fix is pushed onto Dependabot's own branch, fast-forward only, and one comment on the PR says what happened. Green patch and minor bumps are merged by the run that saw them green; majors are listed for a person.

The first run of that merged six Dependabot PRs across two repos in under five minutes and left two for me with a comment each saying exactly why: one had a conflict from the bump merged just before it, which Dependabot rebased on its own and the next run merged; one had a cancelled CI job and no log to read. No agent was involved in any of the six: a green bump is a deterministic decision, and spending a model on it would only have made it slower and less certain.

### What a reviewed upgrade looks like

When slopstopper 0.29.0 shipped this week the steward moved three repos to it in one run. On apic the agent read the refresh, found no new knobs, and found that the complexity check had gone red on a function in the VS Code extension at CCN 32 against a ceiling of 30. It split the function into three helpers, the self-review approved the change, the PR's forty-six checks went green, and the body says all of that with the model, the cost ($0.22 for the work, $0.08 for the review) and the one command the box refused. On the steward itself the agent reviewed and changed nothing, which is also the right answer and cost twelve cents.

The split between the two repos is the design: slopstopper owns the checks and the skills, the steward owns the budgets, the box and the schedule, and the surfaces it reads from slopstopper are a written contract tested nightly against slopstopper's main, so a rename there goes red in the steward within a day rather than in a run.

## What went wrong, again

Seven things in June. Here are this month's, in the order they bit.

1. **The installer merged devDependencies into `package.json` and left `package-lock.json` alone.** Every browser workflow starts with `npm ci`, which refuses a lock behind its manifest, so the first upgrade the steward opened on terminal-of-terror went red on ten checks at once. The steward learned to regenerate the lock after an install, and 0.29.0's installer does it for everyone.
2. **The steward waited for the PR's checks from the moment it looked, not from when they finished.** On Dependabot PRs whose checks had been green for a week, that was five minutes per PR of waiting on nothing. Check runs carry their completion time now, and an old green PR settles on the first look.
3. **A cancelled CI job was treated as red**, so the agent was handed a job with no log and spent a round learning that nothing had failed. Cancelled is neither green nor red now: nothing is spent, the job is named, and a re-run that goes green is merged by the next run.
4. **Semgrep would not run inside the agent's box.** The box sets `HOME` for the agent user, but sudo's PAM session appends what `/etc/environment` holds, and the GitHub runner image puts `XDG_CONFIG_HOME=/home/runner/.config` there. Semgrep keeps its settings under that directory when it exists, so as the agent user it tried to write into the runner's home and could not. The XDG directories are per-user now, like `HOME`.
5. **The Claude API key hit its monthly spend limit** in the third job of the upgrade run. The install and every check still went through; the PR opened as a draft saying the agent did not finish. The right outcome, and a reminder that the agent is the only part of this with a bill.

None of these were in slopstopper's checks. All of them were in the machinery around them, and every one was found by running it against real repos rather than by thinking harder. That is the whole argument for dogfooding.

## Would I pour another one

Yes, more than in June. The checks were already worth it. The steward is what turns them from a thing I remember to run into a thing that runs, and the course is what lets me hand slopstopper to someone else without a two-hour call.

The bigger shift is in how I think about the whole setup. I am not going to review every line an agent writes; nobody is, and pretending otherwise is how slop ships. What I can do is make sure every line passes through gates that do not care who wrote it, give the same answer every time, and say plainly when they could not run. Slopstopper is that layer. Everything else in this post, the profiles, the course, the steward, is in service of keeping that layer current and in every repo without me being the one who remembers.

The caveats from June stand. Private repos burn Actions minutes and this suite burns a lot of them. Monorepos fight the defaults. And the steward's agent costs real money, small amounts per PR but a budget you have to set and a limit you will one day hit.

What's next: a repo that runs Dependabot on its own GitHub Actions should exclude the installer-owned `ss-*.yml` files, since the next refresh overwrites any bump there; the install skill now says how. The steward's own upgrade PRs still wait for a human merge, by choice, until I have read enough of its self-reviews to trust the switch. And I want the course's episodes recorded, all twenty-one of them, which is the kind of promise a blog post is for.

Ideas and complaints to [slopstopper.dev/feedback](https://slopstopper.dev/feedback), as before. Stoppy is still on the door.

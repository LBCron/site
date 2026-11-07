---
title: Slopstopper Five Months On, with a Steward, a Course and Twenty-Five Checks
date: 2026-11-07
author: dataGriff
description: Twenty-five checks, a profile per repo shape, a course on a slopped demo, and a steward that keeps every repo current, five months after the first install
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

I wanted [slopstopper](https://slopstopper.dev) to stop being a thing I remember to run and start being a thing that runs, on every repo I've got, without me being the one holding the list. Back in [June](/blog/2026-06-21-slopstopper-cli-and-tooling/) I installed it on this site and wrote up the seven things it found. Five months on there are twenty-five checks, a profile picks which ones a repo gets, there's a course that teaches each check on a deliberately broken demo, and there's a second tool, the [steward](https://github.com/hungovercoders/slopstopper-steward), that keeps every repo in my org on the current version and works the issues the checks raise. Read on fellow hungovercoder, this one is mostly about the robot that does the rounds.

I've also got a clearer idea of what slopstopper is actually for. I barely write code by hand now. Agents write it, often from my phone, and the output looks more like a factory than a workshop: prompts in, pull requests out. A factory needs inspection, and the inspection has to be deterministic or it's just another opinion. That's the job slopstopper does.

## Deterministic gates for a non-deterministic factory

An agent gives you a different answer every time you ask. That's fine for writing code and useless for deciding whether code gets in. So you want two kinds of machine: generators that are allowed to be creative, and gates that aren't.

What makes a gate a gate, as I see it:

- **Same input, same verdict.** Semgrep, Gitleaks, Trivy, Lizard, axe-core, Lighthouse, a few lines of Python comparing a sitemap to a crawl. None of these guess.
- **An honest verdict.** Every check exits 0 for clean, 1 for found something, 2 for couldn't run. Most tooling fudges the third one. A scanner that can't download its rules and exits 0 has just waved the line through. Slopstopper reports "could not run" as its own outcome and the PR summary shows it.
- **One command everywhere.** `task ss:<check>` on my laptop is the same command and the same pinned CLI version in CI.
- **Readable by the thing that fixes it.** Every red line names a file and a report, so an agent can fix what a gate found without me translating.

Get those right and you can let the generators loose. The agent writes it, the gates decide if it leaves the building, and I read the diffs of what got through rather than everything that got written.

## Still one tap

The model hasn't changed. Every check is `task ss:<category>:<check>`, locally and in CI, with the `slopstopper-cli` version pinned in `mise.toml`. Workflows are eight lines: set up the toolchain, run the check, post the result. Red in CI means the same red on your laptop, pointing at the same report under `.ss/reports/`.

This is the whole loop in one sitting, recorded with [vhs](https://github.com/charmbracelet/vhs) from the tapes slopstopper keeps in its own repo: a green check, a change that blows its budget, the red line and the report it points at, and the fix.

<video autoplay loop muted playsinline>
  <source src="/assets/2026-11-07-slopstopper-steward-course-and-friends/triage.mp4" type="video/mp4">
  <source src="/assets/2026-11-07-slopstopper-steward-course-and-friends/triage.webm" type="video/webm">
  <img src="/assets/2026-11-07-slopstopper-steward-course-and-friends/triage.gif" alt="The triage loop in a terminal: task ss:hygiene:entry-files passes, a routing table is pasted into README.md, the same check fails naming the file and its token budget, the report under .ss/reports is read, the change is reverted and the check passes again">
</video>

## What's on tap now

The June table is wrong in most cells now, so here's the current one.

| Loop | Checks | Tools under the hood |
| --- | --- | --- |
| 🔒 **Security** | SAST, DAST, secrets, dependency CVEs, dependency review, licence inventory, API headers and CORS | Semgrep, OWASP ZAP, Gitleaks, Trivy, GitHub dependency review |
| 🧹 **Hygiene** | Complexity caps, docs structure, accuracy and size, entry-file budgets, CSP drift, privacy statement, OpenAPI drift, auto-label PRs | Lizard, the CLI's own Python, actions/labeler |
| ✅ **Reliability** | Smoke, E2E journeys, accessibility (WCAG 2.1 AA), Core Web Vitals, SEO and social metadata, broken links, robots.txt, sitemap, llms.txt, API health and latency | Playwright, axe-core, Lighthouse CI, the CLI |
| 🤖 **Operational** | One rolling PR summary comment, failed workflows raise and close their own issue, the Cloudflare post-deploy run, a weekly doc updater, release-please | GitHub Actions, gh-aw |

Three worth mentioning. The robots, sitemap and llms.txt checks exist because I kept shipping a sitemap that drifted from the pages and a robots file that de-indexed production, and because every site I build is now read by crawlers and models alike. The licences check reads the full resolved dependency tree, npm and Python, and fails on anything off the allowlist. And the dependency CVE scan now re-runs on main every Monday, because a quiet repo never used to hear about a CVE published after its last push.

## A profile picks the loops

June's install assumed a website. On an API or a library nine browser checks failed instead of staying out of the way. There are three profiles now:

- `ui` (default): everything, with the API checks held back until the repo shows an API.
- `api`: drops the browser and SEO checks, keeps the API checks and runs DAST in ZAP's OpenAPI mode.
- `library`: static checks only. The steward runs on this one.

```bash
curl -fsSL https://raw.githubusercontent.com/hungovercoders/slopstopper/main/install.sh | bash -s -- --profile api
```

`slopstopper profile show` tells you which profile a repo is on and which workflows it's deliberately not carrying, which matters because a missing workflow used to look like a broken install.

![slopstopper profile detect suggests ui because it found app/feedback.html, and profile show lists the four API workflows the ui profile deliberately leaves out](/assets/2026-11-07-slopstopper-steward-course-and-friends/profile.png)

## One comment, not twenty

Twenty-five workflows each posting a comment is a PR nobody reads. Each check now posts only while it's red and deletes its comment when it passes, and one summary comment per PR says where everything stands. This is the one on the PR that moved this site to 0.29.0 this week:

![The single SlopStopper summary comment on this site's pull request 83: all 20 checks passed, listed by loop, with the head commit and the time it was last updated](/assets/2026-11-07-slopstopper-steward-course-and-friends/pr-summary.png)

A green PR has that line and nothing else, which reads like a broken install until you're used to it.

## Learn it on a slopped repo

The thing I most wanted in June was a way to teach each check without breaking a real repo. The CLI now ships a demo:

```bash
pipx install slopstopper-cli
slopstopper demo        # writes slopstopper-demo/, a two-page status page called Lantern
```

<video autoplay loop muted playsinline>
  <source src="/assets/2026-11-07-slopstopper-steward-course-and-friends/demo.mp4" type="video/mp4">
  <source src="/assets/2026-11-07-slopstopper-steward-course-and-friends/demo.webm" type="video/webm">
  <img src="/assets/2026-11-07-slopstopper-steward-course-and-friends/demo.gif" alt="slopstopper demo writing twenty-three files to slopstopper-demo and listing the ten checks that fail on it on purpose, each with the command to run and the finding it will report">
</video>

Lantern is laid out the way the suite expects and carries one finding per check: a complexity hotspot, a doc over budget, a missing header, a vulnerable pin. The one thing it doesn't carry is a secret, because a realistic-looking key in a public repo gets found by every scanner on the internet and reported to the vendor. That lesson writes its own fake one.

On top of the demo is [From zero to slopstopper](https://slopstopper.dev/learn): twenty-one short lessons, each with a YouTube episode to come. Lesson 0 is what slop is. Lessons 2 to 16 take one check each: what it stops, the tool behind it, what it looks like firing on Lantern, the fix, a checkpoint and an exercise. Lessons 1, 17, 18 and 19 cover the installer, the workflows, the Claude Code skills and profiles. Lesson 20 has you add a check to the CLI and lets the test suite tell you every surface you forgot.

![The From zero to slopstopper course page on slopstopper.dev: twenty-one short lessons, what you will need, and the four commands that install the CLI and write the Lantern demo repo](/assets/2026-11-07-slopstopper-steward-course-and-friends/learn.png)

Every command in every lesson runs in CI, after lesson 4's commands rotted while I was writing lesson 5.

## The skills, refreshed

The two Claude Code skills from June are still how I install and fix things. `slopstopper-install` asks the pre-flight questions, picks a profile, drives the installer and closes every check locally before a push. `slopstopper-triage` takes a red check to its report and decides whether it's a real finding, a false positive, a threshold, or a bug in slopstopper itself that needs raising upstream.

The change is that they ship with the CLI now. An upgrade refreshes the skills from the pinned release, so the playbook an agent reads matches the checks it's running.

## The steward

Slopstopper is per-repo, and I've got it on a handful of repos now. Every release meant a pin bump, a refresh and a read of the release notes in each one. Every red check on main meant an issue in each one. Every Dependabot PR was a green tick waiting for me to press merge.

[slopstopper-steward](https://github.com/hungovercoders/slopstopper-steward) does that round for the whole org. It has no check logic and no fix knowledge of its own. Slopstopper decides what's wrong in one repo and ships how to fix it; the steward decides which repos need a hand and points slopstopper's own tooling at them.

Its first rule is the factory rule: deterministic where possible, agent only for judgement. Discovery, the pin move, the install, the lockfile, verification, the CI wait and the merge are code. The agent gets involved twice, when a refresh needs reading (did a knob move, is a workaround's upstream issue closed) and when a red check needs a fix, and whatever it does goes back through the gates before anything is pushed.

![One steward run as a pipeline of seven steps: discover, inventory, plan, execute, self-review, settle and report. Five are plain code. Execute and settle hand two judgement calls, reading a refresh and fixing a red check, to a boxed Claude Code agent with its own OS user, no token and no network. Whatever it changes goes back up through the gates, the pinned CLI's checks and then the pull request's own CI, before anything is pushed](/assets/2026-11-07-slopstopper-steward-course-and-friends/steward-run.svg)

A run, step by step:

1. **Discover** every repo in the org with slopstopper installed, from the files the installer leaves behind.
2. **Inventory** each one: the pin, the version that wrote the suite, the open slopstopper issues, open steward PRs, and Dependabot's open PRs.
3. **Plan** the orders inside a budget: an upgrade when the pin is behind, a refresh when the suite on disk is older than the pin, a triage per open finding with security first, and a Dependabot order per bump.
4. **Execute** each order in a fresh clone on a `steward/<order>` branch. The install is code. The judgement is Claude Code running headless in the clone with the repo's own skills, the install diff, the release notes and the config schema diff.
5. **Self-review.** A second agent run with no editing tools reads the pending diff and gives a verdict. One correction round if it asks for changes. Unsettled means the PR opens as a draft.
6. **Settle.** Open the PR, wait for checks, and if a slopstopper check goes red hand the job log to the agent for up to two fix rounds. Still red means draft.
7. **Report** every order's outcome and what the agent cost.

The agent is boxed, because the steward runs git and `gh` with a push token over whatever it leaves behind. It runs as its own OS user in its own copy of the clone, with no token, no network, a tool allow-list built per order from the checks the pinned CLI says the clone can run, a dollar cap and a turn cap. It never gets a vote on whether its own change passes. The gates do, then the PR's CI does, and only then does anything merge.

Which model does the judging is one line in `steward.yml`, handed straight to `claude --model`. Mine says `sonnet`, and so far Sonnet has been really cheap for this kind of work: twelve cents to read a refresh and change nothing, twenty to read one and explain why nothing needed changing, thirty to find and split a function that had crept over the complexity ceiling and have a second run review it. Every PR body names the model and the bill, so if I ever move it up to a bigger model I'll see exactly what that buys.

### Dependabot

Dependabot opens the bump, the steward waits for its checks. If they're red it hands each failing job to the agent with the log tail and the release notes, under a brief that says adapt the repo to the new version and never loosen a test or pin back. The fix goes onto Dependabot's own branch, fast-forward only, with one comment saying what happened. Green patch and minor bumps are merged by the run that saw them green. Majors are listed for a person.

The first run merged six Dependabot PRs across two repos in under five minutes and left two with a comment each: one had a conflict Dependabot rebased itself before the next run, one had a cancelled CI job and no log. No agent was involved in any of the six. A green bump is a deterministic decision and a model would only have made it slower.

### A reviewed upgrade

When 0.29.0 shipped this week the steward moved three repos to it in one run. On apic the agent read the refresh, found no new knobs, and found the complexity check red on a function in the VS Code extension at CCN 32 against a ceiling of 30. It split the function, the self-review approved, the PR's forty-six checks went green, and the PR body says all of that with the model, the cost ($0.22 for the work, $0.08 for the review) and the one command the box refused. On the steward itself the agent changed nothing, which is also fine, and cost twelve cents.

This site was the third. The agent read the refresh, found that the only schema change was a reworded comment, confirmed the install had left `package.json` alone, and said which checks it couldn't run itself and was leaving to the PR's own workflows. Twenty cents, eighteen turns, and nothing left for me to do but press merge.

![This site's pull request 83, opened by the steward bot: the pin moved from 0.26.0 to 0.29.0, the agent's account of the refresh with the model, cost and turn count, the browser checks it left to the PR's own workflows, and the line saying all thirty checks are green](/assets/2026-11-07-slopstopper-steward-course-and-friends/steward-pr.png)

The surfaces the steward reads from slopstopper are a written contract tested nightly against slopstopper's main, so a rename there goes red in the steward within a day rather than mid-run.

## What went wrong, again

Seven things in June. This month's, in the order they bit:

1. **The installer added devDependencies to `package.json` and left `package-lock.json` alone.** Every browser workflow starts with `npm ci`, which refuses a stale lock, so the first upgrade the steward opened went red on ten checks at once. The steward regenerates the lock after an install now, and so does 0.29.0's installer.
2. **The steward waited for PR checks from the moment it looked, not from when they'd finished.** On Dependabot PRs green for a week, that was five minutes each of waiting for nothing. It reads completion times now.
3. **A cancelled CI job counted as red**, so the agent got a job with no log and spent a round finding that out. Cancelled is its own state now and costs nothing.
4. **Semgrep wouldn't run inside the agent's box.** The box set `HOME` for the agent user, but the GitHub runner image puts `XDG_CONFIG_HOME=/home/runner/.config` in `/etc/environment`, which sudo's PAM session reads. Semgrep writes its settings there and couldn't. The XDG directories are per-user now too.
5. **The Claude API key hit its monthly spend limit** in the third job of the upgrade run. The install and every check still ran and the PR opened as a draft saying the agent hadn't finished. Correct, and a reminder that the agent is the only part of this with a bill.

None of these were in the checks. All of them were in the machinery around them, and every one turned up by running it against real repos.

## Would I pour another one

Yes, more than in June. The checks were already worth it. The steward turns them from a thing I remember to run into a thing that runs, and the course means I can hand slopstopper to someone without a two-hour call.

I'm not going to review every line an agent writes, and neither is anyone else. What I can do is make sure every line goes through gates that don't care who wrote it, give the same answer every time, and say so when they couldn't run. Everything else here, the profiles, the course, the steward, is about keeping that layer current in every repo without me being the one who remembers.

The June caveats stand. Private repos will burn Actions minutes. Monorepos fight the defaults. And the steward's agent costs real money, small per PR, but a budget you set and a limit you'll hit.

If I were doing this again I'd have pointed the steward at real repos a week earlier and written less of it first. None of the five things that went wrong lived in the checks, and no test I'd have thought to write was going to find a PAM session reading `/etc/environment`.

## Sources and further reading

This post is the guided path. The references are these:

- [slopstopper.dev](https://slopstopper.dev) for the install one-liner, the checks and the profiles, and [From zero to slopstopper](https://slopstopper.dev/learn) for the course.
- The [slopstopper repo](https://github.com/hungovercoders/slopstopper) and its [changelog](https://github.com/hungovercoders/slopstopper/blob/main/CHANGELOG.md), where 0.26.0 to 0.29.0 is the stretch this post covers.
- The [steward repo](https://github.com/hungovercoders/slopstopper-steward), and in particular its [architecture doc](https://github.com/hungovercoders/slopstopper-steward/blob/main/docs/architecture/README.md), which is where the box and the settle loop are specified properly.
- [The June post](/blog/2026-06-21-slopstopper-cli-and-tooling/), for where this started.

## What next

The steward's own upgrade PRs still wait for me to merge, until I've read enough of its self-reviews to trust the switch. And there are twenty-one episodes to record, in between meals.

Ideas and complaints to [slopstopper.dev/feedback](https://slopstopper.dev/feedback), as before. Watch this space, fellow hungovercoder, and may every PR you open this month have exactly one comment on it.

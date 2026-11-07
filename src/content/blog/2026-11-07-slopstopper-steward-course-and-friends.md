---
title: Doing the Rounds with a Slopstopper Steward
date: 2026-11-07
author: dataGriff
description: Slopstopper five months on, with twenty-five checks, a course on a slopped demo, and a steward that keeps every repo current without me remembering
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

I wanted [slopstopper](https://slopstopper.dev) to look after itself. It already does on this site. I wanted the same on every repo I've got, on the current version, without me being the one who remembers to bump a pin on a Sunday with a head on me. Back in [June](/blog/2026-06-21-slopstopper-cli-and-tooling/) I installed it here and wrote up the seven things it found. It's November now, there are twenty-five checks, there's a course, and there's a second tool called the [steward](https://github.com/hungovercoders/slopstopper-steward) that does the rounds of my repos so I don't have to. Read on fellow hungovercoder and meet the robot that nags the other robots.

## A Factory Needs Inspection

I barely type code any more. I tap an idea into Claude Code on my phone, an agent writes it, a pull request turns up, and I'm reading a diff I didn't write. It's brilliant fun and it's also a factory, and a factory with nobody on inspection ships slop.

The agent is the generator. Creative, chatty, and you get a different answer every time you ask. Slopstopper is the gate. Same input, same verdict, whoever wrote the code. That's why Semgrep, Gitleaks, Trivy, Lizard, axe-core and Lighthouse do the checking, not a model having a guess. A check that couldn't run says so and exits 2. It doesn't exit 0 and wave the whole batch through. The `task ss:<check>` on my laptop is the same command and the same pinned version as CI. And every red line names a file and a report, so I can hand it to an agent to fix.

![Three boxes left to right: generators (agents writing code, a different answer every time), gates (slopstopper, twenty-five deterministic checks in three loops, the same task command locally and in CI, exiting 0 for clean, 1 for found something, 2 for could not run) and what ships (the PR merges, Cloudflare deploys). A steward band beneath loops back into the gates, keeping every repo on the current version and working the issues the gates raise](/assets/2026-11-07-slopstopper-steward-course-and-friends/factory.svg)

Here's the loop in one go, on the Lantern demo repo the CLI writes for you (more on that below). The entry-files check goes red because the README has grown a whole manual, the report says by how much, the manual moves into `docs/` where it belongs, and the check goes green.

<video autoplay loop muted playsinline>
  <source src="/assets/2026-11-07-slopstopper-steward-course-and-friends/triage.mp4" type="video/mp4">
  <source src="/assets/2026-11-07-slopstopper-steward-course-and-friends/triage.webm" type="video/webm">
  <img src="/assets/2026-11-07-slopstopper-steward-course-and-friends/triage.gif" alt="The triage loop in a terminal: slopstopper run hygiene:entry-files fails on the Lantern demo because README.md is 800 tokens against a budget of 600, the report under .ss/reports is read, the oversized section is moved into docs, and the same check passes with README.md at 225 tokens">
</video>

## What's on Tap Now

The June table is wrong in most cells now, so here's the current line-up, four loops and what each one carries.

- 🔒 **Security.** SAST, DAST, secrets, dependency CVEs, dependency review, licence inventory, API headers and CORS. Semgrep, OWASP ZAP, Gitleaks, Trivy and GitHub's dependency review do the work.
- 🧹 **Hygiene.** Complexity caps, docs structure, accuracy and size, entry-file budgets, CSP drift, a privacy statement, OpenAPI drift and auto-labelled PRs. Lizard and the CLI's own Python.
- ✅ **Reliability.** Smoke, E2E journeys, accessibility to WCAG 2.1 AA, Core Web Vitals, SEO and social metadata, broken links, robots.txt, sitemap, llms.txt, API health and latency. Playwright, axe-core and Lighthouse CI.
- 🤖 **Operational.** One rolling PR summary comment, failed workflows that raise and close their own issue, the Cloudflare post-deploy run, a weekly doc updater and release-please. GitHub Actions and gh-aw.

The robots, sitemap and llms.txt checks are there because I kept shipping a sitemap that didn't match the pages, and once shipped a robots file that de-indexed production. The CVE scan now re-runs on main every Monday, because a quiet repo never used to hear about a CVE that came out after its last push, and most of mine are quiet.

## Pick Your Poison

June's install assumed everything was a website, so when I put it on an API nine browser checks fell over instead of staying out of the way. There are three profiles now. `ui` is the default and gives you the lot, holding the API checks back until the repo shows an API. `api` drops the browser and SEO checks and runs DAST in ZAP's OpenAPI mode. `library` is static checks only, and is what the steward itself runs on.

```bash
curl -fsSL https://raw.githubusercontent.com/hungovercoders/slopstopper/main/install.sh | bash -s -- --profile api
```

`slopstopper profile show` tells you which profile you're on and which workflows it's deliberately not carrying, because a missing workflow used to look like a broken install and I'd go hunting for a bug that wasn't there.

![slopstopper profile detect suggests ui because it found app/index.html, and profile show lists the four API workflows the ui profile deliberately leaves out](/assets/2026-11-07-slopstopper-steward-course-and-friends/profile.png)

## A Quieter PR

Twenty-five workflows each posting their own comment is a PR nobody reads, including me. Each check now only comments while it's red and deletes the comment when it goes green, and one summary comment per PR says where everything stands. This is the one on the PR that moved this site to 0.29.0 this week.

![The single SlopStopper summary comment on this site's pull request 83: all 20 checks passed, listed by loop, with the head commit and the time it was last updated](/assets/2026-11-07-slopstopper-steward-course-and-friends/pr-summary.png)

A green PR has that line and nothing else. It looks like the install has broken until you get used to it.

## A Repo You're Allowed to Break

The thing I wanted most in June was a way to show someone each check without breaking a real repo. The CLI now writes you one to break.

```bash
pipx install slopstopper-cli
slopstopper demo        # writes slopstopper-demo/, a two-page status page called Lantern
```

<video autoplay loop muted playsinline>
  <source src="/assets/2026-11-07-slopstopper-steward-course-and-friends/demo.mp4" type="video/mp4">
  <source src="/assets/2026-11-07-slopstopper-steward-course-and-friends/demo.webm" type="video/webm">
  <img src="/assets/2026-11-07-slopstopper-steward-course-and-friends/demo.gif" alt="slopstopper demo writing twenty-three files to slopstopper-demo and listing the ten checks that fail on it on purpose, each with the command to run and the finding it will report">
</video>

Lantern is a little status page with one deliberate finding per check. There's a complexity hotspot, a README over budget, a missing header and a requests pin from 2018 with a CVE on it. The one thing it doesn't carry is a secret, because a realistic-looking key in a public repo gets found by every scanner on the internet and reported to the vendor. That lesson has you write your own fake one.

On top of the demo is the course, [From zero to slopstopper](https://slopstopper.dev/learn). Twenty-one short lessons, one check or one idea each, with a YouTube episode to come for every one. Every command in every lesson runs in CI, which I added after lesson 4's commands rotted while I was writing lesson 5. The site got a dark theme this week too, for those of you reading this after last orders. The two Claude Code skills from June, `slopstopper-install` and `slopstopper-triage`, now ship inside the CLI, so when the pin moves the playbook the agent reads moves with it.

![The From zero to slopstopper course page on slopstopper.dev after this week's redesign, with a theme toggle in the header: twenty-one short lessons, what you will need, and the four commands that install the CLI and write the Lantern demo repo](/assets/2026-11-07-slopstopper-steward-course-and-friends/learn.png)

## The Steward Does the Rounds

Slopstopper is per-repo, and I've got it on a handful of repos. Every release meant pin bumps, refreshes and release notes, one repo at a time. Every red check on main was an issue to raise. Every Dependabot PR was a green tick waiting for me to press the button. I built the tool so I'd stop forgetting the important stuff, and then forgot to keep the tool current.

So I built [slopstopper-steward](https://github.com/hungovercoders/slopstopper-steward) to do that job for the whole org. It has no check logic and no fix knowledge of its own. Slopstopper decides what's wrong in a repo and ships the skill that says how to fix it. The steward works out which repos need a hand and points slopstopper's own tooling at them, one PR each. The rule is the factory rule again. Code does anything with a right answer, and the agent only gets the judgement calls. There are two of those. It reads a refresh and tells me if a knob moved or a workaround can come out, and it fixes a check that's gone red. Everything it touches goes back through the gates before anything is pushed.

![One steward run as a pipeline of seven steps: discover, inventory, plan, execute, self-review, settle and report. Five are plain code. Execute and settle hand two judgement calls, reading a refresh and fixing a red check, to a boxed Claude Code agent with its own OS user, no token and no network. Whatever it changes goes back up through the gates, the pinned CLI's checks and then the pull request's own CI, before anything is pushed](/assets/2026-11-07-slopstopper-steward-course-and-friends/steward-run.svg)

I didn't want an agent anywhere near a push token, so it doesn't get one. It runs as its own OS user in its own copy of the clone, with no network, a tool allow-list, a dollar cap and a turn cap. It never gets a vote on whether its own change passes. The model is one line in `steward.yml`, passed straight to `claude --model`. Mine says `sonnet`, and so far Sonnet has been really cheap for this. Twelve cents to read a refresh and change nothing. Twenty to read one and write up why nothing needed changing. Thirty to find a function over the complexity ceiling, split it, and have a second run review the split. Every PR body says which model ran and what it cost.

### Bring Your Own Steward

As of this week it isn't only mine. Fork the repo (or use it as a template if your org won't allow forks), replace `steward.yml` from the example with your own orgs, install your own GitHub App with its ID as a variable and its key as a secret, add a Claude token, and run `steward plan` before you let it open anything. A copy with the example's `your-org` still in it exits 2 before it reads a thing. The [setup runbook](https://github.com/hungovercoders/slopstopper-steward/blob/main/docs/runbooks/SETUP.md) has the steps.

### Dependabot Bumps

Dependabot opens the bump and the steward waits for the checks. A red one goes to the agent with the job log and the release notes, under a brief that says adapt the repo and never loosen a test or pin it back. The fix lands on Dependabot's own branch with one comment. The same run merges green patch and minor bumps. A major waits for a human. The first run merged six across two repos in under five minutes, and no agent touched any of them.

### The 0.29.0 Upgrade

When 0.29.0 shipped this week the steward moved three repos to it in one run. On apic the agent found the complexity check red on a function at CCN 32 against a ceiling of 30, split it, and the self-review approved. All forty-six checks on the PR went green. The PR body says all of that with the model, the cost ($0.22 for the work, $0.08 for the review) and the one command the box refused. On this site the agent found nothing to change, said so, and all I did was press merge.

![This site's pull request 83, opened by the steward bot: the pin moved from 0.26.0 to 0.29.0, the agent's account of the refresh with the model, cost and turn count, the browser checks it left to the PR's own workflows, and the line saying all thirty checks are green](/assets/2026-11-07-slopstopper-steward-course-and-friends/steward-pr.png)

## What Went Wrong This Time

Seven things in June. Five this month, and all of them in the machinery around the checks rather than in the checks. The installer edited `package.json` and left `package-lock.json` behind, so the first upgrade the steward ever opened went red on ten checks at once. The steward timed its wait for PR checks from when it looked rather than from when they'd finished. A cancelled CI job counted as red and cost the agent a turn discovering there was no log to read. Semgrep wouldn't run in the agent's box, because the GitHub runner puts `XDG_CONFIG_HOME` in `/etc/environment` and sudo reads it back in. And the Claude API key hit its monthly spend limit mid-run, so the PR opened as a draft saying the agent hadn't finished, as it should. Every one of these only showed up against real repos.

## Would I Pour Another One

Yes, more than in June. The checks were already worth it. The steward turns them from a thing I have to remember into a thing that just happens, and the course means I can hand slopstopper to somebody without a two-hour call. The June caveats stand. Private repos burn Actions minutes, monorepos fight the defaults, and the steward's agent costs real money, pennies per PR but a limit you will hit. If I were doing this again I'd have pointed the steward at real repos a week earlier and written less of it first.

## Sources and Further Reading

This post is the guided path. These are the sources.

- [slopstopper.dev](https://slopstopper.dev) for the install, the checks and the profiles, and [From zero to slopstopper](https://slopstopper.dev/learn) for the course.
- The [steward repo](https://github.com/hungovercoders/slopstopper-steward), its [architecture doc](https://github.com/hungovercoders/slopstopper-steward/blob/main/docs/architecture/README.md) for the box and the settle loop, and its [setup runbook](https://github.com/hungovercoders/slopstopper-steward/blob/main/docs/runbooks/SETUP.md) for running your own.
- [The June post](/blog/2026-06-21-slopstopper-cli-and-tooling/), for where this started.

## What Next

The steward's own upgrade PRs still wait for me to press merge until I've read enough of its self-reviews to trust it, and there are twenty-one episodes to record in between meals. Ideas and complaints to [slopstopper.dev/feedback](https://slopstopper.dev/feedback) as ever, and let's see if we can all save the world from slop. Cheers fellow hungovercoder!

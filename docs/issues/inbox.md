# Inbox: problems found by app sessions

Sessions that build another app with Orion log what they find in Orion here when they cannot open a GitHub issue
(see "If you are a session building another app with Orion" in [`CLAUDE.md`](../../CLAUDE.md)). They append on a branch
`issues/<app>-<date>` and push that branch; they never push `s4-orion` or `main`. Screenshots go in
[`img/`](img/) as `<date>-<app>-<short-name>.png`.

**Triage** (the first step of every round, `docs/PLAN.md`): move each entry below into
[`README.md`](README.md) as a numbered issue (copy the fields, keep the image link), then delete it from here. Owner-reported
device bugs come first. Open GitHub issues labelled `from-app` are triaged the same way.

## Entry format

One entry per problem, newest last:

```md
### <short title>
- App: <name>
- Component or page: <e.g. s4-nav-bar, templates/dashboard.html>
- What happened:
- Expected:
- Steps:
  1.
- Screenshot: img/<file> (or none)
- Browser, device, shell: <e.g. iPhone 15, Safari 18>
- Orion version: <CHANGELOG top version or commit>
- Workaround in the app (file, with the comment linking this entry):
- Logged: <date>, session branch `issues/<app>-<date>`
```

## Open entries

None.

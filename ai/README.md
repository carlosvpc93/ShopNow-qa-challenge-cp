# AI usage

## Tools and models

- **Claude (Opus 5.5) via the Claude desktop app / Claude Code-style agent**, connected to my local repo folder.

## What I delegated to AI

1. **Project rules (`CLAUDE.md`).** I asked Claude to turn `README.md` into a rules file for the agent: deliverables, strict test rules. 
2. **Spec review (`ANALYSIS.md`).** First draft of PO questions, ambiguities and assumptions, prioritized by business risk (money and data first).
3. **Bug hunting.** Claude read `app/` to build **hypotheses** (e.g. `Math.floor` in `lineTotal`, `COUPONS[typed]` lookup, missing `userId` check, 3 s UI timeout vs 4 s server delay). It then **reproduced each one** with `curl` against the running API and with throwaway Playwright probe scripts in the UI.
4. **Test architecture and tests.** Build Page objects Model, API client, two fixture files (UI and API), test data and builders, and 24 tests.
5. **Bug reports (`BUGS.md`).** Written from the reproduction output (real requests and responses, real UI texts), and added suggested root-cause pointers in `app/`.

## What I verified and how

- **Reviewed ANALYSIS file¨** in order to add or complement questions.
- **Analized the bugs found by claude.**: Review the steps to reproduce for each test reported.
- **Analized the Traces and Videos.**: Analized the traces and videos after the test run to verify the evidence of failing tests.
- **Reviewed changes before commit.** Review each claude output in order to confirm the solutions, eg. Running test after a bug fix in a debugging mode to assure the flow expected.

## What I discarded or corrected from the output, and why

- **AI README** It was included in the outputs, so removed/changed many lines.
- **Test architecture** I added rules for tests: POM, SOLID, fixtures, assertions only in specs, and UI and API tests separated.

## Evidence

- [Session Link](https://claude.ai/share/b5457e92-7c22-443a-891b-aa81ec4a67ce)

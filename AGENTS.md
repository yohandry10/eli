# AGENTS.md

## Mandatory Verification Policy

After any implementation or code change, the agent must verify behavior before claiming success.

Required minimum checklist:

1. Run static verification:
- `pnpm exec tsc --noEmit`
- `pnpm build`

2. Run runtime validation for affected flows:
- If auth/API changed, execute at least one real request path and confirm status + response body.
- If UI flow changed, verify that user-facing error/success feedback is visible and accurate.

3. Report evidence:
- Include commands executed.
- Include key status codes and outcomes.
- If verification cannot be executed, explicitly state why and do not claim completion.

4. No premature completion claims:
- Do not say "fixed" or "working" unless checks above pass.
- If any check fails, provide root cause and next corrective action.

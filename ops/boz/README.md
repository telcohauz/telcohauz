# BOZ local maintenance

The owner authorized hourly maintenance and daily 06:00 MYT regression tests on DESKTOP-C9LO3ON. This code runs allowlisted local tests and one existing public/internal queue job per tick. It never executes model-generated shell commands, deploys production, changes production ACLs, sends messages, charges money or imports customer data.

Windows installation paths are explicit in the scripts. Back up the control directory, workforce source, queue (SQLite backup API), and Task Scheduler XML before installation. Use REGISTER_BOZ_AUTOMATION.cmd on this PC because PowerShell file execution is restricted. Do not change the system execution policy. The scheduled actions invoke Python directly, with an interactive limited user: computer on and logged-in user required.

Health/audit completion is distinct from model availability, queue job completion and production readiness. Check AUTO_LATEST.json, per-run AUTO_LOGS summaries and the Task Scheduler last-result field. Model outage skips drafts but permits non-draft public inventory/report/backlog jobs. Paid, sensitive, encrypted, external and production requests are gated. Blocker prompts require an authorized engineering session; the scheduler does not implement arbitrary code repairs.

Run regression checks: `python -m unittest discover -s ops/boz/AUTO_TESTS -v`.

The SQL file is a staging rollback test for an observed missing EXECUTE grant; it is not automatically applied. Production role separation remains unverified.

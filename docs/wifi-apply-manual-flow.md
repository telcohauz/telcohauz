# Telcohauz BOZ — WiFi Apply (Manual Fulfilment) v0.1

Status: **STEP 1 — INTAKE SPECIFIED**. This is a workflow specification, **not** a live customer form, order database, or EasyApply integration.

## Source and destination
- Source: Telcohauz website / future TNG eWallet Mini Program after separate approval.
- Services: WiFi / broadband packages offered by the Telcohauzwifi agent e-store on EasyApply.
- Operator: Telcohauz owner / designated authorized staff.
- Fulfilment: **manual** in EasyApply agent dashboard and/or via official EasyApply agent WhatsApp channel; no API assumed.
- No customer submission to EasyApply or WhatsApp without proper customer notice and consent.

## STEP 1 — Customer enquiry intake (minimum necessary)
1. Full name
2. Contact phone / WhatsApp number
3. Installation postcode and state/area (not full address at initial enquiry)
4. Preferred WiFi provider and package (only verified/current packages)
5. Consent checkbox: "Saya bersetuju Telcohauz menghubungi saya mengenai permohonan WiFi ini dan berkongsi maklumat yang perlu dengan penyedia/perantara perkhidmatan untuk tujuan permohonan, tertakluk kepada Notis Privasi."
6. Optional remarks (with instruction **not** to share IC, passwords, account numbers, or other sensitive documents in free text)

Validation: require name, valid Malaysian contact format, 5-digit postcode, product selection and consent; present notice that package and coverage are subject to verification. Require consent server-side; client-only validation is insufficient.

## Order lifecycle
- NEW: enquiry received by Telcohauz (not an EasyApply order yet)
- NEEDS_INFO: missing information to proceed
- READY_TO_FORWARD: checked and consent recorded
- SUBMITTED_TO_EASYAPPLY: owner manually submitted, with reference ID if provided
- IN_PROCESS: provider handling application
- COMPLETED: verified successful installation/activation
- CANCELLED_OR_REJECTED: with reason, as appropriate

Do **not** claim WiFi installation, order acceptance, or commission upon initial form submission.

## Manual forwarding rule
- Telcohauz owner reviews the lead in an access-controlled BOZ admin dashboard.
- For the EasyApply dashboard, enter required customer details directly into the authenticated vendor form; do not automate their website without permission.
- If the owner uses agent WhatsApp, send only the minimum required details after consent and only to a confirmed official agent; prefer secure vendor portal for any identity documents.
- Manually record EasyApply reference, timestamp, channel, and order status in BOZ; protect personal data.
- Customer receives a Telcohauz acknowledgement, not a misleading vendor approval.

## Security + privacy implementation requirements
- Before enabling a live form: confirm Telcohauz privacy notice, named recipient purposes, data retention, secure access, and process for deletion.
- Use a restricted backend, server validation, spam/rate-limit protection, and proper authorization; never store customer data in GitHub, browser localStorage, frontend source code or public logs.
- IC / document upload are deliberately out of scope for the initial lead form.

## Next build step (not yet done)
Implement a secure lead-intake endpoint and restricted WiFi leads table (separate from unlocking `orders`), then a UI form that actually persists a NEW lead. Test submission end to end before advertising it.

## Acceptance criteria for the current step
- Agreement on what an initial WiFi lead must contain.
- Clear human handoff through both EasyApply dashboard and authorized agent WhatsApp.
- No false promise of automatic EasyApply API or Touch 'n Go Mini Program inclusion.

## Telcohauz self-funded customer cashback (OWNER CONCEPT APPROVED; NOT ACTIVE)
- Owner decision: Telcohauz itself funds any customer cashback from a portion of its **verified, received** EasyApply broadband commission. This is **not** an EasyApply or Touch 'n Go funded reward, and should never be described as one.
- **Do not advertise, promise, reserve, or pay cashback until** EasyApply and relevant broadband-provider promotion/agent terms are confirmed to allow it; for future TNG Mini Program, obtain approval for any campaign and payment mechanics separately.
- A submitted enquiry is **not** an eligible cashback event. Minimum suggested condition: verified successful installation/activation, application eligibility, commission credited and not reversed, and customer's reward eligibility validated. Make conditions and payout timing clear upfront.
- Do not advertise "cashback just for submitting" if it actually requires installation. Do not describe a self-funded reward as sponsored or guaranteed by EasyApply or TNG.
- Reward cap and amount must be decided from the **actual commission for each package** minus direct operating costs, contingencies and necessary margin. No fixed amount is approved yet.
- Record in the restricted BOZ system: internal application reference; campaign terms/version; eligibility; supplier commission status; cashback amount; approval; payout method/transaction proof; dates. Never put customer identity or payment details into GitHub.
- Prevent repeated/duplicate claims and fake applications. Refund/reversal rules need to be specified in customer-facing terms before launch.
- Preferred payout should use an approved, documented business payment workflow, not an assumed automated TNG cashback API.

**Next decision:** Verify supplier/provider permission and actual per-package net commission before choosing or publicly offering a cashback amount.

### Owner-reported maximum supplier commission
- Owner reports that EasyApply WiFi agent commission rates range from **280% (lowest)** to **370% (highest)** of the selected package's monthly fee (2.8–3.7 × monthly fee). Actual rate must be confirmed for each package; supplier terms and credited payouts are not yet independently verified.
- Example only: RM100/month package × 2.8 = RM280 gross commission at the lowest reported rate; × 3.7 = RM370 at the highest reported rate. These figures are conditional on actual package eligibility.
- Before setting customer cashback, check commission schedule for every actual package, payment/activation conditions, potential clawbacks, direct costs, and whether agent-funded cashback is permitted by provider/EasyApply terms. Cashback stays NOT ACTIVE until those checks and a net-margin budget are complete.

## Proposed 20% customer cashback rule

Status: **Owner-selected working proposal; not yet a published or payable promotion.**

- Owner-selected proposal: refund **20% of the actual EasyApply commission received by Telcohauz** to an eligible customer after verified broadband installation/activation and commission payment; retain remaining 80% before Telcohauz operating costs, taxes, refunds/clawbacks, and reserves.
- Owner-reported EasyApply commission range: 280%–370% of qualifying monthly plan price. Rates depend on the actual package; **do not assume every package receives 370%**.
- Formula: `supplier_commission = monthly_package_fee × confirmed_commission_rate`; `cashback = supplier_commission × 0.20`; `balance_before_costs = supplier_commission × 0.80`. Apply correct rounding to Malaysian sen at payout.
- Examples (not public guarantees): RM89 × 2.8 = RM249.20 commission, RM49.84 cashback, RM199.36 retained; RM89 × 3.7 = RM329.30, RM65.86 cashback, RM263.44 retained; RM100 × 2.8 = RM280, RM56 cashback, RM224 retained; RM100 × 3.7 = RM370, RM74 cashback, RM296 retained.
- Launch gates: confirm package-specific supplier commissions; ensure EasyApply/provider terms allow a Telcohauz-funded rebate; create clear eligibility, activation, commission-receipt, verification, refund/clawback, payout timing, eligibility and personal-data terms. Then test one manual payout securely.
- Customer-facing copy must never imply cashback on mere form submission, or that EasyApply/TNG sponsors or guarantees the reward. Payout will not be automated or advertised until the launch gates pass.

Next single task: **verify EasyApply package-specific commissions and any supplier restrictions on agent-funded cashback**; use authorized agent terms or account documentation, not customer records or credentials.

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

## Potential TNG Mini Program consented identity autofill (NOT APPROVED)

**Official documentation checked (Oct 2026):**
- https://miniprogram.tngdigital.com.my/docs/miniprogram_tngd/mpdev/api_openapi_getauthcode
- https://miniprogram.tngdigital.com.my/docs/miniprogram_tngd/mpdev/vs3pkf
- https://www.touchngo.com.my/business/mini-program
- `auth_user / USER_INFO` gives registered name, mobile, email with interactive user authorization and is listed as preassigned to merchants; use only once approved as a TNG partner.
- `USER_INFO_EKYC` describes verified name, ID type/number, nationality, identity-card address, DOB, etc. It is **not preassigned**, is **not silent**, and requires business approval and individual customer authorization. Having an eWallet account does NOT entitle Telcohauz to see or reuse NRIC numbers.
- Proposed user journey after approved integration: customer opens TNG Mini Program > explicitly authorizes relevant identity fields > sees and checks prefilled name/contact (and NRIC only if approved and necessary) > manually specifies WiFi **installation address** (may differ from IC address) and package > explicitly consents to Telcohauz's processing and onward sharing with named service providers/EasyApply where required > submits application for Telcohauz's manual review and forwarding.
- Minimize personal data: prefer verified-identity indicator or confirmed contact without storing NRIC unless necessary for authorized broadband order; encrypted server-only access, restricted staff, audit trail, short retention, no raw PII in app logs, URLs, GitHub or WhatsApp. For ID documents use an approved secure channel, not routine WhatsApp forwarding.
- Non-TNG website route must still work through ordinary customer data entry and informed consent.
- **No TNG partnership, access scope, API provisioning, EasyApply permission, or production auto-fill is active yet.** TNG Mini Program and any scope access are separate commercial and technical approvals.

**Next single external step:** Request from TNG Mini Program partnerships eligibility requirements and approved auth scopes (`auth_user`, optionally `USER_INFO_EKYC`) for a consent-based WiFi application use case; separately validate EasyApply/provider disclosure requirements. Do not request individual customer data during the application.

## Proposed additional product path: WiFi + Phone (NOT YET SOURCED)

Owner intends to source more products, including optional **WiFi + HP/phone** offers, in addition to WiFi-only applications.

Customer-facing product choices (planned):
1. `WiFi Sahaja` — broadband package application.
2. `WiFi + Telefon` — an actual supplier-approved bundle, OR two clearly identified linked applications if no genuine bundle exists (never mislabel as one bundle).

Product listing must include: verified supplier, service/provider, plan name, monthly fee, phone make/model & storage, one-time/upfront cost, financing/instalment obligations, contract length, eligibility and credit checks, coverage, supply availability, early termination costs, commission/cashback eligibility and provider terms. Do not display fictitious phone subsidies or "free phone" claims.

BOZ order model: capture preferred offer type and basic safe enquiry information first. Only collect extra ID/payment data in an authorized secure application process after transparent customer consent. Staff may manually forward to EasyApply and/or other **approved** suppliers, and separately track each application and external status/reference. Do not assume EasyApply offers phone bundles; check product rights and commission terms per supplier.

Cashback: proposed owner-funded 20% applies only to **actual eligible commission received** on relevant transactions, after confirming contract/supplier promotional terms and net margin. Bundle cashbacks and returns/reversals require independent verification; don't promise a payment while waiting for supplier commission.

TNG Mini Program concept: customer selects WiFi-only or WiFi+phone and explicitly consents to permitted, minimal identity/contact prefill; TNG Mini Program partnership / scopes and each product's supplier rights remain **not approved**.

**Next single sourcing task:** obtain *one* real provider/supplier WiFi+HP package document or price list, including commercial terms. Validate it before building or advertising a bundle.

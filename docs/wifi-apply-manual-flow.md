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

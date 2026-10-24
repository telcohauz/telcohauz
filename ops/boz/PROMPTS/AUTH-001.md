# AUTH-001 — Prompt pelaksanaan

Keutamaan: P1
Kebergantungan tindakan: SEC-002, SEC-003

Baca MASTER_RECOVERY_AUTOMATION_PROMPT.md, sumber semasa, AGENTS.md berkaitan dan jurnal sebelum sunting. Backup/version guard wajib; jangan dedah rahsia.

1. Bezakan login Vercel SSO dan auth Supabase aplikasi. Gunakan sesi login pemilik tanpa menyalin password ke chat.
2. Uji owner/staff, refresh, logout, expired session, recovery dan redirect. Pastikan role backend menentukan akses, bukan UI sahaja.
3. Uji checkout replay, idempotency key, stok concurrent, unpaid/failed payment, refund/void dalam staging. Jangan caj pelanggan sebenar.
4. Catat endpoint, sanitized request, expected deny/allow, data rollback dan bukti audit setiap kes.

Kriteria DONE: hasil sebenar boleh diulang, ujian relevan lulus, integrasi/permissions disahkan, bukti/hash disimpan. Jika terhalang, catat punca tepat, dependency sebenar, command/link sah dan teruskan kerja bebas. Health probe sahaja bukan DONE.

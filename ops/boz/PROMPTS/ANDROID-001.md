# ANDROID-001 — Prompt pelaksanaan

Keutamaan: P3
Kebergantungan tindakan: AUTH-001

Baca MASTER_RECOVERY_AUTOMATION_PROMPT.md, sumber semasa, AGENTS.md berkaitan dan jurnal sebelum sunting. Backup/version guard wajib; jangan dedah rahsia.

1. Padankan APK 16,854 bytes dengan source/commit. Audit manifest min/target SDK, permissions dan network config.
2. Sahkan signing secara tempatan tanpa mendedah keystore; tentukan wrapper WebView vs complete client.
3. Uji device sah: login, session, offline/network failure, receipts dan checkout synthetic.
4. Bina AAB staging, privacy/data safety/listing; Play submission dan sebarang yuran memerlukan tindakan pemilik berasingan.

Kriteria DONE: hasil sebenar boleh diulang, ujian relevan lulus, integrasi/permissions disahkan, bukti/hash disimpan. Jika terhalang, catat punca tepat, dependency sebenar, command/link sah dan teruskan kerja bebas. Health probe sahaja bukan DONE.

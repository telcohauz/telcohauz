# BUILD-001 — Prompt pelaksanaan

Keutamaan: P1
Kebergantungan tindakan: Tiada

Baca MASTER_RECOVERY_AUTOMATION_PROMPT.md, sumber semasa, AGENTS.md berkaitan dan jurnal sebelum sunting. Backup/version guard wajib; jangan dedah rahsia.

1. Gunakan branch recovery/public-lockfile-20261024. Kekalkan versi direct dependencies daripada lock asal dan resolusi npm public yang sah.
2. Jalankan npm ci --ignore-scripts --registry=https://registry.npmjs.org; npm run lint; npx tsc --noEmit; npm run build.
3. Jangan disable rule lint. Baiki error yang tinggal dengan types sebenar; warnings/hook dependencies mesti dinilai.
4. Tambahkan CI ubuntu/windows dengan lock yang sama; hapus konflik package-manager secara terkawal dan kekalkan asal melalui Git history. Buka draft PR; jangan merge/deploy sebelum integration/security gate.

Kriteria DONE: hasil sebenar boleh diulang, ujian relevan lulus, integrasi/permissions disahkan, bukti/hash disimpan. Jika terhalang, catat punca tepat, dependency sebenar, command/link sah dan teruskan kerja bebas. Health probe sahaja bukan DONE.

# TELCOHAUZ BOZ — MASTER CODEX RECOVERY, FIX-ALL & AUTOMATION PROMPT
Tarikh: 24 Oktober 2026 | Pemilik: Telcohauz | Aplikasi utama: BOZ Boss by Telcohauz

Anda ialah execution engineer untuk sistem Telcohauz BOZ. BUKAN sekadar audit/pelan: lakukan kerja sebenar yang boleh dilakukan dalam sesi, dengan ujian dan bukti. Semua operasi mesti sah, reversible, tanpa kos baru, tanpa mencipta dakwaan palsu bahawa produksi sudah sedia.

## A. SOURCE OF TRUTH / PENYAMBUNGAN
1. Mulakan dengan membaca:
   D:\TELCOHAUZ_BOS\00_CONTROL_CENTER\NEXT_RESUME.md
   D:\TELCOHAUZ_BOS\00_CONTROL_CENTER\MASTER_STATUS.md
   D:\TELCOHAUZ_BOS\00_CONTROL_CENTER\MASTER_BLOCKER_REGISTER.json
   D:\TELCOHAUZ_BOS\00_CONTROL_CENTER\EXECUTION_JOURNAL.md
   D:\TELCOHAUZ_BOS\00_CONTROL_CENTER\DATABASE_AUDIT.md
   D:\TELCOHAUZ_BOS\00_CONTROL_CENTER\OWNER_ACTION_REQUIRED.md
   D:\TELCOHAUZ_BOS\00_CONTROL_CENTER\AUTO_STATUS.md
   D:\TELCOHAUZ_BOZ_AI_WORKFORCE\SOP.md
2. Periksa keadaan SEBENAR selepas checkpoint melalui Remote Desktop Commander / shell sah, GitHub, Supabase, Vercel, Lovable/Floot/Google Drive/Notion (jika sambungan tersedia); jangan anggap rekod lama bukti terbaru.
3. Kekalkan ID katalog 115 sejarah, ID blocker, transaksi, sumber asal; dedupe berdasarkan bukti, bukan nama. Sandarkan fail/data dahulu. Rekod hash, commit SHA dan masa Asia/Kuala_Lumpur.
4. Tentukan setiap projek: sumber kod sebenar, repo, host, DB sebenar, tujuan, status, berapa langkah belum, apa ujian diperlukan. Jangan silap anggap prototaip sebagai POS aktif.

## B. KEADAAN TERAKHIR YANG PERLU DISEMAK SEMULA
- GitHub repo telcohauz/telcohauz, draft PR #4 security config (CI configuration-hygiene lulus; PR belum merge).
- 39 ujian Windows pernah lulus (29 POS + 10 workforce); itu bukan pengesahan produksi.
- Ollama pada 127.0.0.1:11434 tidak menjawab; model worker: qwen3:1.7b; worker.lock lama PID 29200 memerlukan pemeriksaan.
- bun.lock mempunyai URL registry cache Lovable 'europe-west4-npm.pkg.dev/lovable-core-prod/sandbox-npm-cache' yang memulangkan 403. npm registry awam /react HEAD pernah menjawab HTTP 200.
- 10 blocker aktif: SEC-002, SEC-003, BUILD-001, AUTH-001, WF-001, CAT-001, PAY-001, ANDROID-001, SCOPE-001, OUTPUT-001.
- Pemetaan Supabase belum sah; POS login/checkout, tenant isolation, callbacks dan transaksi pengeluaran belum diuji.
- Jadual Windows TELCOHAUZ_BOZ_HOURLY serta TELCOHAUZ_BOZ_DAILY_TESTS pernah didaftarkan; sahkan status dan run history sebenar, jangan menganggap pendaftaran = kerja selesai.

## C. P0: DATA, KESELAMATAN DAN PRODUKSI
SEC-002: Kenal pasti semua Supabase project refs, env deployment terikat, domain, schema, RPC, migrasi, RLS, bucket, function, dan pemilik kod. Bina matriks APP -> URL -> DB -> tables -> role -> environment dengan project refs tidak sensitif; jangan cetak token, key atau password. Sahkan POS sebenar (bukan repo berbeza) sebelum mengubah env. Jalankan ujian read-only dahulu, buat backup dan rollback. Jangan migrasi/overwrite data produksi secara automatik.
SEC-003: Sahkan Auth password-leak protection/kelayakan pelan, polisi RLS, SECURITY DEFINER, EXECUTE grants, tenant isolation untuk OWNER/STAFF dan dua kedai berlainan menggunakan dua akaun ujian yang sah. Buktikan akses silang ditolak untuk produk, stok, invoice, repair, checkout, fail dan rekod harga kos. Semak row-level write, storage ACL, data integrity dan audit log. Jika tetapan perlu klik pemilik/plan berbayar, hasilkan link dan mark BLOCKED bukan workaround.
Security PR #4: Audit diff 4 fail, branch dan CI. Fail .env lama tersimpan dalam Git history; tentukan risiko kredensial (anon key tidak disamakan dengan service-role). Siasat revision sejarah tanpa memaparkan nilainya. Jangan force-push/rewrite sejarah tanpa plan koordinasi, dan jangan merge sebelum linter/build/integrasi dan review selesai. Pastikan secret scanner, .gitignore, .env.example dan CI guards berfungsi.

## D. P1: BUILD, AUTH, WORKFORCE
BUILD-001: Audit lockfile dan semua tarball URL 403. Pilih kaedah berlesen/sah melalui npm registry awam dan sumber rasmi. Dalam branch recovery berasingan bina semula lockfile secara reproducible daripada versi package.json yang selaras, bukan edit raw lock secara membuta tuli. Jalankan install --frozen-lockfile, lint, typecheck jika wujud, build penuh, unit/integration/smoke. Pastikan build Windows + Linux CI lulus; check hash dan supply chain. Sekiranya package private memerlukan credentials, buat permintaan login yang sah, jangan bypass. Simpan log redacted dan bukti.
AUTH-001: Uji login, refresh/logout, owner/staff permissions, lost session, duplicate transaction protection, idempotency checkout/repair/sales, rollback stok, unpaid order, pembayaran gagal, role separation. Guna synthetic test users; jangan ambil password/OTP melalui chat.
WF-001: Periksa winget install Ollama yang mungkin telah dimulakan, keberkesanan pemasangan, services/port, kuota RAM/disk; jika tersedia, jalankan official local model qwen3:1.7b setelah semak kesesuaian dan saiz model, dan uji /api/tags + /api/generate dengan teks neutral serta nonempty response. Jangan pulangkan teks thinking sebagai jawapan. Semak worker.lock PID 29200 dengan process commandline, queue SQLite dan job running; arkib lock hanya jika disahkan stale; jangan jalankan init ketika worker hidup. Sambung queued jobs. HR-001 lama blocked: buat job retry dengan ID baru dan rujukan lama HANYA jika model sudah diuji; jangan palsukan DONE. Jaga single worker, transaksi SQLite, idempotency, max retries, output SHA256.
OUTPUT-001: Jangan paksa cipta direktori root /codex jika tiada permission. Simpan setiap checkpoint/output ke Windows D:\TELCOHAUZ_BOS\00_CONTROL_CENTER dan working directory sah, lalu sync ke repositori yang sesuai melalui PR selepas redaction.

## E. P2/P3: KATALOG, PAYMENTS, ANDROID, SKOP SEMUA PROJEK
CAT-001: Audit 16,606 rekod katalog, sejarah invoice/WPS/Google Photos, inventori sebenar, tarikh foto, bukti harga semasa tarikh foto, owner/branch dan kuantiti; dedupe berdasarkan ID/hash; generate dry-run import dengan konflik, bukti, rollback. Jangan anggap foto bermaksud stok.
PAY-001: Sahkan merchant/KYC/provider agreements, kontrak telco dan callback pembayaran secara read-only/sandbox; verifikasi signature webhook, replay protection, reconcile settlements, refund dan gagal bayar. Tiada caj pelanggan sebenar/submit order tanpa pengesahan.
ANDROID-001: Audit source vs APK 16,854 bytes, Android SDK, signing keystore (jangan dedah), permission, AAB, app ID, Play Console syarat dan real-device test. Jangan terbitkan ke Play/commit biaya tanpa kelulusan amaun.
SCOPE-001: Audit 13 repositori GitHub, empat projek Vercel, sembilan READY deployments mengikut baseline kemudian semak semasa; hub BOZ, POS, WiFi/telco, inventory, repairs/maps, AI chatbot, content monetization, comedy cartoon affiliate, Drama Studio, Money Lab, EV, local AI, invoices/HR/finance dan integrations. Imbas Notion, Drive, Lovable, Floot, Wix/Shopify bila akses sah ada. Kelaskan DONE hanya dengan bukti; jika tiada akses, BLOCKED dan pautan login tepat.

## F. AUTOMASI SEBENAR, BUKAN JANJI
1. Semak dan perbaiki D:\TELCOHAUZ_BOS\00_CONTROL_CENTER\BOZ_AUTO_ORCHESTRATOR.ps1, REGISTER_BOZ_AUTOMATION.ps1, AUTO_LATEST.json dan AUTO_LOGS.
2. Jadual semakan setiap jam, ujian workforce harian 06:00 Asia/Kuala_Lumpur. Pastikan Windows Task Scheduler Ready -> Last Run=success -> laporan/log timestamp berubah. Jika sistem tutup atau user logout, jelaskan limitation; jangan claim cloud 24/7.
3. Worker yang tersedia mesti mengambil jobs queued selamat (classification=public, internal drafts/report/inventory/backlog) secara idempotent; encrypted/sensitive/paid/external actions = approval_required. Jangan memberi worker shell/network tanpa reka bentuk permission dan audit yang ketat.
4. Tambah pemeriksaan bagi setiap blocker, dependency graph, queue priority P0->P3, retry hanya transient dengan exponential backoff & cap, skip blocked serta true dependents dan teruskan tugas independen. Apabila blocker pulih, buka semula pekerjaan sesuai tanpa menimpa sejarah.
5. Untuk setiap pembaikan, automasi: discover -> plan -> safe execute -> tests -> evidence/hash -> status -> checkpoint -> next action. Jangan automerge, publish produksi, spend, change bank/account, sign contracts, handle real customer data, send bulk emails, atau membuat sebarang submission sebenar tanpa gate jelas.
6. Jika model Ollama unavailable, audit/tests mesti tetap berjalan dan berlapor BLOCKED; tiada dummy AI success.
7. Hasilkan dashboard minimal BOZ dengan project, DONE/IN_PROGRESS/BLOCKED/REMAINING, blocker, owner action, live URL, test evidence, status income actual (verified only), next action, and timestamps. Laporan di Windows dan jika sesuai melalui PR/website selepas redaction. Jangan auto-post data sulit.

## G. OWNER ACTIONS / SEMPADAN
Pemilik cuma login sendiri di halaman rasmi dan beri persetujuan spesifik untuk perbelanjaan, KYC, pelanggan sebenar, settlement, irreversible DB migrations, production release. Jangan meminta token/key/password/OTP dalam chat. Auto approval terdahulu untuk perubahan kod dan tugasan dalaman bukan izin membelanjakan wang atau membypass keselamatan.
Titik masuk:
GitHub PR https://github.com/telcohauz/telcohauz/pull/4
GitHub Actions https://github.com/telcohauz/telcohauz/actions
Supabase https://supabase.com/dashboard
Vercel POS https://vercel.com/ashraffrahman3677-4925/telcohauz-boz-pos-admin-preview
POS preview https://telcohauz-boz-pos-admin-preview-3ygoqnu8a.vercel.app
Windows Task Scheduler: taskschd.msc

## H. OUTPUT WAJIB & DEFINITION OF DONE
- Kemaskini MASTER_BLOCKER_REGISTER.json tanpa membuang ID lama; setiap blocker mesti ada status, cause, exact command or link, evidence, test, last_checked, next_action, dependency.
- Kemas kini MASTER_STATUS.md, EXECUTION_JOURNAL.md, NEXT_RESUME.md, AUTO_STATUS.md, OWNER_ACTION_REQUIRED.md dan dashboard.
- Simpan commit diff/PR link, reproducible command, test counts + exit codes, latest deployment hashes. Buat branch/PR bagi code changes. Merge hanya selepas guard lulus dan risiko diterima.
- Untuk setiap projek: sumber betul, behavior diterima, tests/rollback, deployment dibuktikan, revenue bukti transaksi sebenar jika relevan.
- Akhir sesi beri ringkasan empat bahagian: DISELESAIKAN (bukti), MASIH BLOCKED (sebab tepat), AUTOMASI AKTIF (last run), dan TINDAKAN OWNER (pautan rasmi sahaja).
- Jangan berhenti kerana satu blocker: dinamically skip task/dependents dan teruskan yang independent. Jangan rekaan ujian, transaksi, status selesai, auto income atau deployment.
MULA SEKARANG dengan semakan live, backup, kerja P0, pembaikan teknikal, ujian dan dokumentasi sampai titik sebenar akses atau keselamatan menghalang.

## I. KONTRAK EXECUTOR SETEMPAT
Automasi yang dipasang ialah maintenance allowlist: pemeriksaan blocker, ujian sintetik, satu queued job public/internal setiap kitaran. Ia tidak mengubah kod secara autonomi untuk semua 115 projek dan tidak mempunyai sesi cloud connector. Setiap prompt di PROMPTS mesti dilaksanakan oleh sesi Codex berakses sah dan diuji sebelum status DONE. Model Ollama tidak boleh menjana arahan shell untuk dilaksanakan.

Jadual: setiap jam dan 06:00 MYT. Ujian harian merangkumi BOZ API/SQLite, Workforce dan orchestrator. OS lock menghalang dua orchestrator serentak. Model gagal tidak menghalang audit/ujian atau job inventory/report/backlog. Draft ditangguh sehingga inference neutral tidak kosong. Tindakan berbayar, sensitif, encrypted, external atau production kekal gated.

Replay: baca AUTO_LATEST.json dan AUTO_LOGS/<run>/summary.json, semak hash dan exit code. Ujian model disimpan sebagai hash sahaja. Gunakan NEXT_RESUME.md bagi perintah sebenar; jangan dakwa Task Scheduler Ready bermaksud run berjaya.

Nota pelaksanaan: .ps1 registration disekat Execution Policy Restricted pada PC ini. Gunakan REGISTER_BOZ_AUTOMATION.cmd atau schtasks.exe secara langsung; jangan ubah polisi global. Task sebenar memanggil Python terus.

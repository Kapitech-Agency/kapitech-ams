import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUpRight, Briefcase, CalendarDays, CircleDollarSign, FileText, Landmark, Plus, RefreshCw, ShieldAlert, WalletCards } from 'lucide-react';
import { AdminMetricStrip, AdminModuleHeader, AdminPageShell, AdminPanel, AdminSectionTabs, AdminStatusBadge } from '../../components/admin/AdminModulePrimitives';
import Button from '../../components/ui/Button';
import { Drawer } from '../../components/ui/Drawer';
import { api } from '../../lib/apiClient';
import { normalizeFinanceExpense, normalizeFinanceInvoice } from '../../lib/financeStore';
import type { AgencyExpense, AgencyInvoice } from '../../lib/financeStore';
import type { AgencyProject } from '../../lib/projectStore';
import type { AgencyVendor } from '../../lib/vendorStore';
import {
  classifyWorkbookExpense,
  EXCEL_CHART_OF_ACCOUNTS,
  FINANCE_WORKBOOK_GROUPS,
  buildFinanceSourceJournalDrafts,
  getVendorBillInstallmentSchedule,
  getInvoiceCollected,
  getInvoiceDate,
  getInvoiceOutstanding,
  getMonthKey,
  getPaymentRows,
  getYearKey,
  isIssuedInvoice,
  sumAmounts
} from '../../lib/financeWorkbook';
import type { FinanceWorkbookTab, WorkbookExpenseClass } from '../../lib/financeWorkbook';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../lib/LanguageContext';
import type { Language } from '../../lib/LanguageContext';

type Column = { label: string; align?: 'left' | 'right' | 'center'; className?: string };
type TableRow = { id: string; cells: React.ReactNode[] };
type SourceResult = { label: string; data: any; error?: string };
type WorkbookRecord = { id: string; recordType: string; recordKey: string; periodKey?: string; projectId?: string; status: string; payload: Record<string, any>; version: number; createdByUserId?: string; createdAt: string; updatedAt: string };
type RegisterField = { key: string; label: string; type: 'text' | 'number' | 'date' | 'month' | 'select' | 'textarea'; required?: boolean; options?: string[]; optionSource?: 'vendorBills' | 'accounts' | 'cashAccounts' | 'projects' | 'vendors'; placeholder?: string; help?: string; defaultValue?: string | number; visibleWhen?: { key: string; values: string[] } };
type CashMovement = { id: string; date: string; reference: string; description: string; cashIn: number; cashOut: number; source: string; currency: string };

const FINANCE_UI_COPY: Record<string, string> = {"Overview & Control":"Ringkasan & Kontrol","Transactions & Cash":"Transaksi & Kas","Receivables & Payables":"Piutang & Utang","Accounting & Reports":"Akuntansi & Laporan","Executive Summary":"Ringkasan Eksekutif","Dashboard":"Dasbor","Chart of Accounts":"Bagan Akun","Revenue":"Pendapatan","Expenses":"Pengeluaran","Cash & Bank":"Kas & Bank","Petty Cash":"Kas Kecil","Accounts Receivable":"Piutang usaha","Accounts Payable":"Utang usaha","Team Fee":"Honor Tim","Operational Budget":"Anggaran Operasional","Project Allocation":"Alokasi Proyek","Monthly P&L":"Laba Rugi Bulanan","Cash Flow":"Arus Kas","Monthly Closing":"Penutupan Bulanan","Balance Sheet":"Neraca","Journal":"Jurnal","Annual Summary":"Ringkasan Tahunan","Company-wide financial summary and allocation overview.":"Ringkasan keuangan perusahaan dan gambaran alokasi.","Operational finance KPIs and recent monthly movement.":"KPI keuangan operasional dan pergerakan bulanan terbaru.","Master account codes and normal balances from the workbook.":"Kode akun utama dan saldo normal dari workbook.","Revenue register sourced from issued client invoices.":"Daftar pendapatan yang bersumber dari invoice klien yang diterbitkan.","Expense register sourced from finance expenses in AMS.":"Daftar pengeluaran yang bersumber dari data pengeluaran AMS.","Cash movement view built from recorded receipts and expenses.":"Tampilan pergerakan kas dari penerimaan dan pengeluaran yang tercatat.","Petty-cash register and controls required by the workbook.":"Daftar kas kecil dan kontrol yang dibutuhkan workbook.","Invoice balances, due dates and payment status.":"Saldo invoice, tanggal jatuh tempo, dan status pembayaran.","Vendor obligations and the bill records still required.":"Kewajiban vendor dan catatan tagihan yang diperlukan.","Vendor directory, contracts, rates and payment references.":"Direktori vendor, kontrak, tarif, dan referensi pembayaran.","Project team-fee allocation, kept separate from Team Reward.":"Alokasi honor tim proyek, terpisah dari Team Reward.","Project-level budget, invoicing, receipts and recorded costs.":"Anggaran, invoice, penerimaan, dan biaya tercatat pada tingkat proyek.","Budget-versus-actual controls and variance review.":"Kontrol anggaran terhadap realisasi dan tinjauan selisih.","The workbook allocation policy for net project profit.":"Kebijakan alokasi workbook untuk laba bersih proyek.","Monthly profit-and-loss view based on the workbook structure.":"Tampilan laba rugi bulanan berdasarkan struktur workbook.","Monthly cash inflow, outflow and net movement.":"Arus kas masuk, keluar, dan pergerakan bersih bulanan.","Month-end checklist and reconciliation controls.":"Daftar periksa akhir bulan dan kontrol rekonsiliasi.","Company-wide assets, liabilities and equity readiness.":"Kesiapan aset, liabilitas, dan ekuitas perusahaan.","Double-entry mapping and source transactions awaiting posting.":"Pemetaan pembukuan berpasangan dan transaksi sumber yang menunggu posting.","Company-wide annual finance summary.":"Ringkasan keuangan tahunan perusahaan.","Excel-aligned finance workflow · 20 workbook sheets · existing AMS design system":"Alur kerja keuangan sesuai Excel · 20 sheet workbook · sistem desain AMS yang ada","Open transaction workspace":"Buka ruang transaksi","Refresh data":"Muat ulang data","Loading sources":"Memuat sumber data","Partial source availability":"Sebagian sumber tidak tersedia","Connected source views":"Tampilan sumber terhubung","Finance groups":"Kelompok keuangan","Finance workbook sheets":"Sheet workbook keuangan","Loading finance sources":"Memuat sumber data keuangan","Reading live AMS invoice, expense, project and vendor records.":"Membaca data invoice, pengeluaran, proyek, dan vendor AMS.","Recent transaction activity":"Aktivitas transaksi terbaru","Selected-month activity":"Aktivitas bulan terpilih","Reporting month":"Bulan pelaporan","Invoice value issued":"Nilai invoice yang diterbitkan","Cash movement in / out":"Pergerakan kas masuk / keluar","Some finance sources are unavailable":"Beberapa sumber keuangan tidak tersedia","KPI values only reflect source records that loaded successfully. Refresh after the connection is restored.":"Nilai KPI hanya mencerminkan data sumber yang berhasil dimuat. Muat ulang setelah koneksi pulih.","Recent invoice register":"Daftar invoice terbaru","Finance at a glance":"Ringkasan keuangan","Latest issued invoices with current outstanding balances.":"Invoice terbaru beserta saldo terutang saat ini.","Recent invoice records. Use the workbook sheet tabs above to continue into the detailed finance flow.":"Catatan invoice terbaru. Gunakan tab sheet workbook di atas untuk melihat alur keuangan secara terperinci.","No issued invoices were returned by AMS.":"AMS tidak mengembalikan invoice yang diterbitkan.","Workbook flow":"Alur workbook","Transactions":"Transaksi","Invoice and expense records loaded":"Data invoice dan pengeluaran dimuat","Project records":"Data proyek","Vendor records":"Data vendor","Search invoice, client or project":"Cari invoice, klien, atau proyek","Search invoices…":"Cari invoice…","Manage invoices":"Kelola invoice","Manage expenses":"Kelola pengeluaran","Account code":"Kode akun","Account name":"Nama akun","Account type":"Jenis akun","Normal balance":"Saldo normal","Description":"Deskripsi","Date":"Tanggal","Reference":"Referensi","Transaction date":"Tanggal transaksi","Movement type":"Jenis pergerakan","Movement direction":"Arah pergerakan","Cash account":"Akun kas","Counterpart account":"Akun lawan","Opening balance":"Saldo awal","Opening balance (IDR)":"Saldo awal (IDR)","Opening date":"Tanggal saldo awal","Reporting period":"Periode pelaporan","Reporting year":"Tahun pelaporan","Search":"Cari","Category":"Kategori","Project":"Proyek","Client":"Klien","Actions":"Tindakan","Amount":"Jumlah","Amount (IDR)":"Jumlah (IDR)","Bill amount":"Jumlah tagihan","Payment amount":"Jumlah pembayaran","Bill number":"Nomor tagihan","Bill date":"Tanggal tagihan","Due date":"Tanggal jatuh tempo","Payment date":"Tanggal pembayaran","Payment method":"Metode pembayaran","Payment reference":"Referensi pembayaran","Vendor / freelancer":"Vendor / freelancer","Vendor bill":"Tagihan vendor","Scheduled payment":"Pembayaran terjadwal","Budget not set":"Anggaran belum diatur","Set budget":"Atur anggaran","Add budget line":"Tambah baris anggaran","Project Finance Setup":"Pengaturan keuangan proyek","Project name / Excel key":"Nama proyek / kunci Excel","Contract value (IDR)":"Nilai kontrak (IDR)","Vendor commitment (IDR)":"Komitmen vendor (IDR)","Other obligations (IDR)":"Kewajiban lain (IDR)","Project status":"Status proyek","Start date":"Tanggal mulai","End date":"Tanggal selesai","Project Team Fee":"Honor Tim Proyek","Team member":"Anggota tim","Fee amount (IDR)":"Jumlah honor (IDR)","Payment status":"Status pembayaran","General Journal Entry":"Entri Jurnal Umum","Journal date":"Tanggal jurnal","Debit account":"Akun debit","Credit account":"Akun kredit","Cancel":"Batal","Save changes":"Simpan perubahan","Save record":"Simpan catatan","Saving…":"Menyimpan…","Add journal entry":"Tambah entri jurnal","Generate source drafts":"Buat draf dari sumber","Create control":"Buat kontrol","Close period":"Tutup periode","Not recorded":"Belum tercatat","Not set":"Belum diatur","Not available":"Tidak tersedia","Open":"Terbuka","Closed":"Ditutup","Paid":"Lunas","Unpaid":"Belum dibayar","Partially Paid":"Dibayar sebagian","Overpaid":"Kelebihan bayar","Active":"Aktif","Completed":"Selesai","Cancelled":"Dibatalkan","Pending":"Menunggu","Approved":"Disetujui","Posted":"Dibukukan","Draft":"Draf","In Progress":"Sedang berlangsung","Kas dan rekening bank":"Cash and bank accounts","Kas kecil/reserve":"Petty cash reserve","Dana darurat":"Emergency fund","Piutang pelanggan":"Customer receivables","Hutang vendor/freelancer":"Vendor/freelancer payables","Modal":"Capital","Laba ditahan":"Retained earnings","Pendapatan project":"Project revenue","Fee vendor/freelancer":"Vendor/freelancer fees","Kewajiban project lain":"Other project obligations","Reward sales":"Sales reward","Reward vendor/PIC":"Vendor/PIC reward","Reward management":"Management reward","Fee tim project":"Project team fee","Biaya bank/admin":"Bank/administration fees","Biaya operasional perusahaan":"Company operating expenses","Overview":"Ringkasan","Control":"Kontrol","Sheet":"Lembar","Finance sections":"Bagian keuangan","Source available":"Sumber tersedia","IDR-only period view; accounting net profit and closing cash depend on ledger posting, opening balances and reconciliation.":"Tampilan periode khusus IDR. Laba bersih akuntansi dan saldo kas akhir bergantung pada posting buku besar, saldo awal, dan rekonsiliasi.","Accounts receivable":"Piutang usaha","Accounts payable":"Utang usaha","Account mapping":"Pemetaan akun","Cash transfer":"Transfer kas","Invoice payment":"Pembayaran invoice","Expense record":"Catatan pengeluaran","Opening balance saved":"Saldo awal disimpan","Opening balance missing":"Saldo awal belum tersedia","No vendor bills available":"Tidak ada tagihan vendor","No vendor bills have been entered. Create a bill in Accounts Payable to generate the 30% / 20% / 50% schedule.":"Belum ada tagihan vendor. Buat tagihan di Utang Usaha untuk membuat jadwal 30% / 20% / 50%.","No vendor bills have been recorded yet.":"Belum ada tagihan vendor yang tercatat.","No vendor contracts are available in AMS.":"Tidak ada kontrak vendor yang tersedia di AMS.","No opening balances have been entered.":"Belum ada saldo awal yang dimasukkan.","No chart-of-account rows match the current search.":"Tidak ada akun yang cocok dengan pencarian.","No dated cash movement is available. Set an opening balance or record a movement.":"Tidak ada pergerakan kas bertanggal. Atur saldo awal atau catat pergerakan kas.","No expense source record is classified as Project Team Fee.":"Tidak ada catatan pengeluaran yang diklasifikasikan sebagai Honor Tim Proyek.","No individual Team Fee allocation has been recorded.":"Belum ada alokasi Honor Tim yang tercatat.","No project allocation has been saved yet. Configure it from the current contract value and project obligations.":"Belum ada alokasi proyek yang disimpan. Atur menggunakan nilai kontrak dan kewajiban proyek saat ini.","No records exist for the selected year.":"Tidak ada catatan untuk tahun yang dipilih.","No eligible or skipped source rows were found.":"Tidak ditemukan baris sumber yang memenuhi syarat atau dilewati.","No general journal entries have been saved.":"Belum ada entri jurnal umum yang disimpan.","No petty-cash vouchers or transfers are recorded.":"Belum ada voucher kas kecil atau transfer yang tercatat.","No outstanding invoice balances were returned by the current AMS invoice source.":"Sumber invoice AMS saat ini tidak mengembalikan saldo terutang.","No issued invoice data is available for the selected search.":"Tidak ada data invoice terbit untuk pencarian ini.","No expense records match the selected search.":"Tidak ada catatan pengeluaran yang cocok dengan pencarian.","No vendor records were returned by AMS.":"AMS tidak mengembalikan catatan vendor.","No recorded payment or expense activity is available from the connected AMS sources.":"Tidak ada aktivitas pembayaran atau pengeluaran dari sumber AMS yang terhubung.","No AMS projects were returned. A named project record can still be created from the workbook register.":"AMS tidak mengembalikan proyek. Catatan proyek tetap dapat dibuat dari daftar workbook.","No activity exists for the selected month.":"Tidak ada aktivitas pada bulan yang dipilih.","No budget lines or dated expense records exist for the current search.":"Tidak ada baris anggaran atau catatan pengeluaran bertanggal untuk pencarian ini.","No dated receipts or expense movements are available.":"Tidak ada penerimaan bertanggal atau pergerakan pengeluaran yang tersedia.","The Finance record could not be saved.":"Catatan Finance tidak dapat disimpan.","The approval could not be completed.":"Persetujuan tidak dapat diselesaikan.","The period could not be closed.":"Periode tidak dapat ditutup.","Source did not return a successful response.":"Sumber tidak mengembalikan respons berhasil.","Source is not available.":"Sumber tidak tersedia.","Source journal drafts could not be generated.":"Draf jurnal sumber tidak dapat dibuat.","The workbook's Revenue tab maps to issued invoices; payment collections remain attached to the invoice payment records.":"Tab Revenue pada workbook dipetakan ke invoice terbit. Penerimaan pembayaran tetap terhubung ke catatan pembayaran invoice.","Transactions stay connected to their AMS source record; manual transfer/adjustment entries use the supplementary workbook register.":"Transaksi tetap terhubung ke catatan sumber AMS. Entri transfer atau penyesuaian manual menggunakan daftar tambahan workbook.","Existing AMS contracts are shown as commitments; a contract alone is not treated as a payable bill.":"Kontrak AMS ditampilkan sebagai komitmen. Kontrak saja tidak dianggap sebagai tagihan utang.","Existing AMS expenses are the source for recorded costs. Unmapped categories should be resolved before final workbook-style P&L posting.":"Pengeluaran AMS yang tercatat menjadi sumber biaya. Kategori yang belum dipetakan harus diselesaikan sebelum posting Laba Rugi mengikuti workbook.","Current source coverage for the Excel account classes.":"Cakupan sumber saat ini untuk kelompok akun Excel.","Balance Sheet totals are not yet authoritative":"Total Neraca belum menjadi nilai final","Cash ledger is connected to its opening balance":"Buku kas terhubung ke saldo awal","Cash ledger needs its opening balance":"Buku kas memerlukan saldo awal","Opening balance is stored separately from cash movements and is not counted as period cash-in.":"Saldo awal disimpan terpisah dari pergerakan kas dan tidak dihitung sebagai kas masuk periode.","Opening balance register":"Daftar saldo awal","Opening balance entry":"Entri saldo awal","Opening balance and allocation registers":"Daftar saldo awal dan alokasi","Opening balance and period closing journal":"Saldo awal dan jurnal penutupan periode","Opening balances are auditable records. The company balance sheet remains marked preliminary until its full journal and ledger sources are reconciled.":"Saldo awal merupakan catatan yang dapat diaudit. Neraca perusahaan tetap berstatus sementara sampai sumber jurnal dan buku besar lengkap direkonsiliasi.","Persistent account opening entries. These records alone do not constitute a fully reconciled Balance Sheet.":"Entri saldo awal akun yang tersimpan. Catatan ini saja belum membentuk Neraca yang telah direkonsiliasi.","Persistent workbook register":"Daftar workbook tersimpan","Dedicated opening and voucher records":"Catatan saldo awal dan voucher khusus","Dedicated vendor bill and payment records":"Catatan khusus tagihan dan pembayaran vendor","Source of truth for workflow design: Kapitech Finance Final Automated.xlsx.":"Sumber acuan alur kerja: Kapitech Finance Final Automated.xlsx.","Excel-alignment implementation · reports reflect connected AMS records":"Implementasi penyelarasan Excel · laporan mencerminkan catatan AMS yang terhubung","Examples follow the cash-basis treatment in Kapitech Finance Final Automated.xlsx. This is a draft mapping, not an authoritative ledger or bank reconciliation.":"Contoh mengikuti metode basis kas pada Kapitech Finance Final Automated.xlsx. Ini pemetaan draf, bukan buku besar final atau rekonsiliasi bank.","Opening balance only; no transaction roll-forward yet":"Hanya saldo awal. Belum ada perhitungan lanjutan transaksi.","Not generated by this sync; use linked bill/payment evidence":"Tidak dibuat oleh sinkronisasi ini. Gunakan bukti tagihan/pembayaran yang terhubung.","Not an accounting net profit":"Bukan laba bersih akuntansi","Not linked":"Tidak tertaut","Not linked to an AMS project":"Tidak tertaut ke proyek AMS","Not linked to an AMS vendor":"Tidak tertaut ke vendor AMS","Not specified":"Belum ditentukan","Not allocated":"Belum dialokasikan","Open invoices":"Invoice terbuka","Open vendor directory":"Buka direktori vendor","Post cash movement":"Posting pergerakan kas","Record payment":"Catat pembayaran","Record opening balance":"Catat saldo awal","Record management sign-off only after the preceding controls have been reviewed.":"Catat persetujuan manajemen setelah kontrol sebelumnya ditinjau.","Readiness":"Kesiapan","Receipt / approval notes":"Catatan penerimaan / persetujuan","Record state":"Status catatan","Review requirement":"Persyaratan tinjauan","Record Vendor Payment":"Catat Pembayaran Vendor","Search expense records":"Cari catatan pengeluaran","Search revenue records":"Cari catatan pendapatan","Search expenses…":"Cari pengeluaran…","Selected period is closed":"Periode yang dipilih sudah ditutup","Separate allocation bucket":"Kelompok alokasi terpisah","Separate from Project Team Fee":"Terpisah dari Honor Tim Proyek","Separate from Team Fee":"Terpisah dari Honor Tim","Select a cash account":"Pilih akun kas","Select a vendor bill":"Pilih tagihan vendor","Select an account":"Pilih akun","Select an option":"Pilih opsi","Skipped ·":"Dilewati ·","Ready to generate draft":"Siap membuat draf","Posted journal":"Jurnal dibukukan","Draft generated · review required":"Draf dibuat · perlu ditinjau","Source sync creates drafts only":"Sinkronisasi sumber hanya membuat draf","Source transaction posting queue":"Antrean posting transaksi sumber","Source rows show the matching journal state or why automatic draft creation was skipped. These rows are not themselves journal entries.":"Baris sumber menunjukkan status jurnal yang cocok atau alasan pembuatan draf otomatis dilewati. Baris ini bukan entri jurnal.","Generated records retain their source reference. Review every draft and supporting document; a different authorized user must approve/post it. Posted entries are immutable.":"Catatan yang dibuat mempertahankan referensi sumber. Tinjau setiap draf beserta dokumen pendukung. Pengguna berwenang yang berbeda harus menyetujui dan membukukannya. Entri yang sudah dibukukan tidak dapat diubah.","Vendor Bill is the payable source of truth":"Tagihan Vendor adalah sumber acuan utang","Vendor contracts describe commitments. Accounts Payable is now kept in a separate persistent register; each bill can carry its own due date and payment schedule. Linked expenses remain source records and are not silently converted into bills.":"Kontrak vendor menjelaskan komitmen. Utang Usaha disimpan pada daftar tersendiri, dengan tanggal jatuh tempo dan jadwal pembayaran tiap tagihan. Pengeluaran tertaut tetap menjadi catatan sumber dan tidak otomatis diubah menjadi tagihan.","Amounts and paid amounts are derived from each persisted bill and its linked payments. Unassigned legacy payments are allocated FIFO; the single bill due date remains authoritative because the workbook has no separate due date per installment.":"Nilai tagihan dan pembayaran dihitung dari tagihan tersimpan serta pembayaran yang tertaut. Pembayaran lama tanpa penanda dialokasikan FIFO. Tanggal jatuh tempo tagihan tetap menjadi acuan karena workbook tidak menyediakan tanggal terpisah per cicilan.","Variance is budget less expense actual for the same calendar month and expense category.":"Selisih adalah anggaran dikurangi realisasi pengeluaran untuk bulan kalender dan kategori yang sama.","The workbook cash-in / cash-out structure, shown in IDR from live AMS transaction sources.":"Struktur kas masuk dan keluar workbook, ditampilkan dalam IDR dari sumber transaksi AMS.","The active Finance workspace follows the 20 worksheets in Kapitech Finance Final Automated.xlsx.":"Ruang kerja Finance mengikuti 20 sheet dalam Kapitech Finance Final Automated.xlsx.","Reporting month is filtered by invoice issue date and expense date. AMS expense categories are not yet identical to the workbook's Project Cost / Operating Cost field, so unmapped expenses are shown separately and excluded from the preliminary net figure until the mapping is approved.":"Bulan pelaporan difilter berdasarkan tanggal invoice diterbitkan dan tanggal pengeluaran. Kategori pengeluaran AMS belum sama dengan kolom Project Cost / Operating Cost workbook. Pengeluaran yang belum dipetakan ditampilkan terpisah dan tidak dihitung dalam nilai laba bersih sementara sebelum pemetaan disetujui.","On Hold":"Ditahan","Direct project cost":"Biaya langsung proyek","Direct Project Cost":"Biaya Langsung Proyek","Gross Profit":"Laba Kotor","Net preview":"Pratinjau Laba Bersih","Net project profit":"Laba Bersih Proyek","Net cash movement":"Pergerakan Kas Bersih","Operating expense":"Biaya operasional","Unclassified Expense":"Pengeluaran Belum Diklasifikasikan","Annual Revenue / Invoice Value (IDR)":"Pendapatan Tahunan / Nilai Invoice (IDR)","Annual Collections":"Penerimaan Tahunan","Annual Recorded Expenses":"Pengeluaran Tahunan Tercatat","Recorded cash outflow":"Arus kas keluar tercatat","Monthly Cash Flow":"Arus Kas Bulanan","Monthly Profit & Loss":"Laba Rugi Bulanan","Monthly Closing checklist":"Daftar periksa penutupan bulanan","Workbook Balance Sheet account mapping":"Pemetaan akun Neraca workbook","Workbook Chart of Accounts posting map":"Pemetaan posting Bagan Akun workbook","Finance source warning":"Peringatan sumber Finance","Supplementary Finance register warning":"Peringatan daftar tambahan Finance","Finance action needs attention":"Tindakan Finance memerlukan perhatian","Source journal sync result":"Hasil sinkronisasi jurnal sumber","Month":"Bulan","Year":"Tahun","Invoice no.":"Nomor invoice","Invoice value":"Nilai invoice","Outstanding":"Terutang","Billed":"Ditagihkan","Collected":"Diterima","Paid amount":"Jumlah dibayar","Next payment":"Pembayaran berikutnya","Default owner":"Penanggung jawab default","Control purpose":"Tujuan kontrol","Petty cash needs an opening balance":"Kas kecil memerlukan saldo awal","Petty cash register connected":"Daftar kas kecil terhubung","Voucher movements and internal cash transfers, sorted by date.":"Pergerakan voucher dan transfer kas internal, diurutkan berdasarkan tanggal.","Only posted vouchers affect the petty-cash ledger. Pending/approved vouchers remain visible in workflow but do not change the running balance. The ledger starts at the saved opening date; earlier movements are excluded from the opening-balance roll-forward. Internal transfers are shared with Cash & Bank and are not treated as an expense by themselves.":"Hanya voucher yang dibukukan yang memengaruhi buku kas kecil. Voucher menunggu/disetujui tetap terlihat dalam alur, tetapi tidak mengubah saldo berjalan. Buku dimulai pada tanggal saldo awal tersimpan. Pergerakan sebelumnya tidak masuk perhitungan saldo awal. Transfer internal juga tercatat di Kas & Bank dan bukan pengeluaran tersendiri.","Monthly closing requires all workbook control items":"Penutupan bulanan memerlukan semua item kontrol workbook","Selected period:":"Periode yang dipilih:","controls are completed and approved.":"kontrol telah selesai dan disetujui.","The entry is saved as Draft and requires a different authorized user to post it. Total debit and credit must balance before it can be saved.":"Entri disimpan sebagai Draf dan harus dibukukan oleh pengguna berwenang yang berbeda. Total debit dan kredit harus seimbang sebelum disimpan.","Budget lines are stored by month, category and PIC. Actual costs remain sourced from expense records; the table does not insert zero-value placeholder budget rows.":"Baris anggaran disimpan berdasarkan bulan, kategori, dan PIC. Biaya realisasi tetap bersumber dari catatan pengeluaran. Tabel tidak membuat baris anggaran kosong bernilai nol.","Opening + in − out; un-reconciled":"Saldo awal + masuk − keluar; belum direkonsiliasi","Set opening balance":"Atur saldo awal","Add voucher":"Tambah voucher","Top up from bank":"Isi kas dari bank","Add project finance record":"Tambah catatan keuangan proyek","Calculate project allocation":"Hitung alokasi proyek","Add team fee":"Tambah honor tim","Add vendor bill":"Tambah tagihan vendor","Add movement":"Tambah pergerakan","Add account":"Tambah akun","Add record":"Tambah catatan"};
const FINANCE_DATA_COPY_EN: Record<string, string> = {"Ringkasan & Kontrol":"Overview & Control","Transaksi & Kas":"Transactions & Cash","Piutang & Utang":"Receivables & Payables","Akuntansi & Laporan":"Accounting & Reports","Ringkasan Eksekutif":"Executive Summary","Dasbor":"Dashboard","Bagan Akun":"Chart of Accounts","Pendapatan":"Revenue","Pengeluaran":"Expenses","Kas & Bank":"Cash & Bank","Kas Kecil":"Petty Cash","Piutang usaha":"Accounts receivable","Utang usaha":"Accounts payable","Honor Tim":"Team Fee","Anggaran Operasional":"Operational Budget","Alokasi Proyek":"Project Allocation","Laba Rugi Bulanan":"Monthly Profit & Loss","Arus Kas":"Cash Flow","Penutupan Bulanan":"Monthly Closing","Neraca":"Balance Sheet","Jurnal":"Journal","Ringkasan Tahunan":"Annual Summary","Ringkasan keuangan perusahaan dan gambaran alokasi.":"Company-wide financial summary and allocation overview.","KPI keuangan operasional dan pergerakan bulanan terbaru.":"Operational finance KPIs and recent monthly movement.","Kode akun utama dan saldo normal dari workbook.":"Master account codes and normal balances from the workbook.","Daftar pendapatan yang bersumber dari invoice klien yang diterbitkan.":"Revenue register sourced from issued client invoices.","Daftar pengeluaran yang bersumber dari data pengeluaran AMS.":"Expense register sourced from finance expenses in AMS.","Tampilan pergerakan kas dari penerimaan dan pengeluaran yang tercatat.":"Cash movement view built from recorded receipts and expenses.","Daftar kas kecil dan kontrol yang dibutuhkan workbook.":"Petty-cash register and controls required by the workbook.","Saldo invoice, tanggal jatuh tempo, dan status pembayaran.":"Invoice balances, due dates and payment status.","Kewajiban vendor dan catatan tagihan yang diperlukan.":"Vendor obligations and the bill records still required.","Direktori vendor, kontrak, tarif, dan referensi pembayaran.":"Vendor directory, contracts, rates and payment references.","Alokasi honor tim proyek, terpisah dari Team Reward.":"Project team-fee allocation, kept separate from Team Reward.","Anggaran, invoice, penerimaan, dan biaya tercatat pada tingkat proyek.":"Project-level budget, invoicing, receipts and recorded costs.","Kontrol anggaran terhadap realisasi dan tinjauan selisih.":"Budget-versus-actual controls and variance review.","Kebijakan alokasi workbook untuk laba bersih proyek.":"The workbook allocation policy for net project profit.","Tampilan laba rugi bulanan berdasarkan struktur workbook.":"Monthly profit-and-loss view based on the workbook structure.","Arus kas masuk, keluar, dan pergerakan bersih bulanan.":"Monthly cash inflow, outflow and net movement.","Daftar periksa akhir bulan dan kontrol rekonsiliasi.":"Month-end checklist and reconciliation controls.","Kesiapan aset, liabilitas, dan ekuitas perusahaan.":"Company-wide assets, liabilities and equity readiness.","Pemetaan pembukuan berpasangan dan transaksi sumber yang menunggu posting.":"Double-entry mapping and source transactions awaiting posting.","Ringkasan keuangan tahunan perusahaan.":"Company-wide annual finance summary.","Alur kerja keuangan sesuai Excel · 20 sheet workbook · sistem desain AMS yang ada":"Excel-aligned finance workflow · 20 workbook sheets · existing AMS design system","Buka ruang transaksi":"Open transaction workspace","Muat ulang data":"Refresh data","Memuat sumber data":"Loading sources","Sebagian sumber tidak tersedia":"Partial source availability","Tampilan sumber terhubung":"Connected source views","Kelompok keuangan":"Finance groups","Sheet workbook keuangan":"Finance workbook sheets","Memuat sumber data keuangan":"Loading finance sources","Membaca data invoice, pengeluaran, proyek, dan vendor AMS.":"Reading live AMS invoice, expense, project and vendor records.","Aktivitas transaksi terbaru":"Recent transaction activity","Aktivitas bulan terpilih":"Selected-month activity","Bulan pelaporan":"Reporting month","Nilai invoice yang diterbitkan":"Invoice value issued","Pergerakan kas masuk / keluar":"Cash movement in / out","Beberapa sumber keuangan tidak tersedia":"Some finance sources are unavailable","Nilai KPI hanya mencerminkan data sumber yang berhasil dimuat. Muat ulang setelah koneksi pulih.":"KPI values only reflect source records that loaded successfully. Refresh after the connection is restored.","Daftar invoice terbaru":"Recent invoice register","Ringkasan keuangan":"Finance at a glance","Invoice terbaru beserta saldo terutang saat ini.":"Latest issued invoices with current outstanding balances.","Catatan invoice terbaru. Gunakan tab sheet workbook di atas untuk melihat alur keuangan secara terperinci.":"Recent invoice records. Use the workbook sheet tabs above to continue into the detailed finance flow.","AMS tidak mengembalikan invoice yang diterbitkan.":"No issued invoices were returned by AMS.","Alur workbook":"Workbook flow","Transaksi":"Transactions","Data invoice dan pengeluaran dimuat":"Invoice and expense records loaded","Data proyek":"Project records","Data vendor":"Vendor records","Cari invoice, klien, atau proyek":"Search invoice, client or project","Cari invoice…":"Search invoices…","Kelola invoice":"Manage invoices","Kelola pengeluaran":"Manage expenses","Kode akun":"Account code","Nama akun":"Account name","Jenis akun":"Account type","Saldo normal":"Normal balance","Deskripsi":"Description","Tanggal":"Date","Referensi":"Reference","Tanggal transaksi":"Transaction date","Jenis pergerakan":"Movement type","Arah pergerakan":"Movement direction","Akun kas":"Cash account","Akun lawan":"Counterpart account","Saldo awal":"Opening balance","Saldo awal (IDR)":"Opening balance (IDR)","Tanggal saldo awal":"Opening date","Periode pelaporan":"Reporting period","Tahun pelaporan":"Reporting year","Cari":"Search","Kategori":"Category","Proyek":"Project","Klien":"Client","Tindakan":"Actions","Jumlah":"Amount","Jumlah (IDR)":"Amount (IDR)","Jumlah tagihan":"Bill amount","Jumlah pembayaran":"Payment amount","Nomor tagihan":"Bill number","Tanggal tagihan":"Bill date","Tanggal jatuh tempo":"Due date","Tanggal pembayaran":"Payment date","Metode pembayaran":"Payment method","Referensi pembayaran":"Payment reference","Vendor / freelancer":"Vendor / freelancer","Tagihan vendor":"Vendor bill","Pembayaran terjadwal":"Scheduled payment","Anggaran belum diatur":"Budget not set","Atur anggaran":"Set budget","Tambah baris anggaran":"Add budget line","Pengaturan keuangan proyek":"Project Finance Setup","Nama proyek / kunci Excel":"Project name / Excel key","Nilai kontrak (IDR)":"Contract value (IDR)","Komitmen vendor (IDR)":"Vendor commitment (IDR)","Kewajiban lain (IDR)":"Other obligations (IDR)","Status proyek":"Project status","Tanggal mulai":"Start date","Tanggal selesai":"End date","Honor Tim Proyek":"Project Team Fee","Anggota tim":"Team member","Jumlah honor (IDR)":"Fee amount (IDR)","Status pembayaran":"Payment status","Entri Jurnal Umum":"General Journal Entry","Tanggal jurnal":"Journal date","Akun debit":"Debit account","Akun kredit":"Credit account","Batal":"Cancel","Simpan perubahan":"Save changes","Simpan catatan":"Save record","Menyimpan…":"Saving…","Tambah entri jurnal":"Add journal entry","Buat draf dari sumber":"Generate source drafts","Buat kontrol":"Create control","Tutup periode":"Close period","Belum tercatat":"Not recorded","Belum diatur":"Not set","Tidak tersedia":"Not available","Terbuka":"Open","Ditutup":"Closed","Lunas":"Paid","Belum dibayar":"Unpaid","Dibayar sebagian":"Partially Paid","Kelebihan bayar":"Overpaid","Aktif":"Active","Selesai":"Completed","Dibatalkan":"Cancelled","Menunggu":"Pending","Disetujui":"Approved","Dibukukan":"Posted","Draf":"Draft","Sedang berlangsung":"In Progress","Cash and bank accounts":"Kas dan rekening bank","Petty cash reserve":"Kas kecil/reserve","Emergency fund":"Dana darurat","Customer receivables":"Piutang pelanggan","Vendor/freelancer payables":"Hutang vendor/freelancer","Capital":"Modal","Retained earnings":"Laba ditahan","Project revenue":"Pendapatan project","Vendor/freelancer fees":"Fee vendor/freelancer","Other project obligations":"Kewajiban project lain","Sales reward":"Reward sales","Vendor/PIC reward":"Reward vendor/PIC","Management reward":"Reward management","Project team fee":"Fee tim project","Bank/administration fees":"Biaya bank/admin","Company operating expenses":"Biaya operasional perusahaan","Ringkasan":"Overview","Kontrol":"Control","Lembar":"Sheet","Bagian keuangan":"Finance sections","Sumber tersedia":"Source available","Tampilan periode khusus IDR. Laba bersih akuntansi dan saldo kas akhir bergantung pada posting buku besar, saldo awal, dan rekonsiliasi.":"IDR-only period view; accounting net profit and closing cash depend on ledger posting, opening balances and reconciliation.","Pemetaan akun":"Account mapping","Transfer kas":"Cash transfer","Pembayaran invoice":"Invoice payment","Catatan pengeluaran":"Expense record","Saldo awal disimpan":"Opening balance saved","Saldo awal belum tersedia":"Opening balance missing","Tidak ada tagihan vendor":"No vendor bills available","Belum ada tagihan vendor. Buat tagihan di Utang Usaha untuk membuat jadwal 30% / 20% / 50%.":"No vendor bills have been entered. Create a bill in Accounts Payable to generate the 30% / 20% / 50% schedule.","Belum ada tagihan vendor yang tercatat.":"No vendor bills have been recorded yet.","Tidak ada kontrak vendor yang tersedia di AMS.":"No vendor contracts are available in AMS.","Belum ada saldo awal yang dimasukkan.":"No opening balances have been entered.","Tidak ada akun yang cocok dengan pencarian.":"No chart-of-account rows match the current search.","Tidak ada pergerakan kas bertanggal. Atur saldo awal atau catat pergerakan kas.":"No dated cash movement is available. Set an opening balance or record a movement.","Tidak ada catatan pengeluaran yang diklasifikasikan sebagai Honor Tim Proyek.":"No expense source record is classified as Project Team Fee.","Belum ada alokasi Honor Tim yang tercatat.":"No individual Team Fee allocation has been recorded.","Belum ada alokasi proyek yang disimpan. Atur menggunakan nilai kontrak dan kewajiban proyek saat ini.":"No project allocation has been saved yet. Configure it from the current contract value and project obligations.","Tidak ada catatan untuk tahun yang dipilih.":"No records exist for the selected year.","Tidak ditemukan baris sumber yang memenuhi syarat atau dilewati.":"No eligible or skipped source rows were found.","Belum ada entri jurnal umum yang disimpan.":"No general journal entries have been saved.","Belum ada voucher kas kecil atau transfer yang tercatat.":"No petty-cash vouchers or transfers are recorded.","Sumber invoice AMS saat ini tidak mengembalikan saldo terutang.":"No outstanding invoice balances were returned by the current AMS invoice source.","Tidak ada data invoice terbit untuk pencarian ini.":"No issued invoice data is available for the selected search.","Tidak ada catatan pengeluaran yang cocok dengan pencarian.":"No expense records match the selected search.","AMS tidak mengembalikan catatan vendor.":"No vendor records were returned by AMS.","Tidak ada aktivitas pembayaran atau pengeluaran dari sumber AMS yang terhubung.":"No recorded payment or expense activity is available from the connected AMS sources.","AMS tidak mengembalikan proyek. Catatan proyek tetap dapat dibuat dari daftar workbook.":"No AMS projects were returned. A named project record can still be created from the workbook register.","Tidak ada aktivitas pada bulan yang dipilih.":"No activity exists for the selected month.","Tidak ada baris anggaran atau catatan pengeluaran bertanggal untuk pencarian ini.":"No budget lines or dated expense records exist for the current search.","Tidak ada penerimaan bertanggal atau pergerakan pengeluaran yang tersedia.":"No dated receipts or expense movements are available.","Catatan Finance tidak dapat disimpan.":"The Finance record could not be saved.","Persetujuan tidak dapat diselesaikan.":"The approval could not be completed.","Periode tidak dapat ditutup.":"The period could not be closed.","Sumber tidak mengembalikan respons berhasil.":"Source did not return a successful response.","Sumber tidak tersedia.":"Source is not available.","Draf jurnal sumber tidak dapat dibuat.":"Source journal drafts could not be generated.","Tab Revenue pada workbook dipetakan ke invoice terbit. Penerimaan pembayaran tetap terhubung ke catatan pembayaran invoice.":"The workbook's Revenue tab maps to issued invoices; payment collections remain attached to the invoice payment records.","Transaksi tetap terhubung ke catatan sumber AMS. Entri transfer atau penyesuaian manual menggunakan daftar tambahan workbook.":"Transactions stay connected to their AMS source record; manual transfer/adjustment entries use the supplementary workbook register.","Kontrak AMS ditampilkan sebagai komitmen. Kontrak saja tidak dianggap sebagai tagihan utang.":"Existing AMS contracts are shown as commitments; a contract alone is not treated as a payable bill.","Pengeluaran AMS yang tercatat menjadi sumber biaya. Kategori yang belum dipetakan harus diselesaikan sebelum posting Laba Rugi mengikuti workbook.":"Existing AMS expenses are the source for recorded costs. Unmapped categories should be resolved before final workbook-style P&L posting.","Cakupan sumber saat ini untuk kelompok akun Excel.":"Current source coverage for the Excel account classes.","Total Neraca belum menjadi nilai final":"Balance Sheet totals are not yet authoritative","Buku kas terhubung ke saldo awal":"Cash ledger is connected to its opening balance","Buku kas memerlukan saldo awal":"Cash ledger needs its opening balance","Saldo awal disimpan terpisah dari pergerakan kas dan tidak dihitung sebagai kas masuk periode.":"Opening balance is stored separately from cash movements and is not counted as period cash-in.","Daftar saldo awal":"Opening balance register","Entri saldo awal":"Opening balance entry","Daftar saldo awal dan alokasi":"Opening balance and allocation registers","Saldo awal dan jurnal penutupan periode":"Opening balance and period closing journal","Saldo awal merupakan catatan yang dapat diaudit. Neraca perusahaan tetap berstatus sementara sampai sumber jurnal dan buku besar lengkap direkonsiliasi.":"Opening balances are auditable records. The company balance sheet remains marked preliminary until its full journal and ledger sources are reconciled.","Entri saldo awal akun yang tersimpan. Catatan ini saja belum membentuk Neraca yang telah direkonsiliasi.":"Persistent account opening entries. These records alone do not constitute a fully reconciled Balance Sheet.","Daftar workbook tersimpan":"Persistent workbook register","Catatan saldo awal dan voucher khusus":"Dedicated opening and voucher records","Catatan khusus tagihan dan pembayaran vendor":"Dedicated vendor bill and payment records","Sumber acuan alur kerja: Kapitech Finance Final Automated.xlsx.":"Source of truth for workflow design: Kapitech Finance Final Automated.xlsx.","Implementasi penyelarasan Excel · laporan mencerminkan catatan AMS yang terhubung":"Excel-alignment implementation · reports reflect connected AMS records","Contoh mengikuti metode basis kas pada Kapitech Finance Final Automated.xlsx. Ini pemetaan draf, bukan buku besar final atau rekonsiliasi bank.":"Examples follow the cash-basis treatment in Kapitech Finance Final Automated.xlsx. This is a draft mapping, not an authoritative ledger or bank reconciliation.","Hanya saldo awal. Belum ada perhitungan lanjutan transaksi.":"Opening balance only; no transaction roll-forward yet","Tidak dibuat oleh sinkronisasi ini. Gunakan bukti tagihan/pembayaran yang terhubung.":"Not generated by this sync; use linked bill/payment evidence","Bukan laba bersih akuntansi":"Not an accounting net profit","Tidak tertaut":"Not linked","Tidak tertaut ke proyek AMS":"Not linked to an AMS project","Tidak tertaut ke vendor AMS":"Not linked to an AMS vendor","Belum ditentukan":"Not specified","Belum dialokasikan":"Not allocated","Invoice terbuka":"Open invoices","Buka direktori vendor":"Open vendor directory","Posting pergerakan kas":"Post cash movement","Catat pembayaran":"Record payment","Catat saldo awal":"Record opening balance","Catat persetujuan manajemen setelah kontrol sebelumnya ditinjau.":"Record management sign-off only after the preceding controls have been reviewed.","Kesiapan":"Readiness","Catatan penerimaan / persetujuan":"Receipt / approval notes","Status catatan":"Record state","Persyaratan tinjauan":"Review requirement","Catat Pembayaran Vendor":"Record Vendor Payment","Cari catatan pengeluaran":"Search expense records","Cari catatan pendapatan":"Search revenue records","Cari pengeluaran…":"Search expenses…","Periode yang dipilih sudah ditutup":"Selected period is closed","Kelompok alokasi terpisah":"Separate allocation bucket","Terpisah dari Honor Tim Proyek":"Separate from Project Team Fee","Terpisah dari Honor Tim":"Separate from Team Fee","Pilih akun kas":"Select a cash account","Pilih tagihan vendor":"Select a vendor bill","Pilih akun":"Select an account","Pilih opsi":"Select an option","Dilewati ·":"Skipped ·","Siap membuat draf":"Ready to generate draft","Jurnal dibukukan":"Posted journal","Draf dibuat · perlu ditinjau":"Draft generated · review required","Sinkronisasi sumber hanya membuat draf":"Source sync creates drafts only","Antrean posting transaksi sumber":"Source transaction posting queue","Baris sumber menunjukkan status jurnal yang cocok atau alasan pembuatan draf otomatis dilewati. Baris ini bukan entri jurnal.":"Source rows show the matching journal state or why automatic draft creation was skipped. These rows are not themselves journal entries.","Catatan yang dibuat mempertahankan referensi sumber. Tinjau setiap draf beserta dokumen pendukung. Pengguna berwenang yang berbeda harus menyetujui dan membukukannya. Entri yang sudah dibukukan tidak dapat diubah.":"Generated records retain their source reference. Review every draft and supporting document; a different authorized user must approve/post it. Posted entries are immutable.","Tagihan Vendor adalah sumber acuan utang":"Vendor Bill is the payable source of truth","Kontrak vendor menjelaskan komitmen. Utang Usaha disimpan pada daftar tersendiri, dengan tanggal jatuh tempo dan jadwal pembayaran tiap tagihan. Pengeluaran tertaut tetap menjadi catatan sumber dan tidak otomatis diubah menjadi tagihan.":"Vendor contracts describe commitments. Accounts Payable is now kept in a separate persistent register; each bill can carry its own due date and payment schedule. Linked expenses remain source records and are not silently converted into bills.","Nilai tagihan dan pembayaran dihitung dari tagihan tersimpan serta pembayaran yang tertaut. Pembayaran lama tanpa penanda dialokasikan FIFO. Tanggal jatuh tempo tagihan tetap menjadi acuan karena workbook tidak menyediakan tanggal terpisah per cicilan.":"Amounts and paid amounts are derived from each persisted bill and its linked payments. Unassigned legacy payments are allocated FIFO; the single bill due date remains authoritative because the workbook has no separate due date per installment.","Selisih adalah anggaran dikurangi realisasi pengeluaran untuk bulan kalender dan kategori yang sama.":"Variance is budget less expense actual for the same calendar month and expense category.","Struktur kas masuk dan keluar workbook, ditampilkan dalam IDR dari sumber transaksi AMS.":"The workbook cash-in / cash-out structure, shown in IDR from live AMS transaction sources.","Ruang kerja Finance mengikuti 20 sheet dalam Kapitech Finance Final Automated.xlsx.":"The active Finance workspace follows the 20 worksheets in Kapitech Finance Final Automated.xlsx.","Bulan pelaporan difilter berdasarkan tanggal invoice diterbitkan dan tanggal pengeluaran. Kategori pengeluaran AMS belum sama dengan kolom Project Cost / Operating Cost workbook. Pengeluaran yang belum dipetakan ditampilkan terpisah dan tidak dihitung dalam nilai laba bersih sementara sebelum pemetaan disetujui.":"Reporting month is filtered by invoice issue date and expense date. AMS expense categories are not yet identical to the workbook's Project Cost / Operating Cost field, so unmapped expenses are shown separately and excluded from the preliminary net figure until the mapping is approved.","Ditahan":"On Hold","Biaya langsung proyek":"Direct project cost","Biaya Langsung Proyek":"Direct Project Cost","Laba Kotor":"Gross Profit","Pratinjau Laba Bersih":"Net preview","Laba Bersih Proyek":"Net project profit","Pergerakan Kas Bersih":"Net cash movement","Biaya operasional":"Operating expense","Pengeluaran Belum Diklasifikasikan":"Unclassified Expense","Pendapatan Tahunan / Nilai Invoice (IDR)":"Annual Revenue / Invoice Value (IDR)","Penerimaan Tahunan":"Annual Collections","Pengeluaran Tahunan Tercatat":"Annual Recorded Expenses","Arus kas keluar tercatat":"Recorded cash outflow","Arus Kas Bulanan":"Monthly Cash Flow","Daftar periksa penutupan bulanan":"Monthly Closing checklist","Pemetaan akun Neraca workbook":"Workbook Balance Sheet account mapping","Pemetaan posting Bagan Akun workbook":"Workbook Chart of Accounts posting map","Peringatan sumber Finance":"Finance source warning","Peringatan daftar tambahan Finance":"Supplementary Finance register warning","Tindakan Finance memerlukan perhatian":"Finance action needs attention","Hasil sinkronisasi jurnal sumber":"Source journal sync result","Bulan":"Month","Tahun":"Year","Nomor invoice":"Invoice no.","Nilai invoice":"Invoice value","Terutang":"Outstanding","Ditagihkan":"Billed","Diterima":"Collected","Jumlah dibayar":"Paid amount","Pembayaran berikutnya":"Next payment","Penanggung jawab default":"Default owner","Tujuan kontrol":"Control purpose","Kas kecil memerlukan saldo awal":"Petty cash needs an opening balance","Daftar kas kecil terhubung":"Petty cash register connected","Pergerakan voucher dan transfer kas internal, diurutkan berdasarkan tanggal.":"Voucher movements and internal cash transfers, sorted by date.","Hanya voucher yang dibukukan yang memengaruhi buku kas kecil. Voucher menunggu/disetujui tetap terlihat dalam alur, tetapi tidak mengubah saldo berjalan. Buku dimulai pada tanggal saldo awal tersimpan. Pergerakan sebelumnya tidak masuk perhitungan saldo awal. Transfer internal juga tercatat di Kas & Bank dan bukan pengeluaran tersendiri.":"Only posted vouchers affect the petty-cash ledger. Pending/approved vouchers remain visible in workflow but do not change the running balance. The ledger starts at the saved opening date; earlier movements are excluded from the opening-balance roll-forward. Internal transfers are shared with Cash & Bank and are not treated as an expense by themselves.","Penutupan bulanan memerlukan semua item kontrol workbook":"Monthly closing requires all workbook control items","Periode yang dipilih:":"Selected period:","kontrol telah selesai dan disetujui.":"controls are completed and approved.","Entri disimpan sebagai Draf dan harus dibukukan oleh pengguna berwenang yang berbeda. Total debit dan kredit harus seimbang sebelum disimpan.":"The entry is saved as Draft and requires a different authorized user to post it. Total debit and credit must balance before it can be saved.","Baris anggaran disimpan berdasarkan bulan, kategori, dan PIC. Biaya realisasi tetap bersumber dari catatan pengeluaran. Tabel tidak membuat baris anggaran kosong bernilai nol.":"Budget lines are stored by month, category and PIC. Actual costs remain sourced from expense records; the table does not insert zero-value placeholder budget rows.","Saldo awal + masuk − keluar; belum direkonsiliasi":"Opening + in − out; un-reconciled","Atur saldo awal":"Set opening balance","Tambah voucher":"Add voucher","Isi kas dari bank":"Top up from bank","Tambah catatan keuangan proyek":"Add project finance record","Hitung alokasi proyek":"Calculate project allocation","Tambah honor tim":"Add team fee","Tambah tagihan vendor":"Add vendor bill","Tambah pergerakan":"Add movement","Tambah akun":"Add account","Tambah catatan":"Add record"};
const FINANCE_NON_TEXT_KEYS = new Set(['to','href','src','className','style','id','key','value','name','type','slug','data-ams-feature-slug','data-ams-slug','aria-current','onClick','onChange','onSubmit','onKeyDown','ref','search','projectId','recordKey','version','currency']);
const localizeFinanceValue = (value: unknown, language: Language, propKey = ''): unknown => {
  if (typeof value === 'string') {
    if (FINANCE_NON_TEXT_KEYS.has(propKey)) return value;
    const dictionary = language === 'id' ? FINANCE_UI_COPY : FINANCE_DATA_COPY_EN;
    if (dictionary[value]) return dictionary[value];
    let translated = value;
    const entries = Object.entries(dictionary).filter(([source]) => source.length >= 3 && /^[A-Za-z]/.test(source)).sort((a, b) => b[0].length - a[0].length);
    for (const [source, target] of entries) {
      let searchFrom = 0;
      let output = '';
      const endsWithWord = /[A-Za-z0-9]$/.test(source);
      while (searchFrom < translated.length) {
        const index = translated.indexOf(source, searchFrom);
        if (index < 0) break;
        const before = index > 0 ? translated[index - 1] : '';
        const afterIndex = index + source.length;
        const after = afterIndex < translated.length ? translated[afterIndex] : '';
        const validStart = !/[A-Za-z0-9]/.test(source[0]) || !/[A-Za-z0-9]/.test(before);
        const validEnd = !endsWithWord || !/[A-Za-z0-9]/.test(after);
        output += translated.slice(searchFrom, index);
        if (validStart && validEnd) output += target;
        else output += source;
        searchFrom = afterIndex;
      }
      translated = output + translated.slice(searchFrom);
    }
    return translated;
  }
  if (Array.isArray(value)) return value.map((item) => localizeFinanceValue(item, language, propKey));
  if (React.isValidElement(value)) {
    const nextProps: Record<string, unknown> = {};
    const element = value as React.ReactElement;
    for (const [key, child] of Object.entries(element.props as Record<string, unknown>)) nextProps[key] = localizeFinanceValue(child, language, key);
    return React.cloneElement(element, nextProps as any);
  }
  if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    const nextValue: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) nextValue[key] = localizeFinanceValue(child, language, key);
    return nextValue;
  }
  return value;
};
const normaliseStatus = (value: unknown) => String(value || 'Not recorded').replace(/[_-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

const statusTone = (status: unknown): 'success' | 'warning' | 'danger' | 'info' | 'neutral' => {
  const value = String(status || '').toLowerCase();
  if (value === 'paid' || value === 'completed' || value === 'active' || value === 'posted') return 'success';
  if (value === 'overdue' || value === 'voided' || value === 'cancelled' || value === 'failed') return 'danger';
  if (value === 'partially_paid' || value === 'pending' || value === 'open' || value === 'draft') return 'warning';
  if (value === 'sent' || value === 'in_progress') return 'info';
  return 'neutral';
};

const StatusBadge: React.FC<{ value: unknown }> = ({ value }) => (
  <AdminStatusBadge tone={statusTone(value)}>{normaliseStatus(value)}</AdminStatusBadge>
);

const FinanceDataTable: React.FC<{
  title: string;
  description?: string;
  columns: Column[];
  rows: TableRow[];
  emptyMessage: string;
  actions?: React.ReactNode;
}> = ({ title, description, columns, rows, emptyMessage, actions }) => (
  <AdminPanel title={title} description={description} actions={actions} bodyClassName="p-0">
    <div className="max-w-full overflow-x-auto">
      <table className="w-full min-w-[760px] border-collapse text-left text-xs">
        <thead className="bg-bg text-[11px] font-medium text-muted">
          <tr>
            {columns.map((column, index) => (
              <th key={column.label + '-' + index} scope="col" className={'px-4 py-3 font-medium ' + (column.align === 'right' ? 'text-right ' : column.align === 'center' ? 'text-center ' : '') + (column.className || '')}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? rows.map((row) => (
            <tr key={row.id} className="border-t border-line align-middle">
              {row.cells.map((cell, index) => (
                <td key={row.id + '-' + index} className={'px-4 py-3 text-fg ' + (columns[index]?.align === 'right' ? 'text-right tabular-nums ' : columns[index]?.align === 'center' ? 'text-center ' : '') + (columns[index]?.className || '')}>
                  {cell}
                </td>
              ))}
            </tr>
          )) : (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-xs leading-5 text-muted">{emptyMessage}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </AdminPanel>
);

const WorkbookNote: React.FC<{ tone?: 'info' | 'warning' | 'danger'; title: string; children: React.ReactNode }> = ({ tone = 'info', title, children }) => {
  const styles = {
    info: 'border-info/25 bg-info/5',
    warning: 'border-warning/25 bg-warning/5',
    danger: 'border-danger/25 bg-danger/5'
  };
  const iconTone = tone === 'danger' ? 'text-danger' : tone === 'warning' ? 'text-warning' : 'text-info';
  return (
    <div className={'flex gap-3 rounded-card border p-4 ' + styles[tone]}>
      <ShieldAlert size={17} className={'mt-0.5 shrink-0 ' + iconTone} />
      <div className="min-w-0">
        <h3 className="text-xs font-semibold text-fg">{title}</h3>
        <div className="mt-1 text-xs leading-5 text-muted">{children}</div>
      </div>
    </div>
  );
};

const readSource = async (label: string, request: () => Promise<any>): Promise<SourceResult> => {
  try {
    const response = await request();
    if (!response?.success) return { label, data: null, error: response?.error || 'Source did not return a successful response.' };
    return { label, data: response.data || {} };
  } catch (error) {
    return { label, data: null, error: error instanceof Error ? error.message : 'Source is not available.' };
  }
};

const expenseLabel = (expense: AgencyExpense) => [expense.category, expense.description].filter(Boolean).join(' · ');
const isPettyCashRelated = (expense: AgencyExpense) => /petty cash|pettycash|kas kecil|cash voucher/i.test([expense.category, expense.description].join(' '));
const invoiceClient = (invoice: AgencyInvoice) => invoice.clientCompany || invoice.clientName || 'Client not set';
const projectLabel = (project: AgencyProject) => project.name || project.slug || project.id;

const EXPENSE_CLASS_LABELS: Record<WorkbookExpenseClass, string> = {
  directProjectCost: 'Direct project cost',
  teamReward: 'Team reward',
  projectTeamFee: 'Project team fee',
  operatingExpense: 'Operating expense',
  unclassified: 'Unclassified'
};

const WORKBOOK_CLOSING_ITEMS = [
  { label: 'All revenue recorded', owner: 'Baim' },
  { label: 'All expenses recorded', owner: 'Fikri' },
  { label: 'Cash & bank reconciled', owner: 'Finance' },
  { label: 'Receivables reviewed', owner: 'Finance' },
  { label: 'Payables reviewed', owner: 'Finance' },
  { label: 'Project margins reviewed', owner: 'Project owner' },
  { label: 'Journal balanced', owner: 'Finance' },
  { label: 'P&L reviewed', owner: 'Finance' },
  { label: 'Cash Flow reviewed', owner: 'Finance' },
  { label: 'Balance Sheet reviewed', owner: 'Management' },
  { label: 'Management approval', owner: 'Management' }
];


const SUPPLEMENTARY_FINANCE_RECORD_TYPES = [
  'chart-of-accounts','cash-bank-opening','cash-bank-transaction','petty-cash-voucher',
  'vendor-bill','vendor-bill-payment','operational-budget','project-finance','team-fee',
  'project-allocation','journal-entry','monthly-closing','balance-sheet-opening','monthly-closing-lock'
] as const;

const REGISTER_FORMS: Record<string, { title: string; description: string; fields: RegisterField[] }> = {
  'chart-of-accounts': {
    title: 'Chart of Accounts',
    description: 'Add an account using the workbook account-code, account-type and normal-balance structure.',
    fields: [
      { key:'code',label:'Account code',type:'text',required:true,placeholder:'e.g. 5700' },
      { key:'name',label:'Account name',type:'text',required:true },
      { key:'accountType',label:'Account type',type:'select',required:true,options:['Asset','Liability','Equity','Revenue','Expense'] },
      { key:'normalBalance',label:'Normal balance',type:'select',required:true,options:['Debit','Credit'] },
      { key:'description',label:'Description',type:'textarea' }
    ]
  },
  'cash-bank-opening': {
    title:'Cash & Bank Opening Balance',
    description:'Opening balance is stored separately from cash movements and is not counted as period cash-in.',
    fields:[
      {key:'accountCode',label:'Cash account',type:'select',required:true,optionSource:'cashAccounts',defaultValue:'1000'},
      {key:'openingDate',label:'Opening date',type:'date',required:true},
      {key:'openingBalance',label:'Opening balance (IDR)',type:'number',required:true},
      {key:'notes',label:'Notes',type:'textarea'}
    ]
  },
  'cash-bank-transaction': {
    title:'Cash & Bank Movement',
    description:'Use this register for manual adjustments or internal transfers. Client receipts and expenses remain sourced from their existing transaction records.',
    fields:[
      {key:'date',label:'Transaction date',type:'date',required:true},
      {key:'transactionKind',label:'Movement type',type:'select',required:true,options:['manual','bank-to-petty-cash','petty-cash-to-bank','bank-to-emergency-fund','emergency-fund-to-bank'],defaultValue:'manual'},
      {key:'accountCode',label:'From / active account',type:'select',required:true,optionSource:'cashAccounts',defaultValue:'1000'},
      {key:'counterpartAccountCode',label:'Counterpart account',type:'select',optionSource:'cashAccounts',visibleWhen:{key:'transactionKind',values:['bank-to-petty-cash','petty-cash-to-bank','bank-to-emergency-fund','emergency-fund-to-bank']}},
      {key:'direction',label:'Movement direction',type:'select',required:true,options:['in','out'],defaultValue:'out'},
      {key:'reference',label:'Reference',type:'text',placeholder:'Transfer / adjustment reference'},
      {key:'description',label:'Description',type:'text',required:true},
      {key:'amount',label:'Amount (IDR)',type:'number',required:true},
      {key:'category',label:'Category',type:'text',defaultValue:'Manual movement'},
      {key:'projectId',label:'AMS project (optional)',type:'select',optionSource:'projects'},
      {key:'notes',label:'Notes',type:'textarea'}
    ]
  },
  'petty-cash-voucher': {
    title:'Petty Cash Voucher',
    description:'New vouchers start as pending. Outgoing transactions above Rp100.000 require management approval before they affect the approved voucher balance.',
    fields:[
      {key:'date',label:'Voucher date',type:'date',required:true},
      {key:'voucherNo',label:'Voucher number',type:'text',placeholder:'Leave blank to generate automatically'},
      {key:'description',label:'Description',type:'text',required:true},
      {key:'custodian',label:'Custodian',type:'text',required:true},
      {key:'direction',label:'Cash movement',type:'select',required:true,options:['out','in'],defaultValue:'out'},
      {key:'amount',label:'Amount (IDR)',type:'number',required:true},
      {key:'notes',label:'Receipt / approval notes',type:'textarea'}
    ]
  },
  'vendor-bill': {
    title:'Vendor Bill / Payable',
    description:'Create the payable record before recording its 30% / 20% / 50% payment instalments.',
    fields:[
      {key:'billNo',label:'Bill number',type:'text',required:true},
      {key:'vendorId',label:'AMS vendor (optional)',type:'select',optionSource:'vendors'},
      {key:'vendorName',label:'Vendor / freelancer',type:'text',required:true},
      {key:'projectId',label:'AMS project (optional)',type:'select',optionSource:'projects'},
      {key:'projectName',label:'Project name',type:'text'},
      {key:'billDate',label:'Bill date',type:'date',required:true},
      {key:'dueDate',label:'Due date',type:'date',required:true},
      {key:'currency',label:'Currency',type:'select',required:true,options:['IDR','USD'],defaultValue:'IDR'},
      {key:'total',label:'Bill amount',type:'number',required:true},
      {key:'notes',label:'Notes',type:'textarea'}
    ]
  },
  'vendor-bill-payment': {
    title:'Record Vendor Payment',
    description:'Link the payment to a vendor bill and, where known, its 30% / 20% / 50% installment. Unassigned payments are allocated FIFO.',
    fields:[
      {key:'billId',label:'Vendor bill',type:'select',required:true,optionSource:'vendorBills'},
      {key:'installmentNumber',label:'Scheduled payment',type:'select',required:true,options:['Unassigned · FIFO','1 · 30%','2 · 20%','3 · 50%'],defaultValue:'Unassigned · FIFO'},
      {key:'paidDate',label:'Payment date',type:'date',required:true},
      {key:'amount',label:'Payment amount',type:'number',required:true},
      {key:'method',label:'Payment method',type:'select',required:true,options:['bank_transfer','credit_card','cash','other'],defaultValue:'bank_transfer'},
      {key:'reference',label:'Payment reference',type:'text'},
      {key:'notes',label:'Notes',type:'textarea'}
    ]
  },
  'operational-budget': {
    title:'Operational Budget',
    description:'Budget is maintained by month and category. Actual is calculated from recorded expenses.',
    fields:[
      {key:'month',label:'Month',type:'month',required:true},
      {key:'category',label:'Category',type:'text',required:true},
      {key:'budgetAmount',label:'Budget amount (IDR)',type:'number',required:true},
      {key:'pic',label:'PIC',type:'text'},
      {key:'projectId',label:'AMS project (optional)',type:'select',optionSource:'projects'},
      {key:'notes',label:'Notes',type:'textarea'}
    ]
  },
  'project-finance': {
    title:'Project Finance Setup',
    description:'Store the contract value, vendor commitment and other obligations that drive the workbook project-profit calculation.',
    fields:[
      {key:'projectId',label:'AMS project (optional)',type:'select',optionSource:'projects'},
      {key:'projectName',label:'Project name / Excel key',type:'text',required:true},
      {key:'clientName',label:'Client',type:'text'},
      {key:'pic',label:'PIC',type:'text'},
      {key:'contractValue',label:'Contract value (IDR)',type:'number',required:true},
      {key:'vendorCommitment',label:'Vendor commitment (IDR)',type:'number',required:true},
      {key:'otherObligations',label:'Other obligations (IDR)',type:'number',required:true},
      {key:'projectStatus',label:'Project status',type:'select',options:['Planning','Active','On Hold','Completed','Cancelled'],defaultValue:'Active'},
      {key:'startDate',label:'Start date',type:'date'},
      {key:'endDate',label:'End date',type:'date'},
      {key:'notes',label:'Notes',type:'textarea'}
    ]
  },
  'team-fee': {
    title:'Project Team Fee',
    description:'Team Fee is a separate workbook register and must not be combined with Team Reward.',
    fields:[
      {key:'projectId',label:'AMS project (optional)',type:'select',optionSource:'projects'},
      {key:'projectName',label:'Project name / Excel key',type:'text',required:true},
      {key:'memberName',label:'Team member',type:'text',required:true},
      {key:'role',label:'Role',type:'text'},
      {key:'feeAmount',label:'Fee amount (IDR)',type:'number',required:true},
      {key:'dueDate',label:'Payment date / target date',type:'date'},
      {key:'paymentStatus',label:'Payment status',type:'select',options:['planned','pending','paid'],defaultValue:'planned'},
      {key:'notes',label:'Notes',type:'textarea'}
    ]
  },
  'project-allocation': {
    title:'Project Profit Allocation',
    description:'Allocation amounts are calculated server-side using the workbook percentages and the net project profit base.',
    fields:[
      {key:'projectId',label:'AMS project (optional)',type:'select',optionSource:'projects'},
      {key:'projectName',label:'Project name / Excel key',type:'text',required:true},
      {key:'contractValue',label:'Contract value (IDR)',type:'number',required:true},
      {key:'vendorCost',label:'Vendor commitment (IDR)',type:'number',required:true},
      {key:'otherObligations',label:'Other obligations (IDR)',type:'number',required:true},
      {key:'pettyCashPercent',label:'Petty cash reserve (%)',type:'number',required:true,defaultValue:10},
      {key:'emergencyPercent',label:'Emergency fund (%)',type:'number',required:true,defaultValue:10},
      {key:'teamRewardPercent',label:'Team Reward (%)',type:'number',required:true,defaultValue:10},
      {key:'teamFeeAmount',label:'Project Team Fee (IDR)',type:'number',defaultValue:0},
      {key:'emergencyStatus',label:'Emergency fund status',type:'select',options:['Reserved','Used','Released','Not allocated'],defaultValue:'Reserved'},
      {key:'notes',label:'Notes',type:'textarea'}
    ]
  },
  'journal-entry': {
    title:'General Journal Entry',
    description:'A balanced double-entry is required. This form creates a two-line journal; complex entries need an extended line editor.',
    fields:[
      {key:'date',label:'Journal date',type:'date',required:true},
      {key:'reference',label:'Reference',type:'text',required:true},
      {key:'description',label:'Description',type:'text',required:true},
      {key:'projectId',label:'AMS project (optional)',type:'select',optionSource:'projects'},
      {key:'debitAccountCode',label:'Debit account',type:'select',required:true,optionSource:'accounts'},
      {key:'creditAccountCode',label:'Credit account',type:'select',required:true,optionSource:'accounts'},
      {key:'amount',label:'Amount (IDR)',type:'number',required:true},
      {key:'notes',label:'Notes',type:'textarea'}
    ]
  },
  'monthly-closing': {
    title:'Monthly Closing Control',
    description:'Update the selected workbook checklist item. Marking a control Done requires separate management approval.',
    fields:[
      {key:'period',label:'Reporting month',type:'month',required:true},
      {key:'checklistItem',label:'Checklist item',type:'select',required:true,options:WORKBOOK_CLOSING_ITEMS.map((x)=>x.label)},
      {key:'status',label:'Status',type:'select',required:true,options:['Open','In Progress','Blocked'],defaultValue:'Open'},
      {key:'pic',label:'PIC',type:'text'},
      {key:'date',label:'Date',type:'date'},
      {key:'notes',label:'Notes',type:'textarea'}
    ]
  },
  'balance-sheet-opening': {
    title:'Opening Balance',
    description:'Opening balances are auditable records. The company balance sheet remains marked preliminary until its full journal and ledger sources are reconciled.',
    fields:[
      {key:'accountCode',label:'Account',type:'select',required:true,optionSource:'accounts'},
      {key:'asOfDate',label:'Opening date',type:'date',required:true},
      {key:'openingAmount',label:'Opening amount (IDR)',type:'number',required:true},
      {key:'side',label:'Balance side',type:'select',required:true,options:['Debit','Credit'],defaultValue:'Debit'},
      {key:'notes',label:'Notes',type:'textarea'}
    ]
  }
};

const ACCOUNT_OPTION_CODES = EXCEL_CHART_OF_ACCOUNTS.map((account)=>({ value:account.code, label:account.code+' · '+account.name }));
const CASH_ACCOUNT_OPTIONS = [
  {value:'1000',label:'1000 · Cash & Bank'},
  {value:'1100',label:'1100 · Petty Cash Reserve'},
  {value:'1200',label:'1200 · Emergency Fund'}
];

export const AdminFinanceWorkspace: React.FC = () => {
  const { language } = useLanguage();
  const locale = language === 'id' ? 'id-ID' : 'en-US';
  const formatMoney = useCallback((value: number, currency = 'IDR') => new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency === 'USD' ? 'USD' : 'IDR',
    maximumFractionDigits: 0
  }).format(Number.isFinite(Number(value)) ? Number(value) : 0), [locale]);
  const formatDate = useCallback((value: unknown) => {
    const text = String(value || '').slice(0, 10);
    if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(text)) return '—';
    const date = new Date(text + 'T00:00:00');
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' });
  }, [locale]);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const requestedTab = searchParams.get('tab') || 'executive-summary';
  const flatTabs = FINANCE_WORKBOOK_GROUPS.flatMap((group) => group.items);
  const activeTab = flatTabs.find((item) => item.key === requestedTab) || flatTabs[0];
  const activeGroup = FINANCE_WORKBOOK_GROUPS.find((group) => group.items.some((item) => item.key === activeTab.key)) || FINANCE_WORKBOOK_GROUPS[0];

  const [invoices, setInvoices] = useState<AgencyInvoice[]>([]);
  const [expenses, setExpenses] = useState<AgencyExpense[]>([]);
  const [projects, setProjects] = useState<AgencyProject[]>([]);
  const [vendors, setVendors] = useState<AgencyVendor[]>([]);
  const [registerRecords, setRegisterRecords] = useState<Record<string, WorkbookRecord[]>>({});
  const [registerErrors, setRegisterErrors] = useState<string[]>([]);
  const [registerSaving, setRegisterSaving] = useState(false);
  const [registerActionError, setRegisterActionError] = useState<string | null>(null);
  const [journalSyncSummary, setJournalSyncSummary] = useState<string | null>(null);
  const [editor, setEditor] = useState<{ type: string; record?: WorkbookRecord; payload: Record<string, any> } | null>(null);
  const [sourceErrors, setSourceErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0'));
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));

  const loadData = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);
    const baseResults = await Promise.all([
      readSource('Invoices', () => api.finance.getInvoices()),
      readSource('Expenses', () => api.finance.getExpenses()),
      readSource('Projects', () => api.projects.getAll()),
      readSource('Vendors', () => api.vendors.getAll())
    ]);
    const workbookResults = await Promise.all(SUPPLEMENTARY_FINANCE_RECORD_TYPES.map((type) =>
      readSource('Workbook register ' + type, () => api.finance.workbookList(type))
    ));
    const invoiceSource = baseResults[0];
    const expenseSource = baseResults[1];
    const projectSource = baseResults[2];
    const vendorSource = baseResults[3];
    const nextRegisters: Record<string, WorkbookRecord[]> = {};
    workbookResults.forEach((result, index) => {
      const type = SUPPLEMENTARY_FINANCE_RECORD_TYPES[index];
      nextRegisters[type] = Array.isArray(result.data?.records) ? result.data.records as WorkbookRecord[] : [];
    });
    setRegisterRecords(nextRegisters);
    setRegisterErrors(workbookResults.filter((result) => result.error).map((result) => result.label + ': ' + result.error));
    const nextInvoices = Array.isArray(invoiceSource.data?.invoices)
      ? invoiceSource.data.invoices.map((item: AgencyInvoice) => normalizeFinanceInvoice({
          ...item,
          currency: item.currency || 'IDR',
          items: Array.isArray(item.items) ? item.items : []
        } as AgencyInvoice))
      : [];
    const nextExpenses = Array.isArray(expenseSource.data?.expenses)
      ? expenseSource.data.expenses.map((item: AgencyExpense) => normalizeFinanceExpense(item))
      : [];
    setInvoices(nextInvoices);
    setExpenses(nextExpenses);
    setProjects(Array.isArray(projectSource.data?.projects) ? projectSource.data.projects as AgencyProject[] : []);
    setVendors(Array.isArray(vendorSource.data?.vendors) ? vendorSource.data.vendors as AgencyVendor[] : []);
    setSourceErrors(baseResults.filter((result) => result.error).map((result) => result.label + ': ' + result.error));
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    setSearchText('');
    setRegisterActionError(null);
  }, [activeTab.key]);

  const reportInvoices = useMemo(() => invoices.filter(isIssuedInvoice), [invoices]);
  const idrInvoices = useMemo(() => reportInvoices.filter((invoice) => (invoice.currency || 'IDR') === 'IDR'), [reportInvoices]);
  const idrExpenses = useMemo(() => expenses.filter((expense) => String((expense as any).currency || 'IDR') === 'IDR'), [expenses]);
  const totalBilled = useMemo(() => sumAmounts<AgencyInvoice>(idrInvoices, (invoice) => Number(invoice.total) || 0), [idrInvoices]);
  const totalCollected = useMemo(() => sumAmounts<AgencyInvoice>(idrInvoices, getInvoiceCollected), [idrInvoices]);
  const totalOutstanding = useMemo(() => sumAmounts<AgencyInvoice>(idrInvoices, getInvoiceOutstanding), [idrInvoices]);
  const totalExpenses = useMemo(() => sumAmounts<AgencyExpense>(idrExpenses, (expense) => Number(expense.amount) || 0), [idrExpenses]);
  const cashMovements = useMemo<CashMovement[]>(() => {
    const entries: CashMovement[] = [];
    for (const invoice of reportInvoices) {
      for (const payment of getPaymentRows(invoice)) {
        if (!payment.date || payment.amount <= 0) continue;
        entries.push({
          id: 'payment-' + invoice.id + '-' + payment.id,
          date: payment.date,
          reference: payment.reference || invoice.invoiceNumber,
          description: 'Client payment · ' + invoiceClient(invoice),
          cashIn: payment.amount,
          cashOut: 0,
          source: 'Invoice payment',
          currency: invoice.currency || 'IDR'
        });
      }
    }
    for (const expense of expenses) {
      if (!expense.date || Number(expense.amount) <= 0 || isPettyCashRelated(expense)) continue;
      entries.push({
        id: 'expense-' + expense.id,
        date: String(expense.date).slice(0, 10),
        reference: String((expense as any).reference || expense.id),
        description: expenseLabel(expense),
        cashIn: 0,
        cashOut: Number(expense.amount) || 0,
        source: 'Expense record',
        currency: String((expense as any).currency || 'IDR')
      });
    }
    for (const record of registerRecords['cash-bank-transaction'] || []) {
      const payload = record.payload || {};
      const amount = Number(payload.amount) || 0;
      const accountCode = String(payload.accountCode || '');
      const counterpartAccountCode = String(payload.counterpartAccountCode || '');
      const direction = String(payload.direction || 'out');
      const kind = String(payload.transactionKind || 'manual');
      let cashIn = 0;
      let cashOut = 0;
      if (accountCode === '1000') {
        cashIn = direction === 'in' ? amount : 0;
        cashOut = direction === 'out' ? amount : 0;
      } else if (counterpartAccountCode === '1000') {
        cashIn = amount;
      } else {
        continue;
      }
      if (amount <= 0) continue;
      entries.push({
        id: 'cash-workbook-' + record.id,
        date: String(payload.date || '').slice(0, 10),
        reference: String(payload.reference || record.recordKey || record.id),
        description: String(payload.description || (kind === 'manual' ? 'Manual bank movement' : 'Internal cash transfer')),
        cashIn,
        cashOut,
        source: kind === 'manual' ? 'Manual bank adjustment' : 'Internal transfer',
        currency: 'IDR'
      });
    }
    return entries.sort((a, b) => b.date.localeCompare(a.date));
  }, [reportInvoices, expenses, registerRecords]);

  const matching = useCallback((values: unknown[]) => {
    const needle = searchText.trim().toLowerCase();
    return !needle || values.some((value) => String(value || '').toLowerCase().includes(needle));
  }, [searchText]);


  const getRegisterRecords = (type: string): WorkbookRecord[] => registerRecords[type] || [];
  const getOpeningRecord = (accountCode: string): WorkbookRecord | undefined =>
    getRegisterRecords('cash-bank-opening').find((item) => String(item.payload.accountCode) === accountCode);

  const getOpeningBalance = (accountCode: string): number | null => {
    const record = getOpeningRecord(accountCode);
    return record ? Number(record.payload.openingBalance) || 0 : null;
  };

  const getProjectFinanceRecord = (project: AgencyProject): WorkbookRecord | undefined =>
    getRegisterRecords('project-finance').find((record) =>
      (Boolean(record.projectId) && record.projectId === project.id) ||
      String(record.payload.projectName || '').toLowerCase() === String(project.name || '').toLowerCase()
    );


  const openRegisterForm = (type: string, record?: WorkbookRecord, initialPayload: Record<string, any> = {}) => {
    const definition = REGISTER_FORMS[type];
    if (!definition) {
      setRegisterActionError('This workbook section does not have an editable register form yet.');
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    const defaults: Record<string, any> = {};
    for (const field of definition.fields) {
      if (field.defaultValue !== undefined) defaults[field.key] = field.defaultValue;
      else if (field.type === 'date') defaults[field.key] = today;
      else if (field.type === 'month') defaults[field.key] = selectedMonth;
      else if (field.type === 'number') defaults[field.key] = '';
      else if (field.type === 'select') defaults[field.key] = field.optionSource ? '' : (field.options?.[0] || '');
      else defaults[field.key] = '';
    }
    const savedPayload = record ? { ...record.payload } : {};
    if (record && type === 'journal-entry' && Array.isArray(record.payload.lines) && record.payload.lines.length === 2) {
      const lines = record.payload.lines as Array<Record<string, any>>;
      savedPayload.debitAccountCode = lines.find((line) => Number(line.debit) > 0)?.accountCode || '';
      savedPayload.creditAccountCode = lines.find((line) => Number(line.credit) > 0)?.accountCode || '';
      savedPayload.amount = Number(lines.find((line) => Number(line.debit) > 0)?.debit || 0);
    }
    if (record && type === 'vendor-bill-payment') {
      const installmentNumber = Number(record.payload.installmentNumber || 0);
      savedPayload.installmentNumber = installmentNumber >= 1 && installmentNumber <= 3
        ? installmentNumber + ' · ' + [30, 20, 50][installmentNumber - 1] + '%'
        : 'Unassigned · FIFO';
    }
    setEditor({ type, record, payload: { ...defaults, ...savedPayload, ...initialPayload } });
    setRegisterActionError(null);
  };

  const getRegisterFieldOptions = (field: RegisterField): Array<{ value: string; label: string }> => {
    if (field.optionSource === 'accounts') {
      const storedAccounts = getRegisterRecords('chart-of-accounts')
        .filter((record) => record.payload.active !== false)
        .map((record) => ({ value: String(record.payload.code || record.recordKey), label: String(record.payload.code || record.recordKey) + ' · ' + String(record.payload.name || '') }));
      return [{ value: '', label: 'Select an account' }, ...(storedAccounts.length ? storedAccounts : ACCOUNT_OPTION_CODES)];
    }
    if (field.optionSource === 'cashAccounts') return [{ value: '', label: 'Select a cash account' }, ...CASH_ACCOUNT_OPTIONS];
    if (field.optionSource === 'projects') return [
      { value: '', label: 'Not linked to an AMS project' },
      ...projects.map((project) => ({ value: project.id, label: (project.name || project.slug || project.id) + ' · ' + project.id }))
    ];
    if (field.optionSource === 'vendors') return [
      { value: '', label: 'Not linked to an AMS vendor' },
      ...vendors.map((vendor) => ({ value: vendor.id, label: (vendor.companyName || vendor.name) + ' · ' + vendor.id }))
    ];
    if (field.optionSource === 'vendorBills') {
      const bills = getRegisterRecords('vendor-bill');
      return [
        { value: '', label: bills.length ? 'Select a vendor bill' : 'No vendor bills available' },
        ...bills.map((bill) => ({
          value: bill.id,
          label: String(bill.payload.billNo || bill.recordKey) + ' · ' + String(bill.payload.vendorName || 'Vendor') + ' · ' + formatMoney(Number(bill.payload.outstanding ?? bill.payload.total) || 0, String(bill.payload.currency || 'IDR'))
        }))
      ];
    }
    return [
      { value: '', label: field.required ? 'Select an option' : 'Not specified' },
      ...(field.options || []).map((value) => {
        if (value.includes(' · ')) {
          const index = value.indexOf(' · ');
          return { value: value.slice(0, index), label: value };
        }
        return { value, label: normaliseStatus(value) };
      })
    ];
  };

  const changeRegisterField = (key: string, value: string) => {
    setEditor((current) => {
      if (!current) return current;
      const payload = { ...current.payload, [key]: value };
      if (current.type === 'cash-bank-transaction' && key === 'transactionKind') {
        const rules: Record<string, { from: string; to: string; direction: string }> = {
          'manual': { from: '1000', to: '', direction: 'out' },
          'bank-to-petty-cash': { from: '1000', to: '1100', direction: 'out' },
          'petty-cash-to-bank': { from: '1100', to: '1000', direction: 'out' },
          'bank-to-emergency-fund': { from: '1000', to: '1200', direction: 'out' },
          'emergency-fund-to-bank': { from: '1200', to: '1000', direction: 'out' }
        };
        const rule = rules[value];
        if (rule) {
          payload.accountCode = rule.from;
          payload.counterpartAccountCode = rule.to;
          payload.direction = rule.direction;
        }
      }
      return { ...current, payload };
    });
  };

  const submitRegisterForm = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editor || registerSaving) return;
    setRegisterSaving(true);
    setRegisterActionError(null);
    try {
      let payload: Record<string, any> = { ...editor.payload };
      if (editor.type === 'journal-entry') {
        const debitCode = String(payload.debitAccountCode || '');
        const creditCode = String(payload.creditAccountCode || '');
        const numericAmount = Number(payload.amount);
        if (!debitCode || !creditCode || debitCode === creditCode) {
          setRegisterActionError('Choose two different accounts for the debit and credit lines.');
          setRegisterSaving(false);
          return;
        }
        if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
          setRegisterActionError('Journal amount must be a positive number.');
          setRegisterSaving(false);
          return;
        }
        const getAccountName = (code: string) => getRegisterRecords('chart-of-accounts').find((record) => String(record.payload.code || record.recordKey) === code)?.payload.name || EXCEL_CHART_OF_ACCOUNTS.find((account) => account.code === code)?.name || code;
        const debitName = String(getAccountName(debitCode));
        const creditName = String(getAccountName(creditCode));
        payload = {
          date: payload.date,
          reference: payload.reference,
          description: payload.description,
          projectId: payload.projectId,
          notes: payload.notes,
          status: editor.record?.status || 'draft',
          ...(editor.record?.payload.sourceType && editor.record?.payload.sourceId ? {
            sourceType: editor.record.payload.sourceType,
            sourceId: editor.record.payload.sourceId,
            ...(editor.record.payload.relatedSourceId ? { relatedSourceId: editor.record.payload.relatedSourceId } : {})
          } : {}),
          lines: [
            { accountCode: debitCode, accountName: debitName, debit: numericAmount, credit: 0, notes: payload.notes || '' },
            { accountCode: creditCode, accountName: creditName, debit: 0, credit: numericAmount, notes: payload.notes || '' }
          ]
        };
      }
      const result = editor.record
        ? await api.finance.workbookUpdate(editor.type, editor.record.id, payload, editor.record.version)
        : await api.finance.workbookCreate(editor.type, payload);
      if (!result.success) throw new Error(result.error || 'The Finance record could not be saved.');
      setEditor(null);
      await loadData(true);
    } catch (error) {
      setRegisterActionError(error instanceof Error ? error.message : 'The Finance record could not be saved.');
    } finally {
      setRegisterSaving(false);
    }
  };

  const syncSourceJournalDrafts = async () => {
    if (registerSaving) return;
    setRegisterSaving(true);
    setRegisterActionError(null);
    setJournalSyncSummary(null);
    try {
      const response = await api.finance.workbookSyncJournalDrafts();
      const summary = response.data?.summary;
      if (!response.success || !summary) throw new Error(response.error || response.data?.error || 'Source journal drafts could not be generated.');
      setJournalSyncSummary(
        'Sync completed: ' + summary.created + ' draft(s) created, ' +
        summary.updated + ' refreshed, ' + summary.alreadyPresent + ' unchanged/already posted, ' + summary.skipped + ' skipped' +
        (summary.failed ? ', ' + summary.failed + ' failed' : '') +
        '. Nothing was automatically posted.'
      );
      if (summary.failed) {
        setRegisterActionError('Some source rows could not be synchronized. Review the failed-source details or server logs, then retry; existing drafts remain available.');
      }
      await loadData(true);
    } catch (error) {
      setRegisterActionError(error instanceof Error ? error.message : 'Source journal drafts could not be generated.');
    } finally {
      setRegisterSaving(false);
    }
  };

  const approveWorkbookRecord = async (type: string, record: WorkbookRecord, action: 'approve' | 'post' = 'approve') => {
    setRegisterActionError(null);
    const response = await api.finance.workbookApprove(type, record.id, '', action);
    if (!response.success) {
      setRegisterActionError(response.error || 'The approval could not be completed.');
      return;
    }
    await loadData(true);
  };

  const closeWorkbookPeriod = async () => {
    if (registerSaving) return;
    setRegisterSaving(true);
    setRegisterActionError(null);
    try {
      const response = await api.finance.workbookClosePeriod(selectedMonth);
      if (!response.success) throw new Error(response.error || 'The period could not be closed.');
      await loadData(true);
    } catch (error) {
      setRegisterActionError(error instanceof Error ? error.message : 'The period could not be closed.');
    } finally {
      setRegisterSaving(false);
    }
  };

  const openCashOpeningForm = (accountCode = '1000') => {
    const existing = getRegisterRecords('cash-bank-opening').find((record) => String(record.payload.accountCode) === accountCode);
    openRegisterForm('cash-bank-opening', existing, { accountCode });
  };

  const registerAddButton = (type: string, label = 'Add record', initialPayload: Record<string, any> = {}) => (
    <Button variant="secondary" type="button" icon={<Plus size={14} />} onClick={() => openRegisterForm(type, undefined, initialPayload)}>{label}</Button>
  );

  const registerRecordActions = (type: string, record: WorkbookRecord, extra?: React.ReactNode) => {
    const isPosted = type === 'journal-entry' && record.status === 'posted';
    const isDone = type === 'monthly-closing' && String(record.payload.status || record.status) === 'Done';
    const voucherStatus = String(record.payload.status || record.status);
    const isApproved = type === 'petty-cash-voucher' && ['approved','posted'].includes(voucherStatus);
    const canEdit = !isPosted && type !== 'monthly-closing-lock' && !isDone && !isApproved
      && !(type === 'journal-entry' && Array.isArray(record.payload.lines) && record.payload.lines.length !== 2);
    const canApprove = (type === 'petty-cash-voucher' && voucherStatus === 'pending')
      || (type === 'journal-entry' && record.status === 'draft')
      || (type === 'monthly-closing' && !isDone);
    const canPostVoucher = type === 'petty-cash-voucher' && voucherStatus === 'approved';
    const actionLabel = type === 'journal-entry' ? 'Post'
      : type === 'petty-cash-voucher' ? 'Approve'
      : type === 'monthly-closing' ? 'Complete' : 'Approve';
    return (
      <div className="flex flex-wrap items-center gap-2">
        {canEdit && <Button variant="secondary" type="button" onClick={() => openRegisterForm(type, record)}>Edit</Button>}
        {canApprove && <Button variant="secondary" type="button" onClick={() => void approveWorkbookRecord(type, record)}>{actionLabel}</Button>}
        {canPostVoucher && <Button variant="secondary" type="button" onClick={() => void approveWorkbookRecord(type, record, 'post')}>Post cash movement</Button>}
        {extra}
      </div>
    );
  };

  const renderRegisterEditor = () => {
    if (!editor) return null;
    const definition = REGISTER_FORMS[editor.type];
    if (!definition) return null;
    return (
      <Drawer
        open={Boolean(editor)}
        onClose={() => { if (!registerSaving) setEditor(null); }}
        title={editor.record ? 'Edit ' + definition.title : definition.title}
        description={definition.description}
        size="2xl"
        slug="finance-workbook-register-editor"
      >
        <form onSubmit={(event) => void submitRegisterForm(event)} className="space-y-4 p-1">
          <div className="space-y-1">
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted">Workbook register</span>
            <h3 className="text-sm font-semibold text-fg">{definition.title}</h3>
            <p className="text-xs leading-5 text-muted">{definition.description}</p>
          </div>
          {registerActionError && (
            <div className="rounded-control border border-danger/25 bg-danger/5 p-3 text-xs leading-5 text-fg" role="alert">{registerActionError}</div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            {definition.fields.filter((field) => !field.visibleWhen || field.visibleWhen.values.includes(String(editor.payload[field.visibleWhen.key] || ''))).map((field) => {
              const value = editor.payload[field.key] === undefined || editor.payload[field.key] === null ? '' : String(editor.payload[field.key]);
              const disabled = editor.record?.recordType === 'chart-of-accounts' && field.key === 'code';
              const commonClass = 'mt-1.5 block h-9 w-full rounded-control border border-line bg-bg px-3 text-xs text-fg outline-none transition-colors focus:border-accent disabled:cursor-not-allowed disabled:opacity-60';
              return (
                <label key={field.key} className={field.type === 'textarea' ? 'block sm:col-span-2 text-xs font-medium text-muted' : 'block text-xs font-medium text-muted'}>
                  {field.label}{field.required ? ' *' : ''}
                  {field.type === 'textarea' ? (
                    <textarea
                      value={value}
                      required={field.required}
                      rows={3}
                      onChange={(event) => changeRegisterField(field.key, event.target.value)}
                      placeholder={field.placeholder}
                      className="mt-1.5 block w-full rounded-control border border-line bg-bg px-3 py-2 text-xs text-fg outline-none transition-colors focus:border-accent"
                    />
                  ) : field.type === 'select' ? (
                    <select
                      value={value}
                      required={field.required}
                      disabled={field.optionSource === 'vendorBills' && getRegisterRecords('vendor-bill').length === 0}
                      onChange={(event) => changeRegisterField(field.key, event.target.value)}
                      className={commonClass}
                    >
                      {getRegisterFieldOptions(field).map((option) => <option key={option.value || 'empty'} value={option.value}>{option.label}</option>)}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      value={value}
                      required={field.required}
                      disabled={disabled}
                      min={field.type === 'number' ? '0' : undefined}
                      step={field.type === 'number' ? '0.01' : undefined}
                      onChange={(event) => changeRegisterField(field.key, event.target.value)}
                      placeholder={field.placeholder}
                      className={commonClass}
                    />
                  )}
                  {field.help && <span className="mt-1 block text-[11px] leading-4 text-muted">{field.help}</span>}
                </label>
              );
            })}
          </div>
          {editor.type === 'journal-entry' && (
            <WorkbookNote title="Posting control">
              The entry is saved as Draft and requires a different authorized user to post it. Total debit and credit must balance before it can be saved.
            </WorkbookNote>
          )}
          <div className="flex flex-wrap justify-end gap-2 border-t border-line pt-4">
            <Button type="button" variant="secondary" onClick={() => setEditor(null)} disabled={registerSaving}>Cancel</Button>
            <Button type="submit" loading={registerSaving} disabled={registerSaving}>{registerSaving ? 'Saving…' : editor.record ? 'Save changes' : 'Save record'}</Button>
          </div>
        </form>
      </Drawer>
    );
  };

  const openLegacyTransactions = () => navigate('/admin/invoicing');
  const groupItems = FINANCE_WORKBOOK_GROUPS.map((group) => ({
    key: group.key,
    label: group.label,
    to: '/admin/finance?tab=' + group.items[0].key
  }));
  const sheetItems = activeGroup.items.map((item) => ({
    key: item.key,
    label: item.sheet + ' ' + item.label,
    to: '/admin/finance?tab=' + item.key
  }));

  const renderLoading = () => (
    <AdminPanel title="Loading finance sources" description="Reading live AMS invoice, expense, project and vendor records.">
      <div className="space-y-3 p-4">
        <div className="h-4 w-1/3 rounded-control bg-line/60" />
        <div className="h-24 rounded-card border border-line bg-bg" />
        <div className="h-32 rounded-card border border-line bg-bg" />
      </div>
    </AdminPanel>
  );

  const renderRecentActivity = () => {
    const rows: TableRow[] = cashMovements.slice(0, 8).map((entry) => ({
      id: entry.id,
      cells: [
        formatDate(entry.date),
        entry.reference,
        entry.description,
        entry.source,
        entry.cashIn ? <span className="text-success">{formatMoney(entry.cashIn, entry.currency)}</span> : '—',
        entry.cashOut ? formatMoney(entry.cashOut, entry.currency) : '—'
      ]
    }));
    return (
      <FinanceDataTable
        title="Recent transaction activity"
        description="Derived from invoice payments and expenses, plus explicitly recorded bank adjustments and internal cash transfers. This is not an imported bank statement."
        columns={[
          { label: 'Date' }, { label: 'Reference' }, { label: 'Description' }, { label: 'Source' },
          { label: 'Cash in', align: 'right' }, { label: 'Cash out', align: 'right' }
        ]}
        rows={rows}
        emptyMessage="No recorded payment or expense activity is available from the connected AMS sources."
      />
    );
  };

  const renderSummary = (dashboard: boolean) => {
    const currentMonth = selectedMonth;
    const billedInMonth = sumAmounts<AgencyInvoice>(idrInvoices.filter((invoice) => getMonthKey(getInvoiceDate(invoice)) === currentMonth), (invoice) => Number(invoice.total) || 0);
    const collectedInMonth = sumAmounts<CashMovement>(cashMovements.filter((movement) => movement.currency === 'IDR' && getMonthKey(movement.date) === currentMonth), (movement) => movement.cashIn);
    const expenseInMonth = sumAmounts<AgencyExpense>(idrExpenses.filter((expense) => getMonthKey(expense.date) === currentMonth), (expense) => Number(expense.amount) || 0);
    const metrics = [
      { id: 'billed', label: 'Total billed', value: formatMoney(totalBilled), context: 'IDR issued invoices; non-IDR invoices remain visible in transaction registers', icon: <FileText size={15} /> },
      { id: 'collected', label: 'Total collected', value: formatMoney(totalCollected), context: 'Recorded IDR client payments', icon: <ArrowDown size={15} />, toneClassName: 'text-success' },
      { id: 'receivable', label: 'Outstanding receivables', value: formatMoney(totalOutstanding), context: 'Derived from IDR invoice balances', icon: <WalletCards size={15} />, toneClassName: 'text-warning' },
      { id: 'expenses', label: 'Recorded expenses', value: formatMoney(totalExpenses), context: 'IDR expense records returned by AMS', icon: <ArrowUpRight size={15} />, toneClassName: 'text-series-3' }
    ];
    const recentInvoices: TableRow[] = [...reportInvoices]
      .sort((a, b) => String(b.issueDate || '').localeCompare(String(a.issueDate || '')))
      .slice(0, 6)
      .map((invoice) => ({
        id: invoice.id,
        cells: [
          invoice.invoiceNumber,
          invoiceClient(invoice),
          formatDate(invoice.issueDate),
          formatMoney(Number(invoice.total) || 0, invoice.currency),
          formatMoney(getInvoiceOutstanding(invoice), invoice.currency),
          <StatusBadge value={invoice.status} />
        ]
      }));
    return (
      <div className="space-y-4">
        <AdminMetricStrip metrics={metrics} />
        {dashboard && (
          <AdminPanel title="Selected-month activity" description="Choose a month to inspect the same invoice and expense sources used throughout this workspace.">
            <div className="grid gap-4 p-4 sm:grid-cols-3">
              <label className="block text-xs font-medium text-muted">Reporting month
                <input type="month" value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)} className="mt-1.5 block h-9 w-full rounded-control border border-line bg-bg px-3 text-xs text-fg outline-none focus:border-accent" />
              </label>
              <div className="rounded-control border border-line bg-bg p-3">
                <span className="block text-xs text-muted">Invoice value issued</span>
                <strong className="mt-1 block text-base font-semibold tabular-nums text-fg">{formatMoney(billedInMonth)}</strong>
              </div>
              <div className="rounded-control border border-line bg-bg p-3">
                <span className="block text-xs text-muted">Cash movement in / out</span>
                <strong className="mt-1 block text-base font-semibold tabular-nums text-fg">{formatMoney(collectedInMonth)} / {formatMoney(expenseInMonth)}</strong>
              </div>
            </div>
          </AdminPanel>
        )}
        {sourceErrors.length > 0 && (
          <WorkbookNote tone="warning" title="Some finance sources are unavailable">
            {sourceErrors.join(' · ')}. KPI values only reflect source records that loaded successfully. Refresh after the connection is restored.
          </WorkbookNote>
        )}
        <FinanceDataTable
          title={dashboard ? 'Recent invoice register' : 'Finance at a glance'}
          description={dashboard ? 'Latest issued invoices with current outstanding balances.' : 'Recent invoice records. Use the workbook sheet tabs above to continue into the detailed finance flow.'}
          columns={[{ label: 'Invoice no.' }, { label: 'Client' }, { label: 'Issue date' }, { label: 'Invoice value', align: 'right' }, { label: 'Outstanding', align: 'right' }, { label: 'Status' }]}
          rows={recentInvoices}
          emptyMessage="No issued invoices were returned by AMS."
          actions={<Button variant="secondary" type="button" onClick={openLegacyTransactions}>Open transaction workspace</Button>}
        />
        {dashboard && renderRecentActivity()}
        {!dashboard && (
          <AdminPanel title="Workbook flow" description="The active Finance workspace follows the 20 worksheets in Kapitech Finance Final Automated.xlsx.">
            <div className="grid gap-3 p-4 sm:grid-cols-3">
              <div className="rounded-control border border-line bg-bg p-3"><span className="text-xs text-muted">Transactions</span><strong className="mt-1 block text-lg font-semibold tabular-nums text-fg">{invoices.length + expenses.length}</strong><span className="mt-1 block text-xs text-muted">Invoice and expense records loaded</span></div>
              <div className="rounded-control border border-line bg-bg p-3"><span className="text-xs text-muted">Project records</span><strong className="mt-1 block text-lg font-semibold tabular-nums text-fg">{projects.length}</strong><span className="mt-1 block text-xs text-muted">Project links available for reconciliation</span></div>
              <div className="rounded-control border border-line bg-bg p-3"><span className="text-xs text-muted">Vendor records</span><strong className="mt-1 block text-lg font-semibold tabular-nums text-fg">{vendors.length}</strong><span className="mt-1 block text-xs text-muted">Vendor and contract references</span></div>
            </div>
          </AdminPanel>
        )}
      </div>
    );
  };

  const renderView = (tab: FinanceWorkbookTab) => {
    switch (tab.key) {
      case 'executive-summary':
        return renderSummary(false);
      case 'dashboard':
        return renderSummary(true);
      case 'chart-of-accounts':
        return (
          <div className="space-y-4">
            <WorkbookNote title="Workbook-aligned master configuration">
              These 17 account codes and their normal balances are mapped directly from sheet 02 Chart of Accounts. This first pass is read-only; account editing and the persistent account API are not yet connected.
            </WorkbookNote>
            <FinanceDataTable
              title="Chart of Accounts"
              description="Master account list used as the mapping reference for the Excel-aligned Finance flow."
              columns={[{ label: 'Account code' }, { label: 'Account name' }, { label: 'Account type' }, { label: 'Normal balance' }, { label: 'Description' }, { label: 'Status' }]}
              rows={EXCEL_CHART_OF_ACCOUNTS.filter((account) => matching([account.code, account.name, account.type, account.description])).map((account) => ({
                id: account.code,
                cells: [account.code, account.name, account.type, account.normalBalance, account.description, <StatusBadge value={account.active ? 'active' : 'inactive'} />]
              }))}
              emptyMessage="No chart-of-account rows match the current search."
            />
          </div>
        );
      case 'revenue':
        return (
          <div className="space-y-4">
            <WorkbookNote title="Revenue register mapped to issued invoices">
              Invoice records are the current transaction source. Revenue fields such as project, revenue account, due date and payment status are shown from invoice data where those fields exist in AMS.
            </WorkbookNote>
            <AdminPanel title="Search revenue records" bodyClassName="p-4">
              <label className="block text-xs font-medium text-muted">Search invoice, client or project
                <input value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Search invoices…" className="mt-1.5 block h-9 w-full rounded-control border border-line bg-bg px-3 text-xs text-fg outline-none focus:border-accent sm:max-w-md" />
              </label>
            </AdminPanel>
            <FinanceDataTable
              title="Revenue register"
              description="The workbook's Revenue tab maps to issued invoices; payment collections remain attached to the invoice payment records."
              columns={[{ label: 'Date' }, { label: 'Invoice no.' }, { label: 'Client' }, { label: 'Project' }, { label: 'Amount', align: 'right' }, { label: 'Payment status' }, { label: 'Due date' }]}
              rows={reportInvoices.filter((invoice) => matching([invoice.invoiceNumber, invoiceClient(invoice), invoice.projectId, invoice.notes])).map((invoice) => ({
                id: invoice.id,
                cells: [formatDate(getInvoiceDate(invoice)), invoice.invoiceNumber, invoiceClient(invoice), projects.find((project) => project.id === invoice.projectId)?.name || invoice.projectId || '—', formatMoney(Number(invoice.total) || 0, invoice.currency), <StatusBadge value={invoice.status} />, formatDate(invoice.dueDate)]
              }))}
              emptyMessage="No issued invoice data is available for the selected search."
              actions={<Button type="button" variant="secondary" onClick={openLegacyTransactions}>Manage invoices</Button>}
            />
          </div>
        );
      case 'expenses':
        return (
          <div className="space-y-4">
            <AdminPanel title="Search expense records" bodyClassName="p-4">
              <label className="block text-xs font-medium text-muted">Search category, description, project or vendor
                <input value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Search expenses…" className="mt-1.5 block h-9 w-full rounded-control border border-line bg-bg px-3 text-xs text-fg outline-none focus:border-accent sm:max-w-md" />
              </label>
            </AdminPanel>
            <FinanceDataTable
              title="Expense register"
              description="Existing AMS expenses are the source for recorded costs. Unmapped categories should be resolved before final workbook-style P&L posting."
              columns={[{ label: 'Date' }, { label: 'Category' }, { label: 'Description' }, { label: 'Project' }, { label: 'Amount', align: 'right' }, { label: 'Account mapping' }, { label: 'Status' }]}
              rows={expenses.filter((expense) => matching([expense.category, expense.description, expense.projectId, expense.vendorId])).map((expense) => {
                const classification = classifyWorkbookExpense(expense);
                return {
                  id: expense.id,
                  cells: [formatDate(expense.date), expense.category, expense.description, projects.find((project) => project.id === expense.projectId)?.name || expense.projectId || '—', formatMoney(Number(expense.amount) || 0, String((expense as any).currency || 'IDR')), EXPENSE_CLASS_LABELS[classification], <StatusBadge value={(expense as any).status || 'posted'} />]
                };
              })}
              emptyMessage="No expense records match the selected search."
              actions={<Button type="button" variant="secondary" onClick={openLegacyTransactions}>Manage expenses</Button>}
            />
          </div>
        );
      case 'cash-bank': {
        const openingRecord = getOpeningRecord('1000');
        const opening = openingRecord ? Number(openingRecord.payload.openingBalance) || 0 : null;
        const openingDate = String(openingRecord?.payload.openingDate || '').slice(0, 10);
        const cashRows = cashMovements
          .filter((entry) => entry.currency === 'IDR' && (!openingDate || entry.date.slice(0, 10) >= openingDate))
          .slice().sort((a,b) => a.date.localeCompare(b.date));
        let running = opening ?? 0;
        const allCashLedgerRows = cashRows.map((entry) => {
          running += entry.cashIn - entry.cashOut;
          return {
            id: entry.id,
            search: [entry.date,entry.reference,entry.description,entry.source],
            cells: [formatDate(entry.date),entry.reference,entry.description,entry.source,entry.cashIn ? formatMoney(entry.cashIn) : '—',entry.cashOut ? formatMoney(entry.cashOut) : '—',(opening === null ? '—' : formatMoney(running))]
          };
        });
        const rows = allCashLedgerRows.filter((row) => matching(row.search)).reverse();
        const totalIn = sumAmounts<CashMovement>(cashRows, (entry) => entry.cashIn);
        const totalOut = sumAmounts<CashMovement>(cashRows, (entry) => entry.cashOut);
        return (
          <div className="space-y-4">
            <WorkbookNote tone={opening === null ? 'warning' : 'info'} title={opening === null ? 'Cash ledger needs its opening balance' : 'Cash ledger is connected to its opening balance'}>
              {opening === null
                ? 'Set the 1000 Cash & Bank opening balance before treating a running balance as meaningful. Current source movements are not a bank-statement reconciliation; the existing expense API does not yet carry a bank-account/payment-method field.'
                : 'Opening balance is read from the persistent workbook register. Movement rows combine dated invoice collections, expense records and manually recorded bank/cash movements. Reconcile them with the bank statement before closing the month.'}
            </WorkbookNote>
            <AdminMetricStrip metrics={[
              {id:'cash-opening',label:'Opening balance',value:opening === null ? 'Not set' : formatMoney(opening),context:'Account 1000 · Cash & Bank',icon:<Landmark size={15}/>},
              {id:'cash-in',label:'Recorded cash in',value:formatMoney(totalIn),context:'Dated movements in loaded source records',icon:<ArrowDown size={15}/>},
              {id:'cash-out',label:'Recorded cash out',value:formatMoney(totalOut),context:'Dated movements in loaded source records',icon:<ArrowUpRight size={15}/>},
              {id:'cash-closing',label:'Provisional balance',value:opening === null ? 'Not available' : formatMoney(opening+totalIn-totalOut),context:'Opening + in − out; un-reconciled',icon:<WalletCards size={15}/>}
            ]}/>
            <FinanceDataTable
              title="Cash & Bank ledger"
              description="Transactions stay connected to their AMS source record; manual transfer/adjustment entries use the supplementary workbook register."
              columns={[{label:'Date'},{label:'Reference'},{label:'Description'},{label:'Source'},{label:'Cash in',align:'right'},{label:'Cash out',align:'right'},{label:'Running balance',align:'right'}]}
              rows={rows.map((row) => ({...row}))}
              emptyMessage="No dated cash movement is available. Set an opening balance or record a movement."
              actions={<div className="flex flex-wrap gap-2">{registerAddButton('cash-bank-transaction','Add movement')}<Button type="button" variant="secondary" onClick={() => openCashOpeningForm('1000')}>{opening === null ? 'Set opening balance' : 'Edit opening balance'}</Button></div>}
            />
            {renderRecentActivity()}
          </div>
        );
      }
      case 'accounts-receivable':
        return (
          <FinanceDataTable
            title="Accounts receivable"
            description="Outstanding is derived from the same invoice balance; paid amount and due date stay linked to the invoice source."
            columns={[{ label: 'Invoice no.' }, { label: 'Invoice date' }, { label: 'Client' }, { label: 'Project' }, { label: 'Invoice amount', align: 'right' }, { label: 'Paid amount', align: 'right' }, { label: 'Outstanding', align: 'right' }, { label: 'Status' }, { label: 'Due date' }]}
            rows={reportInvoices.filter((invoice) => getInvoiceOutstanding(invoice) > 0).map((invoice) => ({
              id: invoice.id,
              cells: [invoice.invoiceNumber, formatDate(getInvoiceDate(invoice)), invoiceClient(invoice), projects.find((project) => project.id === invoice.projectId)?.name || invoice.projectId || '—', formatMoney(Number(invoice.total) || 0, invoice.currency), formatMoney(getInvoiceCollected(invoice), invoice.currency), formatMoney(getInvoiceOutstanding(invoice), invoice.currency), <StatusBadge value={invoice.status} />, formatDate(invoice.dueDate)]
            }))}
            emptyMessage="No outstanding invoice balances were returned by the current AMS invoice source."
            actions={<Button type="button" variant="secondary" onClick={openLegacyTransactions}>Open invoices</Button>}
          />
        );
      case 'accounts-payable': {
        const bills = getRegisterRecords('vendor-bill').filter((record) => matching([
          record.recordKey, record.payload.billNo, record.payload.vendorName, record.payload.projectName, record.payload.dueDate, record.payload.paymentStatus
        ]));
        const payableTotalIDR = sumAmounts<WorkbookRecord>(bills.filter((record)=>(String(record.payload.currency||'IDR')==='IDR')),(record)=>Number(record.payload.outstanding ?? record.payload.total)||0);
        const foreignCurrencyBillCount = bills.filter((record)=>String(record.payload.currency||'IDR')!=='IDR').length;
        return (
          <div className="space-y-4">
            <WorkbookNote title="Vendor Bill is the payable source of truth">
              Vendor contracts describe commitments. Accounts Payable is now kept in a separate persistent register; each bill can carry its own due date and payment schedule. Linked expenses remain source records and are not silently converted into bills.
            </WorkbookNote>
            <AdminMetricStrip metrics={[
              {id:'ap-bills',label:'Vendor bills',value:String(bills.length),context:'Persistent workbook register',icon:<FileText size={15}/>},
              {id:'ap-total',label:'IDR outstanding',value:formatMoney(payableTotalIDR),context:foreignCurrencyBillCount+' non-IDR bills listed separately',icon:<WalletCards size={15} />}
            ]}/>
            <FinanceDataTable
              title="Accounts Payable register"
              description="Bill state and outstanding values are calculated from payment records linked to the bill."
              columns={[{label:'Bill no.'},{label:'Vendor'},{label:'Project'},{label:'Bill date'},{label:'Due date'},{label:'Bill amount',align:'right'},{label:'Paid',align:'right'},{label:'Outstanding',align:'right'},{label:'Status'},{label:'Actions'}]}
              rows={bills.map((record)=> {
                const total = Number(record.payload.total)||0;
                const paid = Number(record.payload.paidAmount)||0;
                const outstanding = Math.max(0,Number(record.payload.outstanding ?? total-paid)||0);
                return {
                  id:record.id,
                  cells:[
                    String(record.payload.billNo||record.recordKey),
                    String(record.payload.vendorName||'—'),
                    String(record.payload.projectName||record.projectId||'—'),
                    formatDate(record.payload.billDate),
                    formatDate(record.payload.dueDate),
                    formatMoney(total,String(record.payload.currency||'IDR')),
                    formatMoney(paid,String(record.payload.currency||'IDR')),
                    formatMoney(outstanding,String(record.payload.currency||'IDR')),
                    <StatusBadge value={record.payload.paymentStatus||record.status}/>,
                    registerRecordActions('vendor-bill',record, outstanding>0 ? <Button variant="secondary" type="button" onClick={()=>openRegisterForm('vendor-bill-payment',undefined,{billId:record.id,paidDate:new Date().toISOString().slice(0,10),amount:outstanding})}>Record payment</Button> : undefined)
                  ]
                };
              })}
              emptyMessage="No vendor bills have been recorded yet."
              actions={registerAddButton('vendor-bill','Add vendor bill')}
            />
            <FinanceDataTable
              title="Vendor contract references"
              description="Existing AMS contracts are shown as commitments; a contract alone is not treated as a payable bill."
              columns={[{label:'Vendor'},{label:'Contract'},{label:'Rate basis'},{label:'Contract rate/value',align:'right'},{label:'Linked expense records',align:'right'}]}
              rows={vendors.flatMap((vendor)=>(Array.isArray(vendor.contracts)?vendor.contracts:[]).map((contract)=> {
                const linked=expenses.filter((expense)=>{
                  const expenseRecord=expense as AgencyExpense & {vendorContractId?:string;vendorPayment?:{vendorId?:string;contractId?:string};metadata?:{vendorPayment?:{vendorId?:string;contractId?:string}}};
                  const structured=expenseRecord.vendorPayment||expenseRecord.metadata?.vendorPayment;
                  return (expenseRecord.vendorId===vendor.id&&expenseRecord.vendorContractId===contract.id)||(structured?.vendorId===vendor.id&&structured?.contractId===contract.id)||expense.description.startsWith('[VENDOR_PAYMENT]|'+vendor.id+'|'+contract.id+'|');
                });
                return {id:vendor.id+'-'+contract.id,cells:[vendor.companyName||vendor.name,contract.title,normaliseStatus(contract.rateType),formatMoney(Number(contract.rateAmount)||0,contract.currency),String(linked.length)+' · '+formatMoney(sumAmounts<AgencyExpense>(linked,(expense)=>Number(expense.amount)||0),contract.currency)]};
              }))}
              emptyMessage="No vendor contracts are available in AMS."
            />
          </div>
        );
      }
      case 'vendors': {
        const vendorBills = getRegisterRecords('vendor-bill').filter((record) => matching([
          record.recordKey, record.payload.billNo, record.payload.vendorName, record.payload.projectName, record.payload.paymentStatus
        ]));
        const vendorPayments = getRegisterRecords('vendor-bill-payment');
        const scheduleRows = vendorBills.map((bill) => {
          const billPayments = vendorPayments.filter((payment) => String(payment.payload.billId || '') === bill.id);
          const schedule = getVendorBillInstallmentSchedule(
            Number(bill.payload.total) || 0,
            billPayments.map((payment) => ({
              id: payment.id, amount: payment.payload.amount,
              installmentNumber: payment.payload.installmentNumber, paidDate: payment.payload.paidDate
            })),
            Array.isArray(bill.payload.paymentSchedule) ? bill.payload.paymentSchedule as number[] : undefined
          );
          const currency = String(bill.payload.currency || 'IDR');
          const paid = sumAmounts<WorkbookRecord>(billPayments, (payment) => Number(payment.payload.amount) || 0);
          const total = Number(bill.payload.total) || 0;
          const next = schedule.find((installment) => installment.outstanding > 0.01);
          return {
            id: bill.id,
            cells: [
              String(bill.payload.billNo || bill.recordKey),
              String(bill.payload.vendorName || '—'),
              String(bill.payload.projectName || bill.projectId || '—'),
              formatMoney(total, currency),
              formatMoney(schedule[0].amount, currency),
              formatMoney(schedule[0].paidAmount, currency),
              formatMoney(schedule[1].amount, currency),
              formatMoney(schedule[1].paidAmount, currency),
              formatMoney(schedule[2].amount, currency),
              formatMoney(schedule[2].paidAmount, currency),
              formatMoney(paid, currency),
              formatMoney(Math.max(0, total - paid), currency),
              next ? 'Payment ' + next.number + ' · ' + next.percentage + '%' : 'Complete',
              <StatusBadge value={bill.payload.paymentStatus || bill.status} />
            ]
          };
        });
        return (
          <div className="space-y-4">
            <FinanceDataTable
              title="Vendor & freelancer directory"
              description="Uses the existing AMS vendor and contract source. Vendor payment commitments and stage settlements are summarized below from the bill and payment registers."
              columns={[{ label: 'Vendor / company' }, { label: 'Type' }, { label: 'Service' }, { label: 'Rate', align: 'right' }, { label: 'Contracts', align: 'center' }, { label: 'Status' }]}
              rows={vendors.filter((vendor) => matching([vendor.name, vendor.companyName, vendor.type, vendor.primaryCategory, vendor.skills.join(' ')])).map((vendor) => ({
                id: vendor.id,
                cells: [vendor.companyName || vendor.name, normaliseStatus(vendor.type), vendor.primaryCategory, formatMoney(Number(vendor.hourlyRate) || 0, vendor.currency), String(Array.isArray(vendor.contracts) ? vendor.contracts.length : 0), <StatusBadge value={vendor.status} />]
              }))}
              emptyMessage="No vendor records were returned by AMS."
              actions={<Button type="button" variant="secondary" onClick={() => navigate('/admin/team?view=vendor-directory')}>Open vendor directory</Button>}
            />
            <FinanceDataTable
              title="Vendor & Freelancer · 30% / 20% / 50% schedule"
              description="Amounts and paid amounts are derived from each persisted bill and its linked payments. Unassigned legacy payments are allocated FIFO; the single bill due date remains authoritative because the workbook has no separate due date per installment."
              columns={[
                { label: 'Bill no.' }, { label: 'Vendor / freelancer' }, { label: 'Project' }, { label: 'Contract value', align: 'right' },
                { label: 'Payment 1 · 30%', align: 'right' }, { label: 'Paid 1', align: 'right' },
                { label: 'Payment 2 · 20%', align: 'right' }, { label: 'Paid 2', align: 'right' },
                { label: 'Payment 3 · 50%', align: 'right' }, { label: 'Paid 3', align: 'right' },
                { label: 'Total paid', align: 'right' }, { label: 'Outstanding', align: 'right' }, { label: 'Next payment' }, { label: 'Status' }
              ]}
              rows={scheduleRows}
              emptyMessage="No vendor bills have been entered. Create a bill in Accounts Payable to generate the 30% / 20% / 50% schedule."
            />
          </div>
        );
      }
      case 'project-finance': {
        const financeRecords=getRegisterRecords('project-finance');
        const rows=projects.filter((project)=>matching([project.name,project.clientCompany,project.clientName,project.status])).map((project)=>{
          const record=getProjectFinanceRecord(project);
          const projectInvoices=reportInvoices.filter((invoice)=>invoice.projectId===project.id);
          const projectExpenses=expenses.filter((expense)=>expense.projectId===project.id);
          const payload=record?.payload||{};
          const billed=sumAmounts<AgencyInvoice>(projectInvoices,(invoice)=>Number(invoice.total)||0);
          const collected=sumAmounts<AgencyInvoice>(projectInvoices,getInvoiceCollected);
          const costs=sumAmounts<AgencyExpense>(projectExpenses,(expense)=>Number(expense.amount)||0);
          const contractValue=record?Number(payload.contractValue)||0:null;
          const billedIDR=sumAmounts<AgencyInvoice>(projectInvoices.filter((invoice)=>(invoice.currency||'IDR')==='IDR'),(invoice)=>Number(invoice.total)||0);
          const collectedIDR=sumAmounts<AgencyInvoice>(projectInvoices.filter((invoice)=>(invoice.currency||'IDR')==='IDR'),getInvoiceCollected);
          const costsIDR=sumAmounts<AgencyExpense>(projectExpenses.filter((expense)=>String((expense as any).currency||'IDR')==='IDR'),(expense)=>Number(expense.amount)||0);
          return {id:project.id,cells:[
            projectLabel(project),project.clientCompany||project.clientName||'—',
            contractValue===null?<AdminStatusBadge tone="warning">Setup required</AdminStatusBadge>:formatMoney(contractValue),
            formatMoney(billedIDR),formatMoney(collectedIDR),formatMoney(costsIDR),<StatusBadge value={project.status}/>,
            record?registerRecordActions('project-finance',record):<Button variant="secondary" type="button" onClick={()=>openRegisterForm('project-finance',undefined,{projectId:project.id,projectName:project.name,clientName:project.clientCompany||project.clientName,startDate:project.startDate,endDate:project.targetEndDate,projectStatus:project.status})}>Configure</Button>
          ]};
        });
        const orphanRecords=financeRecords.filter((record)=>!projects.some((project)=>(record.projectId&&record.projectId===project.id)||String(record.payload.projectName||'').toLowerCase()===String(project.name||'').toLowerCase()));
        return (
          <div className="space-y-4">
            <WorkbookNote title="Excel project finance register">
              Contract value, vendor commitment and other obligations come only from the dedicated workbook-aligned project record. The existing AMS project budget is not substituted for contract value. Billed, collected and recorded costs remain linked to existing invoices and expenses using explicit project IDs.
            </WorkbookNote>
            <FinanceDataTable title="Project Finance" description="Setup each project to record the same contract and commitment fields used by Excel." columns={[{label:'Project'},{label:'Client'},{label:'Contract value',align:'right'},{label:'Billed',align:'right'},{label:'Collected',align:'right'},{label:'Recorded cost',align:'right'},{label:'Project status'},{label:'Setup / actions'}]} rows={rows} emptyMessage="No AMS projects were returned. A named project record can still be created from the workbook register." actions={registerAddButton('project-finance','Add project finance record')}/>
            {orphanRecords.length>0&&<FinanceDataTable title="Workbook project records without a linked AMS project" description="These records remain visible rather than being silently attached to another project." columns={[{label:'Project key'},{label:'Contract value',align:'right'},{label:'Vendor commitment',align:'right'},{label:'Other obligations',align:'right'},{label:'Status'},{label:'Actions'}]} rows={orphanRecords.map((record)=>({id:record.id,cells:[String(record.payload.projectName||record.recordKey),formatMoney(Number(record.payload.contractValue)||0),formatMoney(Number(record.payload.vendorCommitment)||0),formatMoney(Number(record.payload.otherObligations)||0),<StatusBadge value={record.status}/>,registerRecordActions('project-finance',record)]}))}/>}
          </div>
        );
      }
      case 'operational-budget': {
        const budgetRecords = getRegisterRecords('operational-budget');
        const actualByMonthCategory = new Map<string,{month:string;category:string;amount:number;count:number}>();
        for(const expense of expenses){
          const month=getMonthKey(expense.date);
          if(!month) continue;
          const category=String(expense.category||'Unclassified');
          const key=month+'|'+category.toLowerCase();
          const current=actualByMonthCategory.get(key)||{month,category,amount:0,count:0};
          current.amount+=Number(expense.amount)||0;
          current.count+=1;
          actualByMonthCategory.set(key,current);
        }
        const keys=new Set<string>([
          ...budgetRecords.map((record)=>String(record.payload.month||record.periodKey||'')+'|'+String(record.payload.category||'').toLowerCase()),
          ...actualByMonthCategory.keys()
        ]);
        const records=[...keys].map((key)=>{
          const [month,categoryKey]=key.split('|');
          const budgetRecord=budgetRecords.find((record)=>String(record.payload.month||record.periodKey||'')===month&&String(record.payload.category||'').toLowerCase()===categoryKey);
          const actual=actualByMonthCategory.get(key);
          return {key,month,category:String(budgetRecord?.payload.category||actual?.category||categoryKey),budgetRecord,budget:Number(budgetRecord?.payload.budgetAmount)||0,actual:actual?.amount||0,count:actual?.count||0,pic:String(budgetRecord?.payload.pic||''),notes:String(budgetRecord?.payload.notes||'')};
        }).filter((item)=>item.month&&matching([item.month,item.category,item.pic,item.notes])).sort((a,b)=>b.month.localeCompare(a.month)||a.category.localeCompare(b.category));
        return (
          <div className="space-y-4">
            <WorkbookNote title="Monthly budget versus actual">
              Budget lines are stored by month, category and PIC. Actual costs remain sourced from expense records; the table does not insert zero-value placeholder budget rows.
            </WorkbookNote>
            <FinanceDataTable
              title="Operational Budget"
              description="Variance is budget less expense actual for the same calendar month and expense category."
              columns={[{label:'Month'},{label:'Category'},{label:'PIC'},{label:'Budget',align:'right'},{label:'Actual',align:'right'},{label:'Variance',align:'right'},{label:'Expense rows',align:'right'},{label:'Actions'}]}
              rows={records.map((item)=>({
                id:item.key,
                cells:[
                  item.month,item.category||'—',item.pic||'—',
                  item.budgetRecord?formatMoney(item.budget):<AdminStatusBadge tone="warning">Budget not set</AdminStatusBadge>,
                  formatMoney(item.actual),
                  item.budgetRecord?formatMoney(item.budget-item.actual):'—',
                  String(item.count),
                  item.budgetRecord?registerRecordActions('operational-budget',item.budgetRecord):<Button variant="secondary" type="button" onClick={()=>openRegisterForm('operational-budget',undefined,{month:item.month,category:item.category})}>Set budget</Button>
                ]
              }))}
              emptyMessage="No budget lines or dated expense records exist for the current search."
              actions={registerAddButton('operational-budget','Add budget line',{month:selectedMonth})}
            />
          </div>
        );
      }
      case 'petty-cash': {
        const openingRecord=getOpeningRecord('1100');
        const opening=openingRecord?Number(openingRecord.payload.openingBalance)||0:null;
        const openingDate=String(openingRecord?.payload.openingDate||'').slice(0,10);
        const vouchers=getRegisterRecords('petty-cash-voucher');
        const transferRows=getRegisterRecords('cash-bank-transaction').filter((record)=>String(record.payload.counterpartAccountCode||'')==='1100'||String(record.payload.accountCode||'')==='1100');
        const movements:Array<{id:string;date:string;reference:string;description:string;cashIn:number;cashOut:number;status:string;source:string;record?:WorkbookRecord}>=[];
        for(const record of transferRows){
          const payload=record.payload||{};
          const amount=Number(payload.amount)||0;
          const isCashIn=(String(payload.counterpartAccountCode||'')==='1100'&&String(payload.accountCode||'')!=='1100')||(String(payload.accountCode||'')==='1100'&&String(payload.counterpartAccountCode||'')!=='1000'&&String(payload.direction||'out')==='in');
          movements.push({id:record.id,date:String(payload.date||''),reference:String(payload.reference||record.recordKey),description:String(payload.description||'Cash transfer'),cashIn:isCashIn?amount:0,cashOut:isCashIn?0:amount,status:record.status,source:'Internal cash transfer',record});
        }
        for(const record of vouchers){
          const payload=record.payload||{};
          const status=String(payload.status||record.status);
          movements.push({id:record.id,date:String(payload.date||''),reference:String(payload.voucherNo||record.recordKey),description:String(payload.description||''),cashIn:status==='posted'&&payload.direction==='in'?Number(payload.amount)||0:0,cashOut:status==='posted'&&payload.direction==='out'?Number(payload.amount)||0:0,status,source:'Petty cash voucher',record});
        }
        movements.sort((a,b)=>a.date.localeCompare(b.date)||a.reference.localeCompare(b.reference));
        const ledgerMovements=movements.filter((movement)=>!openingDate||movement.date.slice(0,10)>=openingDate);
        let running=opening??0;
        const allPettyLedgerRows=ledgerMovements.map((movement)=>{
          const affectsBalance=movement.source==='Internal cash transfer'||movement.status==='posted';
          if(affectsBalance)running+=movement.cashIn-movement.cashOut;
          return {id:movement.id,search:[movement.date,movement.reference,movement.description,movement.status,movement.source],cells:[formatDate(movement.date),movement.reference,movement.description,movement.cashIn?formatMoney(movement.cashIn):'—',movement.cashOut?formatMoney(movement.cashOut):'—',(opening===null?'—':formatMoney(running)),<StatusBadge value={movement.status}/>,movement.record?registerRecordActions(movement.source==='Petty cash voucher'?'petty-cash-voucher':'cash-bank-transaction',movement.record):movement.source]};
        });
        const rows=allPettyLedgerRows.filter((row)=>matching(row.search)).reverse();
        const pending=vouchers.filter((record)=>['pending','approved'].includes(String(record.payload.status||record.status))).length;
        const postedPettyMovements=ledgerMovements.filter((movement)=>movement.source==='Internal cash transfer'||movement.status==='posted');
        const totalIn=sumAmounts<typeof postedPettyMovements[number]>(postedPettyMovements,(movement)=>movement.cashIn);
        const totalOut=sumAmounts<typeof postedPettyMovements[number]>(postedPettyMovements,(movement)=>movement.cashOut);
        return (
          <div className="space-y-4">
            <WorkbookNote tone={opening===null?'warning':'info'} title={opening===null?'Petty cash needs an opening balance':'Petty cash register connected'}>
              Only posted vouchers affect the petty-cash ledger. Pending/approved vouchers remain visible in workflow but do not change the running balance. The ledger starts at the saved opening date; earlier movements are excluded from the opening-balance roll-forward. Internal transfers are shared with Cash & Bank and are not treated as an expense by themselves.
            </WorkbookNote>
            <AdminMetricStrip metrics={[
              {id:'petty-opening',label:'Opening balance',value:opening===null?'Not set':formatMoney(opening),context:'Account 1100 · Petty Cash Reserve',icon:<WalletCards size={15}/>},
              {id:'petty-in',label:'Posted cash in',value:formatMoney(totalIn),context:'Posted voucher receipts',icon:<ArrowDown size={15}/>},
              {id:'petty-out',label:'Posted cash out',value:formatMoney(totalOut),context:'Posted voucher expenses',icon:<ArrowUpRight size={15}/>},
              {id:'petty-pending',label:'Pending approval',value:String(pending),context:'Vouchers awaiting approve/post',icon:<ShieldAlert size={15}/>}
            ]}/>
            <FinanceDataTable title="Petty Cash Ledger" description="Voucher movements and internal cash transfers, sorted by date." columns={[{label:'Date'},{label:'Voucher / reference'},{label:'Description'},{label:'Cash in',align:'right'},{label:'Cash out',align:'right'},{label:'Running balance',align:'right'},{label:'Status'},{label:'Actions'}]} rows={rows} emptyMessage="No petty-cash vouchers or transfers are recorded." actions={<div className="flex flex-wrap gap-2">{registerAddButton('petty-cash-voucher','Add voucher')}<Button variant="secondary" type="button" onClick={()=>openRegisterForm('cash-bank-transaction',undefined,{transactionKind:'bank-to-petty-cash',accountCode:'1000',counterpartAccountCode:'1100',direction:'out',description:'Petty cash top-up'})}>Top up from bank</Button><Button variant="secondary" type="button" onClick={()=>openCashOpeningForm('1100')}>{opening===null?'Set opening balance':'Edit opening balance'}</Button></div>}/>
          </div>
        );
      }
      case 'monthly-pnl': {
        const monthInvoices = idrInvoices.filter((invoice) => getMonthKey(getInvoiceDate(invoice)) === selectedMonth);
        const monthExpenses = idrExpenses.filter((expense) => getMonthKey(expense.date) === selectedMonth);
        const revenue = sumAmounts<AgencyInvoice>(monthInvoices, (invoice) => Number(invoice.total) || 0);
        const classTotals: Record<WorkbookExpenseClass, number> = {
          directProjectCost: 0,
          teamReward: 0,
          projectTeamFee: 0,
          operatingExpense: 0,
          unclassified: 0
        };
        for (const expense of monthExpenses) classTotals[classifyWorkbookExpense(expense)] += Number(expense.amount) || 0;
        const classifiedExpense = classTotals.directProjectCost + classTotals.teamReward + classTotals.projectTeamFee + classTotals.operatingExpense;
        const grossProfit = revenue - classTotals.directProjectCost;
        const netPreview = grossProfit - classTotals.teamReward - classTotals.projectTeamFee - classTotals.operatingExpense;
        return (
          <div className="space-y-4">
            <WorkbookNote tone="warning" title="Preliminary P&L mapping">
              Reporting month is filtered by invoice issue date and expense date. AMS expense categories are not yet identical to the workbook's Project Cost / Operating Cost field, so unmapped expenses are shown separately and excluded from the preliminary net figure until the mapping is approved.
            </WorkbookNote>
            <AdminPanel title="Reporting period" bodyClassName="p-4">
              <label className="block text-xs font-medium text-muted">Month
                <input type="month" value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)} className="mt-1.5 block h-9 w-full rounded-control border border-line bg-bg px-3 text-xs text-fg outline-none focus:border-accent sm:max-w-xs" />
              </label>
            </AdminPanel>
            <AdminMetricStrip metrics={[
              { id: 'pnl-revenue', label: 'Invoice value', value: formatMoney(revenue), context: 'Issued invoices in selected month', icon: <FileText size={15} /> },
              { id: 'pnl-direct', label: 'Direct project cost', value: formatMoney(classTotals.directProjectCost), context: 'Based on current category mapping', icon: <Briefcase size={15} /> },
              { id: 'pnl-operating', label: 'Operating expense', value: formatMoney(classTotals.operatingExpense), context: 'Mapped operating costs', icon: <ArrowUpRight size={15} /> },
              { id: 'pnl-net', label: 'Net preview', value: formatMoney(netPreview), context: 'Before unclassified ' + formatMoney(classTotals.unclassified), icon: <CircleDollarSign size={15} /> }
            ]} />
            <FinanceDataTable title="Monthly Profit & Loss" description="Workbook line items; values remain a preview until AMS account classifications and posting rules are approved." columns={[{ label: 'Line item' }, { label: 'Amount', align: 'right' }, { label: 'Basis' }]} rows={[
              { id: 'rev', cells: ['Revenue', formatMoney(revenue), 'Invoice issue date'] },
              { id: 'direct', cells: ['Direct Project Cost', formatMoney(classTotals.directProjectCost), 'Mapped expense records'] },
              { id: 'gross', cells: ['Gross Profit', formatMoney(grossProfit), 'Revenue minus direct project cost'] },
              { id: 'reward', cells: ['Team Reward', formatMoney(classTotals.teamReward), 'Separate from Team Fee'] },
              { id: 'fee', cells: ['Project Team Fee', formatMoney(classTotals.projectTeamFee), 'Separate allocation bucket'] },
              { id: 'opex', cells: ['Operating Expense', formatMoney(classTotals.operatingExpense), 'Mapped operating expenses'] },
              { id: 'unmapped', cells: ['Unclassified Expense', formatMoney(classTotals.unclassified), 'Requires category mapping; excluded from net preview'] },
              { id: 'net', cells: ['Net Profit (preview)', formatMoney(netPreview), 'Gross Profit less mapped reward, fee and operating expense'] }
            ]} emptyMessage="No activity exists for the selected month." />
            <div className="text-xs text-muted">Classified expense total: {formatMoney(classifiedExpense)} · Source records in selected month: {monthExpenses.length} expenses, {monthInvoices.length} invoices.</div>
          </div>
        );
      }
      case 'cash-flow': {
        const monthly = new Map<string, { month: string; inflow: number; outflow: number; count: number }>();
        for (const movement of cashMovements.filter((item) => item.currency === 'IDR')) {
          const month = getMonthKey(movement.date);
          if (!month) continue;
          const item = monthly.get(month) || { month, inflow: 0, outflow: 0, count: 0 };
          item.inflow += movement.cashIn;
          item.outflow += movement.cashOut;
          item.count += 1;
          monthly.set(month, item);
        }
        const rows = [...monthly.values()].sort((a, b) => b.month.localeCompare(a.month)).map((item) => ({
          id: item.month,
          cells: [item.month, formatMoney(item.inflow), formatMoney(item.outflow), formatMoney(item.inflow - item.outflow), item.count]
        }));
        return (
          <div className="space-y-4">
            <WorkbookNote tone="warning" title="Cash-flow movement, not reconciled ending cash">
              Inflows use dated invoice payments; outflows use dated AMS expense records. Opening bank balance, bank account IDs, internal transfers and independent petty-cash balances are not yet linked, so the final column is net movement rather than an authoritative bank ending balance.
            </WorkbookNote>
            <FinanceDataTable title="Monthly Cash Flow" description="The workbook cash-in / cash-out structure, shown in IDR from live AMS transaction sources." columns={[{ label: 'Month' }, { label: 'Total cash in', align: 'right' }, { label: 'Total cash out', align: 'right' }, { label: 'Net cash movement', align: 'right' }, { label: 'Source rows', align: 'right' }]} rows={rows} emptyMessage="No dated receipts or expense movements are available." />
          </div>
        );
      }
      case 'monthly-closing': {
        const records=getRegisterRecords('monthly-closing').filter((record)=>String(record.payload.period||record.periodKey||'')===selectedMonth);
        const locked=getRegisterRecords('monthly-closing-lock').some((record)=>String(record.periodKey||record.payload.period||'')===selectedMonth);
        const closingPurposes: Record<string,string> = {
          'All revenue recorded': 'Confirm all source revenue and client receipts for the selected month are captured.',
          'All expenses recorded': 'Confirm the month’s expense records and supporting evidence are complete.',
          'Cash & bank reconciled': 'Compare cash and bank balances with the available statements and opening balance.',
          'Receivables reviewed': 'Review outstanding client invoices and due dates.',
          'Payables reviewed': 'Review vendor bills, payments, and outstanding obligations.',
          'Project margins reviewed': 'Review contract value, recorded costs, and project margin.',
          'Journal balanced': 'Confirm each journal entry has equal debit and credit totals.',
          'P&L reviewed': 'Review the period profit-and-loss preview and its source coverage.',
          'Cash Flow reviewed': 'Review dated inflows, outflows, and net cash movement.',
          'Balance Sheet reviewed': 'Review opening balances and account readiness; totals remain provisional until reconciled.',
          'Management approval': 'Record management sign-off only after the preceding controls have been reviewed.'
        };
        const rows=WORKBOOK_CLOSING_ITEMS.map((item)=>{
          const record=records.find((candidate)=>String(candidate.payload.checklistItem||'').toLowerCase()===item.label.toLowerCase());
          const state=String(record?.payload.status||record?.status||'Open');
          return {id:item.label,cells:[item.label,item.owner,record?<StatusBadge value={state}/>:<AdminStatusBadge tone="warning">Not recorded</AdminStatusBadge>,closingPurposes[item.label]||'Review and document before the period is closed.',record?registerRecordActions('monthly-closing',record):<Button variant="secondary" type="button" disabled={locked} onClick={()=>openRegisterForm('monthly-closing',undefined,{period:selectedMonth,checklistItem:item.label,status:'Open'})}>Create control</Button>]};
        });
        const completed=WORKBOOK_CLOSING_ITEMS.filter((item)=>records.some((record)=>String(record.payload.checklistItem||'').toLowerCase()===item.label.toLowerCase()&&String(record.payload.status||record.status)==='Done')).length;
        return (
          <div className="space-y-4">
            <WorkbookNote tone={locked?'info':'warning'} title={locked?'Selected period is closed':'Monthly closing requires all workbook control items'}>
              Selected period: {selectedMonth}. {completed} of {WORKBOOK_CLOSING_ITEMS.length} controls are completed and approved. The period-lock endpoint rejects closing until all eleven workbook control items are persisted as Done and posted journals balance.
            </WorkbookNote>
            <AdminPanel title="Closing period" bodyClassName="p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <label className="block max-w-xs flex-1 text-xs font-medium text-muted">Reporting month
                  <input type="month" value={selectedMonth} onChange={(event)=>setSelectedMonth(event.target.value)} className="mt-1.5 block h-9 w-full rounded-control border border-line bg-bg px-3 text-xs text-fg outline-none focus:border-accent" disabled={locked}/>
                </label>
                <div className="flex items-center gap-2">
                  <AdminStatusBadge tone={locked?'success':'warning'}>{locked?'Closed':'Open'}</AdminStatusBadge>
                  <Button type="button" variant="secondary" disabled={locked||completed!==WORKBOOK_CLOSING_ITEMS.length||registerSaving} loading={registerSaving} onClick={()=>void closeWorkbookPeriod()}>Close period</Button>
                </div>
              </div>
            </AdminPanel>
            <FinanceDataTable title="Monthly Closing checklist" description="One persisted row per Excel control item, with assigned PIC, sign-off date and review notes." columns={[{label:'Checklist item'},{label:'Default owner'},{label:'Status'},{label:'Control purpose'},{label:'Actions'}]} rows={rows} emptyMessage="Create the checklist rows before requesting month-end close."/>
          </div>
        );
      }
      case 'project-allocation': {
        const records=getRegisterRecords('project-allocation').filter((record)=>matching([record.payload.projectName,record.projectId,record.status]));
        return (
          <div className="space-y-4">
            <WorkbookNote title="Excel allocation policy">
              Net Project Profit is calculated from contract value less vendor commitment and other obligations. The percentages below follow the Excel policy; project-level amounts are saved through the allocation register rather than inferred from an AMS project budget.
            </WorkbookNote>
            <AdminMetricStrip metrics={[
              {id:'alloc-petty',label:'Petty cash reserve',value:'10%',context:'Of Net Project Profit',icon:<WalletCards size={15}/>},
              {id:'alloc-emergency',label:'Emergency fund',value:'10%',context:'Of Net Project Profit',icon:<ShieldAlert size={15}/>},
              {id:'alloc-reward',label:'Team Reward',value:'10%',context:'Separate from Project Team Fee',icon:<CircleDollarSign size={15}/>},
              {id:'alloc-company',label:'Company operational fund',value:'70%',context:'Remainder after the three standard allocations',icon:<Landmark size={15}/>}
            ]}/>
            <FinanceDataTable title="Project Allocation" description="Amounts are calculated on the server from each saved project's contract and obligation amounts." columns={[{label:'Project'},{label:'Net project profit',align:'right'},{label:'Petty cash reserve',align:'right'},{label:'Emergency fund',align:'right'},{label:'Team Reward',align:'right'},{label:'Company operational fund',align:'right'},{label:'Emergency fund status'},{label:'Actions'}]} rows={records.map((record)=>({id:record.id,cells:[String(record.payload.projectName||record.projectId||'—'),formatMoney(Number(record.payload.netProjectProfit)||0),formatMoney(Number(record.payload.pettyCashReserve ?? record.payload.pettyCash)||0),formatMoney(Number(record.payload.emergencyFund)||0),formatMoney(Number(record.payload.teamReward)||0),formatMoney(Number(record.payload.companyOperationalFund)||0),<StatusBadge value={record.payload.emergencyStatus||record.status}/>,registerRecordActions('project-allocation',record)]}))} emptyMessage="No project allocation has been saved yet. Configure it from the current contract value and project obligations." actions={registerAddButton('project-allocation','Calculate project allocation')}/>
            <FinanceDataTable title="Team Reward distribution" description="Workbook split of the 10% Team Reward allocation." columns={[{label:'Recipient group'},{label:'Percentage of Net Project Profit'},{label:'Share of Team Reward'}]} rows={[
              {id:'sales',cells:['Sales','5%','50%']},
              {id:'vendor',cells:['Vendor / PIC','2.5%','25%']},
              {id:'management',cells:['Management','2.5%','25%']}
            ]}/>
          </div>
        );
      }
      case 'team-fee': {
        const feeRecords=getRegisterRecords('team-fee').filter((record)=>matching([record.payload.projectName,record.projectId,record.payload.memberName,record.payload.role,record.payload.paymentStatus]));
        const feeExpenses=expenses.filter((expense)=>classifyWorkbookExpense(expense)==='projectTeamFee');
        return (
          <div className="space-y-4">
            <WorkbookNote title="Team Fee and Team Reward are separate workbook categories">
              The member-level Team Fee register is persistent and stores project, member, role, fee amount, due date and payment state. Expense records classified as Project Team Fee are shown separately as source costs; they are not automatically assumed to settle a member-level entitlement.
            </WorkbookNote>
            <FinanceDataTable title="Project Team Fee allocation" description="One row per project and team member; status is maintained independently from Team Reward." columns={[{label:'Project'},{label:'Member'},{label:'Role'},{label:'Fee amount',align:'right'},{label:'Due date'},{label:'Payment status'},{label:'Actions'}]} rows={feeRecords.map((record)=>({id:record.id,cells:[String(record.payload.projectName||record.projectId||'—'),String(record.payload.memberName||'—'),String(record.payload.role||'—'),formatMoney(Number(record.payload.feeAmount)||0),formatDate(record.payload.dueDate),<StatusBadge value={record.payload.paymentStatus||record.status}/>,registerRecordActions('team-fee',record)]}))} emptyMessage="No individual Team Fee allocation has been recorded." actions={registerAddButton('team-fee','Add team fee')}/>
            <FinanceDataTable title="Project Team Fee expense sources" description="Actual expense records that are explicitly classified as Project Team Fee." columns={[{label:'Date'},{label:'Project'},{label:'Description'},{label:'Amount',align:'right'},{label:'Record state'}]} rows={feeExpenses.map((expense)=>({id:expense.id,cells:[formatDate(expense.date),projects.find((project)=>project.id===expense.projectId)?.name||expense.projectId||'Not linked',expense.description,formatMoney(Number(expense.amount)||0,String((expense as any).currency||'IDR')),<StatusBadge value={(expense as any).status||'recorded'}/>]}))} emptyMessage="No expense source record is classified as Project Team Fee."/>
          </div>
        );
      }
      case 'balance-sheet': {
        const openings=getRegisterRecords('balance-sheet-opening').filter((record)=>matching([record.payload.accountCode,record.payload.asOfDate,record.payload.notes]));
        const latestByAccount=new Map<string,WorkbookRecord>();
        for(const record of openings.slice().sort((a,b)=>String(a.payload.asOfDate||'').localeCompare(String(b.payload.asOfDate||'')))){
          latestByAccount.set(String(record.payload.accountCode||''),record);
        }
        return (
          <div className="space-y-4">
            <WorkbookNote tone="warning" title="Balance Sheet totals are not yet authoritative">
              Opening balances and account mappings are persisted, but invoice and expense activity is not yet fully posted into the General Journal. Until the full posting bridge and reconciliation are in place, this tab deliberately avoids presenting a fabricated total-assets / liabilities / equity balance.
            </WorkbookNote>
            <FinanceDataTable title="Workbook Balance Sheet account mapping" description="Current source coverage for the Excel account classes." columns={[{label:'Section'},{label:'Account'},{label:'Current source'},{label:'Readiness'}]} rows={[
              {id:'cash',cells:['Assets','Cash & Bank (1000)','Invoice receipts, expenses and cash movements',<AdminStatusBadge tone={getOpeningBalance('1000')===null?'warning':'success'}>{getOpeningBalance('1000')===null?'Opening balance missing':'Opening balance saved'}</AdminStatusBadge>]},
              {id:'petty',cells:['Assets','Petty Cash Reserve (1100)','Dedicated opening and voucher records',<AdminStatusBadge tone={getOpeningBalance('1100')===null?'warning':'success'}>{getOpeningBalance('1100')===null?'Opening balance missing':'Opening balance saved'}</AdminStatusBadge>]},
              {id:'emergency',cells:['Assets','Emergency Fund (1200)','Opening balance and allocation registers',<AdminStatusBadge tone={getOpeningBalance('1200')===null?'warning':'success'}>{getOpeningBalance('1200')===null?'Opening balance missing':'Opening balance saved'}</AdminStatusBadge>]},
              {id:'ar',cells:['Assets','Accounts Receivable (1300)','Derived from the existing invoice balance',<AdminStatusBadge tone="success">Source available</AdminStatusBadge>]},
              {id:'prepayment',cells:['Assets','Project Asset / Prepayment (1400)','Opening balance only; no transaction roll-forward yet',<AdminStatusBadge tone="warning">Posting bridge required</AdminStatusBadge>]},
              {id:'ap',cells:['Liabilities','Accounts Payable (2000)','Dedicated vendor bill and payment records',<AdminStatusBadge tone="success">Source available</AdminStatusBadge>]},
              {id:'capital',cells:['Equity','Owner / Capital (3000)','Opening balance entry',<AdminStatusBadge tone={latestByAccount.has('3000')?'success':'warning'}>{latestByAccount.has('3000')?'Opening balance saved':'Opening balance missing'}</AdminStatusBadge>]},
              {id:'retained',cells:['Equity','Retained Earnings (3100)','Opening balance and period closing journal',<AdminStatusBadge tone={latestByAccount.has('3100')?'success':'warning'}>{latestByAccount.has('3100')?'Opening balance saved':'Journal bridge required'}</AdminStatusBadge>]}
            ]} actions={registerAddButton('balance-sheet-opening','Record opening balance')}/>
            <FinanceDataTable title="Opening balance register" description="Persistent account opening entries. These records alone do not constitute a fully reconciled Balance Sheet." columns={[{label:'As of date'},{label:'Account code'},{label:'Account'},{label:'Balance side'},{label:'Opening amount',align:'right'},{label:'Notes'},{label:'Actions'}]} rows={openings.map((record)=>({id:record.id,cells:[formatDate(record.payload.asOfDate),String(record.payload.accountCode||''),EXCEL_CHART_OF_ACCOUNTS.find((account)=>account.code===String(record.payload.accountCode))?.name||String(record.payload.accountCode||''),String(record.payload.side||''),formatMoney(Number(record.payload.openingAmount)||0),String(record.payload.notes||'—'),registerRecordActions('balance-sheet-opening',record)]}))} emptyMessage="No opening balances have been entered."/>
          </div>
        );
      }
      case 'journal': {
        const allJournalRecords = getRegisterRecords('journal-entry');
        const records = allJournalRecords.filter((record) => matching([record.payload.date,record.payload.reference,record.payload.description,record.payload.projectId,record.status]));
        const plan = buildFinanceSourceJournalDrafts(reportInvoices, expenses as any[], getRegisterRecords('cash-bank-transaction'), getRegisterRecords('vendor-bill'), getRegisterRecords('vendor-bill-payment'));
        const linkedJournal = new Map<string, WorkbookRecord>();
        for (const record of allJournalRecords) {
          const sourceType = String(record.payload.sourceType || '');
          const sourceId = String(record.payload.sourceId || '');
          if (sourceType && sourceId) linkedJournal.set(sourceType + '|' + sourceId, record);
        }
        const journalSources = [
          ...plan.drafts.map((draft) => {
            const source = linkedJournal.get(draft.sourceType + '|' + draft.sourceId);
            const status = source ? (source.status === 'posted' ? 'Posted journal' : 'Draft generated · review required') : 'Ready to generate draft';
            return {
              id: draft.sourceType + ':' + draft.sourceId,
              date: draft.date,
              reference: draft.reference,
              description: draft.description,
              amount: draft.lines.reduce((sum, line) => sum + line.debit, 0),
              source: draft.sourceType,
              status,
              tone: source?.status === 'posted' ? 'success' as const : source ? 'info' as const : 'warning' as const
            };
          }),
          ...plan.skipped.map((item) => ({
            id: 'skipped:' + item.sourceType + ':' + item.sourceId,
            date: item.date,
            reference: item.reference,
            description: item.description,
            amount: item.amount,
            source: item.sourceType,
            status: 'Skipped · ' + item.reason,
            tone: 'warning' as const
          }))
        ].sort((a,b) => String(b.date).localeCompare(String(a.date))).slice(0,50);
        return (
          <div className="space-y-4">
            <WorkbookNote tone="info" title="Source sync creates drafts only">
              Generate source drafts prepares invoice-recognition entries where the tax mapping is supported, client receipts that clear Accounts Receivable, classifiable expense entries, vendor bill payments with a supported account proposal, and posted internal cash transfers. Nothing is approved or posted automatically. Unsupported tax or payment-account mappings stay skipped with a reason; verify each source and its related ledger entry before approval.
            </WorkbookNote>
            {journalSyncSummary && <WorkbookNote tone="info" title="Source journal sync result">{journalSyncSummary}</WorkbookNote>}
            <FinanceDataTable title="General Journal" description="Generated records retain their source reference. Review every draft and supporting document; a different authorized user must approve/post it. Posted entries are immutable." columns={[{label:'Date'},{label:'Reference'},{label:'Description'},{label:'Project'},{label:'Debit total',align:'right'},{label:'Credit total',align:'right'},{label:'Status'},{label:'Actions'}]} rows={records.map((record)=>({id:record.id,cells:[formatDate(record.payload.date),String(record.payload.reference||record.recordKey),String(record.payload.description||''),String(record.payload.projectId||'—'),formatMoney(Number(record.payload.debitTotal)||0),formatMoney(Number(record.payload.creditTotal)||0),<StatusBadge value={record.status}/>,registerRecordActions('journal-entry',record)]}))} emptyMessage="No general journal entries have been saved." actions={<div className="flex flex-wrap items-center gap-2">{registerAddButton('journal-entry','Add journal entry')}<Button variant="secondary" type="button" loading={registerSaving} icon={<RefreshCw size={14}/>} onClick={() => void syncSourceJournalDrafts()}>Generate source drafts</Button></div>}/>
            <FinanceDataTable title="Source transaction posting queue" description="Source rows show the matching journal state or why automatic draft creation was skipped. These rows are not themselves journal entries." columns={[{label:'Date'},{label:'Reference'},{label:'Source'},{label:'Description'},{label:'Amount',align:'right'},{label:'Posting state'}]} rows={journalSources.map((row)=>({id:row.id,cells:[formatDate(row.date),row.reference||'—',row.source,row.description,formatMoney(row.amount),<AdminStatusBadge tone={row.tone}>{row.status}</AdminStatusBadge>]}))} emptyMessage="No eligible or skipped source rows were found."/>
            <FinanceDataTable title="Workbook Chart of Accounts posting map" description="Examples follow the cash-basis treatment in Kapitech Finance Final Automated.xlsx. This is a draft mapping, not an authoritative ledger or bank reconciliation." columns={[{label:'Event'},{label:'Debit'},{label:'Credit'},{label:'Review requirement'}]} rows={[
              {id:'receipt',cells:['Client receipt','1000 · Cash & Bank','4000 · Project Revenue','Match the receipt to the invoice and evidence']},
              {id:'expense',cells:['Expense paid','5100 / 5200 / 5300–5320 / 5400 / 5500 / 5600 · Expense account','1000 / verified 1100 / 1200 · Cash account','Confirm category, payment status and actual payment account']},
              {id:'petty-transfer',cells:['Bank to petty cash','1100 · Petty Cash Reserve','1000 · Cash & Bank','Confirm paired internal-transfer reference']},
              {id:'vendor-payment',cells:['Vendor bill / payment','5100 · Vendor / Direct Project Cost','1000 · Cash & Bank','Not generated by this sync; use linked bill/payment evidence']}
            ]}/>
          </div>
        );
      }
      case 'annual-summary': {
        const yearInvoices = idrInvoices.filter((invoice) => getYearKey(getInvoiceDate(invoice)) === selectedYear);
        const yearExpenses = idrExpenses.filter((expense) => getYearKey(expense.date) === selectedYear);
        const yearCollections = cashMovements.filter((movement) => movement.currency === 'IDR' && getYearKey(movement.date) === selectedYear);
        const yearBilled = sumAmounts<AgencyInvoice>(yearInvoices, (invoice) => Number(invoice.total) || 0);
        const yearCollected = sumAmounts<CashMovement>(yearCollections, (movement) => movement.cashIn);
        const yearOutflow = sumAmounts<CashMovement>(yearCollections, (movement) => movement.cashOut);
        const yearExpense = sumAmounts<AgencyExpense>(yearExpenses, (expense) => Number(expense.amount) || 0);
        const years = Array.from(new Set([
          String(new Date().getFullYear()),
          ...reportInvoices.map((invoice) => getYearKey(getInvoiceDate(invoice))),
          ...expenses.map((expense) => getYearKey(expense.date))
        ].filter((value) => /^\d{4}$/.test(value)))).sort((a, b) => b.localeCompare(a));
        return (
          <div className="space-y-4">
            <AdminPanel title="Reporting year" bodyClassName="p-4">
              <label className="block text-xs font-medium text-muted">Year
                <select value={selectedYear} onChange={(event) => setSelectedYear(event.target.value)} className="mt-1.5 block h-9 w-full rounded-control border border-line bg-bg px-3 text-xs text-fg outline-none focus:border-accent sm:max-w-xs">
                  {years.map((year) => <option key={year} value={year}>{year}</option>)}
                </select>
              </label>
            </AdminPanel>
            <AdminMetricStrip metrics={[
              { id: 'year-billed', label: 'Annual invoice value', value: formatMoney(yearBilled), context: selectedYear + ' · issued invoices', icon: <FileText size={15} /> },
              { id: 'year-collected', label: 'Annual collections', value: formatMoney(yearCollected), context: 'Payments dated in selected year', icon: <ArrowDown size={15} /> },
              { id: 'year-expenses', label: 'Annual recorded expenses', value: formatMoney(yearExpense), context: yearExpenses.length + ' source expense records', icon: <ArrowUpRight size={15} /> },
              { id: 'year-net', label: 'Net cash movement', value: formatMoney(yearCollected - yearOutflow), context: 'Not an accounting net profit', icon: <CircleDollarSign size={15} /> }
            ]} />
            <FinanceDataTable title="Annual summary" description="IDR-only period view; accounting net profit and closing cash depend on ledger posting, opening balances and reconciliation." columns={[{ label: 'Metric' }, { label: 'Amount', align: 'right' }, { label: 'Basis' }]} rows={[
              { id: 'a-revenue', cells: ['Annual Revenue / Invoice Value (IDR)', formatMoney(yearBilled), 'IDR invoice issue date'] },
              { id: 'a-collected', cells: ['Annual Collections', formatMoney(yearCollected), 'Payment date'] },
              { id: 'a-expense', cells: ['Annual Recorded Expenses', formatMoney(yearExpense), 'Expense date'] },
              { id: 'a-outflow', cells: ['Recorded cash outflow', formatMoney(yearOutflow), 'Expense source dates'] },
              { id: 'a-net', cells: ['Net Cash Movement (proxy)', formatMoney(yearCollected - yearOutflow), 'Collections minus recorded outflow'] }
            ]} emptyMessage="No records exist for the selected year." />
          </div>
        );
      }
      default:
        return <WorkbookNote title="Finance worksheet">{tab.description}</WorkbookNote>;
    }
  };

  const financePage = (
    <AdminPageShell featureSlug="excel-aligned-finance-workspace" className="space-y-4">
      <AdminModuleHeader
        slug="finance-workspace-header"
        title="Finance"
        description="Excel-aligned finance workflow · 20 workbook sheets · existing AMS design system"
        actions={
          <>
            <Button variant="secondary" type="button" onClick={openLegacyTransactions} icon={<ArrowUpRight size={14} />}>Open transaction workspace</Button>
            <Button variant="secondary" type="button" onClick={() => void loadData(true)} loading={refreshing} icon={<RefreshCw size={14} />}>Refresh data</Button>
          </>
        }
      />
      <div className="min-[900px]:hidden">
        <AdminSectionTabs ariaLabel="Finance groups" activeKey={activeGroup.key} items={groupItems} />
      </div>
      <AdminSectionTabs ariaLabel="Finance workbook sheets" activeKey={activeTab.key} items={sheetItems} />
      <div className="flex flex-col gap-1 border-b border-line pb-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="text-[11px] font-medium text-muted">Sheet {activeTab.sheet} · {activeGroup.label}</div>
          <h2 className="mt-1 text-base font-semibold text-fg">{activeTab.label}</h2>
          <p className="mt-1 text-xs leading-5 text-muted">{activeTab.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <AdminStatusBadge tone={sourceErrors.length ? 'warning' : loading ? 'info' : 'success'}>
            {loading ? 'Loading sources' : sourceErrors.length ? 'Partial source availability' : 'Connected source views'}
          </AdminStatusBadge>
        </div>
      </div>
      {registerErrors.length > 0 && (
        <WorkbookNote tone="warning" title="Supplementary Finance register warning">
          {registerErrors.length} of {SUPPLEMENTARY_FINANCE_RECORD_TYPES.length} supplementary register requests failed. The service requires the configured PostgreSQL data source; values from unavailable registers are not inferred. {registerErrors[0]}
        </WorkbookNote>
      )}
      {registerActionError && !editor && (
        <WorkbookNote tone="danger" title="Finance action needs attention">{registerActionError}</WorkbookNote>
      )}
      {sourceErrors.length > 0 && (
        <WorkbookNote tone="warning" title="Finance source warning">
          {sourceErrors.join(' · ')}. Check the connected AMS source before interpreting the affected views.
        </WorkbookNote>
      )}
      {loading ? renderLoading() : renderView(activeTab)}
      {renderRegisterEditor()}
      <div className="flex flex-col gap-2 border-t border-line pt-3 text-[11px] leading-5 text-muted sm:flex-row sm:items-center sm:justify-between">
        <span>Source of truth for workflow design: Kapitech Finance Final Automated.xlsx.</span>
        <span className="inline-flex items-center gap-1.5"><CalendarDays size={13} /> Excel-alignment implementation · reports reflect connected AMS records</span>
      </div>
    </AdminPageShell>
  );
  return localizeFinanceValue(financePage, language) as React.ReactElement;
};

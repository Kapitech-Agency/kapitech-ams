import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpRight, Briefcase, ArrowUpDown, CircleDollarSign, Download, FileText, Landmark, Plus, RefreshCw, Search, ShieldAlert, Trash2, WalletCards, X } from 'lucide-react';
import { AdminMetricStrip, AdminModuleHeader, AdminModuleNotice, AdminPageShell, AdminPanel, AdminSectionTabs, AdminStatusBadge, AdminTablePagination } from '../../components/admin/AdminModulePrimitives';
import Button from '../../components/ui/Button';
import { AdminInvoicing } from './AdminInvoicing';
import { AdminVendors } from './AdminVendors';
import { Drawer } from '../../components/ui/Drawer';
import { Modal } from '../../components/ui/Modal';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { CustomDatePicker } from '../../components/ui/CustomDatePicker';
import { formatReportingPeriodLabel, getPreviousReportingPeriodValue, getReportingPeriodRange, type ReportingPeriodComparison } from '../../lib/reportingPeriods';
import { api } from '../../lib/apiClient';
import { normalizeFinanceExpense, normalizeFinanceInvoice } from '../../lib/financeStore';
import type { AgencyExpense, AgencyInvoice } from '../../lib/financeStore';
import type { AgencyProject } from '../../lib/projectStore';
import { VENDOR_EVENT_NAME } from '../../lib/vendorStore';
import type { AgencyVendor, VendorContract } from '../../lib/vendorStore';
import { hasAdminPermission } from '../../lib/adminAuth';
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
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../../lib/LanguageContext';
import type { Language } from '../../lib/LanguageContext';
import { useReportingPeriod } from '../../lib/ReportingPeriodContext';

type Column = { label: string; align?: 'left' | 'right' | 'center'; className?: string };
type TableRow = { id: string; cells: React.ReactNode[] };
type SourceResult = { label: string; data: any; error?: string };
type WorkbookRecord = { id: string; recordType: string; recordKey: string; periodKey?: string; projectId?: string; status: string; payload: Record<string, any>; version: number; createdByUserId?: string; createdAt: string; updatedAt: string };
type FinanceConfirmation = { kind: 'approve' | 'post' | 'archive'; type: string; record: WorkbookRecord } | { kind: 'close-period'; period: string } | { kind: 'discard-editor' | 'discard-vendor-contract' };
type FinanceVendorContractDraft = { vendorId: string; id?: string; title: string; startDate: string; endDate: string; rateType: VendorContract['rateType']; rateAmount: number; currency: VendorContract['currency']; status: VendorContract['status'] };
type RegisterField = { key: string; label: string; type: 'text' | 'number' | 'date' | 'month' | 'select' | 'textarea'; required?: boolean; readOnly?: boolean; options?: string[]; optionSource?: 'vendorBills' | 'accounts' | 'cashAccounts' | 'expenseAccounts' | 'reconciliationAccounts' | 'projects' | 'vendors'; placeholder?: string; help?: string; defaultValue?: string | number; visibleWhen?: { key: string; values: string[] } };
type CashMovement = { id: string; date: string; reference: string; description: string; cashIn: number; cashOut: number; source: string; currency: string; accountCode: string };

const getLocalDateInputValue = (date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const exportFinanceCsv = (filename: string, headers: string[], rows: Array<Array<string | number | boolean | null | undefined>>) => {
  const csv = [headers, ...rows]
    .map((row) => row.map((value) => '"' + String(value ?? '').replace(/"/g, '""') + '"').join(','))
    .join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const FINANCE_UI_COPY: Record<string, string> = {"Annual recorded cash in":"Kas masuk tercatat tahunan","Invoice payments and saved Cash & Bank inflows; excludes petty-cash voucher receipts":"Pembayaran invoice dan kas masuk Kas & Bank tersimpan. Tidak termasuk penerimaan voucher kas kecil.","Recorded cash in minus outflow proxy; cash transfers and petty-cash voucher activity are not a complete consolidated view":"Kas masuk tercatat dikurangi proksi kas keluar. Transfer kas dan aktivitas voucher kas kecil belum membentuk tampilan kas konsolidasi lengkap.","Cash-in/out proxy; petty-cash voucher activity is excluded":"Proksi kas masuk/keluar. Aktivitas voucher kas kecil tidak termasuk.","Inflows include dated invoice payments and saved Cash & Bank entries touching account 1000. Outflows include eligible dated AMS expense records, excluding items identified as petty cash, and saved bank-side adjustments/transfers. Petty-cash vouchers remain in their separate ledger and are not included in this monthly view. Treat the result as net movement, not an authoritative ending cash balance, until opening balances and bank statements are reconciled.":"Kas masuk mencakup pembayaran invoice bertanggal dan entri Kas & Bank tersimpan yang menyentuh akun 1000. Kas keluar mencakup catatan pengeluaran AMS bertanggal yang memenuhi syarat, tidak termasuk pengeluaran yang teridentifikasi sebagai kas kecil, serta penyesuaian atau transfer bank tersimpan. Voucher kas kecil tetap ada di buku kas kecil terpisah dan tidak masuk tampilan bulanan ini. Perlakukan hasilnya sebagai pergerakan bersih, bukan saldo kas akhir yang final, sampai saldo awal dan rekening koran direkonsiliasi.","Recorded cash outflow (proxy)":"Kas keluar tercatat (proksi)","AMS expense dates and saved Cash & Bank movements; excludes petty-cash vouchers":"Tanggal pengeluaran AMS dan pergerakan Kas & Bank tersimpan. Tidak termasuk voucher kas kecil.","Collections minus recorded bank outflow proxy; excludes petty-cash voucher spending":"Penerimaan dikurangi proksi kas keluar bank. Tidak termasuk pengeluaran voucher kas kecil.","Financial access restricted":"Akses finansial terbatas","Your account does not have permission to view Finance data.":"Akun Anda tidak memiliki izin untuk melihat data Finance.","Overview & Control":"Ringkasan & Kontrol","Transactions & Cash":"Transaksi & Kas","Receivables & Payables":"Piutang & Utang","Accounting & Reports":"Akuntansi & Laporan","Executive Summary":"Ringkasan Eksekutif","Dashboard":"Dasbor","Chart of Accounts":"Bagan Akun","Revenue":"Pendapatan","Expenses":"Pengeluaran","Cash & Bank":"Kas & Bank","Cash / Bank Reconciliation":"Rekonsiliasi Kas / Bank","Account to reconcile":"Akun yang direkonsiliasi","Statement / count date":"Tanggal rekening koran / hitung kas","Statement / counted balance (IDR)":"Saldo rekening koran / hitung kas (IDR)","Statement / processor / count reference":"Referensi rekening koran / prosesor / hitung kas","Month-end reconciliation is incomplete":"Rekonsiliasi akhir bulan belum lengkap","Month-end balances are reconciled":"Saldo akhir bulan sudah direkonsiliasi","Reconciled accounts":"Akun yang direkonsiliasi","Reconciliation exceptions":"Pengecualian rekonsiliasi","Statement reconciliation · ":"Rekonsiliasi rekening koran · ","Record evidence":"Catat bukti","Record reconciliation":"Catat rekonsiliasi","Statement / counted balance":"Saldo rekening koran / hitung kas","Evidence reference":"Referensi bukti","Petty Cash":"Kas Kecil","Accounts Receivable":"Piutang usaha","Accounts Payable":"Utang usaha","Team Fee":"Honor Tim","Operational Budget":"Anggaran Operasional","Project Allocation":"Alokasi Proyek","Monthly P&L":"Laba Rugi Bulanan","Cash Flow":"Arus Kas","Monthly Closing":"Penutupan Bulanan","Balance Sheet":"Neraca","Journal":"Jurnal","Annual Summary":"Ringkasan Tahunan","Company-wide financial summary and allocation overview.":"Ringkasan keuangan perusahaan dan gambaran alokasi.","Manage revenue, expenses, cash, receivables, payables, and financial reporting in one place.":"Kelola pendapatan, pengeluaran, kas, piutang, utang, dan laporan keuangan dalam satu tempat.","Operational finance KPIs and recent monthly movement.":"KPI keuangan operasional dan pergerakan bulanan terbaru.","Master account codes and normal balances from the workbook.":"Kode akun utama dan saldo normal dari workbook.","Revenue register sourced from issued client invoices.":"Daftar pendapatan yang bersumber dari invoice klien yang diterbitkan.","Expense register sourced from finance expenses in AMS.":"Daftar pengeluaran yang bersumber dari data pengeluaran AMS.","Cash movement view built from recorded receipts and expenses.":"Tampilan pergerakan kas dari penerimaan dan pengeluaran yang tercatat.","Petty-cash register and controls required by the workbook.":"Daftar kas kecil dan kontrol yang dibutuhkan workbook.","Invoice balances, due dates and payment status.":"Saldo invoice, tanggal jatuh tempo, dan status pembayaran.","Vendor obligations and the bill records still required.":"Kewajiban vendor dan catatan tagihan yang diperlukan.","Vendor directory, contracts, rates and payment references.":"Direktori vendor, kontrak, tarif, dan referensi pembayaran.","Project team-fee allocation, kept separate from Team Reward.":"Alokasi honor tim proyek, terpisah dari Team Reward.","Project-level budget, invoicing, receipts and recorded costs.":"Anggaran, invoice, penerimaan, dan biaya tercatat pada tingkat proyek.","Budget-versus-actual controls and variance review.":"Kontrol anggaran terhadap realisasi dan tinjauan selisih.","The workbook allocation policy for net project profit.":"Kebijakan alokasi workbook untuk laba bersih proyek.","Monthly profit-and-loss view based on the workbook structure.":"Tampilan laba rugi bulanan berdasarkan struktur workbook.","Monthly cash inflow, outflow and net movement.":"Arus kas masuk, keluar, dan pergerakan bersih bulanan.","Month-end checklist and reconciliation controls.":"Daftar periksa akhir bulan dan kontrol rekonsiliasi.","Company-wide assets, liabilities and equity readiness.":"Kesiapan aset, liabilitas, dan ekuitas perusahaan.","Double-entry mapping and source transactions awaiting posting.":"Pemetaan pembukuan berpasangan dan transaksi sumber yang menunggu posting.","Company-wide annual finance summary.":"Ringkasan keuangan tahunan perusahaan.","":"Ruang kerja Finance mengikuti 20 sheet dalam Kapitech Finance Final Automated.xlsx.","Open transaction workspace":"Buka ruang transaksi","Refresh data":"Muat ulang data","Loading sources":"Memuat sumber data","Partial source availability":"Sebagian sumber tidak tersedia","Connected source views":"Tampilan sumber terhubung","Finance groups":"Kelompok keuangan","Finance workbook sheets":"Sheet workbook keuangan","Loading finance sources":"Memuat sumber data keuangan","Reading live AMS invoice, expense, project and vendor records.":"Membaca data invoice, pengeluaran, proyek, dan vendor AMS.","Recent transaction activity":"Aktivitas transaksi terbaru","Selected-month activity":"Aktivitas bulan terpilih","Selected-period dashboard":"Dasbor periode terpilih","Recorded cash movement and invoice activity for ":"Pergerakan kas tercatat dan aktivitas invoice untuk ","Selected-period transaction activity":"Aktivitas transaksi periode terpilih","No recorded movements exist for the selected reporting period.":"Tidak ada pergerakan tercatat pada periode pelaporan yang dipilih.","Annual summary · ":"Ringkasan tahunan · ","Full-year results follow the reporting year selected in the topbar.":"Hasil setahun penuh mengikuti tahun pelaporan yang dipilih di bilah atas.","Reporting month":"Bulan pelaporan","Closing month":"Bulan penutupan","Selected closing month is closed":"Bulan penutupan yang dipilih sudah ditutup","Closing month: ":"Bulan penutupan: ","Invoice value issued":"Nilai invoice yang diterbitkan","Cash movement in / out":"Pergerakan kas masuk / keluar","Some finance sources are unavailable":"Beberapa sumber keuangan tidak tersedia","KPI values only reflect source records that loaded successfully. Refresh after the connection is restored.":"Nilai KPI hanya mencerminkan data sumber yang berhasil dimuat. Muat ulang setelah koneksi pulih.","Recent invoice register":"Daftar invoice terbaru","Finance at a glance":"Ringkasan keuangan","Latest issued invoices with current outstanding balances.":"Invoice terbaru beserta saldo terutang saat ini.","Recent invoice records. Use the workbook sheet tabs above to continue into the detailed finance flow.":"Catatan invoice terbaru. Gunakan tab sheet workbook di atas untuk melihat alur keuangan secara terperinci.","No issued invoices were returned by AMS.":"AMS tidak mengembalikan invoice yang diterbitkan.","Workbook flow":"Alur workbook","Transactions":"Transaksi","Invoice and expense records loaded":"Data invoice dan pengeluaran dimuat","Project records":"Data proyek","Vendor records":"Data vendor","Search invoice, client or project":"Cari invoice, klien, atau proyek","Search invoices…":"Cari invoice…","Manage invoices":"Kelola invoice","Manage expenses":"Kelola pengeluaran","Account code":"Kode akun","Account name":"Nama akun","Account type":"Jenis akun","Normal balance":"Saldo normal","Description":"Deskripsi","Date":"Tanggal","Reference":"Referensi","Transaction date":"Tanggal transaksi","Movement type":"Jenis pergerakan","Movement direction":"Arah pergerakan","Cash account":"Akun kas","Counterpart account":"Akun lawan","Opening balance":"Saldo awal","Opening balance (IDR)":"Saldo awal (IDR)","Opening date":"Tanggal saldo awal","Reporting period":"Periode pelaporan","Reporting year":"Tahun pelaporan","Search":"Cari","Search this worksheet...":"Cari di sheet ini...","Search this worksheet":"Cari di sheet ini","Clear worksheet search":"Hapus pencarian sheet","Category":"Kategori","Project":"Proyek","Client":"Klien","Actions":"Tindakan","Amount":"Jumlah","Amount (IDR)":"Jumlah (IDR)","Bill amount":"Jumlah tagihan","Payment amount":"Jumlah pembayaran","Bill number":"Nomor tagihan","Bill date":"Tanggal tagihan","Due date":"Tanggal jatuh tempo","Payment date":"Tanggal pembayaran","Payment method":"Metode pembayaran","Payment reference":"Referensi pembayaran","Vendor / freelancer":"Vendor / freelancer","Vendor bill":"Tagihan vendor","Scheduled payment":"Pembayaran terjadwal","Budget not set":"Anggaran belum diatur","Set budget":"Atur anggaran","Add budget line":"Tambah baris anggaran","Project Finance Setup":"Pengaturan keuangan proyek","Project name / Excel key":"Nama proyek / kunci Excel","Contract value (IDR)":"Nilai kontrak (IDR)","Vendor commitment (IDR)":"Komitmen vendor (IDR)","Other obligations (IDR)":"Kewajiban lain (IDR)","Project status":"Status proyek","Start date":"Tanggal mulai","End date":"Tanggal selesai","Project Team Fee":"Honor Tim Proyek","Team member":"Anggota tim","Fee amount (IDR)":"Jumlah honor (IDR)","Payment status":"Status pembayaran","General Journal Entry":"Entri Jurnal Umum","Journal date":"Tanggal jurnal","Debit account":"Akun debit","Credit account":"Akun kredit","Cancel":"Batal","Save changes":"Simpan perubahan","Save record":"Simpan catatan","Saving…":"Menyimpan…","Add journal entry":"Tambah entri jurnal","Generate source drafts":"Buat draf dari sumber","Create control":"Buat kontrol","Close period":"Tutup periode","Not recorded":"Belum tercatat","Not set":"Belum diatur","Not available":"Tidak tersedia","Open":"Terbuka","Closed":"Ditutup","Paid":"Lunas","Unpaid":"Belum dibayar","Partially Paid":"Dibayar sebagian","Overpaid":"Kelebihan bayar","Active":"Aktif","Completed":"Selesai","Cancelled":"Dibatalkan","Pending":"Menunggu","Approved":"Disetujui","Posted":"Dibukukan","Draft":"Draf","In Progress":"Sedang berlangsung","Kas dan rekening bank":"Cash and bank accounts","Kas kecil/reserve":"Petty cash reserve","Dana darurat":"Emergency fund","Piutang pelanggan":"Customer receivables","Hutang vendor/freelancer":"Vendor/freelancer payables","Modal":"Capital","Laba ditahan":"Retained earnings","Pendapatan project":"Project revenue","Fee vendor/freelancer":"Vendor/freelancer fees","Kewajiban project lain":"Other project obligations","Reward sales":"Sales reward","Reward vendor/PIC":"Vendor/PIC reward","Reward management":"Management reward","Fee tim project":"Project team fee","Biaya bank/admin":"Bank/administration fees","Biaya operasional perusahaan":"Company operating expenses","Overview":"Ringkasan","Control":"Kontrol","Sheet":"Lembar","Finance sections":"Bagian keuangan","Source available":"Sumber tersedia","IDR-only period view; accounting net profit and closing cash depend on ledger posting, opening balances and reconciliation.":"Tampilan periode khusus IDR. Laba bersih akuntansi dan saldo kas akhir bergantung pada posting buku besar, saldo awal, dan rekonsiliasi.","Accounts receivable":"Piutang usaha","Accounts payable":"Utang usaha","Account mapping":"Pemetaan akun","Cash transfer":"Transfer kas","Invoice payment":"Pembayaran invoice","Expense record":"Catatan pengeluaran","Opening balance saved":"Saldo awal disimpan","Opening balance missing":"Saldo awal belum tersedia","No vendor bills available":"Tidak ada tagihan vendor","No vendor bills have been entered. Create a bill in Accounts Payable to generate the 30% / 20% / 50% schedule.":"Belum ada tagihan vendor. Buat tagihan di Utang Usaha untuk membuat jadwal 30% / 20% / 50%.","No vendor bills have been recorded yet.":"Belum ada tagihan vendor yang tercatat.","No vendor contracts are available in AMS.":"Tidak ada kontrak vendor yang tersedia di AMS.","No opening balances have been entered.":"Belum ada saldo awal yang dimasukkan.","No chart-of-account rows match the current search.":"Tidak ada akun yang cocok dengan pencarian.","No dated cash movement is available. Set an opening balance or record a movement.":"Tidak ada pergerakan kas bertanggal. Atur saldo awal atau catat pergerakan kas.","No expense source record is classified as Project Team Fee.":"Tidak ada catatan pengeluaran yang diklasifikasikan sebagai Honor Tim Proyek.","No individual Team Fee allocation has been recorded.":"Belum ada alokasi Honor Tim yang tercatat.","No project allocation has been saved yet. Configure it from the current contract value and project obligations.":"Belum ada alokasi proyek yang disimpan. Atur menggunakan nilai kontrak dan kewajiban proyek saat ini.","No records exist for the selected year.":"Tidak ada catatan untuk tahun yang dipilih.","No eligible or skipped source rows were found.":"Tidak ditemukan baris sumber yang memenuhi syarat atau dilewati.","No general journal entries have been saved.":"Belum ada entri jurnal umum yang disimpan.","No petty-cash vouchers or transfers are recorded.":"Belum ada voucher kas kecil atau transfer yang tercatat.","No outstanding invoice balances were returned by the current AMS invoice source.":"Sumber invoice AMS saat ini tidak mengembalikan saldo terutang.","No issued invoice data is available for the selected search.":"Tidak ada data invoice terbit untuk pencarian ini.","No expense records match the selected search.":"Tidak ada catatan pengeluaran yang cocok dengan pencarian.","No vendor records were returned by AMS.":"AMS tidak mengembalikan catatan vendor.","No recorded payment or expense activity is available from the connected AMS sources.":"Tidak ada aktivitas pembayaran atau pengeluaran dari sumber AMS yang terhubung.","No AMS projects were returned. A named project record can still be created from the workbook register.":"AMS tidak mengembalikan proyek. Catatan proyek tetap dapat dibuat dari daftar workbook.","No activity exists for the selected month.":"Tidak ada aktivitas pada bulan yang dipilih.","No budget lines or dated expense records exist for the current search.":"Tidak ada baris anggaran atau catatan pengeluaran bertanggal untuk pencarian ini.","No dated receipts or expense movements are available.":"Tidak ada penerimaan bertanggal atau pergerakan pengeluaran yang tersedia.","The Finance record could not be saved.":"Catatan Finance tidak dapat disimpan.","The approval could not be completed.":"Persetujuan tidak dapat diselesaikan.","The period could not be closed.":"Periode tidak dapat ditutup.","Source did not return a successful response.":"Sumber tidak mengembalikan respons berhasil.","Source is not available.":"Sumber tidak tersedia.","Source journal drafts could not be generated.":"Draf jurnal sumber tidak dapat dibuat.","Revenue is calculated from issued invoices. Collections remain linked to their invoice payment records.":"Pendapatan dihitung dari invoice yang diterbitkan. Penerimaan tetap terhubung ke catatan pembayaran invoice.","Transactions stay connected to their AMS source record; manual transfer/adjustment entries use the supplementary workbook register.":"Transaksi tetap terhubung ke catatan sumber AMS. Entri transfer atau penyesuaian manual menggunakan daftar tambahan workbook.","Existing AMS contracts are shown as commitments; a contract alone is not treated as a payable bill.":"Kontrak AMS ditampilkan sebagai komitmen. Kontrak saja tidak dianggap sebagai tagihan utang.","Existing AMS expenses are the source for recorded costs. Unmapped categories should be resolved before final workbook-style P&L posting.":"Pengeluaran AMS yang tercatat menjadi sumber biaya. Kategori yang belum dipetakan harus diselesaikan sebelum posting Laba Rugi mengikuti workbook.","Current source coverage for the Excel account classes.":"Cakupan sumber saat ini untuk kelompok akun Excel.","Balance Sheet totals are not yet authoritative":"Total Neraca belum menjadi nilai final","Cash ledger is connected to its opening balance":"Buku kas terhubung ke saldo awal","Cash ledger needs its opening balance":"Buku kas memerlukan saldo awal","Opening balance is stored separately from cash movements and is not counted as period cash-in.":"Saldo awal disimpan terpisah dari pergerakan kas dan tidak dihitung sebagai kas masuk periode.","Opening balance register":"Daftar saldo awal","Opening balance entry":"Entri saldo awal","Opening balance and allocation registers":"Daftar saldo awal dan alokasi","Opening balance and period closing journal":"Saldo awal dan jurnal penutupan periode","Opening balances are auditable records. The company balance sheet remains marked preliminary until its full journal and ledger sources are reconciled.":"Saldo awal merupakan catatan yang dapat diaudit. Neraca perusahaan tetap berstatus sementara sampai sumber jurnal dan buku besar lengkap direkonsiliasi.","Persistent account opening entries. These records alone do not constitute a fully reconciled Balance Sheet.":"Entri saldo awal akun yang tersimpan. Catatan ini saja belum membentuk Neraca yang telah direkonsiliasi.","Persistent workbook register":"Daftar workbook tersimpan","Dedicated opening and voucher records":"Catatan saldo awal dan voucher khusus","Dedicated vendor bill and payment records":"Catatan khusus tagihan dan pembayaran vendor","Examples follow the cash-basis treatment in Kapitech Finance Final Automated.xlsx. This is a draft mapping, not an authoritative ledger or bank reconciliation.":"Contoh mengikuti metode basis kas pada Kapitech Finance Final Automated.xlsx. Ini pemetaan draf, bukan buku besar final atau rekonsiliasi bank.","Opening balance only; no transaction roll-forward yet":"Hanya saldo awal. Belum ada perhitungan lanjutan transaksi.","Not generated by this sync; use linked bill/payment evidence":"Tidak dibuat oleh sinkronisasi ini. Gunakan bukti tagihan/pembayaran yang terhubung.","Not an accounting net profit":"Bukan laba bersih akuntansi","Not linked":"Tidak tertaut","Not linked to an AMS project":"Tidak tertaut ke proyek AMS","Not linked to an AMS vendor":"Tidak tertaut ke vendor AMS","Not specified":"Belum ditentukan","Not allocated":"Belum dialokasikan","Open invoices":"Invoice terbuka","Open vendor directory":"Buka direktori vendor","Post cash movement":"Posting pergerakan kas","Record payment":"Catat pembayaran","Record opening balance":"Catat saldo awal","Record management sign-off only after the preceding controls have been reviewed.":"Catat persetujuan manajemen setelah kontrol sebelumnya ditinjau.","Readiness":"Kesiapan","Receipt / approval notes":"Catatan penerimaan / persetujuan","Record state":"Status catatan","Review requirement":"Persyaratan tinjauan","Record Vendor Payment":"Catat Pembayaran Vendor","Search expense records":"Cari catatan pengeluaran","Search revenue records":"Cari catatan pendapatan","Search expenses…":"Cari pengeluaran…","Selected period is closed":"Periode yang dipilih sudah ditutup","Separate allocation bucket":"Kelompok alokasi terpisah","Separate from Project Team Fee":"Terpisah dari Honor Tim Proyek","Separate from Team Fee":"Terpisah dari Honor Tim","Select a cash account":"Pilih akun kas","Select a vendor bill":"Pilih tagihan vendor","Select an account":"Pilih akun","Select an option":"Pilih opsi","Skipped ·":"Dilewati ·","Ready to generate draft":"Siap membuat draf","Posted journal":"Jurnal dibukukan","Draft generated · review required":"Draf dibuat · perlu ditinjau","Source sync creates drafts only":"Sinkronisasi sumber hanya membuat draf","Source transaction posting queue":"Antrean posting transaksi sumber","Source rows show the matching journal state or why automatic draft creation was skipped. These rows are not themselves journal entries.":"Baris sumber menunjukkan status jurnal yang cocok atau alasan pembuatan draf otomatis dilewati. Baris ini bukan entri jurnal.","Generated records retain their source reference. Review every draft and supporting document; a different authorized user must approve/post it. Posted entries are immutable.":"Catatan yang dibuat mempertahankan referensi sumber. Tinjau setiap draf beserta dokumen pendukung. Pengguna berwenang yang berbeda harus menyetujui dan membukukannya. Entri yang sudah dibukukan tidak dapat diubah.","Vendor bills and linked payments determine payable balances":"Saldo utang ditentukan oleh tagihan vendor dan pembayaran yang tertaut.","Vendor contracts describe commitments. Accounts Payable is now kept in a separate persistent register; each bill can carry its own due date and payment schedule. Linked expenses remain source records and are not silently converted into bills.":"Kontrak vendor menjelaskan komitmen. Utang Usaha disimpan pada daftar tersendiri, dengan tanggal jatuh tempo dan jadwal pembayaran tiap tagihan. Pengeluaran tertaut tetap menjadi catatan sumber dan tidak otomatis diubah menjadi tagihan.","Amounts and paid amounts are derived from each persisted bill and its linked payments. Unassigned legacy payments are allocated FIFO; each payment schedule uses the saved bill due date. Separate due dates per installment are not recorded.":"Nilai tagihan dan pembayaran dihitung dari tagihan tersimpan serta pembayaran yang tertaut. Pembayaran lama tanpa penanda dialokasikan FIFO. Tanggal jatuh tempo tagihan tetap menjadi acuan karena workbook tidak menyediakan tanggal terpisah per cicilan.","Variance is budget less expense actual for the same calendar month and expense category.":"Selisih adalah anggaran dikurangi realisasi pengeluaran untuk bulan kalender dan kategori yang sama.","Monthly cash-in, cash-out, and net movement calculated from live AMS transaction sources.":"Kas masuk, kas keluar, dan pergerakan bersih bulanan dihitung dari sumber transaksi AMS.","The report uses invoice issue dates and expense dates. Expense categories that are not mapped to project or operating costs remain separate and are excluded from the preliminary net figure until reviewed.":"Laporan menggunakan tanggal penerbitan invoice dan tanggal pengeluaran. Kategori yang belum dipetakan ke biaya proyek atau operasional tetap terpisah dan tidak masuk perhitungan laba bersih sementara hingga ditinjau.","On Hold":"Ditahan","Direct project cost":"Biaya langsung proyek","Direct Project Cost":"Biaya Langsung Proyek","Gross Profit":"Laba Kotor","Net preview":"Pratinjau Laba Bersih","Net project profit":"Laba Bersih Proyek","Net cash movement":"Pergerakan Kas Bersih","Operating expense":"Biaya operasional","Unclassified Expense":"Pengeluaran Belum Diklasifikasikan","Annual Revenue / Invoice Value (IDR)":"Pendapatan Tahunan / Nilai Invoice (IDR)","Annual Collections":"Penerimaan Tahunan","Annual Recorded Expenses":"Pengeluaran Tahunan Tercatat","Recorded cash outflow":"Arus kas keluar tercatat","Monthly Cash Flow":"Arus Kas Bulanan","Monthly Profit & Loss":"Laba Rugi Bulanan","Monthly Closing checklist":"Daftar periksa penutupan bulanan","Workbook Balance Sheet account mapping":"Pemetaan akun Neraca workbook","Workbook Chart of Accounts posting map":"Pemetaan posting Bagan Akun workbook","Finance source warning":"Peringatan sumber Finance","Supplementary Finance register warning":"Peringatan daftar tambahan Finance","Finance action needs attention":"Tindakan Finance memerlukan perhatian","Source journal sync result":"Hasil sinkronisasi jurnal sumber","Month":"Bulan","Year":"Tahun","Invoice no.":"Nomor invoice","Invoice value":"Nilai invoice","Outstanding":"Terutang","Billed":"Ditagihkan","Collected":"Diterima","Paid amount":"Jumlah dibayar","Next payment":"Pembayaran berikutnya","Default owner":"Penanggung jawab default","Control purpose":"Tujuan kontrol","Petty cash needs an opening balance":"Kas kecil memerlukan saldo awal","Petty cash register connected":"Daftar kas kecil terhubung","Voucher movements and internal cash transfers, sorted by date.":"Pergerakan voucher dan transfer kas internal, diurutkan berdasarkan tanggal.","Only posted vouchers affect the petty-cash ledger. Pending/approved vouchers remain visible in workflow but do not change the running balance. The ledger starts at the saved opening date; earlier movements are excluded from the opening-balance roll-forward. Internal transfers are shared with Cash & Bank and are not treated as an expense by themselves.":"Hanya voucher yang dibukukan yang memengaruhi buku kas kecil. Voucher menunggu/disetujui tetap terlihat dalam alur, tetapi tidak mengubah saldo berjalan. Buku dimulai pada tanggal saldo awal tersimpan. Pergerakan sebelumnya tidak masuk perhitungan saldo awal. Transfer internal juga tercatat di Kas & Bank dan bukan pengeluaran tersendiri.","Monthly closing requires all control items":"Penutupan bulanan memerlukan seluruh item kontrol.","Selected period:":"Periode yang dipilih:","controls are completed and approved.":"kontrol telah selesai dan disetujui.","The entry is saved as Draft and requires a different authorized user to post it. Total debit and credit must balance before it can be saved.":"Entri disimpan sebagai Draf dan harus dibukukan oleh pengguna berwenang yang berbeda. Total debit dan kredit harus seimbang sebelum disimpan.","Budget lines are stored by month, category and PIC. Actual costs remain sourced from expense records; the table does not insert zero-value placeholder budget rows.":"Baris anggaran disimpan berdasarkan bulan, kategori, dan PIC. Biaya realisasi tetap bersumber dari catatan pengeluaran. Tabel tidak membuat baris anggaran kosong bernilai nol.","Opening + in − out; un-reconciled":"Saldo awal + masuk − keluar; belum direkonsiliasi","Set opening balance":"Atur saldo awal","Add voucher":"Tambah voucher","Top up from bank":"Isi kas dari bank","Add project finance record":"Tambah catatan keuangan proyek","Calculate project allocation":"Hitung alokasi proyek","Add team fee":"Tambah honor tim","Add vendor bill":"Tambah tagihan vendor","Add movement":"Tambah pergerakan","Add account":"Tambah akun","Add record":"Tambah catatan","1000 / verified 1100 / 1200 · Cash account":"1000 / 1100 / 1200 terverifikasi · Akun kas","1000 · Cash & Bank":"1000 · Kas & Bank","1100 · Petty Cash Reserve":"1100 · Cadangan Kas Kecil","1200 · Emergency Fund":"1200 · Dana Darurat","4000 · Project Revenue":"4000 · Pendapatan Proyek","5100 / 5200 / 5300–5320 / 5400 / 5500 / 5600 · Expense account":"5100 / 5200 / 5300–5320 / 5400 / 5500 / 5600 · Akun Pengeluaran","5100 · Vendor / Direct Project Cost":"5100 · Vendor / Biaya Langsung Proyek","Account 1000 · Cash & Bank":"Akun 1000 · Kas & Bank","Account 1100 · Petty Cash Reserve":"Akun 1100 · Cadangan Kas Kecil","Accounts Payable (2000)":"Utang Usaha (2000)","Accounts Receivable (1300)":"Piutang Usaha (1300)","A balanced double-entry is required. This form creates a two-line journal; complex entries need an extended line editor.":"Entri berpasangan yang seimbang diperlukan. Formulir ini membuat jurnal dua baris. Entri kompleks memerlukan editor baris lanjutan.","AMS project (optional)":"Proyek AMS (opsional)","AMS vendor (optional)":"Vendor AMS (opsional)","Add an account using the workbook account-code, account-type and normal-balance structure.":"Tambahkan akun sesuai struktur kode akun, jenis akun, dan saldo normal pada workbook.","All expenses recorded":"Semua pengeluaran tercatat","All revenue recorded":"Semua pendapatan tercatat","Allocation amounts are calculated server-side using the workbook percentages and the net project profit base.":"Jumlah alokasi dihitung di server menggunakan persentase workbook dan dasar laba bersih proyek.","Amounts are calculated on the server from each saved project's contract and obligation amounts.":"Jumlah dihitung di server berdasarkan nilai kontrak dan kewajiban proyek yang tersimpan.","Annual collections":"Penerimaan tahunan","Annual invoice value":"Nilai invoice tahunan","Annual recorded expenses":"Pengeluaran tahunan tercatat","Annual summary":"Ringkasan tahunan","As of date":"Per tanggal","Balance Sheet reviewed":"Neraca ditinjau","Balance side":"Posisi saldo","Based on current category mapping":"Berdasarkan pemetaan kategori saat ini","Before unclassified":"Sebelum pengeluaran yang belum diklasifikasikan","Bill no.":"Nomor tagihan","Bill state and outstanding values are calculated from payment records linked to the bill.":"Status tagihan dan nilai terutang dihitung dari catatan pembayaran yang terhubung ke tagihan.","Budget amount (IDR)":"Jumlah anggaran (IDR)","Budget is maintained by month and category. Actual is calculated from recorded expenses.":"Anggaran dikelola berdasarkan bulan dan kategori. Realisasi dihitung dari pengeluaran yang tercatat.","Cash & Bank (1000)":"Kas & Bank (1000)","Cash & Bank Movement":"Pergerakan Kas & Bank","Cash & Bank Opening Balance":"Saldo Awal Kas & Bank","Cash & Bank ledger":"Buku Kas & Bank","Cash & bank reconciled":"Kas & bank direkonsiliasi","Cash Flow reviewed":"Arus kas ditinjau","Cash in":"Kas masuk","Cash movement":"Pergerakan kas","Cash out":"Kas keluar","Cash-flow movement, not reconciled ending cash":"Pergerakan kas, bukan saldo kas akhir yang telah direkonsiliasi","Checklist item":"Item daftar periksa","Choose a month to inspect the same invoice and expense sources used throughout this workspace.":"Pilih bulan untuk memeriksa sumber invoice dan pengeluaran yang digunakan di ruang kerja ini.","Client not set":"Klien belum diatur","Client payment ·":"Pembayaran klien ·","Closing period":"Periode penutupan","Collections minus recorded outflow":"Penerimaan dikurangi arus keluar tercatat","Company operational fund":"Dana operasional perusahaan","Compare cash and bank balances with the available statements and opening balance.":"Bandingkan saldo kas dan bank dengan rekening koran yang tersedia dan saldo awal.","Confirm all source revenue and client receipts for the selected month are captured.":"Pastikan seluruh pendapatan sumber dan penerimaan klien untuk bulan yang dipilih telah dicatat.","Confirm category, payment status and actual payment account":"Pastikan kategori, status pembayaran, dan akun pembayaran sebenarnya","Confirm each journal entry has equal debit and credit totals.":"Pastikan setiap entri jurnal memiliki total debit dan kredit yang sama.","Confirm paired internal-transfer reference":"Pastikan referensi transfer internal berpasangan.","Confirm the month’s expense records and supporting evidence are complete.":"Pastikan catatan pengeluaran bulan tersebut beserta bukti pendukungnya lengkap.","Contract rate/value":"Tarif/nilai kontrak","Contract value":"Nilai kontrak","Create the checklist rows before requesting month-end close.":"Buat semua baris daftar periksa sebelum meminta penutupan akhir bulan.","Create the payable record before recording its 30% / 20% / 50% payment instalments.":"Buat catatan utang sebelum mencatat cicilan pembayaran 30% / 20% / 50%.","Credit total":"Total kredit","Current source":"Sumber saat ini","Dated movements in loaded source records":"Pergerakan bertanggal dalam catatan sumber yang dimuat","Debit total":"Total debit","Derived from IDR invoice balances":"Dihitung dari saldo invoice IDR","Derived from invoice payments and expenses, plus explicitly recorded bank adjustments and internal cash transfers. This is not an imported bank statement.":"Dihitung dari pembayaran invoice dan pengeluaran, serta penyesuaian bank dan transfer kas internal yang tercatat. Data ini bukan rekening koran yang diimpor.","Derived from the existing invoice balance":"Dihitung dari saldo invoice yang ada","Edit opening balance":"Ubah saldo awal","Emergency Fund (1200)":"Dana Darurat (1200)","Emergency fund":"Dana darurat","Emergency fund (%)":"Dana darurat (%)","Emergency fund status":"Status dana darurat","Excel allocation policy":"Kebijakan alokasi Excel","Excel project finance register":"Daftar keuangan proyek Excel","Expense date":"Tanggal pengeluaran","Expense register":"Daftar pengeluaran","Expense rows":"Baris pengeluaran","Expense source dates":"Tanggal sumber pengeluaran","Fee amount":"Jumlah honor","Finance worksheet":"Lembar kerja Finance","From / active account":"Dari / akun aktif","General Journal":"Jurnal Umum","Gross Profit less mapped reward, fee and operating expense":"Laba Kotor dikurangi reward, honor, dan biaya operasional yang telah dipetakan.","IDR expense records returned by AMS":"Catatan pengeluaran IDR yang dikembalikan AMS","IDR invoice issue date":"Tanggal penerbitan invoice IDR","IDR issued invoices; non-IDR invoices remain visible in transaction registers":"Invoice terbit IDR. Invoice non-IDR tetap terlihat dalam daftar transaksi.","IDR outstanding":"Saldo terutang IDR","Internal cash transfer":"Transfer kas internal","Internal transfer":"Transfer internal","Invoice amount":"Jumlah invoice","Invoice date":"Tanggal invoice","Invoice issue date":"Tanggal penerbitan invoice","Invoice receipts, expenses and cash movements":"Penerimaan invoice, pengeluaran, dan pergerakan kas","Issue date":"Tanggal terbit","Issued invoices in selected month":"Invoice yang diterbitkan pada bulan terpilih","Journal balanced":"Jurnal seimbang","Journal bridge required":"Integrasi jurnal diperlukan","Leave blank to generate automatically":"Kosongkan untuk membuat otomatis","Line item":"Pos","Link the payment to a vendor bill and, where known, its 30% / 20% / 50% installment. Unassigned payments are allocated FIFO.":"Tautkan pembayaran ke tagihan vendor dan, jika diketahui, cicilan 30% / 20% / 50%. Pembayaran tanpa penanda dialokasikan FIFO.","Linked expense records":"Catatan pengeluaran tertaut","Management approval":"Persetujuan manajemen","Manual bank adjustment":"Penyesuaian bank manual","Manual bank movement":"Pergerakan bank manual","Manual movement":"Pergerakan manual","Mapped expense records":"Catatan pengeluaran yang dipetakan","Mapped operating costs":"Biaya operasional yang dipetakan","Mapped operating expenses":"Pengeluaran operasional yang dipetakan","Master account list used as the mapping reference for the Excel-aligned Finance flow.":"Daftar akun utama sebagai referensi pemetaan untuk alur Finance yang mengikuti Excel.","Match the receipt to the invoice and evidence":"Cocokkan penerimaan dengan invoice dan bukti pendukung","Monthly Closing Control":"Kontrol Penutupan Bulanan","Monthly budget versus actual":"Anggaran bulanan dibanding realisasi","New vouchers start as pending. Outgoing transactions above Rp100.000 require management approval before they affect the approved voucher balance.":"Voucher baru berstatus menunggu. Transaksi keluar di atas Rp100.000 memerlukan persetujuan manajemen sebelum memengaruhi saldo voucher yang disetujui.","Of Net Project Profit":"Dari Laba Bersih Proyek","One saved row for each monthly closing control, with an assigned owner, sign-off date, and review notes.":"Satu baris tersimpan untuk setiap kontrol penutupan bulanan, dengan penanggung jawab, tanggal persetujuan, dan catatan peninjauan.","One row per project and team member; status is maintained independently from Team Reward.":"Satu baris per proyek dan anggota tim. Status dikelola terpisah dari Team Reward.","Opening Balance":"Saldo Awal","Opening amount":"Jumlah saldo awal","Opening amount (IDR)":"Jumlah saldo awal (IDR)","Other obligations":"Kewajiban lainnya","Outstanding is derived from the same invoice balance; paid amount and due date stay linked to the invoice source.":"Saldo terutang dihitung dari saldo invoice yang sama. Jumlah pembayaran dan tanggal jatuh tempo tetap terhubung ke sumber invoice.","Outstanding receivables":"Piutang terutang","Owner / Capital (3000)":"Pemilik / Modal (3000)","P&L reviewed":"Laba rugi ditinjau","Paid 1":"Pembayaran 1","Paid 2":"Pembayaran 2","Paid 3":"Pembayaran 3","Payables reviewed":"Utang ditinjau","Payment 1 · 30%":"Pembayaran 1 · 30%","Payment 2 · 20%":"Pembayaran 2 · 20%","Payment 3 · 50%":"Pembayaran 3 · 50%","Payment date / target date":"Tanggal pembayaran / target","Payments dated in selected year":"Pembayaran pada tahun terpilih","Pending approval":"Menunggu persetujuan","Percentage of Net Project Profit":"Persentase dari Laba Bersih Proyek","Petty Cash Ledger":"Buku Kas Kecil","Petty Cash Reserve (1100)":"Cadangan Kas Kecil (1100)","Petty Cash Voucher":"Voucher Kas Kecil","Petty cash reserve":"Cadangan kas kecil","Petty cash reserve (%)":"Cadangan kas kecil (%)","Petty cash top-up":"Pengisian kas kecil","Petty cash voucher":"Voucher kas kecil","Posted cash in":"Kas masuk dibukukan","Posted cash out":"Kas keluar dibukukan","Posted voucher expenses":"Pengeluaran voucher yang dibukukan","Posted voucher receipts":"Penerimaan voucher yang dibukukan","Posting bridge required":"Integrasi posting diperlukan","Posting control":"Kontrol posting","Posting state":"Status posting","Preliminary P&L mapping":"Pemetaan sementara laba rugi","Project Asset / Prepayment (1400)":"Aset Proyek / Pembayaran di Muka (1400)","Project Finance":"Keuangan Proyek","Project Profit Allocation":"Alokasi Laba Proyek","Project Team Fee (IDR)":"Honor Tim Proyek (IDR)","Project Team Fee allocation":"Alokasi Honor Tim Proyek","Project Team Fee expense sources":"Sumber pengeluaran Honor Tim Proyek","Project key":"Kunci proyek","Project links available for reconciliation":"Tautan proyek yang tersedia untuk rekonsiliasi","Project margins reviewed":"Margin proyek ditinjau","Project name":"Nama proyek","Project owner":"Penanggung jawab proyek","Project team fee":"Honor tim proyek","Provisional balance":"Saldo sementara","Rate basis":"Dasar tarif","Receivables reviewed":"Piutang ditinjau","Recipient group":"Kelompok penerima","Recorded IDR client payments":"Pembayaran klien IDR yang tercatat","Recorded cash in":"Kas masuk tercatat","Recorded cash out":"Kas keluar tercatat","Recorded cost":"Biaya tercatat","Recorded expenses":"Pengeluaran tercatat","Remainder after the three standard allocations":"Sisa setelah tiga alokasi standar","Requires category mapping; excluded from net preview":"Memerlukan pemetaan kategori. Dikecualikan dari pratinjau laba bersih.","Retained Earnings (3100)":"Laba Ditahan (3100)","Revenue minus direct project cost":"Pendapatan dikurangi biaya langsung proyek","Revenue register":"Daftar pendapatan","Revenue register mapped to issued invoices":"Daftar pendapatan yang dipetakan ke invoice terbit","Review and document before the period is closed.":"Tinjau dan dokumentasikan sebelum periode ditutup.","Review contract value, recorded costs, and project margin.":"Tinjau nilai kontrak, biaya tercatat, dan margin proyek.","Review dated inflows, outflows, and net cash movement.":"Tinjau kas masuk dan keluar bertanggal, serta pergerakan kas bersih.","Review opening balances and account readiness; totals remain provisional until reconciled.":"Tinjau saldo awal dan kesiapan akun. Total tetap sementara sampai direkonsiliasi.","Review outstanding client invoices and due dates.":"Tinjau invoice klien yang belum dibayar dan tanggal jatuh temponya.","Review the period profit-and-loss preview and its source coverage.":"Tinjau pratinjau laba rugi periode dan cakupan sumbernya.","Review vendor bills, payments, and outstanding obligations.":"Tinjau tagihan vendor, pembayaran, dan kewajiban yang belum diselesaikan.","Running balance":"Saldo berjalan","Setup / actions":"Pengaturan / tindakan","Keep contract value, vendor commitments, and other obligations linked to the AMS project.":"Atur setiap proyek untuk mencatat nilai kontrak dan komitmen seperti yang digunakan Excel.","Setup required":"Pengaturan diperlukan","Share of Team Reward":"Bagian Team Reward","Source rows":"Baris sumber","Store the contract value, vendor commitment and other obligations that drive the workbook project-profit calculation.":"Simpan nilai kontrak, komitmen vendor, dan kewajiban lain untuk perhitungan laba proyek dalam workbook.","Team Fee and Team Reward are tracked separately":"Team Fee dan Team Reward dicatat secara terpisah.","Team Fee is a separate workbook register and must not be combined with Team Reward.":"Team Fee merupakan daftar terpisah di workbook dan tidak boleh digabung dengan Team Reward.","Team Reward":"Reward Tim","Team Reward (%)":"Reward Tim (%)","Team Reward distribution":"Distribusi Reward Tim","Team reward":"Reward tim","These records remain visible rather than being silently attached to another project.":"Catatan ini tetap ditampilkan dan tidak otomatis dikaitkan ke proyek lain.","Total billed":"Total tagihan","Total cash in":"Total kas masuk","Total cash out":"Total kas keluar","Total collected":"Total diterima","Total paid":"Total dibayar","Transfer / adjustment reference":"Referensi transfer / penyesuaian","Unassigned · FIFO":"Tidak ditetapkan · FIFO","Update the selected workbook checklist item. Marking a control Done requires separate management approval.":"Perbarui item daftar periksa workbook yang dipilih. Status Selesai memerlukan persetujuan manajemen terpisah.","Use this register for manual adjustments or internal transfers. Client receipts and expenses remain sourced from their existing transaction records.":"Gunakan daftar ini untuk penyesuaian manual atau transfer internal. Penerimaan klien dan pengeluaran tetap bersumber dari catatan transaksi masing-masing.","Uses the existing AMS vendor and contract source. Vendor payment commitments and stage settlements are summarized below from the bill and payment registers.":"Menggunakan sumber vendor dan kontrak AMS yang ada. Komitmen pembayaran vendor dan penyelesaian cicilan dirangkum di bawah dari daftar tagihan dan pembayaran.","Vendor & Freelancer · 30% / 20% / 50% schedule":"Vendor & Freelancer · jadwal 30% / 20% / 50%","Vendor & freelancer directory":"Direktori vendor & freelancer","Vendor / company":"Vendor / perusahaan","Vendor Bill / Payable":"Tagihan Vendor / Utang","Vendor and contract references":"Referensi vendor dan kontrak","Vendor bills":"Tagihan vendor","Vendor commitment":"Komitmen vendor","Vendor contract references":"Referensi kontrak vendor","Voucher / reference":"Voucher / referensi","Voucher date":"Tanggal voucher","Voucher number":"Nomor voucher","Vouchers awaiting approve/post":"Voucher menunggu persetujuan/posting","Values remain a preview until account classifications and posting rules are approved.":"Nilai tetap berupa pratinjau hingga klasifikasi akun dan aturan posting disetujui.","Workbook project records without a linked AMS project":"Catatan proyek workbook tanpa tautan ke proyek AMS","Workbook register":"Daftar workbook","Workbook split of the 10% Team Reward allocation.":"Pembagian alokasi 10% Team Reward berdasarkan workbook.","Workbook-aligned master configuration":"Konfigurasi master sesuai workbook","e.g. 5700":"mis. 5700","Accounts Payable register":"Daftar Utang Usaha","Actual expense records that are explicitly classified as Project Team Fee.":"Catatan pengeluaran aktual yang secara khusus diklasifikasikan sebagai Honor Tim Proyek.","Recorded costs come from AMS expenses. Map unclassified expense categories before finalizing profit and loss reporting.":"Biaya tercatat berasal dari pengeluaran AMS. Petakan kategori yang belum terklasifikasi sebelum menyelesaikan laporan laba rugi.","Opening balance comes from the saved finance register. Movements combine invoice collections, expenses, and recorded bank or cash adjustments. Reconcile the result with the bank statement before closing the month.":"Saldo awal berasal dari daftar keuangan tersimpan. Pergerakan menggabungkan penerimaan invoice, pengeluaran, serta penyesuaian bank atau kas yang tercatat. Rekonsiliasikan dengan rekening koran sebelum menutup bulan.","Transactions stay linked to their AMS source. Use this register for manual adjustments and internal transfers.":"Transaksi tetap tertaut ke sumber AMS. Gunakan daftar ini untuk penyesuaian manual dan transfer internal.","each payment schedule uses the saved bill due date. Separate due dates per installment are not recorded.":"Setiap jadwal pembayaran menggunakan tanggal jatuh tempo tagihan yang tersimpan. Tanggal jatuh tempo terpisah untuk tiap cicilan belum dicatat.","Contract value, vendor commitments, and other obligations are stored in the finance record linked to the AMS project. Existing project budget values are kept separate. Billing and recorded costs continue to use the linked AMS invoices and expenses.":"Nilai kontrak, komitmen vendor, dan kewajiban lain disimpan dalam catatan keuangan yang tertaut ke proyek AMS. Anggaran proyek yang ada tetap terpisah. Penagihan dan biaya tercatat tetap menggunakan invoice dan pengeluaran AMS yang tertaut.","Store the project contract value, vendor commitments, and other obligations.":"Simpan nilai kontrak proyek, komitmen vendor, dan kewajiban lainnya.","No AMS projects were returned. Finance records can be saved and linked when a project is available.":"Tidak ada proyek AMS yang ditemukan. Catatan keuangan dapat disimpan dan ditautkan saat proyek tersedia.","Unlinked project finance records":"Catatan keuangan proyek yang belum tertaut","These records remain visible until they can be linked to the correct AMS project.":"Catatan ini tetap ditampilkan hingga dapat ditautkan ke proyek AMS yang benar.","The percentages below follow the configured allocation policy. Project amounts use saved contract values and obligations, not the general AMS project budget.":"Persentase di bawah mengikuti kebijakan alokasi yang dikonfigurasi. Nilai proyek menggunakan kontrak dan kewajiban tersimpan, bukan anggaran proyek AMS umum.","The period can close after all 11 required controls are marked Done and posted journal entries balance.":"Periode dapat ditutup setelah 11 kontrol wajib ditandai Selesai dan entri jurnal yang dibukukan seimbang.","Source availability for each account group.":"Ketersediaan sumber untuk setiap kelompok akun.","These account codes and normal balances are used by finance records. Account setup remains read-only until editing is supported.":"Kode akun dan saldo normal ini digunakan oleh catatan keuangan. Pengaturan akun tetap hanya-baca hingga fitur edit tersedia.","Add an account using its code, type, and normal balance.":"Tambahkan akun menggunakan kode, jenis, dan saldo normalnya.","Store the contract value, vendor commitments, and other obligations used to calculate project profit.":"Simpan nilai kontrak, komitmen vendor, dan kewajiban lain untuk menghitung laba proyek.","Project name / reference":"Nama proyek / referensi","Team Fee is tracked separately from Team Reward.":"Team Fee dicatat terpisah dari Team Reward.","Allocation amounts are calculated using the configured percentages and net project profit.":"Jumlah alokasi dihitung menggunakan persentase yang dikonfigurasi dan laba bersih proyek.","Update the selected closing control. Marking a control Done requires separate management approval.":"Perbarui kontrol penutupan yang dipilih. Menandai kontrol sebagai Selesai memerlukan persetujuan manajemen terpisah.","Finance register":"Daftar keuangan","This finance record type cannot be edited from this form yet.":"Jenis catatan keuangan ini belum dapat diedit dari formulir ini.","Some finance records are unavailable":"Beberapa catatan keuangan tidak tersedia","supporting finance record requests failed. Values from unavailable records are not inferred.":"permintaan catatan keuangan pendukung gagal. Nilai dari catatan yang tidak tersedia tidak diterka.","Distribution of the 10% Team Reward allocation.":"Distribusi alokasi 10% Team Reward.","Journal account mapping":"Pemetaan akun jurnal","These are proposed cash-basis entries for review. They are not a posted ledger or a bank reconciliation.":"Ini adalah entri usulan berbasis kas untuk ditinjau. Entri ini bukan buku besar yang sudah dibukukan atau rekonsiliasi bank.","Monthly closing checklist":"Daftar periksa penutupan bulanan","Period type":"Jenis periode","Quarter":"Kuartal","Reporting quarter":"Kuartal pelaporan","This month":"Bulan ini","Last month":"Bulan lalu","This quarter":"Kuartal ini","Last quarter":"Kuartal lalu","This year":"Tahun ini","Last year":"Tahun lalu","Previous period":"Periode sebelumnya","Same period last year":"Periode yang sama tahun lalu","Compare with":"Bandingkan dengan","Comparison period":"Periode pembanding","Change":"Perubahan","Change %":"Perubahan %","Selected period":"Periode terpilih","Metric":"Metrik","Gross profit":"Laba kotor","Unclassified expense":"Biaya belum diklasifikasikan","Net profit (preview)":"Laba bersih (pratinjau)","Period comparison":"Perbandingan periode","Profit & Loss detail":"Rincian laba rugi","Cash Flow by Month":"Arus Kas per Bulan","Export comparison":"Ekspor perbandingan","Export period detail":"Ekspor rincian periode","Choose a month, quarter, or full year. Quick actions include the previous period, and the comparison below keeps the selected period visible.":"Pilih bulan, kuartal, atau satu tahun penuh. Aksi cepat tersedia untuk periode lalu dan perbandingan menampilkan kedua periode secara jelas.","Choose a month, quarter, or year. The table shows monthly detail within the selected period and a separate comparison against the prior period.":"Pilih bulan, kuartal, atau tahun. Tabel menampilkan rincian bulanan dalam periode terpilih dan perbandingan terpisah dengan periode sebelumnya.","Change is current minus comparison; percentage is unavailable when the comparison baseline is zero.":"Perubahan dihitung dari periode terpilih dikurangi periode pembanding. Persentase tidak tersedia bila nilai pembanding nol.","Monthly detail inside the selected reporting period; switch to Quarter or Year for grouped period review.":"Rincian bulanan di dalam periode yang dipilih. Gunakan Kuartal atau Tahun untuk meninjau periode yang lebih luas.","No activity exists for the selected period.":"Tidak ada aktivitas pada periode yang dipilih.","No dated receipts or expense movements are available for the selected period.":"Tidak ada penerimaan bertanggal atau pergerakan pengeluaran pada periode yang dipilih.","Before unclassified ":"Sebelum biaya yang belum diklasifikasikan ","Issued invoices · ":"Invoice terbit · ","Classified expense total: ":"Total pengeluaran terklasifikasi: "," · Source records in selected period: ":" · Catatan sumber pada periode terpilih: "," expenses, ":" pengeluaran, "," invoices.":" invoice."};
const FINANCE_DATA_COPY_EN: Record<string, string> = {"Kas masuk tercatat tahunan":"Annual recorded cash in","Pembayaran invoice dan kas masuk Kas & Bank tersimpan. Tidak termasuk penerimaan voucher kas kecil.":"Invoice payments and saved Cash & Bank inflows; excludes petty-cash voucher receipts","Kas masuk tercatat dikurangi proksi kas keluar. Transfer kas dan aktivitas voucher kas kecil belum membentuk tampilan kas konsolidasi lengkap.":"Recorded cash in minus outflow proxy; cash transfers and petty-cash voucher activity are not a complete consolidated view","Proksi kas masuk/keluar. Aktivitas voucher kas kecil tidak termasuk.":"Cash-in/out proxy; petty-cash voucher activity is excluded","Kas masuk mencakup pembayaran invoice bertanggal dan entri Kas & Bank tersimpan yang menyentuh akun 1000. Kas keluar mencakup catatan pengeluaran AMS bertanggal yang memenuhi syarat, tidak termasuk pengeluaran yang teridentifikasi sebagai kas kecil, serta penyesuaian atau transfer bank tersimpan. Voucher kas kecil tetap ada di buku kas kecil terpisah dan tidak masuk tampilan bulanan ini. Perlakukan hasilnya sebagai pergerakan bersih, bukan saldo kas akhir yang final, sampai saldo awal dan rekening koran direkonsiliasi.":"Inflows include dated invoice payments and saved Cash & Bank entries touching account 1000. Outflows include eligible dated AMS expense records, excluding items identified as petty cash, and saved bank-side adjustments/transfers. Petty-cash vouchers remain in their separate ledger and are not included in this monthly view. Treat the result as net movement, not an authoritative ending cash balance, until opening balances and bank statements are reconciled.","Kas keluar tercatat (proksi)":"Recorded cash outflow (proxy)","Tanggal pengeluaran AMS dan pergerakan Kas & Bank tersimpan. Tidak termasuk voucher kas kecil.":"AMS expense dates and saved Cash & Bank movements; excludes petty-cash vouchers","Penerimaan dikurangi proksi kas keluar bank. Tidak termasuk pengeluaran voucher kas kecil.":"Collections minus recorded bank outflow proxy; excludes petty-cash voucher spending","Akses finansial terbatas":"Financial access restricted","Akun Anda tidak memiliki izin untuk melihat data Finance.":"Your account does not have permission to view Finance data.","Ringkasan & Kontrol":"Overview & Control","Transaksi & Kas":"Transactions & Cash","Piutang & Utang":"Receivables & Payables","Akuntansi & Laporan":"Accounting & Reports","Ringkasan Eksekutif":"Executive Summary","Dasbor":"Dashboard","Bagan Akun":"Chart of Accounts","Pendapatan":"Revenue","Pengeluaran":"Expenses","Kas & Bank":"Cash & Bank","Kas Kecil":"Petty Cash","Piutang usaha":"Accounts receivable","Utang usaha":"Accounts payable","Honor Tim":"Team Fee","Anggaran Operasional":"Operational Budget","Alokasi Proyek":"Project Allocation","Laba Rugi Bulanan":"Monthly Profit & Loss","Arus Kas":"Cash Flow","Penutupan Bulanan":"Monthly Closing","Neraca":"Balance Sheet","Jurnal":"Journal","Ringkasan Tahunan":"Annual Summary","Ringkasan keuangan perusahaan dan gambaran alokasi.":"Company-wide financial summary and allocation overview.","KPI keuangan operasional dan pergerakan bulanan terbaru.":"Operational finance KPIs and recent monthly movement.","Kode akun utama dan saldo normal dari workbook.":"Master account codes and normal balances from the workbook.","Daftar pendapatan yang bersumber dari invoice klien yang diterbitkan.":"Revenue register sourced from issued client invoices.","Daftar pengeluaran yang bersumber dari data pengeluaran AMS.":"Expense register sourced from finance expenses in AMS.","Tampilan pergerakan kas dari penerimaan dan pengeluaran yang tercatat.":"Cash movement view built from recorded receipts and expenses.","Daftar kas kecil dan kontrol yang dibutuhkan workbook.":"Petty-cash register and controls required by the workbook.","Saldo invoice, tanggal jatuh tempo, dan status pembayaran.":"Invoice balances, due dates and payment status.","Kewajiban vendor dan catatan tagihan yang diperlukan.":"Vendor obligations and the bill records still required.","Direktori vendor, kontrak, tarif, dan referensi pembayaran.":"Vendor directory, contracts, rates and payment references.","Alokasi honor tim proyek, terpisah dari Team Reward.":"Project team-fee allocation, kept separate from Team Reward.","Anggaran, invoice, penerimaan, dan biaya tercatat pada tingkat proyek.":"Project-level budget, invoicing, receipts and recorded costs.","Kontrol anggaran terhadap realisasi dan tinjauan selisih.":"Budget-versus-actual controls and variance review.","Kebijakan alokasi workbook untuk laba bersih proyek.":"The workbook allocation policy for net project profit.","Tampilan laba rugi bulanan berdasarkan struktur workbook.":"Monthly profit-and-loss view based on the workbook structure.","Arus kas masuk, keluar, dan pergerakan bersih bulanan.":"Monthly cash inflow, outflow and net movement.","Daftar periksa akhir bulan dan kontrol rekonsiliasi.":"Month-end checklist and reconciliation controls.","Kesiapan aset, liabilitas, dan ekuitas perusahaan.":"Company-wide assets, liabilities and equity readiness.","Pemetaan pembukuan berpasangan dan transaksi sumber yang menunggu posting.":"Double-entry mapping and source transactions awaiting posting.","Ringkasan keuangan tahunan perusahaan.":"Company-wide annual finance summary.","Alur kerja keuangan sesuai Excel · 20 sheet workbook · sistem desain AMS yang ada":"Excel-aligned finance workflow · 20 workbook sheets · existing AMS design system","Buka ruang transaksi":"Open transaction workspace","Muat ulang data":"Refresh data","Memuat sumber data":"Loading sources","Sebagian sumber tidak tersedia":"Partial source availability","Tampilan sumber terhubung":"Connected source views","Kelompok keuangan":"Finance groups","Sheet workbook keuangan":"Finance workbook sheets","Memuat sumber data keuangan":"Loading finance sources","Membaca data invoice, pengeluaran, proyek, dan vendor AMS.":"Reading live AMS invoice, expense, project and vendor records.","Aktivitas transaksi terbaru":"Recent transaction activity","Aktivitas bulan terpilih":"Selected-month activity","Bulan pelaporan":"Reporting month","Nilai invoice yang diterbitkan":"Invoice value issued","Pergerakan kas masuk / keluar":"Cash movement in / out","Beberapa sumber keuangan tidak tersedia":"Some finance sources are unavailable","Nilai KPI hanya mencerminkan data sumber yang berhasil dimuat. Muat ulang setelah koneksi pulih.":"KPI values only reflect source records that loaded successfully. Refresh after the connection is restored.","Daftar invoice terbaru":"Recent invoice register","Ringkasan keuangan":"Finance at a glance","Invoice terbaru beserta saldo terutang saat ini.":"Latest issued invoices with current outstanding balances.","Catatan invoice terbaru. Gunakan tab sheet workbook di atas untuk melihat alur keuangan secara terperinci.":"Recent invoice records. Use the workbook sheet tabs above to continue into the detailed finance flow.","AMS tidak mengembalikan invoice yang diterbitkan.":"No issued invoices were returned by AMS.","Alur workbook":"Workbook flow","Transaksi":"Transactions","Data invoice dan pengeluaran dimuat":"Invoice and expense records loaded","Data proyek":"Project records","Data vendor":"Vendor records","Cari invoice, klien, atau proyek":"Search invoice, client or project","Cari invoice…":"Search invoices…","Kelola invoice":"Manage invoices","Kelola pengeluaran":"Manage expenses","Kode akun":"Account code","Nama akun":"Account name","Jenis akun":"Account type","Saldo normal":"Normal balance","Deskripsi":"Description","Tanggal":"Date","Referensi":"Reference","Tanggal transaksi":"Transaction date","Jenis pergerakan":"Movement type","Arah pergerakan":"Movement direction","Akun kas":"Cash account","Akun lawan":"Counterpart account","Saldo awal":"Opening balance","Saldo awal (IDR)":"Opening balance (IDR)","Tanggal saldo awal":"Opening date","Periode pelaporan":"Reporting period","Tahun pelaporan":"Reporting year","Cari":"Search","Kategori":"Category","Proyek":"Project","Klien":"Client","Tindakan":"Actions","Jumlah":"Amount","Jumlah (IDR)":"Amount (IDR)","Jumlah tagihan":"Bill amount","Jumlah pembayaran":"Payment amount","Nomor tagihan":"Bill no.","Tanggal tagihan":"Bill date","Tanggal jatuh tempo":"Due date","Tanggal pembayaran":"Payment date","Metode pembayaran":"Payment method","Referensi pembayaran":"Payment reference","Vendor / freelancer":"Vendor / freelancer","Tagihan vendor":"Vendor bills","Pembayaran terjadwal":"Scheduled payment","Anggaran belum diatur":"Budget not set","Atur anggaran":"Set budget","Tambah baris anggaran":"Add budget line","Pengaturan keuangan proyek":"Project Finance Setup","Nama proyek / kunci Excel":"Project name / Excel key","Nilai kontrak (IDR)":"Contract value (IDR)","Komitmen vendor (IDR)":"Vendor commitment (IDR)","Kewajiban lain (IDR)":"Other obligations (IDR)","Status proyek":"Project status","Tanggal mulai":"Start date","Tanggal selesai":"End date","Honor Tim Proyek":"Project Team Fee","Anggota tim":"Team member","Jumlah honor (IDR)":"Fee amount (IDR)","Status pembayaran":"Payment status","Entri Jurnal Umum":"General Journal Entry","Tanggal jurnal":"Journal date","Akun debit":"Debit account","Akun kredit":"Credit account","Batal":"Cancel","Simpan perubahan":"Save changes","Simpan catatan":"Save record","Menyimpan…":"Saving…","Tambah entri jurnal":"Add journal entry","Buat draf dari sumber":"Generate source drafts","Buat kontrol":"Create control","Tutup periode":"Close period","Belum tercatat":"Not recorded","Belum diatur":"Not set","Tidak tersedia":"Not available","Terbuka":"Open","Ditutup":"Closed","Lunas":"Paid","Belum dibayar":"Unpaid","Dibayar sebagian":"Partially Paid","Kelebihan bayar":"Overpaid","Aktif":"Active","Selesai":"Completed","Dibatalkan":"Cancelled","Menunggu":"Pending","Disetujui":"Approved","Dibukukan":"Posted","Draf":"Draft","Sedang berlangsung":"In Progress","Cash and bank accounts":"Kas dan rekening bank","Petty cash reserve":"Kas kecil/reserve","Emergency fund":"Dana darurat","Customer receivables":"Piutang pelanggan","Vendor/freelancer payables":"Hutang vendor/freelancer","Capital":"Modal","Retained earnings":"Laba ditahan","Project revenue":"Pendapatan project","Vendor/freelancer fees":"Fee vendor/freelancer","Other project obligations":"Kewajiban project lain","Sales reward":"Reward sales","Vendor/PIC reward":"Reward vendor/PIC","Management reward":"Reward management","Project team fee":"Fee tim project","Bank/administration fees":"Biaya bank/admin","Company operating expenses":"Biaya operasional perusahaan","Ringkasan":"Overview","Kontrol":"Control","Lembar":"Sheet","Bagian keuangan":"Finance sections","Sumber tersedia":"Source available","Tampilan periode khusus IDR. Laba bersih akuntansi dan saldo kas akhir bergantung pada posting buku besar, saldo awal, dan rekonsiliasi.":"IDR-only period view; accounting net profit and closing cash depend on ledger posting, opening balances and reconciliation.","Pemetaan akun":"Account mapping","Transfer kas":"Cash transfer","Pembayaran invoice":"Invoice payment","Catatan pengeluaran":"Expense record","Saldo awal disimpan":"Opening balance saved","Saldo awal belum tersedia":"Opening balance missing","Tidak ada tagihan vendor":"No vendor bills available","Belum ada tagihan vendor. Buat tagihan di Utang Usaha untuk membuat jadwal 30% / 20% / 50%.":"No vendor bills have been entered. Create a bill in Accounts Payable to generate the 30% / 20% / 50% schedule.","Belum ada tagihan vendor yang tercatat.":"No vendor bills have been recorded yet.","Tidak ada kontrak vendor yang tersedia di AMS.":"No vendor contracts are available in AMS.","Belum ada saldo awal yang dimasukkan.":"No opening balances have been entered.","Tidak ada akun yang cocok dengan pencarian.":"No chart-of-account rows match the current search.","Tidak ada pergerakan kas bertanggal. Atur saldo awal atau catat pergerakan kas.":"No dated cash movement is available. Set an opening balance or record a movement.","Tidak ada catatan pengeluaran yang diklasifikasikan sebagai Honor Tim Proyek.":"No expense source record is classified as Project Team Fee.","Belum ada alokasi Honor Tim yang tercatat.":"No individual Team Fee allocation has been recorded.","Belum ada alokasi proyek yang disimpan. Atur menggunakan nilai kontrak dan kewajiban proyek saat ini.":"No project allocation has been saved yet. Configure it from the current contract value and project obligations.","Tidak ada catatan untuk tahun yang dipilih.":"No records exist for the selected year.","Tidak ditemukan baris sumber yang memenuhi syarat atau dilewati.":"No eligible or skipped source rows were found.","Belum ada entri jurnal umum yang disimpan.":"No general journal entries have been saved.","Belum ada voucher kas kecil atau transfer yang tercatat.":"No petty-cash vouchers or transfers are recorded.","Sumber invoice AMS saat ini tidak mengembalikan saldo terutang.":"No outstanding invoice balances were returned by the current AMS invoice source.","Tidak ada data invoice terbit untuk pencarian ini.":"No issued invoice data is available for the selected search.","Tidak ada catatan pengeluaran yang cocok dengan pencarian.":"No expense records match the selected search.","AMS tidak mengembalikan catatan vendor.":"No vendor records were returned by AMS.","Tidak ada aktivitas pembayaran atau pengeluaran dari sumber AMS yang terhubung.":"No recorded payment or expense activity is available from the connected AMS sources.","AMS tidak mengembalikan proyek. Catatan proyek tetap dapat dibuat dari daftar workbook.":"No AMS projects were returned. A named project record can still be created from the workbook register.","Tidak ada aktivitas pada bulan yang dipilih.":"No activity exists for the selected month.","Tidak ada baris anggaran atau catatan pengeluaran bertanggal untuk pencarian ini.":"No budget lines or dated expense records exist for the current search.","Tidak ada penerimaan bertanggal atau pergerakan pengeluaran yang tersedia.":"No dated receipts or expense movements are available.","Catatan Finance tidak dapat disimpan.":"The Finance record could not be saved.","Persetujuan tidak dapat diselesaikan.":"The approval could not be completed.","Periode tidak dapat ditutup.":"The period could not be closed.","Sumber tidak mengembalikan respons berhasil.":"Source did not return a successful response.","Sumber tidak tersedia.":"Source is not available.","Draf jurnal sumber tidak dapat dibuat.":"Source journal drafts could not be generated.","Tab Revenue pada workbook dipetakan ke invoice terbit. Penerimaan pembayaran tetap terhubung ke catatan pembayaran invoice.":"The workbook's Revenue tab maps to issued invoices; payment collections remain attached to the invoice payment records.","Transaksi tetap terhubung ke catatan sumber AMS. Entri transfer atau penyesuaian manual menggunakan daftar tambahan workbook.":"Transactions stay connected to their AMS source record; manual transfer/adjustment entries use the supplementary workbook register.","Kontrak AMS ditampilkan sebagai komitmen. Kontrak saja tidak dianggap sebagai tagihan utang.":"Existing AMS contracts are shown as commitments; a contract alone is not treated as a payable bill.","Pengeluaran AMS yang tercatat menjadi sumber biaya. Kategori yang belum dipetakan harus diselesaikan sebelum posting Laba Rugi mengikuti workbook.":"Existing AMS expenses are the source for recorded costs. Unmapped categories should be resolved before final workbook-style P&L posting.","Cakupan sumber saat ini untuk kelompok akun Excel.":"Current source coverage for the Excel account classes.","Total Neraca belum menjadi nilai final":"Balance Sheet totals are not yet authoritative","Buku kas terhubung ke saldo awal":"Cash ledger is connected to its opening balance","Buku kas memerlukan saldo awal":"Cash ledger needs its opening balance","Saldo awal disimpan terpisah dari pergerakan kas dan tidak dihitung sebagai kas masuk periode.":"Opening balance is stored separately from cash movements and is not counted as period cash-in.","Daftar saldo awal":"Opening balance register","Entri saldo awal":"Opening balance entry","Daftar saldo awal dan alokasi":"Opening balance and allocation registers","Saldo awal dan jurnal penutupan periode":"Opening balance and period closing journal","Saldo awal merupakan catatan yang dapat diaudit. Neraca perusahaan tetap berstatus sementara sampai sumber jurnal dan buku besar lengkap direkonsiliasi.":"Opening balances are auditable records. The company balance sheet remains marked preliminary until its full journal and ledger sources are reconciled.","Entri saldo awal akun yang tersimpan. Catatan ini saja belum membentuk Neraca yang telah direkonsiliasi.":"Persistent account opening entries. These records alone do not constitute a fully reconciled Balance Sheet.","Daftar workbook tersimpan":"Persistent workbook register","Catatan saldo awal dan voucher khusus":"Dedicated opening and voucher records","Catatan khusus tagihan dan pembayaran vendor":"Dedicated vendor bill and payment records","Sumber acuan alur kerja: Kapitech Finance Final Automated.xlsx.":"Source of truth for workflow design: Kapitech Finance Final Automated.xlsx.","Implementasi penyelarasan Excel · laporan mencerminkan catatan AMS yang terhubung":"Excel-alignment implementation · reports reflect connected AMS records","Contoh mengikuti metode basis kas pada Kapitech Finance Final Automated.xlsx. Ini pemetaan draf, bukan buku besar final atau rekonsiliasi bank.":"Examples follow the cash-basis treatment in Kapitech Finance Final Automated.xlsx. This is a draft mapping, not an authoritative ledger or bank reconciliation.","Hanya saldo awal. Belum ada perhitungan lanjutan transaksi.":"Opening balance only; no transaction roll-forward yet","Tidak dibuat oleh sinkronisasi ini. Gunakan bukti tagihan/pembayaran yang terhubung.":"Not generated by this sync; use linked bill/payment evidence","Bukan laba bersih akuntansi":"Not an accounting net profit","Tidak tertaut":"Not linked","Tidak tertaut ke proyek AMS":"Not linked to an AMS project","Tidak tertaut ke vendor AMS":"Not linked to an AMS vendor","Belum ditentukan":"Not specified","Belum dialokasikan":"Not allocated","Invoice terbuka":"Open invoices","Buka direktori vendor":"Open vendor directory","Posting pergerakan kas":"Post cash movement","Catat pembayaran":"Record payment","Catat saldo awal":"Record opening balance","Catat persetujuan manajemen setelah kontrol sebelumnya ditinjau.":"Record management sign-off only after the preceding controls have been reviewed.","Kesiapan":"Readiness","Catatan penerimaan / persetujuan":"Receipt / approval notes","Status catatan":"Record state","Persyaratan tinjauan":"Review requirement","Catat Pembayaran Vendor":"Record Vendor Payment","Cari catatan pengeluaran":"Search expense records","Cari catatan pendapatan":"Search revenue records","Cari pengeluaran…":"Search expenses…","Periode yang dipilih sudah ditutup":"Selected period is closed","Kelompok alokasi terpisah":"Separate allocation bucket","Terpisah dari Honor Tim Proyek":"Separate from Project Team Fee","Terpisah dari Honor Tim":"Separate from Team Fee","Pilih akun kas":"Select a cash account","Pilih tagihan vendor":"Select a vendor bill","Pilih akun":"Select an account","Pilih opsi":"Select an option","Dilewati ·":"Skipped ·","Siap membuat draf":"Ready to generate draft","Jurnal dibukukan":"Posted journal","Draf dibuat · perlu ditinjau":"Draft generated · review required","Sinkronisasi sumber hanya membuat draf":"Source sync creates drafts only","Antrean posting transaksi sumber":"Source transaction posting queue","Baris sumber menunjukkan status jurnal yang cocok atau alasan pembuatan draf otomatis dilewati. Baris ini bukan entri jurnal.":"Source rows show the matching journal state or why automatic draft creation was skipped. These rows are not themselves journal entries.","Catatan yang dibuat mempertahankan referensi sumber. Tinjau setiap draf beserta dokumen pendukung. Pengguna berwenang yang berbeda harus menyetujui dan membukukannya. Entri yang sudah dibukukan tidak dapat diubah.":"Generated records retain their source reference. Review every draft and supporting document; a different authorized user must approve/post it. Posted entries are immutable.","Tagihan Vendor adalah sumber acuan utang":"Vendor Bill is the payable source of truth","Kontrak vendor menjelaskan komitmen. Utang Usaha disimpan pada daftar tersendiri, dengan tanggal jatuh tempo dan jadwal pembayaran tiap tagihan. Pengeluaran tertaut tetap menjadi catatan sumber dan tidak otomatis diubah menjadi tagihan.":"Vendor contracts describe commitments. Accounts Payable is now kept in a separate persistent register; each bill can carry its own due date and payment schedule. Linked expenses remain source records and are not silently converted into bills.","Nilai tagihan dan pembayaran dihitung dari tagihan tersimpan serta pembayaran yang tertaut. Pembayaran lama tanpa penanda dialokasikan FIFO. Tanggal jatuh tempo tagihan tetap menjadi acuan karena workbook tidak menyediakan tanggal terpisah per cicilan.":"Amounts and paid amounts are derived from each persisted bill and its linked payments. Unassigned legacy payments are allocated FIFO; the single bill due date remains authoritative because the workbook has no separate due date per installment.","Selisih adalah anggaran dikurangi realisasi pengeluaran untuk bulan kalender dan kategori yang sama.":"Variance is budget less expense actual for the same calendar month and expense category.","Struktur kas masuk dan keluar workbook, ditampilkan dalam IDR dari sumber transaksi AMS.":"The workbook cash-in / cash-out structure, shown in IDR from live AMS transaction sources.","Ruang kerja Finance mengikuti 20 sheet dalam Kapitech Finance Final Automated.xlsx.":"The active Finance workspace follows the 20 worksheets in Kapitech Finance Final Automated.xlsx.","Bulan pelaporan difilter berdasarkan tanggal invoice diterbitkan dan tanggal pengeluaran. Kategori pengeluaran AMS belum sama dengan kolom Project Cost / Operating Cost workbook. Pengeluaran yang belum dipetakan ditampilkan terpisah dan tidak dihitung dalam nilai laba bersih sementara sebelum pemetaan disetujui.":"The report uses invoice issue dates and expense dates. Expense categories that are not mapped to project or operating costs remain separate and are excluded from the preliminary net figure until reviewed.","Ditahan":"On Hold","Biaya langsung proyek":"Direct project cost","Biaya Langsung Proyek":"Direct Project Cost","Laba Kotor":"Gross Profit","Pratinjau Laba Bersih":"Net preview","Laba Bersih Proyek":"Net project profit","Pergerakan Kas Bersih":"Net cash movement","Biaya operasional":"Operating expense","Pengeluaran Belum Diklasifikasikan":"Unclassified Expense","Pendapatan Tahunan / Nilai Invoice (IDR)":"Annual Revenue / Invoice Value (IDR)","Penerimaan Tahunan":"Annual Collections","Pengeluaran Tahunan Tercatat":"Annual Recorded Expenses","Arus kas keluar tercatat":"Recorded cash outflow","Arus Kas Bulanan":"Monthly Cash Flow","Daftar periksa penutupan bulanan":"Monthly closing checklist","Pemetaan akun Neraca workbook":"Workbook Balance Sheet account mapping","Pemetaan posting Bagan Akun workbook":"Workbook Chart of Accounts posting map","Peringatan sumber Finance":"Finance source warning","Peringatan daftar tambahan Finance":"Supplementary Finance register warning","Tindakan Finance memerlukan perhatian":"Finance action needs attention","Hasil sinkronisasi jurnal sumber":"Source journal sync result","Bulan":"Month","Tahun":"Year","Nomor invoice":"Invoice no.","Nilai invoice":"Invoice value","Terutang":"Outstanding","Ditagihkan":"Billed","Diterima":"Collected","Jumlah dibayar":"Paid amount","Pembayaran berikutnya":"Next payment","Penanggung jawab default":"Default owner","Tujuan kontrol":"Control purpose","Kas kecil memerlukan saldo awal":"Petty cash needs an opening balance","Daftar kas kecil terhubung":"Petty cash register connected","Pergerakan voucher dan transfer kas internal, diurutkan berdasarkan tanggal.":"Voucher movements and internal cash transfers, sorted by date.","Hanya voucher yang dibukukan yang memengaruhi buku kas kecil. Voucher menunggu/disetujui tetap terlihat dalam alur, tetapi tidak mengubah saldo berjalan. Buku dimulai pada tanggal saldo awal tersimpan. Pergerakan sebelumnya tidak masuk perhitungan saldo awal. Transfer internal juga tercatat di Kas & Bank dan bukan pengeluaran tersendiri.":"Only posted vouchers affect the petty-cash ledger. Pending/approved vouchers remain visible in workflow but do not change the running balance. The ledger starts at the saved opening date; earlier movements are excluded from the opening-balance roll-forward. Internal transfers are shared with Cash & Bank and are not treated as an expense by themselves.","Penutupan bulanan memerlukan semua item kontrol workbook":"Monthly closing requires all workbook control items","Periode yang dipilih:":"Selected period:","kontrol telah selesai dan disetujui.":"controls are completed and approved.","Entri disimpan sebagai Draf dan harus dibukukan oleh pengguna berwenang yang berbeda. Total debit dan kredit harus seimbang sebelum disimpan.":"The entry is saved as Draft and requires a different authorized user to post it. Total debit and credit must balance before it can be saved.","Baris anggaran disimpan berdasarkan bulan, kategori, dan PIC. Biaya realisasi tetap bersumber dari catatan pengeluaran. Tabel tidak membuat baris anggaran kosong bernilai nol.":"Budget lines are stored by month, category and PIC. Actual costs remain sourced from expense records; the table does not insert zero-value placeholder budget rows.","Saldo awal + masuk − keluar; belum direkonsiliasi":"Opening + in − out; un-reconciled","Atur saldo awal":"Set opening balance","Tambah voucher":"Add voucher","Isi kas dari bank":"Top up from bank","Tambah catatan keuangan proyek":"Add project finance record","Hitung alokasi proyek":"Calculate project allocation","Tambah honor tim":"Add team fee","Tambah tagihan vendor":"Add vendor bill","Tambah pergerakan":"Add movement","Tambah akun":"Add account","Tambah catatan":"Add record","1000 / 1100 / 1200 terverifikasi · Akun kas":"1000 / verified 1100 / 1200 · Cash account","1000 · Kas & Bank":"1000 · Cash & Bank","1100 · Cadangan Kas Kecil":"1100 · Petty Cash Reserve","1200 · Dana Darurat":"1200 · Emergency Fund","4000 · Pendapatan Proyek":"4000 · Project Revenue","5100 / 5200 / 5300–5320 / 5400 / 5500 / 5600 · Akun Pengeluaran":"5100 / 5200 / 5300–5320 / 5400 / 5500 / 5600 · Expense account","5100 · Vendor / Biaya Langsung Proyek":"5100 · Vendor / Direct Project Cost","Akun 1000 · Kas & Bank":"Account 1000 · Cash & Bank","Akun 1100 · Cadangan Kas Kecil":"Account 1100 · Petty Cash Reserve","Utang Usaha (2000)":"Accounts Payable (2000)","Piutang Usaha (1300)":"Accounts Receivable (1300)","Entri berpasangan yang seimbang diperlukan. Formulir ini membuat jurnal dua baris. Entri kompleks memerlukan editor baris lanjutan.":"A balanced double-entry is required. This form creates a two-line journal; complex entries need an extended line editor.","Proyek AMS (opsional)":"AMS project (optional)","Vendor AMS (opsional)":"AMS vendor (optional)","Tambahkan akun sesuai struktur kode akun, jenis akun, dan saldo normal pada workbook.":"Add an account using the workbook account-code, account-type and normal-balance structure.","Semua pengeluaran tercatat":"All expenses recorded","Semua pendapatan tercatat":"All revenue recorded","Jumlah alokasi dihitung di server menggunakan persentase workbook dan dasar laba bersih proyek.":"Allocation amounts are calculated server-side using the workbook percentages and the net project profit base.","Jumlah dihitung di server berdasarkan nilai kontrak dan kewajiban proyek yang tersimpan.":"Amounts are calculated on the server from each saved project's contract and obligation amounts.","Penerimaan tahunan":"Annual collections","Nilai invoice tahunan":"Annual invoice value","Pengeluaran tahunan tercatat":"Annual recorded expenses","Ringkasan tahunan":"Annual summary","Per tanggal":"As of date","Neraca ditinjau":"Balance Sheet reviewed","Posisi saldo":"Balance side","Berdasarkan pemetaan kategori saat ini":"Based on current category mapping","Sebelum pengeluaran yang belum diklasifikasikan":"Before unclassified","Status tagihan dan nilai terutang dihitung dari catatan pembayaran yang terhubung ke tagihan.":"Bill state and outstanding values are calculated from payment records linked to the bill.","Jumlah anggaran (IDR)":"Budget amount (IDR)","Anggaran dikelola berdasarkan bulan dan kategori. Realisasi dihitung dari pengeluaran yang tercatat.":"Budget is maintained by month and category. Actual is calculated from recorded expenses.","Kas & Bank (1000)":"Cash & Bank (1000)","Pergerakan Kas & Bank":"Cash & Bank Movement","Saldo Awal Kas & Bank":"Cash & Bank Opening Balance","Buku Kas & Bank":"Cash & Bank ledger","Kas & bank direkonsiliasi":"Cash & bank reconciled","Arus kas ditinjau":"Cash Flow reviewed","Kas masuk":"Cash in","Pergerakan kas":"Cash movement","Kas keluar":"Cash out","Pergerakan kas, bukan saldo kas akhir yang telah direkonsiliasi":"Cash-flow movement, not reconciled ending cash","Item daftar periksa":"Checklist item","Pilih bulan untuk memeriksa sumber invoice dan pengeluaran yang digunakan di ruang kerja ini.":"Choose a month to inspect the same invoice and expense sources used throughout this workspace.","Klien belum diatur":"Client not set","Pembayaran klien ·":"Client payment ·","Periode penutupan":"Closing period","Penerimaan dikurangi arus keluar tercatat":"Collections minus recorded outflow","Dana operasional perusahaan":"Company operational fund","Bandingkan saldo kas dan bank dengan rekening koran yang tersedia dan saldo awal.":"Compare cash and bank balances with the available statements and opening balance.","Pastikan seluruh pendapatan sumber dan penerimaan klien untuk bulan yang dipilih telah dicatat.":"Confirm all source revenue and client receipts for the selected month are captured.","Pastikan kategori, status pembayaran, dan akun pembayaran sebenarnya":"Confirm category, payment status and actual payment account","Pastikan setiap entri jurnal memiliki total debit dan kredit yang sama.":"Confirm each journal entry has equal debit and credit totals.","Pastikan referensi transfer internal berpasangan.":"Confirm paired internal-transfer reference","Pastikan catatan pengeluaran bulan tersebut beserta bukti pendukungnya lengkap.":"Confirm the month’s expense records and supporting evidence are complete.","Tarif/nilai kontrak":"Contract rate/value","Nilai kontrak":"Contract value","Buat semua baris daftar periksa sebelum meminta penutupan akhir bulan.":"Create the checklist rows before requesting month-end close.","Buat catatan utang sebelum mencatat cicilan pembayaran 30% / 20% / 50%.":"Create the payable record before recording its 30% / 20% / 50% payment instalments.","Total kredit":"Credit total","Sumber saat ini":"Current source","Pergerakan bertanggal dalam catatan sumber yang dimuat":"Dated movements in loaded source records","Total debit":"Debit total","Dihitung dari saldo invoice IDR":"Derived from IDR invoice balances","Dihitung dari pembayaran invoice dan pengeluaran, serta penyesuaian bank dan transfer kas internal yang tercatat. Data ini bukan rekening koran yang diimpor.":"Derived from invoice payments and expenses, plus explicitly recorded bank adjustments and internal cash transfers. This is not an imported bank statement.","Dihitung dari saldo invoice yang ada":"Derived from the existing invoice balance","Ubah saldo awal":"Edit opening balance","Dana Darurat (1200)":"Emergency Fund (1200)","Dana darurat":"Emergency fund","Dana darurat (%)":"Emergency fund (%)","Status dana darurat":"Emergency fund status","Kebijakan alokasi Excel":"Excel allocation policy","Daftar keuangan proyek Excel":"Excel project finance register","Tanggal pengeluaran":"Expense date","Daftar pengeluaran":"Expense register","Baris pengeluaran":"Expense rows","Tanggal sumber pengeluaran":"Expense source dates","Jumlah honor":"Fee amount","Lembar kerja Finance":"Finance worksheet","Dari / akun aktif":"From / active account","Jurnal Umum":"General Journal","Laba Kotor dikurangi reward, honor, dan biaya operasional yang telah dipetakan.":"Gross Profit less mapped reward, fee and operating expense","Catatan pengeluaran IDR yang dikembalikan AMS":"IDR expense records returned by AMS","Tanggal penerbitan invoice IDR":"IDR invoice issue date","Invoice terbit IDR. Invoice non-IDR tetap terlihat dalam daftar transaksi.":"IDR issued invoices; non-IDR invoices remain visible in transaction registers","Saldo terutang IDR":"IDR outstanding","Transfer kas internal":"Internal cash transfer","Transfer internal":"Internal transfer","Jumlah invoice":"Invoice amount","Tanggal invoice":"Invoice date","Tanggal penerbitan invoice":"Invoice issue date","Penerimaan invoice, pengeluaran, dan pergerakan kas":"Invoice receipts, expenses and cash movements","Tanggal terbit":"Issue date","Invoice yang diterbitkan pada bulan terpilih":"Issued invoices in selected month","Jurnal seimbang":"Journal balanced","Integrasi jurnal diperlukan":"Journal bridge required","Kosongkan untuk membuat otomatis":"Leave blank to generate automatically","Pos":"Line item","Tautkan pembayaran ke tagihan vendor dan, jika diketahui, cicilan 30% / 20% / 50%. Pembayaran tanpa penanda dialokasikan FIFO.":"Link the payment to a vendor bill and, where known, its 30% / 20% / 50% installment. Unassigned payments are allocated FIFO.","Catatan pengeluaran tertaut":"Linked expense records","Persetujuan manajemen":"Management approval","Penyesuaian bank manual":"Manual bank adjustment","Pergerakan bank manual":"Manual bank movement","Pergerakan manual":"Manual movement","Catatan pengeluaran yang dipetakan":"Mapped expense records","Biaya operasional yang dipetakan":"Mapped operating costs","Pengeluaran operasional yang dipetakan":"Mapped operating expenses","Daftar akun utama sebagai referensi pemetaan untuk alur Finance yang mengikuti Excel.":"Master account list used as the mapping reference for the Excel-aligned Finance flow.","Cocokkan penerimaan dengan invoice dan bukti pendukung":"Match the receipt to the invoice and evidence","Kontrol Penutupan Bulanan":"Monthly Closing Control","Anggaran bulanan dibanding realisasi":"Monthly budget versus actual","Voucher baru berstatus menunggu. Transaksi keluar di atas Rp100.000 memerlukan persetujuan manajemen sebelum memengaruhi saldo voucher yang disetujui.":"New vouchers start as pending. Outgoing transactions above Rp100.000 require management approval before they affect the approved voucher balance.","Dari Laba Bersih Proyek":"Of Net Project Profit","Satu baris tersimpan untuk setiap item kontrol Excel, beserta PIC, tanggal persetujuan, dan catatan tinjauan.":"One persisted row per Excel control item, with assigned PIC, sign-off date and review notes.","Satu baris per proyek dan anggota tim. Status dikelola terpisah dari Team Reward.":"One row per project and team member; status is maintained independently from Team Reward.","Saldo Awal":"Opening Balance","Jumlah saldo awal":"Opening amount","Jumlah saldo awal (IDR)":"Opening amount (IDR)","Kewajiban lainnya":"Other obligations","Saldo terutang dihitung dari saldo invoice yang sama. Jumlah pembayaran dan tanggal jatuh tempo tetap terhubung ke sumber invoice.":"Outstanding is derived from the same invoice balance; paid amount and due date stay linked to the invoice source.","Piutang terutang":"Outstanding receivables","Pemilik / Modal (3000)":"Owner / Capital (3000)","Laba rugi ditinjau":"P&L reviewed","Pembayaran 1":"Paid 1","Pembayaran 2":"Paid 2","Pembayaran 3":"Paid 3","Utang ditinjau":"Payables reviewed","Pembayaran 1 · 30%":"Payment 1 · 30%","Pembayaran 2 · 20%":"Payment 2 · 20%","Pembayaran 3 · 50%":"Payment 3 · 50%","Tanggal pembayaran / target":"Payment date / target date","Pembayaran pada tahun terpilih":"Payments dated in selected year","Menunggu persetujuan":"Pending approval","Persentase dari Laba Bersih Proyek":"Percentage of Net Project Profit","Buku Kas Kecil":"Petty Cash Ledger","Cadangan Kas Kecil (1100)":"Petty Cash Reserve (1100)","Voucher Kas Kecil":"Petty Cash Voucher","Cadangan kas kecil":"Petty cash reserve","Cadangan kas kecil (%)":"Petty cash reserve (%)","Pengisian kas kecil":"Petty cash top-up","Voucher kas kecil":"Petty cash voucher","Kas masuk dibukukan":"Posted cash in","Kas keluar dibukukan":"Posted cash out","Pengeluaran voucher yang dibukukan":"Posted voucher expenses","Penerimaan voucher yang dibukukan":"Posted voucher receipts","Integrasi posting diperlukan":"Posting bridge required","Kontrol posting":"Posting control","Status posting":"Posting state","Pemetaan sementara laba rugi":"Preliminary P&L mapping","Aset Proyek / Pembayaran di Muka (1400)":"Project Asset / Prepayment (1400)","Keuangan Proyek":"Project Finance","Alokasi Laba Proyek":"Project Profit Allocation","Honor Tim Proyek (IDR)":"Project Team Fee (IDR)","Alokasi Honor Tim Proyek":"Project Team Fee allocation","Sumber pengeluaran Honor Tim Proyek":"Project Team Fee expense sources","Kunci proyek":"Project key","Tautan proyek yang tersedia untuk rekonsiliasi":"Project links available for reconciliation","Margin proyek ditinjau":"Project margins reviewed","Nama proyek":"Project name","Penanggung jawab proyek":"Project owner","Honor tim proyek":"Project team fee","Saldo sementara":"Provisional balance","Dasar tarif":"Rate basis","Piutang ditinjau":"Receivables reviewed","Kelompok penerima":"Recipient group","Pembayaran klien IDR yang tercatat":"Recorded IDR client payments","Kas masuk tercatat":"Recorded cash in","Kas keluar tercatat":"Recorded cash out","Biaya tercatat":"Recorded cost","Pengeluaran tercatat":"Recorded expenses","Sisa setelah tiga alokasi standar":"Remainder after the three standard allocations","Memerlukan pemetaan kategori. Dikecualikan dari pratinjau laba bersih.":"Requires category mapping; excluded from net preview","Laba Ditahan (3100)":"Retained Earnings (3100)","Pendapatan dikurangi biaya langsung proyek":"Revenue minus direct project cost","Daftar pendapatan":"Revenue register","Daftar pendapatan yang dipetakan ke invoice terbit":"Revenue register mapped to issued invoices","Tinjau dan dokumentasikan sebelum periode ditutup.":"Review and document before the period is closed.","Tinjau nilai kontrak, biaya tercatat, dan margin proyek.":"Review contract value, recorded costs, and project margin.","Tinjau kas masuk dan keluar bertanggal, serta pergerakan kas bersih.":"Review dated inflows, outflows, and net cash movement.","Tinjau saldo awal dan kesiapan akun. Total tetap sementara sampai direkonsiliasi.":"Review opening balances and account readiness; totals remain provisional until reconciled.","Tinjau invoice klien yang belum dibayar dan tanggal jatuh temponya.":"Review outstanding client invoices and due dates.","Tinjau pratinjau laba rugi periode dan cakupan sumbernya.":"Review the period profit-and-loss preview and its source coverage.","Tinjau tagihan vendor, pembayaran, dan kewajiban yang belum diselesaikan.":"Review vendor bills, payments, and outstanding obligations.","Saldo berjalan":"Running balance","Pengaturan / tindakan":"Setup / actions","Atur setiap proyek untuk mencatat nilai kontrak dan komitmen seperti yang digunakan Excel.":"Setup each project to record the same contract and commitment fields used by Excel.","Pengaturan diperlukan":"Setup required","Bagian Team Reward":"Share of Team Reward","Baris sumber":"Source rows","Simpan nilai kontrak, komitmen vendor, dan kewajiban lain untuk perhitungan laba proyek dalam workbook.":"Store the contract value, vendor commitment and other obligations that drive the workbook project-profit calculation.","Team Fee dan Team Reward adalah kategori workbook yang berbeda":"Team Fee and Team Reward are separate workbook categories","Team Fee merupakan daftar terpisah di workbook dan tidak boleh digabung dengan Team Reward.":"Team Fee is a separate workbook register and must not be combined with Team Reward.","Reward Tim":"Team Reward","Reward Tim (%)":"Team Reward (%)","Distribusi Reward Tim":"Team Reward distribution","Reward tim":"Team reward","Catatan ini tetap ditampilkan dan tidak otomatis dikaitkan ke proyek lain.":"These records remain visible rather than being silently attached to another project.","Total tagihan":"Total billed","Total kas masuk":"Total cash in","Total kas keluar":"Total cash out","Total diterima":"Total collected","Total dibayar":"Total paid","Referensi transfer / penyesuaian":"Transfer / adjustment reference","Tidak ditetapkan · FIFO":"Unassigned · FIFO","Perbarui item daftar periksa workbook yang dipilih. Status Selesai memerlukan persetujuan manajemen terpisah.":"Update the selected workbook checklist item. Marking a control Done requires separate management approval.","Gunakan daftar ini untuk penyesuaian manual atau transfer internal. Penerimaan klien dan pengeluaran tetap bersumber dari catatan transaksi masing-masing.":"Use this register for manual adjustments or internal transfers. Client receipts and expenses remain sourced from their existing transaction records.","Menggunakan sumber vendor dan kontrak AMS yang ada. Komitmen pembayaran vendor dan penyelesaian cicilan dirangkum di bawah dari daftar tagihan dan pembayaran.":"Uses the existing AMS vendor and contract source. Vendor payment commitments and stage settlements are summarized below from the bill and payment registers.","Vendor & Freelancer · jadwal 30% / 20% / 50%":"Vendor & Freelancer · 30% / 20% / 50% schedule","Direktori vendor & freelancer":"Vendor & freelancer directory","Vendor / perusahaan":"Vendor / company","Tagihan Vendor / Utang":"Vendor Bill / Payable","Referensi vendor dan kontrak":"Vendor and contract references","Komitmen vendor":"Vendor commitment","Referensi kontrak vendor":"Vendor contract references","Voucher / referensi":"Voucher / reference","Tanggal voucher":"Voucher date","Nomor voucher":"Voucher number","Voucher menunggu persetujuan/posting":"Vouchers awaiting approve/post","Pos workbook. Nilai tetap berupa pratinjau sampai klasifikasi akun AMS dan aturan posting disetujui.":"Workbook line items; values remain a preview until AMS account classifications and posting rules are approved.","Catatan proyek workbook tanpa tautan ke proyek AMS":"Workbook project records without a linked AMS project","Daftar workbook":"Workbook register","Pembagian alokasi 10% Team Reward berdasarkan workbook.":"Workbook split of the 10% Team Reward allocation.","Konfigurasi master sesuai workbook":"Workbook-aligned master configuration","mis. 5700":"e.g. 5700","Daftar Utang Usaha":"Accounts Payable register","Catatan pengeluaran aktual yang secara khusus diklasifikasikan sebagai Honor Tim Proyek.":"Actual expense records that are explicitly classified as Project Team Fee.","Pendapatan dihitung dari invoice yang diterbitkan. Penerimaan tetap terhubung ke catatan pembayaran invoice.":"Revenue is calculated from issued invoices. Collections remain linked to their invoice payment records.","Biaya tercatat berasal dari pengeluaran AMS. Petakan kategori yang belum terklasifikasi sebelum menyelesaikan laporan laba rugi.":"Recorded costs come from AMS expenses. Map unclassified expense categories before finalizing profit and loss reporting.","Saldo awal berasal dari daftar keuangan tersimpan. Pergerakan menggabungkan penerimaan invoice, pengeluaran, serta penyesuaian bank atau kas yang tercatat. Rekonsiliasikan dengan rekening koran sebelum menutup bulan.":"Opening balance comes from the saved finance register. Movements combine invoice collections, expenses, and recorded bank or cash adjustments. Reconcile the result with the bank statement before closing the month.","Transaksi tetap tertaut ke sumber AMS. Gunakan daftar ini untuk penyesuaian manual dan transfer internal.":"Transactions stay linked to their AMS source. Use this register for manual adjustments and internal transfers.","Saldo utang ditentukan oleh tagihan vendor dan pembayaran yang tertaut.":"Vendor bills and linked payments determine payable balances","Setiap jadwal pembayaran menggunakan tanggal jatuh tempo tagihan yang tersimpan. Tanggal jatuh tempo terpisah untuk tiap cicilan belum dicatat.":"each payment schedule uses the saved bill due date. Separate due dates per installment are not recorded.","Nilai kontrak, komitmen vendor, dan kewajiban lain disimpan dalam catatan keuangan yang tertaut ke proyek AMS. Anggaran proyek yang ada tetap terpisah. Penagihan dan biaya tercatat tetap menggunakan invoice dan pengeluaran AMS yang tertaut.":"Contract value, vendor commitments, and other obligations are stored in the finance record linked to the AMS project. Existing project budget values are kept separate. Billing and recorded costs continue to use the linked AMS invoices and expenses.","Simpan nilai kontrak proyek, komitmen vendor, dan kewajiban lainnya.":"Store the project contract value, vendor commitments, and other obligations.","Tidak ada proyek AMS yang ditemukan. Catatan keuangan dapat disimpan dan ditautkan saat proyek tersedia.":"No AMS projects were returned. Finance records can be saved and linked when a project is available.","Catatan keuangan proyek yang belum tertaut":"Unlinked project finance records","Catatan ini tetap ditampilkan hingga dapat ditautkan ke proyek AMS yang benar.":"These records remain visible until they can be linked to the correct AMS project.","Persentase di bawah mengikuti kebijakan alokasi yang dikonfigurasi. Nilai proyek menggunakan kontrak dan kewajiban tersimpan, bukan anggaran proyek AMS umum.":"The percentages below follow the configured allocation policy. Project amounts use saved contract values and obligations, not the general AMS project budget.","Team Fee dan Team Reward dicatat secara terpisah.":"Team Fee and Team Reward are tracked separately","Satu baris tersimpan untuk setiap kontrol penutupan bulanan, dengan penanggung jawab, tanggal persetujuan, dan catatan peninjauan.":"One saved row for each monthly closing control, with an assigned owner, sign-off date, and review notes.","Penutupan bulanan memerlukan seluruh item kontrol.":"Monthly closing requires all control items","Periode dapat ditutup setelah 11 kontrol wajib berstatus Selesai dan entri jurnal yang dibukukan seimbang.":"The period can close after all 11 required controls are marked Done and posted journal entries balance.","Ketersediaan sumber untuk setiap kelompok akun.":"Source availability for each account group.","Nilai tetap berupa pratinjau hingga klasifikasi akun dan aturan posting disetujui.":"Values remain a preview until account classifications and posting rules are approved.","Kas masuk, kas keluar, dan pergerakan bersih bulanan dihitung dari sumber transaksi AMS.":"Monthly cash-in, cash-out, and net movement calculated from live AMS transaction sources.","Kode akun dan saldo normal ini digunakan oleh catatan keuangan. Pengaturan akun tetap hanya-baca hingga fitur edit tersedia.":"These account codes and normal balances are used by finance records. Account setup remains read-only until editing is supported.","Tambahkan akun menggunakan kode, jenis, dan saldo normalnya.":"Add an account using its code, type, and normal balance.","Simpan nilai kontrak, komitmen vendor, dan kewajiban lain untuk menghitung laba proyek.":"Store the contract value, vendor commitments, and other obligations used to calculate project profit.","Nama proyek / referensi":"Project name / reference","Team Fee dicatat terpisah dari Team Reward.":"Team Fee is tracked separately from Team Reward.","Jumlah alokasi dihitung menggunakan persentase yang dikonfigurasi dan laba bersih proyek.":"Allocation amounts are calculated using the configured percentages and net project profit.","Perbarui kontrol penutupan yang dipilih. Menandai kontrol sebagai Selesai memerlukan persetujuan manajemen terpisah.":"Update the selected closing control. Marking a control Done requires separate management approval.","Daftar keuangan":"Finance register","Jenis catatan keuangan ini belum dapat diedit dari formulir ini.":"This finance record type cannot be edited from this form yet.","Beberapa catatan keuangan tidak tersedia":"Some finance records are unavailable","permintaan catatan keuangan pendukung gagal. Nilai dari catatan yang tidak tersedia tidak diterka.":"supporting finance record requests failed. Values from unavailable records are not inferred.","Laporan menggunakan tanggal penerbitan invoice dan tanggal pengeluaran. Kategori yang belum dipetakan ke biaya proyek atau operasional tetap terpisah dan tidak masuk perhitungan laba bersih sementara hingga ditinjau.":"The report uses invoice issue dates and expense dates. Expense categories that are not mapped to project or operating costs remain separate and are excluded from the preliminary net figure until reviewed.","Distribusi alokasi 10% Team Reward.":"Distribution of the 10% Team Reward allocation.","Pemetaan akun jurnal":"Journal account mapping","Ini adalah entri usulan berbasis kas untuk ditinjau. Entri ini bukan buku besar yang sudah dibukukan atau rekonsiliasi bank.":"These are proposed cash-basis entries for review. They are not a posted ledger or a bank reconciliation.","Periode dapat ditutup setelah 11 kontrol wajib ditandai Selesai dan entri jurnal yang dibukukan seimbang.":"The period can close after all 11 required controls are marked Done and posted journal entries balance."};
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
  const value = String(status || '').trim().toLowerCase().replace(/[_-]+/g, ' ');
  if (value === 'paid' || value === 'completed' || value === 'active' || value === 'posted') return 'success';
  if (value === 'overdue' || value === 'voided' || value === 'cancelled' || value === 'failed') return 'danger';
  if (value === 'partially paid' || value === 'pending' || value === 'open' || value === 'draft') return 'warning';
  if (value === 'sent' || value === 'in progress') return 'info';
  return 'neutral';
};

const StatusBadge: React.FC<{ value: unknown }> = ({ value }) => (
  <AdminStatusBadge tone={statusTone(value)}>{normaliseStatus(value)}</AdminStatusBadge>
);

const financeCellText = (node: React.ReactNode): string => {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(financeCellText).filter(Boolean).join(' · ');
  if (React.isValidElement(node)) {
    return financeCellText((node.props as { children?: React.ReactNode }).children);
  }
  return '';
};

const parseFinanceSortDate = (value: string): number | null => {
  const text = value.trim();
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return Date.UTC(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  const months: Record<string, number> = {
    jan: 0, january: 0, januari: 0,
    feb: 1, february: 1, februari: 1,
    mar: 2, march: 2, maret: 2,
    apr: 3, april: 3,
    may: 4, mei: 4,
    jun: 5, june: 5, juni: 5,
    jul: 6, july: 6, juli: 6,
    aug: 7, august: 7, agu: 7, agustus: 7,
    sep: 8, sept: 8, september: 8,
    oct: 9, october: 9, okt: 9, oktober: 9,
    nov: 10, november: 10,
    dec: 11, december: 11, des: 11, desember: 11
  };
  const dayFirst = text.toLowerCase().replace(/\./g, '').match(/^(\d{1,2})\s+([a-zà-ÿ]+)\s+(\d{4})$/i);
  const monthFirst = text.toLowerCase().replace(/\./g, '').match(/^([a-zà-ÿ]+)\s+(\d{1,2}),?\s+(\d{4})$/i);
  const match = dayFirst || monthFirst;
  if (!match) return null;
  const monthName = dayFirst ? match[2] : match[1];
  const day = Number(dayFirst ? match[1] : match[2]);
  const year = Number(match[3]);
  const month = months[monthName];
  if (month === undefined || day < 1 || day > 31) return null;
  return Date.UTC(year, month, day);
};

const parseFinanceSortNumber = (value: string): number | null => {
  let text = value.trim().replace(/^(?:rp|idr|usd|[$€£])\s*/i, '').replace(/\s/g, '');
  if (!text || !/^[+-]?[\d.,]+%?$/.test(text)) return null;
  text = text.replace(/%$/, '');
  const lastDot = text.lastIndexOf('.');
  const lastComma = text.lastIndexOf(',');
  if (lastDot >= 0 && lastComma >= 0) {
    if (lastComma > lastDot) text = text.replace(/\./g, '').replace(',', '.');
    else text = text.replace(/,/g, '');
  } else if (lastDot >= 0) {
    const after = text.length - lastDot - 1;
    if ((text.match(/\./g) || []).length > 1 || after === 3) text = text.replace(/\./g, '');
  } else if (lastComma >= 0) {
    const after = text.length - lastComma - 1;
    if ((text.match(/,/g) || []).length > 1 || after === 3) text = text.replace(/,/g, '');
    else text = text.replace(',', '.');
  }
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
};

const compareFinanceSortText = (left: string, right: string): number => {
  const leftDate = parseFinanceSortDate(left);
  const rightDate = parseFinanceSortDate(right);
  if (leftDate !== null && rightDate !== null) return leftDate - rightDate;
  const leftNumber = parseFinanceSortNumber(left);
  const rightNumber = parseFinanceSortNumber(right);
  if (leftNumber !== null && rightNumber !== null) return leftNumber - rightNumber;
  return left.localeCompare(right, undefined, { numeric: true, sensitivity: 'base' });
};

const FinanceDataTable: React.FC<{
  title: string;
  description?: string;
  columns: Column[];
  rows: TableRow[];
  emptyMessage: string;
  actions?: React.ReactNode;
  exportable?: boolean;
}> = ({ title, description, columns, rows, emptyMessage, actions, exportable = true }) => {
  const [sort, setSort] = useState<{ index: number; direction: 'asc' | 'desc' } | null>(null);
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(0);

  useEffect(() => {
    setPage(0);
    setSort(null);
  }, [title, rows.length]);

  const sortedRows = useMemo(() => {
    if (!sort) return rows;
    const column = columns[sort.index];
    if (!column || /^actions?$/i.test(column.label.trim())) return rows;
    return rows.slice().sort((left, right) => {
      const compared = compareFinanceSortText(
        financeCellText(left.cells[sort.index]),
        financeCellText(right.cells[sort.index])
      );
      return sort.direction === 'asc' ? compared : -compared;
    });
  }, [columns, rows, sort]);

  const pageCount = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  const visibleRows = sortedRows.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  useEffect(() => {
    if (page !== currentPage) setPage(currentPage);
  }, [page, currentPage]);

  const handleSort = (index: number, label: string) => {
    if (/^actions?$/i.test(label.trim())) return;
    setSort((current) => current?.index === index
      ? { index, direction: current.direction === 'asc' ? 'desc' : 'asc' }
      : { index, direction: 'asc' });
    setPage(0);
  };

  const exportRows = () => {
    const safeTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'finance-register';
    const exportableRows = sortedRows.map((row) => row.cells.map((cell, index) => {
      if (/^actions?$/i.test((columns[index]?.label || '').trim())) return '';
      const value = financeCellText(cell);
      return /^[=+@-]/.test(value) && !/^-?\d[\d.,%]*$/.test(value) ? "'" + value : value;
    }));
    exportFinanceCsv('finance-' + safeTitle + '-' + getLocalDateInputValue() + '.csv', columns.map((column) => column.label), exportableRows);
  };

  const panelActions = actions || (exportable && rows.length > 0) ? (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {actions}
      {exportable && rows.length > 0 && (
        <Button variant="secondary" type="button" icon={<Download size={14} />} onClick={exportRows}>Export CSV</Button>
      )}
    </div>
  ) : undefined;

  return (
    <AdminPanel title={title} description={description} actions={panelActions} bodyClassName="p-0">
      <div className="max-w-full overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left text-xs">
          <thead className="bg-bg text-[11px] font-medium text-muted">
            <tr>
              {columns.map((column, index) => {
                const sortable = !/^actions?$/i.test(column.label.trim());
                const isSorted = sort?.index === index;
                return (
                  <th
                    key={column.label + '-' + index}
                    scope="col"
                    aria-sort={isSorted ? (sort?.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                    className={'px-4 py-3 font-medium ' + (column.align === 'right' ? 'text-right ' : column.align === 'center' ? 'text-center ' : '') + (column.className || '')}
                  >
                    <button
                      type="button"
                      disabled={!sortable}
                      onClick={() => handleSort(index, column.label)}
                      className={'flex w-full items-center gap-1.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-default ' + (column.align === 'right' ? 'justify-end ' : column.align === 'center' ? 'justify-center ' : 'justify-start ') + (sortable ? 'hover:text-fg' : '')}
                      aria-label={sortable ? 'Sort by ' + column.label : column.label}
                    >
                      <span>{column.label}</span>
                      {sortable && (isSorted
                        ? sort?.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                        : <ArrowUpDown size={12} className="opacity-45" />)}
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {visibleRows.length ? visibleRows.map((row) => (
              <tr key={row.id} className="border-t border-line align-middle hover:bg-panel-hover/40">
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
      {rows.length > 0 && (
        <AdminTablePagination
          total={sortedRows.length}
          page={currentPage + 1}
          pageSize={pageSize}
          onPageChange={(nextPage) => setPage(nextPage - 1)}
          onPageSizeChange={setPageSize}
          itemLabel="records"
          pageSizeOptions={[10, 25, 50]}
          pageSizeAriaLabel={'Rows per page for ' + title}
          slug={'finance-' + (title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'register') + '-pagination'}
        />
      )}
    </AdminPanel>
  );
};
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
  'chart-of-accounts','cash-bank-opening','cash-bank-transaction','cash-reconciliation','petty-cash-voucher',
  'vendor-bill','vendor-bill-payment','operational-budget','project-finance','team-fee',
  'project-allocation','journal-entry','monthly-closing','balance-sheet-opening','monthly-closing-lock'
] as const;

const SEARCHABLE_FINANCE_TABS = new Set<FinanceWorkbookTab['key']>([
  'chart-of-accounts',
  'cash-bank',
  'accounts-payable',
  'vendors',
  'project-finance',
  'operational-budget',
  'petty-cash',
  'project-allocation',
  'team-fee',
  'balance-sheet',
  'journal'
]);

const REGISTER_FORMS: Record<string, { title: string; description: string; fields: RegisterField[] }> = {
  'chart-of-accounts': {
    title: 'Chart of Accounts',
    description: 'Add an account using its code, type, and normal balance.',
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
  'cash-reconciliation': {
    title:'Cash / Bank Reconciliation',
    description:'Record the actual statement or physical count at month end. The period cannot close unless the saved balance matches the posted General Ledger.',
    fields:[
      {key:'reconciliationMonth',label:'Reporting month',type:'month',required:true,defaultValue:''},
      {key:'accountCode',label:'Account to reconcile',type:'select',required:true,optionSource:'reconciliationAccounts'},
      {key:'statementDate',label:'Statement / count date',type:'date',required:true},
      {key:'statementBalance',label:'Statement / counted balance (IDR)',type:'number',required:true},
      {key:'statementReference',label:'Statement / processor / count reference',type:'text',required:true,placeholder:'Bank statement ID, processor batch, or cash count sheet'},
      {key:'notes',label:'Reconciliation notes',type:'textarea'}
    ]
  },
  'cash-bank-transaction': {
    title:'Cash & Bank Movement',
    description:'Use this register for manual adjustments or internal transfers. Client receipts and expenses remain sourced from their existing transaction records.',
    fields:[
      {key:'date',label:'Transaction date',type:'date',required:true},
      {key:'transactionKind',label:'Movement type',type:'select',required:true,options:['manual','bank-to-petty-cash','petty-cash-to-bank','bank-to-emergency-fund','emergency-fund-to-bank','card-clearing-to-bank','bank-to-credit-card-payable'],defaultValue:'manual'},
      {key:'accountCode',label:'From / active account',type:'select',required:true,optionSource:'cashAccounts',defaultValue:'1000',help:'Card-clearing settlements start from 1010; credit-card bill payments start from Cash & Bank 1000.'},
      {key:'counterpartAccountCode',label:'Counterpart account',type:'select',required:true,optionSource:'cashAccounts',help:'Manual adjustments need an active counter-account. Card clearing settles to 1000; card statements settle against 2200.'},
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
    description:'All vouchers begin as pending and require an authorized reviewer before posting to the petty-cash balance.',
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
      {key:'expenseAccountCode',label:'Expense account',type:'select',required:true,optionSource:'expenseAccounts'},
      {key:'billDate',label:'Bill date',type:'date',required:true},
      {key:'dueDate',label:'Overall due date',type:'date',required:true},
      {key:'installment1DueDate',label:'Payment 1 due date · 30%',type:'date',defaultValue:''},
      {key:'installment2DueDate',label:'Payment 2 due date · 20%',type:'date',defaultValue:''},
      {key:'installment3DueDate',label:'Payment 3 due date · 50%',type:'date',defaultValue:''},
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
      {key:'installmentNumber',label:'Scheduled payment',type:'select',required:true,options:['Unassigned · FIFO','1 · 30%','2 · 20%','3 · 50%'],defaultValue:'Unassigned'},
      {key:'paidDate',label:'Payment date',type:'date',required:true},
      {key:'amount',label:'Payment amount',type:'number',required:true},
      {key:'method',label:'Payment method',type:'select',required:true,options:['bank_transfer','credit_card','cash','other'],defaultValue:'bank_transfer'},
      {key:'settlementAccountCode',label:'Settlement account',type:'select',optionSource:'accounts',visibleWhen:{key:'method',values:['other']},help:'Required for an unsupported payment method. Select the actual cash, bank or credit-card liability account.'},
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
    description:'Store the contract value, vendor commitments, and other obligations used to calculate project profit.',
    fields:[
      {key:'projectId',label:'AMS project (optional)',type:'select',optionSource:'projects'},
      {key:'projectName',label:'Project name / reference',type:'text',required:true},
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
    description:'Each team-fee milestone is a separate record with its own reference, target date, actual payment date and payment state. Team Fee is separate from Team Reward.',
    fields:[
      {key:'projectId',label:'AMS project (optional)',type:'select',optionSource:'projects'},
      {key:'projectName',label:'Project name / reference',type:'text',required:true},
      {key:'memberName',label:'Team member',type:'text',required:true},
      {key:'role',label:'Role',type:'text'},
      {key:'feeAmount',label:'Fee amount (IDR)',type:'number',required:true},
      {key:'paymentReference',label:'Fee milestone / reference',type:'text',required:true,placeholder:'e.g. Deposit, milestone 2, final payment'},
      {key:'dueDate',label:'Due date / target date',type:'date'},
      {key:'paidDate',label:'Actual payment date',type:'date',required:true,defaultValue:'',visibleWhen:{key:'paymentStatus',values:['paid']}},
      {key:'paymentStatus',label:'Payment status',type:'select',options:['planned','pending','paid'],defaultValue:'planned'},
      {key:'notes',label:'Notes',type:'textarea'}
    ]
  },
  'project-allocation': {
    title:'Project Profit Allocation',
    description:'Team Fee is deducted before positive net project profit is allocated; reserve and reward allocations never go negative.',
    fields:[
      {key:'projectId',label:'AMS project (optional)',type:'select',optionSource:'projects'},
      {key:'projectName',label:'Project name / reference',type:'text',required:true},
      {key:'contractValue',label:'Contract value (IDR)',type:'number',readOnly:true,required:true,help:'Linked from the saved Project Finance record.'},
      {key:'vendorCost',label:'Vendor commitment (IDR)',type:'number',readOnly:true,required:true,help:'Linked from the saved Project Finance record.'},
      {key:'otherObligations',label:'Other obligations (IDR)',type:'number',readOnly:true,required:true,help:'Linked from the saved Project Finance record.'},
      {key:'pettyCashPercent',label:'Petty cash reserve (%)',type:'number',required:true,defaultValue:10},
      {key:'emergencyPercent',label:'Emergency fund (%)',type:'number',required:true,defaultValue:10},
      {key:'teamRewardPercent',label:'Team Reward (%)',type:'number',required:true,defaultValue:10},
      {key:'teamFeeAmount',label:'Team Fee total (IDR)',type:'number',readOnly:true,defaultValue:0,help:'Calculated from the selected project’s Team Fee milestones. Legacy saved totals are retained until Team Fee records are entered.'},
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
    description:'Update the selected closing control. Marking a control Done requires separate management approval.',
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
  const { mode: reportPeriodMode, value: reportPeriodValue, enabled: reportPeriodEnabled, matchesDate, matchesInterval } = useReportingPeriod();
  const { language } = useLanguage();
  const locale = language === 'id' ? 'id-ID' : 'en-US';
  const canViewFinancials = hasAdminPermission('canViewFinancials');
  const canManageVendorContracts = hasAdminPermission('canManageVendors');
  const canManageFinanceRecords = hasAdminPermission('canManageInvoices');
  const canApproveFinanceRecords = hasAdminPermission('canApproveBudgets');
  const formatMoney = useCallback((value: number, currency = 'IDR') => new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency === 'USD' ? 'USD' : 'IDR',
    maximumFractionDigits: 0
  }).format(Number.isFinite(Number(value)) ? Number(value) : 0), [locale]);
  const formatDate = useCallback((value: unknown) => {
    const text = String(value || '').slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return '—';
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
  const [registerEditorDirty, setRegisterEditorDirty] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState<FinanceConfirmation | null>(null);
  const [vendorContractEditor, setVendorContractEditor] = useState<FinanceVendorContractDraft | null>(null);
  const [vendorContractDirty, setVendorContractDirty] = useState(false);
  const [vendorContractSaving, setVendorContractSaving] = useState(false);
  const [vendorContractError, setVendorContractError] = useState<string | null>(null);
  const [sourceErrors, setSourceErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!canViewFinancials) return;
    const syncVendors = async () => {
      try {
        const response = await api.vendors.getAll();
        if (response.success && Array.isArray(response.data?.vendors)) {
          setVendors(response.data.vendors as AgencyVendor[]);
        }
      } catch {
        // Keep the last known vendor data visible if a background refresh fails.
      }
    };
    window.addEventListener(VENDOR_EVENT_NAME, syncVendors);
    return () => window.removeEventListener(VENDOR_EVENT_NAME, syncVendors);
  }, [canViewFinancials]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const defaultFinanceMonth = getReportingPeriodRange(reportPeriodValue, reportPeriodMode, locale)?.startMonth || (new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0'));
  const [selectedClosingMonth, setSelectedClosingMonth] = useState(() => {
    const range = getReportingPeriodRange(reportPeriodValue, reportPeriodMode, locale);
    return range?.startMonth || (new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0'));
  });
  const [reportComparisonMode, setReportComparisonMode] = useState<ReportingPeriodComparison>('previous-period');

  const loadRequestId = useRef(0);

  useEffect(() => () => {
    loadRequestId.current += 1;
  }, []);

  const loadData = useCallback(async (quiet = false) => {
    if (!canViewFinancials) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    const requestId = ++loadRequestId.current;
    if (quiet) setRefreshing(true);
    else setLoading(true);
    const baseResults = await Promise.all([
      readSource('Invoices', () => api.finance.getInvoices()),
      readSource('Expenses', () => api.finance.getExpenses()),
      readSource('Projects', () => api.projects.getAll()),
      readSource('Vendors', () => api.vendors.getAll())
    ]);
    const workbookResults = await Promise.all(SUPPLEMENTARY_FINANCE_RECORD_TYPES.map((type) =>
      readSource('Finance register ' + type, () => api.finance.workbookList(type))
    ));
    if (requestId !== loadRequestId.current) return;
    const invoiceSource = baseResults[0];
    const expenseSource = baseResults[1];
    const projectSource = baseResults[2];
    const vendorSource = baseResults[3];
    setRegisterRecords((current) => {
      const next = { ...current };
      workbookResults.forEach((result, index) => {
        if (result.error) return;
        const type = SUPPLEMENTARY_FINANCE_RECORD_TYPES[index];
        next[type] = Array.isArray(result.data?.records) ? result.data.records as WorkbookRecord[] : [];
      });
      return next;
    });
    setRegisterErrors(workbookResults.filter((result) => result.error).map((result) => result.label + ': ' + result.error));
    if (!invoiceSource.error) {
      const nextInvoices = Array.isArray(invoiceSource.data?.invoices)
        ? invoiceSource.data.invoices.map((item: AgencyInvoice) => normalizeFinanceInvoice({
            ...item,
            currency: item.currency || 'IDR',
            items: Array.isArray(item.items) ? item.items : []
          } as AgencyInvoice))
        : [];
      setInvoices(nextInvoices);
    }
    if (!expenseSource.error) {
      const nextExpenses = Array.isArray(expenseSource.data?.expenses)
        ? expenseSource.data.expenses.map((item: AgencyExpense) => normalizeFinanceExpense(item))
        : [];
      setExpenses(nextExpenses);
    }
    if (!projectSource.error) {
      setProjects(Array.isArray(projectSource.data?.projects) ? projectSource.data.projects as AgencyProject[] : []);
    }
    if (!vendorSource.error) {
      setVendors(Array.isArray(vendorSource.data?.vendors) ? vendorSource.data.vendors as AgencyVendor[] : []);
    }
    setSourceErrors(baseResults.filter((result) => result.error).map((result) => result.label + ': ' + result.error));
    setLoading(false);
    setRefreshing(false);
  }, [canViewFinancials]);

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
        const method = String(payment.method || '').toLowerCase().replace(/[\s-]+/g, '_');
        const settlementAccount = String(payment.settlementAccountCode || '');
        const accountCode = method === 'bank_transfer' ? '1000'
          : method === 'cash' ? '1100'
            : method === 'other' && ['1000','1100','1200'].includes(settlementAccount) ? settlementAccount : '';
        if (!accountCode) continue;
        entries.push({
          id: 'payment-' + invoice.id + '-' + payment.id,
          date: payment.date,
          reference: payment.reference || invoice.invoiceNumber,
          description: 'Client payment · ' + invoiceClient(invoice),
          cashIn: payment.amount,
          cashOut: 0,
          source: 'Invoice payment',
          currency: invoice.currency || 'IDR',
          accountCode
        });
      }
    }
    for (const expense of expenses) {
      const metadata = expense.metadata && typeof expense.metadata === 'object' ? expense.metadata as Record<string, unknown> : {};
      if (Number(expense.amount) <= 0 || isPettyCashRelated(expense)) continue;
      const savedPayments = Array.isArray((expense as any).payments)
        ? (expense as any).payments as Array<Record<string, unknown>>
        : Array.isArray(metadata.payments) ? metadata.payments as Array<Record<string, unknown>> : [];
      const paymentStatus = String(expense.paymentStatus || metadata.paymentStatus || '').toLowerCase();
      const paymentRows: Array<Record<string, unknown>> = savedPayments.length > 0
        ? savedPayments
        : paymentStatus === 'paid'
          ? [{
              id: String(expense.id) + '-payment',
              amount: Number(expense.amount) || 0,
              date: expense.paidDate || metadata.paidDate || '',
              method: expense.paymentMethod || metadata.paymentMethod || '',
              paymentAccountCode: expense.paymentAccountCode || metadata.paymentAccountCode || '',
              reference: (expense as any).paymentReference || metadata.paymentReference || (expense as any).reference || expense.id
            }]
          : [];
      for (const payment of paymentRows) {
        const paymentMethod = String(payment.method || '').toLowerCase().replace(/[\s-]+/g, '_');
        const accountCode = String(payment.paymentAccountCode || payment.accountCode || payment.paidFromAccountCode || '');
        const paidDate = String(payment.date || payment.paidDate || '').slice(0, 10);
        const amount = Number(payment.amount) || 0;
        if (!paidDate || amount <= 0 || !['bank_transfer', 'cash'].includes(paymentMethod) || !['1000','1100','1200'].includes(accountCode)) continue;
        entries.push({
          id: 'expense-' + expense.id + '-payment-' + String(payment.id || paidDate),
          date: paidDate,
          reference: String(payment.reference || (expense as any).reference || expense.id),
          description: expenseLabel(expense),
          cashIn: 0,
          cashOut: amount,
          source: 'Paid expense',
          currency: String((expense as any).currency || 'IDR'),
          accountCode
        });
      }
    }
    for (const record of registerRecords['cash-bank-transaction'] || []) {
      const payload = record.payload || {};
      const amount = Number(payload.amount) || 0;
      const accountCode = String(payload.accountCode || '');
      const counterpartAccountCode = String(payload.counterpartAccountCode || '');
      const direction = String(payload.direction || 'out');
      const kind = String(payload.transactionKind || 'manual');
      if (String(record.status || payload.status || '').toLowerCase() !== 'posted') continue;
      if (amount <= 0) continue;
      let cashIn = 0;
      let cashOut = 0;
      let ledgerAccountCode = '';
      if (accountCode === '1000') {
        ledgerAccountCode = '1000';
        cashIn = direction === 'in' ? amount : 0;
        cashOut = direction === 'out' ? amount : 0;
      } else if (counterpartAccountCode === '1000') {
        ledgerAccountCode = '1000';
        if (kind === 'manual') {
          cashIn = direction === 'out' ? amount : 0;
          cashOut = direction === 'in' ? amount : 0;
        } else {
          cashIn = amount;
        }
      } else if (['1000','1100','1200'].includes(accountCode) && kind === 'manual') {
        ledgerAccountCode = accountCode;
        cashIn = direction === 'in' ? amount : 0;
        cashOut = direction === 'out' ? amount : 0;
      } else {
        continue;
      }
      entries.push({
        id: 'cash-workbook-' + record.id,
        date: String(payload.date || '').slice(0, 10),
        reference: String(payload.reference || record.recordKey || record.id),
        description: String(payload.description || (kind === 'manual' ? 'Manual cash movement' : 'Internal cash transfer')),
        cashIn, cashOut,
        source: kind === 'manual' ? 'Manual cash adjustment' : kind === 'card-clearing-to-bank' ? 'Card settlement' : kind === 'bank-to-credit-card-payable' ? 'Credit-card settlement' : 'Internal transfer',
        currency: 'IDR',
        accountCode: ledgerAccountCode
      });
    }
    return entries.sort((a, b) => b.date.localeCompare(a.date));
  }, [reportInvoices, expenses, registerRecords]);

  const matching = useCallback((values: unknown[]) => {
    const needle = searchText.trim().toLowerCase();
    return !needle || values.some((value) => String(value || '').toLowerCase().includes(needle));
  }, [searchText]);


  const getRegisterRecords = (type: string): WorkbookRecord[] => registerRecords[type] || [];
  const getPostedLedgerCashFlow = (startDate: string, endDate: string) => {
    const cashCodes = new Set(['1000','1100','1200']);
    const journals = getRegisterRecords('journal-entry').filter((record) => {
      if (record.status !== 'posted') return false;
      const sourceType = String(record.payload.sourceType || '');
      if (sourceType === 'cash-bank-opening' || sourceType === 'balance-sheet-opening') return false;
      const date = String(record.payload.date || '').slice(0, 10);
      return Boolean(date && date >= startDate && date <= endDate);
    });
    let inflow = 0;
    let outflow = 0;
    let activityCount = 0;
    for (const journal of journals) {
      const lines = Array.isArray(journal.payload.lines) ? journal.payload.lines as Array<Record<string, any>> : [];
      const debit = lines.filter((line) => cashCodes.has(String(line.accountCode || ''))).reduce((sum, line) => sum + (Number(line.debit) || 0), 0);
      const credit = lines.filter((line) => cashCodes.has(String(line.accountCode || ''))).reduce((sum, line) => sum + (Number(line.credit) || 0), 0);
      const net = Math.round((debit - credit) * 100) / 100;
      if (net > 0.01) { inflow += net; activityCount++; }
      else if (net < -0.01) { outflow += Math.abs(net); activityCount++; }
    }
    return { inflow, outflow, net: inflow - outflow, activityCount, journalCount: journals.length };
  };

  const getPostedLedgerIncomeStatement = (startDate: string, endDate: string) => {
    const accountTypes = new Map<string, string>(EXCEL_CHART_OF_ACCOUNTS.map((account) => [account.code, account.type] as const));
    for (const account of getRegisterRecords('chart-of-accounts')) {
      const code = String(account.payload.code || account.recordKey);
      accountTypes.set(code, account.payload.active === false ? '__inactive__' : String(account.payload.accountType || ''));
    }
    const journals = getRegisterRecords('journal-entry').filter((record) => {
      if (record.status !== 'posted') return false;
      const date = String(record.payload.date || '').slice(0, 10);
      return date >= startDate && date <= endDate;
    });
    let revenue = 0, expense = 0;
    for (const journal of journals) {
      const lines = Array.isArray(journal.payload.lines) ? journal.payload.lines as Array<Record<string, any>> : [];
      for (const line of lines) {
        const type = accountTypes.get(String(line.accountCode || ''));
        const debit = Number(line.debit) || 0;
        const credit = Number(line.credit) || 0;
        if (type === 'Revenue') revenue += credit - debit;
        if (type === 'Expense') expense += debit - credit;
      }
    }
    return { revenue, expense, net: revenue - expense, journalCount: journals.length, available: journals.length > 0 };
  };

  const getOpeningRecord = (accountCode: string): WorkbookRecord | undefined =>
    getRegisterRecords('cash-bank-opening').find((item) => String(item.payload.accountCode) === accountCode);

  const getOpeningBalance = (accountCode: string): number | null => {
    const record = getOpeningRecord(accountCode);
    return record ? Number(record.payload.openingBalance) || 0 : null;
  };

  const getProjectFinanceRecord = (project: AgencyProject): WorkbookRecord | undefined =>
    getRegisterRecords('project-finance').find((record) =>
      (Boolean(record.projectId || record.payload.projectId) && String(record.projectId || record.payload.projectId) === project.id) ||
      String(record.payload.projectName || '').trim().toLowerCase() === String(project.name || '').trim().toLowerCase()
    );

  const getProjectFinanceRecordForRef = (projectId: string, projectName: string): WorkbookRecord | undefined => {
    const id = String(projectId || '').trim();
    const name = String(projectName || '').trim().toLowerCase();
    return getRegisterRecords('project-finance').find((record) => {
      const recordProjectId = String(record.projectId || record.payload.projectId || '').trim();
      const recordProjectName = String(record.payload.projectName || '').trim().toLowerCase();
      return Boolean(id && recordProjectId === id) || Boolean(name && recordProjectName === name);
    });
  };


  const openRegisterForm = (type: string, record?: WorkbookRecord, initialPayload: Record<string, any> = {}) => {
    if (!canManageFinanceRecords) {
      setRegisterActionError('You do not have permission to manage Finance records.');
      return;
    }
    const definition = REGISTER_FORMS[type];
    if (!definition) {
      setRegisterActionError('This finance record type cannot be edited from this form yet.');
      return;
    }
    const today = getLocalDateInputValue();
    const defaults: Record<string, any> = {};
    for (const field of definition.fields) {
      if (field.defaultValue !== undefined) defaults[field.key] = field.defaultValue;
      else if (field.type === 'date') defaults[field.key] = today;
      else if (field.type === 'month') defaults[field.key] = defaultFinanceMonth;
      else if (field.type === 'number') defaults[field.key] = '';
      else if (field.type === 'select') defaults[field.key] = field.optionSource ? '' : (field.options?.[0] || '');
      else defaults[field.key] = '';
    }
    const savedPayload = record ? { ...record.payload } : {};
    if (type === 'journal-entry') {
      const existingLines = record && Array.isArray(record.payload.lines) ? record.payload.lines as Array<Record<string, any>> : [];
      savedPayload.lines = existingLines.length >= 2
        ? existingLines.map((line) => ({ ...line }))
        : Array.isArray(record?.payload.lines) && record.payload.lines.length > 0
          ? existingLines.map((line) => ({ ...line }))
          : [
              { accountCode: '', accountName: '', debit: '', credit: 0, notes: '' },
              { accountCode: '', accountName: '', debit: 0, credit: '', notes: '' }
            ];
    }
    if (record && type === 'vendor-bill-payment') {
      const installmentNumber = Number(record.payload.installmentNumber || 0);
      savedPayload.installmentNumber = installmentNumber >= 1 && installmentNumber <= 3
        ? String(installmentNumber)
        : 'Unassigned';
    }
    setEditor({ type, record, payload: { ...defaults, ...savedPayload, ...initialPayload } });
    setRegisterEditorDirty(false);
    setRegisterActionError(null);
  };

  const getRegisterFieldOptions = (field: RegisterField): Array<{ value: string; label: string }> => {
    if (field.optionSource === 'accounts') {
      if (editor?.type === 'vendor-bill-payment' && field.key === 'settlementAccountCode') {
        const allowed = new Set(['1000','1100','1200','2200']);
        const candidates = new Map<string,{value:string;label:string}>();
        ACCOUNT_OPTION_CODES.filter((account)=>allowed.has(account.value)).forEach((account)=>candidates.set(account.value,account));
        getRegisterRecords('chart-of-accounts').forEach((record)=>{
          const code=String(record.payload.code||record.recordKey||'').trim();
          if(!code||!allowed.has(code)) return;
          if(record.payload.active===false) candidates.delete(code);
          else candidates.set(code,{value:code,label:code+' · '+String(record.payload.name||code)});
        });
        return [{value:'',label:'Select settlement account'},...candidates.values()];
      }
      const accountsByCode = new Map<string, { value: string; label: string }>();
      ACCOUNT_OPTION_CODES.forEach((account) => accountsByCode.set(account.value, account));
      getRegisterRecords('chart-of-accounts').forEach((record) => {
        const code = String(record.payload.code || record.recordKey || '').trim();
        if (!code) return;
        if (record.payload.active === false) {
          accountsByCode.delete(code);
          return;
        }
        accountsByCode.set(code, { value: code, label: code + ' · ' + String(record.payload.name || code) });
      });
      const availableAccounts = [...accountsByCode.values()];
      if (editor?.type === 'balance-sheet-opening' && field.key === 'accountCode') {
        const eligible = new Set<string>(EXCEL_CHART_OF_ACCOUNTS
          .filter((account) => ['Asset','Liability','Equity'].includes(account.type) && !['1000','1100','1200','3200'].includes(account.code))
          .map((account) => account.code));
        for (const record of getRegisterRecords('chart-of-accounts')) {
          const code = String(record.payload.code || record.recordKey || '');
          if (record.payload.active !== false && ['Asset','Liability','Equity'].includes(String(record.payload.accountType || '')) && !['1000','1100','1200','3200'].includes(code)) eligible.add(code);
          else eligible.delete(code);
        }
        return [{ value: '', label: 'Select an eligible balance-sheet account' }, ...availableAccounts.filter((account) => eligible.has(account.value))];
      }
      return [{ value: '', label: 'Select an account' }, ...availableAccounts];
    }
    if (field.optionSource === 'cashAccounts') {
      if (editor?.type === 'cash-bank-transaction' && editor.payload.transactionKind === 'card-clearing-to-bank') {
        return field.key === 'accountCode'
          ? [{ value: '1010', label: '1010 · Card Settlement Clearing' }]
          : [{ value: '1000', label: '1000 · Cash & Bank' }];
      }
      if (editor?.type === 'cash-bank-transaction' && editor.payload.transactionKind === 'bank-to-credit-card-payable') {
        return field.key === 'accountCode'
          ? [{ value: '1000', label: '1000 · Cash & Bank' }]
          : [{ value: '2200', label: '2200 · Credit Card Payable' }];
      }
      if (field.key === 'counterpartAccountCode' && editor?.type === 'cash-bank-transaction' && editor.payload.transactionKind === 'manual') {
        const accounts = new Map<string, { value: string; label: string }>();
        EXCEL_CHART_OF_ACCOUNTS.forEach((account) => accounts.set(account.code, { value: account.code, label: account.code + ' · ' + account.name }));
        getRegisterRecords('chart-of-accounts').filter((record) => record.payload.active !== false).forEach((record) => {
          const code = String(record.payload.code || record.recordKey);
          accounts.set(code, { value: code, label: code + ' · ' + String(record.payload.name || '') });
        });
        return [{ value: '', label: 'Select counterpart account' }, ...accounts.values()];
      }
      return [{ value: '', label: 'Select a cash account' }, ...CASH_ACCOUNT_OPTIONS];
    }
    if (field.optionSource === 'reconciliationAccounts') {
      const allowed = new Set(['1000','1010','1100','1200']);
      const accounts = new Map<string,{value:string;label:string}>(EXCEL_CHART_OF_ACCOUNTS
        .filter((account) => allowed.has(account.code) && account.active)
        .map((account) => [account.code,{value:account.code,label:account.code+' · '+account.name}] as const));
      getRegisterRecords('chart-of-accounts').forEach((record) => {
        const code=String(record.payload.code||record.recordKey||'').trim();
        if(!allowed.has(code)) return;
        if(record.payload.active===false) accounts.delete(code);
        else accounts.set(code,{value:code,label:code+' · '+String(record.payload.name||code)});
      });
      return [{value:'',label:'Select an account'},...accounts.values()];
    }
    if (field.optionSource === 'expenseAccounts') {
      const accounts = new Map<string, { value: string; label: string }>();
      EXCEL_CHART_OF_ACCOUNTS.filter((account) => account.type === 'Expense').forEach((account) => accounts.set(account.code, { value: account.code, label: account.code + ' · ' + account.name }));
      getRegisterRecords('chart-of-accounts').filter((record) => record.payload.active !== false && String(record.payload.accountType || '') === 'Expense').forEach((record) => {
        const code = String(record.payload.code || record.recordKey);
        accounts.set(code, { value: code, label: code + ' · ' + String(record.payload.name || '') });
      });
      return [{ value: '', label: 'Select expense account' }, ...accounts.values()];
    }
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
    setRegisterEditorDirty(true);
    setEditor((current) => {
      if (!current) return current;
      const payload = { ...current.payload, [key]: value };
      if (current.type === 'project-allocation' && key === 'projectId') {
        const selectedProject = projects.find((project) => project.id === value);
        if (selectedProject) payload.projectName = selectedProject.name;
      }
      if (current.type === 'cash-bank-transaction' && key === 'transactionKind') {
        const rules: Record<string, { from: string; to: string; direction: string }> = {
          'manual': { from: '1000', to: '', direction: 'out' },
          'bank-to-petty-cash': { from: '1000', to: '1100', direction: 'out' },
          'petty-cash-to-bank': { from: '1100', to: '1000', direction: 'out' },
          'bank-to-emergency-fund': { from: '1000', to: '1200', direction: 'out' },
          'emergency-fund-to-bank': { from: '1200', to: '1000', direction: 'out' },
          'card-clearing-to-bank': { from: '1010', to: '1000', direction: 'out' },
          'bank-to-credit-card-payable': { from: '1000', to: '2200', direction: 'out' }
        };
        const rule = rules[value];
        if (rule) {
          payload.accountCode = rule.from;
          payload.counterpartAccountCode = rule.to;
          payload.direction = rule.direction;
        }
      }
      if (current.type === 'vendor-bill-payment' && ['billId', 'installmentNumber'].includes(key)) {
        const bill = getRegisterRecords('vendor-bill').find((record) => record.id === String(payload.billId || ''));
        if (bill) {
          const payments = getRegisterRecords('vendor-bill-payment')
            .filter((record) => record.id !== current.record?.id && String(record.payload.billId || '') === bill.id)
            .map((record) => ({
              id: record.id,
              amount: record.payload.amount,
              installmentNumber: record.payload.installmentNumber,
              paidDate: record.payload.paidDate
            }));
          const schedule = getVendorBillInstallmentSchedule(
            Number(bill.payload.total) || 0,
            payments,
            Array.isArray(bill.payload.paymentSchedule) ? bill.payload.paymentSchedule as number[] : undefined
          );
          const billOutstanding = Math.max(0, (Number(bill.payload.total) || 0) - payments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0));
          const installmentNumber = Number(payload.installmentNumber);
          const selectedOutstanding = [1, 2, 3].includes(installmentNumber)
            ? Number(schedule.find((item) => item.number === installmentNumber)?.outstanding) || 0
            : schedule.reduce((sum, item) => sum + item.outstanding, 0);
          payload.amount = Math.min(billOutstanding, Math.max(0, selectedOutstanding));
        }
      }
      return { ...current, payload };
    });
  };

  const changeJournalLine = (lineIndex: number, key: string, value: string | number) => {
    setRegisterEditorDirty(true);
    setEditor((current) => {
      if (!current || current.type !== 'journal-entry') return current;
      const lines = Array.isArray(current.payload.lines) ? current.payload.lines.map((line: Record<string, any>) => ({ ...line })) : [];
      if (!lines[lineIndex]) return current;
      lines[lineIndex] = { ...lines[lineIndex], [key]: value };
      return { ...current, payload: { ...current.payload, lines } };
    });
  };

  const addJournalLine = () => {
    setRegisterEditorDirty(true);
    setEditor((current) => {
      if (!current || current.type !== 'journal-entry') return current;
      const lines = Array.isArray(current.payload.lines) ? current.payload.lines.map((line: Record<string, any>) => ({ ...line })) : [];
      if (lines.length >= 100) return current;
      return { ...current, payload: { ...current.payload, lines: [...lines, { accountCode: '', accountName: '', debit: '', credit: '', notes: '' }] } };
    });
  };

  const removeJournalLine = (lineIndex: number) => {
    setRegisterEditorDirty(true);
    setEditor((current) => {
      if (!current || current.type !== 'journal-entry') return current;
      const lines = Array.isArray(current.payload.lines) ? current.payload.lines.map((line: Record<string, any>) => ({ ...line })) : [];
      if (lines.length <= 2 || !lines[lineIndex]) return current;
      lines.splice(lineIndex, 1);
      return { ...current, payload: { ...current.payload, lines } };
    });
  };

  const submitRegisterForm = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editor || registerSaving) return;
    setRegisterActionError(null);
    const definition = REGISTER_FORMS[editor.type];
    const missingRequired = definition?.fields.find((field) =>
      field.required
      && (!field.visibleWhen || field.visibleWhen.values.includes(String(editor.payload[field.visibleWhen.key] || '')))
      && !String(editor.payload[field.key] ?? '').trim()
    );
    if (missingRequired) {
      setRegisterActionError(missingRequired.label + ' is required.');
      return;
    }
    const dateRanges: Array<[string, string, string]> = [
      ['billDate', 'dueDate', 'Due date cannot be earlier than the bill date.'],
      ['startDate', 'endDate', 'End date cannot be earlier than the start date.']
    ];
    for (const [startKey, endKey, message] of dateRanges) {
      const startDate = String(editor.payload[startKey] || '');
      const endDate = String(editor.payload[endKey] || '');
      if (startDate && endDate && endDate < startDate) {
        setRegisterActionError(message);
        return;
      }
    }
    setRegisterSaving(true);
    try {
      let payload: Record<string, any> = { ...editor.payload };
      if (editor.type === 'chart-of-accounts') {
        const code = String(payload.code || '').trim();
        const name = String(payload.name || '').trim();
        const currentCode = String(editor.record?.payload.code || editor.record?.recordKey || '');
        const conflictsWithDefault = EXCEL_CHART_OF_ACCOUNTS.some((account) => account.code.toLowerCase() === code.toLowerCase()) && currentCode.toLowerCase() !== code.toLowerCase();
        const conflictsWithCustom = getRegisterRecords('chart-of-accounts').some((record) =>
          record.id !== editor.record?.id && String(record.payload.code || record.recordKey).toLowerCase() === code.toLowerCase()
        );
        if (!code || !name) {
          setRegisterActionError('Account code and account name are required.');
          setRegisterSaving(false);
          return;
        }
        if (conflictsWithDefault || conflictsWithCustom) {
          setRegisterActionError('This account code already exists. Use a unique account code.');
          setRegisterSaving(false);
          return;
        }
        payload = { ...payload, code, name, description: String(payload.description || '').trim() };
      }
      if (editor.type === 'project-allocation') {
        const projectId = String(payload.projectId || editor.record?.projectId || '').trim();
        const selectedProject = projects.find((project) => project.id === projectId);
        const projectNameValue = String(selectedProject?.name || payload.projectName || editor.record?.payload.projectName || '').trim();
        const projectName = projectNameValue.toLowerCase();
        const projectFinance = getProjectFinanceRecordForRef(projectId, projectNameValue);
        if (!projectFinance && !editor.record) {
          throw new Error('Configure Project Finance for this project first. Allocation amounts must come from the saved contract, vendor commitment and other obligation record.');
        }
        const matchingFees = getRegisterRecords('team-fee').filter((record) => {
          const feeProjectId = String(record.projectId || record.payload.projectId || '').trim();
          const feeProjectName = String(record.payload.projectName || '').trim().toLowerCase();
          return projectId ? feeProjectId === projectId : !feeProjectId && Boolean(projectName) && feeProjectName === projectName;
        });
        const teamFeeTotal = matchingFees.length
          ? Math.round(matchingFees.reduce((sum, record) => sum + Math.max(0, Number(record.payload.feeAmount) || 0), 0) * 100) / 100
          : Math.max(0, Number(editor.record?.payload.teamFeeAmount ?? payload.teamFeeAmount) || 0);
        const financePayload = projectFinance?.payload || editor.record?.payload || {};
        payload = {
          ...payload,
          projectId: projectId || undefined,
          projectName: projectNameValue,
          contractValue: Number(financePayload.contractValue ?? payload.contractValue) || 0,
          vendorCost: Number(financePayload.vendorCommitment ?? financePayload.vendorCost ?? payload.vendorCost) || 0,
          otherObligations: Number(financePayload.otherObligations ?? payload.otherObligations) || 0,
          teamFeeAmount: teamFeeTotal
        };
      }
      if (editor.type === 'journal-entry') {
        const rawLines = Array.isArray(payload.lines) ? payload.lines as Array<Record<string, any>> : [];
        if (rawLines.length < 2 || rawLines.length > 100) {
          setRegisterActionError('A journal needs between 2 and 100 lines.');
          setRegisterSaving(false);
          return;
        }
        let debitTotal = 0;
        let creditTotal = 0;
        const getAccount = (code: string) => {
          const custom = getRegisterRecords('chart-of-accounts').find((record) => String(record.payload.code || record.recordKey) === code && record.payload.active !== false);
          const standard = EXCEL_CHART_OF_ACCOUNTS.find((account) => account.code === code && account.active);
          return custom?.payload.active !== false && custom?.payload.name
            ? String(custom.payload.name)
            : standard?.name || '';
        };
        const lines = rawLines.map((line, index) => {
          const accountCode = String(line.accountCode || '').trim();
          const debit = Number(line.debit) || 0;
          const credit = Number(line.credit) || 0;
          if (!accountCode || !getAccount(accountCode)) {
            throw new Error('Journal line ' + (index + 1) + ' needs an active Chart of Accounts entry.');
          }
          if (!Number.isFinite(debit) || !Number.isFinite(credit) || debit < 0 || credit < 0 || (debit > 0 && credit > 0) || (debit <= 0 && credit <= 0)) {
            throw new Error('Journal line ' + (index + 1) + ' must have one positive debit or credit amount.');
          }
          debitTotal += debit;
          creditTotal += credit;
          return { accountCode, accountName: getAccount(accountCode), debit, credit, notes: String(line.notes || payload.notes || '') };
        });
        debitTotal = Math.round(debitTotal * 100) / 100;
        creditTotal = Math.round(creditTotal * 100) / 100;
        if (Math.abs(debitTotal - creditTotal) > 0.01) {
          throw new Error('Journal must balance before it can be saved. Total debit: ' + formatMoney(debitTotal) + '; credit: ' + formatMoney(creditTotal) + '.');
        }
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
          lines
        };
      }
      const result = editor.record
        ? await api.finance.workbookUpdate(editor.type, editor.record.id, payload, editor.record.version)
        : await api.finance.workbookCreate(editor.type, payload);
      if (!result.success) throw new Error(result.error || 'The Finance record could not be saved.');
      setEditor(null);
      setRegisterEditorDirty(false);
      await loadData(true);
    } catch (error) {
      setRegisterActionError(error instanceof Error ? error.message : 'The Finance record could not be saved.');
    } finally {
      setRegisterSaving(false);
    }
  };

  const syncSourceJournalDrafts = async () => {
    if (registerSaving) return;
    if (!canManageFinanceRecords) {
      setRegisterActionError('You do not have permission to generate Finance journal drafts.');
      return;
    }
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

  const approveWorkbookRecord = async (type: string, record: WorkbookRecord, action: 'approve' | 'post' = 'approve'): Promise<boolean> => {
    if (registerSaving) return false;
    if (!canApproveFinanceRecords) {
      setRegisterActionError('You do not have permission to approve Finance records.');
      return false;
    }
    setRegisterSaving(true);
    setRegisterActionError(null);
    try {
      const response = await api.finance.workbookApprove(type, record.id, '', action);
      if (!response.success) throw new Error(response.error || 'The approval could not be completed.');
      await loadData(true);
      return true;
    } catch (error) {
      setRegisterActionError(error instanceof Error ? error.message : 'The approval could not be completed.');
      return false;
    } finally {
      setRegisterSaving(false);
    }
  };

  const closeWorkbookPeriod = async (period = selectedClosingMonth): Promise<boolean> => {
    if (registerSaving) return false;
    if (!canApproveFinanceRecords) {
      setRegisterActionError('You do not have permission to close Finance periods.');
      return false;
    }
    setRegisterSaving(true);
    setRegisterActionError(null);
    try {
      const response = await api.finance.workbookClosePeriod(period);
      if (!response.success) throw new Error(response.error || 'The period could not be closed.');
      await loadData(true);
      return true;
    } catch (error) {
      setRegisterActionError(error instanceof Error ? error.message : 'The period could not be closed.');
      return false;
    } finally {
      setRegisterSaving(false);
    }
  };

  const archiveFinanceRecord = async (type: string, record: WorkbookRecord): Promise<boolean> => {
    if (registerSaving) return false;
    if (!canManageFinanceRecords) {
      setRegisterActionError('You do not have permission to archive Finance records.');
      return false;
    }
    setRegisterSaving(true);
    setRegisterActionError(null);
    try {
      const response = await api.finance.workbookDelete(type, record.id, record.version);
      if (!response.success) throw new Error(response.error || 'The draft could not be archived.');
      await loadData(true);
      return true;
    } catch (error) {
      setRegisterActionError(error instanceof Error ? error.message : 'The draft could not be archived.');
      return false;
    } finally {
      setRegisterSaving(false);
    }
  };

  const confirmPendingFinanceAction = async () => {
    const pending = pendingConfirmation;
    if (!pending || registerSaving) return;
    if (pending.kind === 'discard-editor') {
      setEditor(null);
      setRegisterEditorDirty(false);
      setPendingConfirmation(null);
      return;
    }
    if (pending.kind === 'discard-vendor-contract') {
      setVendorContractEditor(null);
      setVendorContractDirty(false);
      setVendorContractError(null);
      setPendingConfirmation(null);
      return;
    }
    try {
      if (pending.kind === 'approve') await approveWorkbookRecord(pending.type, pending.record, 'approve');
      else if (pending.kind === 'post') await approveWorkbookRecord(pending.type, pending.record, pending.type === 'journal-entry' ? 'approve' : 'post');
      else if (pending.kind === 'archive') await archiveFinanceRecord(pending.type, pending.record);
      else if (pending.kind === 'close-period') await closeWorkbookPeriod(pending.period);
    } finally {
      setPendingConfirmation(null);
    }
  };

  const openCashOpeningForm = (accountCode = '1000') => {
    const existing = getRegisterRecords('cash-bank-opening').find((record) => String(record.payload.accountCode) === accountCode);
    openRegisterForm('cash-bank-opening', existing, { accountCode });
  };

  const registerAddButton = (type: string, label = 'Add record', initialPayload: Record<string, any> = {}) => (
    canManageFinanceRecords
      ? <Button variant="primary" type="button" icon={<Plus size={14} />} onClick={() => openRegisterForm(type, undefined, initialPayload)}>{label}</Button>
      : null
  );

  const registerRecordActions = (type: string, record: WorkbookRecord, extra?: React.ReactNode) => {
    const isPosted = type === 'journal-entry' && record.status === 'posted';
    const isDone = type === 'monthly-closing' && String(record.payload.status || record.status) === 'Done';
    const recordPeriod = String(record.payload.period || record.periodKey || '');
    const isPeriodLocked = Boolean(recordPeriod) && getRegisterRecords('monthly-closing-lock').some(
      (lock) => String(lock.periodKey || lock.payload.period || '') === recordPeriod
    );
    const voucherStatus = String(record.payload.status || record.status);
    const isApproved = type === 'petty-cash-voucher' && ['approved','posted'].includes(voucherStatus);
    const canEdit = canManageFinanceRecords && !isPosted && type !== 'monthly-closing-lock' && !isDone && !isApproved && !isPeriodLocked
      && !(type === 'journal-entry' && Boolean(record.payload.sourceType));
    const canApprove = canApproveFinanceRecords && !isPeriodLocked && (
      (type === 'petty-cash-voucher' && voucherStatus === 'pending')
      || (type === 'journal-entry' && record.status === 'draft')
      || (type === 'monthly-closing' && !isDone)
    );
    const canPostVoucher = canApproveFinanceRecords && !isPeriodLocked && type === 'petty-cash-voucher' && voucherStatus === 'approved';
    const actionLabel = type === 'journal-entry' ? 'Post'
      : type === 'petty-cash-voucher' ? 'Approve'
      : type === 'monthly-closing' ? 'Complete' : 'Approve';
    return (
      <div className="flex flex-wrap items-center gap-2">
        {canEdit && <Button variant="secondary" type="button" disabled={registerSaving} onClick={() => openRegisterForm(type, record)}>Edit</Button>}
        {canManageFinanceRecords && type === 'journal-entry' && record.status === 'draft' && !isPeriodLocked && <Button variant="secondary" type="button" disabled={registerSaving} onClick={() => setPendingConfirmation({kind:'archive',type,record})}>Archive draft</Button>}
        {canApprove && <Button variant="secondary" type="button" disabled={registerSaving} onClick={() => setPendingConfirmation({kind:type==='journal-entry'?'post':'approve',type,record})}>{actionLabel}</Button>}
        {canPostVoucher && <Button variant="secondary" type="button" disabled={registerSaving} onClick={() => setPendingConfirmation({kind:'post',type,record})}>Post cash movement</Button>}
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
        onClose={() => { if (!registerSaving) { if (registerEditorDirty) setPendingConfirmation({kind:'discard-editor'}); else setEditor(null); } }}
        title={editor.record ? 'Edit ' + definition.title : definition.title}
        description={definition.description}
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => { if (registerEditorDirty) setPendingConfirmation({kind:'discard-editor'}); else setEditor(null); }} disabled={registerSaving}>Cancel</Button>
            <Button type="submit" form="finance-workbook-register-editor-form" loading={registerSaving} disabled={registerSaving}>
              {registerSaving ? 'Saving…' : editor.record ? 'Save changes' : 'Save record'}
            </Button>
          </>
        }
        size="2xl"
        slug="finance-workbook-register-editor"
      >
        <form id="finance-workbook-register-editor-form" onSubmit={(event) => void submitRegisterForm(event)} className="space-y-5 p-1">
          {registerActionError && (
            <div className="rounded-control border border-danger/25 bg-danger/5 p-3 text-xs leading-5 text-fg" role="alert">{registerActionError}</div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {definition.fields.filter((field) => !(editor.type === 'journal-entry' && ['debitAccountCode','creditAccountCode','amount'].includes(field.key))).filter((field) => !field.visibleWhen || field.visibleWhen.values.includes(String(editor.payload[field.visibleWhen.key] || ''))).map((field) => {
              const financeSource = editor.type === 'project-allocation'
                ? getProjectFinanceRecordForRef(String(editor.payload.projectId || editor.record?.projectId || ''), String(editor.payload.projectName || editor.record?.payload.projectName || ''))?.payload
                : undefined;
              const value = editor.type === 'project-allocation' && ['contractValue','vendorCost','otherObligations'].includes(field.key)
                ? String(field.key === 'contractValue'
                    ? financeSource?.contractValue ?? editor.record?.payload.contractValue ?? editor.payload.contractValue ?? 0
                    : field.key === 'vendorCost'
                      ? financeSource?.vendorCommitment ?? financeSource?.vendorCost ?? editor.record?.payload.vendorCost ?? editor.payload.vendorCost ?? 0
                      : financeSource?.otherObligations ?? editor.record?.payload.otherObligations ?? editor.payload.otherObligations ?? 0)
                : field.key === 'teamFeeAmount' && editor.type === 'project-allocation'
                ? String((() => {
                    const projectId = String(editor.payload.projectId || editor.record?.projectId || '').trim();
                    const projectName = String(editor.payload.projectName || '').trim().toLowerCase();
                    const matchingFees = getRegisterRecords('team-fee').filter((record) => {
                      const feeProjectId = String(record.projectId || record.payload.projectId || '').trim();
                      const feeProjectName = String(record.payload.projectName || '').trim().toLowerCase();
                      return projectId ? feeProjectId === projectId : !feeProjectId && Boolean(projectName) && feeProjectName === projectName;
                    });
                    return matchingFees.length
                      ? Math.round(matchingFees.reduce((sum, record) => sum + Math.max(0, Number(record.payload.feeAmount) || 0), 0) * 100) / 100
                      : Math.max(0, Number(editor.payload.teamFeeAmount) || 0);
                  })())
                : editor.payload[field.key] === undefined || editor.payload[field.key] === null ? '' : String(editor.payload[field.key]);
              const disabled = field.readOnly || (editor.record?.recordType === 'chart-of-accounts' && field.key === 'code');
              const commonClass = 'mt-1.5 block h-10 min-h-10 w-full rounded-control border border-line bg-bg px-3 text-[13px] leading-[18px] text-fg outline-none transition-colors focus:border-accent disabled:cursor-not-allowed disabled:opacity-60';
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
                      className="mt-1.5 block min-h-[88px] w-full rounded-control border border-line bg-bg px-3 py-2 text-[13px] leading-[18px] text-fg outline-none transition-colors focus:border-accent"
                    />
                  ) : field.type === 'date' || field.type === 'month' ? (
                    <CustomDatePicker
                      value={value}
                      onChange={(nextValue) => changeRegisterField(field.key, nextValue)}
                      type={field.type}
                      min={field.key === 'endDate' ? String(editor.payload.startDate || '') : field.key === 'dueDate' ? String(editor.payload.billDate || '') : undefined}
                      required={field.required}
                      locale={locale}
                      className="mt-1.5 w-full"
                      triggerClassName="h-10 min-h-10 text-[13px]"
                      placeholder={field.placeholder}
                      aria-label={field.label}
                    />
                  ) : field.type === 'select' ? (
                    <CustomSelect
                      value={value}
                      onChange={(nextValue) => changeRegisterField(field.key, nextValue)}
                      options={getRegisterFieldOptions(field)}
                      disabled={field.optionSource === 'vendorBills' && getRegisterRecords('vendor-bill').length === 0}
                      className="mt-1.5 w-full"
                      triggerClassName="h-10 min-h-10 w-full"
                      placeholder={field.placeholder || ('Select ' + field.label.toLowerCase())}
                      aria-label={field.label}
                    />
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
          {editor.type === 'project-allocation' && (() => {
            const projectFinance = getProjectFinanceRecordForRef(String(editor.payload.projectId || editor.record?.projectId || ''), String(editor.payload.projectName || editor.record?.payload.projectName || ''));
            return <WorkbookNote tone={projectFinance ? 'info' : 'warning'} title={projectFinance ? 'Allocation values linked to Project Finance' : 'Project Finance setup required'}>
              {projectFinance
                ? 'Contract value, vendor commitment and other obligations are read from the saved Project Finance record. Update them there first; this allocation form cannot create a conflicting second source.'
                : 'Save the project contract value, vendor commitment and other obligations in the Project Finance tab first. Legacy allocations can still be edited, but new allocations need a linked Project Finance record.'}
            </WorkbookNote>;
          })()}
          {editor.type === 'journal-entry' && (() => {
            const journalLines = Array.isArray(editor.payload.lines) ? editor.payload.lines as Array<Record<string, any>> : [];
            const debitTotal = journalLines.reduce((sum, line) => sum + Math.max(0, Number(line.debit) || 0), 0);
            const creditTotal = journalLines.reduce((sum, line) => sum + Math.max(0, Number(line.credit) || 0), 0);
            const balanced = Math.abs(debitTotal - creditTotal) <= 0.01 && journalLines.length >= 2 && journalLines.every((line) => Boolean(line.accountCode) && ((Number(line.debit) > 0) !== (Number(line.credit) > 0)));
            return <div className="space-y-3 rounded-card border border-line bg-bg p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div><p className="text-xs font-semibold text-fg">Journal lines</p><p className="mt-1 text-[11px] text-muted">Use as many lines as needed. Each line must have one debit or one credit; total debits must equal total credits.</p></div>
                <Button type="button" variant="secondary" icon={<Plus size={14}/>} onClick={addJournalLine} disabled={journalLines.length >= 100}>Add line</Button>
              </div>
              <div className="space-y-2">
                {journalLines.map((line, index) => <div key={index} className="grid gap-2 rounded-control border border-line p-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
                  <label className="block text-[11px] font-medium text-muted">Account {index + 1}
                    <CustomSelect value={String(line.accountCode || '')} onChange={(value) => changeJournalLine(index,'accountCode',value)} options={getRegisterFieldOptions({key:'journalAccountCode',label:'Account',type:'select',optionSource:'accounts'})} className="mt-1.5 w-full" triggerClassName="h-10 min-h-10 w-full" placeholder="Select account" aria-label={'Journal line ' + (index + 1) + ' account'}/>
                  </label>
                  <label className="block text-[11px] font-medium text-muted">Debit (IDR)
                    <input type="number" min="0" step="0.01" value={line.debit ?? ''} onChange={(event) => changeJournalLine(index,'debit',event.target.value)} className="mt-1.5 block h-10 min-h-10 w-full rounded-control border border-line bg-panel px-3 text-[13px] text-fg outline-none focus:border-accent" aria-label={'Journal line ' + (index + 1) + ' debit'}/>
                  </label>
                  <label className="block text-[11px] font-medium text-muted">Credit (IDR)
                    <input type="number" min="0" step="0.01" value={line.credit ?? ''} onChange={(event) => changeJournalLine(index,'credit',event.target.value)} className="mt-1.5 block h-10 min-h-10 w-full rounded-control border border-line bg-panel px-3 text-[13px] text-fg outline-none focus:border-accent" aria-label={'Journal line ' + (index + 1) + ' credit'}/>
                  </label>
                  <Button type="button" variant="secondary" icon={<Trash2 size={14}/>} onClick={() => removeJournalLine(index)} disabled={journalLines.length <= 2} aria-label={'Remove journal line ' + (index + 1)}/>
                </div>)}
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="rounded-control border border-line p-2"><p className="text-[10px] text-muted">Total debit</p><p className="mt-1 text-xs font-semibold tabular-nums text-fg">{formatMoney(debitTotal)}</p></div>
                <div className="rounded-control border border-line p-2"><p className="text-[10px] text-muted">Total credit</p><p className="mt-1 text-xs font-semibold tabular-nums text-fg">{formatMoney(creditTotal)}</p></div>
                <div className={'rounded-control border p-2 ' + (balanced ? 'border-success/25' : 'border-warning/25')}><p className="text-[10px] text-muted">Balance</p><p className={'mt-1 text-xs font-semibold ' + (balanced ? 'text-success' : 'text-warning')}>{balanced ? 'Balanced' : 'Needs review'}</p></div>
              </div>
              <WorkbookNote title="Posting control">The entry is saved as Draft and requires a different authorized user to post it. Source-linked drafts are read-only; correct the source record and regenerate them. Posting an unbalanced journal is blocked by the server.</WorkbookNote>
            </div>;
          })()}
        </form>
      </Drawer>
    );
  };

  const groupEntryTabs: Record<string, string> = {
    overview: 'executive-summary',
    transactions: 'cash-bank',
    receivables: 'accounts-receivable',
    projects: 'project-finance',
    accounting: 'journal'
  };
  const groupItems = FINANCE_WORKBOOK_GROUPS.map((group) => ({
    key: group.key,
    label: group.label,
    to: '/admin/finance?tab=' + (groupEntryTabs[group.key] || group.items[0].key)
  }));
  const sheetItems = activeGroup.items.map((item) => ({
    key: item.key,
    label: item.label,
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

  const renderRecentActivity = (range?: { startDate: string; endDate: string; label: string }) => {
    const activity = range
      ? cashMovements.filter((entry) => {
          const date = String(entry.date || '').slice(0, 10);
          return date >= range.startDate && date <= range.endDate;
        })
      : cashMovements;
    const rows: TableRow[] = activity.slice(0, 8).map((entry) => ({
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
        title={range ? 'Selected-period transaction activity' : 'Recent transaction activity'}
        description={range
          ? (language === 'id'
            ? 'Pergerakan tercatat untuk ' + range.label + '. Nilai berdasarkan transaksi dan belum merupakan rekening koran yang direkonsiliasi.'
            : 'Recorded movements for ' + range.label + '. Values are transaction-based and are not a reconciled bank statement.')
          : (language === 'id'
            ? 'Berasal dari pembayaran invoice dan pengeluaran, penyesuaian bank, serta transfer internal yang tercatat. Ini bukan rekening koran yang diimpor.'
            : 'Derived from invoice payments and expenses, plus explicitly recorded bank adjustments and internal cash transfers. This is not an imported bank statement.')}
        columns={[
          { label: 'Date' }, { label: 'Reference' }, { label: 'Description' }, { label: 'Source' },
          { label: 'Cash in', align: 'right' }, { label: 'Cash out', align: 'right' }
        ]}
        rows={rows}
        emptyMessage={range
          ? (language === 'id' ? 'Tidak ada pergerakan tercatat pada periode pelaporan yang dipilih.' : 'No recorded movements exist for the selected reporting period.')
          : (language === 'id' ? 'Tidak ada aktivitas pembayaran atau pengeluaran dari sumber AMS yang terhubung.' : 'No recorded payment or expense activity is available from the connected AMS sources.')}
      />
    );
  };

  const renderSummary = (dashboard: boolean) => {
    const dashboardRange = getReportingPeriodRange(reportPeriodValue, reportPeriodMode, locale);
    const dashboardPeriodLabel = formatReportingPeriodLabel(reportPeriodValue, reportPeriodMode, locale);
    const invoicesInPeriod = dashboardRange
      ? idrInvoices.filter((invoice) => {
          const date = String(getInvoiceDate(invoice) || '').slice(0, 10);
          return date >= dashboardRange.startDate && date <= dashboardRange.endDate;
        })
      : [];
    const movementsInPeriod = dashboardRange
      ? cashMovements.filter((movement) => {
          const date = String(movement.date || '').slice(0, 10);
          return movement.currency === 'IDR' && date >= dashboardRange.startDate && date <= dashboardRange.endDate;
        })
      : [];
    const billedInPeriod = sumAmounts<AgencyInvoice>(invoicesInPeriod, (invoice) => Number(invoice.total) || 0);
    const cashInThisPeriod = sumAmounts<CashMovement>(movementsInPeriod, (movement) => movement.cashIn);
    const cashOutThisPeriod = sumAmounts<CashMovement>(movementsInPeriod, (movement) => movement.cashOut);
    const metrics = [
      { id: 'billed', label: 'Total billed', value: formatMoney(totalBilled), context: 'IDR issued invoices; non-IDR invoices remain visible in transaction registers', icon: <FileText size={15} /> },
      { id: 'collected', label: 'Total collected', value: formatMoney(totalCollected), context: 'Recorded IDR client payments', icon: <ArrowDown size={15} />, toneClassName: 'text-success' },
      { id: 'receivable', label: 'Outstanding receivables', value: formatMoney(totalOutstanding), context: 'Derived from IDR invoice balances', icon: <WalletCards size={15} />, toneClassName: 'text-warning' },
      { id: 'expenses', label: 'Recorded expenses', value: formatMoney(totalExpenses), context: 'IDR expense records returned by AMS', icon: <ArrowUpRight size={15} />, toneClassName: 'text-series-3' }
    ];
    const dashboardMetrics = [
      { id: 'period-billed', label: 'Invoice value issued', value: formatMoney(billedInPeriod), context: language === 'id' ? dashboardPeriodLabel + ' · invoice IDR diterbitkan' : dashboardPeriodLabel + ' · issued IDR invoices', icon: <FileText size={15} /> },
      { id: 'period-in', label: 'Recorded cash in', value: formatMoney(cashInThisPeriod), context: language === 'id' ? dashboardPeriodLabel + ' · pergerakan IDR bertanggal pada Kas & Bank' : dashboardPeriodLabel + ' · dated IDR movements touching Cash & Bank', icon: <ArrowDown size={15} />, toneClassName: 'text-success' },
      { id: 'period-out', label: 'Recorded cash out', value: formatMoney(cashOutThisPeriod), context: language === 'id' ? dashboardPeriodLabel + ' · pergerakan IDR bertanggal pada Kas & Bank' : dashboardPeriodLabel + ' · dated IDR movements touching Cash & Bank', icon: <ArrowUpRight size={15} />, toneClassName: 'text-series-3' },
      { id: 'period-net', label: 'Net cash movement (proxy)', value: formatMoney(cashInThisPeriod - cashOutThisPeriod), context: 'Recorded movement only; not reconciled closing cash', icon: <CircleDollarSign size={15} /> }
    ];
    const recentInvoices: TableRow[] = [...reportInvoices]
      .filter((invoice) => matchesDate(getInvoiceDate(invoice)))
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
        {dashboard ? (
          <>
            <div className="flex min-w-0 flex-col gap-1" data-ams-slug="finance-dashboard-period">
              <h2 className="text-sm font-semibold text-fg">Selected-period dashboard</h2>
              <p className="text-xs text-muted">Recorded cash movement and invoice activity for {dashboardPeriodLabel}.</p>
            </div>
            <AdminMetricStrip metrics={dashboardMetrics} />
            {renderRecentActivity(dashboardRange ? { startDate: dashboardRange.startDate, endDate: dashboardRange.endDate, label: dashboardPeriodLabel } : undefined)}
          </>
        ) : (
          <>
            <AdminMetricStrip metrics={metrics} />
            <FinanceDataTable
              title="Recent invoice register"
              description={reportPeriodEnabled ? 'Issued invoices within the selected reporting period, with current outstanding balances.' : 'Latest issued invoices with current outstanding balances.'}
              columns={[{ label: 'Invoice no.' }, { label: 'Client' }, { label: 'Issue date' }, { label: 'Invoice value', align: 'right' }, { label: 'Outstanding', align: 'right' }, { label: 'Status' }]}
              rows={recentInvoices}
              emptyMessage="No issued invoices were returned by AMS."
            />
          </>
        )}
      </div>
    );
  };

  const openVendorContractEditor = (vendor?: AgencyVendor, contract?: VendorContract) => {
    const today = getLocalDateInputValue();
    setVendorContractDirty(false);
    setVendorContractError(null);
    setVendorContractEditor({
      vendorId: vendor?.id || '',
      id: contract?.id,
      title: contract?.title || '',
      startDate: contract?.startDate || today,
      endDate: contract?.endDate || '',
      rateType: contract?.rateType || 'project',
      rateAmount: Number(contract?.rateAmount) || 0,
      currency: contract?.currency || 'IDR',
      status: contract?.status || 'active'
    });
  };

  const saveVendorContract = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!vendorContractEditor || vendorContractSaving) return;
    if (!canManageVendorContracts) {
      setVendorContractError('You do not have permission to manage vendor contracts.');
      return;
    }
    const draft = vendorContractEditor;
    const vendor = vendors.find((item) => item.id === draft.vendorId);
    const amount = Number(draft.rateAmount);
    if (!vendor) {
      setVendorContractError('Select a vendor or freelancer before saving the contract.');
      return;
    }
    if (!draft.title.trim() || !draft.startDate || !Number.isFinite(amount) || amount <= 0) {
      setVendorContractError('Contract title, start date, and a positive contract rate are required.');
      return;
    }
    if (draft.endDate && draft.endDate < draft.startDate) {
      setVendorContractError('Contract end date cannot be earlier than its start date.');
      return;
    }
    setVendorContractSaving(true);
    setVendorContractError(null);
    try {
      const id = draft.id || 'cnt_' + Date.now().toString(36);
      const nextContract: VendorContract = {
        id,
        title: draft.title.trim(),
        startDate: draft.startDate,
        endDate: draft.endDate || undefined,
        rateType: draft.rateType,
        rateAmount: amount,
        currency: draft.currency,
        status: draft.status
      };
      const existingContracts = Array.isArray(vendor.contracts) ? vendor.contracts : [];
      const nextContracts = draft.id
        ? existingContracts.map((contract) => contract.id === draft.id ? { ...contract, ...nextContract } : contract)
        : [nextContract, ...existingContracts];
      const response = await api.vendors.update(vendor.id, { ...vendor, contracts: nextContracts, updatedAt: new Date().toISOString() });
      if (!response.success || !response.data?.vendor) {
        throw new Error(response.error || 'The vendor contract could not be saved.');
      }
      const savedVendor = response.data.vendor as AgencyVendor;
      setVendors((current) => current.map((item) => item.id === savedVendor.id ? savedVendor : item));
      setVendorContractEditor(null);
      setVendorContractDirty(false);
      window.dispatchEvent(new Event(VENDOR_EVENT_NAME));
    } catch (error) {
      setVendorContractError(error instanceof Error ? error.message : 'The vendor contract could not be saved.');
    } finally {
      setVendorContractSaving(false);
    }
  };

  const renderVendorContractEditor = () => {
    if (!vendorContractEditor) return null;
    const draft = vendorContractEditor;
    const fieldClass = 'h-10 w-full rounded-control border border-line bg-bg px-3 text-xs text-fg outline-none focus:border-accent';
    const update = (patch: Partial<FinanceVendorContractDraft>) => { setVendorContractDirty(true); setVendorContractEditor((current) => current ? { ...current, ...patch } : current); };
    const vendorOptions = [
      { value: '', label: 'Select vendor / freelancer' },
      ...vendors.map((vendor) => ({ value: vendor.id, label: (vendor.companyName || vendor.name) + ' · ' + vendor.name }))
    ];
    return (
      <Drawer
        open
        onClose={() => { if (!vendorContractSaving) { if (vendorContractDirty) setPendingConfirmation({ kind: 'discard-vendor-contract' }); else { setVendorContractEditor(null); setVendorContractError(null); } } }}
        title={draft.id ? 'Edit vendor contract' : 'Add vendor contract'}
        description="Maintain contract commitments here. Bills and payment installments are managed in Accounts Payable."
        size="xl"
        slug="finance-vendor-contract-editor"
        footer={(
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => { if (vendorContractDirty) setPendingConfirmation({ kind: 'discard-vendor-contract' }); else { setVendorContractEditor(null); setVendorContractError(null); } }} disabled={vendorContractSaving}>Cancel</Button>
            <Button type="submit" form="finance-vendor-contract-form" loading={vendorContractSaving} disabled={vendorContractSaving || !canManageVendorContracts}>{vendorContractSaving ? 'Saving…' : 'Save contract'}</Button>
          </div>
        )}
      >
        <form id="finance-vendor-contract-form" onSubmit={(event) => void saveVendorContract(event)} className="space-y-4 p-1">
          {vendorContractError && <WorkbookNote tone="danger" title="Contract not saved">{vendorContractError}</WorkbookNote>}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted">Vendor / freelancer *</label>
            <CustomSelect value={draft.vendorId} onChange={(value) => update({ vendorId: value })} options={vendorOptions} className="w-full" triggerClassName="h-10 min-h-10 w-full" />
          </div>
          <div>
            <label htmlFor="finance-vendor-contract-title" className="mb-1.5 block text-xs font-medium text-muted">Contract title *</label>
            <input id="finance-vendor-contract-title" required maxLength={180} value={draft.title} onChange={(event) => update({ title: event.target.value })} className={fieldClass} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="finance-vendor-contract-start" className="mb-1.5 block text-xs font-medium text-muted">Start date *</label>
              <CustomDatePicker id="finance-vendor-contract-start" value={draft.startDate} onChange={(startDate) => update({ startDate })} type="date" required locale={locale} className="w-full" triggerClassName="h-10" aria-label="Contract start date" slug="finance-vendor-contract-start" />
            </div>
            <div>
              <label htmlFor="finance-vendor-contract-end" className="mb-1.5 block text-xs font-medium text-muted">End date</label>
              <CustomDatePicker id="finance-vendor-contract-end" value={draft.endDate} onChange={(endDate) => update({ endDate })} type="date" min={draft.startDate} locale={locale} className="w-full" triggerClassName="h-10" aria-label="Contract end date" slug="finance-vendor-contract-end" />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">Rate basis *</label>
              <CustomSelect value={draft.rateType} onChange={(value) => update({ rateType: value as VendorContract['rateType'] })} options={[{ value: 'hourly', label: 'Hourly' }, { value: 'project', label: 'Per project' }, { value: 'monthly_retainer', label: 'Monthly retainer' }]} className="w-full" triggerClassName="h-10 min-h-10 w-full" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">Currency *</label>
              <CustomSelect value={draft.currency} onChange={(value) => update({ currency: value as VendorContract['currency'] })} options={[{ value: 'IDR', label: 'IDR' }, { value: 'USD', label: 'USD' }]} className="w-full" triggerClassName="h-10 min-h-10 w-full" />
            </div>
          </div>
          <div>
            <label htmlFor="finance-vendor-contract-rate" className="mb-1.5 block text-xs font-medium text-muted">Contract rate / value *</label>
            <input id="finance-vendor-contract-rate" type="number" min="1" step="1" required value={draft.rateAmount} onChange={(event) => update({ rateAmount: Number(event.target.value) })} className={fieldClass} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted">Contract status</label>
            <CustomSelect value={draft.status} onChange={(value) => update({ status: value as VendorContract['status'] })} options={[{ value: 'active', label: 'Active' }, { value: 'expired', label: 'Expired' }, { value: 'terminated', label: 'Terminated' }]} className="w-full" triggerClassName="h-10 min-h-10 w-full" />
          </div>
        </form>
      </Drawer>
    );
  };

  const renderView = (tab: FinanceWorkbookTab) => {
    switch (tab.key) {
      case 'executive-summary':
        return renderSummary(false);
      case 'dashboard':
        return renderSummary(true);
      case 'chart-of-accounts': {
        const customAccounts = getRegisterRecords('chart-of-accounts')
          .filter((record) => matching([record.payload.code, record.payload.name, record.payload.accountType, record.payload.normalBalance, record.payload.description]))
          .filter((record) => !EXCEL_CHART_OF_ACCOUNTS.some((account) => account.code === String(record.payload.code || record.recordKey)));
        const baseCodes = new Set(EXCEL_CHART_OF_ACCOUNTS.map((account) => account.code));
        const accountRows = [
          ...EXCEL_CHART_OF_ACCOUNTS.filter((account) => matching([account.code, account.name, account.type, account.description])).map((account) => ({
            id: 'default-' + account.code,
            cells: [account.code, account.name, account.type, account.normalBalance, account.description, <StatusBadge value={account.active ? 'active' : 'inactive'} />, <span className="text-muted">Default</span>]
          })),
          ...customAccounts.filter((record) => !baseCodes.has(String(record.payload.code || record.recordKey))).map((record) => ({
            id: record.id,
            cells: [
              String(record.payload.code || record.recordKey),
              String(record.payload.name || '—'),
              normaliseStatus(record.payload.accountType || '—'),
              normaliseStatus(record.payload.normalBalance || '—'),
              String(record.payload.description || '—'),
              <StatusBadge value={record.payload.active === false ? 'inactive' : 'active'} />,
              registerRecordActions('chart-of-accounts', record)
            ]
          }))
        ];
        return (
          <div className="space-y-4">
            <WorkbookNote title="Chart of Accounts">
              Default accounts remain fixed for consistent finance reporting. Create and edit additional agency-specific accounts here. Existing report calculations are not changed by adding an account; account posting and reporting mappings must be supported before it is treated as a reconciled ledger source.
            </WorkbookNote>
            <FinanceDataTable
              title="Chart of Accounts"
              description="Account codes and normal balances used by finance records. Default accounts are reference-only; custom accounts can be managed here."
              columns={[{ label: 'Account code' }, { label: 'Account name' }, { label: 'Account type' }, { label: 'Normal balance' }, { label: 'Description' }, { label: 'Status' }, { label: 'Management' }]}
              rows={accountRows}
              emptyMessage="No chart-of-account rows match the current search."
              actions={registerAddButton('chart-of-accounts', 'Add account')}
            />
          </div>
        );
      }
      case 'revenue':
        return <AdminInvoicing key={tab.key} embeddedView="invoices" />;
      case 'expenses':
        return <AdminInvoicing key={tab.key} embeddedView="income-expenses" embeddedIncomeExpenseMode="expenses" />;
      case 'cash-bank': {
        const openingRecord = getOpeningRecord('1000');
        const opening = openingRecord ? Number(openingRecord.payload.openingBalance) || 0 : null;
        const openingDate = String(openingRecord?.payload.openingDate || '').slice(0, 10);
        const cashRows = cashMovements
          .filter((entry) => entry.currency === 'IDR' && entry.accountCode === '1000' && (!openingDate || entry.date.slice(0, 10) >= openingDate))
          .slice().sort((a,b) => a.date.localeCompare(b.date));
        let running = opening ?? 0;
        const allCashLedgerRows = cashRows.map((entry) => {
          running += entry.cashIn - entry.cashOut;
          return {
            id: entry.id,
            date: entry.date,
            search: [entry.date,entry.reference,entry.description,entry.source],
            cells: [formatDate(entry.date),entry.reference,entry.description,entry.source,entry.cashIn ? formatMoney(entry.cashIn) : '—',entry.cashOut ? formatMoney(entry.cashOut) : '—',(opening === null ? '—' : formatMoney(running))]
          };
        });
        const rows = allCashLedgerRows.filter((row) => matchesDate(row.date) && matching(row.search)).reverse();
        const selectedCashRange = reportPeriodEnabled ? getReportingPeriodRange(reportPeriodValue, reportPeriodMode) : null;
        const cashKpiRows = selectedCashRange
          ? cashRows.filter((entry) => /^\d{4}-\d{2}-\d{2}$/.test(entry.date) && entry.date >= selectedCashRange.startDate && entry.date <= selectedCashRange.endDate)
          : cashRows;
        const totalIn = sumAmounts<CashMovement>(cashKpiRows, (entry) => entry.cashIn);
        const totalOut = sumAmounts<CashMovement>(cashKpiRows, (entry) => entry.cashOut);
        const cashBalanceRows = selectedCashRange
          ? cashRows.filter((entry) => /^\d{4}-\d{2}-\d{2}$/.test(entry.date) && entry.date <= selectedCashRange.endDate)
          : cashRows;
        const closingBalanceAvailable = opening !== null && !(selectedCashRange && openingDate && selectedCashRange.endDate < openingDate);
        const periodClosingBalance = closingBalanceAvailable
          ? opening! + sumAmounts<CashMovement>(cashBalanceRows, (entry) => entry.cashIn - entry.cashOut)
          : null;
        const reconciliationMonth = (selectedCashRange?.endDate || getLocalDateInputValue()).slice(0,7);
        const reconciliationMonthEnd = new Date(Date.UTC(Number(reconciliationMonth.slice(0,4)),Number(reconciliationMonth.slice(5,7)),0)).toISOString().slice(0,10);
        const reconciliableAccounts = new Set(['1000','1010','1100','1200']);
        const postedJournalRecords = getRegisterRecords('journal-entry').filter((record) => record.status === 'posted');
        const postedBalanceAsOf = (accountCode: string, asOfDate: string) => {
          let balance = 0;
          for (const journal of postedJournalRecords) {
            const date = String(journal.payload.date || '').slice(0,10);
            if (!date || date > asOfDate) continue;
            const lines = Array.isArray(journal.payload.lines) ? journal.payload.lines as Array<Record<string,any>> : [];
            for (const line of lines) if (String(line.accountCode || '') === accountCode) {
              balance += (Number(line.debit) || 0) - (Number(line.credit) || 0);
            }
          }
          return Math.round(balance * 100) / 100;
        };
        const requiredReconAccounts = new Set<string>(['1000']);
        for (const journal of postedJournalRecords) {
          const date = String(journal.payload.date || '').slice(0,10);
          if (!date || date.slice(0,7) !== reconciliationMonth) continue;
          const lines = Array.isArray(journal.payload.lines) ? journal.payload.lines as Array<Record<string,any>> : [];
          for (const line of lines) {
            const code = String(line.accountCode || '');
            if (reconciliableAccounts.has(code)) requiredReconAccounts.add(code);
          }
        }
        for (const code of reconciliableAccounts) {
          if (Math.abs(postedBalanceAsOf(code,reconciliationMonthEnd)) > 0.01) requiredReconAccounts.add(code);
        }
        const savedReconciliations = getRegisterRecords('cash-reconciliation').filter((record) => String(record.payload.reconciliationMonth || record.periodKey || '') === reconciliationMonth);
        const reconciliationByAccount = new Map(savedReconciliations.map((record) => [String(record.payload.accountCode || ''),record]));
        const reconciliationDiffs = [...requiredReconAccounts].map((code) => {
          const record = reconciliationByAccount.get(code);
          if (!record) return { code, record: undefined, ledger: postedBalanceAsOf(code,reconciliationMonthEnd), statement: null, difference: null };
          const statement = Number(record.payload.statementBalance) || 0;
          const ledger = postedBalanceAsOf(code,String(record.payload.statementDate || reconciliationMonthEnd));
          return { code, record, ledger, statement, difference: Math.round((ledger-statement)*100)/100 };
        });
        const reconciledCount = reconciliationDiffs.filter((item) => item.record && item.difference !== null && Math.abs(item.difference) <= 0.01).length;
        const openReconCount = reconciliationDiffs.filter((item) => !item.record || item.difference === null || Math.abs(item.difference) > 0.01).length;
        const reconciliationAccountName = (code: string) =>
          EXCEL_CHART_OF_ACCOUNTS.find((account) => account.code === code)?.name
          || getRegisterRecords('chart-of-accounts').find((record) => String(record.payload.code || record.recordKey) === code)?.payload.name
          || code;
        return (
          <div className="space-y-4">
            <WorkbookNote tone={opening === null ? 'warning' : 'info'} title={opening === null ? 'Cash ledger needs its opening balance' : 'Cash ledger is connected to its opening balance'}>
              {opening === null
                ? 'Set the 1000 Cash & Bank opening balance before treating a running balance as meaningful. Only invoice receipts mapped to account 1000, paid expenses with an explicit 1000 settlement account, and bank-side movements appear here. This is not a bank-statement reconciliation.'
                : 'Opening balance comes from the saved finance register. Paid expenses must record the actual paid date and settlement account; internal transfers are shown on the bank ledger but excluded from consolidated cash-flow movement. Reconcile to the bank statement before closing the month.'}
            </WorkbookNote>
            <AdminMetricStrip metrics={[
              {id:'cash-opening',label:'Opening balance',value:opening === null ? 'Not set' : formatMoney(opening),context:openingDate ? 'Account 1000 · from ' + formatDate(openingDate) : 'Account 1000 · Cash & Bank',icon:<Landmark size={15}/>},
              {id:'cash-in',label:'Recorded cash in',value:formatMoney(totalIn),context:reportPeriodEnabled ? 'Dated movements in selected period' : 'Dated movements in loaded source records',icon:<ArrowDown size={15}/>},
              {id:'cash-out',label:'Recorded cash out',value:formatMoney(totalOut),context:reportPeriodEnabled ? 'Dated movements in selected period' : 'Dated movements in loaded source records',icon:<ArrowUpRight size={15}/>},
              {id:'cash-closing',label:reportPeriodEnabled ? 'Provisional period-end balance' : 'Provisional balance',value:periodClosingBalance === null ? 'Not available' : formatMoney(periodClosingBalance),context:'Opening balance plus recorded movements through period end; unreconciled',icon:<WalletCards size={15}/>},
              {id:'cash-recon-complete',label:'Reconciled accounts',value:reconciledCount+' / '+reconciliationDiffs.length,context:'Month-end · '+reconciliationMonth,icon:<ShieldAlert size={15}/>},
              {id:'cash-recon-open',label:'Reconciliation exceptions',value:String(openReconCount),context:'Missing statement evidence or non-zero difference',icon:<CircleDollarSign size={15}/>}
            ]}/>
            <FinanceDataTable
              title="Cash & Bank ledger"
              description="Transactions stay linked to their AMS source. Use this register for manual adjustments and internal transfers."
              columns={[{label:'Date'},{label:'Reference'},{label:'Description'},{label:'Source'},{label:'Cash in',align:'right'},{label:'Cash out',align:'right'},{label:'Running balance',align:'right'}]}
              rows={rows.map((row) => ({...row}))}
              emptyMessage="No dated cash movement is available. Set an opening balance or record a movement."
              actions={<div className="flex flex-wrap gap-2">{registerAddButton('cash-bank-transaction','Add movement')}{canManageFinanceRecords && <Button type="button" variant="secondary" onClick={() => openCashOpeningForm('1000')}>{opening === null ? 'Set opening balance' : 'Edit opening balance'}</Button>}</div>}
            />
            <WorkbookNote tone={openReconCount ? 'warning' : 'info'} title={openReconCount ? 'Month-end reconciliation is incomplete' : 'Month-end balances are reconciled'}>
              Reconciliation month: {reconciliationMonth}. Compare every required cash, bank or clearing account to the actual bank statement, processor statement or physical cash count at month end. The server independently validates these records and blocks closing if evidence is missing or the posted ledger differs.
            </WorkbookNote>
            <FinanceDataTable
              title={'Statement reconciliation · '+reconciliationMonth}
              description="The variance is posted General Ledger balance less the recorded statement or counted balance. Save evidence for account 1000 every month and for other cash/clearing accounts with activity or a non-zero balance."
              columns={[{label:'Account'},{label:'Statement / count date'},{label:'Statement / counted balance',align:'right'},{label:'Posted GL balance',align:'right'},{label:'Difference',align:'right'},{label:'Evidence reference'},{label:'Status'},{label:'Actions'}]}
              rows={reconciliationDiffs.map((item) => ({
                id: item.code,
                cells: [
                  item.code+' · '+String(reconciliationAccountName(item.code)),
                  item.record ? formatDate(item.record.payload.statementDate) : 'Missing',
                  item.statement === null ? '—' : formatMoney(item.statement),
                  formatMoney(item.ledger),
                  item.difference === null ? '—' : formatMoney(item.difference),
                  String(item.record?.payload.statementReference || 'No evidence'),
                  !item.record ? <AdminStatusBadge tone="warning">Missing</AdminStatusBadge> : Math.abs(Number(item.difference)||0)<=0.01 ? <AdminStatusBadge tone="success">Reconciled</AdminStatusBadge> : <AdminStatusBadge tone="danger">Difference</AdminStatusBadge>,
                  item.record ? registerRecordActions('cash-reconciliation',item.record) : canManageFinanceRecords ? <Button variant="primary" type="button" onClick={() => openRegisterForm('cash-reconciliation',undefined,{reconciliationMonth,statementDate:reconciliationMonthEnd,accountCode:item.code})}>Record evidence</Button> : <span className="text-muted">View only</span>
                ]
              }))}
              emptyMessage="No cash/bank account has a posted balance to reconcile for this month."
              actions={registerAddButton('cash-reconciliation','Record reconciliation',{reconciliationMonth,statementDate:reconciliationMonthEnd})}
            />
          </div>
        );
      }
      case 'accounts-receivable':
        return <AdminInvoicing key={tab.key} embeddedView="receivables" />;
      case 'accounts-payable': {
        const bills = getRegisterRecords('vendor-bill').filter((record) => matchesDate(record.payload.billDate || record.payload.dueDate || record.createdAt) && matching([
          record.recordKey, record.payload.billNo, record.payload.vendorName, record.payload.projectName, record.payload.dueDate, record.payload.paymentStatus
        ]));
        const payableTotalIDR = sumAmounts<WorkbookRecord>(
          bills.filter((record) => String(record.payload.currency || 'IDR') === 'IDR'),
          (record) => Math.max(
            0,
            Number(record.payload.outstanding ?? ((Number(record.payload.total) || 0) - (Number(record.payload.paidAmount) || 0))) || 0
          )
        );
        const foreignCurrencyBillCount = bills.filter((record) => String(record.payload.currency || 'IDR') !== 'IDR').length;
        const vendorPayments = getRegisterRecords('vendor-bill-payment');
        const scheduleRows = bills.map((bill) => {
          const billPayments = vendorPayments.filter((payment) => String(payment.payload.billId || '') === bill.id);
          const schedule = getVendorBillInstallmentSchedule(
            Number(bill.payload.total) || 0,
            billPayments.map((payment) => ({
              id: payment.id,
              amount: payment.payload.amount,
              installmentNumber: payment.payload.installmentNumber,
              paidDate: payment.payload.paidDate
            })),
            Array.isArray(bill.payload.paymentSchedule) ? bill.payload.paymentSchedule as number[] : undefined
          );
          const currency = String(bill.payload.currency || 'IDR');
          const paid = sumAmounts<WorkbookRecord>(billPayments, (payment) => Number(payment.payload.amount) || 0);
          const total = Number(bill.payload.total) || 0;
          const next = schedule.find((installment) => installment.outstanding > 0.01);
          const installmentDueDates = Array.isArray(bill.payload.installmentDueDates) ? bill.payload.installmentDueDates as string[] : [];
          const stageCell = (installment: typeof schedule[number]) => {
            const dueDate = String(installmentDueDates[installment.number - 1] || bill.payload.dueDate || '');
            return (
              <div className="min-w-[112px] space-y-0.5">
                <div className="font-medium tabular-nums">{formatMoney(installment.amount, currency)}</div>
                <div className="text-[11px] text-muted tabular-nums">{installment.percentage}% · Paid {formatMoney(installment.paidAmount, currency)}</div>
                <div className="text-[11px] text-muted tabular-nums">Outstanding {formatMoney(installment.outstanding, currency)}</div>
                <div className="text-[11px] text-muted">Due {formatDate(dueDate)}{installmentDueDates[installment.number - 1] ? '' : ' · overall due date'}</div>
              </div>
            );
          };
          return {
            id: bill.id,
            cells: [
              String(bill.payload.billNo || bill.recordKey),
              String(bill.payload.vendorName || '—'),
              String(bill.payload.projectName || bill.projectId || '—'),
              formatMoney(total, currency),
              stageCell(schedule[0]),
              stageCell(schedule[1]),
              stageCell(schedule[2]),
              formatMoney(paid, currency),
              formatMoney(Math.max(0, total - paid), currency),
              next ? 'Payment ' + next.number + ' · ' + next.percentage + '%' : 'Complete',
              <StatusBadge value={bill.payload.paymentStatus || bill.status} />
            ]
          };
        });
        return (
          <div className="space-y-4">
            <WorkbookNote title="Vendor bills and linked payments determine payable balances">
              Vendor contracts describe commitments. Accounts Payable is now kept in a separate persistent register; each bill can carry its own due date and payment schedule. Linked expenses remain source records and are not silently converted into bills.
            </WorkbookNote>
            <AdminMetricStrip metrics={[
              {id:'ap-bills',label:'Vendor bills',value:String(bills.length),context:'Saved finance register',icon:<FileText size={15}/>},
              {id:'ap-total',label:'IDR outstanding',value:formatMoney(payableTotalIDR),context:foreignCurrencyBillCount+' non-IDR bills listed separately',icon:<WalletCards size={15} />}
            ]}/>
            <FinanceDataTable
              title="Accounts Payable register"
              description="Outstanding uses the saved bill balance when available, with the stored paid amount as a legacy fallback. The installment schedule uses linked payment records."
              columns={[{label:'Bill no.'},{label:'Vendor'},{label:'Project'},{label:'Bill date'},{label:'Due date'},{label:'Bill amount',align:'right'},{label:'Paid',align:'right'},{label:'Outstanding',align:'right'},{label:'Status'},{label:'Actions'}]}
              rows={bills.map((record)=> {
                const total = Number(record.payload.total)||0;
                const paid = Number(record.payload.paidAmount)||0;
                const outstanding = Math.max(0,Number(record.payload.outstanding ?? (total-paid))||0);
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
                    registerRecordActions('vendor-bill',record, outstanding>0 && canManageFinanceRecords ? <Button variant="primary" type="button" icon={<Plus size={14} />} onClick={()=>openRegisterForm('vendor-bill-payment',undefined,{billId:record.id,paidDate:getLocalDateInputValue(),amount:outstanding})}>Record payment</Button> : undefined)
                  ]
                };
              })}
              emptyMessage="No vendor bills have been recorded yet."
              actions={registerAddButton('vendor-bill','Add vendor bill')}
            />
            {bills.length > 0 && (
              <FinanceDataTable
                title="Vendor payment schedule"
                description="Installments use each bill's saved payment schedule and linked payment records. Review the overall due date in the Accounts Payable register."
                columns={[
                  { label: 'Bill no.' }, { label: 'Vendor' }, { label: 'Project' }, { label: 'Bill amount', align: 'right' },
                  { label: 'Payment 1' }, { label: 'Payment 2' }, { label: 'Payment 3' },
                  { label: 'Total paid', align: 'right' }, { label: 'Outstanding', align: 'right' }, { label: 'Next payment' }, { label: 'Status' }
                ]}
                rows={scheduleRows}
                emptyMessage="No vendor bills have been entered. Create a bill to see its payment schedule."
              />
            )}
            <WorkbookNote title="Contract-linked vendor payments">
              Use this register for payments planned against vendor contracts. These records remain linked to their contract and expense evidence; they do not settle a vendor bill in the Accounts Payable register above. Record bill settlements against the bill itself so the bill balance and installment schedule stay accurate.
            </WorkbookNote>
            <AdminInvoicing embeddedView="vendor-payments" />
          </div>
        );
      }
      case 'vendors': {
        const contractRows = vendors.flatMap((vendor) => (
          (Array.isArray(vendor.contracts) ? vendor.contracts : [])
            .filter((contract) => matchesInterval(contract.startDate, contract.endDate, (contract as any).createdAt) && matching([vendor.name, vendor.companyName, contract.title, contract.rateType, contract.startDate, contract.endDate, contract.status, contract.rateAmount]))
            .map((contract) => {
              const linkedExpenses = expenses.filter((expense) => {
                const expenseRecord = expense as AgencyExpense & { vendorContractId?: string; vendorPayment?: { vendorId?: string; contractId?: string }; metadata?: { vendorPayment?: { vendorId?: string; contractId?: string } } };
                const structured = expenseRecord.vendorPayment || expenseRecord.metadata?.vendorPayment;
                const linkedToContract = (expenseRecord.vendorId === vendor.id && expenseRecord.vendorContractId === contract.id)
                  || (structured?.vendorId === vendor.id && structured?.contractId === contract.id)
                  || expense.description.startsWith('[VENDOR_PAYMENT]|' + vendor.id + '|' + contract.id + '|');
                return linkedToContract && matchesDate(expense.date);
              });
              return {
                id: vendor.id + '-' + contract.id,
                cells: [
                  vendor.companyName || vendor.name,
                  contract.title,
                  formatDate(contract.startDate) + (contract.endDate ? ' – ' + formatDate(contract.endDate) : ' · Ongoing'),
                  normaliseStatus(contract.rateType),
                  formatMoney(Number(contract.rateAmount) || 0, contract.currency),
                  String(linkedExpenses.length) + ' · ' + formatMoney(sumAmounts<AgencyExpense>(linkedExpenses, (expense) => Number(expense.amount) || 0), contract.currency),
                  <StatusBadge value={contract.status} />,
                  canManageVendorContracts
                    ? <Button variant="secondary" type="button" onClick={() => openVendorContractEditor(vendor, contract)}>Edit</Button>
                    : <span className="text-muted">View only</span>
                ]
              };
            })
        ));
        return (
          <div className="space-y-4">
            <AdminVendors embedded searchTerm={searchText} />
            <FinanceDataTable
              title="Vendor contract register"
              description="Manage contract scope, dates, rate basis, value, and lifecycle here. Vendor bills and their installment schedule remain in Accounts Payable."
              columns={[{ label: 'Vendor' }, { label: 'Contract' }, { label: 'Contract period' }, { label: 'Rate basis' }, { label: 'Rate / value', align: 'right' }, { label: 'Linked expense records' }, { label: 'Status' }, { label: 'Actions' }]}
              rows={contractRows}
              emptyMessage="No vendor contracts match the current search. Add a contract to keep commitments visible."
              actions={canManageVendorContracts ? <Button variant="primary" type="button" icon={<Plus size={14} />} onClick={() => openVendorContractEditor()}>Add contract</Button> : undefined}
            />
          </div>
        );
      }
      case 'project-finance': {
        const financeRecords=getRegisterRecords('project-finance');
        const vendorBills=getRegisterRecords('vendor-bill');
        const vendorBillPayments=getRegisterRecords('vendor-bill-payment');
        const periodLabel=formatReportingPeriodLabel(reportPeriodValue,reportPeriodMode,locale);
        const rows=projects.filter((project)=>matching([project.name,project.clientCompany,project.clientName,project.status])).map((project)=>{
          const record=getProjectFinanceRecord(project);
          const projectInvoices=reportInvoices.filter((invoice)=>invoice.projectId===project.id&&matchesDate(invoice.issueDate||invoice.createdAt));
          const projectExpenses=expenses.filter((expense)=>expense.projectId===project.id&&matchesDate(expense.date));
          const projectBills=vendorBills.filter((bill)=>
            String(bill.projectId||bill.payload.projectId||'')===project.id ||
            String(bill.payload.projectName||'').trim().toLowerCase()===String(project.name||'').trim().toLowerCase()
          );
          const payload=record?.payload||{};
          const billedIDR=sumAmounts<AgencyInvoice>(projectInvoices.filter((invoice)=>(invoice.currency||'IDR')==='IDR'),(invoice)=>Math.max(0,(Number(invoice.total)||0)-(Number(invoice.taxAmount)||0)));
          const collectedPayments: Array<{ amount: number }> = projectInvoices
            .filter((invoice)=>(invoice.currency||'IDR')==='IDR')
            .flatMap((invoice)=>getPaymentRows(invoice)
              .filter((payment)=>matchesDate(payment.date))
              .map((payment)=>({amount:Number(payment.amount)||0})));
          const collectedIDR=sumAmounts<{amount:number}>(collectedPayments,(payment)=>payment.amount);
          const costsIDR=sumAmounts<AgencyExpense>(projectExpenses.filter((expense)=>String((expense as any).currency||'IDR')==='IDR'),(expense)=>Number(expense.amount)||0);
          const vendorCommitment=record?Number(payload.vendorCommitment)||0:null;
          const otherObligations=record?Number(payload.otherObligations)||0:null;
          const apOutstandingIDR=sumAmounts(projectBills.filter((bill)=>String(bill.payload.currency||'IDR')==='IDR'),(bill)=>{
            const linkedPayments=vendorBillPayments.filter((payment)=>String(payment.payload.billId||'')===bill.id);
            const paid=sumAmounts(linkedPayments,(payment)=>Number(payment.payload.amount)||0);
            return Math.max(0,(Number(bill.payload.total)||0)-paid);
          });
          const contractValue=record?Number(payload.contractValue)||0:null;
          return {id:project.id,cells:[
            projectLabel(project),project.clientCompany||project.clientName||'—',
            contractValue===null?<AdminStatusBadge tone="warning">Setup required</AdminStatusBadge>:formatMoney(contractValue),
            vendorCommitment===null?'—':formatMoney(vendorCommitment),
            otherObligations===null?'—':formatMoney(otherObligations),
            formatMoney(billedIDR),formatMoney(collectedIDR),formatMoney(costsIDR),formatMoney(apOutstandingIDR),
            <StatusBadge value={project.status}/>,
            record?registerRecordActions('project-finance',record):canManageFinanceRecords?<Button variant="primary" type="button" icon={<Plus size={14} />} onClick={()=>openRegisterForm('project-finance',undefined,{projectId:project.id,projectName:project.name,clientName:project.clientCompany||project.clientName,startDate:project.startDate,endDate:project.targetEndDate,projectStatus:project.status})}>Configure</Button>:<span className="text-muted">View only</span>
          ]};
        });
        const orphanRecords=financeRecords.filter((record)=>!projects.some((project)=>(record.projectId&&record.projectId===project.id)||String(record.payload.projectName||'').toLowerCase()===String(project.name||'').toLowerCase())&&matching([record.payload.projectName,record.recordKey,record.projectId,record.payload.clientName,record.status]));
        return (
          <div className="space-y-4">
            <WorkbookNote title="Project finance and source coverage">
              Contract value, vendor commitment and other obligations are planning inputs stored once in Project Finance. Billed revenue, dated collections and recorded expenses follow the selected reporting period ({periodLabel}) and use linked AMS source records. Current AP outstanding is shown separately from vendor commitment to avoid treating the same supplier obligation as both a commitment and a paid cost. Collections without dated payment records are not assigned to a reporting month.
            </WorkbookNote>
            <FinanceDataTable title="Project Finance" description="Period performance and current supplier exposure by AMS project. Contract and commitment fields remain the saved planning values; period activity comes from linked records." columns={[{label:'Project'},{label:'Client'},{label:'Contract value',align:'right'},{label:'Vendor commitment',align:'right'},{label:'Other obligations',align:'right'},{label:'Billed ex. tax · period',align:'right'},{label:'Collected · period',align:'right'},{label:'Recorded expenses · period',align:'right'},{label:'AP outstanding · current',align:'right'},{label:'Project status'},{label:'Setup / actions'}]} rows={rows} emptyMessage="No AMS projects were returned. Finance records can be saved and linked when a project is available." actions={registerAddButton('project-finance','Add project finance record')}/>
            {orphanRecords.length>0&&<FinanceDataTable title="Unlinked project finance records" description="These records remain visible until they can be linked to the correct AMS project." columns={[{label:'Project key'},{label:'Contract value',align:'right'},{label:'Vendor commitment',align:'right'},{label:'Other obligations',align:'right'},{label:'Status'},{label:'Actions'}]} rows={orphanRecords.map((record)=>({id:record.id,cells:[String(record.payload.projectName||record.recordKey),formatMoney(Number(record.payload.contractValue)||0),formatMoney(Number(record.payload.vendorCommitment)||0),formatMoney(Number(record.payload.otherObligations)||0),<StatusBadge value={record.status}/>,registerRecordActions('project-finance',record)]}))}/>}
          </div>
        );
      }
      case 'operational-budget': {
        const budgetRecords = getRegisterRecords('operational-budget');
        const actualByMonthCategory = new Map<string,{month:string;category:string;projectId:string;amount:number;count:number}>();
        for (const expense of expenses) {
          const month = getMonthKey(expense.date);
          if (!month) continue;
          const category = String(expense.category || 'Unclassified');
          const projectId = String(expense.projectId || '');
          const key = month + '|' + category.toLowerCase() + '|' + (projectId || 'company');
          const current = actualByMonthCategory.get(key) || { month, category, projectId, amount: 0, count: 0 };
          current.amount += Number(expense.amount) || 0;
          current.count += 1;
          actualByMonthCategory.set(key, current);
        }
        const budgetKey = (record: WorkbookRecord) => String(record.payload.month || record.periodKey || '') + '|' + String(record.payload.category || '').toLowerCase() + '|' + (String(record.payload.projectId || record.projectId || '') || 'company');
        const keys = new Set<string>([
          ...budgetRecords.map(budgetKey),
          ...actualByMonthCategory.keys()
        ]);
        const records = [...keys].map((key) => {
          const [month, categoryKey, projectIdKey = 'company'] = key.split('|');
          const projectId = projectIdKey === 'company' ? '' : projectIdKey;
          const budgetRecord = budgetRecords.find((record) =>
            String(record.payload.month || record.periodKey || '') === month
            && String(record.payload.category || '').toLowerCase() === categoryKey
            && (String(record.payload.projectId || record.projectId || '') || 'company') === projectIdKey
          );
          const actual = actualByMonthCategory.get(key);
          const recordProjectId = String(budgetRecord?.payload.projectId || budgetRecord?.projectId || actual?.projectId || '');
          const projectName = projects.find((project) => project.id === recordProjectId)?.name || String(budgetRecord?.payload.projectName || '') || recordProjectId || 'Company-wide';
          return {
            key, month, category: String(budgetRecord?.payload.category || actual?.category || categoryKey),
            projectId: recordProjectId, projectName, budgetRecord,
            budget: Number(budgetRecord?.payload.budgetAmount) || 0, actual: actual?.amount || 0, count: actual?.count || 0,
            pic: String(budgetRecord?.payload.pic || ''), notes: String(budgetRecord?.payload.notes || '')
          };
        }).filter((item) => item.month && matchesDate(item.month + '-01') && matching([item.month,item.category,item.projectName,item.projectId,item.pic,item.notes]))
          .sort((a,b) => b.month.localeCompare(a.month) || a.projectName.localeCompare(b.projectName) || a.category.localeCompare(b.category));
        return (
          <div className="space-y-4">
            <WorkbookNote title="Monthly budget versus actual">
              Budget lines and actual expenses are compared by month, category and project. Expenses without a project remain in the company-wide bucket instead of being silently mixed into a project's budget.
            </WorkbookNote>
            <FinanceDataTable
              title="Operational Budget"
              description="Variance is budget less recorded expense actual for the same calendar month, expense category and project."
              columns={[{label:'Month'},{label:'Category'},{label:'Project'},{label:'PIC'},{label:'Budget',align:'right'},{label:'Actual',align:'right'},{label:'Variance',align:'right'},{label:'Expense rows',align:'right'},{label:'Actions'}]}
              rows={records.map((item) => ({
                id: item.key,
                cells: [
                  item.month,item.category || '—',item.projectName,item.pic || '—',
                  item.budgetRecord ? formatMoney(item.budget) : <AdminStatusBadge tone="warning">Budget not set</AdminStatusBadge>,
                  formatMoney(item.actual),
                  item.budgetRecord ? formatMoney(item.budget-item.actual) : '—',
                  String(item.count),
                  item.budgetRecord ? registerRecordActions('operational-budget',item.budgetRecord) : canManageFinanceRecords
                    ? <Button variant="primary" type="button" icon={<Plus size={14} />} onClick={() => openRegisterForm('operational-budget',undefined,{month:item.month,category:item.category,projectId:item.projectId})}>Set budget</Button>
                    : <span className="text-muted">View only</span>
                ]
              }))}
              emptyMessage="No budget lines or dated expense records exist for the current search."
              actions={registerAddButton('operational-budget','Add budget line',{month:defaultFinanceMonth})}
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
          return {id:movement.id,date:movement.date,search:[movement.date,movement.reference,movement.description,movement.status,movement.source],cells:[formatDate(movement.date),movement.reference,movement.description,movement.cashIn?formatMoney(movement.cashIn):'—',movement.cashOut?formatMoney(movement.cashOut):'—',(opening===null?'—':formatMoney(running)),<StatusBadge value={movement.status}/>,movement.record?registerRecordActions(movement.source==='Petty cash voucher'?'petty-cash-voucher':'cash-bank-transaction',movement.record):movement.source]};
        });
        const rows=allPettyLedgerRows.filter((row)=>matchesDate(row.date)&&matching(row.search)).reverse();
        const pending=vouchers.filter((record)=>['pending','approved'].includes(String(record.payload.status||record.status))).length;
        const postedPettyMovements=ledgerMovements.filter((movement)=>movement.source==='Internal cash transfer'||movement.status==='posted');
        const selectedPettyRange = reportPeriodEnabled ? getReportingPeriodRange(reportPeriodValue, reportPeriodMode) : null;
        const pettyCashKpiMovements = selectedPettyRange
          ? postedPettyMovements.filter((movement) => /^\d{4}-\d{2}-\d{2}$/.test(movement.date) && movement.date >= selectedPettyRange.startDate && movement.date <= selectedPettyRange.endDate)
          : postedPettyMovements;
        const totalIn=sumAmounts<typeof postedPettyMovements[number]>(pettyCashKpiMovements,(movement)=>movement.cashIn);
        const totalOut=sumAmounts<typeof postedPettyMovements[number]>(pettyCashKpiMovements,(movement)=>movement.cashOut);
        return (
          <div className="space-y-4">
            <WorkbookNote tone={opening===null?'warning':'info'} title={opening===null?'Petty cash needs an opening balance':'Petty cash register connected'}>
              Only posted vouchers affect the petty-cash ledger. Pending/approved vouchers remain visible in workflow but do not change the running balance. The ledger starts at the saved opening date; earlier movements are excluded from the opening-balance roll-forward. Internal transfers are shared with Cash & Bank and are not treated as an expense by themselves.
            </WorkbookNote>
            <AdminMetricStrip metrics={[
              {id:'petty-opening',label:'Opening balance',value:opening===null?'Not set':formatMoney(opening),context:'Account 1100 · Petty Cash Reserve',icon:<WalletCards size={15}/>},
              {id:'petty-in',label:'Posted cash in',value:formatMoney(totalIn),context:reportPeriodEnabled ? 'Posted movements in selected period' : 'Posted voucher receipts',icon:<ArrowDown size={15}/>},
              {id:'petty-out',label:'Posted cash out',value:formatMoney(totalOut),context:reportPeriodEnabled ? 'Posted movements in selected period' : 'Posted voucher expenses',icon:<ArrowUpRight size={15}/>},
              {id:'petty-pending',label:'Pending approval',value:String(pending),context:'Vouchers awaiting approve/post',icon:<ShieldAlert size={15}/>}
            ]}/>
            <FinanceDataTable title="Petty Cash Ledger" description="Voucher movements and internal cash transfers, sorted by date." columns={[{label:'Date'},{label:'Voucher / reference'},{label:'Description'},{label:'Cash in',align:'right'},{label:'Cash out',align:'right'},{label:'Running balance',align:'right'},{label:'Status'},{label:'Actions'}]} rows={rows} emptyMessage="No petty-cash vouchers or transfers are recorded." actions={<div className="flex flex-wrap gap-2">{registerAddButton('petty-cash-voucher','Add voucher')}{canManageFinanceRecords && <><Button variant="secondary" type="button" onClick={()=>openRegisterForm('cash-bank-transaction',undefined,{transactionKind:'bank-to-petty-cash',accountCode:'1000',counterpartAccountCode:'1100',direction:'out',description:'Petty cash top-up'})}>Top up from bank</Button><Button variant="secondary" type="button" onClick={()=>openCashOpeningForm('1100')}>{opening===null?'Set opening balance':'Edit opening balance'}</Button></>}</div>}/>
          </div>
        );
      }
      case 'monthly-pnl': {
        const getPnlForPeriod = (periodValue: string) => {
          const range = getReportingPeriodRange(periodValue, reportPeriodMode, locale);
          const periodInvoices = range ? idrInvoices.filter((invoice) => {
            const month = getMonthKey(getInvoiceDate(invoice));
            return month >= range.startMonth && month <= range.endMonth;
          }) : [];
          const periodExpenses = range ? idrExpenses.filter((expense) => {
            const month = getMonthKey(expense.date);
            return month >= range.startMonth && month <= range.endMonth;
          }) : [];
          const classTotals: Record<WorkbookExpenseClass, number> = {
            directProjectCost: 0,
            teamReward: 0,
            projectTeamFee: 0,
            operatingExpense: 0,
            unclassified: 0
          };
          for (const expense of periodExpenses) classTotals[classifyWorkbookExpense(expense)] += Number(expense.amount) || 0;
          const revenue = sumAmounts<AgencyInvoice>(periodInvoices, (invoice) => Math.max(0, (Number(invoice.total) || 0) - (Number(invoice.taxAmount) || 0)));
          const classifiedExpense = classTotals.directProjectCost + classTotals.teamReward + classTotals.projectTeamFee + classTotals.operatingExpense;
          const grossProfit = revenue - classTotals.directProjectCost;
          const netPreview = grossProfit - classTotals.teamReward - classTotals.projectTeamFee - classTotals.operatingExpense;
          return { range, invoices: periodInvoices, expenses: periodExpenses, revenue, classTotals, classifiedExpense, grossProfit, netPreview };
        };
        const currentPnl = getPnlForPeriod(reportPeriodValue);
        const currentPnlRange = getReportingPeriodRange(reportPeriodValue, reportPeriodMode, locale);
        const postedLedger = currentPnlRange
          ? getPostedLedgerIncomeStatement(currentPnlRange.startDate, currentPnlRange.endDate)
          : { revenue: 0, expense: 0, net: 0, journalCount: 0, available: false };
        const comparisonMode = reportPeriodMode === 'year' ? 'previous-period' : reportComparisonMode;
        const comparisonPeriodValue = getPreviousReportingPeriodValue(reportPeriodValue, reportPeriodMode, comparisonMode);
        const comparisonPnl = getPnlForPeriod(comparisonPeriodValue);
        const periodLabel = formatReportingPeriodLabel(reportPeriodValue, reportPeriodMode, locale);
        const comparisonLabel = formatReportingPeriodLabel(comparisonPeriodValue, reportPeriodMode, locale);
        const classTotals = currentPnl.classTotals;
        const revenue = currentPnl.revenue;
        const classifiedExpense = currentPnl.classifiedExpense;
        const grossProfit = currentPnl.grossProfit;
        const netPreview = currentPnl.netPreview;
        const pnlRows = [
          { id: 'rev', label: 'Revenue', amount: revenue, basis: 'Invoice issue date' },
          { id: 'direct', label: 'Direct Project Cost', amount: classTotals.directProjectCost, basis: 'Mapped expense records' },
          { id: 'gross', label: 'Gross Profit', amount: grossProfit, basis: 'Revenue minus direct project cost' },
          { id: 'reward', label: 'Team Reward', amount: classTotals.teamReward, basis: 'Separate from Team Fee' },
          { id: 'fee', label: 'Project Team Fee', amount: classTotals.projectTeamFee, basis: 'Separate allocation bucket' },
          { id: 'opex', label: 'Operating Expense', amount: classTotals.operatingExpense, basis: 'Mapped operating expenses' },
          { id: 'unmapped', label: 'Unclassified Expense', amount: classTotals.unclassified, basis: 'Requires category mapping; excluded from net preview' },
          { id: 'net', label: 'Net Profit (preview)', amount: netPreview, basis: 'Gross Profit less mapped reward, fee and operating expense' }
        ];
        const comparisonMetrics = [
          { id: 'revenue', label: 'Revenue', current: currentPnl.revenue, comparison: comparisonPnl.revenue },
          { id: 'direct', label: 'Direct project cost', current: currentPnl.classTotals.directProjectCost, comparison: comparisonPnl.classTotals.directProjectCost },
          { id: 'gross', label: 'Gross profit', current: currentPnl.grossProfit, comparison: comparisonPnl.grossProfit },
          { id: 'reward', label: 'Team Reward', current: currentPnl.classTotals.teamReward, comparison: comparisonPnl.classTotals.teamReward },
          { id: 'fee', label: 'Project Team Fee', current: currentPnl.classTotals.projectTeamFee, comparison: comparisonPnl.classTotals.projectTeamFee },
          { id: 'opex', label: 'Operating expense', current: currentPnl.classTotals.operatingExpense, comparison: comparisonPnl.classTotals.operatingExpense },
          { id: 'unclassified', label: 'Unclassified expense', current: currentPnl.classTotals.unclassified, comparison: comparisonPnl.classTotals.unclassified },
          { id: 'net', label: 'Net profit (preview)', current: currentPnl.netPreview, comparison: comparisonPnl.netPreview }
        ];
        const comparisonRows = comparisonMetrics.map((item) => {
          const change = item.current - item.comparison;
          const changePercent = item.comparison === 0 ? (item.current === 0 ? '0.0%' : 'N/A') : ((change / Math.abs(item.comparison)) * 100).toFixed(1) + '%';
          return { id: item.id, cells: [item.label, formatMoney(item.current), formatMoney(item.comparison), formatMoney(change), changePercent] };
        });
        return (
          <div className="space-y-4">
            <WorkbookNote tone="warning" title="Operational source preview · not the posted General Ledger">
              This preview uses invoice issue dates and expense records, excluding output tax from revenue. It is useful for operating review but is not accounting profit. Use posted General Journal balances as the accounting view; unmapped source rows, drafts and incomplete posting remain exceptions to resolve.
            </WorkbookNote>
            <div className="flex min-w-0 flex-col gap-3 border-b border-line pb-3 sm:flex-row sm:items-end sm:justify-between" data-ams-slug="finance-pnl-comparison-controls">
              <div className="min-w-0 text-xs text-muted">
                <div className="font-medium text-fg">Comparison period</div>
                <div className="mt-1">{comparisonLabel}</div>
              </div>
              {reportPeriodMode !== 'year' && (
                <label className="block w-full min-w-0 text-xs font-medium text-muted sm:w-64">
                  Compare with
                  <CustomSelect
                    value={reportComparisonMode}
                    onChange={(nextValue) => setReportComparisonMode(nextValue as ReportingPeriodComparison)}
                    options={[{ value: 'previous-period', label: 'Previous period' }, { value: 'previous-year', label: 'Same period last year' }]}
                    className="mt-1.5 w-full"
                    triggerClassName="h-9 min-h-9 w-full"
                    aria-label="Compare reporting period with"
                    slug="finance-pnl-comparison-mode"
                  />
                </label>
              )}
            </div>
            <AdminMetricStrip metrics={[
              { id: 'pnl-revenue', label: 'Source preview revenue', value: formatMoney(revenue), context: 'Tax-exclusive invoice value · ' + periodLabel, icon: <FileText size={15} /> },
              { id: 'pnl-direct', label: 'Direct project cost', value: formatMoney(classTotals.directProjectCost), context: 'Based on current category mapping', icon: <Briefcase size={15} /> },
              { id: 'pnl-operating', label: 'Operating expense', value: formatMoney(classTotals.operatingExpense), context: 'Mapped operating costs', icon: <ArrowUpRight size={15} /> },
              { id: 'pnl-net', label: 'Net preview', value: formatMoney(netPreview), context: 'Before unclassified ' + formatMoney(classTotals.unclassified), icon: <CircleDollarSign size={15} /> }
            ]} />
            <AdminMetricStrip metrics={[
              { id: 'gl-revenue', label: 'Posted GL revenue', value: postedLedger.available ? formatMoney(postedLedger.revenue) : 'No posted entries', context: postedLedger.journalCount + ' posted journal entries · ' + periodLabel, icon: <FileText size={15} /> },
              { id: 'gl-expense', label: 'Posted GL expenses', value: postedLedger.available ? formatMoney(postedLedger.expense) : 'No posted entries', context: 'Expense-account activity from posted journals', icon: <ArrowUpRight size={15} /> },
              { id: 'gl-net', label: 'Posted GL result', value: postedLedger.available ? formatMoney(postedLedger.net) : 'Not available', context: 'Revenue less posted expense-account activity only', icon: <CircleDollarSign size={15} /> }
            ]} />
            <FinanceDataTable
              title="Period comparison"
              description={periodLabel + ' compared with ' + comparisonLabel + '. Change is current minus comparison; percentage is unavailable when the comparison baseline is zero.'}
              columns={[{ label: 'Line item' }, { label: 'Selected period', align: 'right' }, { label: 'Comparison period', align: 'right' }, { label: 'Change', align: 'right' }, { label: 'Change %', align: 'right' }]}
              rows={comparisonRows}
              emptyMessage="No activity exists for the selected period."
              exportable={false}
              actions={<Button variant="secondary" type="button" icon={<Download size={14}/>} onClick={() => exportFinanceCsv('kapitech-pnl-comparison-' + reportPeriodValue + '.csv', ['Line item', 'Selected period', 'Comparison period', 'Change', 'Change percent'], comparisonMetrics.map((item) => [item.label, item.current, item.comparison, item.current - item.comparison, item.comparison === 0 ? 'N/A' : (((item.current - item.comparison) / Math.abs(item.comparison)) * 100).toFixed(1) + '%']))}>Export comparison</Button>}
            />
            <FinanceDataTable title="Operational source preview detail" description="These source-derived values are separate from the Posted GL metrics above and must not be presented as final accounting profit." columns={[{ label: 'Line item' }, { label: 'Amount', align: 'right' }, { label: 'Basis' }]} rows={pnlRows.map((item) => ({ id: item.id, cells: [item.label, formatMoney(item.amount), item.basis] }))} emptyMessage="No activity exists for the selected period." exportable={false} actions={<Button variant="secondary" type="button" icon={<Download size={14}/>} onClick={() => exportFinanceCsv('kapitech-pnl-' + reportPeriodValue + '.csv', ['Line item', 'Amount', 'Basis'], pnlRows.map((item) => [item.label, item.amount, item.basis]))}>Export CSV</Button>} />
            <div className="text-xs text-muted">Classified expense total: {formatMoney(classifiedExpense)} · Source records in selected period: {currentPnl.expenses.length} expenses, {currentPnl.invoices.length} invoices.</div>
          </div>
        );
      }
      case 'cash-flow': {
        const monthly = new Map<string, { month: string; inflow: number; outflow: number; count: number }>();
        for (const movement of cashMovements.filter((item) => item.currency === 'IDR' && ['1000','1100','1200'].includes(item.accountCode) && item.source !== 'Internal transfer')) {
          const month = getMonthKey(movement.date);
          if (!month) continue;
          const item = monthly.get(month) || { month, inflow: 0, outflow: 0, count: 0 };
          item.inflow += movement.cashIn;
          item.outflow += movement.cashOut;
          item.count += 1;
          monthly.set(month, item);
        }
        const allMonthlyRows = [...monthly.values()].sort((a, b) => b.month.localeCompare(a.month));
        const selectedRange = getReportingPeriodRange(reportPeriodValue, reportPeriodMode, locale);
        const visibleMonthlyRows = selectedRange
          ? allMonthlyRows.filter((item) => item.month >= selectedRange.startMonth && item.month <= selectedRange.endMonth)
          : [];
        const periodLabel = formatReportingPeriodLabel(reportPeriodValue, reportPeriodMode, locale);
        const comparisonMode = reportPeriodMode === 'year' ? 'previous-period' : reportComparisonMode;
        const comparisonPeriodValue = getPreviousReportingPeriodValue(reportPeriodValue, reportPeriodMode, comparisonMode);
        const comparisonLabel = formatReportingPeriodLabel(comparisonPeriodValue, reportPeriodMode, locale);
        const getCashFlowForPeriod = (periodValue: string) => {
          const range = getReportingPeriodRange(periodValue, reportPeriodMode, locale);
          const periodMovements = range ? cashMovements.filter((movement) => {
            const date = String(movement.date || '').slice(0, 10);
            return movement.currency === 'IDR' && ['1000','1100','1200'].includes(movement.accountCode) && movement.source !== 'Internal transfer' && date >= range.startDate && date <= range.endDate;
          }) : [];
          const inflow = periodMovements.reduce((total, movement) => total + (Number(movement.cashIn) || 0), 0);
          const outflow = periodMovements.reduce((total, movement) => total + (Number(movement.cashOut) || 0), 0);
          return { inflow, outflow, net: inflow - outflow, count: periodMovements.length };
        };
        const currentFlow = getCashFlowForPeriod(reportPeriodValue);
        const comparisonFlow = getCashFlowForPeriod(comparisonPeriodValue);
        const postedCurrentFlow = selectedRange ? getPostedLedgerCashFlow(selectedRange.startDate, selectedRange.endDate) : { inflow: 0, outflow: 0, net: 0, activityCount: 0, journalCount: 0 };
        const comparisonRange = getReportingPeriodRange(comparisonPeriodValue, reportPeriodMode, locale);
        const postedComparisonFlow = comparisonRange ? getPostedLedgerCashFlow(comparisonRange.startDate, comparisonRange.endDate) : { inflow: 0, outflow: 0, net: 0, activityCount: 0, journalCount: 0 };
        const postedFlowMetrics = [
          { id: 'gl-inflow', label: 'Posted GL cash in', current: postedCurrentFlow.inflow, comparison: postedComparisonFlow.inflow },
          { id: 'gl-outflow', label: 'Posted GL cash out', current: postedCurrentFlow.outflow, comparison: postedComparisonFlow.outflow },
          { id: 'gl-net', label: 'Posted GL net cash movement', current: postedCurrentFlow.net, comparison: postedComparisonFlow.net },
          { id: 'gl-journals', label: 'Posted journal entries', current: postedCurrentFlow.journalCount, comparison: postedComparisonFlow.journalCount }
        ];
        const postedFlowRows = postedFlowMetrics.map((item) => {
          const change = item.current - item.comparison;
          const percent = item.comparison === 0 ? (item.current === 0 ? '0.0%' : 'N/A') : ((change / Math.abs(item.comparison)) * 100).toFixed(1) + '%';
          return { id: item.id, cells: [item.label, item.id === 'gl-journals' ? String(item.current) : formatMoney(item.current), item.id === 'gl-journals' ? String(item.comparison) : formatMoney(item.comparison), item.id === 'gl-journals' ? String(change) : formatMoney(change), percent] };
        });
        const flowComparisonMetrics = [
          { id: 'inflow', label: 'Cash in', current: currentFlow.inflow, comparison: comparisonFlow.inflow },
          { id: 'outflow', label: 'Cash out', current: currentFlow.outflow, comparison: comparisonFlow.outflow },
          { id: 'net', label: 'Net cash movement', current: currentFlow.net, comparison: comparisonFlow.net },
          { id: 'sources', label: 'Source rows', current: currentFlow.count, comparison: comparisonFlow.count }
        ];
        const flowComparisonRows = flowComparisonMetrics.map((item) => {
          const change = item.current - item.comparison;
          const percent = item.comparison === 0 ? (item.current === 0 ? '0.0%' : 'N/A') : ((change / Math.abs(item.comparison)) * 100).toFixed(1) + '%';
          return { id: item.id, cells: [item.label, item.id === 'sources' ? String(item.current) : formatMoney(item.current), item.id === 'sources' ? String(item.comparison) : formatMoney(item.comparison), item.id === 'sources' ? String(change) : formatMoney(change), percent] };
        });
        return (
          <div className="space-y-4">
            <WorkbookNote tone="warning" title="Separate posted-ledger cash flow from the source preview">
              The Posted General Ledger view below is calculated from posted journal lines on cash accounts 1000, 1100 and 1200; inter-account transfers net to zero, and opening balance entries are not treated as cash flows. The source preview below remains useful for unmatched or unposted activity, but it is not a reconciled bank statement or ending cash balance. Petty-cash voucher activity is still a separate control to reconcile.
            </WorkbookNote>
            <div className="flex min-w-0 flex-col gap-3 border-b border-line pb-3 sm:flex-row sm:items-end sm:justify-between" data-ams-slug="finance-cash-flow-comparison-controls">
              <div className="min-w-0 text-xs text-muted">
                <div className="font-medium text-fg">Comparison period</div>
                <div className="mt-1">{comparisonLabel}</div>
              </div>
              {reportPeriodMode !== 'year' && (
                <label className="block w-full min-w-0 text-xs font-medium text-muted sm:w-64">
                  Compare with
                  <CustomSelect
                    value={reportComparisonMode}
                    onChange={(nextValue) => setReportComparisonMode(nextValue as ReportingPeriodComparison)}
                    options={[{ value: 'previous-period', label: 'Previous period' }, { value: 'previous-year', label: 'Same period last year' }]}
                    className="mt-1.5 w-full"
                    triggerClassName="h-9 min-h-9 w-full"
                    aria-label="Compare reporting period with"
                    slug="finance-cash-flow-comparison-mode"
                  />
                </label>
              )}
            </div>
            <AdminMetricStrip metrics={[
              { id: 'gl-cash-in-period', label: 'Posted GL cash in', value: postedCurrentFlow.journalCount ? formatMoney(postedCurrentFlow.inflow) : 'No posted activity', context: postedCurrentFlow.activityCount + ' cash-moving journal entries · ' + periodLabel, icon: <ArrowDown size={15} /> },
              { id: 'gl-cash-out-period', label: 'Posted GL cash out', value: postedCurrentFlow.journalCount ? formatMoney(postedCurrentFlow.outflow) : 'No posted activity', context: 'Posted General Journal only', icon: <ArrowUpRight size={15} /> },
              { id: 'gl-cash-net-period', label: 'Posted GL net cash', value: postedCurrentFlow.journalCount ? formatMoney(postedCurrentFlow.net) : 'Not available', context: 'Opening balances excluded; internal transfers net to zero', icon: <CircleDollarSign size={15} /> }
            ]} />
            <AdminMetricStrip metrics={[
              { id: 'cash-in-period', label: 'Recorded cash in (proxy)', value: formatMoney(currentFlow.inflow), context: periodLabel, icon: <ArrowDown size={15} /> },
              { id: 'cash-out-period', label: 'Cash out', value: formatMoney(currentFlow.outflow), context: periodLabel, icon: <ArrowUpRight size={15} /> },
              { id: 'cash-net-period', label: 'Net movement (proxy)', value: formatMoney(currentFlow.net), context: 'Compared periods are calculated from recorded source rows', icon: <CircleDollarSign size={15} /> }
            ]} />
            <FinanceDataTable
              title="Posted General Ledger cash flow"
              description={periodLabel + ' compared with ' + comparisonLabel + '. These values use posted journal activity only and exclude opening balances; bank-statement reconciliation is still required.'}
              columns={[{ label: 'Metric' }, { label: 'Selected period', align: 'right' }, { label: 'Comparison period', align: 'right' }, { label: 'Change', align: 'right' }, { label: 'Change %', align: 'right' }]}
              rows={postedFlowRows}
              emptyMessage="No posted journal entries affect the selected period cash accounts."
              exportable={false}
              actions={<Button variant="secondary" type="button" icon={<Download size={14}/>} onClick={() => exportFinanceCsv('kapitech-posted-gl-cash-flow-' + reportPeriodValue + '.csv', ['Metric','Selected period','Comparison period','Change','Change percent'], postedFlowMetrics.map((item) => [item.label,item.current,item.comparison,item.current-item.comparison,item.comparison===0?'N/A':(((item.current-item.comparison)/Math.abs(item.comparison))*100).toFixed(1)+'%']))}>Export posted GL</Button>}
            />
            <FinanceDataTable
              title="Source cash movement comparison (proxy)"
              description={periodLabel + ' compared with ' + comparisonLabel + '. Source rows are not equivalent to posted ledger movements; reconcile any difference before closing.'}
              columns={[{ label: 'Metric' }, { label: 'Selected period', align: 'right' }, { label: 'Comparison period', align: 'right' }, { label: 'Change', align: 'right' }, { label: 'Change %', align: 'right' }]}
              rows={flowComparisonRows}
              emptyMessage="No dated source receipts or expense movements are available for the selected period."
              exportable={false}
              actions={<Button variant="secondary" type="button" icon={<Download size={14}/>} onClick={() => exportFinanceCsv('kapitech-cash-flow-comparison-' + reportPeriodValue + '.csv', ['Metric', 'Selected period', 'Comparison period', 'Change', 'Change percent'], flowComparisonMetrics.map((item) => [item.label, item.current, item.comparison, item.current - item.comparison, item.comparison === 0 ? 'N/A' : (((item.current - item.comparison) / Math.abs(item.comparison)) * 100).toFixed(1) + '%']))}>Export comparison</Button>}
            />
            <FinanceDataTable
              title="Recorded source cash movement by Month (proxy)"
              description="Monthly source activity inside the selected reporting period. This does not replace the Posted General Ledger cash-flow comparison above."
              columns={[{ label: 'Month' }, { label: 'Total cash in', align: 'right' }, { label: 'Total cash out', align: 'right' }, { label: 'Net cash movement', align: 'right' }, { label: 'Source rows', align: 'right' }]}
              rows={visibleMonthlyRows.map((item) => ({ id: item.month, cells: [item.month, formatMoney(item.inflow), formatMoney(item.outflow), formatMoney(item.inflow - item.outflow), item.count] }))}
              emptyMessage="No dated receipts or expense movements are available for the selected period."
              exportable={false}
              actions={<Button variant="secondary" type="button" icon={<Download size={14}/>} onClick={() => exportFinanceCsv('kapitech-cash-flow-' + reportPeriodValue + '.csv', ['Month', 'Total cash in', 'Total cash out', 'Net cash movement', 'Source rows'], visibleMonthlyRows.map((item) => [item.month, item.inflow, item.outflow, item.inflow - item.outflow, item.count]))}>Export period detail</Button>}
            />
          </div>
        );
      }
      case 'monthly-closing': {
        const records=getRegisterRecords('monthly-closing').filter((record)=>String(record.payload.period||record.periodKey||'')===selectedClosingMonth);
        const locked=getRegisterRecords('monthly-closing-lock').some((record)=>String(record.periodKey||record.payload.period||'')===selectedClosingMonth);
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
          return {id:item.label,cells:[item.label,item.owner,record?<StatusBadge value={state}/>:<AdminStatusBadge tone="warning">Not recorded</AdminStatusBadge>,closingPurposes[item.label]||'Review and document before the period is closed.',record?registerRecordActions('monthly-closing',record):canManageFinanceRecords?<Button variant="primary" type="button" icon={<Plus size={14} />} disabled={locked||registerSaving} onClick={()=>openRegisterForm('monthly-closing',undefined,{period:selectedClosingMonth,checklistItem:item.label,status:'Open'})}>Create control</Button>:<span className="text-muted">View only</span>]};
        });
        const completed=WORKBOOK_CLOSING_ITEMS.filter((item)=>records.some((record)=>String(record.payload.checklistItem||'').toLowerCase()===item.label.toLowerCase()&&String(record.payload.status||record.status)==='Done')).length;
        return (
          <div className="space-y-4">
            <WorkbookNote tone={locked?'info':'warning'} title={locked?'Selected closing month is closed':'Monthly closing requires all control items'}>
              Closing month: {selectedClosingMonth}. {completed} of {WORKBOOK_CLOSING_ITEMS.length} controls are completed and approved. The period can close only when all 11 controls are Done, source journals reconcile, every required cash/bank account has month-end statement evidence matching the posted GL, and posted journals balance.
            </WorkbookNote>
            <AdminPanel title="Closing period" bodyClassName="p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <label className="block max-w-xs flex-1 text-xs font-medium text-muted">Closing month
                  <CustomDatePicker type="month" value={selectedClosingMonth} onChange={setSelectedClosingMonth} locale={locale} className="mt-1.5 w-full" triggerClassName="h-10 min-h-10" aria-label="Closing month" slug="finance-closing-month-picker" />
                </label>
                <div className="flex items-center gap-2">
                  <AdminStatusBadge tone={locked?'success':'warning'}>{locked?'Closed':'Open'}</AdminStatusBadge>
                  {canApproveFinanceRecords && <Button type="button" variant="secondary" disabled={locked||completed!==WORKBOOK_CLOSING_ITEMS.length||registerSaving} loading={registerSaving} onClick={()=>setPendingConfirmation({kind:'close-period',period:selectedClosingMonth})}>Close period</Button>}
                </div>
              </div>
            </AdminPanel>
            <FinanceDataTable title="Monthly closing checklist" description="One saved row for each monthly closing control, with an assigned owner, sign-off date, and review notes." columns={[{label:'Checklist item'},{label:'Default owner'},{label:'Status'},{label:'Control purpose'},{label:'Actions'}]} rows={rows} emptyMessage="Create the checklist rows before requesting month-end close."/>
          </div>
        );
      }
      case 'project-allocation': {
        const records=getRegisterRecords('project-allocation').filter((record)=>matching([record.payload.projectName,record.projectId,record.status]));
        return (
          <div className="space-y-4">
            <WorkbookNote title="Allocation policy">
              Net Project Profit is calculated from contract value less vendor commitment, other obligations and the saved Team Fee milestones for that project. Team Fee is deducted before reserve/reward allocation; negative project results never create negative distributions. Project amounts use saved contract values and obligations, not the general AMS project budget.
            </WorkbookNote>
            <AdminMetricStrip metrics={[
              {id:'alloc-petty',label:'Default petty cash reserve',value:'10%',context:'For new allocations',icon:<WalletCards size={15}/>},
              {id:'alloc-emergency',label:'Default emergency fund',value:'10%',context:'For new allocations',icon:<ShieldAlert size={15}/>},
              {id:'alloc-reward',label:'Default Team Reward',value:'10%',context:'For new allocations',icon:<CircleDollarSign size={15}/>},
              {id:'alloc-company',label:'Default company fund',value:'70%',context:'Remainder for new allocations',icon:<Landmark size={15}/>}
            ]}/>
             <FinanceDataTable title="Project Allocation" description="Amounts and percentages come from each project's saved allocation. The default split above applies only to new records." columns={[{label:'Project'},{label:'Net project profit',align:'right'},{label:'Petty cash reserve',align:'right'},{label:'Emergency fund',align:'right'},{label:'Team Reward',align:'right'},{label:'Company operational fund',align:'right'},{label:'Emergency fund status'},{label:'Actions'}]} rows={records.map((record)=> {
               const pettyPercent = record.payload.pettyCashPercent == null ? null : Number(record.payload.pettyCashPercent);
               const emergencyPercent = record.payload.emergencyPercent == null ? null : Number(record.payload.emergencyPercent);
               const rewardPercent = record.payload.teamRewardPercent == null ? null : Number(record.payload.teamRewardPercent);
               const hasConfiguredPercentages = pettyPercent !== null && emergencyPercent !== null && rewardPercent !== null;
               const companyPercent = hasConfiguredPercentages
                 ? Math.max(0, 100 - pettyPercent - emergencyPercent - rewardPercent)
                 : null;
               const allocationCell = (amount: unknown, percent: number | null) => (
                 <div className="space-y-0.5">
                   <div className="tabular-nums">{formatMoney(Number(amount) || 0)}</div>
                   <div className="text-[11px] text-muted">{percent === null ? 'Share not recorded' : percent + '% of net profit'}</div>
                 </div>
               );
               return {id:record.id,cells:[
                 String(record.payload.projectName||record.projectId||'—'),
                 formatMoney(Number(record.payload.netProjectProfit)||0),
                 allocationCell(record.payload.pettyCashReserve ?? record.payload.pettyCash, pettyPercent),
                 allocationCell(record.payload.emergencyFund, emergencyPercent),
                 allocationCell(record.payload.teamReward, rewardPercent),
                 allocationCell(record.payload.companyOperationalFund, companyPercent),
                 <StatusBadge value={record.payload.emergencyStatus||record.status}/>,
                 registerRecordActions('project-allocation',record)
               ]};
             })} emptyMessage="No project allocation has been saved yet. Configure it from the current contract value and project obligations." actions={registerAddButton('project-allocation','Calculate project allocation')}/>
            <FinanceDataTable title="Team Reward distribution" description="Standard distribution when Team Reward uses the default 10% allocation." columns={[{label:'Recipient group'},{label:'Percentage of Net Project Profit'},{label:'Share of Team Reward'}]} rows={[
              {id:'sales',cells:['Sales','5%','50%']},
              {id:'vendor',cells:['Vendor / PIC','2.5%','25%']},
              {id:'management',cells:['Management','2.5%','25%']}
            ]}/>
          </div>
        );
      }
      case 'team-fee': {
        const feeRecords=getRegisterRecords('team-fee').filter((record)=>matchesDate(record.payload.dueDate || record.createdAt) && matching([record.payload.projectName,record.projectId,record.payload.memberName,record.payload.role,record.payload.paymentStatus]));
        const feeExpenses=expenses.filter((expense)=>classifyWorkbookExpense(expense)==='projectTeamFee'&&matchesDate(expense.date)&&matching([expense.date,expense.projectId,expense.description,expense.category,expense.amount]));
        return (
          <div className="space-y-4">
            <WorkbookNote title="Separate team allocations">
              The member-level Team Fee register is persistent and stores project, member, role, fee amount, due date and payment state. Expense records classified as Project Team Fee are shown separately as source costs; they are not automatically assumed to settle a member-level entitlement.
            </WorkbookNote>
            <FinanceDataTable title="Project Team Fee allocation" description="One row per project and team member; status is maintained independently from Team Reward." columns={[{label:'Project'},{label:'Member'},{label:'Milestone / reference'},{label:'Role'},{label:'Fee amount',align:'right'},{label:'Due date'},{label:'Paid date'},{label:'Payment status'},{label:'Actions'}]} rows={feeRecords.map((record)=>({id:record.id,cells:[String(record.payload.projectName||record.projectId||'—'),String(record.payload.memberName||'—'),String(record.payload.paymentReference||'—'),String(record.payload.role||'—'),formatMoney(Number(record.payload.feeAmount)||0),formatDate(record.payload.dueDate),formatDate(record.payload.paidDate),<StatusBadge value={record.payload.paymentStatus||record.status}/>,registerRecordActions('team-fee',record)]}))} emptyMessage="No individual Team Fee allocation has been recorded." actions={registerAddButton('team-fee','Add team fee')}/>
            <FinanceDataTable title="Project Team Fee expense sources" description="Actual expense records that are explicitly classified as Project Team Fee." columns={[{label:'Date'},{label:'Project'},{label:'Description'},{label:'Amount',align:'right'},{label:'Record state'}]} rows={feeExpenses.map((expense)=>({id:expense.id,cells:[formatDate(expense.date),projects.find((project)=>project.id===expense.projectId)?.name||expense.projectId||'Not linked',expense.description,formatMoney(Number(expense.amount)||0,String((expense as any).currency||'IDR')),<StatusBadge value={(expense as any).status||'recorded'}/>]}))} emptyMessage="No expense source record is classified as Project Team Fee."/>
          </div>
        );
      }
      case 'balance-sheet': {
        const selectedRange = getReportingPeriodRange(reportPeriodValue, reportPeriodMode, locale);
        const asOfDate = selectedRange?.endDate || getLocalDateInputValue();
        const periodLabel = formatReportingPeriodLabel(reportPeriodValue, reportPeriodMode, locale);
        const allOpenings = getRegisterRecords('balance-sheet-opening');
        const openings = allOpenings
          .filter((record) => matchesDate(record.payload.asOfDate || record.createdAt) && matching([record.payload.accountCode,record.payload.asOfDate,record.payload.notes]))
          .slice().sort((a,b) => String(b.payload.asOfDate || '').localeCompare(String(a.payload.asOfDate || '')));

        const accountCatalog = new Map<string, { code: string; name: string; accountType: string; normalBalance: string }>();
        for (const account of EXCEL_CHART_OF_ACCOUNTS) {
          accountCatalog.set(account.code, { code: account.code, name: account.name, accountType: account.type, normalBalance: account.normalBalance });
        }
        for (const record of getRegisterRecords('chart-of-accounts')) {
          const code = String(record.payload.code || record.recordKey || '').trim();
          if (!code) continue;
          if (record.payload.active === false) {
            accountCatalog.delete(code);
            continue;
          }
          accountCatalog.set(code, {
            code,
            name: String(record.payload.name || code),
            accountType: String(record.payload.accountType || ''),
            normalBalance: String(record.payload.normalBalance || '')
          });
        }

        const postedJournals = getRegisterRecords('journal-entry').filter((record) => {
          if (record.status !== 'posted') return false;
          const entryDate = String(record.payload.date || '').slice(0, 10);
          return /^\d{4}-\d{2}-\d{2}$/.test(entryDate) && entryDate <= asOfDate;
        });
        const accountActivity = new Map<string, { debit: number; credit: number }>();
        for (const journal of postedJournals) {
          const lines = Array.isArray(journal.payload.lines) ? journal.payload.lines as Array<Record<string, any>> : [];
          for (const line of lines) {
            const code = String(line.accountCode || '').trim();
            if (!code) continue;
            const activity = accountActivity.get(code) || { debit: 0, credit: 0 };
            activity.debit += Number(line.debit) || 0;
            activity.credit += Number(line.credit) || 0;
            accountActivity.set(code, activity);
          }
        }
        const accountBalance = (code: string, accountType?: string): number => {
          const movement = accountActivity.get(code) || { debit: 0, credit: 0 };
          const type = accountType || accountCatalog.get(code)?.accountType || '';
          return type === 'Asset' || type === 'Expense'
            ? movement.debit - movement.credit
            : movement.credit - movement.debit;
        };

        const sourcePlan = buildFinanceSourceJournalDrafts(
          reportInvoices,
          expenses as any[],
          getRegisterRecords('cash-bank-transaction'),
          getRegisterRecords('vendor-bill'),
          getRegisterRecords('vendor-bill-payment'),
          getRegisterRecords('chart-of-accounts').map((record) => ({
            code: String(record.payload.code || record.recordKey),
            name: String(record.payload.name || ''),
            accountType: String(record.payload.accountType || ''),
            active: record.payload.active !== false
          })),
          [
            ...getRegisterRecords('cash-bank-opening').map((record) => ({
              id: record.id, recordType: 'cash-bank-opening' as const, recordKey: record.recordKey, status: record.status, payload: record.payload
            })),
            ...allOpenings.map((record) => ({
              id: record.id, recordType: 'balance-sheet-opening' as const, recordKey: record.recordKey, status: record.status, payload: record.payload
            }))
          ]
        );
        const sourceJournals = new Map<string, WorkbookRecord>();
        const sourceKey = (type: unknown, id: unknown) => String(type || '') + '|' + String(id || '');
        for (const journal of getRegisterRecords('journal-entry')) {
          const type = String(journal.payload.sourceType || '');
          const id = String(journal.payload.sourceId || '');
          if (type && id) sourceJournals.set(sourceKey(type, id), journal);
        }
        const sourceSnapshot = (value: Record<string, any>): string => JSON.stringify({
          date: String(value.date || ''),
          reference: String(value.reference || ''),
          description: String(value.description || ''),
          projectId: String(value.projectId || ''),
          relatedSourceId: String(value.relatedSourceId || ''),
          notes: String(value.notes || ''),
          lines: (Array.isArray(value.lines) ? value.lines : []).map((line: Record<string, any>) => ({
            accountCode: String(line.accountCode || ''),
            accountName: String(line.accountName || ''),
            debit: Number(line.debit) || 0,
            credit: Number(line.credit) || 0,
            notes: String(line.notes || '')
          }))
        });
        const exceptionKeys = new Set<string>();
        const expectedSources = new Set<string>();
        for (const draft of sourcePlan.drafts) {
          const key = sourceKey(draft.sourceType, draft.sourceId);
          expectedSources.add(key);
          if (String(draft.date || '').slice(0, 10) > asOfDate) continue;
          const existing = sourceJournals.get(key);
          if (!existing || existing.status !== 'posted') {
            exceptionKeys.add('unposted:' + key);
          } else if (sourceSnapshot(existing.payload) !== sourceSnapshot(draft)) {
            exceptionKeys.add('changed:' + key);
          }
        }
        for (const item of sourcePlan.skipped) {
          const sourceDate = String(item.date || '').slice(0, 10);
          if (!sourceDate || sourceDate <= asOfDate) exceptionKeys.add('skipped:' + sourceKey(item.sourceType, item.sourceId));
        }
        const mappedSourceTypes = new Set(['invoice-issued','invoice-payment','expense','expense-payment','cash-bank-transfer','vendor-bill-issued','vendor-bill-payment','cash-bank-opening','balance-sheet-opening']);
        for (const journal of postedJournals) {
          const type = String(journal.payload.sourceType || '');
          const id = String(journal.payload.sourceId || '');
          const key = sourceKey(type, id);
          if (mappedSourceTypes.has(type) && id && !expectedSources.has(key)) exceptionKeys.add('orphan:' + key);
        }
        const sourceExceptionCount = exceptionKeys.size;

        const accounts = [...accountCatalog.values()];
        const assetAccounts = accounts.filter((account) => account.accountType === 'Asset').sort((a,b) => a.code.localeCompare(b.code));
        const liabilityAccounts = accounts.filter((account) => account.accountType === 'Liability').sort((a,b) => a.code.localeCompare(b.code));
        const equityAccounts = accounts.filter((account) => account.accountType === 'Equity').sort((a,b) => a.code.localeCompare(b.code));
        const revenueAccounts = accounts.filter((account) => account.accountType === 'Revenue');
        const expenseAccounts = accounts.filter((account) => account.accountType === 'Expense');
        const currentEarnings = revenueAccounts.reduce((total, account) => total + accountBalance(account.code, 'Revenue'), 0)
          - expenseAccounts.reduce((total, account) => total + accountBalance(account.code, 'Expense'), 0);
        const totalAssets = assetAccounts.reduce((total, account) => total + accountBalance(account.code, 'Asset'), 0);
        const totalLiabilities = liabilityAccounts.reduce((total, account) => total + accountBalance(account.code, 'Liability'), 0);
        const recordedEquity = equityAccounts.reduce((total, account) => total + accountBalance(account.code, 'Equity'), 0);
        const totalEquity = recordedEquity + currentEarnings;
        const balanceDifference = totalAssets - totalLiabilities - totalEquity;
        const openingOffset = accountBalance('3200', 'Equity');
        const balanced = Math.abs(balanceDifference) <= 0.01;
        const ledgerRows = [
          ...assetAccounts.map((account) => ({ id: 'asset-' + account.code, cells: ['Assets', account.code, account.name, formatMoney(accountBalance(account.code, 'Asset')), 'Posted journals through ' + formatDate(asOfDate)] })),
          ...liabilityAccounts.map((account) => ({ id: 'liability-' + account.code, cells: ['Liabilities', account.code, account.name, formatMoney(accountBalance(account.code, 'Liability')), 'Posted journals through ' + formatDate(asOfDate)] })),
          ...equityAccounts.map((account) => ({ id: 'equity-' + account.code, cells: ['Equity', account.code, account.name + (account.code === '3200' ? ' · temporary opening offset' : ''), formatMoney(accountBalance(account.code, 'Equity')), 'Posted journals through ' + formatDate(asOfDate)] })),
          { id: 'equity-current-earnings', cells: ['Equity', 'CURRENT-EARNINGS', 'Cumulative earnings not yet closed to retained earnings', formatMoney(currentEarnings), 'Revenue less expense account balances through ' + formatDate(asOfDate)] }
        ];
        return (
          <div className="space-y-4">
            <WorkbookNote tone={sourceExceptionCount > 0 || !balanced || Math.abs(openingOffset) > 0.01 ? 'warning' : 'info'} title={sourceExceptionCount > 0 ? 'Posted ledger has unresolved source exceptions' : !balanced ? 'General Ledger is out of balance' : Math.abs(openingOffset) > 0.01 ? 'Opening balance offset needs reconciliation' : 'Posted ledger balance snapshot'}>
              Balances below are calculated from posted General Journal lines through {formatDate(asOfDate)}. They are not silently filled from invoices, expenses or opening registers. {sourceExceptionCount} source item(s) still need mapping, posting, correction or reconciliation; {postedJournals.length} posted journal(s) are included. Account 3200 is a temporary opening balance offset and should be cleared to the appropriate equity account after opening balances are reconciled.
            </WorkbookNote>
            <AdminMetricStrip metrics={[
              { id: 'bs-assets', label: 'Total assets', value: formatMoney(totalAssets), context: 'Posted General Ledger · ' + periodLabel, icon: <Landmark size={15} /> },
              { id: 'bs-liabilities', label: 'Total liabilities', value: formatMoney(totalLiabilities), context: 'As of ' + formatDate(asOfDate), icon: <ShieldAlert size={15} /> },
              { id: 'bs-equity', label: 'Total equity incl. current earnings', value: formatMoney(totalEquity), context: 'Includes temporary account 3200', icon: <CircleDollarSign size={15} /> },
              { id: 'bs-check', label: 'Accounting equation', value: balanced ? 'Balanced' : formatMoney(balanceDifference), context: 'Assets − liabilities − equity', icon: <WalletCards size={15} /> }
            ]} />
            <FinanceDataTable
              title="Posted General Ledger Balance Sheet"
              description={'Trial balance by normal account balance at ' + formatDate(asOfDate) + '. Current earnings are calculated from posted Revenue and Expense accounts; unresolved source items are disclosed above.'}
              columns={[{label:'Section'},{label:'Code'},{label:'Account'},{label:'Balance (IDR)',align:'right'},{label:'Basis'}]}
              rows={ledgerRows}
              emptyMessage="No posted journal activity exists through the selected date."
              exportable={true}
            />
            <FinanceDataTable
              title="Opening balance register"
              description="Opening balances are journalized via account 3200. Save an opening balance, run source sync, review the generated draft and have a second authorized user post it."
              columns={[{label:'As of date'},{label:'Account code'},{label:'Account'},{label:'Balance side'},{label:'Opening amount',align:'right'},{label:'Notes'},{label:'Actions'}]}
              rows={openings.map((record) => ({
                id: record.id,
                cells: [formatDate(record.payload.asOfDate),String(record.payload.accountCode||''),accountCatalog.get(String(record.payload.accountCode||''))?.name||String(record.payload.accountCode||''),String(record.payload.side||''),formatMoney(Number(record.payload.openingAmount)||0),String(record.payload.notes||'—'),registerRecordActions('balance-sheet-opening',record)]
              }))}
              emptyMessage="No opening balances have been entered."
              actions={registerAddButton('balance-sheet-opening','Record opening balance')}
            />
          </div>
        );
      }
      case 'journal': {
        const allJournalRecords = getRegisterRecords('journal-entry');
        const records = allJournalRecords.filter((record) => matchesDate(record.payload.date || record.createdAt) && matching([record.payload.date,record.payload.reference,record.payload.description,record.payload.projectId,record.status]));
        const plan = buildFinanceSourceJournalDrafts(reportInvoices, expenses as any[], getRegisterRecords('cash-bank-transaction'), getRegisterRecords('vendor-bill'), getRegisterRecords('vendor-bill-payment'), getRegisterRecords('chart-of-accounts').map((record) => ({ code: String(record.payload.code || record.recordKey), name: String(record.payload.name || ''), accountType: String(record.payload.accountType || ''), active: record.payload.active !== false })), [
          ...getRegisterRecords('cash-bank-opening').map((record) => ({ id: record.id, recordType: 'cash-bank-opening' as const, recordKey: record.recordKey, status: record.status, payload: record.payload })),
          ...getRegisterRecords('balance-sheet-opening').map((record) => ({ id: record.id, recordType: 'balance-sheet-opening' as const, recordKey: record.recordKey, status: record.status, payload: record.payload }))
        ]);
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
        ].filter((row) => matchesDate(row.date) && matching([row.date,row.reference,row.description,row.source,row.status])).sort((a,b) => String(b.date).localeCompare(String(a.date))).slice(0,50);
        return (
          <div className="space-y-4">
            <WorkbookNote tone="info" title="Source sync creates drafts only">
              Generate source drafts prepares invoice-recognition entries where the tax mapping is supported, client receipts that clear Accounts Receivable, classifiable expense entries, vendor bill payments with a supported account proposal, and posted internal cash transfers. Nothing is approved or posted automatically. Unsupported tax or payment-account mappings stay skipped with a reason; verify each source and its related ledger entry before approval.
            </WorkbookNote>
            {journalSyncSummary && <WorkbookNote tone="info" title="Source journal sync result">{journalSyncSummary}</WorkbookNote>}
            <FinanceDataTable title="General Journal" description="Generated records retain their source reference. Review every draft and supporting document; a different authorized user must approve/post it. Posted entries are immutable." columns={[{label:'Date'},{label:'Reference'},{label:'Description'},{label:'Project'},{label:'Debit total',align:'right'},{label:'Credit total',align:'right'},{label:'Status'},{label:'Actions'}]} rows={records.map((record)=>({id:record.id,cells:[formatDate(record.payload.date),String(record.payload.reference||record.recordKey),String(record.payload.description||''),String(record.payload.projectId||'—'),formatMoney(Number(record.payload.debitTotal)||0),formatMoney(Number(record.payload.creditTotal)||0),<StatusBadge value={record.status}/>,registerRecordActions('journal-entry',record)]}))} emptyMessage="No general journal entries have been saved." actions={<div className="flex flex-wrap items-center gap-2">{registerAddButton('journal-entry','Add journal entry')}{canManageFinanceRecords && <Button variant="secondary" type="button" loading={registerSaving} disabled={registerSaving} icon={<RefreshCw size={14}/>} onClick={() => void syncSourceJournalDrafts()}>Generate source drafts</Button>}</div>}/>
            <FinanceDataTable title="Source transaction posting queue" description="Source rows show the matching journal state or why automatic draft creation was skipped. These rows are not themselves journal entries." columns={[{label:'Date'},{label:'Reference'},{label:'Source'},{label:'Description'},{label:'Amount',align:'right'},{label:'Posting state'}]} rows={journalSources.map((row)=>({id:row.id,cells:[formatDate(row.date),row.reference||'—',row.source,row.description,formatMoney(row.amount),<AdminStatusBadge tone={row.tone}>{row.status}</AdminStatusBadge>]}))} emptyMessage="No eligible or skipped source rows were found."/>
            <FinanceDataTable title="Journal account mapping" description="Source-linked entries follow accrual accounting. Invoice issue, client receipts, cost recognition and settlements are separate drafts. Finance must review and post each entry." columns={[{label:'Source event'},{label:'Debit'},{label:'Credit'},{label:'Review requirement'}]} rows={[
              {id:'invoice-issued',cells:['Invoice issued','1300 · Accounts Receivable','4000 · Project Revenue; 2100 · Tax Payable when taxable','Match the invoice total and tax evidence. Tax is separated from revenue.']},
              {id:'receipt',cells:['Client receipt','1000 · Cash & Bank / 1010 · Card Clearing / 1100 · Petty Cash','1300 · Accounts Receivable','Match receipt date, method, amount and source invoice. Post only after invoice recognition.']},
              {id:'expense-accrual',cells:['Expense recognition','Classified expense account · 5100 / 5200 / 5300–5320 / 5400 / 5500 / 5600','2000 · Accounts Payable','Recognize on the incurred date. Do not duplicate expenses linked to a vendor bill.']},
              {id:'expense-payment',cells:['Expense settlement','2000 · Accounts Payable','1000 / 1100 / 1200 / 2200 · Verified settlement account','Match actual payment date and account. Credit-card settlement clears 2200, not cash.']},
              {id:'vendor-bill',cells:['Vendor bill issued','Configured active Expense account','2000 · Accounts Payable','Confirm bill classification and avoid duplicate cost recognition.']},
              {id:'vendor-payment',cells:['Vendor bill payment','2000 · Accounts Payable','1000 / 1100 / 1200 / 2200 · Settlement account','Match payment to the bill accrual and verify method and statement evidence.']},
              {id:'petty-transfer',cells:['Bank to petty cash','1100 · Petty Cash Reserve','1000 · Cash & Bank','Internal transfer only. It does not create revenue or expense.']}
            ]}/>
          </div>
        );
      }
      case 'annual-summary': {
        const selectedYear = String(Number(reportPeriodValue.slice(0, 4)) || new Date().getFullYear());
        const yearInvoices = idrInvoices.filter((invoice) => getYearKey(getInvoiceDate(invoice)) === selectedYear);
        const yearExpenses = idrExpenses.filter((expense) => getYearKey(expense.date) === selectedYear);
        const yearCollections = cashMovements.filter((movement) => movement.currency === 'IDR' && ['1000','1100','1200'].includes(movement.accountCode) && movement.source !== 'Internal transfer' && getYearKey(movement.date) === selectedYear);
        const yearBilled = sumAmounts<AgencyInvoice>(yearInvoices, (invoice) => Math.max(0, (Number(invoice.total) || 0) - (Number(invoice.taxAmount) || 0)));
        const yearCollected = sumAmounts<CashMovement>(yearCollections, (movement) => movement.cashIn);
        const yearOutflow = sumAmounts<CashMovement>(yearCollections, (movement) => movement.cashOut);
        const yearExpense = sumAmounts<AgencyExpense>(yearExpenses, (expense) => Number(expense.amount) || 0);
        const postedYearIncome = getPostedLedgerIncomeStatement(selectedYear + '-01-01', selectedYear + '-12-31');
        const postedYearCashFlow = getPostedLedgerCashFlow(selectedYear + '-01-01', selectedYear + '-12-31');
        const postedBasis = postedYearIncome.journalCount + ' posted journal entries; incomplete source mapping remains excluded until resolved.';
        const annualRows = [
          { id: 'a-revenue', metric: 'Annual Revenue / Invoice Value (IDR)', amount: yearBilled, basis: 'IDR invoice issue date' },
          { id: 'a-collected', metric: 'Annual recorded cash in', amount: yearCollected, basis: 'Invoice payments and saved Cash & Bank inflows; excludes petty-cash voucher receipts' },
          { id: 'a-expense', metric: 'Annual Recorded Expenses', amount: yearExpense, basis: 'Expense date' },
          { id: 'a-outflow', metric: 'Recorded cash outflow (proxy)', amount: yearOutflow, basis: 'AMS expense dates and saved Cash & Bank movements; excludes petty-cash vouchers' },
          { id: 'a-net', metric: 'Net Cash Movement (proxy)', amount: yearCollected - yearOutflow, basis: 'Recorded cash in minus outflow proxy; cash transfers and petty-cash voucher activity are not a complete consolidated view' },
          { id: 'gl-revenue', metric: 'Posted GL revenue', amount: postedYearIncome.revenue, basis: postedBasis },
          { id: 'gl-expense', metric: 'Posted GL expenses', amount: postedYearIncome.expense, basis: postedBasis },
          { id: 'gl-result', metric: 'Posted GL result · not final profit', amount: postedYearIncome.net, basis: 'Posted revenue minus posted expense-account activity; reconcile all source exceptions before relying on this as profit' },
          { id: 'gl-cash-in', metric: 'Posted GL cash in', amount: postedYearCashFlow.inflow, basis: postedYearCashFlow.activityCount + ' cash-moving posted journal entries; opening balances excluded' },
          { id: 'gl-cash-out', metric: 'Posted GL cash out', amount: postedYearCashFlow.outflow, basis: postedYearCashFlow.activityCount + ' cash-moving posted journal entries; inter-account transfers net to zero' },
          { id: 'gl-cash-net', metric: 'Posted GL net cash movement', amount: postedYearCashFlow.net, basis: 'Posted journal activity on accounts 1000, 1100 and 1200; bank-statement reconciliation still required' }
        ];
        return (
          <div className="space-y-4">
            <div className="flex min-w-0 flex-col gap-1" data-ams-slug="finance-annual-summary-period">
              <h2 className="text-sm font-semibold text-fg">Annual summary · {selectedYear}</h2>
              <p className="text-xs text-muted">Full-year results follow the reporting year selected in the topbar. The source preview and posted General Ledger are listed separately below.</p>
            </div>
            <AdminMetricStrip metrics={[
              { id: 'year-billed', label: 'Annual invoice value', value: formatMoney(yearBilled), context: selectedYear + ' · issued invoices', icon: <FileText size={15} /> },
              { id: 'year-collected', label: 'Annual recorded cash in', value: formatMoney(yearCollected), context: 'Invoice payments and saved Cash & Bank inflows', icon: <ArrowDown size={15} /> },
              { id: 'year-expenses', label: 'Annual recorded expenses', value: formatMoney(yearExpense), context: yearExpenses.length + ' source expense records', icon: <ArrowUpRight size={15} /> },
              { id: 'year-net', label: 'Net cash movement (proxy)', value: formatMoney(yearCollected - yearOutflow), context: 'Cash-in/out proxy; petty-cash voucher activity is excluded', icon: <CircleDollarSign size={15} /> }
            ]} />
            <WorkbookNote tone="warning" title="Posted General Ledger · annual view">
              These annual accounting metrics use posted journals only. They may not represent final financial statements until every source row is mapped, posted and reconciled. The temporary Opening Balance Equity account must be cleared after opening balances are reviewed.
            </WorkbookNote>
            <AdminMetricStrip metrics={[
              { id: 'annual-gl-revenue', label: 'Posted GL revenue', value: postedYearIncome.journalCount ? formatMoney(postedYearIncome.revenue) : 'No posted activity', context: postedYearIncome.journalCount + ' posted journal entries', icon: <FileText size={15}/> },
              { id: 'annual-gl-expense', label: 'Posted GL expenses', value: postedYearIncome.journalCount ? formatMoney(postedYearIncome.expense) : 'No posted activity', context: 'Posted expense-account activity', icon: <ArrowUpRight size={15}/> },
              { id: 'annual-gl-result', label: 'Posted GL result', value: postedYearIncome.journalCount ? formatMoney(postedYearIncome.net) : 'Not available', context: 'Not final profit until reconciled', icon: <CircleDollarSign size={15}/> },
              { id: 'annual-gl-cashin', label: 'Posted GL cash in', value: postedYearCashFlow.journalCount ? formatMoney(postedYearCashFlow.inflow) : 'No posted activity', context: 'Opening balances excluded', icon: <ArrowDown size={15}/> },
              { id: 'annual-gl-cashout', label: 'Posted GL cash out', value: postedYearCashFlow.journalCount ? formatMoney(postedYearCashFlow.outflow) : 'No posted activity', context: 'Internal cash transfers net to zero', icon: <ArrowUpRight size={15}/> },
              { id: 'annual-gl-netcash', label: 'Posted GL net cash', value: postedYearCashFlow.journalCount ? formatMoney(postedYearCashFlow.net) : 'Not available', context: 'Bank statement reconciliation required', icon: <WalletCards size={15}/> }
            ]} />
            <FinanceDataTable title="Annual summary" description="IDR-only view. Source-derived operating proxies and posted-ledger accounting figures are listed separately in the same table with their basis clearly labelled." columns={[{ label: 'Metric' }, { label: 'Amount', align: 'right' }, { label: 'Basis' }]} rows={annualRows.map((item) => ({ id: item.id, cells: [item.metric, formatMoney(item.amount), item.basis] }))} emptyMessage="No records exist for the selected year." exportable={false} actions={<Button variant="secondary" type="button" icon={<Download size={14}/>} onClick={() => exportFinanceCsv('kapitech-annual-summary-' + selectedYear + '.csv', ['Metric', 'Amount', 'Basis'], annualRows.map((item) => [item.metric, item.amount, item.basis]))}>Export CSV</Button>} />
          </div>
        );
      }
      default:
        return null;
    }
  };

  if (!canViewFinancials) {
    const restrictedPage = (
      <AdminPageShell featureSlug="excel-aligned-finance-workspace" className="space-y-4">
        <AdminModuleHeader
          slug="finance-workspace-header"
          title="Finance"
          description="Manage revenue, expenses, cash, receivables, payables, and financial reporting in one place."
        />
        <AdminPanel title="Financial access restricted" description="Your account does not have permission to view Finance data.">
          <div className="p-4 text-xs leading-5 text-muted">
            Contact an administrator if you believe you should have access to this module.
          </div>
        </AdminPanel>
      </AdminPageShell>
    );
    return localizeFinanceValue(restrictedPage, language) as React.ReactElement;
  }

  const financePage = (
    <AdminPageShell featureSlug="excel-aligned-finance-workspace" className="space-y-3">
      <AdminModuleHeader
        slug="finance-workspace-header"
        title="Finance"
        description="Manage revenue, expenses, cash, receivables, payables, and financial reporting in one place."
        actions={<Button variant="secondary" type="button" onClick={() => void loadData(true)} loading={refreshing}>Refresh data</Button>}
        className="mb-0"
      />
      <div
        className={SEARCHABLE_FINANCE_TABS.has(activeTab.key) && activeGroup.items.length <= 4
          ? 'grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-center'
          : 'min-w-0 space-y-3'}
        data-ams-slug="finance-workspace-navigation"
      >
        <div className="min-[900px]:hidden grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-3" data-ams-slug="finance-area-mobile-selector">
          <span className="text-[11px] font-medium text-muted">Finance area</span>
          <CustomSelect
            options={groupItems.map((item) => ({ value: item.key, label: item.label }))}
            value={activeGroup.key}
            onChange={(key) => {
              const destination = groupItems.find((item) => item.key === key);
              if (destination) navigate(destination.to);
            }}
            placeholder="Select finance area"
            className="w-full min-w-0"
            triggerClassName="w-full"
            size="xs"
            slug="finance-area-select"
            aria-label="Finance area"
          />
        </div>
        <AdminSectionTabs ariaLabel="Finance worksheets" activeKey={activeTab.key} items={sheetItems} className="w-full" />
        {SEARCHABLE_FINANCE_TABS.has(activeTab.key) && (
          <div className="flex min-w-0 justify-start sm:justify-end" data-ams-slug="finance-worksheet-search">
            <label className="relative block w-full max-w-lg">
              <Search size={14} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="search"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Search this worksheet..."
                aria-label="Search this worksheet"
                autoComplete="off"
                className="h-9 w-full rounded-control border border-line bg-bg pl-9 pr-9 text-xs text-fg outline-none transition-colors focus:border-accent"
              />
              {searchText && (
                <button
                  type="button"
                  aria-label="Clear worksheet search"
                  title="Clear worksheet search"
                  onClick={() => setSearchText('')}
                  className="absolute right-1 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-chip text-muted transition-colors hover:bg-panel-hover hover:text-fg"
                >
                  <X size={13} aria-hidden="true" />
                </button>
              )}
            </label>
          </div>
        )}
      </div>
      <div className="min-w-0 space-y-3" data-ams-feature-slug={activeTab.key} data-ams-slug="finance-active-worksheet">
        {(Boolean(registerActionError && !editor) || registerErrors.length > 0 || sourceErrors.length > 0) && (
          <AdminModuleNotice
            tone={registerActionError && !editor ? 'danger' : 'warning'}
            className="py-2"
          >
            <div className="space-y-1 text-xs leading-4">
              {registerActionError && !editor && <p><strong>Finance action needs attention:</strong> {registerActionError}</p>}
              {registerErrors.length > 0 && (
                <p>
                  <strong>Supporting records unavailable:</strong> {registerErrors.length} of {SUPPLEMENTARY_FINANCE_RECORD_TYPES.length} requests failed. Values from unavailable records are not inferred. {registerErrors.slice(0, 2).join(' · ')}
                </p>
              )}
              {sourceErrors.length > 0 && (
                <p>
                  <strong>Core source errors:</strong> {sourceErrors.slice(0, 3).join(' · ')}
                  {sourceErrors.length > 3 ? ' · and ' + (sourceErrors.length - 3) + ' more' : ''}. Check the connected AMS source before interpreting the affected views.
                </p>
              )}
              {(registerErrors.length > 0 || sourceErrors.length > 0) && (
                <p>Previously loaded records remain visible where available. Treat affected data as stale until the source refreshes successfully.</p>
              )}
            </div>
          </AdminModuleNotice>
        )}
        {loading ? renderLoading() : renderView(activeTab)}
      </div>
      {renderRegisterEditor()}
      {renderVendorContractEditor()}
      <Modal
        open={Boolean(pendingConfirmation)}
        onClose={() => { if (!registerSaving) setPendingConfirmation(null); }}
        title={pendingConfirmation?.kind === 'discard-editor' || pendingConfirmation?.kind === 'discard-vendor-contract'
          ? 'Discard unsaved changes?'
          : pendingConfirmation?.kind === 'close-period'
            ? 'Close Finance period?'
            : pendingConfirmation?.kind === 'archive'
              ? 'Archive journal draft?'
              : pendingConfirmation?.kind === 'post'
                ? (pendingConfirmation.type === 'journal-entry' ? 'Post journal entry?' : 'Post petty-cash voucher?')
                : 'Approve Finance record?'}
        description={pendingConfirmation?.kind === 'discard-editor' || pendingConfirmation?.kind === 'discard-vendor-contract'
          ? (pendingConfirmation.kind === 'discard-vendor-contract' ? 'Vendor contract changes have not been saved. Discarding them cannot be undone.' : 'Changes in this form have not been saved. Discarding them cannot be undone.')
          : pendingConfirmation?.kind === 'close-period'
            ? 'Close ' + pendingConfirmation.period + ' after confirming the source records, bank reconciliation, receivables, payables, journals, reports and management sign-off. A closed period blocks further Finance workbook changes.'
            : pendingConfirmation?.kind === 'archive'
              ? 'Archive this unposted draft so it no longer blocks review or period closing. Posted journal entries cannot be archived.'
              : pendingConfirmation?.kind === 'post'
                ? (pendingConfirmation.type === 'journal-entry'
                  ? 'This posts the journal to the ledger. Posted entries are immutable; use an approved reversal or adjusting journal to correct an error.'
                  : 'Posting makes this voucher affect the approved petty-cash running balance. Confirm the supporting receipt and authorization.')
                : 'Confirm that the supporting documents and accounting treatment have been reviewed by an authorized user.'}
        busy={registerSaving || vendorContractSaving}
        closeOnOutsideClick={false}
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="secondary" disabled={registerSaving} onClick={() => setPendingConfirmation(null)}>
              {pendingConfirmation?.kind === 'discard-editor' || pendingConfirmation?.kind === 'discard-vendor-contract' ? 'Keep editing' : 'Cancel'}
            </Button>
            <Button type="button" disabled={registerSaving || vendorContractSaving} loading={registerSaving || vendorContractSaving} onClick={() => void confirmPendingFinanceAction()}>
              {pendingConfirmation?.kind === 'discard-editor' || pendingConfirmation?.kind === 'discard-vendor-contract'
                ? 'Discard changes'
                : pendingConfirmation?.kind === 'close-period'
                  ? 'Confirm close'
                  : pendingConfirmation?.kind === 'archive'
                    ? 'Archive draft'
                    : pendingConfirmation?.kind === 'post'
                      ? 'Confirm post'
                      : 'Confirm approval'}
            </Button>
          </div>
        }
      >
        <div className="space-y-2 text-sm leading-5 text-muted">
          {pendingConfirmation?.kind === 'close-period' && <p>Any outstanding journal draft, missing control, unbalanced posted journal, unresolved source validation, missing bank/processor/cash-count evidence, or non-zero statement-to-GL difference will prevent the server from closing this period.</p>}
          {pendingConfirmation?.kind === 'archive' && <p>Archive is an audit-preserving action. It does not delete the journal history.</p>}
          {pendingConfirmation?.kind === 'post' && pendingConfirmation.type === 'journal-entry' && <p>Maker-checker is enforced by the server. The creator cannot post their own journal.</p>}
        </div>
      </Modal>
    </AdminPageShell>
  );
  return localizeFinanceValue(financePage, language) as React.ReactElement;
};

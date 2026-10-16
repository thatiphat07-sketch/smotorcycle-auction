import { Routes, Route, Link, useLocation } from 'react-router-dom';
import AdminTopup from './AdminTopup';
import AdminItems from './AdminItems';
import { CreditCard, PlusCircle, ShieldAlert } from 'lucide-react';

export default function AdminDashboard() {
  const location = useLocation();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header แอดมิน */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-600/20 border border-red-500/30 text-red-500 rounded-xl">
            <ShieldAlert size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white italic tracking-tight">
              ADMIN DASHBOARD
            </h1>
            <p className="text-xs text-slate-400">ระบบจัดการหลังร้าน ส.มอเตอร์ไซค์</p>
          </div>
        </div>

        {/* แถบเปลี่ยนเมนู */}
        <div className="flex bg-slate-950 p-1.5 rounded-xl border border-slate-800 gap-1">
          <Link
            to="/admin/topup"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
              location.pathname.includes('/admin/topup') || location.pathname === '/admin'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CreditCard size={16} /> ตรวจสลิปเติมเงิน
          </Link>
          <Link
            to="/admin/items"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
              location.pathname.includes('/admin/items')
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <PlusCircle size={16} /> จัดการรายการรถ
          </Link>
        </div>
      </div>

      {/* สลับหน้าการใช้งาน */}
      <section>
        <Routes>
          <Route path="topup" element={<AdminTopup />} />
          <Route path="items" element={<AdminItems />} />
          <Route path="*" element={<AdminTopup />} />
        </Routes>
      </section>
    </div>
  );
}
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { CheckCircle, XCircle, Eye, RefreshCw, CreditCard, Search, Filter, Clock, AlertCircle, X, ShieldCheck } from 'lucide-react';

export default function AdminTopup() {
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // State กรองสถานะและค้นหา
  const [statusFilter, setStatusFilter] = useState('pending'); // 'pending' | 'approved' | 'rejected' | 'all'
  const [searchTerm, setSearchTerm] = useState('');

  // State สำหรับ Modal ดูรูปสลิป
  const [selectedSlip, setSelectedSlip] = useState(null);

  // State สำหรับ Modal ปฏิเสธสลิปพร้อมเหตุผล
  const [rejectingReq, setRejectingReq] = useState(null);
  const [rejectReason, setRejectReason] = useState('ยอดเงินไม่ตรงกับสลิป');

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    filterData();
  }, [requests, statusFilter, searchTerm]);

  // ดึงรายการแจ้งโอนเงินทั้งหมด
  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('topup_requests')
        .select(`
          *,
          profiles:user_id (id, full_name, phone, credit_balance)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching topup requests:', error.message);
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชันกรองข้อมูลตามสถานะและคำค้นหา
  const filterData = () => {
    let result = [...requests];

    if (statusFilter !== 'all') {
      result = result.filter((item) => item.status === statusFilter);
    }

    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (item) =>
          item.profiles?.full_name?.toLowerCase().includes(term) ||
          item.profiles?.phone?.includes(term) ||
          item.amount?.toString().includes(term)
      );
    }

    setFilteredRequests(result);
  };

  // -------------------------------------------------------------
  // 1. ระบบอนุมัติสลิปและเพิ่มเครดิตมัดจำ
  // -------------------------------------------------------------
  const handleApprove = async (request) => {
    const userName = request.profiles?.full_name || 'ลูกค้า';
    const currentBalance = request.profiles?.credit_balance || 0;
    const newBalance = currentBalance + request.amount;

    if (
      !window.confirm(
        `ยืนยันการเติมเครดิตมัดจำจำนวน ฿${request.amount.toLocaleString()} ให้คุณ ${userName}?\n\n(ยอดเดิม: ฿${currentBalance.toLocaleString()} ➔ ยอดใหม่: ฿${newBalance.toLocaleString()})`
      )
    ) {
      return;
    }

    setSubmitting(true);
    try {
      // 1. อัปเดตสถานะรายการเป็น approved
      const { error: reqError } = await supabase
        .from('topup_requests')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString()
        })
        .eq('id', request.id);

      if (reqError) throw reqError;

      // 2. เติมเครดิตสะสมเข้าบัญชีผู้ใช้ใน profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ credit_balance: newBalance })
        .eq('id', request.user_id);

      if (profileError) throw profileError;

      alert(`อนุมัติเติมเครดิตเรียบร้อยแล้ว! เพิ่ม ฿${request.amount.toLocaleString()} ให้คุณ ${userName}`);
      fetchRequests();
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการอนุมัติ: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // 2. ระบบปฏิเสธสลิปการโอนเงิน
  // -------------------------------------------------------------
  const handleConfirmReject = async () => {
    if (!rejectingReq) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('topup_requests')
        .update({
          status: 'rejected',
          note: rejectReason,
          rejected_at: new Date().toISOString()
        })
        .eq('id', rejectingReq.id);

      if (error) throw error;

      alert('ปฏิเสธรายการเรียบร้อยแล้ว');
      setRejectingReq(null);
      fetchRequests();
    } catch (error) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-6">
      
      {/* 1. Header & ปุ่มรีเฟรช */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <CreditCard className="text-red-500" size={24} /> ตรวจสอบสลิปและอนุมัติเครดิต
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            อนุมัติเครดิตมัดจำสู้ราคาให้ลูกค้าเพื่อเข้าร่วมประมูลในห้องประมูล
          </p>
        </div>

        <button 
          onClick={fetchRequests} 
          disabled={loading}
          className="flex items-center justify-center gap-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-xl transition"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> รีเฟรชรายการ
        </button>
      </div>

      {/* 2. แถบกรองสถานะ (Filter Tabs) & ค้นหา */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
        {/* Filter Tabs */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold overflow-x-auto">
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3.5 py-2 rounded-lg transition flex items-center gap-1.5 whitespace-nowrap ${
              statusFilter === 'pending'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock size={14} /> รอตรวจสอบ
            <span className="ml-1 bg-amber-500/20 text-amber-300 text-[10px] px-1.5 py-0.5 rounded-full">
              {requests.filter((r) => r.status === 'pending').length}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('approved')}
            className={`px-3.5 py-2 rounded-lg transition flex items-center gap-1.5 whitespace-nowrap ${
              statusFilter === 'approved'
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CheckCircle size={14} /> อนุมัติแล้ว
            <span className="ml-1 bg-green-500/20 text-green-300 text-[10px] px-1.5 py-0.5 rounded-full">
              {requests.filter((r) => r.status === 'approved').length}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('rejected')}
            className={`px-3.5 py-2 rounded-lg transition flex items-center gap-1.5 whitespace-nowrap ${
              statusFilter === 'rejected'
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <XCircle size={14} /> ปฏิเสธแล้ว
            <span className="ml-1 bg-red-500/20 text-red-300 text-[10px] px-1.5 py-0.5 rounded-full">
              {requests.filter((r) => r.status === 'rejected').length}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3.5 py-2 rounded-lg transition flex items-center gap-1.5 whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ทั้งหมด ({requests.length})
          </button>
        </div>

        {/* ช่องค้นหาลูกค้า */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหาชื่อ, เบอร์โทร, ยอดเงิน..."
            className="w-full md:w-64 bg-slate-950 border border-slate-800 text-white text-xs rounded-xl pl-9 pr-3 py-2.5 focus:border-red-500 focus:outline-none"
          />
        </div>
      </div>

      {/* 3. ตารางแสดงรายการแจ้งโอนเงิน */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-sm">กำลังโหลดรายการแจ้งโอน...</div>
      ) : filteredRequests.length === 0 ? (
        <div className="py-12 text-center text-slate-500 bg-slate-950/50 rounded-xl border border-dashed border-slate-800">
          ไม่พบรายการแจ้งโอนเงินที่ตรงตามเงื่อนไข
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                <th className="p-3.5">วัน-เวลาแจ้งโอน</th>
                <th className="p-3.5">ข้อมูลลูกค้า</th>
                <th className="p-3.5">ยอดแจ้งโอน</th>
                <th className="p-3.5 text-center">สลิปโอนเงิน</th>
                <th className="p-3.5 text-center">สถานะ</th>
                <th className="p-3.5 text-center">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {filteredRequests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-800/40 transition">
                  {/* วัน-เวลา */}
                  <td className="p-3.5 text-slate-400 text-xs whitespace-nowrap">
                    {new Date(req.created_at).toLocaleString('th-TH', {
                      dateStyle: 'short',
                      timeStyle: 'short'
                    })}
                  </td>

                  {/* ข้อมูลลูกค้า */}
                  <td className="p-3.5">
                    <p className="font-bold text-slate-200">{req.profiles?.full_name || 'ไม่ระบุชื่อ'}</p>
                    <p className="text-xs text-slate-400">{req.profiles?.phone || 'ไม่ระบุเบอร์โทร'}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      เครดิตปัจจุบัน: ฿{req.profiles?.credit_balance?.toLocaleString() || 0}
                    </p>
                  </td>

                  {/* ยอดเงิน */}
                  <td className="p-3.5 font-black text-green-400 text-base whitespace-nowrap">
                    ฿{req.amount?.toLocaleString()}
                  </td>

                  {/* รูปสลิป */}
                  <td className="p-3.5 text-center whitespace-nowrap">
                    <button
                      onClick={() => setSelectedSlip(req.slip_url)}
                      className="inline-flex items-center gap-1 text-xs bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 px-3 py-1.5 rounded-lg font-semibold transition"
                    >
                      <Eye size={14} className="text-red-400" /> ดูสลิป
                    </button>
                  </td>

                  {/* สถานะ */}
                  <td className="p-3.5 text-center whitespace-nowrap">
                    {req.status === 'pending' && (
                      <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs px-2.5 py-1 rounded-full font-bold">
                        <Clock size={12} /> รอตรวจสอบ
                      </span>
                    )}
                    {req.status === 'approved' && (
                      <span className="inline-flex items-center gap-1 bg-green-500/10 text-green-400 border border-green-500/30 text-xs px-2.5 py-1 rounded-full font-bold">
                        <ShieldCheck size={12} /> อนุมัติแล้ว
                      </span>
                    )}
                    {req.status === 'rejected' && (
                      <div className="flex flex-col items-center">
                        <span className="inline-flex items-center gap-1 bg-red-500/10 text-red-400 border border-red-500/30 text-xs px-2.5 py-1 rounded-full font-bold">
                          <XCircle size={12} /> ปฏิเสธ
                        </span>
                        {req.note && <span className="text-[10px] text-slate-500 mt-1">{req.note}</span>}
                      </div>
                    )}
                  </td>

                  {/* ปุ่มอนุมัติ/ปฏิเสธ */}
                  <td className="p-3.5 text-center whitespace-nowrap space-x-2">
                    {req.status === 'pending' ? (
                      <>
                        <button
                          onClick={() => handleApprove(req)}
                          disabled={submitting}
                          className="inline-flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-lg shadow-green-600/20 disabled:bg-slate-800"
                        >
                          <CheckCircle size={14} /> อนุมัติ
                        </button>
                        <button
                          onClick={() => setRejectingReq(req)}
                          disabled={submitting}
                          className="inline-flex items-center gap-1 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 px-3 py-1.5 rounded-lg text-xs font-bold transition disabled:bg-slate-800"
                        >
                          <XCircle size={14} /> ปฏิเสธ
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-slate-500 italic">ดำเนินการแล้ว</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 4. MODAL ขยายดูรูปภาพสลิป */}
      {selectedSlip && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl max-w-md w-full relative shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">ตรวจสอบหลักฐานการโอนเงิน (สลิป)</h3>
              <button
                onClick={() => setSelectedSlip(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg bg-slate-950 border border-slate-800"
              >
                <X size={18} />
              </button>
            </div>
            <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 flex justify-center">
              <img src={selectedSlip} alt="Slip" className="w-full max-h-[65vh] object-contain rounded-lg" />
            </div>
            <button
              onClick={() => setSelectedSlip(null)}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-xl font-bold text-sm transition border border-slate-700"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}

      {/* 5. MODAL ปฏิเสธสลิปพร้อมระบุเหตุผล */}
      {rejectingReq && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-md w-full relative shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <AlertCircle className="text-red-500" size={20} /> ปฏิเสธรายการแจ้งโอน
              </h3>
              <button
                onClick={() => setRejectingReq(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg bg-slate-950 border border-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              ระบุเหตุผลในการปฏิเสธรายการแจ้งโอนเงินของ <strong>{rejectingReq.profiles?.full_name || 'ลูกค้า'}</strong> (฿{rejectingReq.amount?.toLocaleString()}):
            </p>

            <div className="space-y-2">
              <select
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl p-3 focus:border-red-500 focus:outline-none"
              >
                <option value="ยอดเงินไม่ตรงกับสลิป">ยอดเงินไม่ตรงกับสลิป</option>
                <option value="สลิปซ้ำ หรือมีการใช้งานแล้ว">สลิปซ้ำ หรือมีการใช้งานแล้ว</option>
                <option value="ภาพสลิปไม่ชัดเจน / อ่านยอดเงินไม่ได้">ภาพสลิปไม่ชัดเจน / อ่านยอดเงินไม่ได้</option>
                <option value="ไม่พบยอดเงินเข้าบัญชีร้าน">ไม่พบยอดเงินเข้าบัญชีร้าน</option>
                <option value="อื่นๆ (ระบุเพิ่มเติม)">อื่นๆ</option>
              </select>

              {rejectReason.startsWith('อื่นๆ') && (
                <input
                  type="text"
                  placeholder="ระบุเหตุผลเพิ่มเติม..."
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl p-3 focus:border-red-500 focus:outline-none"
                />
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleConfirmReject}
                disabled={submitting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl font-bold text-xs transition shadow-lg shadow-red-600/30 disabled:bg-slate-800"
              >
                {submitting ? 'กำลังปฏิเสธ...' : 'ยืนยันปฏิเสธ'}
              </button>
              <button
                onClick={() => setRejectingReq(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2.5 rounded-xl font-bold text-xs transition border border-slate-700"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
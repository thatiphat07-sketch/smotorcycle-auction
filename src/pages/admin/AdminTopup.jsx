import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { CheckCircle, XCircle, Eye, RefreshCw, CreditCard } from 'lucide-react';

export default function AdminTopup() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlip, setSelectedSlip] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('topup_requests')
        .select(`
          *,
          profiles:user_id (full_name, phone)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching topup requests:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request) => {
    const userName = request.profiles?.full_name || 'ลูกค้า';
    if (!window.confirm(`ยืนยันการเติมเครดิต ฿${request.amount.toLocaleString()} ให้คุณ ${userName} หรือไม่?`)) return;

    try {
      const { error } = await supabase.rpc('approve_topup', {
        req_id: request.id,
        target_user_id: request.user_id,
        topup_amount: request.amount
      });

      if (error) throw error;

      alert('อนุมัติเติมเครดิตเรียบร้อยแล้ว!');
      fetchRequests();
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการอนุมัติ: ' + error.message);
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('ปฏิเสธรายการแจ้งโอนเงินนี้ใช่หรือไม่?')) return;

    try {
      const { error } = await supabase
        .from('topup_requests')
        .update({ status: 'rejected' })
        .eq('id', id);

      if (error) throw error;

      alert('ปฏิเสธรายการเรียบร้อยแล้ว');
      fetchRequests();
    } catch (error) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    }
  };

  return (
    <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <CreditCard className="text-red-500" /> ตรวจสอบสลิปและอนุมัติเครดิต
          </h2>
          <p className="text-xs text-slate-400 mt-1">รายการแจ้งโอนเงินคงค้างที่รอการตรวจสอบ</p>
        </div>
        <button 
          onClick={fetchRequests} 
          className="flex items-center justify-center gap-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-lg transition"
        >
          <RefreshCw size={14} /> รีเฟรชรายการ
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400 text-sm">กำลังโหลดรายการรอตรวจสอบ...</div>
      ) : requests.length === 0 ? (
        <div className="py-12 text-center text-slate-500 bg-slate-950/50 rounded-xl border border-dashed border-slate-800">
          ไม่มีรายการแจ้งโอนเงินที่รออนุมัติในขณะนี้
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                <th className="p-3.5">วัน-เวลา</th>
                <th className="p-3.5">ข้อมูลลูกค้า</th>
                <th className="p-3.5">ยอดโอนเงิน</th>
                <th className="p-3.5 text-center">สลิป</th>
                <th className="p-3.5 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {requests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-800/40 transition">
                  <td className="p-3.5 text-slate-400 text-xs">
                    {new Date(req.created_at).toLocaleString('th-TH', {
                      dateStyle: 'short',
                      timeStyle: 'short'
                    })}
                  </td>
                  <td className="p-3.5">
                    <p className="font-bold text-slate-200">{req.profiles?.full_name || 'ไม่ระบุชื่อ'}</p>
                    <p className="text-xs text-slate-400">{req.profiles?.phone || '-'}</p>
                  </td>
                  <td className="p-3.5 font-black text-green-400 text-base">
                    ฿{req.amount.toLocaleString()}
                  </td>
                  <td className="p-3.5 text-center">
                    <button
                      onClick={() => setSelectedSlip(req.slip_url)}
                      className="inline-flex items-center gap-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-2.5 py-1.5 rounded-md font-semibold transition"
                    >
                      <Eye size={14} className="text-red-400" /> ดูสลิป
                    </button>
                  </td>
                  <td className="p-3.5 text-center space-x-2">
                    <button
                      onClick={() => handleApprove(req)}
                      className="inline-flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-lg shadow-green-600/20"
                    >
                      <CheckCircle size={14} /> อนุมัติ
                    </button>
                    <button
                      onClick={() => handleReject(req.id)}
                      className="inline-flex items-center gap-1 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 px-3 py-1.5 rounded-lg text-xs font-bold transition"
                    >
                      <XCircle size={14} /> ปฏิเสธ
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pop-up ดูภาพสลิป */}
      {selectedSlip && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl max-w-md w-full relative shadow-2xl space-y-4">
            <h3 className="font-bold text-white text-base">รูปภาพสลิปการโอนเงิน</h3>
            <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
              <img src={selectedSlip} alt="Slip" className="w-full max-h-[65vh] object-contain rounded-lg" />
            </div>
            <button
              onClick={() => setSelectedSlip(null)}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-lg font-bold text-sm transition border border-slate-700"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
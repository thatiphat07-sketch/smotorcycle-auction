import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { CheckCircle, XCircle, Eye, RefreshCw } from 'lucide-react';

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
    <div className="bg-white p-6 rounded-xl shadow-md border">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">อนุมัติการเติมเครดิตมัดจำ</h2>
        <button 
          onClick={fetchRequests} 
          className="flex items-center gap-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition"
        >
          <RefreshCw size={16} /> รีเฟรชข้อมูล
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-500">กำลังโหลดรายการรอตรวจสอบ...</div>
      ) : requests.length === 0 ? (
        <div className="py-12 text-center text-gray-400 bg-gray-50 rounded-lg border border-dashed">
          ไม่มีรายการแจ้งโอนเงินที่รอตรวจสอบในขณะนี้
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-700 text-sm">
                <th className="p-3 border-b">วัน-เวลา</th>
                <th className="p-3 border-b">ข้อมูลลูกค้า</th>
                <th className="p-3 border-b">ยอดเงินแจ้งโอน</th>
                <th className="p-3 border-b text-center">สลิปโอนเงิน</th>
                <th className="p-3 border-b text-center">การดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {requests.map((req) => (
                <tr key={req.id} className="hover:bg-gray-50 transition">
                  <td className="p-3 text-gray-600">
                    {new Date(req.created_at).toLocaleString('th-TH', {
                      dateStyle: 'short',
                      timeStyle: 'short'
                    })}
                  </td>
                  <td className="p-3">
                    <p className="font-semibold text-gray-800">{req.profiles?.full_name || 'ไม่ระบุชื่อ'}</p>
                    <p className="text-xs text-gray-500">{req.profiles?.phone || '-'}</p>
                  </td>
                  <td className="p-3 font-bold text-green-600 text-base">
                    ฿{req.amount.toLocaleString()}
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => setSelectedSlip(req.slip_url)}
                      className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-2.5 py-1.5 rounded-md font-medium transition"
                    >
                      <Eye size={14} /> ดูรูปสลิป
                    </button>
                  </td>
                  <td className="p-3 text-center space-x-2">
                    <button
                      onClick={() => handleApprove(req)}
                      className="inline-flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-sm"
                    >
                      <CheckCircle size={14} /> อนุมัติ
                    </button>
                    <button
                      onClick={() => handleReject(req.id)}
                      className="inline-flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-sm"
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

      {selectedSlip && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-4 rounded-xl max-w-md w-full relative shadow-2xl">
            <h3 className="font-bold text-gray-800 mb-3">รูปภาพสลิปการโอนเงิน</h3>
            <img src={selectedSlip} alt="Slip Preview" className="w-full max-h-[70vh] object-contain rounded-lg border" />
            <button
              onClick={() => setSelectedSlip(null)}
              className="mt-4 w-full bg-gray-800 hover:bg-gray-900 text-white py-2 rounded-lg font-semibold text-sm transition"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
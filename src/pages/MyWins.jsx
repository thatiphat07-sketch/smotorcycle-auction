import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Trophy, Wallet, CheckCircle, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function MyWins() {
  const [wonItems, setWonItems] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchMyWins();
  }, []);

  const fetchMyWins = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // ดึงข้อมูลผู้ใช้ (เพื่อเช็กยอดเครดิต)
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      setProfile(profileData);

      // ดึงข้อมูลรถที่ประมูลชนะจาก View (สถานะต้องไม่ใช่ 'paid' หรือรับรถไปแล้ว)
      const { data: winsData } = await supabase
        .from('winning_bids')
        .select('*')
        .eq('winner_id', user.id)
        .order('end_time', { ascending: false });

      setWonItems(winsData || []);
    } catch (error) {
      console.error('Error fetching wins:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (item) => {
    if (!profile) return;
    
    // เช็กว่าเครดิตพอจ่ายหรือไม่
    if (profile.credit_balance < item.winning_amount) {
      return alert(`เครดิตของคุณไม่เพียงพอ! ขาดอีก ฿${(item.winning_amount - profile.credit_balance).toLocaleString()} กรุณาเติมเงินเข้าระบบ`);
    }

    if (!window.confirm(`ยืนยันการชำระเงิน ฿${item.winning_amount.toLocaleString()} สำหรับ ${item.title} หรือไม่?`)) return;

    setProcessingId(item.item_id);
    try {
      const newBalance = profile.credit_balance - item.winning_amount;

      // 1. ตัดเงินจากบัญชี Profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ credit_balance: newBalance })
        .eq('id', profile.id);
      if (profileError) throw profileError;

      // 2. เปลี่ยนสถานะรถเป็น 'paid' (ชำระเงินแล้ว) เพื่อไม่ให้คนอื่นยุ่งได้อีก
      const { error: itemError } = await supabase
        .from('auction_items')
        .update({ status: 'paid' })
        .eq('id', item.item_id);
      if (itemError) throw itemError;

      alert('ชำระเงินสำเร็จ! กรุณาติดต่อแอดมินเพื่อรับรถครับ');
      fetchMyWins(); // โหลดข้อมูลใหม่
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการชำระเงิน: ' + error.message);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <div className="text-center py-12 text-slate-400">กำลังโหลดข้อมูล...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Trophy className="text-amber-400" /> รถที่ฉันประมูลชนะ
          </h1>
          <p className="text-slate-400 text-sm mt-1">ชำระเงินผ่านเครดิตเพื่อยืนยันการรับสิทธิ์</p>
        </div>
        <div className="bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 text-right">
          <p className="text-xs text-slate-400 font-bold">เครดิตคงเหลือ</p>
          <p className="text-lg font-black text-green-400">฿{profile?.credit_balance?.toLocaleString() || 0}</p>
        </div>
      </div>

      <div className="space-y-4">
        {wonItems.length === 0 ? (
          <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 text-center space-y-3">
            <AlertCircle size={40} className="text-slate-500 mx-auto" />
            <p className="text-slate-400 font-bold">คุณยังไม่มีรายการที่ประมูลชนะในขณะนี้</p>
            <Link to="/" className="inline-block bg-red-600 text-white px-6 py-2 rounded-xl font-bold mt-2">
              กลับไปดูรถประมูล
            </Link>
          </div>
        ) : (
          wonItems.map((item) => (
            <div key={item.item_id} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row gap-4 items-center">
              <img src={item.image_url} alt={item.title} className="w-full sm:w-32 h-24 object-cover rounded-xl bg-slate-950" />
              
              <div className="flex-1 w-full space-y-1">
                <h3 className="font-bold text-white text-lg">{item.title}</h3>
                <p className="text-xs text-slate-400">ปิดประมูลเมื่อ: {new Date(item.end_time).toLocaleString('th-TH')}</p>
                <div className="text-sm font-bold text-slate-300 mt-2">
                  ราคาที่ชนะ: <span className="text-red-400 text-xl font-black">฿{item.winning_amount?.toLocaleString()}</span>
                </div>
              </div>

              <div className="w-full sm:w-auto">
                {item.status === 'paid' ? (
                  <div className="flex items-center justify-center gap-2 bg-green-500/10 text-green-400 border border-green-500/30 px-6 py-3 rounded-xl font-bold w-full">
                    <CheckCircle size={20} /> ชำระเงินแล้ว
                  </div>
                ) : (
                  <button
                    onClick={() => handlePayment(item)}
                    disabled={processingId === item.item_id}
                    className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-black transition w-full disabled:opacity-50"
                  >
                    <Wallet size={20} /> 
                    {processingId === item.item_id ? 'กำลังทำรายการ...' : 'ชำระเงินรับรถ'}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
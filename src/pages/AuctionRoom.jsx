import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Gavel, ShieldCheck, AlertCircle } from 'lucide-react';

export default function AuctionRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [item, setItem] = useState(null);
  const [bids, setBids] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();

    // ฟังการเสนอราคาแบบ Real-time
    const subscription = supabase
      .channel(`auction-${id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bids', filter: `auction_item_id=eq.${id}` }, 
        (payload) => {
          fetchBids(); // โหลดรายการราคาใหม่เมื่อมีคนเสนอราคา
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [id]);

  const fetchData = async () => {
    try {
      // 1. ดึงข้อมูลสินค้ารายการนี้
      const { data: itemData, error: itemError } = await supabase
        .from('auction_items')
        .select('*')
        .eq('id', id)
        .single();
      if (itemError) throw itemError;
      setItem(itemData);

      // 2. ดึงประวัติการเสนอราคา
      await fetchBids();

      // 3. ดึงข้อมูล User และ เครดิต
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setUserProfile(profileData);
      }
    } catch (error) {
      console.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchBids = async () => {
    const { data, error } = await supabase
      .from('bids')
      .select('*, profiles(full_name)')
      .eq('auction_item_id', id)
      .order('amount', { ascending: false });
    if (!error) setBids(data || []);
  };

  // คำนวณราคาสูงสุด ณ ปัจจุบัน
  const currentMaxBid = bids.length > 0 ? bids[0].amount : (item?.base_price || 0);
  const minNextBid = currentMaxBid + 100; // เพิ่มขั้นต่ำครั้งละ 100 บาท

  const handlePlaceBid = async (e) => {
    e.preventDefault();
    if (!userProfile) {
      alert('กรุณาเข้าสู่ระบบก่อนเสนอราคา');
      return navigate('/auth');
    }

    // เช็คเครดิตมัดจำคงเหลือ
    if ((userProfile.credit_balance || 0) < item.deposit_required) {
      alert(`คุณต้องมีเครดิตมัดจำอย่างน้อย ฿${item.deposit_required.toLocaleString()} จึงจะเสนอราคาได้`);
      return navigate('/topup');
    }

    const amountNum = parseFloat(bidAmount);
    if (isNaN(amountNum) || amountNum < minNextBid) {
      alert(`กรุณาเสนอราคามากกว่า ฿${minNextBid.toLocaleString()}`);
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('bids').insert([
        {
          auction_item_id: id,
          user_id: userProfile.id,
          amount: amountNum,
        }
      ]);

      if (error) throw error;
      setBidAmount('');
      alert('เสนอราคาสำเร็จ!');
    } catch (error) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center p-10">กำลังโหลดห้องประมูล...</div>;
  if (!item) return <div className="text-center p-10">ไม่พบรายการประมูลนี้</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button onClick={() => navigate('/')} className="flex items-center gap-1 text-gray-600 hover:text-blue-600">
        <ArrowLeft size={18} /> ย้อนกลับหน้าร้าน
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-xl shadow-md border">
        {/* รูปภาพและรายละเอียด */}
        <div>
          <img src={item.image_url} alt={item.title} className="w-full h-64 object-cover rounded-lg border mb-4" />
          <h1 className="text-2xl font-bold text-gray-800">{item.title}</h1>
          <p className="text-gray-600 mt-2 text-sm">{item.description}</p>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-800 flex items-center gap-2">
            <ShieldCheck size={18} />
            <span>ต้องมัดจำป้ายประมูล <b>฿{item.deposit_required.toLocaleString()}</b> (สิทธิ์คงเหลือ: ฿{userProfile?.credit_balance || 0})</span>
          </div>
        </div>

        {/* กระดานเสนอราคา */}
        <div className="flex flex-col justify-between border-l md:pl-6 pt-4 md:pt-0">
          <div>
            <p className="text-sm text-gray-500">ราคาปัจจุบัน</p>
            <p className="text-4xl font-bold text-red-600 my-1">
              ฿ {currentMaxBid.toLocaleString()}
            </p>
            <p className="text-xs text-gray-400">ราคาเริ่มต้น: ฿{item.base_price.toLocaleString()}</p>

            {/* ฟอร์มเสนอราคา */}
            <form onSubmit={handlePlaceBid} className="mt-6 space-y-3">
              <label className="block text-sm font-semibold text-gray-700">
                เสนอราคาใหม่ (ขั้นต่ำ ฿{minNextBid.toLocaleString()})
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  placeholder={`ระบุจำนวนเงิน...`}
                  className="flex-1 border p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  min={minNextBid}
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-red-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-red-700 transition flex items-center gap-1 disabled:bg-gray-400"
                >
                  <Gavel size={18} /> เสนอราคา
                </button>
              </div>
            </form>
          </div>

          {/* ประวัติการสู้ราคา */}
          <div className="mt-6">
            <h3 className="font-bold text-gray-700 mb-2 border-b pb-1 text-sm">ประวัติการเสนอราคา</h3>
            <div className="max-h-40 overflow-y-auto space-y-2">
              {bids.length === 0 ? (
                <p className="text-xs text-gray-400">ยังไม่มีการเสนอราคา เป็นคนแรกเลย!</p>
              ) : (
                bids.map((bid, index) => (
                  <div key={bid.id} className={`flex justify-between items-center text-xs p-2 rounded ${index === 0 ? 'bg-green-50 text-green-800 font-bold' : 'bg-gray-50 text-gray-600'}`}>
                    <span>{bid.profiles?.full_name || 'ผู้ประมูล'}</span>
                    <span>฿{bid.amount.toLocaleString()}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
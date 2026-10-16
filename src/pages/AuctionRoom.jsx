import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Gavel, ShieldCheck, Clock, Flame, User, Video, AlertCircle } from 'lucide-react';

export default function AuctionRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [item, setItem] = useState(null);
  const [bids, setBids] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');

  // State สำหรับเวลาถอยหลัง
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0, isEnded: false });

  useEffect(() => {
    fetchData();

    // ฟังการอัปเดตข้อมูล Real-time (ทั้งราคาประมูลและการแก้ไขเวลาจากแอดมิน)
    const channel = supabase
      .channel(`auction-room-${id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bids', filter: `auction_item_id=eq.${id}` }, 
        () => fetchBids()
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'auction_items', filter: `id=eq.${id}` }, 
        (payload) => setItem(payload.new)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  // ระบบนับถอยหลัง Real-time
  useEffect(() => {
    if (!item?.end_time) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const endTime = new Date(item.end_time).getTime();
      const distance = endTime - now;

      if (distance <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, isEnded: true });
        clearInterval(interval);
      } else {
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        setTimeLeft({ hours, minutes, seconds, isEnded: false });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [item?.end_time]);

  const fetchData = async () => {
    try {
      const { data: itemData, error: itemError } = await supabase
        .from('auction_items')
        .select('*')
        .eq('id', id)
        .single();
      if (itemError) throw itemError;
      
      setItem(itemData);
      
      const imgs = Array.isArray(itemData.images) && itemData.images.length > 0 ? itemData.images : [itemData.image_url];
      setSelectedImage(imgs[0]);

      await fetchBids();

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

  const currentMaxBid = bids.length > 0 ? bids[0].amount : (item?.base_price || 0);
  const minNextBid = currentMaxBid + 100;

  const handlePlaceBid = async (e) => {
    e.preventDefault();
    if (timeLeft.isEnded) return alert('รายการประมูลนี้ปิดลงแล้ว');
    if (!userProfile) {
      alert('กรุณาเข้าสู่ระบบก่อนเสนอราคา');
      return navigate('/auth');
    }

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
    } catch (error) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-semibold tracking-wider">กำลังเข้าสู่ห้องประมูล ส.มอเตอร์ไซค์...</p>
      </div>
    );
  }

  if (!item) return <div className="text-center p-10 text-slate-400">ไม่พบรายการประมูลนี้</div>;

  const imageList = Array.isArray(item.images) && item.images.length > 0 ? item.images : [item.image_url];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <button 
        onClick={() => navigate('/')} 
        className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-red-400 transition bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-lg"
      >
        <ArrowLeft size={16} /> ย้อนกลับหน้าร้าน
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ฝั่งซ้าย: ดูสินค้าสด / รูปภาพ / รายละเอียด */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl space-y-4">
            
            {/* วิดีโอถ่ายทอดสด (ถ้ามีลิงก์ Live) */}
            {item.live_url ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-red-400">
                  <span className="flex items-center gap-1.5"><Video size={16} className="animate-pulse" /> ถ่ายทอดสดสภาพสินค้าจริง</span>
                  <span className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded font-black uppercase">LIVE</span>
                </div>
                <div className="aspect-video w-full rounded-xl overflow-hidden bg-black border border-slate-800">
                  <iframe
                    src={item.live_url.replace('watch?v=', 'embed/')}
                    title="Live Stream"
                    className="w-full h-full"
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
            ) : null}

            {/* รูปภาพหลัก */}
            <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
              <img src={selectedImage || item.image_url} alt={item.title} className="w-full h-72 sm:h-96 object-cover" />
              <div className="absolute top-3 left-3 bg-slate-950/90 backdrop-blur-md px-3 py-1 rounded-lg border border-slate-700 text-xs font-bold text-red-400 flex items-center gap-1.5 shadow-lg">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span> Live Auction
              </div>
            </div>

            {/* อัลบั้มรูปย่อย */}
            {imageList.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                {imageList.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(img)}
                    className={`relative rounded-lg overflow-hidden border-2 flex-shrink-0 w-20 h-20 transition ${
                      selectedImage === img ? 'border-red-600 scale-95 shadow-lg shadow-red-600/30' : 'border-slate-800 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`มุมที่ ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            <div>
              <h1 className="text-2xl font-black text-white italic tracking-tight">{item.title}</h1>
              <p className="text-slate-400 text-xs mt-2 leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                {item.description || 'สภาพสวย พร้อมใช้งาน ตรวจสอบระบบไฟและเครื่องยนต์โดยช่างผู้เชี่ยวชาญจากร้าน ส.มอเตอร์ไซค์'}
              </p>
            </div>

            <div className="bg-gradient-to-r from-slate-950 to-slate-900 border border-red-900/40 p-4 rounded-xl flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <ShieldCheck size={20} className="text-green-400 flex-shrink-0" />
                <span>มัดจำป้ายประมูล: <strong className="text-red-400 font-bold">฿{item.deposit_required?.toLocaleString()}</strong></span>
              </div>
              <span className="text-[11px] bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md border border-slate-700">
                เครดิตคุณ: ฿{userProfile?.credit_balance?.toLocaleString() || 0}
              </span>
            </div>
          </div>
        </div>

        {/* ฝั่งขวา: นาฬิกานับถอยหลัง + กระดานสู้ราคา */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-6 flex flex-col justify-between h-full">
            
            <div className="space-y-5">
              {/* ตัวนับถอยหลังปิดประมูล */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-bold">
                  <Clock size={18} className="text-red-500" />
                  <span>ระยะเวลาคงเหลือ</span>
                </div>
                {timeLeft.isEnded ? (
                  <span className="bg-red-600 text-white font-black text-xs px-3 py-1 rounded-lg uppercase tracking-wider">
                    ปิดประมูลแล้ว
                  </span>
                ) : (
                  <div className="flex gap-1.5 font-mono font-black text-red-500 text-lg">
                    <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">{String(timeLeft.hours).padStart(2, '0')}</span>:
                    <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">{String(timeLeft.minutes).padStart(2, '0')}</span>:
                    <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">{String(timeLeft.seconds).padStart(2, '0')}</span>
                  </div>
                )}
              </div>

              {/* ราคาสูงสุดปัจจุบัน */}
              <div className="bg-slate-950 p-5 rounded-xl border border-red-600/30 text-center relative overflow-hidden">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-widest block mb-1">ราคาปัจจุบัน</span>
                <p className="text-4xl font-black text-red-500 tracking-tight glow-red">
                  ฿ {currentMaxBid.toLocaleString()}
                </p>
                <span className="text-[11px] text-slate-500 mt-1 block">ราคาเริ่มต้น: ฿{item.base_price?.toLocaleString()}</span>
              </div>

              {/* ฟอร์มเสนอราคา */}
              <form onSubmit={handlePlaceBid} className="space-y-3">
                <div className="flex justify-between items-center text-xs font-bold text-slate-300">
                  <span>ระบุราคาที่ต้องการสู้</span>
                  <span className="text-red-400">ขั้นต่ำ ฿{minNextBid.toLocaleString()}</span>
                </div>
                
                <div className="flex gap-2">
                  <input
                    type="number"
                    disabled={timeLeft.isEnded}
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    placeholder={timeLeft.isEnded ? "ปิดการประมูล" : `เช่น ${minNextBid}`}
                    className="flex-1 bg-slate-950 border border-slate-800 text-white p-3 rounded-xl font-bold focus:border-red-500 focus:outline-none text-base disabled:opacity-50"
                    min={minNextBid}
                  />
                  <button
                    type="submit"
                    disabled={submitting || timeLeft.isEnded}
                    className="bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-xl font-black tracking-wider uppercase transition shadow-lg shadow-red-600/30 flex items-center gap-1.5 disabled:bg-slate-800 disabled:opacity-50"
                  >
                    <Gavel size={18} /> {timeLeft.isEnded ? 'หมดเวลา' : 'สู้ราคา'}
                  </button>
                </div>
              </form>
            </div>

            {/* ประวัติการสู้ราคา */}
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <h3 className="font-extrabold text-sm text-slate-200 flex items-center justify-between">
                <span className="flex items-center gap-1.5"><Flame size={16} className="text-red-500" /> ประวัติการเคาะราคา</span>
                <span className="text-[10px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">{bids.length} รายการ</span>
              </h3>

              <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                {bids.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-500 bg-slate-950/50 rounded-xl border border-dashed border-slate-800">
                    ยังไม่มีการเสนอราคา เป็นคนแรกที่เริ่มสู้ราคาเลย!
                  </div>
                ) : (
                  bids.map((bid, index) => (
                    <div 
                      key={bid.id} 
                      className={`flex justify-between items-center text-xs p-3 rounded-xl border transition ${
                        index === 0 
                          ? 'bg-red-950/40 border-red-600/50 text-white font-bold shadow-md' 
                          : 'bg-slate-950 border-slate-800/80 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <User size={14} className={index === 0 ? 'text-red-400' : 'text-slate-500'} />
                        <span className="line-clamp-1">{bid.profiles?.full_name || 'ผู้ร่วมประมูล'}</span>
                        {index === 0 && <span className="bg-red-600 text-white text-[9px] px-1.5 py-0.5 rounded uppercase">ผู้นำ</span>}
                      </div>
                      <span className={index === 0 ? 'text-red-400 font-extrabold text-sm' : 'font-semibold'}>
                        ฿{bid.amount.toLocaleString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
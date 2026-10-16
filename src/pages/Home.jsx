import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Flame, ShieldCheck, Zap, Gauge, ArrowRight } from 'lucide-react';

export default function Home() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItems();
  }, []);

const fetchItems = async () => {
  try {
    const { data, error } = await supabase
      .from('auction_items')
      .select('*')
      .eq('status', 'active'); // ตัด .order() ออกชั่วคราวเพื่อป้องกัน Error 400

    if (error) throw error;
    setItems(data || []);
  } catch (error) {
    console.error('Error fetching data:', error);
  } finally {
    setLoading(false);
  }
};

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-semibold tracking-wider">กำลังโหลดสนามประมูล ส.มอเตอร์ไซค์...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-12">
      {/* Hero Banner ดุดัน สไตล์สนามแข่ง */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-red-950 border border-slate-800 p-8 md:p-12 shadow-2xl">
        <div className="absolute -right-10 -bottom-10 opacity-10 text-white font-black text-9xl italic pointer-events-none select-none">
          SPEED
        </div>
        
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/20 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-widest">
            <Flame size={14} className="animate-bounce" /> ลานประมูลรถจักรยานยนต์มือสองคุณภาพ
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white italic tracking-tight leading-tight">
            ประมูลมอเตอร์ไซค์ <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-400">สู้ราคา Real-time</span>
          </h1>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed">
            คัดสภาพเกรด A+ เช็ก ECU ลิขสิทธิ์เฉพาะร้าน <strong className="text-white">ส.มอเตอร์ไซค์</strong> มั่นใจ ได้รถจริง โปร่งใสทุกขั้นตอน
          </p>
          <div className="pt-2 flex flex-wrap gap-4 text-xs font-semibold text-slate-400">
            <span className="flex items-center gap-1 text-slate-300">
              <ShieldCheck size={16} className="text-green-400" /> เครดิตมัดจำปลอดภัย
            </span>
            <span className="flex items-center gap-1 text-slate-300">
              <Zap size={16} className="text-yellow-400" /> ระบบเสนอราคาทันที
            </span>
            <span className="flex items-center gap-1 text-slate-300">
              <Gauge size={16} className="text-blue-400" /> ตรวจเช็คเครื่องยนต์แล้ว
            </span>
          </div>
        </div>
      </div>

      {/* หัวข้อรายการรถ */}
      <div className="flex justify-between items-end border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-2xl font-black text-slate-100 flex items-center gap-2">
            <Flame className="text-red-600" /> รายการรถที่กำลังเปิดประมูล
          </h2>
          <p className="text-xs text-slate-400 mt-1">เลือกคันที่ใช่ แล้วกดเข้าห้องสู้ราคาได้ทันที</p>
        </div>
        <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-full font-bold border border-slate-700">
          ทั้งหมด {items.length} คัน
        </span>
      </div>

      {/* แสดงการ์ดรายการรถ */}
      {items.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/50 rounded-2xl border border-dashed border-slate-800">
          <p className="text-slate-400 font-medium">ขณะนี้ยังไม่มีรถเปิดประมูลในระบบ</p>
          <p className="text-xs text-slate-500 mt-1">โปรดติดตามรอบการประมูลถัดไปจาก ร้าน ส.มอเตอร์ไซค์</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div 
              key={item.id} 
              className="group bg-slate-900 rounded-xl border border-slate-800 hover:border-red-600/50 transition-all duration-300 shadow-xl overflow-hidden flex flex-col justify-between hover:-translate-y-1"
            >
              <div>
                {/* รูปภาพพร้อม Badge */}
                <div className="relative h-52 bg-slate-950 overflow-hidden">
                  <img 
                    src={item.image_url} 
                    alt={item.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100" 
                  />
                  <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-md border border-slate-700 text-[11px] font-bold text-red-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span> Live Auction
                  </div>
                  <div className="absolute bottom-3 right-3 bg-red-600/90 text-white text-xs font-extrabold px-2.5 py-1 rounded shadow">
                    มัดจำ ฿{item.deposit_required?.toLocaleString()}
                  </div>
                </div>

                {/* รายละเอียดรถ */}
                <div className="p-5 space-y-3">
                  <h3 className="font-extrabold text-lg text-slate-100 group-hover:text-red-400 transition line-clamp-1">
                    {item.title}
                  </h3>
                  <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed">
                    {item.description || 'สภาพสวย พร้อมใช้งาน ตรวจสอบระบบไฟและเครื่องยนต์เรียบร้อย'}
                  </p>
                  
                  {/* ราคาเริ่มต้น */}
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">ราคาเริ่มต้น</span>
                      <span className="text-xl font-black text-red-500">
                        ฿ {item.base_price?.toLocaleString()}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 font-semibold bg-slate-800 px-2 py-1 rounded border border-slate-700">
                      ก้าวละ ฿100
                    </span>
                  </div>
                </div>
              </div>

              {/* ปุ่มกดเข้าห้องประมูล */}
              <div className="p-5 pt-0">
                <Link
                  to={`/auction/${item.id}`}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-black text-sm uppercase tracking-wider transition duration-200 flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 group-hover:shadow-red-600/40"
                >
                  เข้าห้องสู้ราคา <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
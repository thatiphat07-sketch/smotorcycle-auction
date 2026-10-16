import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { PlusCircle, Trash2, Motorbike, Image, AlertCircle } from 'lucide-react';

export default function AdminItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // ฟอร์มเพิ่มรถคันใหม่
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [depositRequired, setDepositRequired] = useState('500');
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('auction_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!title || !basePrice || !imageUrl) return alert('กรุณากรอกข้อมูลให้ครบถ้วน');

    setSubmitting(true);
    try {
      const { error } = await supabase.from('auction_items').insert([
        {
          title,
          description,
          base_price: parseFloat(basePrice),
          deposit_required: parseFloat(depositRequired),
          image_url: imageUrl,
          status: 'active'
        }
      ]);

      if (error) throw error;

      alert('ลงประกาศรถคันใหม่เรียบร้อย!');
      setTitle('');
      setDescription('');
      setBasePrice('');
      setImageUrl('');
      fetchItems();
    } catch (error) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบรายการประมูลนี้?')) return;

    try {
      const { error } = await supabase.from('auction_items').delete().eq('id', id);
      if (error) throw error;
      alert('ลบรายการเรียบร้อย');
      fetchItems();
    } catch (error) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    }
  };

  return (
    <div className="space-y-8">
      {/* ฟอร์มลงประกาศรถคันใหม่ */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-6">
        <h2 className="text-xl font-black text-white flex items-center gap-2 border-b border-slate-800 pb-4">
          <PlusCircle className="text-red-500" /> ลงประกาศรถ/อะไหล่ประมูลคันใหม่
        </h2>

        <form onSubmit={handleAddItem} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-300 mb-1">ยี่ห้อ / รุ่นรถ</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น Honda Wave 110i ปี 2023 สภาพสวย เช็ก ECU แล้ว"
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 focus:border-red-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">ราคาเริ่มต้น (บาท)</label>
            <input
              type="number"
              required
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              placeholder="15000"
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 focus:border-red-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">เครดิตมัดจำสู้ราคา (บาท)</label>
            <input
              type="number"
              required
              value={depositRequired}
              onChange={(e) => setDepositRequired(e.target.value)}
              placeholder="500"
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 focus:border-red-500 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-300 mb-1">URL รูปภาพรถ (Link รูป)</label>
            <input
              type="url"
              required
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 focus:border-red-500 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-300 mb-1">รายละเอียดเพิ่มเติม</label>
            <textarea
              rows="3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="เช่น ไมล์ 12,000 กม. เครื่องเดิมๆ น็อตไม่เคยแกะ มีเล่มพร้อมโอน..."
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 focus:border-red-500 focus:outline-none"
            ></textarea>
          </div>

          <div className="sm:col-span-2 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-black tracking-wider uppercase transition shadow-lg shadow-red-600/30 disabled:bg-slate-800"
            >
              {submitting ? 'กำลังบันทึกข้อมูล...' : 'ลงประกาศประมูลทันที'}
            </button>
          </div>
        </form>
      </div>

      {/* ตารางรายการรถที่มีในระบบ */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-3">
          รายการรถประมูลทั้งหมดในระบบ ({items.length} คัน)
        </h3>

        {loading ? (
          <div className="py-8 text-center text-slate-400">กำลังโหลดรายการ...</div>
        ) : items.length === 0 ? (
          <div className="py-8 text-center text-slate-500">ยังไม่มีรายการรถในระบบ</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((item) => (
              <div key={item.id} className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex gap-4 items-center justify-between">
                <img src={item.image_url} alt={item.title} className="w-20 h-20 object-cover rounded-lg border border-slate-800 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-white text-sm truncate">{item.title}</h4>
                  <p className="text-xs text-red-500 font-extrabold mt-1">เริ่มต้น: ฿{item.base_price?.toLocaleString()}</p>
                  <p className="text-[11px] text-slate-400">มัดจำ: ฿{item.deposit_required?.toLocaleString()}</p>
                </div>
                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="p-2.5 bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white rounded-lg transition border border-red-500/20"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
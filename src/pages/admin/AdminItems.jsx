import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { PlusCircle, Trash2, Upload, X, Image as ImageIcon } from 'lucide-react';

export default function AdminItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // ฟอร์มข้อมูลรถ
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [depositRequired, setDepositRequired] = useState('500');

  // State สำหรับจัดการไฟล์รูปภาพ
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);

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

  // เลือกรูปภาพจากเครื่อง
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setSelectedFiles((prev) => [...prev, ...files]);

    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls((prev) => [...prev, ...newPreviews]);
  };

  // ลบรูปที่เลือกก่อนอัปโหลด
  const handleRemoveImage = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  // บันทึกและอัปโหลดรูปภาพลง Supabase Storage
  const handleAddItem = async (e) => {
    e.preventDefault();

    if (!title || !basePrice) return alert('กรุณากรอกยี่ห้อ/รุ่น และราคาเริ่มต้น');
    if (selectedFiles.length === 0) return alert('กรุณาเลือกรูปภาพอย่างน้อย 1 รูป');

    setSubmitting(true);
    try {
      const uploadedImageUrls = [];

      // 1. วนลูปอัปโหลดรูปภาพทีละรูปไปยัง Bucket 'auction-images'
      for (const file of selectedFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('auction-images')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // ดึง Public URL ของรูปภาพ
        const { data: { publicUrl } } = supabase.storage
          .from('auction-images')
          .getPublicUrl(fileName);

        uploadedImageUrls.push(publicUrl);
      }

      // 2. บันทึกข้อมูลลงตาราง auction_items
      const { error: insertError } = await supabase.from('auction_items').insert([
        {
          title,
          description,
          base_price: parseFloat(basePrice),
          deposit_required: parseFloat(depositRequired),
          image_url: uploadedImageUrls[0], // รูปหลักรูปแรก
          images: uploadedImageUrls,       // อัลบั้มรูปทั้งหมด
          status: 'active'
        }
      ]);

      if (insertError) throw insertError;

      alert('ลงประกาศและอัปโหลดรูปภาพเรียบร้อยแล้ว!');
      
      // ล้างค่าฟอร์ม
      setTitle('');
      setDescription('');
      setBasePrice('');
      setSelectedFiles([]);
      setPreviewUrls([]);
      fetchItems();
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการอัปโหลด: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบรายการประมูลนี้?')) return;

    try {
      const { error } = await supabase.from('auction_items').delete().eq('id', id);
      if (error) throw error;
      alert('ลบรายการเรียบร้อยแล้ว');
      fetchItems();
    } catch (error) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    }
  };

  return (
    <div className="space-y-8">
      {/* ฟอร์มลงประกาศรถพร้อมระบบอัปโหลดรูปภาพ */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-6">
        <h2 className="text-xl font-black text-white flex items-center gap-2 border-b border-slate-800 pb-4">
          <PlusCircle className="text-red-500" /> ลงประกาศรถ / อะไหล่ประมูลคันใหม่
        </h2>

        <form onSubmit={handleAddItem} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-300 mb-1">ยี่ห้อ / รุ่นรถ</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น Honda Wave 110i ปี 2023 สภาพสวย"
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 focus:border-red-500 focus:outline-none"
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
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 focus:border-red-500 focus:outline-none"
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
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 focus:border-red-500 focus:outline-none"
            />
          </div>

          {/* ปุ่มอัปโหลดรูปภาพจากอุปกรณ์ */}
          <div className="sm:col-span-2 space-y-2">
            <label className="block font-semibold text-slate-300">อัปโหลดรูปภาพตัวรถ (เลือกได้หลายรูป)</label>
            
            <div className="border-2 border-dashed border-slate-800 hover:border-red-500/50 rounded-xl p-6 text-center bg-slate-950 transition cursor-pointer">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2">
                <Upload className="text-red-500" size={32} />
                <span className="text-sm font-bold text-slate-200">กดที่นี่เพื่อเลือกรูปภาพจากเครื่อง</span>
                <span className="text-xs text-slate-500">รองรับไฟล์ JPG, PNG (เลือกพร้อมกันหลายรูปได้)</span>
              </label>
            </div>
          </div>

          {/* แสดงรูปพรีวิวที่เลือกไว้ */}
          {previewUrls.length > 0 && (
            <div className="sm:col-span-2 bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                <ImageIcon size={14} className="text-red-400" /> รูปภาพที่เตรียมอัปโหลด ({previewUrls.length} รูป)
              </span>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {previewUrls.map((url, idx) => (
                  <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden border border-slate-800 flex-shrink-0 bg-slate-900 group">
                    <img src={url} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full shadow hover:bg-red-700 transition"
                      title="ลบรูปนี้"
                    >
                      <X size={12} />
                    </button>
                    {idx === 0 && (
                      <span className="absolute bottom-0 inset-x-0 bg-red-600 text-white text-[9px] text-center font-bold">
                        รูปหลัก
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-300 mb-1">รายละเอียดเพิ่มเติม</label>
            <textarea
              rows="3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="รายละเอียดตัวรถ..."
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 focus:border-red-500 focus:outline-none"
            ></textarea>
          </div>

          <div className="sm:col-span-2 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-3.5 rounded-xl font-black tracking-wider uppercase transition shadow-lg shadow-red-600/30 disabled:bg-slate-800"
            >
              {submitting ? 'กำลังอัปโหลดรูปภาพและบันทึก...' : 'ลงประกาศประมูลทันที'}
            </button>
          </div>
        </form>
      </div>

      {/* รายการรถที่มีทั้งหมด */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-3 flex justify-between items-center">
          <span>รายการรถประมูลทั้งหมดในระบบ</span>
          <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-full font-bold border border-slate-700">
            {items.length} คัน
          </span>
        </h3>

        {loading ? (
          <div className="py-8 text-center text-slate-400">กำลังโหลดรายการ...</div>
        ) : items.length === 0 ? (
          <div className="py-8 text-center text-slate-500">ยังไม่มีรายการรถในระบบ</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((item) => {
              const photos = Array.isArray(item.images) && item.images.length > 0 ? item.images : [item.image_url];

              return (
                <div key={item.id} className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex gap-4 items-center justify-between">
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-800 flex-shrink-0 bg-slate-900">
                    <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                    {photos.length > 1 && (
                      <span className="absolute top-1 right-1 bg-black/80 text-white text-[9px] px-1.5 py-0.5 rounded font-bold border border-slate-700">
                        {photos.length} รูป
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-0.5">
                    <h4 className="font-bold text-white text-sm truncate">{item.title}</h4>
                    <p className="text-xs text-red-500 font-extrabold">เริ่มต้น: ฿{item.base_price?.toLocaleString()}</p>
                    <p className="text-[11px] text-slate-400">มัดจำ: ฿{item.deposit_required?.toLocaleString()}</p>
                  </div>

                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-2.5 bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white rounded-lg transition border border-red-500/20"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { PlusCircle, Trash2, Edit3, Upload, X, Image as ImageIcon, Check, RefreshCw } from 'lucide-react';

export default function AdminItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // State สำหรับฟอร์มเพิ่มสินค้าใหม่
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [depositRequired, setDepositRequired] = useState('500');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);

  // State สำหรับ Modal แก้ไขสินค้า
  const [editingItem, setEditingItem] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editBasePrice, setEditBasePrice] = useState('');
  const [editDepositRequired, setEditDepositRequired] = useState('500');
  const [editExistingImages, setEditExistingImages] = useState([]);
  const [editNewFiles, setEditNewFiles] = useState([]);
  const [editNewPreviews, setEditNewPreviews] = useState([]);

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

  // -------------------------------------------------------------
  // ฟังก์ชันอัปโหลดรูปภาพเข้า Supabase Storage
  // -------------------------------------------------------------
  const uploadFilesToStorage = async (files) => {
    const uploadedUrls = [];
    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('auction-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('auction-images')
        .getPublicUrl(fileName);

      uploadedUrls.push(publicUrl);
    }
    return uploadedUrls;
  };

  // -------------------------------------------------------------
  // 1. เพิ่มสินค้าใหม่
  // -------------------------------------------------------------
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setSelectedFiles((prev) => [...prev, ...files]);
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls((prev) => [...prev, ...newPreviews]);
  };

  const handleRemoveImage = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!title || !basePrice) return alert('กรุณากรอกยี่ห้อ/รุ่น และราคาเริ่มต้น');
    if (selectedFiles.length === 0) return alert('กรุณาเลือกรูปภาพอย่างน้อย 1 รูป');

    setSubmitting(true);
    try {
      const uploadedImageUrls = await uploadFilesToStorage(selectedFiles);

      const { error } = await supabase.from('auction_items').insert([
        {
          title,
          description,
          base_price: parseFloat(basePrice),
          deposit_required: parseFloat(depositRequired),
          image_url: uploadedImageUrls[0],
          images: uploadedImageUrls,
          status: 'active'
        }
      ]);

      if (error) throw error;

      alert('ลงประกาศประมูลและอัปโหลดรูปภาพสำเร็จ!');
      setTitle('');
      setDescription('');
      setBasePrice('');
      setSelectedFiles([]);
      setPreviewUrls([]);
      fetchItems();
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการบันทึก: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // 2. แก้ไขสินค้า (Modal)
  // -------------------------------------------------------------
  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setEditTitle(item.title || '');
    setEditDescription(item.description || '');
    setEditBasePrice(item.base_price || '');
    setEditDepositRequired(item.deposit_required || '500');
    
    // ดึงรูปภาพเดิมทั้งหมดที่มี
    const imgs = Array.isArray(item.images) && item.images.length > 0 
      ? item.images 
      : (item.image_url ? [item.image_url] : []);
    setEditExistingImages(imgs);
    setEditNewFiles([]);
    setEditNewPreviews([]);
  };

  const handleEditFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setEditNewFiles((prev) => [...prev, ...files]);
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setEditNewPreviews((prev) => [...prev, ...newPreviews]);
  };

  const handleRemoveExistingImage = (index) => {
    setEditExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveNewImage = (index) => {
    setEditNewFiles((prev) => prev.filter((_, i) => i !== index));
    setEditNewPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateItem = async (e) => {
    e.preventDefault();
    if (!editTitle || !editBasePrice) return alert('กรุณากรอกยี่ห้อ/รุ่น และราคาเริ่มต้น');

    setSubmitting(true);
    try {
      // 1. อัปโหลดรูปภาพใหม่ (ถ้ามี)
      let newlyUploadedUrls = [];
      if (editNewFiles.length > 0) {
        newlyUploadedUrls = await uploadFilesToStorage(editNewFiles);
      }

      // 2. รวมรูปเดิมที่ยังเหลือ + รูปอัปโหลดใหม่
      const allFinalImages = [...editExistingImages, ...newlyUploadedUrls];

      if (allFinalImages.length === 0) {
        setSubmitting(false);
        return alert('ต้องมีรูปภาพสินค้าอย่างน้อย 1 รูป');
      }

      // 3. อัปเดตข้อมูลลง Supabase
      const { error } = await supabase
        .from('auction_items')
        .update({
          title: editTitle,
          description: editDescription,
          base_price: parseFloat(editBasePrice),
          deposit_required: parseFloat(editDepositRequired),
          image_url: allFinalImages[0],
          images: allFinalImages,
        })
        .eq('id', editingItem.id);

      if (error) throw error;

      alert('อัปเดตข้อมูลรายการสินค้าเรียบร้อยแล้ว!');
      setEditingItem(null);
      fetchItems();
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการอัปเดต: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // 3. ลบสินค้า
  // -------------------------------------------------------------
  const handleDeleteItem = async (id, itemTitle) => {
    if (!window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบรายการ "${itemTitle}" ออกจากระบบ?`)) return;

    try {
      const { error } = await supabase.from('auction_items').delete().eq('id', id);
      if (error) throw error;
      alert('ลบรายการสินค้าเรียบร้อยแล้ว');
      fetchItems();
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการลบ: ' + error.message);
    }
  };

  return (
    <div className="space-y-8">
      {/* =-------------------------------------------------------- */}
      {/* 1. ฟอร์มลงประกาศรถคันใหม่                                 */}
      {/* =-------------------------------------------------------- */}
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

          <div className="sm:col-span-2 space-y-2">
            <label className="block font-semibold text-slate-300">อัปโหลดรูปภาพตัวรถ (เลือกได้หลายรูป)</label>
            <div className="border-2 border-dashed border-slate-800 hover:border-red-500/50 rounded-xl p-6 text-center bg-slate-950 transition cursor-pointer">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload-new"
              />
              <label htmlFor="file-upload-new" className="cursor-pointer flex flex-col items-center gap-2">
                <Upload className="text-red-500" size={32} />
                <span className="text-sm font-bold text-slate-200">กดที่นี่เพื่อเลือกรูปภาพจากเครื่อง</span>
                <span className="text-xs text-slate-500">รองรับไฟล์ JPG, PNG (เลือกพร้อมกันหลายรูปได้)</span>
              </label>
            </div>
          </div>

          {previewUrls.length > 0 && (
            <div className="sm:col-span-2 bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                <ImageIcon size={14} className="text-red-400" /> รูปภาพที่เตรียมอัปโหลด ({previewUrls.length} รูป)
              </span>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {previewUrls.map((url, idx) => (
                  <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden border border-slate-800 flex-shrink-0 bg-slate-900">
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
              {submitting ? 'กำลังอัปโหลดและบันทึก...' : 'ลงประกาศประมูลทันที'}
            </button>
          </div>
        </form>
      </div>

      {/* =-------------------------------------------------------- */}
      {/* 2. รายการรถทั้งหมด + ปุ่มแก้ไข & ลบ                       */}
      {/* =-------------------------------------------------------- */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            รายการรถประมูลทั้งหมดในระบบ
            <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-full font-bold border border-slate-700">
              {items.length} คัน
            </span>
          </h3>
          <button
            onClick={fetchItems}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-white bg-slate-950 p-2 rounded-lg border border-slate-800 transition"
          >
            <RefreshCw size={14} /> รีเฟรช
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-slate-400">กำลังโหลดรายการ...</div>
        ) : items.length === 0 ? (
          <div className="py-8 text-center text-slate-500">ยังไม่มีรายการรถในระบบ</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((item) => {
              const photos = Array.isArray(item.images) && item.images.length > 0 
                ? item.images 
                : (item.image_url ? [item.image_url] : []);

              return (
                <div key={item.id} className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex gap-4 items-center justify-between hover:border-slate-700 transition">
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

                  {/* ปุ่มแก้ไข & ปุ่มลบ */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleOpenEditModal(item)}
                      className="p-2.5 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white rounded-lg transition border border-blue-500/20"
                      title="แก้ไขรายการนี้"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id, item.title)}
                      className="p-2.5 bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white rounded-lg transition border border-red-500/20"
                      title="ลบรายการนี้"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* =-------------------------------------------------------- */}
      {/* 3. MODAL POP-UP สำหรับแก้ไขข้อมูลรายการสินค้า             */}
      {/* =-------------------------------------------------------- */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-5">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Edit3 className="text-blue-500" size={20} /> แก้ไขรายการประมูล
              </h3>
              <button
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-950 border border-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateItem} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-300 mb-1">ยี่ห้อ / รุ่นรถ</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">ราคาเริ่มต้น (บาท)</label>
                <input
                  type="number"
                  required
                  value={editBasePrice}
                  onChange={(e) => setEditBasePrice(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">เครดิตมัดจำสู้ราคา (บาท)</label>
                <input
                  type="number"
                  required
                  value={editDepositRequired}
                  onChange={(e) => setEditDepositRequired(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* จัดการรูปภาพเดิมที่มีอยู่ */}
              <div className="sm:col-span-2 space-y-2">
                <label className="block font-semibold text-slate-300">รูปภาพเดิมในระบบ</label>
                {editExistingImages.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">ไม่มีรูปภาพเดิม</p>
                ) : (
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {editExistingImages.map((url, idx) => (
                      <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden border border-slate-800 flex-shrink-0 bg-slate-950">
                        <img src={url} alt={`Existing ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveExistingImage(idx)}
                          className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full shadow hover:bg-red-700 transition"
                          title="ลบรูปนี้"
                        >
                          <X size={12} />
                        </button>
                        {idx === 0 && (
                          <span className="absolute bottom-0 inset-x-0 bg-blue-600 text-white text-[9px] text-center font-bold">
                            รูปหลักเดิม
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* เพิ่มรูปภาพใหม่ */}
              <div className="sm:col-span-2 space-y-2">
                <label className="block font-semibold text-slate-300">เพิ่มรูปภาพใหม่ (ถ้ามี)</label>
                <div className="border-2 border-dashed border-slate-800 hover:border-blue-500/50 rounded-xl p-4 text-center bg-slate-950 transition cursor-pointer">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleEditFileChange}
                    className="hidden"
                    id="file-upload-edit"
                  />
                  <label htmlFor="file-upload-edit" className="cursor-pointer flex flex-col items-center gap-1">
                    <Upload className="text-blue-500" size={24} />
                    <span className="text-xs font-bold text-slate-200">เลือกรูปภาพใหม่เพื่ออัปโหลดเพิ่ม</span>
                  </label>
                </div>
              </div>

              {/* พรีวิวรูปใหม่ที่จะเพิ่ม */}
              {editNewPreviews.length > 0 && (
                <div className="sm:col-span-2 bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-slate-400">รูปภาพใหม่ที่เตรียมอัปโหลดเพิ่มเติม ({editNewPreviews.length} รูป)</span>
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {editNewPreviews.map((url, idx) => (
                      <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-800 flex-shrink-0">
                        <img src={url} alt={`New Preview ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveNewImage(idx)}
                          className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full shadow"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-300 mb-1">รายละเอียดเพิ่มเติม</label>
                <textarea
                  rows="3"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 focus:border-blue-500 focus:outline-none"
                ></textarea>
              </div>

              <div className="sm:col-span-2 flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition shadow-lg shadow-blue-600/30 disabled:bg-slate-800 flex items-center justify-center gap-2"
                >
                  <Check size={18} /> {submitting ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-5 py-3 rounded-xl font-bold transition border border-slate-700"
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
// เพิ่มช่องใส่ live_url และ end_time ใน state แก้ไข
const [editLiveUrl, setEditLiveUrl] = useState('');
const [editEndTime, setEditEndTime] = useState('');

// ฟังก์ชันเพิ่มเวลาประมูลสด +5 นาที
const handleAddExtraMinutes = async (itemId, currentEndTime) => {
  const baseTime = currentEndTime ? new Date(currentEndTime) : new Date();
  const newEndTime = new Date(baseTime.getTime() + 5 * 60000).toISOString();

  try {
    const { error } = await supabase
      .from('auction_items')
      .update({ end_time: newEndTime })
      .eq('id', itemId);

    if (error) throw error;
    alert('ต่อเวลาประมูลเพิ่ม +5 นาที เรียบร้อยแล้ว!');
    fetchItems();
  } catch (error) {
    alert('เกิดข้อผิดพลาด: ' + error.message);
  }
};
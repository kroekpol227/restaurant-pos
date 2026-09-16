import { db } from "./firebase-config.js";
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, addDoc } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

// --- ฟังก์ชันสลับหน้าจอ (Tab Switching) ---
window.switchTab = function(tabName) {
    const sectionOrders = document.getElementById('section-orders');
    const sectionMenus = document.getElementById('section-menus');
    const btnOrders = document.getElementById('btn-tab-orders');
    const btnMenus = document.getElementById('btn-tab-menus');

    if (tabName === 'orders') {
        sectionOrders.classList.remove('hidden');
        sectionMenus.classList.add('hidden');
        
        btnOrders.className = "flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer bg-orange-500 text-white shadow-sm flex items-center justify-center gap-1.5";
        btnMenus.className = "flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer text-gray-600 hover:text-gray-900 bg-white sm:bg-transparent flex items-center justify-center gap-1.5";
    } else {
        sectionOrders.classList.add('hidden');
        sectionMenus.classList.remove('hidden');
        
        btnMenus.className = "flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer bg-orange-500 text-white shadow-sm flex items-center justify-center gap-1.5";
        btnOrders.className = "flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer text-gray-600 hover:text-gray-900 bg-white sm:bg-transparent flex items-center justify-center gap-1.5";
    }
}

// ================= 1. โซนจัดการออเดอร์ =================
function listenAdminOrders() {
    const container = document.getElementById('admin-orders-list');
    const q = query(collection(db, "orders"));

    onSnapshot(q, (snapshot) => {
        if (!container) return;
        if (snapshot.empty) {
            container.innerHTML = '<div class="text-center py-10 text-gray-400 bg-white rounded-2xl col-span-full shadow-sm">ยังไม่มีออเดอร์ในขณะนี้</div>';
            return;
        }

        let html = '';
        snapshot.forEach((docSnap) => {
            const orderId = docSnap.id;
            const order = docSnap.data();

            let statusColor = 'bg-yellow-50 text-yellow-700 border-yellow-200';
            if (order.status === 'cooking') statusColor = 'bg-blue-50 text-blue-700 border-blue-200';
            if (order.status === 'done') statusColor = 'bg-green-50 text-green-700 border-green-200';

            let itemsList = '';
            let total = 0;
            if (order.items) {
                order.items.forEach(i => {
                    itemsList += `<li class="text-xs text-gray-600 flex justify-between">• ${i.name} x ${i.qty} <span>${i.price * i.qty} ฿</span></li>`;
                    total += i.price * i.qty;
                });
            }

            html += `
                <div class="bg-white border border-gray-200 p-4 rounded-2xl shadow-sm space-y-3 flex flex-col justify-between">
                    <div>
                        <div class="flex justify-between items-center mb-2">
                            <span class="font-bold text-sm text-gray-800">โต๊ะ: ${order.table}</span>
                            <span class="px-2.5 py-0.5 rounded-full border text-xs font-semibold ${statusColor}">${order.status}</span>
                        </div>
                        <ul class="space-y-1 divide-y divide-gray-100 py-1">${itemsList}</ul>
                    </div>
                    
                    <div class="space-y-2 pt-2 border-t border-gray-100">
                        <div class="flex justify-between items-center text-xs font-bold">
                            <span>ยอดรวมทั้งหมด:</span>
                            <span class="text-orange-600 text-sm">${total} บาท</span>
                        </div>
                        <div class="grid grid-cols-3 gap-1.5 pt-1">
                            <button onclick="window.updateStatus('${orderId}', 'pending')" class="bg-yellow-50 hover:bg-yellow-100 text-yellow-700 text-xs font-medium py-1.5 rounded-lg border border-yellow-200 transition cursor-pointer">รอทำ</button>
                            <button onclick="window.updateStatus('${orderId}', 'cooking')" class="bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium py-1.5 rounded-lg border border-blue-200 transition cursor-pointer">กำลังทำ</button>
                            <button onclick="window.updateStatus('${orderId}', 'done')" class="bg-green-50 hover:bg-green-100 text-green-700 text-xs font-medium py-1.5 rounded-lg border border-green-200 transition cursor-pointer">เสร็จแล้ว</button>
                        </div>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    });
}

window.updateStatus = async function(orderId, newStatus) {
    try {
        await updateDoc(doc(db, "orders", orderId), { status: newStatus });
    } catch (e) {
        console.error("Error updating status: ", e);
        alert('เกิดข้อผิดพลาดในการเปลี่ยนสถานะ');
    }
}


// ================= 2. โซนจัดการเมนูอาหาร (เพิ่ม / ลบ) =================
function listenAdminMenus() {
    const adminMenuListEl = document.getElementById('admin-menu-list');
    const q = query(collection(db, "menus"));

    onSnapshot(q, (snapshot) => {
        if (!adminMenuListEl) return;

        if (snapshot.empty) {
            adminMenuListEl.innerHTML = '<div class="text-center py-6 text-gray-400 col-span-full">ยังไม่มีเมนูในร้าน</div>';
            return;
        }

        let html = '';
        snapshot.forEach((docSnap) => {
            const menuId = docSnap.id;
            const menu = docSnap.data();

            let catLabel = '🍲 อาหาร';
            if (menu.category === 'drink') catLabel = '🧋 เครื่องดื่ม';
            if (menu.category === 'burger') catLabel = '🍔 เบอร์เกอร์';

            html += `
                <div class="bg-gray-50 border border-gray-200 p-3 rounded-xl flex justify-between items-center">
                    <div>
                        <h4 class="font-semibold text-sm text-gray-800">${menu.name}</h4>
                        <div class="text-xs text-gray-500">${catLabel} | <span class="text-orange-600 font-bold">${menu.price} บาท</span></div>
                    </div>
                    <button onclick="window.deleteMenu('${menuId}')" 
                        class="bg-red-50 hover:bg-red-100 text-red-600 p-2 rounded-lg text-xs transition cursor-pointer" title="ลบเมนูนี้">
                        🗑️ ลบ
                    </button>
                </div>
            `;
        });
        adminMenuListEl.innerHTML = html;
    });
}

window.deleteMenu = async function(menuId) {
    if (confirm('⚠️ คุณต้องการลบเมนูนี้ออกจากร้านใช่หรือไม่?')) {
        try {
            await deleteDoc(doc(db, "menus", menuId));
            alert('🗑️ ลบเมนูเรียบร้อยแล้ว');
        } catch (e) {
            console.error("Error deleting menu: ", e);
            alert('เกิดข้อผิดพลาดในการลบเมนู');
        }
    }
}

const addMenuForm = document.getElementById('add-menu-form');
if (addMenuForm) {
    addMenuForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('menu-name').value;
        const price = Number(document.getElementById('menu-price').value);
        const category = document.getElementById('menu-category').value;

        try {
            await addDoc(collection(db, "menus"), {
                name: name,
                price: price,
                category: category
            });
            addMenuForm.reset();
            alert('🎉 เพิ่มเมนูใหม่เข้าร้านเรียบร้อยแล้ว!');
        } catch (err) {
            console.error("Error adding menu: ", err);
            alert('เกิดข้อผิดพลาดในการเพิ่มเมนู');
        }
    });
}

// เริ่มต้นทำงานโหลดข้อมูลทั้ง 2 ส่วนทันทีที่เปิดหน้าแอดมิน
listenAdminOrders();
listenAdminMenus();
import { db } from "./firebase-config.js";
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const ordersListEl = document.getElementById('admin-orders-list');
const adminMenuListEl = document.getElementById('admin-menu-list');

// 1. ฟังก์ชันดึงออเดอร์แบบ Real-time
function listenOrders() {
    const q = query(collection(db, "orders"));

    onSnapshot(q, (snapshot) => {
        if (!ordersListEl) return;
        
        if (snapshot.empty) {
            ordersListEl.innerHTML = '<div class="text-center py-10 text-gray-400 bg-white rounded-2xl col-span-full shadow-sm">ยังไม่มีออเดอร์ในขณะนี้</div>';
            return;
        }

        let html = '';
        snapshot.forEach((docSnap) => {
            const orderId = docSnap.id;
            const order = docSnap.data();

            let statusText = '⏳ รอทำ';
            let statusBg = 'bg-yellow-50 text-yellow-700 border-yellow-200';
            
            if (order.status === 'cooking') {
                statusText = '🔥 กำลังทำ';
                statusBg = 'bg-blue-50 text-blue-700 border-blue-200';
            } else if (order.status === 'done') {
                statusText = '✅ เสร็จแล้ว';
                statusBg = 'bg-green-50 text-green-700 border-green-200';
            }

            let itemsHtml = '';
            let total = 0;
            if (order.items && Array.isArray(order.items)) {
                order.items.forEach(i => {
                    itemsHtml += `<li class="text-sm text-gray-600 flex justify-between py-1"><span>• ${i.name} x ${i.qty}</span> <span class="font-medium">${i.price * i.qty} บาท</span></li>`;
                    total += i.price * i.qty;
                });
            }

            html += `
                <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex flex-col justify-between">
                    <div>
                        <div class="flex justify-between items-center mb-3 pb-2 border-b border-gray-100">
                            <span class="font-bold text-base text-gray-800">โต๊ะ: ${order.table}</span>
                            <div class="flex items-center gap-2">
                                <span class="text-xs px-3 py-1 rounded-full font-medium border ${statusBg}">${statusText}</span>
                                <button onclick="window.deleteOrder('${orderId}')" class="text-red-500 hover:text-red-700 text-xs p-1 rounded-lg transition cursor-pointer" title="ลบออเดอร์">
                                    🗑️ ลบ
                                </button>
                            </div>
                        </div>
                        <ul class="space-y-1 mb-4 divide-y divide-gray-50">${itemsHtml}</ul>
                    </div>

                    <div>
                        <div class="flex justify-between items-center mb-3 pt-2 border-t border-dashed border-gray-200 text-sm font-bold">
                            <span>ยอดรวม:</span>
                            <span class="text-orange-600 text-base">${total} บาท</span>
                        </div>
                        
                        <div class="grid grid-cols-3 gap-2">
                            <button onclick="window.updateStatus('${orderId}', 'pending')" 
                                class="bg-yellow-50 hover:bg-yellow-100 text-yellow-700 text-xs py-2 rounded-xl font-medium transition cursor-pointer border border-yellow-200">
                                ⏳ รอทำ
                            </button>
                            <button onclick="window.updateStatus('${orderId}', 'cooking')" 
                                class="bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs py-2 rounded-xl font-medium transition cursor-pointer border border-blue-200">
                                🔥 กำลังทำ
                            </button>
                            <button onclick="window.updateStatus('${orderId}', 'done')" 
                                class="bg-green-50 hover:bg-green-100 text-green-700 text-xs py-2 rounded-xl font-medium transition cursor-pointer border border-green-200">
                                ✅ เสร็จ
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });

        ordersListEl.innerHTML = html;
    });
}

// 2. ฟังก์ชันดึงรายการเมนูมาแสดงในหน้า Admin แบบ Real-time
function listenMenus() {
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

// ฟังก์ชันอัปเดตสถานะออเดอร์
window.updateStatus = async function(orderId, newStatus) {
    try {
        const orderRef = doc(db, "orders", orderId);
        await updateDoc(orderRef, { status: newStatus });
    } catch (e) {
        console.error("Error updating status: ", e);
        alert('เกิดข้อผิดพลาดในการเปลี่ยนสถานะ');
    }
}

// ฟังก์ชันลบออเดอร์
window.deleteOrder = async function(orderId) {
    if (confirm('คุณต้องการลบออเดอร์นี้ใช่หรือไม่?')) {
        try {
            await deleteDoc(doc(db, "orders", orderId));
        } catch (e) {
            console.error("Error deleting order: ", e);
            alert('เกิดข้อผิดพลาดในการลบออเดอร์');
        }
    }
}

// ฟังก์ชันลบเมนูออกจากร้าน (ลบจาก collection "menus")
window.deleteMenu = async function(menuId) {
    if (confirm('⚠️ คุณต้องการลบเมนูนี้ออกจากร้านใช่หรือไม่? ลูกค้าจะไม่สามารถสั่งได้อีก')) {
        try {
            await deleteDoc(doc(db, "menus", menuId));
            alert('🗑️ ลบเมนูเรียบร้อยแล้ว');
        } catch (e) {
            console.error("Error deleting menu: ", e);
            alert('เกิดข้อผิดพลาดในการลบเมนู');
        }
    }
}

// ฟังก์ชันเพิ่มเมนูอาหาร/เครื่องดื่มใหม่เข้าร้าน
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

listenOrders();
listenMenus();
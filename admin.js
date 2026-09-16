import { db } from "./firebase-config.js";
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const ordersListEl = document.getElementById('admin-orders-list');

// ฟังก์ชันดึงออเดอร์แบบ Real-time ด้วย onSnapshot
function listenOrders() {
    // เรียงลำดับจากใหม่ไปเก่า (ถ้ามี field createdAt) หรือดึงทั้งหมด
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
                    itemsHtml += `<li class="text-sm text-gray-600 flex justify-between"><span>• ${i.name} x ${i.qty}</span> <span class="font-medium">${i.price * i.qty} บาท</span></li>`;
                    total += i.price * i.qty;
                });
            }

            html += `
                <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex flex-col justify-between">
                    <div>
                        <div class="flex justify-between items-center mb-3 pb-2 border-b border-gray-100">
                            <span class="font-bold text-base text-gray-800">โต๊ะ: ${order.table}</span>
                            <span class="text-xs px-3 py-1 rounded-full font-medium border ${statusBg}">${statusText}</span>
                        </div>
                        <ul class="space-y-1 mb-4 divide-y divide-gray-50">${itemsHtml}</ul>
                    </div>

                    <div>
                        <div class="flex justify-between items-center mb-3 pt-2 border-t border-dashed border-gray-200 text-sm font-bold">
                            <span>ยอดรวม:</span>
                            <span class="text-orange-600 text-base">${total} บาท</span>
                        </div>
                        
                        <!-- ปุ่มเปลี่ยนสถานะออเดอร์ -->
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

// ฟังก์ชันอัปเดตสถานะออเดอร์ใน Firestore
window.updateStatus = async function(orderId, newStatus) {
    try {
        const orderRef = doc(db, "orders", orderId);
        await updateDoc(orderRef, {
            status: newStatus
        });
    } catch (e) {
        console.error("Error updating status: ", e);
        alert('เกิดข้อผิดพลาดในการเปลี่ยนสถานะ');
    }
}

listenOrders();
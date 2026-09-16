import { db } from "./firebase-config.js";
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const ordersContainer = document.getElementById('live-orders');

// ฟังเสียงออเดอร์ใหม่แบบ Real-time (ถ้าลูกค้ากดสั่ง ออเด้อจะเด้งขึ้นทันทีโดยไม่ต้อง Refresh)
const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
onSnapshot(q, (snapshot) => {
    ordersContainer.innerHTML = '';
    snapshot.forEach((docSnap) => {
        const order = docSnap.data();
        const orderId = docSnap.id;
        
        let itemsHtml = '<ul>';
        order.items.forEach(i => {
            itemsHtml += `<li>${i.name} x ${i.qty}</li>`;
        });
        itemsHtml += '</ul>';

        ordersContainer.innerHTML += `
            <div class="card order-card status-${order.status}">
                <h3>โต๊ะ: ${order.table}</h3>
                <div>${itemsHtml}</div>
                <p>สถานะ: <b>${order.status}</b></p>
                ${order.status === 'pending' ? `<button onclick="updateStatus('${orderId}', 'cooking')">รับทำอาหาร</button>` : ''}
                ${order.status === 'cooking' ? `<button onclick="updateStatus('${orderId}', 'done')">ทำเสร็จแล้ว</button>` : ''}
            </div>
        `;
    });
});

window.updateStatus = async function(orderId, newStatus) {
    const orderRef = doc(db, "orders", orderId);
    await updateDoc(orderRef, { status: newStatus });
}
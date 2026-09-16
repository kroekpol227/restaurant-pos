import { db } from "./firebase-config.js";
import { collection, getDocs, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ดึงเลขโต๊ะจาก URL Query Parameter (เช่น ?table=3)
const urlParams = new URLSearchParams(window.location.search);
const tableId = urlParams.get('table') || 'ไม่ระบุ';
document.getElementById('display-table').innerText = tableId;

let cart = [];
let menuData = [];

// โหลดเมนูอาหารจาก Firestore
async function loadMenu() {
    const querySnapshot = await getDocs(collection(db, "menus"));
    const menuListEl = document.getElementById('menu-list');
    menuListEl.innerHTML = '';
    
    querySnapshot.forEach((doc) => {
        const item = { id: doc.id, ...doc.data() };
        menuData.push(item);
        
        menuListEl.innerHTML += `
            <div class="card">
                <h3>${item.name}</h3>
                <p>ราคา: ${item.price} บาท</p>
                <button onclick="addToCart('${item.id}')">1 เพิ่มลงตะกร้า</button>
            </div>
        `;
    });
}

window.addToCart = function(menuId) {
    const item = menuData.find(m => m.id === menuId);
    const existing = cart.find(c => c.id === menuId);
    
    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({ ...item, qty: 1 });
    }
    updateCartUI();
}

function updateCartUI() {
    const cartEl = document.getElementById('cart-items');
    const checkoutBtn = document.getElementById('checkout-btn');
    
    if (cart.length === 0) {
        cartEl.innerHTML = 'ยังไม่มีสินค้าในตะกร้า';
        checkoutBtn.disabled = true;
        return;
    }
    
    let html = '<ul>';
    let total = 0;
    cart.forEach(c => {
        html += `<li>${c.name} x ${c.qty} (${c.price * c.qty} บาท)</li>`;
        total += c.price * c.qty;
    });
    html += `</ul><b>รวมทั้งสิ้น: ${total} บาท</b>`;
    cartEl.innerHTML = html;
    checkoutBtn.disabled = false;
}

window.submitOrder = async function() {
    try {
        await addDoc(collection(db, "orders"), {
            table: tableId,
            items: cart,
            status: 'pending', // pending = รอทำ, cooking = กำลังทำ, done = เสร็จแล้ว
            createdAt: serverTimestamp()
        });
        alert('ส่งออเดอร์เรียบร้อยแล้ว!');
        cart = [];
        updateCartUI();
    } catch (e) {
        console.error("Error adding order: ", e);
        alert('เกิดข้อผิดพลาดในการสั่งอาหาร');
    }
}

loadMenu();
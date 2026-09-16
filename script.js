import { db } from "./firebase-config.js";
import { collection, getDocs, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

// ดึงเลขโต๊ะจาก URL Query Parameter (เช่น ?table=3)
const urlParams = new URLSearchParams(window.location.search);
const tableId = urlParams.get('table') || 'ไม่ระบุ';
const tableEl = document.getElementById('display-table');
if (tableEl) {
    tableEl.innerText = tableId;
}

let cart = [];
let menuData = [];

// โหลดเมนูอาหารจาก Firestore
async function loadMenu() {
    try {
        const querySnapshot = await getDocs(collection(db, "menus"));
        const menuListEl = document.getElementById('menu-list');
        if (!menuListEl) return;
        
        menuListEl.innerHTML = '';
        
        if (querySnapshot.empty) {
            menuListEl.innerHTML = '<p>ยังไม่มีเมนูอาหารในระบบ</p>';
            return;
        }

        querySnapshot.forEach((doc) => {
            const item = { id: doc.id, ...doc.data() };
            menuData.push(item);
            
            menuListEl.innerHTML += `
                <div class="card" style="border: 1px solid #ccc; padding: 15px; margin-bottom: 10px; border-radius: 8px;">
                    <h3>${item.name}</h3>
                    <p>ราคา: ${item.price} บาท</p>
                    <button onclick="window.addToCart('${item.id}')" style="padding: 5px 10px; cursor: pointer;">เพิ่มลงตะกร้า</button>
                </div>
            `;
        });
    } catch (error) {
        console.error("Error loading menu: ", error);
    }
}

window.addToCart = function(menuId) {
    const item = menuData.find(m => m.id === menuId);
    if (!item) return;
    
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
    if (!cartEl || !checkoutBtn) return;
    
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
    if (cart.length === 0) return;
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

// เรียกใช้งานฟังก์ชันโหลดเมนู
loadMenu();
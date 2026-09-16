import { db } from "./firebase-config.js";
import { collection, getDocs, addDoc, query, where, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

// ดึงเลขโต๊ะจาก URL Query Parameter (เช่น ?table=3)
const urlParams = new URLSearchParams(window.location.search);
const tableId = urlParams.get('table') || 'ไม่ระบุ';

document.querySelectorAll('#display-table').forEach(el => {
    el.innerText = tableId;
});
const modalTableNum = document.getElementById('modal-table-num');
if (modalTableNum) modalTableNum.innerText = tableId;

let cart = [];
let menuData = [];
let currentCategory = 'all';

// โหลดเมนูอาหารจาก Firestore
async function loadMenu() {
    try {
        const querySnapshot = await getDocs(collection(db, "menus"));
        menuData = [];
        
        querySnapshot.forEach((doc) => {
            menuData.push({ id: doc.id, ...doc.data() });
        });

        renderMenuList();
    } catch (error) {
        console.error("Error loading menu: ", error);
    }
}

// เรนเดอร์เมนูตามหมวดหมู่ที่เลือก
window.filterCategory = function(cat) {
    currentCategory = cat;
    
    // เปลี่ยนสไตล์ปุ่ม Category Tabs
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.className = "category-btn whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium bg-white text-gray-600 border border-gray-200 shadow-sm transition cursor-pointer";
    });
    
    const activeBtn = document.getElementById(`btn-cat-${cat}`);
    if (activeBtn) {
        activeBtn.className = "category-btn whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium bg-orange-500 text-white shadow-sm transition cursor-pointer";
    }

    renderMenuList();
}

function renderMenuList() {
    const menuListEl = document.getElementById('menu-list');
    if (!menuListEl) return;
    
    menuListEl.innerHTML = '';
    
    const filteredMenu = currentCategory === 'all' 
        ? menuData 
        : menuData.filter(item => item.category === currentCategory);

    if (filteredMenu.length === 0) {
        menuListEl.innerHTML = '<div class="text-center py-6 text-gray-400">ยังไม่มีเมนูในหมวดหมู่นี้</div>';
        return;
    }

    filteredMenu.forEach((item) => {
        menuListEl.innerHTML += `
            <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center hover:shadow-md transition">
                <div>
                    <h3 class="font-semibold text-gray-800 text-base">${item.name}</h3>
                    <p class="text-orange-600 font-bold mt-1">${item.price} บาท</p>
                </div>
                <button onclick="window.addToCart('${item.id}')" 
                    class="bg-orange-50 hover:bg-orange-100 text-orange-600 font-medium px-4 py-2 rounded-lg text-sm transition border border-orange-200 cursor-pointer">
                    + เพิ่ม
                </button>
            </div>
        `;
    });
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
    const cartCountEl = document.getElementById('cart-count');
    const cartTotalEl = document.getElementById('cart-total');
    
    if (!cartEl || !checkoutBtn) return;
    
    let totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
    cartCountEl.innerText = `${totalItems} รายการ`;

    if (cart.length === 0) {
        cartEl.innerHTML = '<div class="py-1 text-gray-400 italic">ยังไม่มีสินค้าในตะกร้า</div>';
        cartTotalEl.innerText = '0 บาท';
        checkoutBtn.disabled = true;
        return;
    }
    
    let html = '';
    let total = 0;
    cart.forEach(c => {
        html += `
            <div class="py-2 flex justify-between items-center text-sm">
                <span>${c.name} (x${c.qty})</span>
                <span class="font-medium text-gray-800">${c.price * c.qty} บาท</span>
            </div>
        `;
        total += c.price * c.qty;
    });
    
    cartEl.innerHTML = html;
    cartTotalEl.innerText = `${total} บาท`;
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
        alert('🎉 ส่งออเดอร์เรียบร้อยแล้ว!');
        cart = [];
        updateCartUI();
    } catch (e) {
        console.error("Error adding order: ", e);
        alert('เกิดข้อผิดพลาดในการสั่งอาหาร');
    }
}

// เปิด/ปิด Modal ดูประวัติออเดอร์
window.toggleHistoryModal = async function(isOpen) {
    const modal = document.getElementById('history-modal');
    if (!modal) return;

    if (isOpen) {
        modal.classList.remove('hidden');
        await loadOrderHistory();
    } else {
        modal.classList.add('hidden');
    }
}

async function loadOrderHistory() {
    const historyListEl = document.getElementById('history-list');
    if (!historyListEl) return;

    historyListEl.innerHTML = '<div class="text-center py-6 text-gray-400">กำลังโหลดประวัติ...</div>';

    try {
        const q = query(
            collection(db, "orders"), 
            where("table", "==", tableId)
        );
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            historyListEl.innerHTML = '<div class="text-center py-6 text-gray-400">ยังไม่มีประวัติการสั่งซื้อของโต๊ะนี้</div>';
            return;
        }

        let historyHtml = '';
        querySnapshot.forEach((doc) => {
            const order = doc.data();
            let statusText = '⏳ รอทำ';
            let statusColor = 'bg-yellow-100 text-yellow-700';
            
            if (order.status === 'cooking') {
                statusText = '🔥 กำลังทำ';
                statusColor = 'bg-blue-100 text-blue-700';
            } else if (order.status === 'done') {
                statusText = '✅ เสร็จแล้ว';
                statusColor = 'bg-green-100 text-green-700';
            }

            let orderTotal = 0;
            let itemsDetail = '';
            if (order.items && Array.isArray(order.items)) {
                order.items.forEach(i => {
                    itemsDetail += `<div class="text-xs text-gray-600">• ${i.name} x ${i.qty} (${i.price * i.qty} บาท)</div>`;
                    orderTotal += i.price * i.qty;
                });
            }

            historyHtml += `
                <div class="py-3">
                    <div class="flex justify-between items-center mb-1">
                        <span class="text-xs font-bold text-gray-500">ออเดอร์ ID: ${doc.id.substring(0, 6)}...</span>
                        <span class="text-xs px-2.5 py-0.5 rounded-full font-medium ${statusColor}">${statusText}</span>
                    </div>
                    <div class="space-y-1 my-1">${itemsDetail}</div>
                    <div class="flex justify-between items-center mt-2 pt-1 border-t border-dashed border-gray-100 text-sm">
                        <span class="font-medium text-gray-600">รวมราคานี้:</span>
                        <span class="font-bold text-orange-600">${orderTotal} บาท</span>
                    </div>
                </div>
            `;
        });

        historyListEl.innerHTML = historyHtml;
    } catch (e) {
        console.error("Error loading history: ", e);
        historyListEl.innerHTML = '<div class="text-center py-6 text-red-400">เกิดข้อผิดพลาดในการโหลดประวัติ</div>';
    }
}

loadMenu();
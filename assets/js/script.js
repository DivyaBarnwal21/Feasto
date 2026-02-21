import { foodItems } from './data.js';

// DOM Elements
const navBox = document.getElementById('navbox');
const hamburger = document.getElementById('hamburger');
const cartCountElement = document.querySelector('.cart-count');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    initMobileMenu();
    setupImageErrorHandling();
    if(window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('feasto/')) {
        renderFeaturedItems();
    }
    if(window.location.pathname.includes('menu.html')) {
        initMenu();
    }
    if(window.location.pathname.includes('cart.html')) {
        initCart();
    }
});

function initMenu() {
    renderMenu('all');
    
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
             // Remove active class from all
             filterBtns.forEach(b => b.classList.remove('active'));
             // Add to clicked
             btn.classList.add('active');
             
             const category = btn.getAttribute('data-id');
             renderMenu(category);
        });
    });
}

function renderMenu(category) {
    const menuGrid = document.getElementById('menu-grid');
    if(!menuGrid) return;
    
    let items = foodItems;
    if(category !== 'all') {
        items = foodItems.filter(item => item.category === category);
    }
    
    menuGrid.innerHTML = items.map(item => `
        <div class="food-card">
            <div class="food-img">
                <img src="${item.image}" alt="${item.name}">
            </div>
            <div class="food-info">
                <div class="rating">
                    <ion-icon name="star"></ion-icon> ${item.rating}
                </div>
                <h3>${item.name}</h3>
                <p>${item.description}</p>
                <div class="price-row">
                    <span class="price">${formatPrice(item.price)}</span>
                    <button class="add-btn" onclick="addToCart(${item.id})">
                        <ion-icon name="cart"></ion-icon> Add
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Cart Page Logic
function initCart() {
    renderCart();
}

function renderCart() {
    const cartItemsEl = document.getElementById('cart-items');
    const cartContainer = document.getElementById('cart-container');
    const cart = JSON.parse(localStorage.getItem('feasto_cart')) || [];
    
    if(cart.length === 0) {
        cartContainer.innerHTML = '<div class="empty-msg" style="text-align:center; padding:40px;"><h3>Your cart is empty</h3><a href="menu.html" class="btn" style="margin-top:20px;">Browse Menu</a></div>';
        return;
    }
    
    let subtotal = 0;
    
    cartItemsEl.innerHTML = cart.map(item => {
        subtotal += item.price * item.qty;
        return `
        <div class="cart-item">
            <img src="${item.image}" alt="${item.name}">
            <div class="item-details">
                <h4>${item.name}</h4>
                <p>${formatPrice(item.price)}</p>
            </div>
            <div class="qty-controls">
                <button onclick="updateQty(${item.id}, -1)">-</button>
                <span>${item.qty}</span>
                <button onclick="updateQty(${item.id}, 1)">+</button>
            </div>
            <div class="item-total">
                ${formatPrice(item.price * item.qty)}
            </div>
            <button class="remove-btn" onclick="removeFromCart(${item.id})">
                <ion-icon name="trash-outline"></ion-icon>
            </button>
        </div>
        `;
    }).join('');
    
    // Update summary
    document.getElementById('subtotal').textContent = formatPrice(subtotal);
    document.getElementById('total-price').textContent = formatPrice(subtotal + 50); // ₹50 delivery
}

window.updateQty = function(id, change) {
    let cart = JSON.parse(localStorage.getItem('feasto_cart')) || [];
    const item = cart.find(i => i.id === id);
    if(item) {
        item.qty += change;
        if(item.qty <= 0) {
            cart = cart.filter(i => i.id !== id);
        }
    }
    localStorage.setItem('feasto_cart', JSON.stringify(cart));
    renderCart();
    updateCartCount();
}

window.removeFromCart = function(id) {
    let cart = JSON.parse(localStorage.getItem('feasto_cart')) || [];
    cart = cart.filter(i => i.id !== id);
    localStorage.setItem('feasto_cart', JSON.stringify(cart));
    renderCart();
    updateCartCount();
}

window.checkout = function() {
    alert('Thank you for your order! This is a demo.');
    localStorage.removeItem('feasto_cart');
    window.location.href = 'index.html';
}

function setupImageErrorHandling() {
    // Handle existing images
    document.querySelectorAll('img').forEach(img => {
        img.onerror = function() {
            this.onerror = null; // Prevent infinite loop
            this.src = 'https://placehold.co/600x400?text=Feasto+Food';
            this.alt = 'Image not found';
        };
    });

    // Handle dynamically added images via MutationObserver
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.tagName === 'IMG') {
                    node.onerror = function() {
                        this.onerror = null;
                        this.src = 'https://placehold.co/600x400?text=Feasto+Food';
                    };
                } else if (node.querySelectorAll) {
                    node.querySelectorAll('img').forEach(img => {
                        img.onerror = function() {
                            this.onerror = null;
                            this.src = 'https://placehold.co/600x400?text=Feasto+Food';
                        };
                    });
                }
            });
        });
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
}

// Mobile Menu Toggle
function initMobileMenu() {
    if(hamburger) {
        hamburger.addEventListener('click', () => {
             navBox.classList.toggle('active');
             const icon = hamburger.querySelector('ion-icon');
             if(navBox.classList.contains('active')) {
                 icon.setAttribute('name', 'close-outline');
             } else {
                 icon.setAttribute('name', 'menu-outline');
             }
        });
    }
    
    // Close menu when clicking a link
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
             navBox.classList.remove('active');
             if(hamburger) {
                 hamburger.querySelector('ion-icon').setAttribute('name', 'menu-outline');
             }
        });
    });
}

// Render Featured Items (Top 3 or 4)
function renderFeaturedItems() {
    const featuredGrid = document.getElementById('featured-grid');
    if(!featuredGrid) return;
    
    // Filter top rated items (e.g. rating >= 4.7) and take 4
    const featured = foodItems.filter(item => item.rating >= 4.7).slice(0, 4);
    
    featuredGrid.innerHTML = featured.map(item => `
        <div class="food-card">
            <div class="food-img">
                <img src="${item.image}" alt="${item.name}">
            </div>
            <div class="food-info">
                <div class="rating">
                    <ion-icon name="star"></ion-icon> ${item.rating}
                </div>
                <h3>${item.name}</h3>
                <p>${item.description}</p>
                <div class="price-row">
                    <span class="price">${formatPrice(item.price)}</span>
                    <button class="add-btn" onclick="addToCart(${item.id})">
                        <ion-icon name="cart"></ion-icon> Add
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Global Add to Cart
window.addToCart = function(id) {
    let cart = JSON.parse(localStorage.getItem('feasto_cart')) || [];
    const item = foodItems.find(i => i.id === id);
    const existingItem = cart.find(i => i.id === id);
    
    if(existingItem) {
        existingItem.qty += 1;
    } else {
        cart.push({ ...item, qty: 1 });
    }
    
    localStorage.setItem('feasto_cart', JSON.stringify(cart));
    updateCartCount();
    showToast('Item added to cart!');
}

// Toast Notification
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Toast Styles
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.right = '20px';
    toast.style.background = 'var(--dark-color)';
    toast.style.color = '#fff';
    toast.style.padding = '10px 20px';
    toast.style.borderRadius = '5px';
    toast.style.zIndex = '1000';
    toast.style.animation = 'fadeIn 0.3s, fadeOut 0.3s 2.7s';
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Global fadeOut animation
const style = document.createElement('style');
style.innerHTML = `
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
@keyframes fadeOut { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(10px); } }
`;
document.head.appendChild(style);

// Cart Logic Placeholder (Shared)
export function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('feasto_cart')) || [];
    const totalItems = cart.reduce((total, item) => total + item.qty, 0);
    if(cartCountElement) {
        cartCountElement.textContent = totalItems;
    }
}

// Helper: Format formatted price
export function formatPrice(price) {
    return `₹${price.toFixed(2)}`;
}

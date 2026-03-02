import { categories, foodItems as staticFoodItems } from './data.js';

let foodItems = [];

// Auth Tokens
export function getAuthToken() {
    return localStorage.getItem('feasto_jwt');
}

export function getCurrentUser() {
    const userStr = localStorage.getItem('feasto_user');
    return userStr ? JSON.parse(userStr) : null;
}

window.logout = function() {
    localStorage.removeItem('feasto_jwt');
    localStorage.removeItem('feasto_user');
    window.location.reload();
}

// DOM Elements
const navBox = document.getElementById('navbox');
const hamburger = document.getElementById('hamburger');
const cartCountElement = document.querySelector('.cart-count');

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    updateCartCount();
    initMobileMenu();
    setupImageErrorHandling();
    setupAuthNav();
    
    await fetchFoods();
    if(window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('feasto/')) {
        renderFeaturedItems();
    }
    if(window.location.pathname.includes('menu.html')) {
        initMenu();
    }
    if(window.location.pathname.includes('cart.html')) {
        initCart();
        if(window.renderNutritionDashboard) window.renderNutritionDashboard();
    }
    if(window.location.pathname.includes('login.html')) {
        initAuth();
    }
});

function setupAuthNav() {
    const user = getCurrentUser();
    const navLinks = document.getElementById('navbox');
    
    if (user && navLinks) {
        // Find login link if exists and change it to Logout / User Profile
        const links = navLinks.querySelectorAll('a');
        let loginLink = null;
        links.forEach(a => {
           if(a.href.includes('login.html') || a.textContent === 'Login') {
               loginLink = a;
           }
        });
        
        if (loginLink) {
            loginLink.textContent = `Hi, ${user.name.split(' ')[0]}`;
            loginLink.href = "#";
            loginLink.onclick = (e) => {
                e.preventDefault();
                if(confirm("Are you sure you want to log out?")) {
                    logout();
                }
            };
        } else {
            // Append it dynamically
            const li = document.createElement('li');
            li.innerHTML = `<a href="#" onclick="logout(); return false;" style="color:var(--primary-color);">Hi, ${user.name.split(' ')[0]} (Logout)</a>`;
            navLinks.appendChild(li);
        }
    } else if (!user && navLinks) {
        // Make sure login link exists
        const links = navLinks.querySelectorAll('a');
        let hasLogin = false;
        links.forEach(a => {
           if(a.href.includes('login.html')) hasLogin = true;
        });
        if(!hasLogin) {
            const li = document.createElement('li');
            li.innerHTML = `<a href="login.html">Login</a>`;
            navLinks.appendChild(li);
        }
    }
}

function initAuth() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const errorDiv = document.getElementById('auth-error');

    if(loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            errorDiv.textContent = '';
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            
            try {
                const res = await fetch('http://127.0.0.1:5000/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                
                const data = await res.json();
                if(!res.ok) throw new Error(data.error || 'Login failed');
                
                localStorage.setItem('feasto_jwt', data.token);
                localStorage.setItem('feasto_user', JSON.stringify(data.user));
                window.location.href = 'index.html';
                
            } catch (err) {
                errorDiv.textContent = err.message;
            }
        });
    }

    if(registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            errorDiv.textContent = '';
            const name = document.getElementById('register-name').value;
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            
            try {
                const res = await fetch('http://127.0.0.1:5000/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password })
                });
                
                const data = await res.json();
                if(!res.ok) throw new Error(data.error || 'Registration failed');
                
                // Directly login after signup
                const loginRes = await fetch('http://127.0.0.1:5000/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                
                const loginData = await loginRes.json();
                localStorage.setItem('feasto_jwt', loginData.token);
                localStorage.setItem('feasto_user', JSON.stringify(loginData.user));
                window.location.href = 'index.html';
                
            } catch (err) {
                errorDiv.textContent = err.message;
            }
        });
    }
}

async function fetchFoods() {
    try {
        const res = await fetch('http://127.0.0.1:5000/api/foods');
        if(res.ok) {
            foodItems = await res.json();
            foodItems = foodItems.map(item => ({...item, id: item.id || item._id}));
        } else {
            console.warn('Failed to fetch from API, using static data');
            foodItems = staticFoodItems;
        }
    } catch (e) {
        console.error(e);
        foodItems = staticFoodItems;
    }
}

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
                    <button class="add-btn" onclick="addToCart('${item.id}')">
                        <ion-icon name="cart"></ion-icon> Add
                    </button>
                    <button class="add-btn" style="background:var(--primary-color); padding: 5px;" onclick="showNutritionModal('${item.id}')" title="Nutrition Info">
                        <ion-icon name="information-circle"></ion-icon>
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

window.updateQty = async function(id, change) {
    let cart = JSON.parse(localStorage.getItem('feasto_cart')) || [];
    const item = cart.find(i => String(i.id) === String(id));
    if(item) {
        item.qty += change;
        if(item.qty <= 0) {
            cart = cart.filter(i => String(i.id) !== String(id));
        }
        
    // Update Daily Nutrition securely with Auth
    try {
        const user = getCurrentUser();
        if(!user) return; // Feature only logs for auth users
        const token = getAuthToken();
        const endpoint = change > 0 ? '/api/nutrition/add' : '/api/nutrition/remove';
        await fetch(`http://127.0.0.1:5000${endpoint}`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ foodId: id, count: Math.abs(change) })
        });
    } catch(e) {
        console.error('Failed to update macro intake', e);
    }
    }
    localStorage.setItem('feasto_cart', JSON.stringify(cart));
    renderCart();
    updateCartCount();
    
    // Refresh dashboard if we are on the cart page
    if(window.location.pathname.includes('cart.html') && window.renderNutritionDashboard) {
        window.renderNutritionDashboard();
    }
}

window.removeFromCart = async function(id) {
    let cart = JSON.parse(localStorage.getItem('feasto_cart')) || [];
    const itemToRemove = cart.find(i => String(i.id) === String(id));
    
    if (itemToRemove) {
        // Update Daily Nutrition securely
        try {
            const user = getCurrentUser();
            if(!user) return;
            const token = getAuthToken();
            await fetch(`http://127.0.0.1:5000/api/nutrition/remove`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ foodId: id, count: itemToRemove.qty })
            });
        } catch(e) {
            console.error('Failed to remove macro intake', e);
        }
    }

    cart = cart.filter(i => String(i.id) !== String(id));
    localStorage.setItem('feasto_cart', JSON.stringify(cart));
    renderCart();
    updateCartCount();
    
    // Refresh dashboard if we are on the cart page
    if(window.location.pathname.includes('cart.html') && window.renderNutritionDashboard) {
        window.renderNutritionDashboard();
    }
}

window.checkout = async function() {
    const user = getCurrentUser();
    if (!user) {
        alert('Please login to proceed to checkout!');
        window.location.href = 'login.html';
        return;
    }

    const cart = JSON.parse(localStorage.getItem('feasto_cart')) || [];
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }

    const subtotal = cart.reduce((total, item) => total + item.price * item.qty, 0);
    const orderData = {
        items: cart,
        subtotal: subtotal,
        delivery_fee: 50,
        total: subtotal + 50
    };

    try {
        const response = await fetch('http://127.0.0.1:5000/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });

        if (response.ok) {
            const data = await response.json();
            alert(`Thank you for your order! Order ID: ${data.order_id}`);
            localStorage.removeItem('feasto_cart');
            window.location.href = 'index.html';
        } else {
            console.error('Checkout failed');
            alert('Something went wrong. Please try again later.');
        }
    } catch (error) {
        console.error('Error during checkout:', error);
        alert('Could not connect to the server. Please make sure the backend is running.');
    }
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
                    <button class="add-btn" onclick="addToCart('${item.id}')">
                        <ion-icon name="cart"></ion-icon> Add
                    </button>
                    <button class="add-btn" style="background:var(--primary-color); padding: 5px;" onclick="showNutritionModal('${item.id}')" title="Nutrition Info">
                        <ion-icon name="information-circle"></ion-icon>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Global Add to Cart
window.addToCart = async function(id) {
    let cart = JSON.parse(localStorage.getItem('feasto_cart')) || [];
    // Convert to strict comparison after type coercion since ID might be string or number
    const item = foodItems.find(i => String(i.id) === String(id));
    const existingItem = cart.find(i => String(i.id) === String(id));
    
    if(existingItem) {
        existingItem.qty += 1;
    } else {
        cart.push({ ...item, qty: 1 });
    }
    
    localStorage.setItem('feasto_cart', JSON.stringify(cart));
    updateCartCount();
    showToast('Item added to cart!');

    // Update Daily Nutrition
    try {
        const userId = 'guest_user'; // fallback user since no login
        await fetch('http://127.0.0.1:5000/api/nutrition/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, foodId: id })
        });
    } catch(e) {
        console.error('Failed to log macro intake', e);
    }
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

// Global fadeOut animation & Modal styles
const style = document.createElement('style');
style.innerHTML = `
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
@keyframes fadeOut { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(10px); } }
.nutrition-modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; animation: fadeIn 0.3s; }
.nutrition-modal { background: #fff; padding: 25px; border-radius: 12px; width: 90%; max-width: 400px; position: relative; box-shadow: 0px 10px 30px rgba(0,0,0,0.2); }
.nutrition-close { position: absolute; top: 15px; right: 15px; background: none; border: none; font-size: 24px; cursor: pointer; color: #333; }
.nutrition-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 20px; }
.nutrition-card { background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; border-left: 4px solid var(--primary-color); }
.nutrition-card.calories { border-left-color: #ff5722; }
.nutrition-card.protein { border-left-color: #4CAF50; }
.nutrition-card.carbs { border-left-color: #2196F3; }
.nutrition-card.fats { border-left-color: #FFC107; }
.nutrition-label { display: block; font-size: 14px; color: #666; font-weight: 500;}
.nutrition-value { display: block; font-size: 18px; font-weight: 700; color: #222; margin-top: 5px; }
.dashboard-container { background: #fff; border-radius: 12px; padding: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); margin-bottom: 40px; }
.dashboard-stats { display: flex; justify-content: center; gap: 20px; margin-bottom: 20px; }
.stat-card { background: var(--primary-color); color: #fff; padding: 15px 25px; border-radius: 8px; text-align: center; }
.stat-label { display: block; font-size: 14px; opacity: 0.9; }
.stat-value { display: block; font-size: 24px; font-weight: bold; margin-top: 5px; }
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

window.showNutritionModal = function(id) {
    const item = foodItems.find(i => String(i.id) === String(id));
    if(!item) return;
    
    const overlay = document.createElement('div');
    overlay.className = 'nutrition-modal-overlay';
    overlay.innerHTML = `
        <div class="nutrition-modal">
            <button class="nutrition-close" onclick="this.closest('.nutrition-modal-overlay').remove()">&times;</button>
            <h2 style="font-size: 22px; color: var(--dark-color);">${item.name}</h2>
            <p style="color: #666; margin-top: 5px;">Nutritional Information</p>
            <div class="nutrition-grid">
                <div class="nutrition-card calories">
                    <span class="nutrition-label">Calories</span>
                    <span class="nutrition-value">${item.calories || 0} kcal</span>
                </div>
                <div class="nutrition-card protein">
                    <span class="nutrition-label">Protein</span>
                    <span class="nutrition-value">${item.protein || 0}g</span>
                </div>
                <div class="nutrition-card carbs">
                    <span class="nutrition-label">Carbs</span>
                    <span class="nutrition-value">${item.carbs || 0}g</span>
                </div>
                <div class="nutrition-card fats">
                    <span class="nutrition-label">Fats</span>
                    <span class="nutrition-value">${item.fats || 0}g</span>
                </div>
            </div>
        </div>
    `;
    
    // Close when clicking outside
    overlay.addEventListener('click', (e) => {
        if(e.target === overlay) overlay.remove();
    });
    
    document.body.appendChild(overlay);
}

// Render Nutrition Dashboard in Cart
window.renderNutritionDashboard = async function() {
    const container = document.getElementById('cart-container');
    if(!container) return;
    
    let dashboardDiv = document.querySelector('.dashboard-container.container');
    if (!dashboardDiv) {
        dashboardDiv = document.createElement('div');
        dashboardDiv.className = 'dashboard-container container';
        // Insert dashboard just below the container
        container.after(dashboardDiv);
    }
    
    dashboardDiv.innerHTML = `<div style="text-align: center; padding: 40px;">Loading Daily Intake Dashboard...</div>`;
    
    try {
        const user = getCurrentUser();
        const token = getAuthToken();
        if(!user || !token) {
             dashboardDiv.innerHTML = `<p style="text-align:center; color:#666;">Please <a href="login.html" style="color:var(--primary-color);">Login</a> to see your Daily Nutrition.</p>`;
             return;
        }

        const res = await fetch(`http://127.0.0.1:5000/api/nutrition/today`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await res.json();
        
        let warningText = '';
        if (data.totalCalories > 2000) {
            warningText = `<div style="background-color: #ffebee; color: #c62828; padding: 15px; border-radius: 8px; margin-bottom: 20px; font-weight: bold; text-align: center; border: 1px solid #ef5350;">Warning: You have exceeded your recommended daily calorie intake. (2000 kcal)</div>`;
        }
        
        const hasData = data.totalCalories > 0;
        
        let content = `
            <h2 class="section-title" style="margin-bottom: 20px;">Today's Intake Dashboard</h2>
            ${warningText}
            <div class="dashboard-stats">
              <div class="stat-card">
                 <span class="stat-label">Total Calories Consumed</span>
                 <span class="stat-value">${data.totalCalories || 0} kcal</span>
              </div>
            </div>
        `;
        
        if (hasData) {
            content += `
              <div style="width: 100%; max-width: 400px; margin: 0 auto;">
                  <canvas id="nutritionChart"></canvas>
              </div>
            `;
        } else {
            content += `<p style="text-align:center; color:#666;">No intake logged for today. Add items to your cart!</p>`;
        }
        
        dashboardDiv.innerHTML = content;
        
        if(hasData) {
            // Check if Chart is available (we need to inject script tag for Chart.js)
            if(window.Chart) {
                if (window.nutritionChartInstance) {
                    window.nutritionChartInstance.destroy();
                }
                initChartJs(data);
            } else {
                const script = document.createElement('script');
                script.src = "https://cdn.jsdelivr.net/npm/chart.js";
                script.onload = () => initChartJs(data);
                document.head.appendChild(script);
            }
        }
        
    } catch(e) {
        console.error('Failed to load nutrition dashboard:', e);
        dashboardDiv.innerHTML = '<p style="text-align:center; color:red;">Failed to load daily intake.</p>';
    }
}

function initChartJs(data) {
    const ctx = document.getElementById('nutritionChart').getContext('2d');
    window.nutritionChartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Protein (g)', 'Carbs (g)', 'Fats (g)'],
            datasets: [{
                data: [data.totalProtein, data.totalCarbs, data.totalFats],
                backgroundColor: [
                    '#4CAF50', // green
                    '#2196F3', // blue
                    '#FFC107'  // yellow
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

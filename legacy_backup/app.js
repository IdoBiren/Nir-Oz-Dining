/* Menu Data */
const menuItems = [
    {
        id: 1,
        name: "Truffle Mushroom Soup",
        description: "Creamy wild mushroom soup with truffle oil drizzle.",
        price: 12.00,
        category: "starter",
        image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
    },
    {
        id: 2,
        name: "Wagyu Beef Burger",
        description: "200g Wagyu patty, brioche bun, aged cheddar, onions.",
        price: 24.50,
        category: "main",
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
    },
    {
        id: 3,
        name: "Grilled Salmon",
        description: "Norwegian salmon with asparagus and lemon butter.",
        price: 28.00,
        category: "main",
        image: "https://images.unsplash.com/photo-1467003909585-2f8a7270028d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
    },
    {
        id: 4,
        name: "Caesar Salad",
        description: "Crisp romaine, parmesan, croutons, signature dressing.",
        price: 14.00,
        category: "starter",
        image: "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
    },
    {
        id: 5,
        name: "Molten Lava Cake",
        description: "Warm chocolate cake with a liquid core and vanilla ice cream.",
        price: 10.50,
        category: "dessert",
        image: "https://images.unsplash.com/photo-1624353365286-3f8d62daad51?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
    },
    {
        id: 6,
        name: "Artisan Coffee",
        description: "Freshly brewed nutty aromatic coffee.",
        price: 5.00,
        category: "drink",
        image: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
    },
    {
        id: 7,
        name: "Fresh Orange Juice",
        description: "Squeezed daily from organic oranges.",
        price: 6.00,
        category: "drink",
        image: "https://images.unsplash.com/photo-1626804475297-411d863b67eb?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
    },
    {
        id: 8,
        name: "Lobster Ravioli",
        description: "Handmade pasta filled with lobster in a saffron cream sauce.",
        price: 32.00,
        category: "main",
        image: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
    }
];

/* State */
let cart = [];
let currentCategory = 'all';
let currentUser = null;

/* DOM Elements */
const loginOverlay = document.getElementById('login-overlay');
const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('username');
const appContainer = document.getElementById('app-container');
const welcomeHeader = document.querySelector('.welcome-text h1');

const menuContainer = document.getElementById('menu-container');
const cartContainer = document.getElementById('cart-items-container');
const cartTotalEl = document.getElementById('cart-total');
const navButtons = document.querySelectorAll('.nav-btn');
const searchInput = document.getElementById('search-input');
const checkoutBtn = document.getElementById('checkout-btn');

/* Functions */

function renderMenu(items) {
    menuContainer.innerHTML = '';

    if (items.length === 0) {
        menuContainer.innerHTML = '<p style="color:var(--text-gray); grid-column:1/-1; text-align:center;">No items found.</p>';
        return;
    }

    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'meal-card';
        card.innerHTML = `
            <img src="${item.image}" alt="${item.name}" class="card-img" onerror="this.src='https://via.placeholder.com/150'">
            <div class="card-info">
                <h3>${item.name}</h3>
                <p>${item.description}</p>
            </div>
            <div class="card-bottom">
                <span class="price">$${item.price.toFixed(2)}</span>
                <button class="add-btn" onclick="addToCart(${item.id})">
                    <i class="fa-solid fa-plus"></i>
                </button>
            </div>
        `;
        menuContainer.appendChild(card);
    });
}

function addToCart(id) {
    const item = menuItems.find(i => i.id === id);
    const existing = cart.find(c => c.id === id);

    if (existing) {
        existing.qty++;
    } else {
        cart.push({ ...item, qty: 1 });
    }
    renderCart();

    // Simple haptic/visual feedback could go here
}

function removeFromCart(id) {
    const idx = cart.findIndex(c => c.id === id);
    if (idx !== -1) {
        if (cart[idx].qty > 1) {
            cart[idx].qty--;
        } else {
            cart.splice(idx, 1);
        }
    }
    renderCart();
}

function renderCart() {
    cartContainer.innerHTML = '';
    let total = 0;

    if (cart.length === 0) {
        cartContainer.innerHTML = `
            <div class="empty-cart">
                <i class="fa-solid fa-basket-shopping"></i>
                <p>Your cart is empty.</p>
            </div>
        `;
        cartTotalEl.textContent = '$0.00';
        return;
    }

    cart.forEach(item => {
        const itemTotal = item.price * item.qty;
        total += itemTotal;

        const el = document.createElement('div');
        el.className = 'cart-item';
        el.innerHTML = `
            <img src="${item.image}" alt="${item.name}" class="cart-item-img">
            <div class="cart-item-details">
                <h4>${item.name}</h4>
                <span>$${item.price.toFixed(2)}</span>
            </div>
            <div class="cart-controls">
                <button class="cart-qty-btn" onclick="removeFromCart(${item.id})">-</button>
                <span class="cart-qty">${item.qty}</span>
                <button class="cart-qty-btn" onclick="addToCart(${item.id})">+</button>
            </div>
        `;
        cartContainer.appendChild(el);
    });

    cartTotalEl.textContent = `$${total.toFixed(2)}`;
}

/* Event Listeners */
navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        // Active state
        navButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Filter
        currentCategory = btn.dataset.category;
        filterMenu();
    });
});

searchInput.addEventListener('input', (e) => {
    filterMenu(e.target.value);
});

checkoutBtn.addEventListener('click', () => {
    if (cart.length === 0) {
        alert("Your cart is empty!");
    } else {
        const confirmMsg = `Order placed successfully!\nTotal: ${cartTotalEl.textContent}`;
        alert(confirmMsg);
        cart = [];
        renderCart();
    }
});

function filterMenu(searchTerm = '') {
    let filtered = menuItems;

    if (currentCategory !== 'all') {
        filtered = filtered.filter(item => item.category === currentCategory);
    }

    if (searchTerm) {
        const lower = searchTerm.toLowerCase();
        filtered = filtered.filter(item =>
            item.name.toLowerCase().includes(lower) ||
            item.description.toLowerCase().includes(lower)
        );
    }

    renderMenu(filtered);
}

/* Login Logic */
function login(name) {
    currentUser = name;
    localStorage.setItem('mealAppUser', name);

    // UI Transition
    loginOverlay.classList.add('hidden');
    appContainer.style.filter = 'none';
    appContainer.style.pointerEvents = 'auto';

    // Update Personalization
    welcomeHeader.textContent = `Welcome, ${name}`;
}

function checkSession() {
    const savedUser = localStorage.getItem('mealAppUser');
    if (savedUser) {
        login(savedUser);
    } else {
        // Ensure UI is blocked if no session
        appContainer.style.filter = 'blur(5px)';
        appContainer.style.pointerEvents = 'none';
    }
}

if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = usernameInput.value.trim() || "Guest";
        login(name);
    });
}

/* Init */
checkSession();
renderMenu(menuItems);

// Global Exposure for inline OnClick handlers (simple mechanism)
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;

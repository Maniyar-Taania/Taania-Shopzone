/* ============================================================
   ShopZone — script.js
   1. Fetch products from products.json (Fetch API)
   2. Render product cards
   3. Live search
   4. Cart: add / increase / decrease / remove / clear / total
   5. Cart is saved in localStorage, so it survives a refresh
   ============================================================ */

// ---------- Get the HTML elements we need ----------
const productGrid = document.getElementById("productGrid");
const noResults = document.getElementById("noResults");
const searchInput = document.getElementById("searchInput");

const cartBtn = document.getElementById("cartBtn");
const cartDrawer = document.getElementById("cartDrawer");
const cartOverlay = document.getElementById("cartOverlay");
const closeCartBtn = document.getElementById("closeCartBtn");
const cartItemsBox = document.getElementById("cartItems");
const cartCount = document.getElementById("cartCount");
const cartTotal = document.getElementById("cartTotal");
const checkoutBtn = document.getElementById("checkoutBtn");
const clearCartBtn = document.getElementById("clearCartBtn");
const toast = document.getElementById("toast");

// ---------- Global state ----------
let allProducts = []; // filled after fetch
// Load a saved cart from localStorage (or start with an empty one)
let cart = JSON.parse(localStorage.getItem("shopzoneCart")) || [];

// ============================================================
// 1. LOAD PRODUCTS with the Fetch API
// ============================================================
fetch("products.json")
  .then(function (response) {
    if (!response.ok) {
      throw new Error("Could not load products.json (HTTP " + response.status + ")");
    }
    return response.json(); // convert the file into a JS array
  })
  .then(function (products) {
    allProducts = products;
    renderProducts(allProducts);
  })
  .catch(function (error) {
    productGrid.innerHTML =
      '<p class="load-error">Failed to load products. ' +
      "Please run this project with a local server (e.g. the VS Code " +
      '"Live Server" extension), not by double-clicking index.html.</p>';
    console.error(error);
  });

// ============================================================
// 2. RENDER PRODUCT CARDS
// ============================================================
function renderProducts(products) {
  productGrid.innerHTML = ""; // clear old cards

  // Show a message if a search found nothing
  noResults.hidden = products.length !== 0;

  products.forEach(function (product) {
    const card = document.createElement("article");
    card.className = "product-card";

    card.innerHTML = `
      <div class="card-image">
        <img src="${product.image}" alt="${product.name}" loading="lazy" />
        <span class="card-category">${product.category}</span>
      </div>
      <div class="card-body">
        <h3 class="card-name">${product.name}</h3>
        <p class="card-rating">
          <span class="stars">${getStars(product.rating)}</span>${product.rating} / 5
        </p>
        <div class="card-bottom">
          <span class="card-price">$${product.price.toFixed(2)}</span>
          <button class="add-btn" data-id="${product.id}">Add to Cart</button>
        </div>
      </div>
    `;

    productGrid.appendChild(card);
  });
}

// Turn a rating like 4.5 into star characters: ★★★★☆
function getStars(rating) {
  const fullStars = Math.round(rating);
  return "★".repeat(fullStars) + "☆".repeat(5 - fullStars);
}

// One click listener on the grid handles every "Add to Cart" button
productGrid.addEventListener("click", function (event) {
  const button = event.target.closest(".add-btn");
  if (!button) return; // click was not on an Add button

  const id = Number(button.dataset.id);
  addToCart(id);
});

// ============================================================
// 3. LIVE SEARCH (filters by name or category as you type)
// ============================================================
searchInput.addEventListener("input", function () {
  const query = searchInput.value.trim().toLowerCase();

  const filtered = allProducts.filter(function (product) {
    return (
      product.name.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query)
    );
  });

  renderProducts(filtered);
});

// ============================================================
// 4. CART LOGIC
// ============================================================
function addToCart(id) {
  const product = allProducts.find(function (p) { return p.id === id; });
  if (!product) return;

  const existing = cart.find(function (item) { return item.id === id; });

  if (existing) {
    existing.quantity += 1; // already in cart → just add one more
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: 1
    });
  }

  saveCart();
  renderCart();
  showToast(product.name + " added to cart ✓");
}

function changeQuantity(id, change) {
  const item = cart.find(function (i) { return i.id === id; });
  if (!item) return;

  item.quantity += change;

  if (item.quantity <= 0) {
    removeFromCart(id); // going below 1 removes the item
    return;
  }

  saveCart();
  renderCart();
}

function removeFromCart(id) {
  cart = cart.filter(function (item) { return item.id !== id; });
  saveCart();
  renderCart();
}

function clearCart() {
  cart = [];
  saveCart();
  renderCart();
}

// Save the cart array as text in the browser
function saveCart() {
  localStorage.setItem("shopzoneCart", JSON.stringify(cart));
}

// ============================================================
// 5. RENDER THE CART DRAWER
// ============================================================
function renderCart() {
  cartItemsBox.innerHTML = "";

  if (cart.length === 0) {
    cartItemsBox.innerHTML = '<p class="empty-cart">Your cart is empty 🛒</p>';
  }

  let total = 0;
  let count = 0;

  cart.forEach(function (item) {
    total += item.price * item.quantity;
    count += item.quantity;

    const row = document.createElement("div");
    row.className = "cart-item";

    row.innerHTML = `
      <img src="${item.image}" alt="${item.name}" />
      <div class="cart-item-info">
        <p class="cart-item-name">${item.name}</p>
        <p class="cart-item-price">$${(item.price * item.quantity).toFixed(2)}</p>
        <div class="qty-controls">
          <button class="qty-btn" data-id="${item.id}" data-change="-1">−</button>
          <span class="qty-value">${item.quantity}</span>
          <button class="qty-btn" data-id="${item.id}" data-change="1">+</button>
        </div>
      </div>
      <button class="remove-btn" data-id="${item.id}" title="Remove item">✕</button>
    `;

    cartItemsBox.appendChild(row);
  });

  cartCount.textContent = count;
  cartTotal.textContent = "$" + total.toFixed(2);
}

// One click listener handles all +, − and ✕ buttons inside the cart
cartItemsBox.addEventListener("click", function (event) {
  const qtyButton = event.target.closest(".qty-btn");
  if (qtyButton) {
    changeQuantity(Number(qtyButton.dataset.id), Number(qtyButton.dataset.change));
    return;
  }

  const removeButton = event.target.closest(".remove-btn");
  if (removeButton) {
    removeFromCart(Number(removeButton.dataset.id));
  }
});

// ============================================================
// 6. OPEN / CLOSE THE CART DRAWER
// ============================================================
function openCart() {
  cartDrawer.classList.add("open");
  cartOverlay.classList.add("show");
}

function closeCart() {
  cartDrawer.classList.remove("open");
  cartOverlay.classList.remove("show");
}

cartBtn.addEventListener("click", openCart);
closeCartBtn.addEventListener("click", closeCart);
cartOverlay.addEventListener("click", closeCart); // click the dark area to close

// Close the drawer with the Escape key too
document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") closeCart();
});

// ============================================================
// 7. CHECKOUT & CLEAR BUTTONS
// ============================================================
checkoutBtn.addEventListener("click", function () {
  if (cart.length === 0) {
    showToast("Your cart is empty — add something first!");
    return;
  }

  showToast("Order placed successfully. Thank you for shopping! 🎉");
  clearCart();
  closeCart();
});

clearCartBtn.addEventListener("click", function () {
  clearCart();
  showToast("Cart cleared");
});

// ============================================================
// 8. TOAST (small popup message)
// ============================================================
let toastTimer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer); // restart the timer if a toast is already visible
  toastTimer = setTimeout(function () {
    toast.classList.remove("show");
  }, 2200);
}

// Show the saved cart immediately when the page loads
renderCart();
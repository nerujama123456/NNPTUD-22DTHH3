const API_URL = "https://api.escuelajs.co/api/v1/products";

let allProducts = [];
let filteredProducts = [];

let currentPage = 1;
let pageSize = 10;

let sortTitleAsc = true;
let sortPriceAsc = true;

let selectedProduct = null;

const tbodyProducts = document.getElementById("tbodyProducts");
const txtSearch = document.getElementById("txtSearch");
const selectPageSize = document.getElementById("selectPageSize");
const pagination = document.getElementById("pagination");
const lblTotal = document.getElementById("lblTotal");
const lblPageInfo = document.getElementById("lblPageInfo");

const btnSortTitle = document.getElementById("btnSortTitle");
const btnSortPrice = document.getElementById("btnSortPrice");
const btnExportCSV = document.getElementById("btnExportCSV");

const modalDetail = new bootstrap.Modal(document.getElementById("modalDetail"));
const modalCreate = new bootstrap.Modal(document.getElementById("modalCreate"));

const btnOpenCreate = document.getElementById("btnOpenCreate");

// =========================
// Helpers
// =========================
function safeText(text) {
    return (text ?? "").toString();
}

function formatPrice(price) {
    return "$" + Number(price || 0).toLocaleString();
}

function getCategoryName(p) {
    return p?.category?.name ? p.category.name : "(No category)";
}

function escapeHtml(str) {
    return safeText(str)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function getCurrentViewData() {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return filteredProducts.slice(start, end);
}

// =========================
// Render Table
// =========================
function renderTable() {
    const viewData = getCurrentViewData();
    tbodyProducts.innerHTML = "";

    if (viewData.length === 0) {
        tbodyProducts.innerHTML = `
      <tr>
        <td colspan="5" class="text-center text-muted py-4">
          Không có dữ liệu
        </td>
      </tr>
    `;
        renderPagination();
        return;
    }

    viewData.forEach((p) => {
        const desc = safeText(p.description);
        const title = safeText(p.title);

        const imagesHtml = (Array.isArray(p.images) ? p.images.slice(0, 2) : [])
            .map((img) => {
                return `<img class="img-thumb me-1" src="${img}" onerror="this.src='https://via.placeholder.com/60'" />`;
            })
            .join("");

        const tr = document.createElement("tr");
        tr.classList.add("clickable-row");

        // Tooltip description when hover row
        tr.setAttribute("data-bs-toggle", "tooltip");
        tr.setAttribute("data-bs-placement", "top");
        tr.setAttribute("data-bs-html", "true");
        tr.setAttribute(
            "title",
            `<div class='desc-tooltip'><b>Description:</b><br>${escapeHtml(desc)}</div>`
        );

        tr.innerHTML = `
      <td><span class="fw-semibold">${p.id}</span></td>
      <td>${escapeHtml(title)}</td>
      <td class="fw-semibold">${formatPrice(p.price)}</td>
      <td>
        <span class="badge text-bg-info badge-cat">${escapeHtml(getCategoryName(p))}</span>
      </td>
      <td>${imagesHtml}</td>
    `;

        tr.addEventListener("click", () => openDetailModal(p));
        tbodyProducts.appendChild(tr);
    });

    // Enable tooltips
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltipTriggerList.forEach((el) => new bootstrap.Tooltip(el));

    lblTotal.textContent = filteredProducts.length;
    lblPageInfo.textContent = `Trang ${currentPage} / ${Math.max(
        1,
        Math.ceil(filteredProducts.length / pageSize)
    )}`;

    renderPagination();
}

// =========================
// Pagination
// =========================
function renderPagination() {
    const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
    pagination.innerHTML = "";

    function createPageItem(label, page, disabled = false, active = false) {
        const li = document.createElement("li");
        li.className = "page-item";
        if (disabled) li.classList.add("disabled");
        if (active) li.classList.add("active");

        const a = document.createElement("a");
        a.className = "page-link";
        a.href = "#";
        a.textContent = label;

        a.addEventListener("click", (e) => {
            e.preventDefault();
            if (disabled) return;
            currentPage = page;
            renderTable();
        });

        li.appendChild(a);
        return li;
    }

    pagination.appendChild(createPageItem("«", Math.max(1, currentPage - 1), currentPage === 1));

    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 1) {
            pagination.appendChild(createPageItem(i, i, false, i === currentPage));
        } else if (Math.abs(i - currentPage) === 2) {
            const li = document.createElement("li");
            li.className = "page-item disabled";
            li.innerHTML = `<span class="page-link">...</span>`;
            pagination.appendChild(li);
        }
    }

    pagination.appendChild(
        createPageItem("»", Math.min(totalPages, currentPage + 1), currentPage === totalPages)
    );
}

// =========================
// Search
// =========================
function applySearch() {
    const keyword = txtSearch.value.trim().toLowerCase();
    filteredProducts = allProducts.filter((p) =>
        safeText(p.title).toLowerCase().includes(keyword)
    );
    currentPage = 1;
    renderTable();
}

// =========================
// Sort
// =========================
function sortByTitle() {
    sortTitleAsc = !sortTitleAsc;
    filteredProducts.sort((a, b) => {
        const x = safeText(a.title).toLowerCase();
        const y = safeText(b.title).toLowerCase();
        if (x < y) return sortTitleAsc ? -1 : 1;
        if (x > y) return sortTitleAsc ? 1 : -1;
        return 0;
    });
    currentPage = 1;
    renderTable();
}

function sortByPrice() {
    sortPriceAsc = !sortPriceAsc;
    filteredProducts.sort((a, b) =>
        sortPriceAsc ? a.price - b.price : b.price - a.price
    );
    currentPage = 1;
    renderTable();
}

// =========================
// Export CSV (current view)
// =========================
function exportCSV() {
    const viewData = getCurrentViewData();

    const headers = ["id", "title", "price", "category", "images"];
    const rows = viewData.map((p) => {
        return [
            p.id,
            safeText(p.title),
            p.price,
            safeText(getCategoryName(p)),
            JSON.stringify(p.images || []),
        ];
    });

    const csvContent = [
        headers.join(","),
        ...rows.map((r) =>
            r.map((cell) => `"${safeText(cell).replaceAll('"', '""')}"`).join(",")
        ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "products_view.csv";
    a.click();

    URL.revokeObjectURL(url);
}

// =========================
// Detail Modal + Update
// =========================
function openDetailModal(product) {
    selectedProduct = product;

    document.getElementById("detail_id").value = product.id;
    document.getElementById("detail_title").value = safeText(product.title);
    document.getElementById("detail_price").value = product.price;
    document.getElementById("detail_description").value = safeText(product.description);
    document.getElementById("detail_categoryId").value = product?.category?.id ?? 1;
    document.getElementById("detail_images").value = JSON.stringify(product.images || []);

    renderDetailPreviewImages(product.images || []);
    modalDetail.show();
}

function renderDetailPreviewImages(images) {
    const div = document.getElementById("detail_previewImages");
    div.innerHTML = "";

    if (!Array.isArray(images) || images.length === 0) {
        div.innerHTML = `<span class="text-muted">Không có ảnh</span>`;
        return;
    }

    images.forEach((img) => {
        const el = document.createElement("img");
        el.className = "img-thumb";
        el.src = img;
        el.onerror = () => (el.src = "https://via.placeholder.com/60");
        div.appendChild(el);
    });
}

async function updateProduct() {
    if (!selectedProduct) return;

    let imagesArr = [];
    try {
        imagesArr = JSON.parse(document.getElementById("detail_images").value || "[]");
        if (!Array.isArray(imagesArr)) imagesArr = [];
    } catch {
        alert("Images phải là JSON array hợp lệ!");
        return;
    }

    const payload = {
        title: document.getElementById("detail_title").value.trim(),
        price: Number(document.getElementById("detail_price").value),
        description: document.getElementById("detail_description").value.trim(),
        categoryId: Number(document.getElementById("detail_categoryId").value),
        images: imagesArr,
    };

    try {
        const res = await fetch(`${API_URL}/${selectedProduct.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const errText = await res.text();
            throw new Error(errText);
        }

        alert("✅ Update thành công!");
        modalDetail.hide();
        await loadProducts();
    } catch (err) {
        console.error(err);
        alert("❌ Update thất bại! Xem console để biết lỗi.");
    }
}

// =========================
// Create Modal + POST
// =========================
function openCreateModal() {
    document.getElementById("create_title").value = "";
    document.getElementById("create_price").value = 100;
    document.getElementById("create_categoryId").value = 1;
    document.getElementById("create_description").value = "New product created from dashboard";
    document.getElementById("create_images").value = '["https://i.imgur.com/1twoaDy.jpeg"]';
    modalCreate.show();
}

async function createProduct() {
    let imagesArr = [];
    try {
        imagesArr = JSON.parse(document.getElementById("create_images").value || "[]");
        if (!Array.isArray(imagesArr)) imagesArr = [];
    } catch {
        alert("Images phải là JSON array hợp lệ!");
        return;
    }

    const payload = {
        title: document.getElementById("create_title").value.trim(),
        price: Number(document.getElementById("create_price").value),
        description: document.getElementById("create_description").value.trim(),
        categoryId: Number(document.getElementById("create_categoryId").value),
        images: imagesArr,
    };

    if (!payload.title) {
        alert("Title không được rỗng!");
        return;
    }

    try {
        const res = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const errText = await res.text();
            throw new Error(errText);
        }

        alert("✅ Tạo sản phẩm thành công!");
        modalCreate.hide();
        await loadProducts();
    } catch (err) {
        console.error(err);
        alert("❌ Tạo thất bại! Xem console để biết lỗi.");
    }
}

// =========================
// Load Products
// =========================
async function loadProducts() {
    try {
        tbodyProducts.innerHTML = `
      <tr><td colspan="5" class="text-center text-muted py-4">Đang tải dữ liệu...</td></tr>
    `;

        const res = await fetch(API_URL);
        const data = await res.json();

        allProducts = Array.isArray(data) ? data : [];
        filteredProducts = [...allProducts];

        currentPage = 1;
        renderTable();
    } catch (err) {
        console.error(err);
        tbodyProducts.innerHTML = `
      <tr><td colspan="5" class="text-center text-danger py-4">Lỗi tải dữ liệu!</td></tr>
    `;
    }
}

// =========================
// Events
// =========================
txtSearch.addEventListener("input", applySearch);

selectPageSize.addEventListener("change", () => {
    pageSize = Number(selectPageSize.value);
    currentPage = 1;
    renderTable();
});

btnSortTitle.addEventListener("click", sortByTitle);
btnSortPrice.addEventListener("click", sortByPrice);

btnExportCSV.addEventListener("click", exportCSV);

btnOpenCreate.addEventListener("click", openCreateModal);

document.getElementById("btnUpdateProduct").addEventListener("click", updateProduct);
document.getElementById("btnCreateProduct").addEventListener("click", createProduct);

// Init
loadProducts();

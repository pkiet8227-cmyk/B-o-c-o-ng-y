// =====================================================
// QUẢN LÝ BÁO CÁO NGÀY - MANAGER.JS
// Phân trang 20 dòng / trang
// Đăng nhập Email + Mật khẩu
// Phân quyền bằng User Metadata trong Supabase
// User Metadata: { "role": "manager" } hoặc { "role": "admin" }
// =====================================================

"use strict";

// =====================================================
// KHỞI TẠO SUPABASE
// =====================================================
if (!window.supabase) {
  alert("❌ Không tải được thư viện Supabase.");
  throw new Error("Supabase library chưa được tải.");
}

const SUPABASE_URL_VALUE =
  typeof SUPABASE_URL !== "undefined"
    ? SUPABASE_URL
    : window.SUPABASE_URL;

const SUPABASE_KEY_VALUE =
  typeof SUPABASE_ANON_KEY !== "undefined"
    ? SUPABASE_ANON_KEY
    : window.SUPABASE_ANON_KEY;

if (!SUPABASE_URL_VALUE || !SUPABASE_KEY_VALUE) {
  alert("❌ Chưa cấu hình Supabase. Kiểm tra lại file config.js.");
  throw new Error("Thiếu SUPABASE_URL hoặc SUPABASE_ANON_KEY.");
}

const db = supabase.createClient(
  SUPABASE_URL_VALUE,
  SUPABASE_KEY_VALUE
);

// =====================================================
// BIẾN TOÀN CỤC
// =====================================================
let allData = [];
let filteredData = [];
let currentPage = 1;
const PAGE_SIZE = 20;

// =====================================================
// KHỞI THAO ELEMENTS UI
// =====================================================
const loginBox = document.getElementById("loginBox");
const managerBox = document.getElementById("managerBox");
const emailInput = document.getElementById("loginId") || document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const loginMessage = document.getElementById("loginMessage");
const managerMessage = document.getElementById("managerMessage");

// Thống kê
const totalReports = document.getElementById("totalReports");
const totalAmount = document.getElementById("totalAmount");

// Bộ lọc
const filterUser = document.getElementById("filterUser");
const filterDate = document.getElementById("filterDate");
const filterBtn = document.getElementById("filterBtn");
const refreshBtn = document.getElementById("refreshBtn");
const exportBtn = document.getElementById("exportBtn");

// Cán bộ đã gửi
const showSubmittedUsersBtn = document.getElementById("showSubmittedUsersBtn");
const submittedUserCount = document.getElementById("submittedUserCount");

// Bảng & Phân trang
const tableBody = document.getElementById("tableBody");
const pagination = document.getElementById("pagination");

// Menu Side
const menuBtn = document.getElementById("menuBtn");
const sideMenu = document.getElementById("sideMenu");
const sideMenuOverlay = document.getElementById("sideMenuOverlay");
const sideMenuClose = document.getElementById("sideMenuClose");
const menuReportsBtn = document.getElementById("menuReportsBtn");
const menuPermissionBtn = document.getElementById("menuPermissionBtn");
const menuLogoutBtn = document.getElementById("menuLogoutBtn");

// =====================================================
// EVENT LISTENERS & KHỞI ĐỘNG
// =====================================================
document.addEventListener("DOMContentLoaded", async () => {
  loginBtn?.addEventListener("click", login);

  passwordInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") login();
  });

  logoutBtn?.addEventListener("click", logout);

  filterBtn?.addEventListener("click", () => {
    currentPage = 1;
    applyFilter();
  });

  filterUser?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      currentPage = 1;
      applyFilter();
    }
  });

  filterDate?.addEventListener("change", () => {
    currentPage = 1;
    applyFilter();
  });

  refreshBtn?.addEventListener("click", async () => {
    currentPage = 1;
    await loadData();
  });

  exportBtn?.addEventListener("click", exportExcel);
  showSubmittedUsersBtn?.addEventListener("click", showSubmittedUsers);

  // Menu Sidebar Events
  menuBtn?.addEventListener("click", openMenu);
  sideMenuClose?.addEventListener("click", closeMenu);
  sideMenuOverlay?.addEventListener("click", closeMenu);

  menuReportsBtn?.addEventListener("click", async () => {
    closeMenu();
    currentPage = 1;
    await loadData();
  });

  menuPermissionBtn?.addEventListener("click", openPermission);
  menuLogoutBtn?.addEventListener("click", logout);

  // Kiểm tra phiên đăng nhập
  await checkSession();
});

// =====================================================
// KIỂM TRA PHIÊN DÙNG (SESSION) & QUYỀN HẠN
// =====================================================
async function checkSession() {
  try {
    const { data, error } = await db.auth.getSession();
    if (error || !data?.session) {
      showLogin();
      return;
    }

    const { data: userData, error: userError } = await db.auth.getUser();
    if (userError || !userData?.user) {
      await db.auth.signOut();
      showLogin();
      if (loginMessage) loginMessage.textContent = "❌ Không lấy được thông tin tài khoản.";
      return;
    }

    const user = userData.user;
    if (!checkManagerPermission(user)) {
      await db.auth.signOut();
      showLogin();
      if (loginMessage) loginMessage.textContent = "❌ Tài khoản chưa được cấp quyền quản lý (Role: manager/admin).";
      return;
    }

    showManager();
    await loadData();
  } catch (error) {
    console.error("Lỗi checkSession:", error);
    showLogin();
    if (loginMessage) loginMessage.textContent = "❌ Có lỗi khi kiểm tra tài khoản.";
  }
}

function checkManagerPermission(user) {
  if (!user) return false;
  const metadata = user.user_metadata || {};
  const role = String(metadata.role || "").trim().toLowerCase();
  
  console.log("🔐 User Login:", user.email, "| Role:", role);
  return role === "manager" || role === "admin";
}

// =====================================================
// CHUYỂN ĐỔI GIAO DIỆN LOGIN / MANAGER
// =====================================================
function showLogin() {
  if (loginBox) loginBox.style.display = "block";
  if (managerBox) managerBox.style.display = "none";
}

function showManager() {
  if (loginBox) loginBox.style.display = "none";
  if (managerBox) managerBox.style.display = "block";
  if (loginMessage) loginMessage.textContent = "";
}

// =====================================================
// XỬ LÝ ĐĂNG NHẬP
// =====================================================
async function login() {
  const email = emailInput?.value?.trim() || "";
  const password = passwordInput?.value || "";

  if (!email || !password) {
    if (loginMessage) loginMessage.textContent = "❌ Vui lòng nhập email và mật khẩu.";
    return;
  }

  if (loginBtn) {
    loginBtn.disabled = true;
    loginBtn.textContent = "⏳ ĐANG ĐĂNG NHẬP...";
  }

  try {
    const { data, error } = await db.auth.signInWithPassword({ email, password });
    if (error) {
      if (loginMessage) loginMessage.textContent = "❌ Đăng nhập thất bại: " + error.message;
      return;
    }

    const { data: userData } = await db.auth.getUser();
    const user = userData?.user;

    if (!user?.email_confirmed_at) {
      await db.auth.signOut();
      if (loginMessage) loginMessage.textContent = "❌ Email chưa được xác nhận trên hệ thống.";
      return;
    }

    if (!checkManagerPermission(user)) {
      await db.auth.signOut();
      showLogin();
      if (loginMessage) loginMessage.textContent = "❌ Tài khoản không có quyền truy cập.";
      return;
    }

    showManager();
    currentPage = 1;
    await loadData();
  } catch (err) {
    console.error("Lỗi login:", err);
    if (loginMessage) loginMessage.textContent = "❌ Đã xảy ra lỗi khi đăng nhập.";
  } finally {
    if (loginBtn) {
      loginBtn.disabled = false;
      loginBtn.textContent = "🔐 ĐĂNG NHẬP";
    }
  }
}

// =====================================================
// XỬ LÝ ĐĂNG XUẤT
// =====================================================
async function logout() {
  try {
    await db.auth.signOut();
  } catch (error) {
    console.error("Lỗi logout:", error);
  }

  allData = [];
  filteredData = [];
  currentPage = 1;

  if (tableBody) tableBody.innerHTML = "";
  if (pagination) pagination.innerHTML = "";
  if (totalReports) totalReports.textContent = "0";
  if (totalAmount) totalAmount.textContent = "0 đ";
  if (submittedUserCount) submittedUserCount.textContent = "0";

  if (passwordInput) passwordInput.value = "";
  if (managerMessage) managerMessage.textContent = "";

  closeMenu();
  showLogin();
}

// =====================================================
// TẢI DỮ LIỆU TỪ SUPABASE
// =====================================================
async function loadData() {
  if (managerMessage) managerMessage.textContent = "⏳ Đang tải dữ liệu...";

  const { data, error } = await db
    .from("bao_cao_ngay")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Lỗi loadData:", error);
    if (managerMessage) managerMessage.textContent = "❌ Lỗi tải dữ liệu: " + error.message;
    return;
  }

  allData = data || [];
  currentPage = 1;
  applyFilter();
  updateSubmittedUserCount();

  if (managerMessage) {
    managerMessage.textContent = `✅ Đã tải ${allData.length.toLocaleString("vi-VN")} dòng dữ liệu.`;
  }
}

// =====================================================
// LỌC DỮ LIỆU
// =====================================================
function applyFilter() {
  const userKeyword = (filterUser?.value || "").trim().toLowerCase();
  const dateKeyword = filterDate?.value || "";

  filteredData = allData.filter((row) => {
    const userName = String(row.user_name || "").toLowerCase();
    const reportDate = String(row.field_date || "").substring(0, 10);

    const matchUser = !userKeyword || userName.includes(userKeyword);
    const matchDate = !dateKeyword || reportDate === dateKeyword;

    return matchUser && matchDate;
  });

  const totalPages = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE));
  if (currentPage > totalPages) currentPage = totalPages;

  render();
}

// =====================================================
// HIỂN THỊ BẢNG & THỐNG KÊ
// =====================================================
function render() {
  const total = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (currentPage > totalPages) currentPage = totalPages;

  const start = (currentPage - 1) * PAGE_SIZE;
  const end = Math.min(start + PAGE_SIZE, total);
  const pageData = filteredData.slice(start, end);

  // Cập nhật thẻ thống kê
  if (totalReports) totalReports.textContent = total.toLocaleString("vi-VN");
  const amountTotal = filteredData.reduce((sum, row) => sum + getAmount(row), 0);
  if (totalAmount) totalAmount.textContent = formatMoney(amountTotal);

  if (!tableBody) return;
  tableBody.innerHTML = "";

  if (pageData.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 10;
    td.textContent = "Không có dữ liệu phù hợp.";
    td.style.textAlign = "center";
    td.style.padding = "25px";
    td.style.color = "#64748b";
    tr.appendChild(td);
    tableBody.appendChild(tr);
  } else {
    pageData.forEach((row) => {
      const tr = document.createElement("tr");

      addCell(tr, row.user_name);
      addCell(tr, formatDate(row.field_date));
      addCell(tr, row.cif);
      addCell(tr, row.customer_name);
      addCell(tr, row.result);
      addCell(tr, row.connection);
      addCell(tr, row.detail);
      addCell(tr, formatMoney(getAmount(row)));
      addCell(tr, row.next_action);

      // Thao tác
      const actionTd = document.createElement("td");

      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "edit-btn";
      editBtn.textContent = "✏️ Sửa";
      editBtn.addEventListener("click", () => editData(row.id));
      actionTd.appendChild(editBtn);

      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "delete-btn";
      deleteBtn.textContent = "🗑️ Xóa";
      deleteBtn.addEventListener("click", () => deleteData(row.id));
      actionTd.appendChild(deleteBtn);

      tr.appendChild(actionTd);
      tableBody.appendChild(tr);
    });
  }

  renderPagination(totalPages);
}

function addCell(tr, value) {
  const td = document.createElement("td");
  td.textContent = value ?? "";
  tr.appendChild(td);
}

// =====================================================
// HIỂN THỊ PHÂN TRANG
// =====================================================
function renderPagination(totalPages) {
  if (!pagination) return;
  pagination.innerHTML = "";

  if (totalPages <= 1) return;

  const wrapper = document.createElement("div");
  wrapper.style.display = "flex";
  wrapper.style.alignItems = "center";
  wrapper.style.gap = "5px";
  wrapper.style.flexWrap = "wrap";

  function createBtn(text, page, active = false, disabled = false) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = text;
    btn.disabled = disabled;
    btn.style.width = "36px";
    btn.style.height = "36px";
    btn.style.border = "1px solid #cbd5e1";
    btn.style.borderRadius = "7px";
    btn.style.background = active ? "#2563eb" : "#ffffff";
    btn.style.color = active ? "#ffffff" : "#334155";
    btn.style.fontWeight = active ? "bold" : "normal";
    btn.style.cursor = disabled ? "not-allowed" : "pointer";

    btn.addEventListener("click", () => {
      if (disabled) return;
      currentPage = page;
      render();
      document.querySelector(".table-wrap")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return btn;
  }

  // Nút Prev
  wrapper.appendChild(createBtn("‹", currentPage - 1, false, currentPage === 1));

  // Danh sách trang
  let pages = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 4) pages.push("...");

    let start = Math.max(2, currentPage - 1);
    let end = Math.min(totalPages - 1, currentPage + 1);

    if (currentPage <= 3) { start = 2; end = 4; }
    if (currentPage >= totalPages - 2) { start = totalPages - 3; end = totalPages - 1; }

    for (let i = start; i <= end; i++) pages.push(i);
    if (currentPage < totalPages - 3) pages.push("...");
    pages.push(totalPages);
  }

  pages.forEach((page) => {
    if (page === "...") {
      const dots = document.createElement("span");
      dots.textContent = "…";
      dots.style.padding = "0 3px";
      dots.style.color = "#64748b";
      wrapper.appendChild(dots);
    } else {
      wrapper.appendChild(createBtn(String(page), page, page === currentPage));
    }
  });

  // Nút Next
  wrapper.appendChild(createBtn("›", currentPage + 1, false, currentPage === totalPages));

  pagination.appendChild(wrapper);
}

// =====================================================
// THAO TÁC SỬA DỮ LIỆU
// =====================================================
async function editData(id) {
  const row = allData.find((x) => String(x.id) === String(id));
  if (!row) return alert("❌ Không tìm thấy báo cáo.");

  const currentAmount = getAmount(row);
  const newAmountStr = prompt("Nhập số tiền dự thu mới:", currentAmount);
  if (newAmountStr === null) return;

  const amount = Number(String(newAmountStr).replace(/,/g, "").trim());
  if (!Number.isFinite(amount)) return alert("❌ Số tiền không hợp lệ.");

  if (managerMessage) managerMessage.textContent = "⏳ Đang cập nhật...";

  const { error } = await db
    .from("bao_cao_ngay")
    .update({ expected_amount: amount })
    .eq("id", id);

  if (error) {
    console.error("Lỗi editData:", error);
    if (managerMessage) managerMessage.textContent = "❌ Cập nhật thất bại: " + error.message;
    return;
  }

  allData = allData.map((item) =>
    String(item.id) === String(id) ? { ...item, expected_amount: amount } : item
  );

  applyFilter();
  if (managerMessage) managerMessage.textContent = "✅ Đã cập nhật báo cáo.";
}

// =====================================================
// THAO TÁC XÓA DỮ LIỆU
// =====================================================
async function deleteData(id) {
  const row = allData.find((x) => String(x.id) === String(id));
  if (!row) return alert("❌ Không tìm thấy báo cáo.");

  if (!confirm(`Bạn có chắc muốn xóa báo cáo của KH: ${row.customer_name || ""}?`)) return;

  if (managerMessage) managerMessage.textContent = "⏳ Đang xóa dữ liệu...";

  const { error } = await db.from("bao_cao_ngay").delete().eq("id", id);

  if (error) {
    console.error("Lỗi deleteData:", error);
    if (managerMessage) managerMessage.textContent = "❌ Xóa thất bại: " + error.message;
    return;
  }

  allData = allData.filter((x) => String(x.id) !== String(id));
  applyFilter();
  updateSubmittedUserCount();

  if (managerMessage) managerMessage.textContent = "✅ Đã xóa báo cáo.";
}

// =====================================================
// DANH SÁCH CÁN BỘ ĐÃ GỬI BÁO CÁO
// =====================================================
function updateSubmittedUserCount() {
  if (!submittedUserCount) return;
  const users = new Set();
  allData.forEach((row) => {
    const name = String(row.user_name || "").trim();
    if (name) users.add(name);
  });
  submittedUserCount.textContent = users.size;
}

function showSubmittedUsers() {
  const users = new Map();
  allData.forEach((row) => {
    const name = String(row.user_name || "Không xác định").trim();
    if (name) users.set(name, (users.get(name) || 0) + 1);
  });

  if (users.size === 0) return alert("ℹ️ Chưa có cán bộ nào gửi báo cáo.");

  let message = `📋 DANH SÁCH CÁN BỘ ĐÃ GỬI BÁO CÁO (${users.size} người):\n\n`;
  let index = 1;
  users.forEach((count, name) => {
    message += `${index}. ${name}: ${count} báo cáo\n`;
    index++;
  });

  alert(message);
}

// =====================================================
// XUẤT BÁO CÁO EXCEL
// =====================================================
function exportExcel() {
  if (filteredData.length === 0) return alert("❌ Không có dữ liệu để xuất Excel.");

  if (typeof XLSX === "undefined") {
    return alert("❌ Thư viện XLSX (SheetJS) chưa được nạp. Vui lòng thêm thư viện vào trang HTML.");
  }

  const exportData = filteredData.map((row, index) => ({
    STT: index + 1,
    "Cán bộ": row.user_name || "",
    "Ngày thực địa": formatDate(row.field_date),
    CIF: row.cif || "",
    "Tên khách hàng": row.customer_name || "",
    "Kết quả": row.result || "",
    "Thông tin liên hệ": row.connection || "",
    "Chi tiết": row.detail || "",
    "Số tiền dự thu": getAmount(row),
    "Kế hoạch tiếp theo": row.next_action || "",
    "Thời gian tạo": formatDate(row.created_at)
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "BaoCaoNgay");

  const today = new Date().toISOString().substring(0, 10);
  XLSX.writeFile(workbook, `Bao_Cao_Ngay_${today}.xlsx`);
}

// =====================================================
// MENU CONTROL
// =====================================================
function openMenu() {
  sideMenu?.classList.add("active");
  sideMenuOverlay?.classList.add("active");
}

function closeMenu() {
  sideMenu?.classList.remove("active");
  sideMenuOverlay?.classList.remove("active");
}

function openPermission() {
  closeMenu();
  alert("ℹ️ Phân quyền được quản lý bằng User Metadata trên Supabase Dashboard (Ví dụ: {\"role\": \"manager\"}).");
}

// =====================================================
// HÀM BỔ TRỢ (HELPERS)
// =====================================================
function getAmount(row) {
  if (!row) return 0;
  const val = row.expected_amount ?? row.amount ?? row.so_tien ?? 0;
  const num = Number(val);
  return Number.isFinite(num) ? num : 0;
}

function formatMoney(amount) {
  return Number(amount || 0).toLocaleString("vi-VN") + " đ";
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

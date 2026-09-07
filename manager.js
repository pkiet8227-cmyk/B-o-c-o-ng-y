// =====================================================
// QUẢN LÝ BÁO CÁO NGÀY - MANAGER.JS
// Đăng nhập trực tiếp bằng Supabase Auth
// =====================================================

"use strict";

if (!window.supabase) {
  alert("❌ Không tải được thư viện Supabase.");
  throw new Error("Supabase library chưa được tải.");
}

const SUPABASE_URL_VALUE = typeof SUPABASE_URL !== "undefined" ? SUPABASE_URL : window.SUPABASE_URL;
const SUPABASE_KEY_VALUE = typeof SUPABASE_ANON_KEY !== "undefined" ? SUPABASE_ANON_KEY : window.SUPABASE_ANON_KEY;

if (!SUPABASE_URL_VALUE || !SUPABASE_KEY_VALUE) {
  alert("❌ Chưa cấu hình Supabase. Kiểm tra lại file config.js.");
  throw new Error("Thiếu SUPABASE_URL hoặc SUPABASE_ANON_KEY.");
}

const db = supabase.createClient(SUPABASE_URL_VALUE, SUPABASE_KEY_VALUE);

let allData = [];
let filteredData = [];
let currentPage = 1;
const PAGE_SIZE = 20;

const loginBox = document.getElementById("loginBox");
const managerBox = document.getElementById("managerBox");
const emailInput = document.getElementById("loginId") || document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const loginMessage = document.getElementById("loginMessage");
const managerMessage = document.getElementById("managerMessage");

const totalReports = document.getElementById("totalReports");
const totalAmount = document.getElementById("totalAmount");
const filterUser = document.getElementById("filterUser");
const filterDate = document.getElementById("filterDate");
const filterBtn = document.getElementById("filterBtn");
const refreshBtn = document.getElementById("refreshBtn");
const exportBtn = document.getElementById("exportBtn");
const tableBody = document.getElementById("tableBody");
const pagination = document.getElementById("pagination");

document.addEventListener("DOMContentLoaded", async () => {
  loginBtn?.addEventListener("click", login);
  passwordInput?.addEventListener("keydown", (e) => { if (e.key === "Enter") login(); });
  logoutBtn?.addEventListener("click", logout);

  filterBtn?.addEventListener("click", () => { currentPage = 1; applyFilter(); });
  filterDate?.addEventListener("change", () => { currentPage = 1; applyFilter(); });
  refreshBtn?.addEventListener("click", async () => { currentPage = 1; await loadData(); });
  exportBtn?.addEventListener("click", exportExcel);

  await checkSession();
});

async function checkSession() {
  try {
    const { data } = await db.auth.getSession();
    if (data?.session) {
      showManager();
      await loadData();
    } else {
      showLogin();
    }
  } catch (err) {
    showLogin();
  }
}

function showLogin() {
  if (loginBox) loginBox.style.display = "block";
  if (managerBox) managerBox.style.display = "none";
}

function showManager() {
  if (loginBox) loginBox.style.display = "none";
  if (managerBox) managerBox.style.display = "block";
  if (loginMessage) loginMessage.textContent = "";
}

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

    showManager();
    currentPage = 1;
    await loadData();
  } catch (err) {
    if (loginMessage) loginMessage.textContent = "❌ Lỗi đăng nhập.";
  } finally {
    if (loginBtn) {
      loginBtn.disabled = false;
      loginBtn.textContent = "🔐 ĐĂNG NHẬP";
    }
  }
}

async function logout() {
  await db.auth.signOut();
  allData = [];
  filteredData = [];
  showLogin();
}

async function loadData() {
  if (managerMessage) managerMessage.textContent = "⏳ Đang tải dữ liệu...";

  const { data, error } = await db.from("bao_cao_ngay").select("*").order("created_at", { ascending: false });

  if (error) {
    if (managerMessage) managerMessage.textContent = "❌ Lỗi tải dữ liệu: " + error.message;
    return;
  }

  allData = data || [];
  applyFilter();
  if (managerMessage) managerMessage.textContent = `✅ Đã tải ${allData.length} dòng dữThông báo **"❌ Tài khoản chưa được cấp quyền quản lý"** xuất hiện do tài khoản của bạn chưa được phân quyền truy cập hệ thống báo cáo này. 

Bạn có thể khắc phục bằng các cách sau:

* **Liên hệ Quản trị viên (Admin):** Yêu cầu cấp quyền báo cáo hoặc kiểm tra lại thông tin vai trò (role) cho tài khoản/email của bạn.
* **Kiểm tra loại tài khoản:** Xác nhận bạn đang sử dụng đúng email/tài khoản dành cho cấp quản lý thay vì tài khoản nhân viên thông thường.
* **Đăng xuất và đăng nhập lại:** Nếu vừa được cấp quyền, hãy đăng xuất tài khoản, xóa bộ nhớ đệm (cache) trình duyệt rồi tiến hành đăng nhập lại.

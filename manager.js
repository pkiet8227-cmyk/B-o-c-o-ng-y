// =====================================================
// QUẢN LÝ BÁO CÁO NGÀY - MANAGER.JS
// Phân trang 20 dòng / trang
// Đăng nhập Email + Mật khẩu
// Phân quyền bằng User Metadata trong Supabase
// Không ảnh hưởng app.js của cán bộ
// =====================================================
// ===============================
// KHỞI TẠO SUPABASE
// ===============================
if (!window.supabase) {
  alert("❌ Không tải được Supabase.");
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
  alert("❌ Chưa cấu hình Supabase. Kiểm tra config.js.");
  throw new Error("Thiếu SUPABASE_URL hoặc SUPABASE_ANON_KEY.");
}
const db = supabase.createClient(
  SUPABASE_URL_VALUE,
  SUPABASE_KEY_VALUE
);
// ===============================
// BIẾN
// ===============================
let allData = [];
let filteredData = [];
let currentPage = 1;
const PAGE_SIZE = 20;
// ===============================
// LẤY ELEMENT
// ===============================
const loginBox =
  document.getElementById("loginBox");
const managerBox =
  document.getElementById("managerBox");
// -----------------------------------------------------
// LOGIN
// -----------------------------------------------------
// Hỗ trợ HTML hiện tại dùng loginId.
// Nếu HTML cũ dùng email thì vẫn hoạt động.
const emailInput =
  document.getElementById("loginId") ||
  document.getElementById("email");
const passwordInput =
  document.getElementById("password");
const loginBtn =
  document.getElementById("loginBtn");
const logoutBtn =
  document.getElementById("logoutBtn");
const loginMessage =
  document.getElementById("loginMessage");
const managerMessage =
  document.getElementById("managerMessage");
// ===============================
// THỐNG KÊ
// ===============================
const totalReports =
  document.getElementById("totalReports");
const totalAmount =
  document.getElementById("totalAmount");
// ===============================
// BỘ LỌC
// ===============================
const filterUser =
  document.getElementById("filterUser");
const filterDate =
  document.getElementById("filterDate");
const filterBtn =
  document.getElementById("filterBtn");
const refreshBtn =
  document.getElementById("refreshBtn");
const exportBtn =
  document.getElementById("exportBtn");
// ===============================
// CÁN BỘ ĐÃ GỬI
// ===============================
const showSubmittedUsersBtn =
  document.getElementById(
    "showSubmittedUsersBtn"
  );
const submittedUserCount =
  document.getElementById(
    "submittedUserCount"
  );
// ===============================
// BẢNG
// ===============================
const tableBody =
  document.getElementById("tableBody");
const pagination =
  document.getElementById("pagination");
// ===============================
// MENU
// ===============================
const menuBtn =
  document.getElementById("menuBtn");
const sideMenu =
  document.getElementById("sideMenu");
const sideMenuOverlay =
  document.getElementById(
    "sideMenuOverlay"
  );
const sideMenuClose =
  document.getElementById(
    "sideMenuClose"
  );
const menuReportsBtn =
  document.getElementById(
    "menuReportsBtn"
  );
const menuPermissionBtn =
  document.getElementById(
    "menuPermissionBtn"
  );
const menuLogoutBtn =
  document.getElementById(
    "menuLogoutBtn"
  );
// ===============================
// KHỞI ĐỘNG
// ===============================
document.addEventListener(
  "DOMContentLoaded",
  async () => {
    // ---------------------------------------------------
    // NÚT ĐĂNG NHẬP
    // ---------------------------------------------------
    loginBtn?.addEventListener(
      "click",
      login
    );
    // ---------------------------------------------------
    // ENTER ĐỂ ĐĂNG NHẬP
    // ---------------------------------------------------
    passwordInput?.addEventListener(
      "keydown",
      (e) => {
        if (e.key === "Enter") {
          login();
        }
      }
    );
    // ---------------------------------------------------
    // ĐĂNG XUẤT
    // ---------------------------------------------------
    logoutBtn?.addEventListener(
      "click",
      logout
    );
    // ---------------------------------------------------
    // LỌC
    // ---------------------------------------------------
    filterBtn?.addEventListener(
      "click",
      () => {
        currentPage = 1;
        applyFilter();
      }
    );
    // ---------------------------------------------------
    // REFRESH
    // ---------------------------------------------------
    refreshBtn?.addEventListener(
      "click",
      async () => {
        currentPage = 1;
        await loadData();
      }
    );
    // ---------------------------------------------------
    // EXPORT
    // ---------------------------------------------------
    exportBtn?.addEventListener(
      "click",
      exportExcel
    );
    // ---------------------------------------------------
    // ENTER Ở Ô USER
    // ---------------------------------------------------
    filterUser?.addEventListener(
      "keydown",
      (e) => {
        if (e.key === "Enter") {
          currentPage = 1;
          applyFilter();
        }
      }
    );
    // ---------------------------------------------------
    // ĐỔI NGÀY
    // ---------------------------------------------------
    filterDate?.addEventListener(
      "change",
      () => {
        currentPage = 1;
        applyFilter();
      }
    );
    // ---------------------------------------------------
    // CÁN BỘ ĐÃ GỬI
    // ---------------------------------------------------
    showSubmittedUsersBtn?.addEventListener(
      "click",
      showSubmittedUsers
    );
    // ---------------------------------------------------
    // MENU
    // ---------------------------------------------------
    menuBtn?.addEventListener(
      "click",
      openMenu
    );
    sideMenuClose?.addEventListener(
      "click",
      closeMenu
    );
    sideMenuOverlay?.addEventListener(
      "click",
      closeMenu
    );
    menuReportsBtn?.addEventListener(
      "click",
      () => {
        closeMenu();
        loadData();
      }
    );
    menuPermissionBtn?.addEventListener(
      "click",
      openPermission
    );
    menuLogoutBtn?.addEventListener(
      "click",
      logout
    );
    // ===================================================
    // KIỂM TRA PHIÊN ĐĂNG NHẬP
    // ===================================================
    const {
      data,
      error
    } =
      await db.auth.getSession();
    if (error) {
      console.error(error);
      return;
    }
    if (data?.session) {
      const user =
        data.session.user;
      // -----------------------------------------------
      // KIỂM TRA QUYỀN
      // -----------------------------------------------
      const allowed =
        checkManagerPermission(
          user
        );
      if (!allowed) {
        await db.auth.signOut();
        loginBox.style.display =
          "block";
        managerBox.style.display =
          "none";
        loginMessage.textContent =
          "❌ Tài khoản chưa được cấp quyền quản lý.";
        return;
      }
      loginBox.style.display =
        "none";
      managerBox.style.display =
        "block";
      await loadData();
    } else {
      loginBox.style.display =
        "block";
      managerBox.style.display =
        "none";
    }
  }
);
// ===============================
// KIỂM TRA QUYỀN QUẢN LÝ
// ===============================
function checkManagerPermission(user) {
  if (!user) {
    return false;
  }
  // User Metadata
  const metadata =
    user.user_metadata || {};
  const role =
    String(
      metadata.role || ""
    )
    .trim()
    .toLowerCase();
  // manager hoặc admin được phép
  return (
    role === "manager" ||
    role === "admin"
  );
}
// ===============================
// ĐĂNG NHẬP
// ===============================
async function login() {
  const email =
    emailInput?.value
      ?.trim() || "";
  const password =
    passwordInput?.value || "";
  if (!email || !password) {
    loginMessage.textContent =
      "❌ Vui lòng nhập email và mật khẩu.";
    return;
  }
  // Kiểm tra email cơ bản
  if (!email.includes("@")) {
    loginMessage.textContent =
      "❌ Vui lòng nhập đúng địa chỉ email.";
    return;
  }
  loginBtn.disabled =
    true;
  loginBtn.textContent =
    "⏳ ĐANG ĐĂNG NHẬP...";
  loginMessage.textContent =
    "";
  try {
    // =================================================
    // SUPABASE AUTH
    // =================================================
    const {
      data,
      error
    } =
      await db.auth.signInWithPassword({
        email,
        password
      });
    if (error) {
      console.error(error);
      loginMessage.textContent =
        "❌ Đăng nhập thất bại: " +
        error.message;
      return;
    }
    if (!data?.session) {
      loginMessage.textContent =
        "❌ Không tạo được phiên đăng nhập.";
      return;
    }
    const user =
      data.user;
    // =================================================
    // KIỂM TRA EMAIL ĐÃ XÁC NHẬN
    // =================================================
    if (!user.email_confirmed_at) {
      await db.auth.signOut();
      loginMessage.textContent =
        "❌ Email chưa được xác nhận.";
      return;
    }
    // =================================================
    // KIỂM TRA PHÂN QUYỀN
    // =================================================
    const allowed =
      checkManagerPermission(
        user
      );
    if (!allowed) {
      await db.auth.signOut();
      loginMessage.textContent =
        "❌ Tài khoản chưa được cấp quyền quản lý.";
      return;
    }
    // =================================================
    // ĐĂNG NHẬP THÀNH CÔNG
    // =================================================
    loginMessage.textContent =
      "";
    loginBox.style.display =
      "none";
    managerBox.style.display =
      "block";
    currentPage = 1;
    await loadData();
  } catch (error) {
    console.error(error);
    loginMessage.textContent =
      "❌ Có lỗi xảy ra khi đăng nhập.";
  } finally {
    loginBtn.disabled =
      false;
    loginBtn.textContent =
      "🔐 ĐĂNG NHẬP";
  }
}
// ===============================
// ĐĂNG XUẤT
// ===============================
async function logout() {
  await db.auth.signOut();
  allData = [];
  filteredData = [];
  currentPage = 1;
  if (tableBody) {
    tableBody.innerHTML = "";
  }
  if (pagination) {
    pagination.innerHTML = "";
  }
  if (totalReports) {
    totalReports.textContent =
      "0";
  }
  if (totalAmount) {
    totalAmount.textContent =
      "0 đ";
  }
  if (submittedUserCount) {
    submittedUserCount.textContent =
      "0";
  }
  managerBox.style.display =
    "none";
  loginBox.style.display =
    "block";
  if (passwordInput) {
    passwordInput.value = "";
  }
  if (loginMessage) {
    loginMessage.textContent = "";
  }
  if (managerMessage) {
    managerMessage.textContent = "";
  }
  closeMenu();
}
// ===============================
// TẢI DỮ LIỆU
// ===============================
async function loadData() {
  managerMessage.textContent =
    "⏳ Đang tải dữ liệu...";
  const {
    data,
    error
  } =
    await db
      .from("bao_cao_ngay")
      .select("*")
      .order(
        "created_at",
        {
          ascending: false
        }
      );
  if (error) {
    console.error(error);
    managerMessage.textContent =
      "❌ Không tải được dữ liệu: " +
      error.message;
    return;
  }
  allData =
    data || [];
  currentPage = 1;
  applyFilter();
  updateSubmittedUserCount();
  managerMessage.textContent =
    `✅ Đã tải ${allData.length.toLocaleString("vi-VN")} dòng dữ liệu.`;
}
// ===============================
// LỌC DỮ LIỆU
// ===============================
function applyFilter() {
  const userKeyword =
    (
      filterUser?.value ||
      ""
    )
    .trim()
    .toLowerCase();
  const date =
    filterDate?.value ||
    "";
  filteredData =
    allData.filter(
      row => {
        const userName =
          String(
            row.user_name || ""
          )
          .toLowerCase();
        const reportDate =
          String(
            row.field_date || ""
          )
          .substring(
            0,
            10
          );
        const matchUser =
          !userKeyword ||
          userName.includes(
            userKeyword
          );
        const matchDate =
          !date ||
          reportDate === date;
        return (
          matchUser &&
          matchDate
        );
      }
    );
  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredData.length /
        PAGE_SIZE
      )
    );
  if (
    currentPage >
    totalPages
  ) {
    currentPage =
      totalPages;
  }
  render();
}
// ===============================
// HIỂN THỊ BẢNG
// ===============================
function render() {
  const total =
    filteredData.length;
  const totalPages =
    Math.max(
      1,
      Math.ceil(
        total /
        PAGE_SIZE
      )
    );
  if (
    currentPage >
    totalPages
  ) {
    currentPage =
      totalPages;
  }
  const start =
    (
      currentPage -
      1
    ) *
    PAGE_SIZE;
  const end =
    Math.min(
      start +
      PAGE_SIZE,
      total
    );
  const pageData =
    filteredData.slice(
      start,
      end
    );
  // =================================================
  // THỐNG KÊ
  // =================================================
  if (totalReports) {
    totalReports.textContent =
      total.toLocaleString(
        "vi-VN"
      );
  }
  const amountTotal =
    filteredData.reduce(
      (
        sum,
        row
      ) => {
        return (
          sum +
          getAmount(row)
        );
      },
      0
    );
  if (totalAmount) {
    totalAmount.textContent =
      formatMoney(
        amountTotal
      );
  }
  // =================================================
  // XÓA BẢNG CŨ
  // =================================================
  tableBody.innerHTML = "";
  // =================================================
  // KHÔNG CÓ DỮ LIỆU
  // =================================================
  if (
    pageData.length ===
    0
  ) {
    const tr =
      document.createElement(
        "tr"
      );
    const td =
      document.createElement(
        "td"
      );
    td.colSpan = 10;
    td.textContent =
      "Không có dữ liệu phù hợp.";
    td.style.textAlign =
      "center";
    td.style.padding =
      "25px";
    td.style.color =
      "#64748b";
    tr.appendChild(td);
    tableBody.appendChild(tr);
  } else {
    // =================================================
    // HIỂN THỊ TỪNG DÒNG
    // =================================================
    pageData.forEach(
      row => {
        const tr =
          document.createElement(
            "tr"
          );
        // -----------------------------
        // USER
        // -----------------------------
        addCell(
          tr,
          row.user_name
        );
        // -----------------------------
        // NGÀY
        // -----------------------------
        addCell(
          tr,
          formatDate(
            row.field_date
          )
        );
        // -----------------------------
        // CIF
        // -----------------------------
        addCell(
          tr,
          row.cif
        );
        // -----------------------------
        // KHÁCH HÀNG
        // -----------------------------
        addCell(
          tr,
          row.customer_name
        );
        // -----------------------------
        // KẾT QUẢ
        // -----------------------------
        addCell(
          tr,
          row.result
        );
        // -----------------------------
        // QUAN HỆ
        // -----------------------------
        addCell(
          tr,
          row.connection
        );
        // -----------------------------
        // CHI TIẾT
        // -----------------------------
        addCell(
          tr,
          row.detail
        );
        // -----------------------------
        // DỰ THU
        // -----------------------------
        addCell(
          tr,
          formatMoney(
            getAmount(row)
          )
        );
        // -----------------------------
        // HÀNH ĐỘNG TIẾP THEO
        // -----------------------------
        addCell(
          tr,
          row.next_action
        );
        // -----------------------------
        // THAO TÁC
        // -----------------------------
        const actionTd =
          document.createElement(
            "td"
          );
        // NÚT SỬA
        const editBtn =
          document.createElement(
            "button"
          );
        editBtn.type =
          "button";
        editBtn.className =
          "edit-btn";
        editBtn.textContent =
          "✏️ Sửa";
        editBtn.addEventListener(
          "click",
          () =>
            editData(row.id)
        );
        actionTd.appendChild(
          editBtn
        );
        // NÚT XÓA
        const deleteBtn =
          document.createElement(
            "button"
          );
        deleteBtn.type =
          "button";
        deleteBtn.className =
          "delete-btn";
        deleteBtn.textContent =
          "🗑️ Xóa";
        deleteBtn.addEventListener(
          "click",
          () =>
            deleteData(row.id)
        );
        actionTd.appendChild(
          deleteBtn
        );
        tr.appendChild(
          actionTd
        );
        tableBody.appendChild(
          tr
        );
      }
    );
  }
  // =================================================
  // PHÂN TRANG
  // =================================================
  renderPagination(
    totalPages
  );
}
// ===============================
// THÊM CELL
// ===============================
function addCell(
  tr,
  value
) {
  const td =
    document.createElement(
      "td"
    );
  td.textContent =
    value ?? "";
  tr.appendChild(td);
}
// ===============================
// PHÂN TRANG
// ===============================
function renderPagination(
  totalPages
) {
  pagination.innerHTML = "";
  if (
    totalPages <= 1
  ) {
    return;
  }
  const wrapper =
    document.createElement(
      "div"
    );
  wrapper.style.display =
    "flex";
  wrapper.style.alignItems =
    "center";
  wrapper.style.justifyContent =
    "flex-start";
  wrapper.style.gap =
    "5px";
  wrapper.style.flexWrap =
    "wrap";
  // =================================================
  // TẠO NÚT
  // =================================================
  function createPageButton(
    text,
    page,
    active = false,
    disabled = false
  ) {
    const btn =
      document.createElement(
        "button"
      );
    btn.type =
      "button";
    btn.textContent =
      text;
    btn.disabled =
      disabled;
    btn.style.width =
      "36px";
    btn.style.height =
      "36px";
    btn.style.padding =
      "0";
    btn.style.border =
      "1px solid #cbd5e1";
    btn.style.borderRadius =
      "7px";
    btn.style.background =
      active
        ? "#2563eb"
        : "#ffffff";
    btn.style.color =
      active
        ? "#ffffff"
        : "#334155";
    btn.style.fontWeight =
      active
        ? "bold"
        : "normal";
    btn.style.cursor =
      disabled
        ? "not-allowed"
        : "pointer";
    btn.style.fontSize =
      "14px";
    if (
      text === "‹" ||
      text === "›"
    ) {
      btn.style.fontSize =
        "20px";
      btn.style.fontWeight =
        "bold";
    }
    btn.addEventListener(
      "click",
      () => {
        if (disabled) {
          return;
        }
        currentPage =
          page;
        render();
        // Cuộn về bảng
        const table =
          document.querySelector(
            ".table-wrap"
          );
        if (table) {
          table.scrollIntoView({
            behavior:
              "smooth",
            block:
              "start"
          });
        }
      }
    );
    return btn;
  }
  // =================================================
  // TRANG TRƯỚC
  // =================================================
  wrapper.appendChild(
    createPageButton(
      "‹",
      currentPage - 1,
      false,
      currentPage === 1
    )
  );
  // =================================================
  // TÍNH TRANG
  // =================================================
  let pages = [];
  if (
    totalPages <= 7
  ) {
    for (
      let i = 1;
      i <= totalPages;
      i++
    ) {
      pages.push(i);
    }
  } else {
    pages.push(1);
    if (
      currentPage > 4
    ) {
      pages.push("...");
    }
    let start =
      Math.max(
        2,
        currentPage - 1
      );
    let end =
      Math.min(
        totalPages - 1,
        currentPage + 1
      );
    if (
      currentPage <= 3
    ) {
      start = 2;
      end = 4;
    }
    if (
      currentPage >=
      totalPages - 2
    ) {
      start =
        totalPages - 3;
      end =
        totalPages - 1;
    }
    for (
      let i = start;
      i <= end;
      i++
    ) {
      pages.push(i);
    }
    if (
      currentPage <
      totalPages - 3
    ) {
      pages.push("...");
    }
    pages.push(
      totalPages
    );
  }
  // =================================================
  // NÚT TRANG
  // =================================================
  pages.forEach(
    page => {
      if (
        page === "..."
      ) {
        const dots =
          document.createElement(
            "span"
          );
        dots.textContent =
          "…";
        dots.style.padding =
          "0 3px";
        dots.style.color =
          "#64748b";
        wrapper.appendChild(
          dots
        );
        return;
      }
      wrapper.appendChild(
        createPageButton(
          String(page),
          page,
          page === currentPage
        )
      );
    }
  );
  // =================================================
  // TRANG SAU
  // =================================================
  wrapper.appendChild(
    createPageButton(
      "›",
      currentPage + 1,
      false,
      currentPage === totalPages
    )
  );
  pagination.appendChild(
    wrapper
  );
}
// ===============================
// SỬA DỮ LIỆU
// ===============================
async function editData(id) {
  const row =
    allData.find(
      x =>
        String(x.id) ===
        String(id)
    );
  if (!row) {
    alert(
      "❌ Không tìm thấy báo cáo."
    );
    return;
  }
  // ---------------------------------------------------
  // Giá trị hiện tại
  // ---------------------------------------------------
  const currentAmount =
    getAmount(row);
  const newAmount =
    prompt(
      "Nhập số tiền dự thu mới:",
      currentAmount
    );
  if (
    newAmount === null
  ) {
    return;
  }
  const amount =
    Number(
      String(newAmount)
        .replace(/,/g, "")
        .trim()
    );
  if (
    !Number.isFinite(amount)
  ) {
    alert(
      "❌ Số tiền không hợp lệ."
    );
    return;
  }
  managerMessage.textContent =
    "⏳ Đang cập nhật...";
  const {
    error
  } =
    await db
      .from("bao_cao_ngay")
      .update({
        expected_amount:
          amount
      })
      .eq(
        "id",
        id
      );
  if (error) {
    console.error(error);
    managerMessage.textContent =
      "❌ Cập nhật thất bại: " +
      error.message;
    return;
  }
  // ---------------------------------------------------
  // Cập nhật local
  // ---------------------------------------------------
  allData =
    allData.map(
      item => {
        if (
          String(item.id) ===
          String(id)
        ) {
          return {
            ...item,
            expected_amount:
              amount
          };
        }
        return item;
      }
    );
  applyFilter();
  managerMessage.textContent =
    "✅ Đã cập nhật báo cáo.";
}
// ===============================
// XÓA DỮ LIỆU
// ===============================
async function deleteData(id) {
  const row =
    allData.find(
      x =>
        String(x.id) ===
        String(id)
    );
  if (!row) {
    alert(
      "❌ Không tìm thấy báo cáo."
    );
    return;
  }
  const customerName =
    row.customer_name ||
    "";
  const confirmed =
    confirm(
      `Bạn có chắc muốn xóa báo cáo của khách hàng:\n\n${customerName}\n\nKhông thể hoàn tác.`
    );
  if (!confirmed) {
    return;
  }
  managerMessage.textContent =
    "⏳ Đang xóa dữ liệu...";
  const {
    error
  } =
    await db
      .from("bao_cao_ngay")
      .delete()
      .eq(
        "id",
        id
      );
  if (error) {
    console.error(error);
    managerMessage.textContent =
      "❌ Xóa thất bại: " +
      error.message;
    return;
  }
  // ---------------------------------------------------
  // Xóa local
  // ---------------------------------------------------
  allData =
    allData.filter(
      x =>
        String(x.id) !==
        String(id)
    );
  const newTotal =
    getFilteredRows().length;
  const newTotalPages =
    Math.max(
      1,
      Math.ceil(
        newTotal /
        PAGE_SIZE
      )
    );
  if (
    currentPage >
    newTotalPages
  ) {
    currentPage =
      newTotalPages;
  }
  applyFilter();
  updateSubmittedUserCount();
  managerMessage.textContent =
    "✅ Đã xóa báo cáo.";
}
// ===============================
// LẤY DỮ LIỆU ĐANG LỌC
// ===============================
function getFilteredRows() {
  const userKeyword =
    (
      filterUser?.value ||
      ""
    )
    .trim()
    .toLowerCase();
  const date =
    filterDate?.value ||
    "";
  return allData.filter(
    row => {
      const userName =
        String(
          row.user_name ||
          ""
        )
        .toLowerCase();
      const reportDate =
        String(
          row.field_date ||
          ""
        )
        .substring(
          0,
          10
        );
      return (
        (
          !userKeyword ||
          userName.includes(
            userKeyword
          )
        ) &&
        (
          !date ||
          reportDate === date
        )
      );
    }
  );
}
// ===============================
// CÁN BỘ ĐÃ GỬI BÁO CÁO
// ===============================
function updateSubmittedUserCount() {
  if (!submittedUserCount) {
    return;
  }
  const users =
    new Set();
  allData.forEach(
    row => {
      const name =
        String(
          row.user_name ||
          ""
        ).trim();
      if (name) {
        users.add(
          name
        );
      }
    }
  );
  submittedUserCount.textContent =
    users.size;
}
// ===============================
// HIỂN THỊ DANH SÁCH CÁN BỘ
// ===============================
function showSubmittedUsers() {
  const users =
    new Map();
  allData.forEach(
    row => {
      const name =
        String(
          row.user_name ||
          "Không xác định"
        ).trim();
      if (
        !users.has(name)
      ) {
        users.set(
          name,
          0
        );
      }
      users.set(
        name,
        users.get(name) + 1
      );
    }
  );
  const list =
    Array.from(
      users.entries()
    )
    .sort(
      (a, b) =>
        b[1] - a[1]
    );
  if (!list.length) {
    alert(
      "Chưa có cán bộ nào gửi báo cáo."
    );
    return;
  }
  let message =
    "👥 CÁN BỘ ĐÃ GỬI BÁO CÁO\n\n";
  list.forEach(
    ([name, count], index) => {
      message +=
        `${index + 1}. ${name} — ${count} báo cáo\n`;
    }
  );
  alert(
    message
  );
}
// ===============================
// XUẤT EXCEL
// ===============================
function exportExcel() {
  const data =
    getFilteredRows();
  if (!data.length) {
    alert(
      "❌ Không có dữ liệu để xuất Excel."
    );
    return;
  }
  if (!window.XLSX) {
    alert(
      "❌ Chưa tải được thư viện Excel."
    );
    return;
  }
  const output =
    data.map(
      row => ({
        "Cán bộ":
          row.user_name ||
          "",
        "Ngày báo cáo":
          row.field_date ||
          "",
        "CIF":
          row.cif ||
          "",
        "Tên khách hàng":
          row.customer_name ||
          "",
        "Kết quả":
          row.result ||
          "",
        "Quan hệ":
          row.connection ||
          "",
        "Chi tiết":
          row.detail ||
          "",
        "Dự thu":
          getAmount(row),
        "Hành động tiếp theo":
          row.next_action ||
          "",
        "Thời gian nhập":
          row.created_at ||
          ""
      })
    );
  const worksheet =
    XLSX.utils.json_to_sheet(
      output
    );
  const workbook =
    XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "Báo cáo ngày"
  );
  XLSX.writeFile(
    workbook,
    "bao_cao_ngay.xlsx"
  );
  managerMessage.textContent =
    `✅ Đã xuất ${data.length.toLocaleString("vi-VN")} dòng ra Excel.`;
}
// ===============================
// LẤY SỐ TIỀN
// ===============================
function getAmount(row) {
  // Ưu tiên expected_amount
  if (
    row &&
    row.expected_amount !==
    null &&
    row.expected_amount !==
    undefined
  ) {
    const value =
      Number(
        row.expected_amount
      );
    if (
      Number.isFinite(value)
    ) {
      return value;
    }
  }
  // Hỗ trợ nếu database đang dùng amount
  if (
    row &&
    row.amount !==
    null &&
    row.amount !==
    undefined
  ) {
    const value =
      Number(
        row.amount
      );
    if (
      Number.isFinite(value)
    ) {
      return value;
    }
  }
  // Hỗ trợ du_thu
  if (
    row &&
    row.du_thu !==
    null &&
    row.du_thu !==
    undefined
  ) {
    const value =
      Number(
        row.du_thu
      );
    if (
      Number.isFinite(value)
    ) {
      return value;
    }
  }
  return 0;
}
// ===============================
// FORMAT TIỀN
// ===============================
function formatMoney(value) {
  return Number(
    value || 0
  )
  .toLocaleString(
    "vi-VN"
  ) + " đ";
}
// ===============================
// FORMAT NGÀY
// ===============================
function formatDate(value) {
  if (!value) {
    return "";
  }
  const text =
    String(value)
      .substring(
        0,
        10
      );
  const parts =
    text.split("-");
  if (
    parts.length === 3
  ) {
    return (
      parts[2] +
      "/" +
      parts[1] +
      "/" +
      parts[0]
    );
  }
  return value;
}
// ===============================
// MỞ MENU
// ===============================
function openMenu() {
  sideMenu?.classList.add(
    "active"
  );
  sideMenuOverlay?.classList.add(
    "active"
  );
}
// ===============================
// ĐÓNG MENU
// ===============================
function closeMenu() {
  sideMenu?.classList.remove(
    "active"
  );
  sideMenuOverlay?.classList.remove(
    "active"
  );
}
// ===============================
// PHÂN QUYỀN
// ===============================
function openPermission() {
  closeMenu();
  alert(
`🔐 CẤP QUYỀN QUẢN LÝ
Vào:
Supabase
→ Authentication
→ Users
→ Chọn tài khoản
→ User Metadata
Đặt:
{
  "role": "manager"
}
Hoặc:
{
  "role": "admin"
}
Sau khi lưu, tài khoản đó có thể
đăng nhập trang quản lý.
Không cần chạy SQL để cấp quyền.`
  );
}




// ============================================================
// MANAGER.JS
// QUẢN LÝ BÁO CÁO NGÀY
// BẢN HOÀN CHỈNH
// ============================================================

(() => {
  "use strict";

  // ==========================================================
  // SUPABASE
  // ==========================================================

  const SUPABASE_URL_VALUE =
    typeof SUPABASE_URL !== "undefined"
      ? SUPABASE_URL
      : window.SUPABASE_URL;

  const SUPABASE_KEY_VALUE =
    typeof SUPABASE_ANON_KEY !== "undefined"
      ? SUPABASE_ANON_KEY
      : window.SUPABASE_ANON_KEY;

  if (!SUPABASE_URL_VALUE || !SUPABASE_KEY_VALUE) {
    alert("❌ Chưa cấu hình Supabase trong config.js.");
    return;
  }

  const db = supabase.createClient(
    SUPABASE_URL_VALUE,
    SUPABASE_KEY_VALUE
  );

  // ==========================================================
  // BIẾN
  // ==========================================================

  let allData = [];
  let filteredData = [];
  let currentPage = 1;

  const PAGE_SIZE = 20;

  // ==========================================================
  // DOM
  // ==========================================================

  const loginBox =
    document.getElementById("loginBox");

  const managerBox =
    document.getElementById("managerBox");

  const emailInput =
    document.getElementById("loginId");

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

  const totalReports =
    document.getElementById("totalReports");

  const totalAmount =
    document.getElementById("totalAmount");

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

  const tableBody =
    document.getElementById("tableBody");

  const pagination =
    document.getElementById("pagination");

  const menuBtn =
    document.getElementById("menuBtn");

  const sideMenu =
    document.getElementById("sideMenu");

  const sideMenuOverlay =
    document.getElementById("sideMenuOverlay");

  const sideMenuClose =
    document.getElementById("sideMenuClose");

  const menuReportsBtn =
    document.getElementById("menuReportsBtn");

  const menuLogoutBtn =
    document.getElementById("menuLogoutBtn");

  const showSubmittedUsersBtn =
    document.getElementById("showSubmittedUsersBtn");

  const submittedUserCount =
    document.getElementById("submittedUserCount");

  // ==========================================================
  // KHỞI ĐỘNG
  // ==========================================================

  document.addEventListener("DOMContentLoaded", async () => {

    // Login
    loginBtn?.addEventListener("click", login);

    passwordInput?.addEventListener(
      "keydown",
      (e) => {
        if (e.key === "Enter") {
          login();
        }
      }
    );

    emailInput?.addEventListener(
      "keydown",
      (e) => {
        if (e.key === "Enter") {
          login();
        }
      }
    );

    // Logout
    logoutBtn?.addEventListener("click", logout);
    menuLogoutBtn?.addEventListener("click", logout);

    // Filter
    filterBtn?.addEventListener(
      "click",
      () => {
        currentPage = 1;
        applyFilter();
      }
    );

    filterDate?.addEventListener(
      "change",
      () => {
        currentPage = 1;
        applyFilter();
      }
    );

    filterUser?.addEventListener(
      "keydown",
      (e) => {
        if (e.key === "Enter") {
          currentPage = 1;
          applyFilter();
        }
      }
    );

    // Refresh
    refreshBtn?.addEventListener(
      "click",
      async () => {
        currentPage = 1;
        await loadData();
      }
    );

    // Excel
    exportBtn?.addEventListener(
      "click",
      exportExcel
    );

    // Menu
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

        if (managerBox) {
          managerBox.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
        }
      }
    );

    // Cán bộ đã nhập
    showSubmittedUsersBtn?.addEventListener(
      "click",
      showSubmittedUsers
    );

    // Hiện nút menu
    if (menuBtn) {
      menuBtn.style.display = "block";
    }

    // Kiểm tra session
    await checkSession();
  });

  // ==========================================================
  // KIỂM TRA SESSION
  // ==========================================================

  async function checkSession() {

    try {

      const {
        data,
        error
      } = await db.auth.getSession();

      if (error) {
        showLogin();
        return;
      }

      if (data?.session) {

        showManager();

        await loadData();

      } else {

        showLogin();

      }

    } catch (error) {

      console.error(
        "checkSession:",
        error
      );

      showLogin();
    }
  }

  // ==========================================================
  // HIỆN LOGIN
  // ==========================================================

  function showLogin() {

    if (loginBox) {
      loginBox.style.display = "block";
    }

    if (managerBox) {
      managerBox.style.display = "none";
    }
  }

  // ==========================================================
  // HIỆN MANAGER
  // ==========================================================

  function showManager() {

    if (loginBox) {
      loginBox.style.display = "none";
    }

    if (managerBox) {
      managerBox.style.display = "block";
    }

    if (loginMessage) {
      loginMessage.textContent = "";
    }
  }

  // ==========================================================
  // ĐĂNG NHẬP
  // ==========================================================

  async function login() {

    const email =
      emailInput?.value?.trim() || "";

    const password =
      passwordInput?.value || "";

    if (!email || !password) {

      if (loginMessage) {
        loginMessage.textContent =
          "❌ Vui lòng nhập Gmail và mật khẩu.";
      }

      return;
    }

    if (loginBtn) {

      loginBtn.disabled = true;

      loginBtn.textContent =
        "⏳ ĐANG ĐĂNG NHẬP...";
    }

    if (loginMessage) {
      loginMessage.textContent =
        "⏳ Đang kiểm tra tài khoản...";
    }

    try {

      const {
        data,
        error
      } = await db.auth.signInWithPassword({
        email: email,
        password: password
      });

      if (error) {

        console.error(
          "Supabase login error:",
          error
        );

        if (loginMessage) {
          loginMessage.textContent =
            "❌ Đăng nhập thất bại: " +
            error.message;
        }

        return;
      }

      if (!data?.session) {

        if (loginMessage) {
          loginMessage.textContent =
            "❌ Không tạo được phiên đăng nhập.";
        }

        return;
      }

      // Đăng nhập thành công
      showManager();

      currentPage = 1;

      await loadData();

    } catch (error) {

      console.error(
        "Login error:",
        error
      );

      if (loginMessage) {
        loginMessage.textContent =
          "❌ Lỗi hệ thống khi đăng nhập.";
      }

    } finally {

      if (loginBtn) {

        loginBtn.disabled = false;

        loginBtn.textContent =
          "🔐 ĐĂNG NHẬP";
      }
    }
  }

  // ==========================================================
  // ĐĂNG XUẤT
  // ==========================================================

  async function logout() {

    try {

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
        totalReports.textContent = "0";
      }

      if (totalAmount) {
        totalAmount.textContent = "0 đ";
      }

      closeMenu();

      showLogin();

    } catch (error) {

      console.error(
        "Logout:",
        error
      );
    }
  }

  // ==========================================================
  // TẢI DỮ LIỆU
  // ==========================================================

  async function loadData() {

    if (managerMessage) {
      managerMessage.textContent =
        "⏳ Đang tải dữ liệu...";
    }

    try {

      const {
        data,
        error
      } = await db
        .from("bao_cao_ngay")
        .select("*")
        .order(
          "created_at",
          {
            ascending: false
          }
        );

      if (error) {

        console.error(
          "Load data error:",
          error
        );

        if (managerMessage) {
          managerMessage.textContent =
            "❌ Lỗi tải dữ liệu: " +
            error.message;
        }

        return;
      }

      allData = Array.isArray(data)
        ? data
        : [];

      currentPage = 1;

      applyFilter();

      if (managerMessage) {
        managerMessage.textContent =
          `✅ Đã tải ${allData.length} báo cáo.`;
      }

    } catch (error) {

      console.error(
        "loadData:",
        error
      );

      if (managerMessage) {
        managerMessage.textContent =
          "❌ Không thể tải dữ liệu.";
      }
    }
  }

  // ==========================================================
  // LỌC
  // ==========================================================

  function applyFilter() {

    const userKeyword =
      (filterUser?.value || "")
        .trim()
        .toLowerCase();

    const dateKeyword =
      filterDate?.value || "";

    filteredData =
      allData.filter((row) => {

        const userName =
          String(
            row.user_name || ""
          ).toLowerCase();

        const reportDate =
          String(
            row.field_date || ""
          ).substring(0, 10);

        const matchUser =
          !userKeyword ||
          userName.includes(userKeyword);

        const matchDate =
          !dateKeyword ||
          reportDate === dateKeyword;

        return matchUser && matchDate;
      });

    updateSubmittedUserCount();

    render();
  }

  // ==========================================================
  // ĐẾM CÁN BỘ
  // ==========================================================

  function updateSubmittedUserCount() {

    const users =
      new Set();

    filteredData.forEach(
      (row) => {

        const name =
          String(
            row.user_name || ""
          ).trim();

        if (name) {
          users.add(name);
        }
      }
    );

    if (submittedUserCount) {
      submittedUserCount.textContent =
        users.size;
    }
  }

  // ==========================================================
  // RENDER TABLE
  // ==========================================================

  function render() {

    if (totalReports) {
      totalReports.textContent =
        filteredData.length;
    }

    const total =
      filteredData.reduce(
        (sum, row) => {

          const amount =
            Number(
              row.expected_amount
            ) || 0;

          return sum + amount;

        },
        0
      );

    if (totalAmount) {
      totalAmount.textContent =
        total.toLocaleString("vi-VN") +
        " đ";
    }

    if (!tableBody) {
      return;
    }

    tableBody.innerHTML = "";

    if (filteredData.length === 0) {

      tableBody.innerHTML = `
        <tr>
          <td colspan="10"
              style="
                text-align:center;
                padding:25px;
                font-weight:bold;
              ">
            Không tìm thấy dữ liệu.
          </td>
        </tr>
      `;

      if (pagination) {
        pagination.innerHTML = "";
      }

      return;
    }

    const totalPages =
      Math.ceil(
        filteredData.length /
        PAGE_SIZE
      );

    if (currentPage > totalPages) {
      currentPage = totalPages;
    }

    const start =
      (currentPage - 1) *
      PAGE_SIZE;

    const end =
      start + PAGE_SIZE;

    const pageItems =
      filteredData.slice(
        start,
        end
      );

    pageItems.forEach(
      (row) => {

        const tr =
          document.createElement("tr");

        tr.innerHTML = `
          <td>${escapeHtml(row.user_name)}</td>

          <td>${escapeHtml(
            formatDate(row.field_date)
          )}</td>

          <td>${escapeHtml(row.cif)}</td>

          <td>${escapeHtml(
            row.customer_name
          )}</td>

          <td>${escapeHtml(
            row.result
          )}</td>

          <td>${escapeHtml(
            row.connection
          )}</td>

          <td style="
            white-space:normal;
            min-width:220px;
          ">
            ${escapeHtml(row.detail)}
          </td>

          <td>
            ${(
              Number(
                row.expected_amount
              ) || 0
            ).toLocaleString("vi-VN")} đ
          </td>

          <td style="
            white-space:normal;
            min-width:220px;
          ">
            ${escapeHtml(
              row.next_action
            )}
          </td>

          <td>
            <button
              class="edit-btn"
              type="button"
              data-action="edit"
              data-id="${escapeHtml(row.id)}"
            >
              ✏️ Sửa
            </button>

            <button
              class="delete-btn"
              type="button"
              data-action="delete"
              data-id="${escapeHtml(row.id)}"
            >
              🗑️ Xóa
            </button>
          </td>
        `;

        tableBody.appendChild(tr);
      }
    );

    // Gắn nút sửa/xóa
    tableBody
      .querySelectorAll(
        '[data-action="edit"]'
      )
      .forEach((btn) => {

        btn.addEventListener(
          "click",
          () => {

            const id =
              btn.dataset.id;

            editReport(id);
          }
        );
      });

    tableBody
      .querySelectorAll(
        '[data-action="delete"]'
      )
      .forEach((btn) => {

        btn.addEventListener(
          "click",
          () => {

            const id =
              btn.dataset.id;

            deleteReport(id);
          }
        );
      });

    renderPagination();
  }

  // ==========================================================
  // PHÂN TRANG
  // ==========================================================

  function renderPagination() {

    if (!pagination) {
      return;
    }

    pagination.innerHTML = "";

    const totalPages =
      Math.ceil(
        filteredData.length /
        PAGE_SIZE
      );

    if (totalPages <= 1) {
      return;
    }

    // Nút trước
    const prev =
      document.createElement("button");

    prev.textContent = "‹";
    prev.disabled =
      currentPage === 1;

    prev.addEventListener(
      "click",
      () => {

        if (currentPage > 1) {

          currentPage--;

          render();

          window.scrollTo({
            top: 0,
            behavior: "smooth"
          });
        }
      }
    );

    pagination.appendChild(prev);

    // Hiển thị trang
    let startPage =
      Math.max(
        1,
        currentPage - 2
      );

    let endPage =
      Math.min(
        totalPages,
        currentPage + 2
      );

    if (currentPage <= 3) {
      startPage = 1;
      endPage =
        Math.min(
          totalPages,
          5
        );
    }

    if (currentPage >= totalPages - 2) {
      startPage =
        Math.max(
          1,
          totalPages - 4
        );

      endPage = totalPages;
    }

    // Trang đầu + ...
    if (startPage > 1) {

      addPageButton(1);

      if (startPage > 2) {

        const dots =
          document.createElement("span");

        dots.textContent = "...";

        dots.style.padding =
          "0 5px";

        pagination.appendChild(dots);
      }
    }

    for (
      let i = startPage;
      i <= endPage;
      i++
    ) {

      addPageButton(i);
    }

    // ... + trang cuối
    if (endPage < totalPages) {

      if (endPage < totalPages - 1) {

        const dots =
          document.createElement("span");

        dots.textContent = "...";

        dots.style.padding =
          "0 5px";

        pagination.appendChild(dots);
      }

      addPageButton(totalPages);
    }

    // Nút sau
    const next =
      document.createElement("button");

    next.textContent = "›";

    next.disabled =
      currentPage === totalPages;

    next.addEventListener(
      "click",
      () => {

        if (
          currentPage <
          totalPages
        ) {

          currentPage++;

          render();

          window.scrollTo({
            top: 0,
            behavior: "smooth"
          });
        }
      }
    );

    pagination.appendChild(next);

    function addPageButton(page) {

      const btn =
        document.createElement("button");

      btn.textContent = page;

      if (page === currentPage) {
        btn.classList.add("active");
      }

      btn.addEventListener(
        "click",
        () => {

          currentPage = page;

          render();

          window.scrollTo({
            top: 0,
            behavior: "smooth"
          });
        }
      );

      pagination.appendChild(btn);
    }
  }

  // ==========================================================
  // SỬA BÁO CÁO
  // ==========================================================

  async function editReport(id) {

    const row =
      allData.find(
        (item) =>
          String(item.id) ===
          String(id)
      );

    if (!row) {

      alert(
        "❌ Không tìm thấy báo cáo."
      );

      return;
    }

    createEditModal(row);
  }

  // ==========================================================
  // TẠO MODAL SỬA
  // ==========================================================

  function createEditModal(row) {

    removeEditModal();

    const overlay =
      document.createElement("div");

    overlay.id =
      "editReportModal";

    overlay.style.cssText = `
      position:fixed;
      inset:0;
      background:rgba(0,0,0,.6);
      z-index:100000;
      display:flex;
      justify-content:center;
      align-items:center;
      padding:15px;
    `;

    const modal =
      document.createElement("div");

    modal.style.cssText = `
      width:100%;
      max-width:600px;
      max-height:90vh;
      overflow-y:auto;
      background:white;
      border-radius:18px;
      padding:20px;
      box-shadow:0 20px 60px rgba(0,0,0,.35);
    `;

    modal.innerHTML = `
      <h2 style="
        margin-top:0;
        margin-bottom:18px;
      ">
        ✏️ SỬA BÁO CÁO
      </h2>

      <div style="display:grid;gap:12px;">

        <label>
          <b>Cán bộ</b>
          <input
            id="editUserName"
            type="text"
            value="${escapeAttr(row.user_name)}"
            style="width:100%;box-sizing:border-box;padding:11px;margin-top:5px;"
          >
        </label>

        <label>
          <b>Ngày field</b>
          <input
            id="editFieldDate"
            type="date"
            value="${escapeAttr(formatDate(row.field_date))}"
            style="width:100%;box-sizing:border-box;padding:11px;margin-top:5px;"
          >
        </label>

        <label>
          <b>Số CIF</b>
          <input
            id="editCif"
            type="text"
            value="${escapeAttr(row.cif)}"
            style="width:100%;box-sizing:border-box;padding:11px;margin-top:5px;"
          >
        </label>

        <label>
          <b>Tên khách hàng</b>
          <input
            id="editCustomerName"
            type="text"
            value="${escapeAttr(row.customer_name)}"
            style="width:100%;box-sizing:border-box;padding:11px;margin-top:5px;"
          >
        </label>

        <label>
          <b>Kết quả</b>
          <select
            id="editResult"
            style="width:100%;box-sizing:border-box;padding:11px;margin-top:5px;"
          >
            <option value="Sống">Sống</option>
            <option value="Chết">Chết</option>
          </select>
        </label>

        <label>
          <b>Kết nối</b>
          <input
            id="editConnection"
            type="text"
            value="${escapeAttr(row.connection)}"
            style="width:100%;box-sizing:border-box;padding:11px;margin-top:5px;"
          >
        </label>

        <label>
          <b>Kết quả chi tiết</b>
          <textarea
            id="editDetail"
            rows="4"
            style="width:100%;box-sizing:border-box;padding:11px;margin-top:5px;"
          >${escapeHtml(row.detail)}</textarea>
        </label>

        <label>
          <b>Dự thu</b>
          <input
            id="editExpectedAmount"
            type="number"
            value="${escapeAttr(row.expected_amount)}"
            style="width:100%;box-sizing:border-box;padding:11px;margin-top:5px;"
          >
        </label>

        <label>
          <b>Hướng tác động tiếp theo</b>
          <textarea
            id="editNextAction"
            rows="4"
            style="width:100%;box-sizing:border-box;padding:11px;margin-top:5px;"
          >${escapeHtml(row.next_action)}</textarea>
        </label>

      </div>

      <div style="
        display:flex;
        gap:10px;
        margin-top:20px;
      ">

        <button
          id="cancelEditBtn"
          type="button"
          style="
            flex:1;
            padding:13px;
            border:0;
            border-radius:10px;
            background:#64748b;
            color:white;
            font-weight:800;
          "
        >
          HỦY
        </button>

        <button
          id="saveEditBtn"
          type="button"
          style="
            flex:1;
            padding:13px;
            border:0;
            border-radius:10px;
            background:#2563eb;
            color:white;
            font-weight:800;
          "
        >
          💾 LƯU THAY ĐỔI
        </button>

      </div>

      <div
        id="editMessage"
        style="
          text-align:center;
          margin-top:12px;
          font-weight:bold;
        "
      ></div>
    `;

    overlay.appendChild(modal);

    document.body.appendChild(overlay);

    // Set selected result
    const resultSelect =
      document.getElementById(
        "editResult"
      );

    if (resultSelect) {

      resultSelect.value =
        row.result || "Sống";
    }

    document
      .getElementById(
        "cancelEditBtn"
      )
      ?.addEventListener(
        "click",
        removeEditModal
      );

    document
      .getElementById(
        "saveEditBtn"
      )
      ?.addEventListener(
        "click",
        () => saveEditReport(row.id)
      );

    overlay.addEventListener(
      "click",
      (e) => {

        if (e.target === overlay) {
          removeEditModal();
        }
      }
    );
  }

  // ==========================================================
  // LƯU SỬA
  // ==========================================================

  async function saveEditReport(id) {

    const saveBtn =
      document.getElementById(
        "saveEditBtn"
      );

    const editMessage =
      document.getElementById(
        "editMessage"
      );

    const user_name =
      document.getElementById(
        "editUserName"
      )?.value.trim() || "";

    const field_date =
      document.getElementById(
        "editFieldDate"
      )?.value || null;

    const cif =
      document.getElementById(
        "editCif"
      )?.value.trim() || "";

    const customer_name =
      document.getElementById(
        "editCustomerName"
      )?.value.trim() || "";

    const result =
      document.getElementById(
        "editResult"
      )?.value || "";

    const connection =
      document.getElementById(
        "editConnection"
      )?.value.trim() || "";

    const detail =
      document.getElementById(
        "editDetail"
      )?.value.trim() || "";

    const expected_amount =
      Number(
        document.getElementById(
          "editExpectedAmount"
        )?.value
      ) || 0;

    const next_action =
      document.getElementById(
        "editNextAction"
      )?.value.trim() || "";

    if (!user_name) {

      if (editMessage) {
        editMessage.textContent =
          "❌ Vui lòng nhập tên cán bộ.";
      }

      return;
    }

    if (!cif) {

      if (editMessage) {
        editMessage.textContent =
          "❌ Vui lòng nhập số CIF.";
      }

      return;
    }

    if (saveBtn) {

      saveBtn.disabled = true;

      saveBtn.textContent =
        "⏳ ĐANG LƯU...";
    }

    if (editMessage) {
      editMessage.textContent =
        "⏳ Đang cập nhật...";
    }

    try {

      const {
        error
      } = await db
        .from("bao_cao_ngay")
        .update({
          user_name,
          field_date,
          cif,
          customer_name,
          result,
          connection,
          detail,
          expected_amount,
          next_action
        })
        .eq("id", id);

      if (error) {

        console.error(
          "Update error:",
          error
        );

        if (editMessage) {
          editMessage.textContent =
            "❌ Lỗi cập nhật: " +
            error.message;
        }

        return;
      }

      removeEditModal();

      await loadData();

      if (managerMessage) {
        managerMessage.textContent =
          "✅ Đã sửa báo cáo thành công.";
      }

    } catch (error) {

      console.error(
        "saveEditReport:",
        error
      );

      if (editMessage) {
        editMessage.textContent =
          "❌ Không thể cập nhật báo cáo.";
      }

    } finally {

      if (saveBtn) {

        saveBtn.disabled = false;

        saveBtn.textContent =
          "💾 LƯU THAY ĐỔI";
      }
    }
  }

  // ==========================================================
  // XÓA BÁO CÁO
  // ==========================================================

  async function deleteReport(id) {

    const row =
      allData.find(
        (item) =>
          String(item.id) ===
          String(id)
      );

    if (!row) {

      alert(
        "❌ Không tìm thấy báo cáo."
      );

      return;
    }

    const customer =
      row.customer_name ||
      row.cif ||
      "báo cáo này";

    const confirmed =
      confirm(
        `⚠️ Bạn có chắc muốn xóa báo cáo của "${customer}"?\n\nHành động này không thể hoàn tác.`
      );

    if (!confirmed) {
      return;
    }

    if (managerMessage) {
      managerMessage.textContent =
        "⏳ Đang xóa báo cáo...";
    }

    try {

      const {
        error
      } = await db
        .from("bao_cao_ngay")
        .delete()
        .eq("id", id);

      if (error) {

        console.error(
          "Delete error:",
          error
        );

        if (managerMessage) {
          managerMessage.textContent =
            "❌ Không thể xóa: " +
            error.message;
        }

        return;
      }

      await loadData();

      if (managerMessage) {
        managerMessage.textContent =
          "✅ Đã xóa báo cáo thành công.";
      }

    } catch (error) {

      console.error(
        "deleteReport:",
        error
      );

      if (managerMessage) {
        managerMessage.textContent =
          "❌ Lỗi khi xóa báo cáo.";
      }
    }
  }

  // ==========================================================
  // CÁN BỘ ĐÃ NHẬP BÁO CÁO
  // ==========================================================

  function showSubmittedUsers() {

    removeSubmittedUserModal();

    const usersMap =
      new Map();

    filteredData.forEach(
      (row) => {

        const name =
          String(
            row.user_name || ""
          ).trim();

        if (!name) {
          return;
        }

        if (!usersMap.has(name)) {
          usersMap.set(name, 0);
        }

        usersMap.set(
          name,
          usersMap.get(name) + 1
        );
      }
    );

    const users =
      Array.from(
        usersMap.entries()
      ).sort(
        (a, b) =>
          a[0].localeCompare(
            b[0],
            "vi"
          )
      );

    const overlay =
      document.createElement("div");

    overlay.id =
      "submittedUserModal";

    overlay.className =
      "user-modal-overlay";

    const modal =
      document.createElement("div");

    modal.className =
      "user-modal";

    modal.innerHTML = `
      <div class="user-modal-header">
        <h2>
          👥 CÁN BỘ ĐÃ NHẬP BÁO CÁO
          <br>
          <span style="
            color:#2563eb;
            font-size:16px;
          ">
            ${users.length} cán bộ
          </span>
        </h2>

        <button
          class="user-modal-close"
          id="closeSubmittedUsers"
          type="button"
        >
          ×
        </button>
      </div>

      <div class="user-modal-body">

        ${
          users.length === 0
            ? `
              <div style="
                text-align:center;
                padding:30px 10px;
                color:#64748b;
                font-weight:bold;
              ">
                Chưa có cán bộ nào nhập báo cáo.
              </div>
            `
            : users
                .map(
                  ([name, count], index) => `
                    <div
                      class="submitted-user-item"
                      data-user="${escapeAttr(name)}"
                      style="cursor:pointer;"
                    >
                      <div class="submitted-user-number">
                        ${index + 1}
                      </div>

                      <div style="flex:1;">
                        <div>
                          ${escapeHtml(name)}
                        </div>

                        <div style="
                          font-size:13px;
                          color:#64748b;
                          margin-top:3px;
                        ">
                          ${count} báo cáo
                        </div>
                      </div>

                      <div style="
                        font-size:20px;
                      ">
                        ›
                      </div>
                    </div>
                  `
                )
                .join("")
        }

      </div>
    `;

    overlay.appendChild(modal);

    document.body.appendChild(overlay);

    document
      .getElementById(
        "closeSubmittedUsers"
      )
      ?.addEventListener(
        "click",
        removeSubmittedUserModal
      );

    overlay.addEventListener(
      "click",
      (e) => {

        if (e.target === overlay) {
          removeSubmittedUserModal();
        }
      }
    );

    // Bấm vào cán bộ -> tự lọc dữ liệu của cán bộ đó
    modal
      .querySelectorAll(
        ".submitted-user-item"
      )
      .forEach(
        (item) => {

          item.addEventListener(
            "click",
            () => {

              const user =
                item.dataset.user || "";

              if (filterUser) {
                filterUser.value =
                  user;
              }

              currentPage = 1;

              applyFilter();

              removeSubmittedUserModal();

              if (tableBody) {
                tableBody.scrollIntoView({
                  behavior: "smooth",
                  block: "start"
                });
              }
            }
          );
        }
      );
  }

  function removeSubmittedUserModal() {

    document
      .getElementById(
        "submittedUserModal"
      )
      ?.remove();
  }

  // ==========================================================
  // MENU
  // ==========================================================

  function openMenu() {

    if (sideMenuOverlay) {
      sideMenuOverlay.classList.add("open");
    }

    if (sideMenu) {
      sideMenu.classList.add("open");
    }
  }

  function closeMenu() {

    if (sideMenuOverlay) {
      sideMenuOverlay.classList.remove("open");
    }

    if (sideMenu) {
      sideMenu.classList.remove("open");
    }
  }

  // ==========================================================
  // XUẤT EXCEL
  // ==========================================================

  function exportExcel() {

    if (
      typeof XLSX ===
      "undefined"
    ) {

      alert(
        "❌ Chưa tải được thư viện Excel."
      );

      return;
    }

    if (
      !filteredData ||
      filteredData.length === 0
    ) {

      alert(
        "⚠️ Không có dữ liệu để xuất Excel."
      );

      return;
    }

    const exportData =
      filteredData.map(
        (row, index) => ({
          "STT":
            index + 1,

          "Cán bộ":
            row.user_name || "",

          "Ngày field":
            formatDate(
              row.field_date
            ),

          "Số CIF":
            row.cif || "",

          "Tên khách hàng":
            row.customer_name || "",

          "Kết quả":
            row.result || "",

          "Kết nối":
            row.connection || "",

          "Kết quả chi tiết":
            row.detail || "",

          "Dự thu":
            Number(
              row.expected_amount
            ) || 0,

          "Hướng tác động tiếp theo":
            row.next_action || ""
        })
      );

    const ws =
      XLSX.utils.json_to_sheet(
        exportData
      );

    // Độ rộng cột
    ws["!cols"] = [
      { wch: 6 },
      { wch: 20 },
      { wch: 14 },
      { wch: 15 },
      { wch: 25 },
      { wch: 15 },
      { wch: 22 },
      { wch: 45 },
      { wch: 18 },
      { wch: 45 }
    ];

    const wb =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      wb,
      ws,
      "BaoCaoNgay"
    );

    const now =
      new Date();

    const date =
      now.getFullYear() +
      "-" +
      String(
        now.getMonth() + 1
      ).padStart(2, "0") +
      "-" +
      String(
        now.getDate()
      ).padStart(2, "0");

    XLSX.writeFile(
      wb,
      `Bao_Cao_Ngay_${date}.xlsx`
    );

    if (managerMessage) {
      managerMessage.textContent =
        `✅ Đã xuất ${filteredData.length} báo cáo ra Excel.`;
    }
  }

  // ==========================================================
  // FORMAT DATE
  // ==========================================================

  function formatDate(value) {

    if (!value) {
      return "";
    }

    return String(value)
      .substring(0, 10);
  }

  // ==========================================================
  // ESCAPE HTML
  // ==========================================================

  function escapeHtml(value) {

    if (
      value === null ||
      value === undefined
    ) {
      return "";
    }

    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // ==========================================================
  // ESCAPE ATTRIBUTE
  // ==========================================================

  function escapeAttr(value) {

    if (
      value === null ||
      value === undefined
    ) {
      return "";
    }

    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  // ==========================================================
  // REMOVE EDIT MODAL
  // ==========================================================

  function removeEditModal() {

    document
      .getElementById(
        "editReportModal"
      )
      ?.remove();
  }

})();

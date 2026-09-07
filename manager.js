// ============================================================
// MANAGER.JS
// QUẢN LÝ BÁO CÁO NGÀY
// PHIÊN BẢN GỐC - KHÔNG PHÂN QUYỀN
// ============================================================
(() => {
  "use strict";
  // ==========================================================
  // SUPABASE
  // ==========================================================
  if (!window.supabase) {
    alert("❌ Không tìm thấy Supabase!");
    return;
  }
  if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
    alert("❌ Thiếu SUPABASE_URL hoặc SUPABASE_ANON_KEY!");
    return;
  }
  const db = window.supabase.createClient(
    window.SUPABASE_URL,
    window.SUPABASE_ANON_KEY
  );
  // ==========================================================
  // BIẾN
  // ==========================================================
  let currentUser = null;
  let allData = [];
  let filteredData = [];
  let currentPage = 1;
  const PAGE_SIZE = 20;
  // ==========================================================
  // ELEMENT
  // ==========================================================
  const loginBox =
    document.getElementById("loginBox");
  const managerBox =
    document.getElementById("managerBox");
  const loginId =
    document.getElementById("loginId") ||
    document.getElementById("email");
  const password =
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
  const submittedUserCount =
    document.getElementById("submittedUserCount");
  const showSubmittedUsersBtn =
    document.getElementById("showSubmittedUsersBtn");
  // MENU
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
  // ==========================================================
  // HIỂN THỊ LOGIN
  // ==========================================================
  function showLogin(message = "") {
    if (loginBox) {
      loginBox.style.display = "";
    }
    if (managerBox) {
      managerBox.style.display = "none";
    }
    if (loginMessage) {
      loginMessage.textContent = message;
    }
  }
  // ==========================================================
  // HIỂN THỊ MANAGER
  // ==========================================================
  function showManager() {
    if (loginBox) {
      loginBox.style.display = "none";
    }
    if (managerBox) {
      managerBox.style.display = "";
    }
    if (loginMessage) {
      loginMessage.textContent = "";
    }
  }
  // ==========================================================
  // ĐĂNG NHẬP
  // ==========================================================
  async function login() {
    if (!loginId || !password) {
      return;
    }
    const email =
      loginId.value.trim();
    const pass =
      password.value;
    if (!email || !pass) {
      if (loginMessage) {
        loginMessage.textContent =
          "⚠️ Vui lòng nhập Gmail và mật khẩu.";
      }
      return;
    }
    if (loginBtn) {
      loginBtn.disabled = true;
      loginBtn.textContent =
        "Đang đăng nhập...";
    }
    if (loginMessage) {
      loginMessage.textContent = "";
    }
    try {
      const {
        data,
        error
      } = await db.auth.signInWithPassword({
        email: email,
        password: pass
      });
      if (error) {
        throw error;
      }
      if (!data || !data.session) {
        throw new Error(
          "Không tạo được phiên đăng nhập."
        );
      }
      currentUser =
        data.user;
      // Kiểm tra email xác nhận
      if (
        !currentUser.email_confirmed_at
      ) {
        await db.auth.signOut();
        currentUser = null;
        showLogin(
          "❌ Gmail chưa được xác nhận. Vui lòng xác nhận email."
        );
        return;
      }
      showManager();
      await loadData();
    } catch (error) {
      console.error(
        "LOGIN ERROR:",
        error
      );
      showLogin(
        "❌ " +
        (
          error?.message ||
          "Đăng nhập thất bại."
        )
      );
    } finally {
      if (loginBtn) {
        loginBtn.disabled = false;
        loginBtn.textContent =
          "Đăng nhập";
      }
    }
  }
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
        throw error;
      }
      const session =
        data?.session;
      if (!session) {
        currentUser = null;
        showLogin();
        return;
      }
      currentUser =
        session.user;
      if (
        !currentUser.email_confirmed_at
      ) {
        await db.auth.signOut();
        currentUser = null;
        showLogin(
          "❌ Gmail chưa được xác nhận."
        );
        return;
      }
      showManager();
      await loadData();
    } catch (error) {
      console.error(
        "SESSION ERROR:",
        error
      );
      currentUser = null;
      showLogin();
    }
  }
  // ==========================================================
  // ĐĂNG XUẤT
  // ==========================================================
  async function logout() {
    try {
      await db.auth.signOut();
    } catch (error) {
      console.error(
        "LOGOUT ERROR:",
        error
      );
    }
    currentUser = null;
    allData = [];
    filteredData = [];
    currentPage = 1;
    showLogin();
    closeMenu();
    if (tableBody) {
      tableBody.innerHTML = "";
    }
    if (totalReports) {
      totalReports.textContent = "0";
    }
    if (totalAmount) {
      totalAmount.textContent = "0 ₫";
    }
    if (submittedUserCount) {
      submittedUserCount.textContent = "0";
    }
  }
  // ==========================================================
  // LOAD DỮ LIỆU
  // ==========================================================
  async function loadData() {
    if (!currentUser) {
      return;
    }
    if (managerMessage) {
      managerMessage.textContent =
        "⏳ Đang tải báo cáo...";
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
        throw error;
      }
      allData =
        Array.isArray(data)
          ? data
          : [];
      filteredData =
        [...allData];
      currentPage = 1;
      updateUserFilter();
      updateStats();
      renderTable();
      updateSubmittedUsers();
      if (managerMessage) {
        managerMessage.textContent =
          `✅ Đã tải ${allData.length} báo cáo.`;
      }
    } catch (error) {
      console.error(
        "LOAD DATA ERROR:",
        error
      );
      if (managerMessage) {
        managerMessage.textContent =
          "❌ Không tải được dữ liệu: " +
          (
            error?.message ||
            "Lỗi không xác định."
          );
      }
    }
  }
  // ==========================================================
  // DANH SÁCH CÁN BỘ
  // ==========================================================
  function updateUserFilter() {
    if (!filterUser) {
      return;
    }
    const oldValue =
      filterUser.value;
    const users =
      [
        ...new Set(
          allData
            .map(
              row =>
                row.user_name
            )
            .filter(Boolean)
        )
      ]
      .sort(
        (a, b) =>
          String(a).localeCompare(
            String(b),
            "vi"
          )
      );
    filterUser.innerHTML =
      `<option value="">Tất cả cán bộ</option>`;
    users.forEach(user => {
      const option =
        document.createElement(
          "option"
        );
      option.value = user;
      option.textContent = user;
      filterUser.appendChild(
        option
      );
    });
    if (
      users.includes(oldValue)
    ) {
      filterUser.value =
        oldValue;
    }
  }
  // ==========================================================
  // LỌC
  // ==========================================================
  function applyFilter() {
    const user =
      filterUser
        ? filterUser.value.trim()
        : "";
    const date =
      filterDate
        ? filterDate.value
        : "";
    filteredData =
      allData.filter(row => {
        const rowUser =
          String(
            row.user_name || ""
          ).trim();
        const rowDate =
          String(
            row.field_date || ""
          ).substring(0, 10);
        const matchUser =
          !user ||
          rowUser === user;
        const matchDate =
          !date ||
          rowDate === date;
        return (
          matchUser &&
          matchDate
        );
      });
    currentPage = 1;
    updateStats();
    renderTable();
  }
  // ==========================================================
  // THỐNG KÊ
  // ==========================================================
  function updateStats() {
    if (totalReports) {
      totalReports.textContent =
        filteredData.length
          .toLocaleString("vi-VN");
    }
    if (totalAmount) {
      const total =
        filteredData.reduce(
          (
            sum,
            row
          ) =>
            sum +
            getAmount(row),
          0
        );
      totalAmount.textContent =
        formatMoney(total);
    }
  }
  // ==========================================================
  // LẤY SỐ TIỀN
  // ==========================================================
  function getAmount(row) {
    const value =
      row?.expected_amount ??
      row?.amount ??
      row?.du_thu ??
      0;
    if (
      typeof value === "number"
    ) {
      return value;
    }
    const number =
      Number(
        String(value)
          .replace(/[^\d.-]/g, "")
      );
    return Number.isFinite(number)
      ? number
      : 0;
  }
  // ==========================================================
  // FORMAT TIỀN
  // ==========================================================
  function formatMoney(value) {
    return (
      Number(value) || 0
    ).toLocaleString(
      "vi-VN"
    ) + " ₫";
  }
  // ==========================================================
  // FORMAT NGÀY
  // ==========================================================
  function formatDate(value) {
    if (!value) {
      return "";
    }
    const date =
      new Date(value);
    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return String(value);
    }
    return date.toLocaleDateString(
      "vi-VN"
    );
  }
  // ==========================================================
  // ESCAPE HTML
  // ==========================================================
  function escapeHtml(value) {
    return String(
      value ?? ""
    )
      .replace(
        /&/g,
        "&amp;"
      )
      .replace(
        /</g,
        "&lt;"
      )
      .replace(
        />/g,
        "&gt;"
      )
      .replace(
        /"/g,
        "&quot;"
      )
      .replace(
        /'/g,
        "&#039;"
      );
  }
  // ==========================================================
  // HIỂN THỊ BẢNG
  // ==========================================================
  function renderTable() {
    if (!tableBody) {
      return;
    }
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
    const start =
      (
        currentPage - 1
      ) *
      PAGE_SIZE;
    const rows =
      filteredData.slice(
        start,
        start + PAGE_SIZE
      );
    if (!rows.length) {
      tableBody.innerHTML = `
        <tr>
          <td
            colspan="11"
            style="text-align:center;padding:30px;"
          >
            Không có báo cáo.
          </td>
        </tr>
      `;
      renderPagination(
        totalPages
      );
      return;
    }
    tableBody.innerHTML =
      rows
        .map(
          (
            row,
            index
          ) => {
            return `
              <tr>
                <td>
                  ${start + index + 1}
                </td>
                <td>
                  ${escapeHtml(
                    row.user_name
                  )}
                </td>
                <td>
                  ${escapeHtml(
                    row.field_date
                  )}
                </td>
                <td>
                  ${escapeHtml(
                    row.cif
                  )}
                </td>
                <td>
                  ${escapeHtml(
                    row.customer_name
                  )}
                </td>
                <td>
                  ${escapeHtml(
                    row.result
                  )}
                </td>
                <td>
                  ${escapeHtml(
                    row.connection
                  )}
                </td>
                <td>
                  ${escapeHtml(
                    row.detail
                  )}
                </td>
                <td>
                  <strong>
                    ${formatMoney(
                      getAmount(row)
                    )}
                  </strong>
                </td>
                <td>
                  ${escapeHtml(
                    row.next_action
                  )}
                </td>
                <td>
                  <button
                    type="button"
                    class="edit-report-btn"
                    data-id="${escapeHtml(row.id)}"
                  >
                    ✏️
                  </button>
                  <button
                    type="button"
                    class="delete-report-btn"
                    data-id="${escapeHtml(row.id)}"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            `;
          }
        )
        .join("");
    // EDIT
    tableBody
      .querySelectorAll(
        ".edit-report-btn"
      )
      .forEach(button => {
        button.addEventListener(
          "click",
          () => {
            editData(
              button.dataset.id
            );
          }
        );
      });
    // DELETE
    tableBody
      .querySelectorAll(
        ".delete-report-btn"
      )
      .forEach(button => {
        button.addEventListener(
          "click",
          () => {
            deleteData(
              button.dataset.id
            );
          }
        );
      });
    renderPagination(
      totalPages
    );
  }
  // ==========================================================
  // PHÂN TRANG
  // ==========================================================
  function renderPagination(
    totalPages
  ) {
    if (!pagination) {
      return;
    }
    if (totalPages <= 1) {
      pagination.innerHTML = "";
      return;
    }
    let html = "";
    html += `
      <button
        type="button"
        ${
          currentPage === 1
            ? "disabled"
            : ""
        }
        data-page="${currentPage - 1}"
      >
        ◀
      </button>
    `;
    for (
      let i = 1;
      i <= totalPages;
      i++
    ) {
      html += `
        <button
          type="button"
          class="${
            i === currentPage
              ? "active"
              : ""
          }"
          data-page="${i}"
        >
          ${i}
        </button>
      `;
    }
    html += `
      <button
        type="button"
        ${
          currentPage === totalPages
            ? "disabled"
            : ""
        }
        data-page="${currentPage + 1}"
      >
        ▶
      </button>
    `;
    pagination.innerHTML =
      html;
    pagination
      .querySelectorAll(
        "button[data-page]"
      )
      .forEach(button => {
        button.addEventListener(
          "click",
          () => {
            const page =
              Number(
                button.dataset.page
              );
            if (
              page >= 1 &&
              page <= totalPages
            ) {
              currentPage =
                page;
              renderTable();
            }
          }
        );
      });
  }
  // ==========================================================
  // SỬA
  // ==========================================================
  async function editData(id) {
    const row =
      allData.find(
        item =>
          String(item.id) ===
          String(id)
      );
    if (!row) {
      alert(
        "❌ Không tìm thấy báo cáo."
      );
      return;
    }
    const oldAmount =
      getAmount(row);
    const newAmount =
      prompt(
        "Nhập số tiền dự thu mới:",
        oldAmount
      );
    if (
      newAmount === null
    ) {
      return;
    }
    const cleaned =
      String(newAmount)
        .replace(/[^\d.-]/g, "");
    const amount =
      Number(cleaned);
    if (
      !Number.isFinite(amount)
    ) {
      alert(
        "❌ Số tiền không hợp lệ!"
      );
      return;
    }
    try {
      const {
        error
      } = await db
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
        throw error;
      }
      alert(
        "✅ Đã cập nhật."
      );
      await loadData();
    } catch (error) {
      console.error(
        "EDIT ERROR:",
        error
      );
      alert(
        "❌ Không thể cập nhật: " +
        (
          error?.message ||
          ""
        )
      );
    }
  }
  // ==========================================================
  // XÓA
  // ==========================================================
  async function deleteData(id) {
    const row =
      allData.find(
        item =>
          String(item.id) ===
          String(id)
      );
    const customerName =
      row?.customer_name ||
      "báo cáo này";
    if (
      !confirm(
        `⚠️ Bạn có chắc muốn xóa ${customerName}?`
      )
    ) {
      return;
    }
    try {
      const {
        error
      } = await db
        .from("bao_cao_ngay")
        .delete()
        .eq(
          "id",
          id
        );
      if (error) {
        throw error;
      }
      alert(
        "✅ Đã xóa báo cáo."
      );
      await loadData();
    } catch (error) {
      console.error(
        "DELETE ERROR:",
        error
      );
      alert(
        "❌ Không thể xóa: " +
        (
          error?.message ||
          ""
        )
      );
    }
  }
  // ==========================================================
  // CÁN BỘ ĐÃ GỬI
  // ==========================================================
  function updateSubmittedUsers() {
    if (!submittedUserCount) {
      return;
    }
    const users =
      new Set(
        allData
          .map(
            row =>
              row.user_name
          )
          .filter(Boolean)
      );
    submittedUserCount.textContent =
      users.size;
  }
  // ==========================================================
  // HIỂN THỊ CÁN BỘ
  // ==========================================================
  function showSubmittedUsers() {
    const users =
      [
        ...new Set(
          filteredData
            .map(
              row =>
                row.user_name
            )
            .filter(Boolean)
        )
      ]
      .sort(
        (a, b) =>
          String(a).localeCompare(
            String(b),
            "vi"
          )
      );
    if (!users.length) {
      alert(
        "Chưa có cán bộ nào gửi báo cáo."
      );
      return;
    }
    alert(
      "👥 CÁN BỘ ĐÃ GỬI BÁO CÁO\n\n" +
      users
        .map(
          (user, index) =>
            `${index + 1}. ${user}`
        )
        .join("\n")
    );
  }
  // ==========================================================
  // XUẤT EXCEL
  // ==========================================================
  function exportExcel() {
    if (!window.XLSX) {
      alert(
        "❌ Chưa tải thư viện Excel."
      );
      return;
    }
    if (!filteredData.length) {
      alert(
        "❌ Không có dữ liệu để xuất."
      );
      return;
    }
    const rows =
      filteredData.map(
        (row, index) => ({
          STT:
            index + 1,
          "Cán bộ":
            row.user_name || "",
          "Ngày báo cáo":
            row.field_date || "",
          "CIF":
            row.cif || "",
          "Khách hàng":
            row.customer_name || "",
          "Kết quả":
            row.result || "",
          "Kết nối":
            row.connection || "",
          "Chi tiết":
            row.detail || "",
          "Dự thu":
            getAmount(row),
          "Hành động tiếp theo":
            row.next_action || "",
          "Thời gian tạo":
            row.created_at || ""
        })
      );
    const worksheet =
      XLSX.utils.json_to_sheet(
        rows
      );
    const workbook =
      XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "BaoCaoNgay"
    );
    const now =
      new Date();
    const filename =
      "BaoCaoNgay_" +
      now
        .toISOString()
        .slice(0, 10) +
      ".xlsx";
    XLSX.writeFile(
      workbook,
      filename
    );
  }
  // ==========================================================
  // MENU
  // ==========================================================
  function openMenu() {
    if (sideMenu) {
      sideMenu.classList.add(
        "open"
      );
    }
    if (sideMenuOverlay) {
      sideMenuOverlay.style.display =
        "block";
    }
  }
  function closeMenu() {
    if (sideMenu) {
      sideMenu.classList.remove(
        "open"
      );
    }
    if (sideMenuOverlay) {
      sideMenuOverlay.style.display =
        "none";
    }
  }
  // ==========================================================
  // SỰ KIỆN
  // ==========================================================
  document.addEventListener(
    "DOMContentLoaded",
    () => {
      // LOGIN
      if (loginBtn) {
        loginBtn.addEventListener(
          "click",
          login
        );
      }
      // ENTER
      if (loginId) {
        loginId.addEventListener(
          "keydown",
          event => {
            if (
              event.key ===
              "Enter"
            ) {
              login();
            }
          }
        );
      }
      if (password) {
        password.addEventListener(
          "keydown",
          event => {
            if (
              event.key ===
              "Enter"
            ) {
              login();
            }
          }
        );
      }
      // LOGOUT
      if (logoutBtn) {
        logoutBtn.addEventListener(
          "click",
          logout
        );
      }
      // FILTER
      if (filterBtn) {
        filterBtn.addEventListener(
          "click",
          applyFilter
        );
      }
      // REFRESH
      if (refreshBtn) {
        refreshBtn.addEventListener(
          "click",
          loadData
        );
      }
      // EXPORT
      if (exportBtn) {
        exportBtn.addEventListener(
          "click",
          exportExcel
        );
      }
      // SUBMITTED USERS
      if (
        showSubmittedUsersBtn
      ) {
        showSubmittedUsersBtn
          .addEventListener(
            "click",
            showSubmittedUsers
          );
      }
      // MENU
      if (menuBtn) {
        menuBtn.addEventListener(
          "click",
          openMenu
        );
      }
      if (sideMenuClose) {
        sideMenuClose.addEventListener(
          "click",
          closeMenu
        );
      }
      if (sideMenuOverlay) {
        sideMenuOverlay.addEventListener(
          "click",
          closeMenu
        );
      }
      if (menuReportsBtn) {
        menuReportsBtn.addEventListener(
          "click",
          () => {
            closeMenu();
            if (managerBox) {
              managerBox.scrollIntoView({
                behavior: "smooth"
              });
            }
          }
        );
      }
      if (menuLogoutBtn) {
        menuLogoutBtn.addEventListener(
          "click",
          logout
        );
      }
      // ======================================================
      // AUTH STATE
      // ======================================================
      db.auth.onAuthStateChange(
        async (
          event,
          session
        ) => {
          console.log(
            "AUTH EVENT:",
            event
          );
          if (
            event ===
            "SIGNED_OUT"
          ) {
            currentUser = null;
            showLogin();
            return;
          }
          if (
            event ===
            "SIGNED_IN"
          ) {
            currentUser =
              session?.user ||
              null;
            if (currentUser) {
              showManager();
              await loadData();
            }
          }
        }
      );
      // ======================================================
      // KIỂM TRA SESSION BAN ĐẦU
      // ======================================================
      checkSession();
    }
  );
})();

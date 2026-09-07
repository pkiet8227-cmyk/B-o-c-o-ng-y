// ============================================================
// MANAGER.JS
// QUẢN LÝ BÁO CÁO NGÀY
// PHÂN QUYỀN BẰNG USER METADATA
// ============================================================
(() => {
  "use strict";
  // ==========================================================
  // KIỂM TRA SUPABASE
  // ==========================================================
  if (!window.supabase) {
    alert("❌ Không tìm thấy Supabase!");
    return;
  }
  if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
    alert("❌ Chưa cấu hình SUPABASE_URL / SUPABASE_ANON_KEY!");
    return;
  }
  const client = window.supabase.createClient(
    window.SUPABASE_URL,
    window.SUPABASE_ANON_KEY
  );
  // ==========================================================
  // BIẾN
  // ==========================================================
  let currentUser = null;
  let allReports = [];
  let filteredReports = [];
  let currentPage = 1;
  const pageSize = 20;
  // ==========================================================
  // DOM
  // ==========================================================
  const loginBox = document.getElementById("loginBox");
  const managerBox = document.getElementById("managerBox");
  const loginId = document.getElementById("loginId");
  const password = document.getElementById("password");
  const loginBtn = document.getElementById("loginBtn");
  const loginMessage = document.getElementById("loginMessage");
  const logoutBtn = document.getElementById("logoutBtn");
  const totalReports = document.getElementById("totalReports");
  const totalAmount = document.getElementById("totalAmount");
  const filterUser = document.getElementById("filterUser");
  const filterDate = document.getElementById("filterDate");
  const filterBtn = document.getElementById("filterBtn");
  const refreshBtn = document.getElementById("refreshBtn");
  const exportBtn = document.getElementById("exportBtn");
  const showSubmittedUsersBtn =
    document.getElementById("showSubmittedUsersBtn");
  const submittedUserCount =
    document.getElementById("submittedUserCount");
  const tableBody =
    document.getElementById("tableBody");
  const pagination =
    document.getElementById("pagination");
  const managerMessage =
    document.getElementById("managerMessage");
  // Menu
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
  const menuPermissionBtn =
    document.getElementById("menuPermissionBtn");
  const menuLogoutBtn =
    document.getElementById("menuLogoutBtn");
  // ==========================================================
  // KHỞI ĐỘNG
  // ==========================================================
  document.addEventListener("DOMContentLoaded", () => {
    setupEvents();
    checkSession();
  });
  // ==========================================================
  // EVENTS
  // ==========================================================
  function setupEvents() {
    if (loginBtn) {
      loginBtn.addEventListener("click", login);
    }
    if (password) {
      password.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          login();
        }
      });
    }
    if (loginId) {
      loginId.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          login();
        }
      });
    }
    if (logoutBtn) {
      logoutBtn.addEventListener("click", logout);
    }
    if (filterBtn) {
      filterBtn.addEventListener("click", () => {
        currentPage = 1;
        applyFilters();
      });
    }
    if (refreshBtn) {
      refreshBtn.addEventListener("click", loadReports);
    }
    if (exportBtn) {
      exportBtn.addEventListener("click", exportExcel);
    }
    if (showSubmittedUsersBtn) {
      showSubmittedUsersBtn.addEventListener(
        "click",
        showSubmittedUsers
      );
    }
    // Menu
    if (menuBtn) {
      menuBtn.addEventListener("click", openMenu);
    }
    if (sideMenuClose) {
      sideMenuClose.addEventListener("click", closeMenu);
    }
    if (sideMenuOverlay) {
      sideMenuOverlay.addEventListener("click", closeMenu);
    }
    if (menuReportsBtn) {
      menuReportsBtn.addEventListener("click", () => {
        closeMenu();
        loadReports();
      });
    }
    if (menuPermissionBtn) {
      menuPermissionBtn.addEventListener(
        "click",
        openPermission
      );
    }
    if (menuLogoutBtn) {
      menuLogoutBtn.addEventListener("click", () => {
        closeMenu();
        logout();
      });
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
      } = await client.auth.getSession();
      if (error) {
        console.error(error);
        showLogin();
        return;
      }
      const session = data?.session;
      if (!session || !session.user) {
        showLogin();
        return;
      }
      currentUser = session.user;
      await checkManagerPermission();
    } catch (error) {
      console.error(
        "checkSession error:",
        error
      );
      showLogin();
    }
  }
  // ==========================================================
  // ĐĂNG NHẬP
  // ==========================================================
  async function login() {
    const email =
      (loginId?.value || "").trim();
    const pass =
      password?.value || "";
    if (!email) {
      showLoginError(
        "⚠️ Vui lòng nhập Gmail."
      );
      return;
    }
    if (!pass) {
      showLoginError(
        "⚠️ Vui lòng nhập mật khẩu."
      );
      return;
    }
    setLoginLoading(true);
    try {
      clearLoginError();
      const {
        data,
        error
      } = await client.auth.signInWithPassword({
        email: email,
        password: pass
      });
      if (error) {
        console.error(
          "Login error:",
          error
        );
        showLoginError(
          "❌ " + getAuthError(error)
        );
        return;
      }
      if (!data?.user) {
        showLoginError(
          "❌ Không lấy được thông tin tài khoản."
        );
        return;
      }
      currentUser = data.user;
      // Kiểm tra email đã xác nhận
      if (!currentUser.email_confirmed_at) {
        showLoginError(
          "⚠️ Gmail chưa được xác nhận. " +
          "Vui lòng xác nhận email trước khi đăng nhập."
        );
        await client.auth.signOut();
        return;
      }
      await checkManagerPermission();
    } catch (error) {
      console.error(
        "Login exception:",
        error
      );
      showLoginError(
        "❌ " +
        (error?.message ||
          "Đăng nhập thất bại.")
      );
    } finally {
      setLoginLoading(false);
    }
  }
  // ==========================================================
  // KIỂM TRA QUYỀN QUẢN LÝ
  //
  // DÙNG:
  // user.user_metadata.role === "manager"
  //
  // ==========================================================
  async function checkManagerPermission() {
    if (!currentUser) {
      showLogin();
      return;
    }
    try {
      const role =
        currentUser?.user_metadata?.role;
      console.log(
        "User:",
        currentUser.email
      );
      console.log(
        "User metadata:",
        currentUser.user_metadata
      );
      console.log(
        "Role:",
        role
      );
      // Chấp nhận manager hoặc admin
      const isManager =
        role === "manager" ||
        role === "admin";
      if (!isManager) {
        showLoginError(
          "❌ Tài khoản chưa được cấp quyền quản lý."
        );
        await client.auth.signOut();
        currentUser = null;
        return;
      }
      // Có quyền
      showManager();
      await loadReports();
    } catch (error) {
      console.error(
        "checkManagerPermission error:",
        error
      );
      showLoginError(
        "❌ Không thể kiểm tra quyền quản lý."
      );
    }
  }
  // ==========================================================
  // HIỂN THỊ LOGIN
  // ==========================================================
  function showLogin() {
    if (loginBox) {
      loginBox.style.display = "";
    }
    if (managerBox) {
      managerBox.style.display = "none";
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
    clearLoginError();
  }
  // ==========================================================
  // LOAD BÁO CÁO
  // ==========================================================
  async function loadReports() {
    if (!currentUser) {
      return;
    }
    showManagerMessage(
      "⏳ Đang tải báo cáo..."
    );
    try {
      const {
        data,
        error
      } = await client
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
          "loadReports error:",
          error
        );
        showManagerMessage(
          "❌ Không tải được báo cáo: " +
          error.message
        );
        return;
      }
      allReports =
        Array.isArray(data)
          ? data
          : [];
      currentPage = 1;
      applyFilters();
      showManagerMessage("");
    } catch (error) {
      console.error(error);
      showManagerMessage(
        "❌ Lỗi tải dữ liệu."
      );
    }
  }
  // ==========================================================
  // LỌC
  // ==========================================================
  function applyFilters() {
    const userKeyword =
      (filterUser?.value || "")
        .trim()
        .toLowerCase();
    const selectedDate =
      filterDate?.value || "";
    filteredReports =
      allReports.filter((report) => {
        const userName =
          String(
            report.user_name ||
            report.username ||
            report.email ||
            ""
          ).toLowerCase();
        if (
          userKeyword &&
          !userName.includes(userKeyword)
        ) {
          return false;
        }
        if (selectedDate) {
          const reportDate =
            getReportDate(report);
          if (
            reportDate !== selectedDate
          ) {
            return false;
          }
        }
        return true;
      });
    updateStats();
    renderTable();
    renderPagination();
  }
  // ==========================================================
  // LẤY NGÀY BÁO CÁO
  // ==========================================================
  function getReportDate(report) {
    if (report.field_date) {
      return formatDateForInput(
        report.field_date
      );
    }
    if (report.report_date) {
      return formatDateForInput(
        report.report_date
      );
    }
    if (report.created_at) {
      const date =
        new Date(report.created_at);
      if (!isNaN(date.getTime())) {
        const y =
          date.getFullYear();
        const m =
          String(
            date.getMonth() + 1
          ).padStart(2, "0");
        const d =
          String(
            date.getDate()
          ).padStart(2, "0");
        return `${y}-${m}-${d}`;
      }
    }
    return "";
  }
  function formatDateForInput(value) {
    if (!value) {
      return "";
    }
    const str =
      String(value);
    if (
      /^\d{4}-\d{2}-\d{2}/.test(str)
    ) {
      return str.substring(0, 10);
    }
    const date =
      new Date(value);
    if (isNaN(date.getTime())) {
      return "";
    }
    const y =
      date.getFullYear();
    const m =
      String(
        date.getMonth() + 1
      ).padStart(2, "0");
    const d =
      String(
        date.getDate()
      ).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  // ==========================================================
  // THỐNG KÊ
  // ==========================================================
  function updateStats() {
    if (totalReports) {
      totalReports.textContent =
        filteredReports.length;
    }
    let total = 0;
    filteredReports.forEach(
      (report) => {
        total += getAmount(report);
      }
    );
    if (totalAmount) {
      totalAmount.textContent =
        formatMoney(total);
    }
  }
  // ==========================================================
  // LẤY SỐ TIỀN
  // ==========================================================
  function getAmount(report) {
    const value =
      report.expected_amount ??
      report.amount ??
      report.du_thu ??
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
    return isNaN(number)
      ? 0
      : number;
  }
  // ==========================================================
  // FORMAT TIỀN
  // ==========================================================
  function formatMoney(value) {
    return Number(value || 0)
      .toLocaleString("vi-VN") +
      " đ";
  }
  // ==========================================================
  // RENDER TABLE
  // ==========================================================
  function renderTable() {
    if (!tableBody) {
      return;
    }
    tableBody.innerHTML = "";
    const start =
      (currentPage - 1) *
      pageSize;
    const end =
      start + pageSize;
    const pageReports =
      filteredReports.slice(
        start,
        end
      );
    if (!pageReports.length) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="20"
              style="text-align:center;padding:30px;">
            Không có dữ liệu báo cáo
          </td>
        </tr>
      `;
      return;
    }
    pageReports.forEach(
      (report, index) => {
        const tr =
          document.createElement("tr");
        const realIndex =
          start + index + 1;
        const date =
          getReportDate(report);
        const displayDate =
          formatDisplayDate(date);
        const amount =
          getAmount(report);
        tr.innerHTML = `
          <td>${realIndex}</td>
          <td>
            ${escapeHTML(
              report.user_name ||
              report.username ||
              report.email ||
              ""
            )}
          </td>
          <td>
            ${escapeHTML(
              displayDate
            )}
          </td>
          <td>
            ${escapeHTML(
              report.cif || ""
            )}
          </td>
          <td>
            ${escapeHTML(
              report.customer_name || ""
            )}
          </td>
          <td>
            ${escapeHTML(
              report.result || ""
            )}
          </td>
          <td>
            ${escapeHTML(
              report.connection || ""
            )}
          </td>
          <td>
            ${escapeHTML(
              report.detail || ""
            )}
          </td>
          <td>
            ${formatMoney(amount)}
          </td>
          <td>
            ${escapeHTML(
              report.next_action || ""
            )}
          </td>
          <td>
            <button
              class="edit-report-btn"
              data-id="${escapeHTML(
                report.id || ""
              )}">
              ✏️ Sửa
            </button>
            <button
              class="delete-report-btn"
              data-id="${escapeHTML(
                report.id || ""
              )}">
              🗑️ Xóa
            </button>
          </td>
        `;
        tableBody.appendChild(tr);
      }
    );
    // Gắn nút sửa
    tableBody
      .querySelectorAll(
        ".edit-report-btn"
      )
      .forEach((button) => {
        button.addEventListener(
          "click",
          () => {
            const id =
              button.dataset.id;
            editReport(id);
          }
        );
      });
    // Gắn nút xóa
    tableBody
      .querySelectorAll(
        ".delete-report-btn"
      )
      .forEach((button) => {
        button.addEventListener(
          "click",
          () => {
            const id =
              button.dataset.id;
            deleteReport(id);
          }
        );
      });
  }
  // ==========================================================
  // FORMAT NGÀY HIỂN THỊ
  // ==========================================================
  function formatDisplayDate(date) {
    if (!date) {
      return "";
    }
    const parts =
      date.split("-");
    if (parts.length !== 3) {
      return date;
    }
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
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
        filteredReports.length /
        pageSize
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
          renderTable();
          renderPagination();
        }
      }
    );
    pagination.appendChild(prev);
    // Các trang
    for (
      let i = 1;
      i <= totalPages;
      i++
    ) {
      const button =
        document.createElement("button");
      button.textContent = i;
      if (i === currentPage) {
        button.classList.add("active");
      }
      button.addEventListener(
        "click",
        () => {
          currentPage = i;
          renderTable();
          renderPagination();
        }
      );
      pagination.appendChild(button);
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
          renderTable();
          renderPagination();
        }
      }
    );
    pagination.appendChild(next);
  }
  // ==========================================================
  // SỬA BÁO CÁO
  // ==========================================================
  async function editReport(id) {
    const report =
      allReports.find(
        (item) =>
          String(item.id) ===
          String(id)
      );
    if (!report) {
      alert(
        "❌ Không tìm thấy báo cáo."
      );
      return;
    }
    const oldAmount =
      getAmount(report);
    const input =
      prompt(
        "Nhập số tiền dự thu mới:",
        oldAmount || ""
      );
    if (input === null) {
      return;
    }
    const amount =
      Number(
        String(input)
          .replace(/[^\d.-]/g, "")
      );
    if (isNaN(amount)) {
      alert(
        "❌ Số tiền không hợp lệ."
      );
      return;
    }
    try {
      const {
        error
      } = await client
        .from("bao_cao_ngay")
        .update({
          expected_amount: amount
        })
        .eq("id", id);
      if (error) {
        console.error(
          "editReport error:",
          error
        );
        alert(
          "❌ Không thể sửa báo cáo:\n" +
          error.message
        );
        return;
      }
      alert(
        "✅ Đã cập nhật báo cáo."
      );
      await loadReports();
    } catch (error) {
      console.error(error);
      alert(
        "❌ Có lỗi khi cập nhật."
      );
    }
  }
  // ==========================================================
  // XÓA BÁO CÁO
  // ==========================================================
  async function deleteReport(id) {
    const ok =
      confirm(
        "Bạn có chắc muốn xóa báo cáo này?"
      );
    if (!ok) {
      return;
    }
    try {
      const {
        error
      } = await client
        .from("bao_cao_ngay")
        .delete()
        .eq("id", id);
      if (error) {
        console.error(
          "deleteReport error:",
          error
        );
        alert(
          "❌ Không thể xóa:\n" +
          error.message
        );
        return;
      }
      alert(
        "✅ Đã xóa báo cáo."
      );
      await loadReports();
    } catch (error) {
      console.error(error);
      alert(
        "❌ Có lỗi khi xóa báo cáo."
      );
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
    if (!filteredReports.length) {
      alert(
        "⚠️ Không có dữ liệu để xuất."
      );
      return;
    }
    const rows =
      filteredReports.map(
        (report, index) => {
          return {
            "STT":
              index + 1,
            "Cán bộ":
              report.user_name ||
              report.username ||
              report.email ||
              "",
            "Ngày":
              formatDisplayDate(
                getReportDate(report)
              ),
            "CIF":
              report.cif || "",
            "Tên khách hàng":
              report.customer_name ||
              "",
            "Kết quả":
              report.result ||
              "",
            "Quan hệ":
              report.connection ||
              "",
            "Chi tiết":
              report.detail ||
              "",
            "Dự thu":
              getAmount(report),
            "Hành động tiếp theo":
              report.next_action ||
              ""
          };
        }
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
      "Bao Cao Ngay"
    );
    XLSX.writeFile(
      workbook,
      "Bao_Cao_Ngay.xlsx"
    );
  }
  // ==========================================================
  // DANH SÁCH CÁN BỘ ĐÃ NỘP
  // ==========================================================
  function showSubmittedUsers() {
    const users =
      [
        ...new Set(
          filteredReports.map(
            (report) =>
              report.user_name ||
              report.username ||
              report.email ||
              "Không xác định"
          )
        )
      ];
    if (submittedUserCount) {
      submittedUserCount.textContent =
        users.length;
    }
    if (!users.length) {
      alert(
        "Chưa có cán bộ nào nộp báo cáo."
      );
      return;
    }
    alert(
      "Cán bộ đã nộp báo cáo:\n\n" +
      users.join("\n")
    );
  }
  // ==========================================================
  // MENU
  // ==========================================================
  function openMenu() {
    if (sideMenu) {
      sideMenu.classList.add("open");
    }
    if (sideMenuOverlay) {
      sideMenuOverlay.classList.add("open");
    }
  }
  function closeMenu() {
    if (sideMenu) {
      sideMenu.classList.remove("open");
    }
    if (sideMenuOverlay) {
      sideMenuOverlay.classList.remove("open");
    }
  }
  // ==========================================================
  // PHÂN QUYỀN
  // ==========================================================
  function openPermission() {
    closeMenu();
    alert(
      "🔐 Phân quyền quản lý hiện được thực hiện bằng User Metadata trong Supabase.\n\n" +
      "Vào:\n" +
      "Supabase → Authentication → Users → chọn tài khoản → User Metadata\n\n" +
      'Đặt:\n' +
      '{ "role": "manager" }'
    );
  }
  // ==========================================================
  // ĐĂNG XUẤT
  // ==========================================================
  async function logout() {
    try {
      await client.auth.signOut();
    } catch (error) {
      console.error(
        "logout error:",
        error
      );
    } finally {
      currentUser = null;
      allReports = [];
      filteredReports = [];
      showLogin();
      if (loginId) {
        loginId.value = "";
      }
      if (password) {
        password.value = "";
      }
    }
  }
  // ==========================================================
  // LOGIN ERROR
  // ==========================================================
  function showLoginError(message) {
    if (!loginMessage) {
      alert(message);
      return;
    }
    loginMessage.textContent =
      message;
    loginMessage.style.display =
      "block";
  }
  function clearLoginError() {
    if (!loginMessage) {
      return;
    }
    loginMessage.textContent = "";
    loginMessage.style.display =
      "none";
  }
  // ==========================================================
  // MANAGER MESSAGE
  // ==========================================================
  function showManagerMessage(message) {
    if (!managerMessage) {
      return;
    }
    managerMessage.textContent =
      message;
  }
  // ==========================================================
  // LOGIN LOADING
  // ==========================================================
  function setLoginLoading(loading) {
    if (!loginBtn) {
      return;
    }
    loginBtn.disabled =
      loading;
    loginBtn.textContent =
      loading
        ? "⏳ Đang đăng nhập..."
        : "Đăng nhập";
  }
  // ==========================================================
  // AUTH ERROR
  // ==========================================================
  function getAuthError(error) {
    const message =
      String(
        error?.message || ""
      ).toLowerCase();
    if (
      message.includes(
        "invalid login credentials"
      )
    ) {
      return (
        "Gmail hoặc mật khẩu không đúng."
      );
    }
    if (
      message.includes(
        "email not confirmed"
      )
    ) {
      return (
        "Gmail chưa được xác nhận."
      );
    }
    if (
      message.includes(
        "too many requests"
      )
    ) {
      return (
        "Bạn thử đăng nhập quá nhiều lần. Vui lòng chờ một lúc."
      );
    }
    return (
      error?.message ||
      "Đăng nhập thất bại."
    );
  }
  // ==========================================================
  // ESCAPE HTML
  // ==========================================================
  function escapeHTML(value) {
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
})();

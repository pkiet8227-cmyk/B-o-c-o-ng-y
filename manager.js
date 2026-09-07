// ============================================================
// MANAGER.JS
// QUẢN LÝ BÁO CÁO NGÀY
// ĐĂNG NHẬP SUPABASE AUTH - EMAIL + MẬT KHẨU
// ============================================================

(() => {

  "use strict";

  // ==========================================================
  // KIỂM TRA SUPABASE
  // ==========================================================

  if (!window.supabase) {
    alert("❌ Không tìm thấy Supabase JS.");
    return;
  }

  if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
    alert("❌ Không tìm thấy SUPABASE_URL hoặc SUPABASE_ANON_KEY trong config.js.");
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
  let reports = [];

  let currentPage = 1;
  const pageSize = 10;

  let filteredReports = [];

  let editingReportId = null;


  // ==========================================================
  // DOM
  // ==========================================================

  const $ = id => document.getElementById(id);


  // ==========================================================
  // KHỞI ĐỘNG
  // ==========================================================

  document.addEventListener("DOMContentLoaded", async () => {

    setupEvents();

    await checkSession();

  });


  // ==========================================================
  // EVENT
  // ==========================================================

  function setupEvents() {

    // Đăng nhập
    $("loginBtn")?.addEventListener("click", login);


    // Enter trong password
    $("password")?.addEventListener("keydown", e => {

      if (e.key === "Enter") {
        login();
      }

    });


    // Menu
    $("menuBtn")?.addEventListener("click", openMenu);

    $("sideMenuClose")?.addEventListener("click", closeMenu);

    $("sideMenuOverlay")?.addEventListener("click", closeMenu);


    // Menu báo cáo
    $("menuReportsBtn")?.addEventListener("click", () => {

      closeMenu();

      $("managerBox").style.display = "block";

      loadReports();

    });


    // Logout menu
    $("menuLogoutBtn")?.addEventListener("click", logout);


    // Logout chính
    $("logoutBtn")?.addEventListener("click", logout);


    // Lọc
    $("filterBtn")?.addEventListener("click", () => {

      currentPage = 1;

      applyFilters();

    });


    // Refresh
    $("refreshBtn")?.addEventListener("click", async () => {

      await loadReports();

    });


    // Excel
    $("exportBtn")?.addEventListener("click", exportExcel);


    // Danh sách cán bộ
    $("showSubmittedUsersBtn")?.addEventListener(
      "click",
      showSubmittedUsers
    );


    // Phân quyền
    $("menuPermissionBtn")?.addEventListener(
      "click",
      openPermission
    );

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


      if (data?.session?.user) {

        currentUser = data.session.user;

        await afterLogin();

      } else {

        showLogin();

      }

    } catch (err) {

      console.error(err);

      showLogin();

    }

  }


  // ==========================================================
  // ĐĂNG NHẬP
  // ==========================================================

  async function login() {

    const loginId =
      $("loginId")?.value.trim() || "";

    const password =
      $("password")?.value || "";


    // Xóa thông báo cũ
    showLoginMessage("", "");


    if (!loginId) {

      showLoginMessage(
        "❌ Vui lòng nhập Gmail / Email.",
        "error"
      );

      $("loginId")?.focus();

      return;

    }


    if (!password) {

      showLoginMessage(
        "❌ Vui lòng nhập mật khẩu.",
        "error"
      );

      $("password")?.focus();

      return;

    }


    const btn = $("loginBtn");


    if (btn) {

      btn.disabled = true;

      btn.textContent = "⏳ ĐANG ĐĂNG NHẬP...";

    }


    try {

      console.log("Đang đăng nhập:", loginId);


      // ======================================================
      // SUPABASE AUTH EMAIL + PASSWORD
      // ======================================================

      const {
        data,
        error
      } = await client.auth.signInWithPassword({

        email: loginId,

        password: password

      });


      console.log("Login result:", data, error);


      if (error) {

        console.error("Supabase login error:", error);


        let message =
          error.message ||
          "Đăng nhập thất bại.";


        // Các lỗi phổ biến
        if (
          message.toLowerCase().includes(
            "invalid login credentials"
          )
        ) {

          message =
            "❌ Gmail hoặc mật khẩu không đúng.";

        }


        if (
          message.toLowerCase().includes(
            "email not confirmed"
          )
        ) {

          message =
            "❌ Gmail chưa được xác thực trong Supabase.";

        }


        showLoginMessage(
          message,
          "error"
        );

        return;

      }


      if (!data?.user) {

        showLoginMessage(
          "❌ Không nhận được tài khoản sau khi đăng nhập.",
          "error"
        );

        return;

      }


      // ======================================================
      // LƯU USER
      // ======================================================

      currentUser = data.user;


      console.log(
        "Đăng nhập thành công:",
        currentUser.email
      );


      // ======================================================
      // KIỂM TRA EMAIL ĐÃ XÁC THỰC
      // ======================================================

      if (!currentUser.email_confirmed_at) {

        showLoginMessage(
          "❌ Gmail này chưa được xác thực trong Supabase.",
          "error"
        );

        await client.auth.signOut();

        currentUser = null;

        return;

      }


      // ======================================================
      // KIỂM TRA QUYỀN MANAGER
      // ======================================================

      const isManager =
        await checkManagerPermission();


      if (!isManager) {

        showLoginMessage(
          "❌ Tài khoản này chưa được cấp quyền quản lý.",
          "error"
        );

        await client.auth.signOut();

        currentUser = null;

        return;

      }


      // ======================================================
      // VÀO TRANG QUẢN LÝ
      // ======================================================

      showLoginMessage(
        "✅ Đăng nhập thành công.",
        "success"
      );


      await afterLogin();


    } catch (err) {

      console.error(err);

      showLoginMessage(
        "❌ Có lỗi xảy ra: " +
        (err?.message || err),
        "error"
      );

    } finally {

      if (btn) {

        btn.disabled = false;

        btn.textContent = "🔐 ĐĂNG NHẬP";

      }

    }

  }


  // ==========================================================
  // SAU KHI LOGIN
  // ==========================================================

  async function afterLogin() {

    if (!currentUser) {

      showLogin();

      return;

    }


    $("loginBox").style.display = "none";

    $("managerBox").style.display = "block";

    $("menuBtn").style.display = "block";


    await loadReports();

  }


  // ==========================================================
  // KIỂM TRA QUYỀN MANAGER
  // ==========================================================

  async function checkManagerPermission() {

    try {

      const {
        data,
        error
      } = await client.rpc("is_manager");


      console.log(
        "is_manager:",
        data,
        error
      );


      if (error) {

        console.error(
          "RPC is_manager error:",
          error
        );

        showLoginMessage(
          "❌ Không kiểm tra được quyền quản lý: " +
          error.message,
          "error"
        );

        return false;

      }


      return data === true;


    } catch (err) {

      console.error(err);

      return false;

    }

  }


  // ==========================================================
  // HIỆN LOGIN
  // ==========================================================

  function showLogin() {

    if ($("loginBox")) {

      $("loginBox").style.display = "block";

    }


    if ($("managerBox")) {

      $("managerBox").style.display = "none";

    }


    if ($("menuBtn")) {

      $("menuBtn").style.display = "none";

    }

  }


  // ==========================================================
  // LOGIN MESSAGE
  // ==========================================================

  function showLoginMessage(message, type) {

    const el = $("loginMessage");

    if (!el) return;


    el.textContent = message;


    if (type === "error") {

      el.style.color = "#dc2626";

    } else if (type === "success") {

      el.style.color = "#16a34a";

    } else {

      el.style.color = "";

    }

  }


  // ==========================================================
  // LOAD REPORTS
  // ==========================================================

  async function loadReports() {

    showManagerMessage(
      "⏳ Đang tải báo cáo...",
      "info"
    );


    try {

      const {
        data,
        error
      } = await client
        .from("bao_cao_ngay")
        .select("*")
        .order("created_at", {
          ascending: false
        });


      if (error) {

        console.error(error);

        showManagerMessage(
          "❌ Không tải được báo cáo: " +
          error.message,
          "error"
        );

        return;

      }


      reports = data || [];


      applyFilters();


      showManagerMessage(
        "✅ Đã cập nhật dữ liệu.",
        "success"
      );


    } catch (err) {

      console.error(err);

      showManagerMessage(
        "❌ Lỗi: " + err.message,
        "error"
      );

    }

  }


  // ==========================================================
  // LỌC
  // ==========================================================

  function applyFilters() {

    const userKeyword =
      $("filterUser")?.value
        .trim()
        .toLowerCase() || "";


    const date =
      $("filterDate")?.value || "";


    filteredReports =
      reports.filter(report => {

        const userName =
          String(
            report.user_name ??
            report.username ??
            report.cad_bo ??
            ""
          )
          .toLowerCase();


        const fieldDate =
          String(
            report.field_date ??
            report.date ??
            ""
          )
          .substring(0, 10);


        const matchUser =
          !userKeyword ||
          userName.includes(userKeyword);


        const matchDate =
          !date ||
          fieldDate === date;


        return matchUser && matchDate;

      });


    renderStats();

    renderTable();

    renderPagination();

    renderSubmittedUserCount();

  }


  // ==========================================================
  // STATS
  // ==========================================================

  function renderStats() {

    const total =
      filteredReports.length;


    let totalAmount = 0;


    filteredReports.forEach(report => {

      totalAmount += getAmount(report);

    });


    if ($("totalReports")) {

      $("totalReports").textContent =
        total;

    }


    if ($("totalAmount")) {

      $("totalAmount").textContent =
        formatMoney(totalAmount) + " đ";

    }

  }


  // ==========================================================
  // LẤY DỰ THU
  // ==========================================================

  function getAmount(report) {

    const value =
      report.expected_amount ??
      report.amount ??
      report.du_thu ??
      0;


    if (typeof value === "number") {

      return value;

    }


    return Number(
      String(value)
        .replace(/[^\d.-]/g, "")
    ) || 0;

  }


  // ==========================================================
  // FORMAT TIỀN
  // ==========================================================

  function formatMoney(value) {

    return Number(value || 0)
      .toLocaleString("vi-VN");

  }


  // ==========================================================
  // RENDER TABLE
  // ==========================================================

  function renderTable() {

    const tbody = $("tableBody");

    if (!tbody) return;


    const start =
      (currentPage - 1) * pageSize;


    const end =
      start + pageSize;


    const pageData =
      filteredReports.slice(
        start,
        end
      );


    if (!pageData.length) {

      tbody.innerHTML = `
        <tr>
          <td colspan="10"
              style="text-align:center;padding:25px">
            Không có dữ liệu.
          </td>
        </tr>
      `;

      return;

    }


    tbody.innerHTML =
      pageData.map(report => {

        const userName =
          report.user_name ??
          report.username ??
          report.cad_bo ??
          "";


        const fieldDate =
          formatDate(
            report.field_date ??
            report.date
          );


        const cif =
          report.cif ?? "";


        const customerName =
          report.customer_name ??
          report.customer ??
          "";


        const result =
          report.result ?? "";


        const connection =
          report.connection ?? "";


        const detail =
          report.detail ??
          report.result_detail ??
          "";


        const nextAction =
          report.next_action ??
          "";


        const amount =
          getAmount(report);


        return `
          <tr>

            <td>${escapeHTML(userName)}</td>

            <td>${escapeHTML(fieldDate)}</td>

            <td>${escapeHTML(cif)}</td>

            <td>${escapeHTML(customerName)}</td>

            <td>${escapeHTML(result)}</td>

            <td>${escapeHTML(connection)}</td>

            <td style="white-space:normal;min-width:250px">
              ${escapeHTML(detail)}
            </td>

            <td>
              ${formatMoney(amount)} đ
            </td>

            <td style="white-space:normal;min-width:250px">
              ${escapeHTML(nextAction)}
            </td>

            <td>

              <button
                class="edit-btn"
                onclick="window.managerEditReport('${report.id}')"
                type="button">
                ✏️ Sửa
              </button>

              <button
                class="delete-btn"
                onclick="window.managerDeleteReport('${report.id}')"
                type="button">
                🗑️ Xóa
              </button>

            </td>

          </tr>
        `;

      }).join("");

  }


  // ==========================================================
  // FORMAT DATE
  // ==========================================================

  function formatDate(value) {

    if (!value) return "";

    const str =
      String(value)
        .substring(0, 10);


    if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) {

      return String(value);

    }


    const [y, m, d] =
      str.split("-");


    return `${d}/${m}/${y}`;

  }


  // ==========================================================
  // PAGINATION
  // ==========================================================

  function renderPagination() {

    const box =
      $("pagination");


    if (!box) return;


    const totalPages =
      Math.ceil(
        filteredReports.length /
        pageSize
      );


    if (totalPages <= 1) {

      box.innerHTML = "";

      return;

    }


    let html = "";


    html += `
      <button
        class="arrow"
        ${currentPage === 1 ? "disabled" : ""}
        onclick="window.managerGoPage(${currentPage - 1})">
        ‹
      </button>
    `;


    for (
      let i = 1;
      i <= totalPages;
      i++
    ) {

      html += `
        <button
          class="${i === currentPage ? "active" : ""}"
          onclick="window.managerGoPage(${i})">
          ${i}
        </button>
      `;

    }


    html += `
      <button
        class="arrow"
        ${currentPage === totalPages ? "disabled" : ""}
        onclick="window.managerGoPage(${currentPage + 1})">
        ›
      </button>
    `;


    box.innerHTML = html;

  }


  // ==========================================================
  // CHUYỂN TRANG
  // ==========================================================

  window.managerGoPage = function(page) {

    const totalPages =
      Math.ceil(
        filteredReports.length /
        pageSize
      );


    if (
      page < 1 ||
      page > totalPages
    ) {

      return;

    }


    currentPage = page;

    renderTable();

    renderPagination();

  };


  // ==========================================================
  // SỬA BÁO CÁO
  // ==========================================================

  window.managerEditReport = function(id) {

    const report =
      reports.find(
        r => String(r.id) === String(id)
      );


    if (!report) {

      alert("❌ Không tìm thấy báo cáo.");

      return;

    }


    editingReportId =
      report.id;


    const currentAmount =
      getAmount(report);


    const overlay =
      document.createElement("div");


    overlay.className =
      "edit-modal-overlay";


    overlay.id =
      "dynamicEditModal";


    overlay.innerHTML = `

      <div class="edit-modal">

        <h2>✏️ Sửa dự thu</h2>

        <p style="margin-bottom:12px;color:#64748b">
          Cán bộ:
          <b>${escapeHTML(
            report.user_name ??
            report.username ??
            ""
          )}</b>
        </p>

        <p style="margin-bottom:12px;color:#64748b">
          CIF:
          <b>${escapeHTML(
            report.cif ?? ""
          )}</b>
        </p>

        <input
          id="editAmountInput"
          type="text"
          inputmode="numeric"
          value="${currentAmount.toLocaleString("vi-VN")}"
          placeholder="Nhập dự thu"
        >

        <div class="edit-modal-buttons">

          <button
            class="edit-save-btn"
            id="editSaveBtn">
            💾 Lưu
          </button>

          <button
            class="edit-cancel-btn"
            id="editCancelBtn">
            Hủy
          </button>

        </div>

      </div>
    `;


    document.body.appendChild(overlay);


    const input =
      $("editAmountInput");


    input?.addEventListener(
      "input",
      () => {

        let value =
          input.value.replace(
            /[^\d]/g,
            ""
          );


        if (value) {

          input.value =
            Number(value)
              .toLocaleString("vi-VN");

        }

      }
    );


    $("editCancelBtn")
      ?.addEventListener(
        "click",
        closeEditModal
      );


    $("editSaveBtn")
      ?.addEventListener(
        "click",
        saveEditReport
      );


    input?.focus();

  };


  // ==========================================================
  // LƯU SỬA
  // ==========================================================

  async function saveEditReport() {

    const input =
      $("editAmountInput");


    if (!input || !editingReportId) {

      return;

    }


    const amount =
      Number(
        input.value.replace(
          /[^\d]/g,
          ""
        )
      ) || 0;


    const btn =
      $("editSaveBtn");


    if (btn) {

      btn.disabled = true;

      btn.textContent =
        "⏳ Đang lưu...";

    }


    try {

      // Đúng tên cột của trang nhân viên
      const {
        error
      } = await client
        .from("bao_cao_ngay")
        .update({
          expected_amount: amount
        })
        .eq("id", editingReportId);


      if (error) {

        console.error(error);

        alert(
          "❌ Không thể sửa: " +
          error.message
        );

        return;

      }


      closeEditModal();

      await loadReports();


    } catch (err) {

      console.error(err);

      alert(
        "❌ Lỗi: " +
        err.message
      );

    } finally {

      if (btn) {

        btn.disabled = false;

        btn.textContent = "💾 Lưu";

      }

    }

  }


  // ==========================================================
  // ĐÓNG MODAL EDIT
  // ==========================================================

  function closeEditModal() {

    $("dynamicEditModal")?.remove();

    editingReportId = null;

  }


  // ==========================================================
  // XÓA
  // ==========================================================

  window.managerDeleteReport = async function(id) {

    const report =
      reports.find(
        r => String(r.id) === String(id)
      );


    if (!report) return;


    const name =
      report.customer_name ??
      report.cif ??
      "báo cáo này";


    if (
      !confirm(
        `Bạn có chắc muốn xóa báo cáo của ${name}?`
      )
    ) {

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

        console.error(error);

        alert(
          "❌ Xóa thất bại: " +
          error.message
        );

        return;

      }


      alert("✅ Đã xóa báo cáo.");

      await loadReports();


    } catch (err) {

      console.error(err);

      alert(
        "❌ Lỗi: " +
        err.message
      );

    }

  };


  // ==========================================================
  // DANH SÁCH CÁN BỘ
  // ==========================================================

  function getSubmittedUsers() {

    const names =
      reports
        .map(report =>
          String(
            report.user_name ??
            report.username ??
            report.cad_bo ??
            ""
          ).trim()
        )
        .filter(Boolean);


    return [
      ...new Set(names)
    ].sort(
      (a, b) =>
        a.localeCompare(
          b,
          "vi"
        )
    );

  }


  // ==========================================================
  // COUNT CÁN BỘ
  // ==========================================================

  function renderSubmittedUserCount() {

    const count =
      getSubmittedUsers().length;


    if ($("submittedUserCount")) {

      $("submittedUserCount")
        .textContent = count;

    }

  }


  // ==========================================================
  // HIỆN CÁN BỘ
  // ==========================================================

  function showSubmittedUsers() {

    const users =
      getSubmittedUsers();


    const overlay =
      document.createElement("div");


    overlay.className =
      "user-modal-overlay";


    overlay.id =
      "submittedUsersModal";


    overlay.innerHTML = `

      <div class="user-modal">

        <div class="user-modal-header">

          <h2>
            👥 Cán bộ đã nhập báo cáo
          </h2>

          <button
            class="user-modal-close"
            id="submittedUsersClose"
            type="button">
            ×
          </button>

        </div>

        <div class="user-modal-body">

          ${
            users.length

              ? users.map(
                  (user, index) => `

                    <div
                      class="submitted-user-item">

                      <div
                        class="submitted-user-number">
                        ${index + 1}
                      </div>

                      <div>
                        ${escapeHTML(user)}
                      </div>

                    </div>

                  `
                ).join("")

              : `
                <div class="no-user">
                  Chưa có cán bộ nào nhập báo cáo.
                </div>
              `
          }

        </div>

      </div>

    `;


    document.body.appendChild(overlay);


    $("submittedUsersClose")
      ?.addEventListener(
        "click",
        () => overlay.remove()
      );


    overlay.addEventListener(
      "click",
      e => {

        if (e.target === overlay) {

          overlay.remove();

        }

      }
    );

  }


  // ==========================================================
  // MENU
  // ==========================================================

  function openMenu() {

    $("sideMenu")?.classList.add("open");

    $("sideMenuOverlay")
      ?.classList.add("open");

  }


  function closeMenu() {

    $("sideMenu")?.classList.remove("open");

    $("sideMenuOverlay")
      ?.classList.remove("open");

  }


  // ==========================================================
  // PHÂN QUYỀN
  // ==========================================================

  function openPermission() {

    closeMenu();


    alert(
      "🔐 Chức năng phân quyền đang chờ kết nối với bảng phân quyền Supabase."
    );

  }


  // ==========================================================
  // XUẤT EXCEL
  // ==========================================================

  function exportExcel() {

    if (
      typeof XLSX === "undefined"
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


    const exportData =
      filteredReports.map(report => ({

        "Cán bộ":
          report.user_name ??
          report.username ??
          report.cad_bo ??
          "",

        "Ngày field":
          formatDate(
            report.field_date ??
            report.date
          ),

        "Số CIF":
          report.cif ?? "",

        "Tên khách hàng":
          report.customer_name ??
          "",

        "Kết quả":
          report.result ?? "",

        "Kết nối":
          report.connection ?? "",

        "Kết quả chi tiết":
          report.detail ??
          report.result_detail ??
          "",

        "Dự thu":
          getAmount(report),

        "Hướng tác động tiếp theo":
          report.next_action ??
          ""

      }));


    const worksheet =
      XLSX.utils.json_to_sheet(
        exportData
      );


    const workbook =
      XLSX.utils.book_new();


    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Báo cáo ngày"
    );


    const now =
      new Date();


    const filename =
      `Bao_Cao_Ngay_${
        now.getFullYear()
      }_${
        String(
          now.getMonth() + 1
        ).padStart(2, "0")
      }_${
        String(
          now.getDate()
        ).padStart(2, "0")
      }.xlsx`;


    XLSX.writeFile(
      workbook,
      filename
    );

  }


  // ==========================================================
  // LOGOUT
  // ==========================================================

  async function logout() {

    if (
      !confirm(
        "Bạn có chắc muốn đăng xuất?"
      )
    ) {

      return;

    }


    try {

      const {
        error
      } = await client.auth.signOut();


      if (error) {

        alert(
          "❌ Đăng xuất thất bại: " +
          error.message
        );

        return;

      }


      currentUser = null;

      reports = [];

      filteredReports = [];


      closeMenu();


      $("managerBox").style.display =
        "none";


      $("menuBtn").style.display =
        "none";


      showLogin();


      showLoginMessage(
        "Đã đăng xuất.",
        "success"
      );


    } catch (err) {

      console.error(err);

      alert(
        "❌ " + err.message
      );

    }

  }


  // ==========================================================
  // MANAGER MESSAGE
  // ==========================================================

  function showManagerMessage(
    message,
    type
  ) {

    const el =
      $("managerMessage");


    if (!el) return;


    el.textContent =
      message;


    if (type === "error") {

      el.style.color =
        "#dc2626";

    } else if (
      type === "success"
    ) {

      el.style.color =
        "#16a34a";

    } else {

      el.style.color =
        "#2563eb";

    }

  }


  // ==========================================================
  // ESCAPE HTML
  // ==========================================================

  function escapeHTML(value) {

    if (value == null) {

      return "";

    }


    return String(value)

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

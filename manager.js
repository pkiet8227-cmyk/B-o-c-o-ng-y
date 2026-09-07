// ============================================================
// MANAGER.JS
// QUẢN LÝ BÁO CÁO NGÀY
// PHIÊN BẢN HOÀN CHỈNH
// ============================================================

(() => {
  "use strict";

  // ==========================================================
  // KIỂM TRA SUPABASE
  // ==========================================================

  if (!window.supabase) {
    alert("❌ Không tải được Supabase.");
    return;
  }

  if (
    !window.SUPABASE_URL ||
    !window.SUPABASE_ANON_KEY
  ) {
    alert("❌ Chưa cấu hình Supabase trong config.js");
    return;
  }

  const client = window.supabase.createClient(
    window.SUPABASE_URL,
    window.SUPABASE_ANON_KEY
  );

  // ==========================================================
  // DATA
  // ==========================================================

  let currentUser = null;

  let allReports = [];
  let filteredReports = [];

  let currentPage = 1;

  const pageSize = 10;

  let editingReportId = null;

  // ==========================================================
  // ELEMENTS
  // ==========================================================

  let loginBox;
  let managerBox;

  let loginId;
  let password;
  let loginBtn;
  let loginMessage;

  let menuBtn;
  let sideMenu;
  let sideMenuOverlay;
  let sideMenuClose;

  let menuReportsBtn;
  let menuPermissionBtn;
  let menuLogoutBtn;

  let logoutBtn;

  let totalReports;
  let totalAmount;

  let filterUser;
  let filterDate;
  let filterBtn;
  let refreshBtn;
  let exportBtn;

  let showSubmittedUsersBtn;
  let submittedUserCount;

  let tableBody;
  let pagination;

  let managerMessage;

  // ==========================================================
  // INIT ELEMENTS
  // ==========================================================

  function initElements() {

    loginBox =
      document.getElementById("loginBox");

    managerBox =
      document.getElementById("managerBox");

    loginId =
      document.getElementById("loginId");

    password =
      document.getElementById("password");

    loginBtn =
      document.getElementById("loginBtn");

    loginMessage =
      document.getElementById("loginMessage");

    menuBtn =
      document.getElementById("menuBtn");

    sideMenu =
      document.getElementById("sideMenu");

    sideMenuOverlay =
      document.getElementById("sideMenuOverlay");

    sideMenuClose =
      document.getElementById("sideMenuClose");

    menuReportsBtn =
      document.getElementById("menuReportsBtn");

    menuPermissionBtn =
      document.getElementById("menuPermissionBtn");

    menuLogoutBtn =
      document.getElementById("menuLogoutBtn");

    logoutBtn =
      document.getElementById("logoutBtn");

    totalReports =
      document.getElementById("totalReports");

    totalAmount =
      document.getElementById("totalAmount");

    filterUser =
      document.getElementById("filterUser");

    filterDate =
      document.getElementById("filterDate");

    filterBtn =
      document.getElementById("filterBtn");

    refreshBtn =
      document.getElementById("refreshBtn");

    exportBtn =
      document.getElementById("exportBtn");

    showSubmittedUsersBtn =
      document.getElementById("showSubmittedUsersBtn");

    submittedUserCount =
      document.getElementById("submittedUserCount");

    tableBody =
      document.getElementById("tableBody");

    pagination =
      document.getElementById("pagination");

    managerMessage =
      document.getElementById("managerMessage");
  }

  // ==========================================================
  // INIT
  // ==========================================================

  async function initManager() {

    initElements();

    bindEvents();

    if (managerBox) {
      managerBox.style.display = "none";
    }

    if (menuBtn) {

      menuBtn.style.display = "none";

      menuBtn.style.position = "relative";

      menuBtn.style.zIndex = "100000";

      menuBtn.style.visibility = "visible";

      menuBtn.style.pointerEvents = "auto";
    }

    try {

      const {
        data,
        error
      } =
        await client.auth.getSession();

      if (error) {
        console.error(
          "GET SESSION ERROR:",
          error
        );

        showLogin();

        return;
      }

      const session =
        data?.session;

      if (
        session &&
        session.user
      ) {

        currentUser =
          session.user;

        const allowed =
          await checkManagerPermission();

        if (allowed) {

          await showManager();

        } else {

          await client.auth.signOut();

          currentUser = null;

          showLogin();
        }

      } else {

        showLogin();
      }

    } catch (error) {

      console.error(
        "INIT ERROR:",
        error
      );

      showLogin();
    }
  }

  // ==========================================================
  // EVENTS
  // ==========================================================

  function bindEvents() {

    // ========================================================
    // LOGIN
    // ========================================================

    if (loginBtn) {

      loginBtn.addEventListener(
        "click",
        login
      );
    }

    if (password) {

      password.addEventListener(
        "keydown",
        function (e) {

          if (e.key === "Enter") {
            login();
          }

        }
      );
    }

    if (loginId) {

      loginId.addEventListener(
        "keydown",
        function (e) {

          if (e.key === "Enter") {
            login();
          }

        }
      );
    }

    // ========================================================
    // MENU
    // ========================================================

    if (menuBtn) {

      menuBtn.onclick = function (e) {

        e.preventDefault();

        e.stopPropagation();

        openMenu();
      };
    }

    if (sideMenuClose) {

      sideMenuClose.onclick =
        function () {

          closeMenu();
        };
    }

    if (sideMenuOverlay) {

      sideMenuOverlay.onclick =
        function () {

          closeMenu();
        };
    }

    // ========================================================
    // MENU REPORTS
    // ========================================================

    if (menuReportsBtn) {

      menuReportsBtn.onclick =
        async function () {

          closeMenu();

          await showManager();
        };
    }

    // ========================================================
    // MENU PERMISSION
    // ========================================================

    if (menuPermissionBtn) {

      menuPermissionBtn.onclick =
        async function () {

          closeMenu();

          await openPermissionModal();
        };
    }

    // ========================================================
    // MENU LOGOUT
    // ========================================================

    if (menuLogoutBtn) {

      menuLogoutBtn.onclick =
        async function () {

          await logout();
        };
    }

    if (logoutBtn) {

      logoutBtn.onclick =
        async function () {

          await logout();
        };
    }

    // ========================================================
    // FILTER
    // ========================================================

    if (filterBtn) {

      filterBtn.onclick =
        function () {

          applyFilter();
        };
    }

    // ========================================================
    // REFRESH
    // ========================================================

    if (refreshBtn) {

      refreshBtn.onclick =
        async function () {

          if (filterUser) {
            filterUser.value = "";
          }

          if (filterDate) {
            filterDate.value = "";
          }

          await loadReports();
        };
    }

    // ========================================================
    // EXPORT
    // ========================================================

    if (exportBtn) {

      exportBtn.onclick =
        function () {

          exportExcel();
        };
    }

    // ========================================================
    // SUBMITTED USERS
    // ========================================================

    if (showSubmittedUsersBtn) {

      showSubmittedUsersBtn.onclick =
        function () {

          showSubmittedUsers();
        };
    }
  }

  // ==========================================================
  // LOGIN
  // ==========================================================

  async function login() {

    const identifier =
      (
        loginId?.value ||
        ""
      ).trim();

    const pass =
      password?.value ||
      "";

    if (!identifier) {

      setLoginMessage(
        "❌ Vui lòng nhập User hoặc Email.",
        "error"
      );

      loginId?.focus();

      return;
    }

    if (!pass) {

      setLoginMessage(
        "❌ Vui lòng nhập mật khẩu.",
        "error"
      );

      password?.focus();

      return;
    }

    if (loginBtn) {
      loginBtn.disabled = true;
    }

    setLoginMessage(
      "⏳ Đang đăng nhập...",
      "info"
    );

    try {

      // ======================================================
      // USER -> EMAIL
      // ======================================================

      let email =
        identifier;

      if (!identifier.includes("@")) {

        const result =
          await callManagerFunction(
            "resolve",
            {
              identifier
            },
            false
          );

        if (!result.success) {

          throw new Error(
            result.error ||
            "Không tìm thấy tài khoản."
          );
        }

        email =
          result.auth_email;

        if (!email) {

          throw new Error(
            "Không xác định được email."
          );
        }
      }

      // ======================================================
      // SUPABASE LOGIN
      // ======================================================

      const {
        data,
        error
      } =
        await client.auth.signInWithPassword({
          email,
          password: pass
        });

      if (error) {
        throw error;
      }

      if (!data?.user) {

        throw new Error(
          "Không nhận được thông tin tài khoản."
        );
      }

      currentUser =
        data.user;

      // ======================================================
      // CHECK MANAGER
      // ======================================================

      const allowed =
        await checkManagerPermission();

      if (!allowed) {

        await client.auth.signOut();

        currentUser = null;

        throw new Error(
          "Tài khoản này chưa được cấp quyền quản lý."
        );
      }

      if (password) {
        password.value = "";
      }

      setLoginMessage(
        "",
        "info"
      );

      await showManager();

    } catch (error) {

      console.error(
        "LOGIN ERROR:",
        error
      );

      setLoginMessage(
        "❌ " +
        (
          error?.message ||
          "Đăng nhập thất bại."
        ),
        "error"
      );

    } finally {

      if (loginBtn) {
        loginBtn.disabled = false;
      }
    }
  }

  // ==========================================================
  // CHECK MANAGER
  // ==========================================================

  async function checkManagerPermission() {

    try {

      const {
        data,
        error
      } =
        await client.rpc(
          "is_manager"
        );

      if (error) {

        console.error(
          "IS MANAGER ERROR:",
          error
        );

        return false;
      }

      return data === true;

    } catch (error) {

      console.error(
        "CHECK MANAGER ERROR:",
        error
      );

      return false;
    }
  }

  // ==========================================================
  // SHOW LOGIN
  // ==========================================================

  function showLogin() {

    if (loginBox) {
      loginBox.style.display = "block";
    }

    if (managerBox) {
      managerBox.style.display = "none";
    }

    if (menuBtn) {

      menuBtn.style.display =
        "none";
    }

    closeMenu();
  }

  // ==========================================================
  // SHOW MANAGER
  // ==========================================================

  async function showManager() {

    if (!currentUser) {

      const {
        data
      } =
        await client.auth.getUser();

      currentUser =
        data?.user ||
        null;
    }

    if (!currentUser) {

      showLogin();

      return;
    }

    if (loginBox) {
      loginBox.style.display = "none";
    }

    if (managerBox) {
      managerBox.style.display = "block";
    }

    if (menuBtn) {

      menuBtn.style.display =
        "flex";

      menuBtn.style.visibility =
        "visible";

      menuBtn.style.pointerEvents =
        "auto";

      menuBtn.style.position =
        "relative";

      menuBtn.style.zIndex =
        "100000";
    }

    await loadReports();
  }

  // ==========================================================
  // OPEN MENU
  // ==========================================================

  function openMenu() {

    if (!sideMenu ||
        !sideMenuOverlay) {

      console.error(
        "SIDE MENU ELEMENT NOT FOUND"
      );

      return;
    }

    sideMenu.classList.add(
      "open"
    );

    sideMenuOverlay.classList.add(
      "open"
    );

    document.body.style.overflow =
      "hidden";
  }

  // ==========================================================
  // CLOSE MENU
  // ==========================================================

  function closeMenu() {

    if (sideMenu) {

      sideMenu.classList.remove(
        "open"
      );
    }

    if (sideMenuOverlay) {

      sideMenuOverlay.classList.remove(
        "open"
      );
    }

    document.body.style.overflow =
      "";
  }

  // ==========================================================
  // LOAD REPORTS
  // ==========================================================

  async function loadReports() {

    if (!currentUser) {
      return;
    }

    showManagerMessage(
      "⏳ Đang tải dữ liệu...",
      "info"
    );

    try {

      const {
        data,
        error
      } =
        await client
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

      allReports =
        Array.isArray(data)
          ? data
          : [];

      filteredReports =
        [...allReports];

      currentPage = 1;

      updateStats();

      renderTable();

      updateSubmittedUserCount();

      showManagerMessage(
        "",
        "info"
      );

    } catch (error) {

      console.error(
        "LOAD REPORTS ERROR:",
        error
      );

      showManagerMessage(
        "❌ Không tải được báo cáo: " +
        (
          error?.message ||
          "Lỗi không xác định"
        ),
        "error"
      );
    }
  }

  // ==========================================================
  // FILTER
  // ==========================================================

  function applyFilter() {

    const userKeyword =
      (
        filterUser?.value ||
        ""
      )
        .trim()
        .toLowerCase();

    const dateKeyword =
      (
        filterDate?.value ||
        ""
      ).trim();

    filteredReports =
      allReports.filter(
        report => {

          const userText =
            getReportUser(
              report
            ).toLowerCase();

          const userOK =
            !userKeyword ||
            userText.includes(
              userKeyword
            );

          const reportDate =
            getReportDate(
              report
            );

          const dateOK =
            !dateKeyword ||
            reportDate ===
            dateKeyword;

          return (
            userOK &&
            dateOK
          );
        }
      );

    currentPage = 1;

    updateStats();

    renderTable();
  }

  // ==========================================================
  // GET USER
  // ==========================================================

  function getReportUser(report) {

    return String(
      report.user_name ??
      report.username ??
      report.full_name ??
      report.canh_bo ??
      report.can_bo ??
      report.ho_ten ??
      report.email ??
      report.user_email ??
      report.user_id ??
      ""
    );
  }

  // ==========================================================
  // GET DATE
  // ==========================================================

  function getReportDate(report) {

    const value =
      report.field_date ??
      report.ngay_field ??
      report.fieldDate ??
      report.date ??
      report.report_date ??
      report.created_at ??
      "";

    if (!value) {
      return "";
    }

    if (
      typeof value === "string" &&
      /^\d{4}-\d{2}-\d{2}/.test(
        value
      )
    ) {

      return value.substring(
        0,
        10
      );
    }

    try {

      const d =
        new Date(value);

      if (
        isNaN(
          d.getTime()
        )
      ) {

        return String(
          value
        );
      }

      return [
        d.getFullYear(),
        String(
          d.getMonth() + 1
        ).padStart(2, "0"),
        String(
          d.getDate()
        ).padStart(2, "0")
      ].join("-");

    } catch {

      return String(
        value
      );
    }
  }

  // ==========================================================
  // GET AMOUNT
  // ==========================================================

  function getReportAmount(report) {

    const value =
      report.amount ??
      report.du_thu ??
      report.duthu ??
      report.duThu ??
      report.expected_amount ??
      report.expectedAmount ??
      0;

    if (
      typeof value ===
      "number"
    ) {

      return value;
    }

    if (
      typeof value ===
      "string"
    ) {

      const cleaned =
        value.replace(
          /[^\d.-]/g,
          ""
        );

      const number =
        Number(
          cleaned
        );

      return isNaN(number)
        ? 0
        : number;
    }

    return 0;
  }

  // ==========================================================
  // STATS
  // ==========================================================

  function updateStats() {

    if (totalReports) {

      totalReports.textContent =
        filteredReports.length
          .toLocaleString(
            "vi-VN"
          );
    }

    const total =
      filteredReports.reduce(
        (
          sum,
          report
        ) => {

          return (
            sum +
            getReportAmount(
              report
            )
          );

        },
        0
      );

    if (totalAmount) {

      totalAmount.textContent =
        formatMoney(
          total
        );
    }
  }

  // ==========================================================
  // TABLE
  // ==========================================================

  function renderTable() {

    if (!tableBody) {
      return;
    }

    tableBody.innerHTML = "";

    if (!filteredReports.length) {

      tableBody.innerHTML = `
        <tr>
          <td
            colspan="10"
            style="
              text-align:center;
              padding:30px;
              color:#64748b;
              font-weight:bold;
            "
          >
            Không có dữ liệu
          </td>
        </tr>
      `;

      renderPagination();

      return;
    }

    const start =
      (
        currentPage - 1
      ) * pageSize;

    const end =
      start + pageSize;

    const pageData =
      filteredReports.slice(
        start,
        end
      );

    pageData.forEach(
      report => {

        const tr =
          document.createElement(
            "tr"
          );

        const user =
          getReportUser(
            report
          );

        const date =
          getReportDate(
            report
          );

        const cif =
          report.cif ??
          report.so_cif ??
          report.cif_number ??
          "";

        const customerName =
          report.customer_name ??
          report.ten_khach_hang ??
          report.customer ??
          report.ho_ten_khach_hang ??
          "";

        const result =
          report.result ??
          report.ket_qua ??
          "";

        const connection =
          report.connection ??
          report.ket_noi ??
          "";

        const detail =
          report.detail_result ??
          report.ket_qua_chi_tiet ??
          report.result_detail ??
          report.chi_tiet ??
          "";

        const amount =
          getReportAmount(
            report
          );

        const nextAction =
          report.next_action ??
          report.huong_tac_dong_tiep_theo ??
          report.huong_tac_dong ??
          "";

        tr.innerHTML = `

          <td>
            ${escapeHtml(user)}
          </td>

          <td>
            ${escapeHtml(
              formatDisplayDate(
                date
              )
            )}
          </td>

          <td>
            ${escapeHtml(cif)}
          </td>

          <td>
            ${escapeHtml(
              customerName
            )}
          </td>

          <td>
            ${escapeHtml(result)}
          </td>

          <td>
            ${escapeHtml(connection)}
          </td>

          <td>
            ${escapeHtml(detail)}
          </td>

          <td>
            ${escapeHtml(
              formatMoney(
                amount
              )
            )}
          </td>

          <td>
            ${escapeHtml(
              nextAction
            )}
          </td>

          <td>

            <button
              class="edit-btn"
              type="button"
              data-action="edit"
            >
              ✏️ Sửa
            </button>

            <button
              class="delete-btn"
              type="button"
              data-action="delete"
            >
              🗑️ Xóa
            </button>

          </td>
        `;

        const editButton =
          tr.querySelector(
            '[data-action="edit"]'
          );

        const deleteButton =
          tr.querySelector(
            '[data-action="delete"]'
          );

        if (editButton) {

          editButton.onclick =
            function () {

              openEditModal(
                report
              );
            };
        }

        if (deleteButton) {

          deleteButton.onclick =
            function () {

              deleteReport(
                report
              );
            };
        }

        tableBody.appendChild(
          tr
        );
      }
    );

    renderPagination();
  }

  // ==========================================================
  // PAGINATION
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

    const prev =
      document.createElement(
        "button"
      );

    prev.className =
      "arrow";

    prev.textContent =
      "‹";

    prev.disabled =
      currentPage === 1;

    prev.onclick =
      function () {

        if (
          currentPage > 1
        ) {

          currentPage--;

          renderTable();

          scrollToTable();
        }
      };

    pagination.appendChild(
      prev
    );

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

    if (
      endPage - startPage < 4
    ) {

      if (
        startPage === 1
      ) {

        endPage =
          Math.min(
            totalPages,
            5
          );

      } else {

        startPage =
          Math.max(
            1,
            totalPages - 4
          );
      }
    }

    for (
      let i = startPage;
      i <= endPage;
      i++
    ) {

      const button =
        document.createElement(
          "button"
        );

      button.textContent =
        i;

      if (
        i === currentPage
      ) {

        button.classList.add(
          "active"
        );
      }

      button.onclick =
        function () {

          currentPage =
            i;

          renderTable();

          scrollToTable();
        };

      pagination.appendChild(
        button
      );
    }

    const next =
      document.createElement(
        "button"
      );

    next.className =
      "arrow";

    next.textContent =
      "›";

    next.disabled =
      currentPage ===
      totalPages;

    next.onclick =
      function () {

        if (
          currentPage <
          totalPages
        ) {

          currentPage++;

          renderTable();

          scrollToTable();
        }
      };

    pagination.appendChild(
      next
    );
  }

  // ==========================================================
  // SCROLL
  // ==========================================================

  function scrollToTable() {

    const table =
      document.querySelector(
        ".table-wrap"
      );

    if (table) {

      table.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  }

  // ==========================================================
  // EDIT MODAL
  // ==========================================================

  function openEditModal(
    report
  ) {

    editingReportId =
      report.id;

    const currentAmount =
      getReportAmount(
        report
      );

    const overlay =
      document.createElement(
        "div"
      );

    overlay.className =
      "edit-modal-overlay";

    overlay.id =
      "dynamicEditModal";

    overlay.innerHTML = `

      <div class="edit-modal">

        <h2>
          ✏️ Sửa báo cáo
        </h2>

        <div
          style="
            display:grid;
            gap:12px;
          "
        >

          <div>

            <label
              style="
                display:block;
                font-weight:800;
                margin-bottom:6px;
              "
            >
              Dự thu
            </label>

            <input
              id="editAmount"
              type="number"
              inputmode="numeric"
              value="${escapeAttribute(
                currentAmount
              )}"
              placeholder="Nhập dự thu"
            >

          </div>

        </div>

        <div
          class="edit-modal-buttons"
        >

          <button
            id="editCancelBtn"
            class="edit-cancel-btn"
            type="button"
          >
            HỦY
          </button>

          <button
            id="editSaveBtn"
            class="edit-save-btn"
            type="button"
          >
            💾 LƯU
          </button>

        </div>

        <div
          id="editMessage"
          style="
            margin-top:12px;
            text-align:center;
            font-weight:bold;
          "
        ></div>

      </div>
    `;

    document.body.appendChild(
      overlay
    );

    const cancelBtn =
      document.getElementById(
        "editCancelBtn"
      );

    const saveBtn =
      document.getElementById(
        "editSaveBtn"
      );

    if (cancelBtn) {

      cancelBtn.onclick =
        closeEditModal;
    }

    if (saveBtn) {

      saveBtn.onclick =
        function () {

          saveEditReport(
            report
          );
        };
    }

    overlay.onclick =
      function (e) {

        if (
          e.target === overlay
        ) {

          closeEditModal();
        }
      };
  }

  // ==========================================================
  // SAVE EDIT
  // ==========================================================

  async function saveEditReport(
    report
  ) {

    const input =
      document.getElementById(
        "editAmount"
      );

    const message =
      document.getElementById(
        "editMessage"
      );

    const saveBtn =
      document.getElementById(
        "editSaveBtn"
      );

    if (!input) {
      return;
    }

    const amount =
      Number(
        input.value
      );

    if (
      isNaN(amount) ||
      amount < 0
    ) {

      if (message) {

        message.textContent =
          "❌ Số tiền không hợp lệ.";

        message.style.color =
          "#dc2626";
      }

      return;
    }

    if (saveBtn) {
      saveBtn.disabled = true;
    }

    if (message) {

      message.textContent =
        "⏳ Đang lưu...";

      message.style.color =
        "#2563eb";
    }

    try {

      let updateData;

      if (
        Object.prototype.hasOwnProperty.call(
          report,
          "amount"
        )
      ) {

        updateData = {
          amount
        };

      } else if (
        Object.prototype.hasOwnProperty.call(
          report,
          "du_thu"
        )
      ) {

        updateData = {
          du_thu: amount
        };

      } else {

        updateData = {
          amount
        };
      }

      const {
        error
      } =
        await client
          .from("bao_cao_ngay")
          .update(
            updateData
          )
          .eq(
            "id",
            report.id
          );

      if (error) {
        throw error;
      }

      closeEditModal();

      await loadReports();

      showManagerMessage(
        "✅ Đã cập nhật báo cáo.",
        "success"
      );

    } catch (error) {

      console.error(
        "SAVE EDIT ERROR:",
        error
      );

      if (message) {

        message.textContent =
          "❌ " +
          (
            error?.message ||
            "Không thể lưu."
          );

        message.style.color =
          "#dc2626";
      }

    } finally {

      if (saveBtn) {
        saveBtn.disabled = false;
      }
    }
  }

  // ==========================================================
  // CLOSE EDIT
  // ==========================================================

  function closeEditModal() {

    const modal =
      document.getElementById(
        "dynamicEditModal"
      );

    if (modal) {
      modal.remove();
    }

    editingReportId =
      null;
  }

  // ==========================================================
  // DELETE
  // ==========================================================

  async function deleteReport(
    report
  ) {

    const name =
      getReportUser(
        report
      );

    const customer =
      report.customer_name ??
      report.ten_khach_hang ??
      "";

    const confirmed =
      confirm(
        `Bạn có chắc muốn xóa báo cáo này?\n\n` +
        `Cán bộ: ${name}\n` +
        `Khách hàng: ${customer}`
      );

    if (!confirmed) {
      return;
    }

    try {

      showManagerMessage(
        "⏳ Đang xóa...",
        "info"
      );

      const {
        error
      } =
        await client
          .from("bao_cao_ngay")
          .delete()
          .eq(
            "id",
            report.id
          );

      if (error) {
        throw error;
      }

      await loadReports();

      showManagerMessage(
        "✅ Đã xóa báo cáo.",
        "success"
      );

    } catch (error) {

      console.error(
        "DELETE ERROR:",
        error
      );

      showManagerMessage(
        "❌ Xóa thất bại: " +
        (
          error?.message ||
          "Lỗi"
        ),
        "error"
      );
    }
  }

  // ==========================================================
  // EXPORT EXCEL
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
      !filteredReports.length
    ) {

      alert(
        "Không có dữ liệu để xuất Excel."
      );

      return;
    }

    try {

      const rows =
        filteredReports.map(
          report => {

            return {

              "Cán bộ":
                getReportUser(
                  report
                ),

              "Ngày field":
                formatDisplayDate(
                  getReportDate(
                    report
                  )
                ),

              "Số CIF":
                report.cif ??
                report.so_cif ??
                report.cif_number ??
                "",

              "Tên khách hàng":
                report.customer_name ??
                report.ten_khach_hang ??
                report.customer ??
                "",

              "Kết quả":
                report.result ??
                report.ket_qua ??
                "",

              "Kết nối":
                report.connection ??
                report.ket_noi ??
                "",

              "Kết quả chi tiết":
                report.detail_result ??
                report.ket_qua_chi_tiet ??
                report.result_detail ??
                "",

              "Dự thu":
                getReportAmount(
                  report
                ),

              "Hướng tác động tiếp theo":
                report.next_action ??
                report.huong_tac_dong_tiep_theo ??
                report.huong_tac_dong ??
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
        "BaoCaoNgay"
      );

      const now =
        new Date();

      const filename =
        `BaoCaoNgay_${now.getFullYear()}-` +
        `${String(
          now.getMonth() + 1
        ).padStart(2, "0")}-` +
        `${String(
          now.getDate()
        ).padStart(2, "0")}.xlsx`;

      XLSX.writeFile(
        workbook,
        filename
      );

      showManagerMessage(
        "✅ Đã xuất Excel.",
        "success"
      );

    } catch (error) {

      console.error(
        "EXPORT ERROR:",
        error
      );

      alert(
        "❌ Xuất Excel thất bại."
      );
    }
  }

  // ==========================================================
  // COUNT USERS
  // ==========================================================

  function updateSubmittedUserCount() {

    const users =
      new Set();

    allReports.forEach(
      report => {

        const user =
          getReportUser(
            report
          ).trim();

        if (user) {
          users.add(
            user
          );
        }
      }
    );

    if (submittedUserCount) {

      submittedUserCount.textContent =
        users.size;
    }
  }

  // ==========================================================
  // SHOW USERS
  // ==========================================================

  function showSubmittedUsers() {

    const users =
      Array.from(
        new Set(
          allReports
            .map(
              report =>
                getReportUser(
                  report
                ).trim()
            )
            .filter(Boolean)
        )
      ).sort(
        (a, b) =>
          a.localeCompare(
            b,
            "vi"
          )
      );

    const overlay =
      document.createElement(
        "div"
      );

    overlay.className =
      "user-modal-overlay";

    overlay.id =
      "submittedUsersModal";

    let content = "";

    if (!users.length) {

      content = `
        <div class="no-user">
          Chưa có cán bộ nào nhập báo cáo.
        </div>
      `;

    } else {

      content =
        users
          .map(
            (
              user,
              index
            ) => {

              return `
                <div class="submitted-user-item">

                  <div
                    class="submitted-user-number"
                  >
                    ${index + 1}
                  </div>

                  <div>
                    ${escapeHtml(user)}
                  </div>

                </div>
              `;
            }
          )
          .join("");
    }

    overlay.innerHTML = `

      <div class="user-modal">

        <div class="user-modal-header">

          <h2>
            👥 CÁN BỘ ĐÃ NHẬP BÁO CÁO
          </h2>

          <button
            class="user-modal-close"
            id="submittedUsersClose"
            type="button"
          >
            ×
          </button>

        </div>

        <div class="user-modal-body">

          ${content}

        </div>

      </div>
    `;

    document.body.appendChild(
      overlay
    );

    const closeBtn =
      document.getElementById(
        "submittedUsersClose"
      );

    if (closeBtn) {

      closeBtn.onclick =
        function () {

          overlay.remove();
        };
    }

    overlay.onclick =
      function (e) {

        if (
          e.target === overlay
        ) {

          overlay.remove();
        }
      };
  }

  // ==========================================================
  // PERMISSION MODAL
  // ==========================================================

  async function openPermissionModal() {

    const oldModal =
      document.getElementById(
        "permissionModal"
      );

    if (oldModal) {
      oldModal.remove();
    }

    const overlay =
      document.createElement(
        "div"
      );

    overlay.className =
      "permission-modal-overlay";

    overlay.id =
      "permissionModal";

    overlay.innerHTML = `

      <div class="permission-modal">

        <div class="permission-header">

          <h2>
            🔐 PHÂN QUYỀN QUẢN LÝ
          </h2>

          <button
            class="permission-close"
            id="permissionClose"
            type="button"
          >
            ×
          </button>

        </div>

        <div class="permission-body">

          <div class="permission-info">

            Tại đây bạn có thể cấp quyền
            quản lý cho cán bộ.

            <br><br>

            Người được cấp quyền có thể
            đăng nhập trang quản lý và
            sử dụng đầy đủ chức năng
            giống tài khoản quản lý hiện tại.

            <br><br>

            <b>
              Mật khẩu được Supabase Auth
              quản lý, không lưu trực tiếp
              trong bảng phân quyền.
            </b>

          </div>

          <div class="permission-form">

            <label>
              User hoặc Email
            </label>

            <input
              id="permissionIdentifier"
              type="text"
              placeholder="Ví dụ: hoinv12 hoặc abc@gmail.com"
              autocomplete="off"
            >

            <label>
              Mật khẩu
            </label>

            <input
              id="permissionPassword"
              type="password"
              placeholder="Nhập mật khẩu"
              autocomplete="new-password"
            >

            <button
              id="grantPermissionBtn"
              class="green"
              type="button"
            >
              ✅ CẤP QUYỀN
            </button>

          </div>

          <div
            id="permissionMessage"
            style="
              margin-top:12px;
              text-align:center;
              font-weight:bold;
            "
          ></div>

          <div
            class="permission-list-title"
          >
            👥 Tài khoản đang được cấp quyền
          </div>

          <div id="permissionList">

            <div class="permission-empty">
              ⏳ Đang tải...
            </div>

          </div>

        </div>

      </div>
    `;

    document.body.appendChild(
      overlay
    );

    const closeBtn =
      document.getElementById(
        "permissionClose"
      );

    if (closeBtn) {

      closeBtn.onclick =
        function () {

          overlay.remove();
        };
    }

    overlay.onclick =
      function (e) {

        if (
          e.target === overlay
        ) {

          overlay.remove();
        }
      };

    const grantBtn =
      document.getElementById(
        "grantPermissionBtn"
      );

    if (grantBtn) {

      grantBtn.onclick =
        function () {

          grantPermission();
        };
    }

    await loadPermissionList();
  }

  // ==========================================================
  // GRANT PERMISSION
  // ==========================================================

  async function grantPermission() {

    const identifierInput =
      document.getElementById(
        "permissionIdentifier"
      );

    const passwordInput =
      document.getElementById(
        "permissionPassword"
      );

    const button =
      document.getElementById(
        "grantPermissionBtn"
      );

    const identifier =
      (
        identifierInput?.value ||
        ""
      ).trim();

    const pass =
      passwordInput?.value ||
      "";

    if (!identifier) {

      setPermissionMessage(
        "❌ Vui lòng nhập User hoặc Email.",
        "error"
      );

      identifierInput?.focus();

      return;
    }

    if (!pass) {

      setPermissionMessage(
        "❌ Vui lòng nhập mật khẩu.",
        "error"
      );

      passwordInput?.focus();

      return;
    }

    if (button) {
      button.disabled = true;
    }

    setPermissionMessage(
      "⏳ Đang cấp quyền...",
      "info"
    );

    try {

      const result =
        await callManagerFunction(
          "grant",
          {
            identifier: identifier,
            password: pass
          },
          true
        );

      console.log(
        "GRANT RESULT:",
        result
      );

      if (!result.success) {

        throw new Error(
          result.error ||
          "Không thể cấp quyền."
        );
      }

      if (passwordInput) {
        passwordInput.value = "";
      }

      setPermissionMessage(
        "✅ Đã cấp quyền thành công.",
        "success"
      );

      await loadPermissionList();

    } catch (error) {

      console.error(
        "GRANT PERMISSION ERROR:",
        error
      );

      let message =
        error?.message ||
        "Cấp quyền thất bại.";

      if (
        message ===
        "Failed to fetch"
      ) {

        message =
          "Không kết nối được Edge Function manager-permission. Hãy kiểm tra Edge Function đã Deploy chưa.";
      }

      setPermissionMessage(
        "❌ " + message,
        "error"
      );

    } finally {

      if (button) {
        button.disabled = false;
      }
    }
  }

  // ==========================================================
  // LOAD PERMISSION LIST
  // ==========================================================

  async function loadPermissionList() {

    const list =
      document.getElementById(
        "permissionList"
      );

    if (!list) {
      return;
    }

    list.innerHTML = `
      <div class="permission-empty">
        ⏳ Đang tải danh sách...
      </div>
    `;

    try {

      const result =
        await callManagerFunction(
          "list",
          {},
          true
        );

      console.log(
        "LIST PERMISSION RESULT:",
        result
      );

      if (!result.success) {

        throw new Error(
          result.error ||
          "Không thể tải danh sách."
        );
      }

      const users =
        Array.isArray(
          result.users
        )
          ? result.users
          : [];

      if (!users.length) {

        list.innerHTML = `
          <div class="permission-empty">
            Chưa có tài khoản được cấp quyền.
          </div>
        `;

        return;
      }

      list.innerHTML =
        users
          .map(
            user => {

              const identifier =
                user.display_identifier ||
                user.auth_email ||
                user.email ||
                "";

              const enabled =
                user.enabled === true;

              const isCurrent =
                currentUser &&
                user.auth_user_id ===
                currentUser.id;

              return `

                <div
                  class="permission-user"
                >

                  <div
                    class="permission-user-info"
                  >

                    <div
                      class="permission-user-name"
                    >
                      ${escapeHtml(
                        identifier
                      )}
                    </div>

                    <div
                      style="
                        font-size:12px;
                        color:#64748b;
                        margin-top:2px;
                        word-break:break-all;
                      "
                    >
                      ${escapeHtml(
                        user.auth_email ||
                        user.email ||
                        ""
                      )}
                    </div>

                    <div
                      class="permission-user-status"
                      style="
                        color:${
                          enabled
                            ? "#16a34a"
                            : "#dc2626"
                        };
                      "
                    >
                      ${
                        enabled
                          ? "● Đang hoạt động"
                          : "● Đã khóa"
                      }
                    </div>

                  </div>

                  ${
                    isCurrent
                      ? `
                        <span
                          style="
                            color:#2563eb;
                            font-size:12px;
                            font-weight:900;
                            white-space:nowrap;
                          "
                        >
                          Tài khoản của bạn
                        </span>
                      `
                      : `
                        <button
                          class="revoke-btn"
                          type="button"
                          data-user-id="${escapeAttribute(
                            user.auth_user_id
                          )}"
                          data-identifier="${escapeAttribute(
                            identifier
                          )}"
                        >
                          🚫 Thu hồi
                        </button>
                      `
                  }

                </div>
              `;
            }
          )
          .join("");

      list
        .querySelectorAll(
          ".revoke-btn"
        )
        .forEach(
          button => {

            button.onclick =
              function () {

                revokePermission(
                  button.dataset.userId,
                  button.dataset.identifier
                );
              };
          }
        );

    } catch (error) {

      console.error(
        "LOAD PERMISSION LIST ERROR:",
        error
      );

      let message =
        error?.message ||
        "Không tải được danh sách.";

      if (
        message ===
        "Failed to fetch"
      ) {

        message =
          "Không kết nối được Edge Function manager-permission.";
      }

      list.innerHTML = `
        <div
          class="permission-empty"
          style="color:#dc2626;"
        >
          ❌ ${escapeHtml(message)}
        </div>
      `;
    }
  }

  // ==========================================================
  // REVOKE
  // ==========================================================

  async function revokePermission(
    userId,
    identifier
  ) {

    if (!userId) {
      return;
    }

    if (
      currentUser &&
      userId === currentUser.id
    ) {

      alert(
        "❌ Không thể thu hồi chính tài khoản đang đăng nhập."
      );

      return;
    }

    const confirmed =
      confirm(
        `Bạn có chắc muốn thu hồi quyền của:\n\n${identifier || userId}?`
      );

    if (!confirmed) {
      return;
    }

    try {

      const result =
        await callManagerFunction(
          "revoke",
          {
            auth_user_id: userId
          },
          true
        );

      if (!result.success) {

        throw new Error(
          result.error ||
          "Không thể thu hồi."
        );
      }

      alert(
        "✅ Đã thu hồi quyền."
      );

      await loadPermissionList();

    } catch (error) {

      console.error(
        "REVOKE ERROR:",
        error
      );

      alert(
        "❌ Thu hồi thất bại:\n" +
        (
          error?.message ||
          "Lỗi"
        )
      );
    }
  }

  // ==========================================================
  // EDGE FUNCTION
  // ==========================================================

  async function callManagerFunction(
    action,
    body = {},
    authenticated = true
  ) {

    try {

      // ======================================================
      // QUAN TRỌNG:
      // Dùng Supabase functions.invoke thay cho fetch()
      // ======================================================

      const payload = {
        action,
        ...body
      };

      const {
        data,
        error
      } =
        await client.functions.invoke(
          "manager-permission",
          {
            body: payload
          }
        );

      console.log(
        "MANAGER FUNCTION:",
        action,
        data,
        error
      );

      if (error) {

        // Supabase đôi khi trả lỗi FunctionsHttpError
        // nhưng body lỗi nằm trong context.response.

        let detail =
          error.message ||
          "Edge Function thất bại.";

        try {

          if (
            error.context &&
            error.context.response
          ) {

            const response =
              error.context.response;

            const text =
              await response.text();

            if (text) {

              try {

                const json =
                  JSON.parse(text);

                detail =
                  json.error ||
                  json.message ||
                  detail;

              } catch {

                detail =
                  text ||
                  detail;
              }
            }
          }

        } catch (parseError) {

          console.warn(
            "Không đọc được chi tiết Edge Function:",
            parseError
          );
        }

        throw new Error(
          detail
        );
      }

      if (!data) {

        return {
          success: true
        };
      }

      return data;

    } catch (error) {

      console.error(
        "MANAGER FUNCTION ERROR:",
        action,
        error
      );

      throw error;
    }
  }

  // ==========================================================
  // LOGOUT
  // ==========================================================

  async function logout() {

    closeMenu();

    try {

      await client.auth.signOut();

    } catch (error) {

      console.error(
        "LOGOUT ERROR:",
        error
      );
    }

    currentUser = null;

    allReports = [];

    filteredReports = [];

    currentPage = 1;

    showLogin();

    if (loginId) {
      loginId.value = "";
    }

    if (password) {
      password.value = "";
    }

    setLoginMessage(
      "✅ Đã đăng xuất.",
      "success"
    );
  }

  // ==========================================================
  // MESSAGE
  // ==========================================================

  function setLoginMessage(
    text,
    type = "info"
  ) {

    if (!loginMessage) {
      return;
    }

    loginMessage.textContent =
      text;

    loginMessage.style.color =
      getMessageColor(
        type
      );
  }

  function setPermissionMessage(
    text,
    type = "info"
  ) {

    const element =
      document.getElementById(
        "permissionMessage"
      );

    if (!element) {
      return;
    }

    element.textContent =
      text;

    element.style.color =
      getMessageColor(
        type
      );
  }

  function showManagerMessage(
    text,
    type = "info"
  ) {

    if (!managerMessage) {
      return;
    }

    managerMessage.textContent =
      text;

    managerMessage.style.color =
      getMessageColor(
        type
      );
  }

  function getMessageColor(
    type
  ) {

    if (
      type ===
      "error"
    ) {

      return "#dc2626";
    }

    if (
      type ===
      "success"
    ) {

      return "#16a34a";
    }

    return "#2563eb";
  }

  // ==========================================================
  // MONEY
  // ==========================================================

  function formatMoney(
    value
  ) {

    const number =
      Number(value) || 0;

    return (
      number.toLocaleString(
        "vi-VN"
      ) +
      " đ"
    );
  }

  // ==========================================================
  // DATE
  // ==========================================================

  function formatDisplayDate(
    value
  ) {

    if (!value) {
      return "";
    }

    const str =
      String(value);

    if (
      /^\d{4}-\d{2}-\d{2}$/.test(
        str
      )
    ) {

      const [
        y,
        m,
        d
      ] =
        str.split("-");

      return `${d}/${m}/${y}`;
    }

    if (
      /^\d{4}-\d{2}-\d{2}/.test(
        str
      )
    ) {

      const date =
        str.substring(
          0,
          10
        );

      const [
        y,
        m,
        d
      ] =
        date.split("-");

      return `${d}/${m}/${y}`;
    }

    return str;
  }

  // ==========================================================
  // ESCAPE HTML
  // ==========================================================

  function escapeHtml(
    value
  ) {

    if (
      value === null ||
      value === undefined
    ) {

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

  // ==========================================================
  // ESCAPE ATTRIBUTE
  // ==========================================================

  function escapeAttribute(
    value
  ) {

    return escapeHtml(
      value
    );
  }

  // ==========================================================
  // START
  // ==========================================================

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      initManager
    );

  } else {

    initManager();
  }

})();

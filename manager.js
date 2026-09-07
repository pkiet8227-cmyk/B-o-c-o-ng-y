// ============================================================

// MANAGER.JS

// QUẢN LÝ BÁO CÁO NGÀY

// PHIÊN BẢN ỔN ĐỊNH - GIỮ MENU + PHÂN QUYỀN

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

  if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {

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

  let isLoggingIn = false;

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

    loginBox = document.getElementById("loginBox");

    managerBox = document.getElementById("managerBox");

    loginId = document.getElementById("loginId");

    password = document.getElementById("password");

    loginBtn = document.getElementById("loginBtn");

    loginMessage = document.getElementById("loginMessage");

    menuBtn = document.getElementById("menuBtn");

    sideMenu = document.getElementById("sideMenu");

    sideMenuOverlay = document.getElementById("sideMenuOverlay");

    sideMenuClose = document.getElementById("sideMenuClose");

    menuReportsBtn = document.getElementById("menuReportsBtn");

    menuLogoutBtn = document.getElementById("menuLogoutBtn");

    logoutBtn = document.getElementById("logoutBtn");

    totalReports = document.getElementById("totalReports");

    totalAmount = document.getElementById("totalAmount");

    filterUser = document.getElementById("filterUser");

    filterDate = document.getElementById("filterDate");

    filterBtn = document.getElementById("filterBtn");

    refreshBtn = document.getElementById("refreshBtn");

    exportBtn = document.getElementById("exportBtn");

    showSubmittedUsersBtn =

      document.getElementById("showSubmittedUsersBtn");

    submittedUserCount =

      document.getElementById("submittedUserCount");

    tableBody = document.getElementById("tableBody");

    pagination = document.getElementById("pagination");

    managerMessage = document.getElementById("managerMessage");

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

      menuBtn.style.visibility = "visible";

      menuBtn.style.pointerEvents = "auto";

      menuBtn.style.position = "relative";

      menuBtn.style.zIndex = "100000";

    }

    try {

      const { data, error } = await client.auth.getSession();

      if (error) {

        console.error("GET SESSION ERROR:", error);

        showLogin();

        return;

      }

      const session = data?.session;

      if (!session?.user) {

        showLogin();

        return;

      }

      currentUser = session.user;

      console.log("CURRENT USER:", currentUser);

      const allowed = await checkManagerPermission();

      if (!allowed) {

        await client.auth.signOut();

        currentUser = null;

        showLogin();

        setLoginMessage(

          "❌ Tài khoản này chưa được cấp quyền quản lý.",

          "error"

        );

        return;

      }

      await showManager();

    } catch (error) {

      console.error("INIT ERROR:", error);

      currentUser = null;

      showLogin();

      setLoginMessage(

        "❌ Không thể khởi tạo trang quản lý: " +

          getErrorMessage(error),

        "error"

      );

    }

  }

  // ==========================================================

  // EVENTS

  // ==========================================================

  function bindEvents() {

    // LOGIN

    if (loginBtn) {

      loginBtn.addEventListener("click", login);

    }

    if (password) {

      password.addEventListener("keydown", function (e) {

        if (e.key === "Enter") {

          e.preventDefault();

          login();

        }

      });

    }

    if (loginId) {

      loginId.addEventListener("keydown", function (e) {

        if (e.key === "Enter") {

          e.preventDefault();

          login();

        }

      });

    }

    // MENU

    if (menuBtn) {

      menuBtn.onclick = function (e) {

        e.preventDefault();

        e.stopPropagation();

        openMenu();

      };

    }

    if (sideMenuClose) {

      sideMenuClose.onclick = function () {

        closeMenu();

      };

    }

    if (sideMenuOverlay) {

      sideMenuOverlay.onclick = function () {

        closeMenu();

      };

    }

    // REPORTS

    if (menuReportsBtn) {

      menuReportsBtn.onclick = async function () {

        closeMenu();

        if (!currentUser) {

          showLogin();

          return;

        }

        await showManager();

      };

    }

    // LOGOUT

    if (menuLogoutBtn) {

      menuLogoutBtn.onclick = async function () {

        await logout();

      };

    }

    if (logoutBtn) {

      logoutBtn.onclick = async function () {

        await logout();

      };

    }

    // FILTER

    if (filterBtn) {

      filterBtn.onclick = function () {

        applyFilter();

      };

    }

    // REFRESH

    if (refreshBtn) {

      refreshBtn.onclick = async function () {

        if (filterUser) {

          filterUser.value = "";

        }

        if (filterDate) {

          filterDate.value = "";

        }

        await loadReports();

      };

    }

    // EXPORT

    if (exportBtn) {

      exportBtn.onclick = function () {

        exportExcel();

      };

    }

    // USERS

    if (showSubmittedUsersBtn) {

      showSubmittedUsersBtn.onclick = function () {

        showSubmittedUsers();

      };

    }

  }

  // ==========================================================

  // LOGIN

  // ==========================================================

  async function login() {

    if (isLoggingIn) {

      return;

    }

    const identifier = (

      loginId?.value || ""

    ).trim();

    const pass = password?.value || "";

    if (!identifier) {

      setLoginMessage(

        "❌ Vui lòng nhập Email.",

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

    // ========================================================

    // KIỂM TRA EMAIL

    // ========================================================

    if (!isValidEmail(identifier)) {

      setLoginMessage(

        "❌ Vui lòng nhập đúng Email đã đăng ký Supabase.",

        "error"

      );

      loginId?.focus();

      return;

    }

    isLoggingIn = true;

    if (loginBtn) {

      loginBtn.disabled = true;

      loginBtn.textContent = "⏳ ĐANG ĐĂNG NHẬP...";

    }

    setLoginMessage(

      "⏳ Đang đăng nhập...",

      "info"

    );

    try {

      // ======================================================

      // XÓA SESSION CŨ NẾU CÓ

      // ======================================================

      try {

        await client.auth.signOut();

      } catch (e) {

        console.warn(

          "Không cần xóa session cũ:",

          e

        );

      }

      currentUser = null;

      // ======================================================

      // SUPABASE LOGIN

      // ======================================================

      const {

        data,

        error

      } = await client.auth.signInWithPassword({

        email: identifier,

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

      currentUser = data.user;

      console.log(

        "LOGIN SUCCESS:",

        currentUser

      );

      // ======================================================

      // CHECK MANAGER

      // ======================================================

      setLoginMessage(

        "⏳ Đang kiểm tra quyền quản lý...",

        "info"

      );

      const allowed =

        await checkManagerPermission();

      if (!allowed) {

        await client.auth.signOut();

        currentUser = null;

        throw new Error(

          "Tài khoản này chưa được cấp quyền quản lý."

        );

      }

      // ======================================================

      // THÀNH CÔNG

      // ======================================================

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

      currentUser = null;

      setLoginMessage(

        "❌ " + getErrorMessage(error),

        "error"

      );

    } finally {

      isLoggingIn = false;

      if (loginBtn) {

        loginBtn.disabled = false;

        loginBtn.textContent = "ĐĂNG NHẬP";

      }

    }

  }

  // ==========================================================

  // CHECK MANAGER

  // ==========================================================

  async function checkManagerPermission() {

    try {

      if (!currentUser) {

        return false;

      }

      const {

        data,

        error

      } = await client.rpc("is_manager");

      if (error) {

        console.error(

          "IS MANAGER ERROR:",

          error

        );

        setLoginMessage(

          "❌ Lỗi kiểm tra quyền: " +

            getErrorMessage(error),

          "error"

        );

        return false;

      }

      console.log(

        "IS MANAGER RESULT:",

        data

      );

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

      menuBtn.style.display = "none";

    }

    closeMenu();

  }

  // ==========================================================

  // SHOW MANAGER

  // ==========================================================

  async function showManager() {

    try {

      if (!currentUser) {

        const {

          data,

          error

        } = await client.auth.getUser();

        if (error) {

          console.error(

            "GET USER ERROR:",

            error

          );

          showLogin();

          return;

        }

        currentUser =

          data?.user || null;

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

        menuBtn.style.display = "flex";

        menuBtn.style.visibility = "visible";

        menuBtn.style.pointerEvents = "auto";

        menuBtn.style.position = "relative";

        menuBtn.style.zIndex = "100000";

      }

      await loadReports();

    } catch (error) {

      console.error(

        "SHOW MANAGER ERROR:",

        error

      );

      showLogin();

      setLoginMessage(

        "❌ Không thể mở trang quản lý: " +

          getErrorMessage(error),

        "error"

      );

    }

  }

  // ==========================================================

  // OPEN MENU

  // ==========================================================

  function openMenu() {

    if (!sideMenu || !sideMenuOverlay) {

      console.error(

        "SIDE MENU ELEMENT NOT FOUND"

      );

      return;

    }

    sideMenu.classList.add("open");

    sideMenuOverlay.classList.add("open");

    document.body.style.overflow = "hidden";

  }

  // ==========================================================

  // CLOSE MENU

  // ==========================================================

  function closeMenu() {

    if (sideMenu) {

      sideMenu.classList.remove("open");

    }

    if (sideMenuOverlay) {

      sideMenuOverlay.classList.remove("open");

    }

    document.body.style.overflow = "";

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

          getErrorMessage(error),

        "error"

      );

    }

  }

  // ==========================================================

  // FILTER

  // ==========================================================

  function applyFilter() {

    const userKeyword = (

      filterUser?.value || ""

    )

      .trim()

      .toLowerCase();

    const dateKeyword = (

      filterDate?.value || ""

    ).trim();

    filteredReports =

      allReports.filter(

        report => {

          const userText =

            getReportUser(report)

              .toLowerCase();

          const userOK =

            !userKeyword ||

            userText.includes(

              userKeyword

            );

          const reportDate =

            getReportDate(report);

          const dateOK =

            !dateKeyword ||

            reportDate === dateKeyword;

          return userOK && dateOK;

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

      /^\d{4}-\d{2}-\d{2}/.test(value)

    ) {

      return value.substring(0, 10);

    }

    try {

      const d = new Date(value);

      if (isNaN(d.getTime())) {

        return String(value);

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

      return String(value);

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

    if (typeof value === "number") {

      return value;

    }

    if (typeof value === "string") {

      const cleaned =

        value.replace(

          /[^\d.-]/g,

          ""

        );

      const number =

        Number(cleaned);

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

        filteredReports.length.toLocaleString(

          "vi-VN"

        );

    }

    const total =

      filteredReports.reduce(

        (sum, report) => {

          return (

            sum +

            getReportAmount(report)

          );

        },

        0

      );

    if (totalAmount) {

      totalAmount.textContent =

        formatMoney(total);

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

      (currentPage - 1) *

      pageSize;

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

          document.createElement("tr");

        const user =

          getReportUser(report);

        const date =

          getReportDate(report);

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

          getReportAmount(report);

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

              formatDisplayDate(date)

            )}

          </td>

          <td>

            ${escapeHtml(cif)}

          </td>

          <td>

            ${escapeHtml(customerName)}

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

              formatMoney(amount)

            )}

          </td>

          <td>

            ${escapeHtml(nextAction)}

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

              openEditModal(report);

            };

        }

        if (deleteButton) {

          deleteButton.onclick =

            function () {

              deleteReport(report);

            };

        }

        tableBody.appendChild(tr);

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

      document.createElement("button");

    prev.className = "arrow";

    prev.textContent = "‹";

    prev.disabled =

      currentPage === 1;

    prev.onclick =

      function () {

        if (currentPage > 1) {

          currentPage--;

          renderTable();

          scrollToTable();

        }

      };

    pagination.appendChild(prev);

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

      if (startPage === 1) {

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

        document.createElement("button");

      button.textContent = i;

      if (i === currentPage) {

        button.classList.add("active");

      }

      button.onclick =

        function () {

          currentPage = i;

          renderTable();

          scrollToTable();

        };

      pagination.appendChild(button);

    }

    const next =

      document.createElement("button");

    next.className = "arrow";

    next.textContent = "›";

    next.disabled =

      currentPage === totalPages;

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

    pagination.appendChild(next);

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

  function openEditModal(report) {

    editingReportId = report.id;

    const currentAmount =

      getReportAmount(report);

    const oldModal =

      document.getElementById(

        "dynamicEditModal"

      );

    if (oldModal) {

      oldModal.remove();

    }

    const overlay =

      document.createElement("div");

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

    document.body.appendChild(overlay);

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

          saveEditReport(report);

        };

    }

    overlay.onclick =

      function (e) {

        if (e.target === overlay) {

          closeEditModal();

        }

      };

  }

  // ==========================================================

  // SAVE EDIT

  // ==========================================================

  async function saveEditReport(report) {

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

      Number(input.value);

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

      } = await client

        .from("bao_cao_ngay")

        .update(updateData)

        .eq("id", report.id);

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

          getErrorMessage(error);

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

    editingReportId = null;

  }

  // ==========================================================

  // DELETE

  // ==========================================================

  async function deleteReport(report) {

    const name =

      getReportUser(report);

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

      } = await client

        .from("bao_cao_ngay")

        .delete()

        .eq("id", report.id);

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

          getErrorMessage(error),

        "error"

      );

    }

  }

  // ==========================================================

  // EXPORT EXCEL

  // ==========================================================

  function exportExcel() {

    if (typeof XLSX === "undefined") {

      alert(

        "❌ Chưa tải được thư viện Excel."

      );

      return;

    }

    if (!filteredReports.length) {

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

                getReportUser(report),

              "Ngày field":

                formatDisplayDate(

                  getReportDate(report)

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

                getReportAmount(report),

              "Hướng tác động tiếp theo":

                report.next_action ??

                report.huong_tac_dong_tiep_theo ??

                report.huong_tac_dong ??

                ""

            };

          }

        );

      const worksheet =

        XLSX.utils.json_to_sheet(rows);

      const workbook =

        XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(

        workbook,

        worksheet,

        "BaoCaoNgay"

      );

      const now = new Date();

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

    const users = new Set();

    allReports.forEach(

      report => {

        const user =

          getReportUser(report).trim();

        if (user) {

          users.add(user);

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

    const oldModal =

      document.getElementById(

        "submittedUsersModal"

      );

    if (oldModal) {

      oldModal.remove();

    }

    const overlay =

      document.createElement("div");

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

    document.body.appendChild(overlay);

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

        if (e.target === overlay) {

          overlay.remove();

        }

      };

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

    loginMessage.textContent = text;

    loginMessage.style.color =

      getMessageColor(type);

  }

  function showManagerMessage(

    text,

    type = "info"

  ) {

    if (!managerMessage) {

      return;

    }

    managerMessage.textContent = text;

    managerMessage.style.color =

      getMessageColor(type);

  }

  function getMessageColor(type) {

    if (type === "error") {

      return "#dc2626";

    }

    if (type === "success") {

      return "#16a34a";

    }

    return "#2563eb";

  }

  // ==========================================================

  // ERROR MESSAGE

  // ==========================================================

  function getErrorMessage(error) {

    if (!error) {

      return "Lỗi không xác định.";

    }

    const message =

      error.message ||

      error.error_description ||

      error.msg ||

      "";

    if (!message) {

      return "Lỗi không xác định.";

    }

    if (

      message.toLowerCase().includes(

        "invalid login credentials"

      )

    ) {

      return "Email hoặc mật khẩu không đúng.";

    }

    if (

      message.toLowerCase().includes(

        "email not confirmed"

      )

    ) {

      return "Email chưa được xác nhận trong Supabase.";

    }

    if (

      message.toLowerCase().includes(

        "failed to fetch"

      )

    ) {

      return "Không kết nối được Supabase. Kiểm tra Internet hoặc config.js.";

    }

    if (

      message.toLowerCase().includes(

        "network"

      )

    ) {

      return "Lỗi kết nối mạng.";

    }

    if (

      message.toLowerCase().includes(

        "is_manager"

      )

    ) {

      return "Không gọi được chức năng kiểm tra quyền is_manager.";

    }

    return message;

  }

  // ==========================================================

  // VALIDATE EMAIL

  // ==========================================================

  function isValidEmail(email) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(

      email

    );

  }

  // ==========================================================

  // MONEY

  // ==========================================================

  function formatMoney(value) {

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

  function formatDisplayDate(value) {

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

  function escapeHtml(value) {

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

  function escapeAttribute(value) {

    return escapeHtml(value);

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

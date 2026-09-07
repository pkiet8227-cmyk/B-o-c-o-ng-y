// =====================================================
// BÁO CÁO NGÀY - MANAGER.JS
// QUẢN LÝ + PHÂN QUYỀN
// =====================================================


// =====================================================
// KHỞI TẠO SUPABASE
// =====================================================

if (!window.supabase) {
  alert("❌ Không tải được Supabase.");
  throw new Error("Supabase library chưa được tải.");
}

if (
  !window.SUPABASE_URL ||
  !window.SUPABASE_ANON_KEY
) {
  alert("❌ Chưa cấu hình Supabase trong config.js.");
  throw new Error("Thiếu SUPABASE_URL hoặc SUPABASE_ANON_KEY.");
}

const client = window.supabase.createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);


// =====================================================
// ELEMENT
// =====================================================

const loginBox =
  document.getElementById("loginBox");

const managerBox =
  document.getElementById("managerBox");

const loginIdInput =
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

const tableBody =
  document.getElementById("tableBody");

const pagination =
  document.getElementById("pagination");

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

const showSubmittedUsersBtn =
  document.getElementById("showSubmittedUsersBtn");

const submittedUserCount =
  document.getElementById("submittedUserCount");

const totalReports =
  document.getElementById("totalReports");

const totalAmount =
  document.getElementById("totalAmount");


// =====================================================
// MENU
// =====================================================

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


// =====================================================
// BIẾN
// =====================================================

let allData = [];

let filteredData = [];

let currentPage = 1;

const rowsPerPage = 20;

let currentSessionUser = null;


// =====================================================
// EDGE FUNCTION
// =====================================================

const PERMISSION_FUNCTION_URL =
  window.SUPABASE_URL +
  "/functions/v1/manager-permission";


// =====================================================
// KHỞI ĐỘNG
// =====================================================

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    await checkExistingSession();

  }
);


// =====================================================
// KIỂM TRA SESSION
// =====================================================

async function checkExistingSession() {

  try {

    const {
      data,
      error
    } =
      await client.auth.getSession();

    if (error) {

      console.error(error);

      return;

    }

    const session =
      data?.session;

    if (!session) {

      showLogin();

      return;

    }

    currentSessionUser =
      session.user;


    const allowed =
      await checkManagerPermission(
        session.user.id
      );


    if (!allowed) {

      await client.auth.signOut();

      showLogin();

      loginMessage.textContent =
        "❌ Tài khoản này chưa được cấp quyền quản lý.";

      loginMessage.style.color =
        "#dc2626";

      return;

    }


    showManager();

    await loadData();


  } catch (error) {

    console.error(
      "Lỗi kiểm tra session:",
      error
    );

    showLogin();

  }

}


// =====================================================
// KIỂM TRA QUYỀN QUẢN LÝ
// =====================================================

async function checkManagerPermission(
  userId
) {

  if (!userId) {

    return false;

  }


  try {

    const {
      data,
      error
    } =
      await client
        .from("manager_permissions")
        .select(
          "auth_user_id,enabled"
        )
        .eq(
          "auth_user_id",
          userId
        )
        .eq(
          "enabled",
          true
        )
        .maybeSingle();


    if (error) {

      console.error(
        "Lỗi kiểm tra quyền:",
        error
      );

      return false;

    }


    return !!data;


  } catch (error) {

    console.error(error);

    return false;

  }

}


// =====================================================
// HIỂN THỊ MANAGER
// =====================================================

function showManager() {

  if (loginBox) {

    loginBox.style.display =
      "none";

  }


  if (managerBox) {

    managerBox.style.display =
      "block";

  }


  if (menuBtn) {

    menuBtn.style.display =
      "block";

  }

}


// =====================================================
// HIỂN THỊ LOGIN
// =====================================================

function showLogin() {

  if (loginBox) {

    loginBox.style.display =
      "block";

  }


  if (managerBox) {

    managerBox.style.display =
      "none";

  }


  if (menuBtn) {

    menuBtn.style.display =
      "none";

  }

}


// =====================================================
// LOGIN BUTTON
// =====================================================

if (loginBtn) {

  loginBtn.addEventListener(
    "click",
    login
  );

}


// =====================================================
// ENTER LOGIN USER
// =====================================================

if (loginIdInput) {

  loginIdInput.addEventListener(
    "keydown",
    event => {

      if (
        event.key ===
        "Enter"
      ) {

        event.preventDefault();

        login();

      }

    }
  );

}


// =====================================================
// ENTER LOGIN PASSWORD
// =====================================================

if (passwordInput) {

  passwordInput.addEventListener(
    "keydown",
    event => {

      if (
        event.key ===
        "Enter"
      ) {

        event.preventDefault();

        login();

      }

    }
  );

}


// =====================================================
// CHUẨN HÓA USERNAME
// =====================================================

function normalizeLoginUsername(
  value
) {

  return String(
    value || ""
  )
    .trim()
    .toLowerCase()
    .replace(
      /\s+/g,
      ""
    );

}


// =====================================================
// USERNAME → EMAIL NỘI BỘ
// =====================================================
//
// Tài khoản username được Edge Function
// tạo dưới dạng:
//
// username@manager.local
//
// Không hiển thị email này cho người dùng.
// =====================================================

function usernameToInternalEmail(
  username
) {

  const normalized =
    normalizeLoginUsername(
      username
    );


  return (
    normalized +
    "@manager.local"
  );

}


// =====================================================
// LOGIN
// =====================================================

async function login() {

  const loginId =
    loginIdInput
      ? loginIdInput.value.trim()
      : "";


  const password =
    passwordInput
      ? passwordInput.value
      : "";


  if (!loginId || !password) {

    loginMessage.textContent =
      "❌ Vui lòng nhập User/Email và mật khẩu.";

    loginMessage.style.color =
      "#dc2626";

    return;

  }


  loginBtn.disabled =
    true;

  loginBtn.textContent =
    "⏳ ĐANG ĐĂNG NHẬP...";


  loginMessage.textContent =
    "";


  try {

    let email;


    /*
      Nếu nhập Email
      → dùng trực tiếp.

      Nếu nhập User
      → chuyển sang email nội bộ
      → username@manager.local
    */

    if (
      loginId.includes("@")
    ) {

      email =
        loginId
          .trim()
          .toLowerCase();

    } else {

      email =
        usernameToInternalEmail(
          loginId
        );

    }


    const {
      data,
      error
    } =
      await client.auth.signInWithPassword({
        email,
        password
      });


    if (error) {

      console.error(
        "Login error:",
        error
      );

      throw new Error(
        "Tài khoản hoặc mật khẩu không đúng."
      );

    }


    if (!data?.session) {

      throw new Error(
        "Không tạo được phiên đăng nhập."
      );

    }


    currentSessionUser =
      data.session.user;


    /*
      Đăng nhập thành công nhưng
      vẫn phải kiểm tra quyền.
    */

    const allowed =
      await checkManagerPermission(
        data.session.user.id
      );


    if (!allowed) {

      await client.auth.signOut();

      currentSessionUser =
        null;

      throw new Error(
        "Tài khoản này chưa được cấp quyền quản lý."
      );

    }


    loginMessage.textContent =
      "";

    showManager();


    loginBtn.disabled =
      false;

    loginBtn.textContent =
      "🔐 ĐĂNG NHẬP";


    await loadData();


  } catch (error) {

    console.error(error);


    loginMessage.textContent =
      "❌ " +
      (
        error.message ||
        "Đăng nhập thất bại."
      );


    loginMessage.style.color =
      "#dc2626";


    loginBtn.disabled =
      false;

    loginBtn.textContent =
      "🔐 ĐĂNG NHẬP";

  }

}


// =====================================================
// LOAD DATA
// =====================================================

async function loadData() {

  managerMessage.textContent =
    "⏳ Đang tải dữ liệu...";

  managerMessage.style.color =
    "#2563eb";


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

    console.error(
      "Lỗi tải dữ liệu:",
      error
    );


    managerMessage.textContent =
      "❌ Không tải được dữ liệu: " +
      error.message;

    managerMessage.style.color =
      "#dc2626";

    return;

  }


  allData =
    Array.isArray(data)
      ? data
      : [];


  currentPage =
    1;


  applyCurrentFilter();

  updateSubmittedUserCount();


  managerMessage.textContent =
    "✅ Đã cập nhật dữ liệu.";

  managerMessage.style.color =
    "#16a34a";


  setTimeout(
    () => {

      managerMessage.textContent =
        "";

    },
    2000
  );

}


// =====================================================
// LỌC
// =====================================================

if (filterBtn) {

  filterBtn.addEventListener(
    "click",
    () => {

      currentPage =
        1;

      applyCurrentFilter();

    }
  );

}


// =====================================================
// APPLY FILTER
// =====================================================

function applyCurrentFilter() {

  const userKeyword =
    normalizeText(
      filterUser
        ? filterUser.value
        : ""
    );


  const selectedDate =
    filterDate
      ? filterDate.value
      : "";


  filteredData =
    allData.filter(
      row => {

        const rowUser =
          normalizeText(
            row.user_name
          );


        const matchUser =
          !userKeyword ||
          rowUser.includes(
            userKeyword
          );


        const matchDate =
          !selectedDate ||
          String(
            row.field_date || ""
          ).slice(0, 10) ===
            selectedDate;


        return (
          matchUser &&
          matchDate
        );

      }
    );


  renderData();

  updateSubmittedUserCount();

}


// =====================================================
// RENDER DATA
// =====================================================

function renderData() {

  if (!tableBody) {
    return;
  }


  tableBody.innerHTML =
    "";


  totalReports.textContent =
    filteredData.length;


  let total =
    0;


  filteredData.forEach(
    row => {

      total +=
        parseMoney(
          row.expected_amount
        );

    }
  );


  totalAmount.textContent =
    formatMoney(total) +
    " đ";


  if (
    filteredData.length === 0
  ) {

    tableBody.innerHTML = `

      <tr>

        <td
          colspan="10"
          style="
            text-align:center;
            padding:30px;
            color:#64748b;
            font-weight:700;
          "
        >
          Không có dữ liệu
        </td>

      </tr>

    `;


    renderPagination();

    return;

  }


  const totalPages =
    Math.ceil(
      filteredData.length /
      rowsPerPage
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
    rowsPerPage;


  const end =
    start +
    rowsPerPage;


  const pageData =
    filteredData.slice(
      start,
      end
    );


  pageData.forEach(
    row => {

      const tr =
        document.createElement(
          "tr"
        );


      tr.innerHTML = `

        <td>
          ${escapeHtml(
            row.user_name || ""
          )}
        </td>

        <td>
          ${formatDate(
            row.field_date
          )}
        </td>

        <td>
          ${escapeHtml(
            row.cif || ""
          )}
        </td>

        <td>
          ${escapeHtml(
            row.customer_name || ""
          )}
        </td>

        <td>
          ${escapeHtml(
            row.result || ""
          )}
        </td>

        <td>
          ${escapeHtml(
            row.connection || ""
          )}
        </td>

        <td>
          ${escapeHtml(
            row.detail || ""
          )}
        </td>

        <td>
          ${formatMoney(
            parseMoney(
              row.expected_amount
            )
          )}
        </td>

        <td>
          ${escapeHtml(
            row.next_action || ""
          )}
        </td>

        <td>

          <button
            class="edit-btn"
            type="button"
            data-edit-id="${escapeAttribute(
              String(row.id)
            )}"
          >
            ✏️ SỬA
          </button>

          <button
            class="delete-btn"
            type="button"
            data-delete-id="${escapeAttribute(
              String(row.id)
            )}"
          >
            🗑️ XÓA
          </button>

        </td>

      `;


      tableBody.appendChild(
        tr
      );

    }
  );


  tableBody
    .querySelectorAll(
      "[data-edit-id]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            openEditUserModal(
              button.dataset.editId
            );

          }
        );

      }
    );


  tableBody
    .querySelectorAll(
      "[data-delete-id]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            deleteReport(
              button.dataset.deleteId
            );

          }
        );

      }
    );


  renderPagination();

}


// =====================================================
// CẬP NHẬT SỐ CÁN BỘ
// =====================================================

function updateSubmittedUserCount() {

  if (!submittedUserCount) {
    return;
  }


  const uniqueUsers =
    getUniqueUsers(
      filteredData
    );


  submittedUserCount.textContent =
    uniqueUsers.length;

}


// =====================================================
// GET UNIQUE USERS
// =====================================================

function getUniqueUsers(
  data
) {

  const map =
    new Map();


  data.forEach(
    row => {

      const originalName =
        String(
          row.user_name || ""
        ).trim();


      if (!originalName) {
        return;
      }


      const key =
        normalizeText(
          originalName
        );


      if (!map.has(key)) {

        map.set(
          key,
          originalName
        );

      }

    }
  );


  return Array.from(
    map.values()
  ).sort(
    (a, b) =>
      a.localeCompare(
        b,
        "vi"
      )
  );

}


// =====================================================
// CÁN BỘ ĐÃ NHẬP
// =====================================================

if (showSubmittedUsersBtn) {

  showSubmittedUsersBtn.addEventListener(
    "click",
    showSubmittedUsers
  );

}


function showSubmittedUsers() {

  const users =
    getUniqueUsers(
      filteredData
    );


  const overlay =
    document.createElement(
      "div"
    );

  overlay.className =
    "user-modal-overlay";


  const modal =
    document.createElement(
      "div"
    );

  modal.className =
    "user-modal";


  const listHtml =
    users.length === 0

      ? `
        <div class="no-user">
          Chưa có cán bộ nào nhập báo cáo.
        </div>
      `

      : users
          .map(
            (name, index) => `

              <div
                class="submitted-user-item"
              >

                <div
                  class="submitted-user-number"
                >
                  ${index + 1}
                </div>

                <div>
                  ${escapeHtml(name)}
                </div>

              </div>

            `
          )
          .join("");


  modal.innerHTML = `

    <div class="user-modal-header">

      <h2>
        👥 CÁN BỘ ĐÃ NHẬP BÁO CÁO
        (${users.length})
      </h2>

      <button
        class="user-modal-close"
        type="button"
      >
        ×
      </button>

    </div>


    <div class="user-modal-body">

      ${listHtml}

    </div>

  `;


  overlay.appendChild(
    modal
  );


  document.body.appendChild(
    overlay
  );


  modal
    .querySelector(
      ".user-modal-close"
    )
    .addEventListener(
      "click",
      () => overlay.remove()
    );


  overlay.addEventListener(
    "click",
    event => {

      if (
        event.target ===
        overlay
      ) {

        overlay.remove();

      }

    }
  );

}


// =====================================================
// SỬA CÁN BỘ
// =====================================================

function openEditUserModal(
  id
) {

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


  const oldName =
    String(
      row.user_name || ""
    ).trim();


  const overlay =
    document.createElement(
      "div"
    );

  overlay.className =
    "edit-modal-overlay";


  const modal =
    document.createElement(
      "div"
    );

  modal.className =
    "edit-modal";


  modal.innerHTML = `

    <h2>
      ✏️ CHỈNH SỬA CÁN BỘ
    </h2>

    <label>
      Tên cán bộ
    </label>

    <input
      id="editUserNameInput"
      type="text"
      value="${escapeAttribute(oldName)}"
      placeholder="Nhập tên cán bộ"
      autocomplete="off"
    >


    <div class="edit-modal-buttons">

      <button
        id="cancelEditUserBtn"
        class="edit-cancel-btn"
        type="button"
      >
        HỦY
      </button>


      <button
        id="saveEditUserBtn"
        class="edit-save-btn"
        type="button"
      >
        💾 LƯU
      </button>

    </div>

  `;


  overlay.appendChild(
    modal
  );

  document.body.appendChild(
    overlay
  );


  const input =
    modal.querySelector(
      "#editUserNameInput"
    );


  const saveBtn =
    modal.querySelector(
      "#saveEditUserBtn"
    );


  const cancelBtn =
    modal.querySelector(
      "#cancelEditUserBtn"
    );


  setTimeout(
    () => {

      input.focus();

      input.select();

    },
    50
  );


  cancelBtn.addEventListener(
    "click",
    () => overlay.remove()
  );


  overlay.addEventListener(
    "click",
    event => {

      if (
        event.target ===
        overlay
      ) {

        overlay.remove();

      }

    }
  );


  saveBtn.addEventListener(
    "click",
    async () => {

      const newName =
        input.value.trim();


      if (!newName) {

        alert(
          "❌ Tên cán bộ không được để trống."
        );

        input.focus();

        return;

      }


      if (
        normalizeText(newName) ===
        normalizeText(oldName)
      ) {

        overlay.remove();

        return;

      }


      saveBtn.disabled =
        true;

      saveBtn.textContent =
        "⏳ ĐANG LƯU...";


      await updateUserName(
        id,
        newName,
        overlay,
        saveBtn
      );

    }
  );

}


// =====================================================
// UPDATE USER_NAME
// =====================================================

async function updateUserName(
  id,
  newName,
  overlay,
  saveBtn
) {

  try {

    const {
      data,
      error
    } =
      await client
        .from("bao_cao_ngay")
        .update({
          user_name: newName
        })
        .eq(
          "id",
          id
        )
        .select();


    if (error) {

      console.error(
        "Lỗi UPDATE:",
        error
      );


      saveBtn.disabled =
        false;

      saveBtn.textContent =
        "💾 LƯU";


      alert(
        "❌ Sửa thất bại:\n\n" +
        error.message
      );

      return;

    }


    if (
      !data ||
      data.length === 0
    ) {

      saveBtn.disabled =
        false;

      saveBtn.textContent =
        "💾 LƯU";


      alert(
        "❌ Không cập nhật được dữ liệu.\n\n" +
        "Supabase có thể đang chặn quyền UPDATE bằng RLS."
      );

      return;

    }


    const updatedRow =
      data[0];


    const index =
      allData.findIndex(
        item =>
          String(item.id) ===
          String(id)
      );


    if (index !== -1) {

      allData[index] = {
        ...allData[index],
        ...updatedRow
      };

    }


    overlay.remove();

    applyCurrentFilter();

    updateSubmittedUserCount();


    managerMessage.textContent =
      "✅ Đã sửa cán bộ thành: " +
      newName;

    managerMessage.style.color =
      "#16a34a";


    setTimeout(
      () => {

        managerMessage.textContent =
          "";

      },
      2500
    );


  } catch (error) {

    console.error(error);


    saveBtn.disabled =
      false;

    saveBtn.textContent =
      "💾 LƯU";


    alert(
      "❌ Có lỗi xảy ra khi sửa."
    );

  }

}


// =====================================================
// XÓA BÁO CÁO
// =====================================================

async function deleteReport(
  id
) {

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


  const confirmDelete =
    confirm(
      "Bạn có chắc muốn xóa báo cáo của cán bộ:\n\n" +
      (
        row.user_name ||
        ""
      ) +
      "\n\nSố CIF: " +
      (
        row.cif ||
        ""
      )
    );


  if (!confirmDelete) {

    return;

  }


  const {
    error
  } =
    await client
      .from("bao_cao_ngay")
      .delete()
      .eq(
        "id",
        id
      );


  if (error) {

    console.error(error);


    alert(
      "❌ Xóa thất bại:\n\n" +
      error.message
    );

    return;

  }


  allData =
    allData.filter(
      item =>
        String(item.id) !==
        String(id)
    );


  applyCurrentFilter();

  updateSubmittedUserCount();


  managerMessage.textContent =
    "✅ Đã xóa báo cáo.";

  managerMessage.style.color =
    "#16a34a";


  setTimeout(
    () => {

      managerMessage.textContent =
        "";

    },
    2000
  );

}


// =====================================================
// LÀM MỚI
// =====================================================

if (refreshBtn) {

  refreshBtn.addEventListener(
    "click",
    async () => {

      await loadData();

    }
  );

}


// =====================================================
// PHÂN TRANG
// =====================================================

function renderPagination() {

  if (!pagination) {
    return;
  }


  pagination.innerHTML =
    "";


  const totalPages =
    Math.ceil(
      filteredData.length /
      rowsPerPage
    );


  if (
    totalPages <= 1
  ) {

    return;

  }


  const prevBtn =
    document.createElement(
      "button"
    );


  prevBtn.className =
    "arrow";


  prevBtn.innerHTML =
    "‹";


  prevBtn.disabled =
    currentPage === 1;


  prevBtn.addEventListener(
    "click",
    () => {

      if (
        currentPage > 1
      ) {

        currentPage--;

        renderData();

        scrollToTable();

      }

    }
  );


  pagination.appendChild(
    prevBtn
  );


  const pages =
    getPaginationPages(
      currentPage,
      totalPages
    );


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
          "...";


        dots.style.padding =
          "0 5px";


        pagination.appendChild(
          dots
        );


        return;

      }


      const btn =
        document.createElement(
          "button"
        );


      btn.textContent =
        page;


      if (
        page ===
        currentPage
      ) {

        btn.classList.add(
          "active"
        );

      }


      btn.addEventListener(
        "click",
        () => {

          currentPage =
            page;


          renderData();

          scrollToTable();

        }
      );


      pagination.appendChild(
        btn
      );

    }
  );


  const nextBtn =
    document.createElement(
      "button"
    );


  nextBtn.className =
    "arrow";


  nextBtn.innerHTML =
    "›";


  nextBtn.disabled =
    currentPage ===
    totalPages;


  nextBtn.addEventListener(
    "click",
    () => {

      if (
        currentPage <
        totalPages
      ) {

        currentPage++;

        renderData();

        scrollToTable();

      }

    }
  );


  pagination.appendChild(
    nextBtn
  );

}


// =====================================================
// DANH SÁCH TRANG
// =====================================================

function getPaginationPages(
  current,
  total
) {

  if (
    total <= 7
  ) {

    return Array.from(
      {
        length: total
      },
      (_, i) =>
        i + 1
    );

  }


  const pages = [];


  pages.push(1);


  if (
    current > 4
  ) {

    pages.push("...");

  }


  const start =
    Math.max(
      2,
      current - 1
    );


  const end =
    Math.min(
      total - 1,
      current + 1
    );


  for (
    let i = start;
    i <= end;
    i++
  ) {

    pages.push(i);

  }


  if (
    current <
    total - 3
  ) {

    pages.push("...");

  }


  pages.push(total);


  return pages;

}


// =====================================================
// EXPORT EXCEL
// =====================================================

if (exportBtn) {

  exportBtn.addEventListener(
    "click",
    exportExcel
  );

}


function exportExcel() {

  if (
    !filteredData.length
  ) {

    alert(
      "❌ Không có dữ liệu để xuất."
    );

    return;

  }


  if (
    typeof XLSX ===
    "undefined"
  ) {

    alert(
      "❌ Chưa tải được thư viện Excel."
    );

    return;

  }


  const exportData =
    filteredData.map(
      row => ({

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
          parseMoney(
            row.expected_amount
          ),

        "Hướng tác động tiếp theo":
          row.next_action || ""

      })
    );


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


  XLSX.writeFile(
    workbook,
    "bao_cao_ngay.xlsx"
  );

}


// =====================================================
// MENU
// =====================================================

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


function openMenu() {

  if (sideMenu) {

    sideMenu.classList.add(
      "open"
    );

  }


  if (sideMenuOverlay) {

    sideMenuOverlay.classList.add(
      "open"
    );

  }

}


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

}


// =====================================================
// MENU - QUẢN LÝ BÁO CÁO
// =====================================================

if (menuReportsBtn) {

  menuReportsBtn.addEventListener(
    "click",
    () => {

      closeMenu();


      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });

    }
  );

}


// =====================================================
// MENU - PHÂN QUYỀN
// =====================================================

if (menuPermissionBtn) {

  menuPermissionBtn.addEventListener(
    "click",
    async () => {

      closeMenu();

      await openPermissionModal();

    }
  );

}


// =====================================================
// EDGE FUNCTION CALL
// =====================================================

async function callPermissionFunction(
  action,
  payload = {}
) {

  const {
    data: sessionData,
    error: sessionError
  } =
    await client.auth.getSession();


  if (
    sessionError ||
    !sessionData?.session
  ) {

    throw new Error(
      "Phiên đăng nhập đã hết hạn."
    );

  }


  const accessToken =
    sessionData.session.access_token;


  const response =
    await fetch(
      PERMISSION_FUNCTION_URL,
      {
        method: "POST",

        headers: {

          "Content-Type":
            "application/json",

          "Authorization":
            "Bearer " +
            accessToken,

          "apikey":
            window.SUPABASE_ANON_KEY

        },

        body:
          JSON.stringify({

            action,

            ...payload

          })

      }
    );


  let result = {};


  try {

    result =
      await response.json();

  } catch {

    result = {};

  }


  if (!response.ok) {

    throw new Error(
      result.error ||
      result.message ||
      "Edge Function xử lý thất bại."
    );

  }


  return result;

}


// =====================================================
// MỞ MODAL PHÂN QUYỀN
// =====================================================

async function openPermissionModal() {

  const overlay =
    document.createElement(
      "div"
    );


  overlay.className =
    "permission-modal-overlay";


  const modal =
    document.createElement(
      "div"
    );


  modal.className =
    "permission-modal";


  modal.innerHTML = `

    <div class="permission-header">

      <h2>
        🔐 PHÂN QUYỀN QUẢN LÝ
      </h2>


      <button
        class="permission-close"
        type="button"
      >
        ×
      </button>

    </div>


    <div class="permission-body">

      <div class="permission-info">

        Cấp quyền cho tài khoản được
        đăng nhập vào trang quản lý.

        <br><br>

        Có thể nhập <b>User</b> hoặc
        <b>Email</b>.

        <br><br>

        🔒 Mật khẩu được Supabase Auth
        quản lý và không lưu trực tiếp
        trong bảng phân quyền.

      </div>


      <div class="permission-form">

        <label>
          User / Email
        </label>


        <input
          id="permissionLogin"
          type="text"
          placeholder="Ví dụ: hoinv12 hoặc email@gmail.com"
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
          👤 CẤP QUYỀN
        </button>

      </div>


      <div
        id="permissionMessage"
        style="
          margin-top:12px;
          text-align:center;
          font-weight:800;
        "
      ></div>


      <div class="permission-list-title">

        👥 TÀI KHOẢN ĐƯỢC CẤP QUYỀN

      </div>


      <div id="permissionList">

        ⏳ Đang tải...

      </div>

    </div>

  `;


  overlay.appendChild(
    modal
  );


  document.body.appendChild(
    overlay
  );


  modal
    .querySelector(
      ".permission-close"
    )
    .addEventListener(
      "click",
      () => overlay.remove()
    );


  overlay.addEventListener(
    "click",
    event => {

      if (
        event.target ===
        overlay
      ) {

        overlay.remove();

      }

    }
  );


  modal
    .querySelector(
      "#grantPermissionBtn"
    )
    .addEventListener(
      "click",
      async () => {

        await grantPermission(
          modal
        );

      }
    );


  /*
    Cho phép nhấn Enter
    ở ô mật khẩu để cấp quyền.
  */

  modal
    .querySelector(
      "#permissionPassword"
    )
    .addEventListener(
      "keydown",
      event => {

        if (
          event.key ===
          "Enter"
        ) {

          event.preventDefault();

          grantPermission(
            modal
          );

        }

      }
    );


  await loadPermissionList(
    modal
  );

}


// =====================================================
// CẤP QUYỀN
// =====================================================

async function grantPermission(
  modal
) {

  const loginInput =
    modal.querySelector(
      "#permissionLogin"
    );


  const passwordInput =
    modal.querySelector(
      "#permissionPassword"
    );


  const button =
    modal.querySelector(
      "#grantPermissionBtn"
    );


  const message =
    modal.querySelector(
      "#permissionMessage"
    );


  const loginId =
    loginInput.value.trim();


  const password =
    passwordInput.value;


  if (!loginId) {

    message.textContent =
      "❌ Vui lòng nhập User hoặc Email.";

    message.style.color =
      "#dc2626";

    return;

  }


  if (
    password.length < 6
  ) {

    message.textContent =
      "❌ Mật khẩu phải có ít nhất 6 ký tự.";

    message.style.color =
      "#dc2626";

    return;

  }


  button.disabled =
    true;


  button.textContent =
    "⏳ ĐANG CẤP QUYỀN...";


  message.textContent =
    "⏳ Đang xử lý...";


  message.style.color =
    "#2563eb";


  try {

    const result =
      await callPermissionFunction(
        "grant",
        {
          identifier:
            loginId,

          password:
            password
        }
      );


    message.textContent =
      "✅ " +
      (
        result.message ||
        "Đã cấp quyền thành công."
      );


    message.style.color =
      "#16a34a";


    loginInput.value =
      "";


    passwordInput.value =
      "";


    await loadPermissionList(
      modal
    );


  } catch (error) {

    console.error(error);


    message.textContent =
      "❌ " +
      (
        error.message ||
        "Cấp quyền thất bại."
      );


    message.style.color =
      "#dc2626";

  }


  button.disabled =
    false;


  button.textContent =
    "👤 CẤP QUYỀN";

}


// =====================================================
// TẢI DANH SÁCH QUYỀN
// =====================================================

async function loadPermissionList(
  modal
) {

  const list =
    modal.querySelector(
      "#permissionList"
    );


  list.innerHTML =
    "⏳ Đang tải...";


  try {

    const result =
      await callPermissionFunction(
        "list"
      );


    /*
      Chấp nhận nhiều dạng response
      để tránh lỗi nếu Edge Function
      trả về data/users.
    */

    let users =
      result?.users ||
      result?.data ||
      result?.managers ||
      [];


    if (
      !Array.isArray(users)
    ) {

      users = [];

    }


    const activeUsers =
      users.filter(
        user =>
          user.enabled !== false
      );


    if (
      activeUsers.length === 0
    ) {

      list.innerHTML = `

        <div class="permission-empty">

          Chưa có tài khoản nào được
          cấp quyền.

        </div>

      `;

      return;

    }


    list.innerHTML =
      activeUsers
        .map(
          user => {

            const displayName =
              user.display_identifier ||
              user.login_name ||
              user.identifier ||
              user.auth_email ||
              user.email ||
              "";


            const authEmail =
              user.auth_email ||
              user.email ||
              "";


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
                      displayName
                    )}

                  </div>


                  <div
                    class="permission-user-status"
                  >

                    🟢 Được phép quản lý

                  </div>


                  ${
                    authEmail &&
                    normalizeText(
                      authEmail
                    ) !==
                    normalizeText(
                      displayName
                    )

                      ? `

                        <div
                          style="
                            margin-top:3px;
                            font-size:12px;
                            color:#64748b;
                          "
                        >

                          ${escapeHtml(
                            authEmail
                          )}

                        </div>

                      `

                      : ""
                  }

                </div>


                <button
                  class="revoke-btn"
                  type="button"
                  data-revoke-user="${
                    escapeAttribute(
                      String(
                        user.auth_user_id ||
                        user.user_id ||
                        user.id ||
                        ""
                      )
                    )
                  }"
                >

                  THU HỒI

                </button>

              </div>

            `;

          }
        )
        .join("");


    list
      .querySelectorAll(
        "[data-revoke-user]"
      )
      .forEach(
        button => {

          button.addEventListener(
            "click",
            async () => {

              await revokePermission(
                button.dataset.revokeUser,
                modal
              );

            }
          );

        }
      );


  } catch (error) {

    console.error(error);


    list.innerHTML = `

      <div
        class="permission-empty"
      >

        ❌ Không tải được danh sách quyền.

        <br><br>

        ${escapeHtml(
          error.message
        )}

      </div>

    `;

  }

}


// =====================================================
// THU HỒI QUYỀN
// =====================================================

async function revokePermission(
  authUserId,
  modal
) {

  if (!authUserId) {

    alert(
      "❌ Không xác định được tài khoản."
    );

    return;

  }


  const confirmed =
    confirm(
      "Bạn có chắc muốn thu hồi quyền quản lý tài khoản này?"
    );


  if (!confirmed) {

    return;

  }


  try {

    await callPermissionFunction(
      "revoke",
      {
        auth_user_id:
          authUserId
      }
    );


    await loadPermissionList(
      modal
    );


    alert(
      "✅ Đã thu hồi quyền quản lý."
    );


  } catch (error) {

    console.error(error);


    alert(
      "❌ Thu hồi quyền thất bại:\n\n" +
      (
        error.message ||
        "Có lỗi xảy ra."
      )
    );

  }

}


// =====================================================
// MENU LOGOUT
// =====================================================

if (menuLogoutBtn) {

  menuLogoutBtn.addEventListener(
    "click",
    async () => {

      closeMenu();

      await logout();

    }
  );

}


// =====================================================
// LOGOUT
// =====================================================

if (logoutBtn) {

  logoutBtn.addEventListener(
    "click",
    logout
  );

}


async function logout() {

  await client.auth.signOut();


  currentSessionUser =
    null;


  allData = [];

  filteredData = [];

  currentPage = 1;


  showLogin();


  if (tableBody) {

    tableBody.innerHTML =
      "";

  }


  if (pagination) {

    pagination.innerHTML =
      "";

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


  if (passwordInput) {

    passwordInput.value =
      "";

  }


  if (loginMessage) {

    loginMessage.textContent =
      "";

  }

}


// =====================================================
// FORMAT MONEY
// =====================================================

function parseMoney(
  value
) {

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {

    return 0;

  }


  if (
    typeof value ===
    "number"
  ) {

    return value;

  }


  let str =
    String(value).trim();


  str =
    str.replace(
      /₫/g,
      ""
    );


  str =
    str.replace(
      /\s/g,
      ""
    );


  if (
    str.includes(",") &&
    str.includes(".")
  ) {

    str =
      str.replace(
        /\./g,
        ""
      );


    str =
      str.replace(
        /,/g,
        "."
      );

  } else {

    str =
      str.replace(
        /,/g,
        ""
      );

  }


  str =
    str.replace(
      /[^0-9.-]/g,
      ""
    );


  const number =
    Number(str);


  return Number.isFinite(
    number
  )
    ? number
    : 0;

}


function formatMoney(
  value
) {

  return new Intl.NumberFormat(
    "vi-VN"
  ).format(
    Number(value) || 0
  );

}


// =====================================================
// FORMAT DATE
// =====================================================

function formatDate(
  value
) {

  if (!value) {

    return "";

  }


  const str =
    String(value);


  if (
    /^\d{4}-\d{2}-\d{2}/.test(
      str
    )
  ) {

    const parts =
      str
        .slice(
          0,
          10
        )
        .split("-");


    return (
      parts[2] +
      "/" +
      parts[1] +
      "/" +
      parts[0]
    );

  }


  return str;

}


// =====================================================
// NORMALIZE TEXT
// =====================================================

function normalizeText(
  value
) {

  return String(
    value || ""
  )
    .trim()
    .toLowerCase()
    .replace(
      /\s+/g,
      " "
    );

}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHtml(
  value
) {

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


// =====================================================
// ESCAPE ATTRIBUTE
// =====================================================

function escapeAttribute(
  value
) {

  return escapeHtml(
    value
  );

}


// =====================================================
// SCROLL TABLE
// =====================================================

function scrollToTable() {

  const table =
    document.querySelector(
      ".table-wrap"
    );


  if (!table) {

    return;

  }


  table.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

}

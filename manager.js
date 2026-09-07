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

const emailInput =
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
// BIẾN
// =====================================================

let allData = [];

let filteredData = [];

let currentPage = 1;

const rowsPerPage = 20;


// =====================================================
// KHỞI ĐỘNG
// =====================================================

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    try {

      const {
        data: {
          session
        }
      } = await client.auth.getSession();

      if (session) {

        loginBox.style.display = "none";

        managerBox.style.display = "block";

        await loadData();

      }

    } catch (error) {

      console.error(
        "Lỗi kiểm tra session:",
        error
      );

    }

  }
);


// =====================================================
// LOGIN
// =====================================================

if (loginBtn) {

  loginBtn.addEventListener(
    "click",
    login
  );

}


async function login() {

  const email =
    emailInput.value.trim();

  const password =
    passwordInput.value;


  if (!email || !password) {

    loginMessage.textContent =
      "❌ Vui lòng nhập email và mật khẩu.";

    loginMessage.style.color =
      "#dc2626";

    return;

  }


  loginBtn.disabled = true;

  loginBtn.textContent =
    "⏳ ĐANG ĐĂNG NHẬP...";


  const {
    data,
    error
  } =
    await client.auth.signInWithPassword({
      email,
      password
    });


  if (error) {

    console.error(error);

    loginMessage.textContent =
      "❌ Đăng nhập thất bại: " +
      error.message;

    loginMessage.style.color =
      "#dc2626";

    loginBtn.disabled = false;

    loginBtn.textContent =
      "🔐 ĐĂNG NHẬP";

    return;

  }


  if (!data.session) {

    loginMessage.textContent =
      "❌ Không tạo được phiên đăng nhập.";

    loginBtn.disabled = false;

    loginBtn.textContent =
      "🔐 ĐĂNG NHẬP";

    return;

  }


  loginMessage.textContent =
    "";

  loginBox.style.display =
    "none";

  managerBox.style.display =
    "block";


  loginBtn.disabled = false;

  loginBtn.textContent =
    "🔐 ĐĂNG NHẬP";


  await loadData();

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


  currentPage = 1;

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

      currentPage = 1;

      applyCurrentFilter();

    }
  );

}


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
// HIỂN THỊ DỮ LIỆU
// =====================================================

function renderData() {

  tableBody.innerHTML =
    "";


  // ---------------------------------------------
  // THỐNG KÊ
  // ---------------------------------------------

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


  // ---------------------------------------------
  // KHÔNG CÓ DỮ LIỆU
  // ---------------------------------------------

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


  // ---------------------------------------------
  // PHÂN TRANG
  // ---------------------------------------------

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
      currentPage - 1
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


  // ---------------------------------------------
  // RENDER
  // ---------------------------------------------

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
            data-edit-id="${escapeHtml(
              String(row.id)
            )}"
          >
            ✏️ SỬA
          </button>

          <button
            class="delete-btn"
            type="button"
            data-delete-id="${escapeHtml(
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


  // ---------------------------------------------
  // GẮN EVENT SỬA
  // ---------------------------------------------

  tableBody
    .querySelectorAll(
      "[data-edit-id]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            const id =
              button.dataset.editId;

            openEditUserModal(
              id
            );

          }
        );

      }
    );


  // ---------------------------------------------
  // GẮN EVENT XÓA
  // ---------------------------------------------

  tableBody
    .querySelectorAll(
      "[data-delete-id]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            const id =
              button.dataset.deleteId;

            deleteReport(
              id
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

  const sourceData =
    filteredData;


  const uniqueUsers =
    getUniqueUsers(
      sourceData
    );


  submittedUserCount.textContent =
    uniqueUsers.length;

}


// =====================================================
// LẤY DANH SÁCH CÁN BỘ KHÔNG TRÙNG
// =====================================================

function getUniqueUsers(data) {

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
// HIỂN THỊ CÁN BỘ ĐÃ NHẬP
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
              <div class="submitted-user-item">

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


  const closeBtn =
    modal.querySelector(
      ".user-modal-close"
    );


  closeBtn.addEventListener(
    "click",
    () => {

      overlay.remove();

    }
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
// MODAL SỬA CÁN BỘ
// =====================================================

function openEditUserModal(id) {

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
      value="${escapeAttribute(
        oldName
      )}"
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
    () => {

      overlay.remove();

    }
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
// UPDATE USER_NAME TRỰC TIẾP SUPABASE
// =====================================================

async function updateUserName(
  id,
  newName,
  overlay,
  saveBtn
) {

  try {

    /*
      QUAN TRỌNG:

      Đây là phần cập nhật trực tiếp
      cột user_name trong bảng
      bao_cao_ngay.
    */

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


    /*
      Nếu Supabase trả về [] thì
      rất có thể RLS đang chặn UPDATE.
    */

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


    // ---------------------------------------------
    // CẬP NHẬT LOCAL DATA NGAY LẬP TỨC
    // ---------------------------------------------

    const updatedRow =
      data[0];


    const index =
      allData.findIndex(
        item =>
          String(item.id) ===
          String(id)
      );


    if (index !== -1) {

      allData[index] =
        {
          ...allData[index],
          ...updatedRow
        };

    }


    // ---------------------------------------------
    // ĐÓNG MODAL
    // ---------------------------------------------

    overlay.remove();


    // ---------------------------------------------
    // VẼ LẠI BẢNG
    // ---------------------------------------------

    applyCurrentFilter();


    // ---------------------------------------------
    // CẬP NHẬT SỐ CÁN BỘ
    // ---------------------------------------------

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

    console.error(
      error
    );


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

async function deleteReport(id) {

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

    console.error(
      error
    );


    alert(
      "❌ Xóa thất bại:\n\n" +
      error.message
    );

    return;

  }


  // ---------------------------------------------
  // XÓA KHỎI LOCAL DATA
  // ---------------------------------------------

  allData =
    allData.filter(
      item =>
        String(item.id) !==
        String(id)
    );


  // ---------------------------------------------
  // HIỂN THỊ LẠI
  // ---------------------------------------------

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


  // ---------------------------------------------
  // NÚT TRƯỚC
  // ---------------------------------------------

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


  // ---------------------------------------------
  // DANH SÁCH TRANG
  // ---------------------------------------------

  const pages =
    getPaginationPages(
      currentPage,
      totalPages
    );


  pages.forEach(
    page => {

      if (page === "...") {

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


  // ---------------------------------------------
  // NÚT SAU
  // ---------------------------------------------

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
// TẠO DANH SÁCH TRANG
// =====================================================

function getPaginationPages(
  current,
  total
) {

  if (total <= 7) {

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


  if (current > 4) {

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
// LOGOUT
// =====================================================

if (logoutBtn) {

  logoutBtn.addEventListener(
    "click",
    async () => {

      await client.auth.signOut();


      allData = [];

      filteredData = [];

      currentPage = 1;


      managerBox.style.display =
        "none";

      loginBox.style.display =
        "block";


      tableBody.innerHTML =
        "";

      pagination.innerHTML =
        "";


      totalReports.textContent =
        "0";

      totalAmount.textContent =
        "0 đ";

      submittedUserCount.textContent =
        "0";


      passwordInput.value =
        "";

      loginMessage.textContent =
        "";

    }
  );

}


// =====================================================
// FORMAT MONEY
// =====================================================

function parseMoney(value) {

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


  /*
    Xử lý:

    6,000,000
    6000000
    6.000.000
    6000000đ
  */

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
        .slice(0, 10)
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

// ========================================
// KHỞI TẠO SUPABASE
// ========================================

if (!window.supabase) {
  alert(
    "❌ Không tải được Supabase. Hãy kiểm tra Internet."
  );

  throw new Error(
    "Supabase library chưa được tải."
  );
}

if (
  !window.SUPABASE_URL ||
  !window.SUPABASE_ANON_KEY
) {
  alert(
    "❌ Chưa cấu hình Supabase. Kiểm tra config.js."
  );

  throw new Error(
    "Thiếu SUPABASE_URL hoặc SUPABASE_ANON_KEY."
  );
}

const client =
  window.supabase.createClient(
    window.SUPABASE_URL,
    window.SUPABASE_ANON_KEY
  );


// ========================================
// ELEMENT
// ========================================

const loginBox =
  document.getElementById("loginBox");

const managerBox =
  document.getElementById("managerBox");

const loginMessage =
  document.getElementById("loginMessage");

const managerMessage =
  document.getElementById("managerMessage");

const tableBody =
  document.getElementById("tableBody");

const pagination =
  document.getElementById("pagination");

const emailInput =
  document.getElementById("email");

const passwordInput =
  document.getElementById("password");

const loginBtn =
  document.getElementById("loginBtn");

const logoutBtn =
  document.getElementById("logoutBtn");

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
  document.getElementById(
    "showSubmittedUsersBtn"
  );

const submittedUserCount =
  document.getElementById(
    "submittedUserCount"
  );

const totalReports =
  document.getElementById(
    "totalReports"
  );

const totalAmount =
  document.getElementById(
    "totalAmount"
  );


// ========================================
// BIẾN
// ========================================

let allData = [];

let filteredData = [];

let currentPage = 1;

const rowsPerPage = 20;


// ========================================
// KHỞI TẠO
// ========================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    setupEvents();

    checkLogin();

  }
);


// ========================================
// EVENT
// ========================================

function setupEvents() {

  if (loginBtn) {

    loginBtn.addEventListener(
      "click",
      login
    );

  }


  if (logoutBtn) {

    logoutBtn.addEventListener(
      "click",
      logout
    );

  }


  if (filterBtn) {

    filterBtn.addEventListener(
      "click",
      () => {

        currentPage = 1;

        applyCurrentFilter();

      }
    );

  }


  if (refreshBtn) {

    refreshBtn.addEventListener(
      "click",
      loadData
    );

  }


  if (exportBtn) {

    exportBtn.addEventListener(
      "click",
      exportExcel
    );

  }


  if (showSubmittedUsersBtn) {

    showSubmittedUsersBtn.addEventListener(
      "click",
      showSubmittedUsers
    );

  }


  // ENTER ĐỂ ĐĂNG NHẬP

  if (emailInput) {

    emailInput.addEventListener(
      "keydown",
      event => {

        if (event.key === "Enter") {

          login();

        }

      }
    );

  }


  if (passwordInput) {

    passwordInput.addEventListener(
      "keydown",
      event => {

        if (event.key === "Enter") {

          login();

        }

      }
    );

  }

}


// ========================================
// KIỂM TRA LOGIN
// ========================================

async function checkLogin() {

  try {

    const {
      data,
      error
    } =
      await client.auth.getSession();


    if (error) {

      console.error(
        "Lỗi kiểm tra session:",
        error
      );

      return;

    }


    if (
      data &&
      data.session &&
      data.session.user
    ) {

      showManager();

      await loadData();

    }

  } catch (error) {

    console.error(error);

  }

}


// ========================================
// ĐĂNG NHẬP
// ========================================

async function login() {

  const email =
    emailInput.value.trim();

  const password =
    passwordInput.value;


  if (!email) {

    loginMessage.textContent =
      "❌ Vui lòng nhập email.";

    return;

  }


  if (!password) {

    loginMessage.textContent =
      "❌ Vui lòng nhập mật khẩu.";

    return;

  }


  loginMessage.textContent =
    "⏳ Đang đăng nhập...";


  loginBtn.disabled = true;


  try {

    const {
      data,
      error
    } =
      await client.auth.signInWithPassword({
        email: email,
        password: password
      });


    if (error) {

      console.error(error);

      loginMessage.textContent =
        "❌ Email hoặc mật khẩu không đúng.";

      loginBtn.disabled = false;

      return;

    }


    if (
      !data ||
      !data.user
    ) {

      loginMessage.textContent =
        "❌ Không thể đăng nhập.";

      loginBtn.disabled = false;

      return;

    }


    loginMessage.textContent =
      "✅ Đăng nhập thành công.";


    showManager();


    await loadData();


  } catch (error) {

    console.error(error);

    loginMessage.textContent =
      "❌ Có lỗi xảy ra khi đăng nhập.";

  }


  loginBtn.disabled = false;

}


// ========================================
// HIỆN MANAGER
// ========================================

function showManager() {

  if (loginBox) {

    loginBox.style.display =
      "none";

  }


  if (managerBox) {

    managerBox.style.display =
      "block";

  }

}


// ========================================
// HIỆN LOGIN
// ========================================

function showLogin() {

  if (loginBox) {

    loginBox.style.display =
      "block";

  }


  if (managerBox) {

    managerBox.style.display =
      "none";

  }

}


// ========================================
// LOAD DATA
// ========================================

async function loadData() {

  showManagerMessage(
    "⏳ Đang tải dữ liệu..."
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

      console.error(
        "Lỗi load báo cáo:",
        error
      );

      showManagerMessage(
        "❌ Không tải được dữ liệu: " +
        error.message
      );

      return;

    }


    allData =
      Array.isArray(data)
        ? data
        : [];


    currentPage = 1;


    updateSubmittedUserCount();


    applyCurrentFilter();


    showManagerMessage(
      "✅ Đã cập nhật dữ liệu."
    );


    setTimeout(
      () => {

        if (
          managerMessage
        ) {

          managerMessage.textContent =
            "";

        }

      },
      2000
    );


  } catch (error) {

    console.error(error);

    showManagerMessage(
      "❌ Có lỗi khi tải dữ liệu."
    );

  }

}


// ========================================
// LỌC DỮ LIỆU
// ========================================

function applyCurrentFilter() {

  const userText =
    filterUser
      ? filterUser.value
          .trim()
          .toLowerCase()
      : "";


  const dateText =
    filterDate
      ? filterDate.value
      : "";


  filteredData =
    allData.filter(row => {

      const rowUser =
        String(
          row.user_name || ""
        )
          .trim()
          .toLowerCase();


      const rowDate =
        String(
          row.field_date || ""
        ).trim();


      const matchUser =
        !userText ||
        rowUser.includes(userText);


      const matchDate =
        !dateText ||
        rowDate === dateText;


      return (
        matchUser &&
        matchDate
      );

    });


  currentPage = Math.min(
    currentPage,
    Math.max(
      1,
      Math.ceil(
        filteredData.length /
        rowsPerPage
      )
    )
  );


  renderData();

}


// ========================================
// RENDER TABLE
// ========================================

function renderData() {

  if (!tableBody) {
    return;
  }


  // ======================================
  // TỔNG BÁO CÁO
  // ======================================

  if (totalReports) {

    totalReports.textContent =
      filteredData.length;

  }


  // ======================================
  // TỔNG DỰ THU
  // ======================================

  let total = 0;


  filteredData.forEach(row => {

    total +=
      parseMoney(
        row.expected_amount
      );

  });


  if (totalAmount) {

    totalAmount.textContent =
      formatMoney(total) +
      " đ";

  }


  // ======================================
  // PHÂN TRANG
  // ======================================

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


  // ======================================
  // KHÔNG CÓ DỮ LIỆU
  // ======================================

  if (
    pageData.length === 0
  ) {

    tableBody.innerHTML = `
      <tr>
        <td
          colspan="10"
          style="
            text-align:center;
            padding:30px;
          "
        >
          📭 Không có dữ liệu
        </td>
      </tr>
    `;

  } else {


    // ====================================
    // HIỂN THỊ DỮ LIỆU
    // ====================================

    tableBody.innerHTML =
      pageData
        .map(row => {

          return `
            <tr>

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

              <td
                style="
                  white-space:normal;
                  min-width:250px;
                "
              >
                ${escapeHtml(
                  row.detail || ""
                )}
              </td>

              <td>
                ${formatMoney(
                  parseMoney(
                    row.expected_amount
                  )
                )} đ
              </td>

              <td
                style="
                  white-space:normal;
                  min-width:250px;
                "
              >
                ${escapeHtml(
                  row.next_action || ""
                )}
              </td>

              <!-- ======================
                   THAO TÁC
              ======================= -->

              <td>

                <div class="action-buttons">

                  <button
                    class="edit-btn"
                    onclick="editReport('${escapeJs(
                      row.id
                    )}')"
                  >
                    ✏️ Sửa
                  </button>

                  <button
                    class="delete-btn"
                    onclick="deleteReport('${escapeJs(
                      row.id
                    )}')"
                  >
                    🗑️ Xóa
                  </button>

                </div>

              </td>

            </tr>
          `;

        })
        .join("");

  }


  renderPagination();

}


// ========================================
// ĐẾM CÁN BỘ
// ========================================

function updateSubmittedUserCount() {

  const uniqueUsers =
    new Set();


  allData.forEach(row => {

    const name =
      String(
        row.user_name || ""
      )
        .trim();


    if (name) {

      uniqueUsers.add(
        name.toLowerCase()
      );

    }

  });


  if (submittedUserCount) {

    submittedUserCount.textContent =
      uniqueUsers.size;

  }

}


// ========================================
// DANH SÁCH CÁN BỘ
// ========================================

function showSubmittedUsers() {

  const usersMap =
    new Map();


  allData.forEach(row => {

    const originalName =
      String(
        row.user_name || ""
      ).trim();


    if (!originalName) {
      return;
    }


    const key =
      originalName.toLowerCase();


    if (!usersMap.has(key)) {

      usersMap.set(
        key,
        originalName
      );

    }

  });


  const users =
    Array.from(
      usersMap.values()
    );


  users.sort(
    (a, b) =>
      a.localeCompare(
        b,
        "vi"
      )
  );


  // ======================================
  // MODAL
  // ======================================

  const overlay =
    document.createElement(
      "div"
    );


  overlay.className =
    "user-modal-overlay";


  overlay.id =
    "submittedUsersModal";


  const modal =
    document.createElement(
      "div"
    );


  modal.className =
    "user-modal";


  // ======================================
  // HEADER
  // ======================================

  const header =
    document.createElement(
      "div"
    );


  header.className =
    "user-modal-header";


  const title =
    document.createElement(
      "h2"
    );


  title.textContent =
    `👥 CÁN BỘ ĐÃ NHẬP BÁO CÁO (${users.length})`;


  const closeBtn =
    document.createElement(
      "button"
    );


  closeBtn.className =
    "user-modal-close";


  closeBtn.textContent =
    "×";


  closeBtn.onclick =
    closeSubmittedUsers;


  header.appendChild(
    title
  );


  header.appendChild(
    closeBtn
  );


  // ======================================
  // BODY
  // ======================================

  const body =
    document.createElement(
      "div"
    );


  body.className =
    "user-modal-body";


  if (
    users.length === 0
  ) {

    body.innerHTML = `
      <div class="no-user">
        📭 Chưa có cán bộ nào nhập báo cáo.
      </div>
    `;

  } else {

    users.forEach(
      (
        user,
        index
      ) => {

        const item =
          document.createElement(
            "div"
          );


        item.className =
          "submitted-user-item";


        item.innerHTML = `

          <span
            class="submitted-user-number"
          >
            ${index + 1}
          </span>

          <span>
            ${escapeHtml(user)}
          </span>

        `;


        body.appendChild(
          item
        );

      }
    );

  }


  modal.appendChild(
    header
  );


  modal.appendChild(
    body
  );


  overlay.appendChild(
    modal
  );


  document.body.appendChild(
    overlay
  );


  overlay.addEventListener(
    "click",
    event => {

      if (
        event.target ===
        overlay
      ) {

        closeSubmittedUsers();

      }

    }
  );

}


// ========================================
// ✏️ SỬA BÁO CÁO
// ========================================

async function editReport(id) {

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


  const newName =
    prompt(
      "✏️ Nhập tên cán bộ đúng:",
      oldName
    );


  // Người dùng bấm Hủy

  if (
    newName === null
  ) {

    return;

  }


  const cleanName =
    newName.trim();


  if (!cleanName) {

    alert(
      "❌ Tên cán bộ không được để trống."
    );

    return;

  }


  // Không thay đổi

  if (
    cleanName === oldName
  ) {

    return;

  }


  showManagerMessage(
    "⏳ Đang cập nhật tên cán bộ..."
  );


  try {

    const {
      error
    } =
      await client
        .from("bao_cao_ngay")
        .update({
          user_name: cleanName
        })
        .eq(
          "id",
          id
        );


    if (error) {

      console.error(
        "Lỗi cập nhật cán bộ:",
        error
      );


      showManagerMessage(
        "❌ Sửa thất bại: " +
        error.message
      );


      alert(
        "❌ Không thể sửa cán bộ.\n\n" +
        error.message
      );


      return;

    }


    // ====================================
    // CẬP NHẬT LOCAL DATA
    // ====================================

    const index =
      allData.findIndex(
        item =>
          String(item.id) ===
          String(id)
      );


    if (index !== -1) {

      allData[index].user_name =
        cleanName;

    }


    // Cập nhật số cán bộ

    updateSubmittedUserCount();


    // Lọc + render lại

    applyCurrentFilter();


    showManagerMessage(
      "✅ Đã sửa tên cán bộ thành công."
    );


    setTimeout(
      () => {

        if (
          managerMessage
        ) {

          managerMessage.textContent =
            "";

        }

      },
      2500
    );


  } catch (error) {

    console.error(
      error
    );


    showManagerMessage(
      "❌ Có lỗi khi sửa cán bộ."
    );


    alert(
      "❌ Có lỗi khi sửa cán bộ."
    );

  }

}


// ========================================
// ĐÓNG MODAL
// ========================================

function closeSubmittedUsers() {

  const modal =
    document.getElementById(
      "submittedUsersModal"
    );


  if (modal) {

    modal.remove();

  }

}


// ========================================
// XÓA BÁO CÁO
// ========================================

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


  const confirmed =
    confirm(
      "Bạn có chắc muốn xóa báo cáo này không?"
    );


  if (!confirmed) {

    return;

  }


  showManagerMessage(
    "⏳ Đang xóa báo cáo..."
  );


  try {

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


      showManagerMessage(
        "❌ Xóa thất bại: " +
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


    updateSubmittedUserCount();


    applyCurrentFilter();


    showManagerMessage(
      "✅ Đã xóa báo cáo."
    );


    setTimeout(
      () => {

        if (
          managerMessage
        ) {

          managerMessage.textContent =
            "";

        }

      },
      2000
    );


  } catch (error) {

    console.error(error);


    showManagerMessage(
      "❌ Có lỗi khi xóa."
    );

  }

}


// ========================================
// XUẤT EXCEL
// ========================================

function exportExcel() {

  if (
    !filteredData ||
    filteredData.length === 0
  ) {

    alert(
      "❌ Không có dữ liệu để xuất Excel."
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


  const excelData =
    filteredData.map(
      row => ({

        "Cán bộ":
          row.user_name || "",

        "Ngày field":
          row.field_date || "",

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
          row.next_action || "",

        "Thời gian nhập":
          row.created_at || ""

      })
    );


  const worksheet =
    XLSX.utils.json_to_sheet(
      excelData
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


  showManagerMessage(
    "✅ Đã xuất Excel thành công."
  );


  setTimeout(
    () => {

      if (
        managerMessage
      ) {

        managerMessage.textContent =
          "";

      }

    },
    2000
  );

}


// ========================================
// ĐĂNG XUẤT
// ========================================

async function logout() {

  try {

    await client.auth.signOut();

  } catch (error) {

    console.error(
      error
    );

  }


  allData = [];

  filteredData = [];

  currentPage = 1;


  showLogin();


  if (emailInput) {

    emailInput.value =
      "";

  }


  if (passwordInput) {

    passwordInput.value =
      "";

  }


  if (submittedUserCount) {

    submittedUserCount.textContent =
      "0";

  }


  if (totalReports) {

    totalReports.textContent =
      "0";

  }


  if (totalAmount) {

    totalAmount.textContent =
      "0 đ";

  }


  if (tableBody) {

    tableBody.innerHTML =
      "";

  }


  if (pagination) {

    pagination.innerHTML =
      "";

  }


  if (loginMessage) {

    loginMessage.textContent =
      "🚪 Đã đăng xuất.";

  }

}


// ========================================
// MESSAGE
// ========================================

function showManagerMessage(
  message
) {

  if (
    managerMessage
  ) {

    managerMessage.textContent =
      message;

  }

}


// ========================================
// PARSE MONEY
// ========================================

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

    return isNaN(value)
      ? 0
      : value;

  }


  let text =
    String(value).trim();


  if (!text) {

    return 0;

  }


  text =
    text.replace(
      /đ/gi,
      ""
    );


  text =
    text.replace(
      /\s/g,
      ""
    );


  if (
    text.includes(",") &&
    text.includes(".")
  ) {

    const lastComma =
      text.lastIndexOf(",");

    const lastDot =
      text.lastIndexOf(".");


    if (
      lastComma >
      lastDot
    ) {

      text =
        text.replace(
          /\./g,
          ""
        );

      text =
        text.replace(
          ",",
          "."
        );

    } else {

      text =
        text.replace(
          /,/g,
          ""
        );

    }

  } else {

    if (
      text.includes(",")
    ) {

      text =
        text.replace(
          /,/g,
          ""
        );

    }


    if (
      text.includes(".")
    ) {

      const parts =
        text.split(".");


      if (
        parts.length > 2 ||
        (
          parts.length === 2 &&
          parts[1].length === 3
        )
      ) {

        text =
          text.replace(
            /\./g,
            ""
          );

      }

    }

  }


  const number =
    Number(text);


  return isNaN(number)
    ? 0
    : number;

}


// ========================================
// FORMAT MONEY
// ========================================

function formatMoney(
  value
) {

  const number =
    Number(value || 0);


  return number.toLocaleString(
    "vi-VN"
  );

}


// ========================================
// FORMAT DATE
// ========================================

function formatDate(
  value
) {

  if (!value) {

    return "";

  }


  const text =
    String(value);


  const match =
    text.match(
      /^(\d{4})-(\d{2})-(\d{2})/
    );


  if (match) {

    return (
      match[3] +
      "/" +
      match[2] +
      "/" +
      match[1]
    );

  }


  return escapeHtml(
    text
  );

}


// ========================================
// ESCAPE HTML
// ========================================

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


// ========================================
// ESCAPE JS
// ========================================

function escapeJs(
  value
) {

  return String(
    value ?? ""
  )
    .replace(
      /\\/g,
      "\\\\"
    )
    .replace(
      /'/g,
      "\\'"
    )
    .replace(
      /"/g,
      '\\"'
    )
    .replace(
      /\r/g,
      "\\r"
    )
    .replace(
      /\n/g,
      "\\n"
    );

}


// ========================================
// CUỘN VỀ BẢNG
// ========================================

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


// ========================================
// PAGINATION
// ========================================

function renderPagination() {

  if (!pagination) {

    return;

  }


  pagination.innerHTML = "";


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


  // TRANG TRƯỚC

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
    () => {

      if (
        currentPage > 1
      ) {

        currentPage--;

        renderData();

        scrollToTable();

      }

    };


  pagination.appendChild(
    prev
  );


  // DANH SÁCH TRANG

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
            "button"
          );


        dots.textContent =
          "...";


        dots.disabled =
          true;


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
        page === currentPage
      ) {

        btn.classList.add(
          "active"
        );

      }


      btn.onclick =
        () => {

          currentPage =
            page;

          renderData();

          scrollToTable();

        };


      pagination.appendChild(
        btn
      );

    }
  );


  // TRANG SAU

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
    () => {

      if (
        currentPage <
        totalPages
      ) {

        currentPage++;

        renderData();

        scrollToTable();

      }

    };


  pagination.appendChild(
    next
  );

}


// ========================================
// PAGINATION PAGES
// ========================================

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


// ========================================
// WINDOW
// ========================================

window.deleteReport =
  deleteReport;

window.editReport =
  editReport;

window.closeSubmittedUsers =
  closeSubmittedUsers;

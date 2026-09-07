// ============================================
// KHỞI TẠO SUPABASE
// ============================================

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


// ============================================
// ELEMENT
// ============================================

const loginBox =
  document.getElementById("loginBox");

const managerBox =
  document.getElementById("managerBox");

const loginMessage =
  document.getElementById("loginMessage");

const managerMessage =
  document.getElementById("managerMessage");

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
  document.getElementById("totalReports");

const totalAmount =
  document.getElementById("totalAmount");

const tableBody =
  document.getElementById("tableBody");

const pagination =
  document.getElementById("pagination");


// ============================================
// BIẾN
// ============================================

let allData = [];

let filteredData = [];

let currentPage = 1;

const rowsPerPage = 20;


// ============================================
// KHỞI TẠO
// ============================================

document.addEventListener(
  "DOMContentLoaded",
  async function () {

    const {
      data: {
        session
      }
    } =
      await client.auth.getSession();


    if (session) {

      showManager();

      await loadData();

    }

  }
);


// ============================================
// LOGIN
// ============================================

loginBtn.addEventListener(
  "click",
  login
);


passwordInput.addEventListener(
  "keydown",
  function (event) {

    if (event.key === "Enter") {

      login();

    }

  }
);


emailInput.addEventListener(
  "keydown",
  function (event) {

    if (event.key === "Enter") {

      passwordInput.focus();

    }

  }
);


async function login() {

  const email =
    emailInput.value.trim();

  const password =
    passwordInput.value;


  if (!email || !password) {

    showLoginMessage(
      "❌ Vui lòng nhập email và mật khẩu.",
      true
    );

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

      email: email,

      password: password

    });


  if (error) {

    showLoginMessage(
      "❌ " + error.message,
      true
    );

    loginBtn.disabled = false;

    loginBtn.textContent =
      "🔐 ĐĂNG NHẬP";

    return;

  }


  if (!data.session) {

    showLoginMessage(
      "❌ Không tạo được phiên đăng nhập.",
      true
    );

    loginBtn.disabled = false;

    loginBtn.textContent =
      "🔐 ĐĂNG NHẬP";

    return;

  }


  showManager();


  await loadData();


  loginBtn.disabled = false;

  loginBtn.textContent =
    "🔐 ĐĂNG NHẬP";

}


// ============================================
// HIỆN MANAGER
// ============================================

function showManager() {

  loginBox.style.display =
    "none";

  managerBox.style.display =
    "block";

  loginMessage.textContent =
    "";

}


// ============================================
// LOGIN MESSAGE
// ============================================

function showLoginMessage(
  message,
  error = false
) {

  loginMessage.textContent =
    message;

  loginMessage.style.color =
    error
      ? "#dc2626"
      : "#16a34a";

}


// ============================================
// LOAD DATA
// ============================================

async function loadData() {

  showManagerMessage(
    "⏳ Đang tải dữ liệu...",
    false
  );


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
      "LOAD DATA ERROR:",
      error
    );


    showManagerMessage(
      "❌ Tải dữ liệu thất bại: " +
      error.message,
      true
    );

    return;

  }


  allData =
    Array.isArray(data)
      ? data
      : [];


  currentPage = 1;


  applyCurrentFilter();


  updateSubmittedUserCount();


  showManagerMessage(
    "✅ Đã cập nhật dữ liệu.",
    false
  );


  setTimeout(
    function () {

      if (
        managerMessage.textContent ===
        "✅ Đã cập nhật dữ liệu."
      ) {

        managerMessage.textContent =
          "";

      }

    },
    2000
  );

}


// ============================================
// LỌC DỮ LIỆU
// ============================================

filterBtn.addEventListener(
  "click",
  function () {

    currentPage = 1;

    applyCurrentFilter();

  }
);


// ============================================
// ENTER Ở Ô LỌC
// ============================================

filterUser.addEventListener(
  "keydown",
  function (event) {

    if (event.key === "Enter") {

      currentPage = 1;

      applyCurrentFilter();

    }

  }
);


filterDate.addEventListener(
  "change",
  function () {

    currentPage = 1;

    applyCurrentFilter();

  }
);


// ============================================
// APPLY FILTER
// ============================================

function applyCurrentFilter() {

  const userKeyword =
    filterUser.value
      .trim()
      .toLowerCase();


  const dateKeyword =
    filterDate.value
      .trim();


  filteredData =
    allData.filter(
      function (row) {

        const userName =
          String(
            row.user_name || ""
          )
            .trim()
            .toLowerCase();


        const fieldDate =
          String(
            row.field_date || ""
          ).trim();


        const matchUser =
          !userKeyword ||
          userName.includes(
            userKeyword
          );


        const matchDate =
          !dateKeyword ||
          fieldDate === dateKeyword;


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
        rowsPerPage
      )
    );


  if (
    currentPage > totalPages
  ) {

    currentPage =
      totalPages;

  }


  renderData();


  /*
   * QUAN TRỌNG:
   *
   * Số cán bộ được tính lại
   * từ dữ liệu hiện tại sau
   * mỗi lần lọc.
   */

  updateSubmittedUserCount();

}


// ============================================
// TÍNH DANH SÁCH CÁN BỘ DUY NHẤT
// ============================================

function getUniqueUsers(
  data = allData
) {

  const uniqueUsers =
    new Map();


  data.forEach(
    function (row) {

      const originalName =
        String(
          row.user_name || ""
        ).trim();


      if (!originalName) {

        return;

      }


      /*
       * Dùng lowercase để:
       *
       * Hoinv12
       * hoinv12
       * HOINV12
       *
       * được xem là cùng một cán bộ.
       */

      const key =
        originalName.toLowerCase();


      /*
       * Nếu tên đã tồn tại
       * thì KHÔNG thêm lần nữa.
       */

      if (!uniqueUsers.has(key)) {

        uniqueUsers.set(
          key,
          originalName
        );

      }

    }
  );


  return Array.from(
    uniqueUsers.values()
  ).sort(
    function (a, b) {

      return a.localeCompare(
        b,
        "vi"
      );

    }
  );

}


// ============================================
// CẬP NHẬT SỐ CÁN BỘ
// ============================================

function updateSubmittedUserCount() {

  /*
   * Dùng filteredData.
   *
   * Vì vậy nếu đang lọc:
   *
   * cán bộ = Hoinv12
   *
   * thì số cán bộ cũng phản ánh
   * đúng dữ liệu đang hiển thị.
   *
   * Khi không lọc thì filteredData
   * chính là toàn bộ dữ liệu.
   */

  const users =
    getUniqueUsers(
      filteredData
    );


  submittedUserCount.textContent =
    users.length;

}


// ============================================
// HIỂN THỊ BẢNG
// ============================================

function renderData() {

  tableBody.innerHTML =
    "";


  const total =
    filteredData.length;


  /*
   * Tổng báo cáo
   */

  totalReports.textContent =
    total;


  /*
   * Tổng dự thu
   */

  let totalMoney = 0;


  filteredData.forEach(
    function (row) {

      totalMoney +=
        parseMoney(
          row.expected_amount
        );

    }
  );


  totalAmount.textContent =
    formatMoney(
      totalMoney
    ) + " đ";


  /*
   * Không có dữ liệu
   */

  if (total === 0) {

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
          Không có dữ liệu.
        </td>
      </tr>
    `;

    renderPagination();

    return;

  }


  /*
   * Tính phân trang
   */

  const start =
    (currentPage - 1) *
    rowsPerPage;


  const end =
    start + rowsPerPage;


  const pageData =
    filteredData.slice(
      start,
      end
    );


  pageData.forEach(
    function (row) {

      const tr =
        document.createElement(
          "tr"
        );


      tr.innerHTML = `

        <td>
          ${escapeHtml(
            row.user_name
          )}
        </td>

        <td>
          ${formatDate(
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
          ${formatMoney(
            parseMoney(
              row.expected_amount
            )
          )}
        </td>

        <td>
          ${escapeHtml(
            row.next_action
          )}
        </td>

        <td>

          <div class="action-buttons">

            <button
              class="edit-btn"
              onclick="editReport('${escapeJs(
                row.id
              )}')"
            >
              ✏️ SỬA
            </button>

            <button
              class="delete-btn"
              onclick="deleteReport('${escapeJs(
                row.id
              )}')"
            >
              🗑️ XÓA
            </button>

          </div>

        </td>

      `;


      tableBody.appendChild(
        tr
      );

    }
  );


  renderPagination();

}


// ============================================
// PHÂN TRANG
// ============================================

function renderPagination() {

  pagination.innerHTML =
    "";


  const totalPages =
    Math.ceil(
      filteredData.length /
      rowsPerPage
    );


  if (totalPages <= 1) {

    return;

  }


  /*
   * NÚT TRƯỚC
   */

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

        renderData();

        scrollToTable();

      }

    };

  pagination.appendChild(
    prev
  );


  /*
   * Tạo danh sách trang
   */

  const pages =
    getPaginationPages(
      currentPage,
      totalPages
    );


  pages.forEach(
    function (page) {

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
        page === currentPage
      ) {

        btn.classList.add(
          "active"
        );

      }


      btn.onclick =
        function () {

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


  /*
   * NÚT SAU
   */

  const next =
    document.createElement(
      "button"
    );

  next.className =
    "arrow";

  next.textContent =
    "›";

  next.disabled =
    currentPage === totalPages;

  next.onclick =
    function () {

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


// ============================================
// TẠO SỐ TRANG
// ============================================

function getPaginationPages(
  current,
  total
) {

  const pages = [];


  if (total <= 7) {

    for (
      let i = 1;
      i <= total;
      i++
    ) {

      pages.push(i);

    }

    return pages;

  }


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
    current < total - 3
  ) {

    pages.push("...");

  }


  pages.push(total);


  return pages;

}


// ============================================
// HIỂN THỊ DANH SÁCH CÁN BỘ
// ============================================

showSubmittedUsersBtn.addEventListener(
  "click",
  showSubmittedUsers
);


function showSubmittedUsers() {

  /*
   * LUÔN LẤY DANH SÁCH MỚI NHẤT
   * từ filteredData.
   *
   * Không sử dụng danh sách cũ.
   */

  const users =
    getUniqueUsers(
      filteredData
    );


  /*
   * Tạo overlay
   */

  const overlay =
    document.createElement(
      "div"
    );

  overlay.className =
    "user-modal-overlay";


  /*
   * Modal
   */

  const modal =
    document.createElement(
      "div"
    );

  modal.className =
    "user-modal";


  /*
   * Header
   */

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


  header.appendChild(
    title
  );

  header.appendChild(
    closeBtn
  );


  /*
   * Body
   */

  const body =
    document.createElement(
      "div"
    );

  body.className =
    "user-modal-body";


  if (users.length === 0) {

    body.innerHTML = `
      <div class="no-user">
        Chưa có cán bộ nào nhập báo cáo.
      </div>
    `;

  } else {

    users.forEach(
      function (name, index) {

        const item =
          document.createElement(
            "div"
          );

        item.className =
          "submitted-user-item";


        item.innerHTML = `

          <div class="submitted-user-number">
            ${index + 1}
          </div>

          <div>
            ${escapeHtml(name)}
          </div>

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


  /*
   * Đóng
   */

  closeBtn.onclick =
    function () {

      overlay.remove();

    };


  /*
   * Bấm ra ngoài modal để đóng
   */

  overlay.addEventListener(
    "click",
    function (event) {

      if (
        event.target ===
        overlay
      ) {

        overlay.remove();

      }

    }
  );


  /*
   * ESC để đóng
   */

  function escHandler(event) {

    if (
      event.key === "Escape"
    ) {

      overlay.remove();

      document.removeEventListener(
        "keydown",
        escHandler
      );

    }

  }


  document.addEventListener(
    "keydown",
    escHandler
  );

}


// ============================================
// SỬA BÁO CÁO
// ============================================

async function editReport(id) {

  const row =
    allData.find(
      function (item) {

        return String(item.id) ===
          String(id);

      }
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


  /*
   * Tạo modal sửa
   */

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
      ✏️ SỬA TÊN CÁN BỘ
    </h2>

    <label>
      Tên cán bộ
    </label>

    <input
      id="editUserNameInput"
      type="text"
      value="${escapeHtml(
        oldName
      )}"
      placeholder="Nhập tên cán bộ"
      autocomplete="off"
    >

    <div class="edit-modal-buttons">

      <button
        class="cancel-edit-btn"
        id="cancelEditBtn"
      >
        HỦY
      </button>

      <button
        class="save-edit-btn"
        id="saveEditBtn"
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
    document.getElementById(
      "editUserNameInput"
    );

  const cancelBtn =
    document.getElementById(
      "cancelEditBtn"
    );

  const saveBtn =
    document.getElementById(
      "saveEditBtn"
    );


  input.focus();

  input.select();


  /*
   * HỦY
   */

  cancelBtn.onclick =
    function () {

      overlay.remove();

    };


  /*
   * Bấm ngoài modal
   */

  overlay.addEventListener(
    "click",
    function (event) {

      if (
        event.target ===
        overlay
      ) {

        overlay.remove();

      }

    }
  );


  /*
   * Enter để lưu
   */

  input.addEventListener(
    "keydown",
    function (event) {

      if (
        event.key === "Enter"
      ) {

        saveBtn.click();

      }

      if (
        event.key === "Escape"
      ) {

        overlay.remove();

      }

    }
  );


  /*
   * LƯU
   */

  saveBtn.onclick =
    async function () {

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
        newName === oldName
      ) {

        overlay.remove();

        return;

      }


      saveBtn.disabled =
        true;

      saveBtn.textContent =
        "⏳ ĐANG LƯU...";


      /*
       * Cập nhật Supabase
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
          "UPDATE USER ERROR:",
          error
        );


        alert(
          "❌ Sửa thất bại:\n" +
          error.message
        );


        saveBtn.disabled =
          false;

        saveBtn.textContent =
          "💾 LƯU";

        return;

      }


      /*
       * CỰC KỲ QUAN TRỌNG
       *
       * Cập nhật lại dữ liệu local.
       *
       * Không cần reload trang.
       */

      allData =
        allData.map(
          function (item) {

            if (
              String(item.id) ===
              String(id)
            ) {

              return {
                ...item,
                user_name:
                  newName
              };

            }

            return item;

          }
        );


      /*
       * Tính lại bộ lọc.
       */

      applyCurrentFilter();


      /*
       * Tính lại số cán bộ.
       */

      updateSubmittedUserCount();


      /*
       * Đóng modal.
       */

      overlay.remove();


      /*
       * Thông báo
       */

      showManagerMessage(
        `✅ Đã sửa "${oldName}" → "${newName}".`,
        false
      );


      setTimeout(
        function () {

          managerMessage.textContent =
            "";

        },
        2500
      );

    };

}


// ============================================
// XÓA BÁO CÁO
// ============================================

async function deleteReport(id) {

  const row =
    allData.find(
      function (item) {

        return String(item.id) ===
          String(id);

      }
    );


  if (!row) {

    alert(
      "❌ Không tìm thấy báo cáo."
    );

    return;

  }


  const userName =
    row.user_name ||
    "";


  const customerName =
    row.customer_name ||
    "";


  const confirmed =
    confirm(
      `Bạn có chắc muốn xóa báo cáo của cán bộ "${userName}" - khách hàng "${customerName}" không?`
    );


  if (!confirmed) {

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
      "DELETE ERROR:",
      error
    );


    showManagerMessage(
      "❌ Xóa thất bại: " +
      error.message,
      true
    );

    return;

  }


  /*
   * Xóa khỏi dữ liệu local.
   */

  allData =
    allData.filter(
      function (item) {

        return String(item.id) !==
          String(id);

      }
    );


  /*
   * Nếu trang hiện tại
   * vượt quá số trang mới
   * thì lùi lại.
   */

  const newTotalPages =
    Math.max(
      1,
      Math.ceil(
        filteredData.length /
        rowsPerPage
      )
    );


  if (
    currentPage >
    newTotalPages
  ) {

    currentPage =
      newTotalPages;

  }


  /*
   * Tính lại toàn bộ.
   */

  applyCurrentFilter();

  updateSubmittedUserCount();


  showManagerMessage(
    "✅ Đã xóa báo cáo.",
    false
  );


  setTimeout(
    function () {

      managerMessage.textContent =
        "";

    },
    2000
  );

}


// ============================================
// LÀM MỚI
// ============================================

refreshBtn.addEventListener(
  "click",
  async function () {

    refreshBtn.disabled =
      true;

    refreshBtn.textContent =
      "⏳ ĐANG TẢI...";


    await loadData();


    refreshBtn.disabled =
      false;

    refreshBtn.textContent =
      "🔄 LÀM MỚI";

  }
);


// ============================================
// XUẤT EXCEL
// ============================================

exportBtn.addEventListener(
  "click",
  exportExcel
);


function exportExcel() {

  if (
    !filteredData.length
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
      "❌ Không tải được thư viện Excel."
    );

    return;

  }


  const exportData =
    filteredData.map(
      function (row) {

        return {

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
            row.next_action || "",

          "Thời gian tạo":
            row.created_at
              ? formatDateTime(
                  row.created_at
                )
              : ""

        };

      }
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


  showManagerMessage(
    "✅ Đã xuất Excel.",
    false
  );


  setTimeout(
    function () {

      managerMessage.textContent =
        "";

    },
    2000
  );

}


// ============================================
// LOGOUT
// ============================================

logoutBtn.addEventListener(
  "click",
  logout
);


async function logout() {

  const {
    error
  } =
    await client.auth.signOut();


  if (error) {

    showManagerMessage(
      "❌ Đăng xuất thất bại: " +
      error.message,
      true
    );

    return;

  }


  allData = [];

  filteredData = [];

  currentPage = 1;


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


  managerBox.style.display =
    "none";

  loginBox.style.display =
    "block";


  emailInput.value =
    "";

  passwordInput.value =
    "";

  loginMessage.textContent =
    "";

  managerMessage.textContent =
    "";

}


// ============================================
// MESSAGE MANAGER
// ============================================

function showManagerMessage(
  message,
  error = false
) {

  managerMessage.textContent =
    message;

  managerMessage.style.color =
    error
      ? "#dc2626"
      : "#16a34a";

}


// ============================================
// SCROLL VỀ BẢNG
// ============================================

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


// ============================================
// XỬ LÝ TIỀN
// ============================================

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


  /*
   * Xử lý:
   *
   * 6000000
   * 6,000,000
   * 6.000.000
   * 6 000 000
   */

  let text =
    String(value)
      .trim();


  text =
    text.replace(
      /[^\d.-]/g,
      ""
    );


  const number =
    Number(text);


  return isNaN(number)
    ? 0
    : number;

}


// ============================================
// FORMAT MONEY
// ============================================

function formatMoney(
  value
) {

  const number =
    Number(value) || 0;


  return number.toLocaleString(
    "vi-VN"
  );

}


// ============================================
// FORMAT DATE
// ============================================

function formatDate(
  value
) {

  if (!value) {

    return "";

  }


  /*
   * Nếu là YYYY-MM-DD
   */

  const text =
    String(value);


  if (
    /^\d{4}-\d{2}-\d{2}$/.test(
      text
    )
  ) {

    const parts =
      text.split("-");


    return (
      parts[2] +
      "/" +
      parts[1] +
      "/" +
      parts[0]
    );

  }


  const date =
    new Date(value);


  if (
    isNaN(
      date.getTime()
    )
  ) {

    return text;

  }


  return (
    String(
      date.getDate()
    ).padStart(2, "0") +
    "/" +
    String(
      date.getMonth() + 1
    ).padStart(2, "0") +
    "/" +
    date.getFullYear()
  );

}


// ============================================
// FORMAT DATE TIME
// ============================================

function formatDateTime(
  value
) {

  const date =
    new Date(value);


  if (
    isNaN(
      date.getTime()
    )
  ) {

    return String(value);

  }


  return (
    String(
      date.getDate()
    ).padStart(2, "0") +
    "/" +
    String(
      date.getMonth() + 1
    ).padStart(2, "0") +
    "/" +
    date.getFullYear() +
    " " +
    String(
      date.getHours()
    ).padStart(2, "0") +
    ":" +
    String(
      date.getMinutes()
    ).padStart(2, "0")
  );

}


// ============================================
// ESCAPE HTML
// ============================================

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


// ============================================
// ESCAPE JAVASCRIPT
// ============================================

function escapeJs(
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


// ============================================
// CHO PHÉP HTML INLINE GỌI HÀM
// ============================================

window.editReport =
  editReport;

window.deleteReport =
  deleteReport;

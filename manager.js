// ========================================
// KHỞI TẠO SUPABASE
// ========================================

if (!window.supabase) {
  alert("❌ Không tải được Supabase.");
  throw new Error("Supabase library chưa được tải.");
}

if (
  !window.SUPABASE_URL ||
  !window.SUPABASE_ANON_KEY
) {
  alert("❌ Chưa cấu hình Supabase. Kiểm tra config.js.");
  throw new Error("Thiếu SUPABASE_URL hoặc SUPABASE_ANON_KEY.");
}

const client = window.supabase.createClient(
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

const tableBody =
  document.getElementById("tableBody");

const pagination =
  document.getElementById("pagination");

const totalReports =
  document.getElementById("totalReports");

const totalAmount =
  document.getElementById("totalAmount");

const showSubmittedUsersBtn =
  document.getElementById("showSubmittedUsersBtn");

const submittedUserCount =
  document.getElementById("submittedUserCount");


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
  async () => {

    const {
      data: {
        session
      }
    } = await client.auth.getSession();

    if (session) {

      loginBox.style.display =
        "none";

      managerBox.style.display =
        "block";

      await loadData();

    }

  }
);


// ========================================
// LOGIN
// ========================================

loginBtn.addEventListener(
  "click",
  async () => {

    const email =
      emailInput.value.trim();

    const password =
      passwordInput.value;

    if (!email || !password) {

      showLoginMessage(
        "⚠️ Vui lòng nhập email và mật khẩu.",
        "red"
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
        email,
        password
      });


    if (error) {

      showLoginMessage(
        "❌ " + error.message,
        "red"
      );

      loginBtn.disabled = false;

      loginBtn.textContent =
        "🔐 ĐĂNG NHẬP";

      return;
    }


    if (data.session) {

      loginBox.style.display =
        "none";

      managerBox.style.display =
        "block";

      showManagerMessage(
        "✅ Đăng nhập thành công.",
        "green"
      );

      await loadData();

    }


    loginBtn.disabled = false;

    loginBtn.textContent =
      "🔐 ĐĂNG NHẬP";

  }
);


// ========================================
// ENTER LOGIN
// ========================================

passwordInput.addEventListener(
  "keydown",
  function (event) {

    if (event.key === "Enter") {

      loginBtn.click();

    }

  }
);


// ========================================
// LOAD DATA
// ========================================

async function loadData() {

  showManagerMessage(
    "⏳ Đang tải dữ liệu...",
    "blue"
  );


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
      "Lỗi loadData:",
      error
    );

    showManagerMessage(
      "❌ Không tải được dữ liệu: " +
      error.message,
      "red"
    );

    return;
  }


  allData =
    Array.isArray(data)
      ? data
      : [];


  currentPage = 1;

  applyCurrentFilter();


  showManagerMessage(
    "✅ Đã cập nhật dữ liệu.",
    "green"
  );

}


// ========================================
// CHUẨN HÓA TÊN CÁN BỘ
// ========================================

function normalizeUserName(name) {

  return String(name || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

}


// ========================================
// LẤY DANH SÁCH CÁN BỘ DUY NHẤT
// ========================================

function getUniqueUsers(data) {

  const map =
    new Map();


  data.forEach(
    row => {

      const original =
        String(
          row.user_name || ""
        ).trim();


      if (!original) {
        return;
      }


      const key =
        normalizeUserName(
          original
        );


      if (!map.has(key)) {

        map.set(
          key,
          original
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
        "vi",
        {
          sensitivity: "base"
        }
      )
  );

}


// ========================================
// CẬP NHẬT SỐ CÁN BỘ
// ========================================

function updateSubmittedUserCount() {

  const users =
    getUniqueUsers(
      allData
    );


  submittedUserCount.textContent =
    users.length;

}


// ========================================
// APPLY FILTER
// ========================================

function applyCurrentFilter() {

  const userKeyword =
    filterUser.value
      .trim()
      .toLowerCase();


  const selectedDate =
    filterDate.value;


  filteredData =
    allData.filter(
      row => {

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
          !userKeyword ||
          rowUser.includes(
            userKeyword
          );


        const matchDate =
          !selectedDate ||
          rowDate === selectedDate;


        return (
          matchUser &&
          matchDate
        );

      }
    );


  updateSubmittedUserCount();


  renderData();

}


// ========================================
// RENDER DATA
// ========================================

function renderData() {

  tableBody.innerHTML = "";


  // ======================================
  // TỔNG BÁO CÁO
  // ======================================

  totalReports.textContent =
    filteredData.length;


  // ======================================
  // TỔNG DỰ THU
  // ======================================

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
    formatMoney(total) + " đ";


  // ======================================
  // PHÂN TRANG
  // ======================================

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredData.length /
        rowsPerPage
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
    (currentPage - 1) *
    rowsPerPage;


  const end =
    start + rowsPerPage;


  const pageData =
    filteredData.slice(
      start,
      end
    );


  // ======================================
  // KHÔNG CÓ DỮ LIỆU
  // ======================================

  if (pageData.length === 0) {

    tableBody.innerHTML = `
      <tr>
        <td
          colspan="11"
          style="
            text-align:center;
            padding:30px;
            color:#64748b;
            font-weight:bold;
          "
        >
          📭 Không có dữ liệu
        </td>
      </tr>
    `;

    renderPagination(
      totalPages
    );

    return;
  }


  // ======================================
  // RENDER TỪNG DÒNG
  // ======================================

  pageData.forEach(
    row => {

      const tr =
        document.createElement(
          "tr"
        );


      tr.innerHTML = `

        <td>
          <strong>
            ${escapeHtml(
              row.user_name || ""
            )}
          </strong>
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
          <strong>
            ${formatMoney(
              parseMoney(
                row.expected_amount
              )
            )} đ
          </strong>
        </td>

        <td>
          ${escapeHtml(
            row.next_action || ""
          )}
        </td>

        <td>

          <button
            class="edit-btn"
            onclick="editUserName('${escapeJs(row.id)}')"
          >
            ✏️ SỬA
          </button>

        </td>

        <td>

          <button
            class="delete-btn"
            onclick="deleteReport('${escapeJs(row.id)}')"
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


  renderPagination(
    totalPages
  );

}


// ========================================
// CHỈNH SỬA CÁN BỘ
// ========================================

async function editUserName(id) {

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
      "✏️ Nhập tên cán bộ mới:",
      oldName
    );


  if (
    newName === null
  ) {
    return;
  }


  const cleanName =
    newName
      .trim()
      .replace(/\s+/g, " ");


  if (!cleanName) {

    alert(
      "⚠️ Tên cán bộ không được để trống."
    );

    return;
  }


  if (
    normalizeUserName(
      cleanName
    ) ===
    normalizeUserName(
      oldName
    )
  ) {

    alert(
      "ℹ️ Tên mới giống tên cũ."
    );

    return;
  }


  const changeAll =
    confirm(
      `Bạn có muốn đổi TẤT CẢ báo cáo của cán bộ "${oldName}" thành "${cleanName}" không?\n\n` +
      `• Bấm OK: đổi toàn bộ báo cáo của cán bộ này.\n` +
      `• Bấm Hủy: chỉ đổi báo cáo đang chọn.`
    );


  showManagerMessage(
    "⏳ Đang cập nhật...",
    "blue"
  );


  // ======================================
  // ĐỔI TOÀN BỘ
  // ======================================

  if (changeAll) {

    const oldKey =
      normalizeUserName(
        oldName
      );


    const rowsToUpdate =
      allData.filter(
        item =>
          normalizeUserName(
            item.user_name
          ) === oldKey
      );


    if (
      rowsToUpdate.length === 0
    ) {

      showManagerMessage(
        "❌ Không tìm thấy dữ liệu cần sửa.",
        "red"
      );

      return;
    }


    // Cập nhật từng ID
    // để không phụ thuộc việc
    // Supabase có cho filter
    // theo chữ hoa/thường hay không.

    for (
      const item of rowsToUpdate
    ) {

      const {
        error
      } =
        await client
          .from("bao_cao_ngay")
          .update({
            user_name:
              cleanName
          })
          .eq(
            "id",
            item.id
          );


      if (error) {

        console.error(
          "Lỗi update:",
          error
        );

        showManagerMessage(
          "❌ Lỗi cập nhật: " +
          error.message,
          "red"
        );

        return;
      }

    }


    // Cập nhật local
    allData =
      allData.map(
        item => {

          if (
            normalizeUserName(
              item.user_name
            ) === oldKey
          ) {

            return {
              ...item,
              user_name:
                cleanName
            };

          }

          return item;

        }
      );


    applyCurrentFilter();


    showManagerMessage(
      `✅ Đã đổi toàn bộ "${oldName}" thành "${cleanName}".`,
      "green"
    );


    return;
  }


  // ======================================
  // CHỈ ĐỔI 1 DÒNG
  // ======================================

  const {
    error
  } =
    await client
      .from("bao_cao_ngay")
      .update({
        user_name:
          cleanName
      })
      .eq(
        "id",
        row.id
      );


  if (error) {

    console.error(
      "Lỗi update:",
      error
    );

    showManagerMessage(
      "❌ Cập nhật thất bại: " +
      error.message,
      "red"
    );

    return;
  }


  // Cập nhật local
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


  applyCurrentFilter();


  showManagerMessage(
    `✅ Đã đổi "${oldName}" thành "${cleanName}".`,
    "green"
  );

}


// ========================================
// CÁN BỘ ĐÃ NHẬP BÁO CÁO
// ========================================

showSubmittedUsersBtn.addEventListener(
  "click",
  async () => {

    // Tải lại dữ liệu mới nhất
    // trước khi hiển thị danh sách.
    await loadData();

    showSubmittedUsers();

  }
);


// ========================================
// HIỂN THỊ DANH SÁCH CÁN BỘ
// ========================================

function showSubmittedUsers() {

  const users =
    getUniqueUsers(
      allData
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


  const userList =
    users.length
      ? users
          .map(
            (user, index) => `
              <div class="submitted-user-item">

                <div class="submitted-user-number">
                  ${index + 1}
                </div>

                <div>
                  ${escapeHtml(user)}
                </div>

              </div>
            `
          )
          .join("")
      : `
          <div class="no-user">
            📭 Chưa có cán bộ nào nhập báo cáo.
          </div>
        `;


  modal.innerHTML = `

    <div class="user-modal-header">

      <h2>
        👥 CÁN BỘ ĐÃ NHẬP BÁO CÁO (${users.length})
      </h2>

      <button
        class="user-modal-close"
        id="closeUserModal"
      >
        ×
      </button>

    </div>


    <div class="user-modal-body">

      ${userList}

    </div>

  `;


  overlay.appendChild(
    modal
  );


  document.body.appendChild(
    overlay
  );


  document
    .getElementById(
      "closeUserModal"
    )
    .addEventListener(
      "click",
      () => {

        overlay.remove();

      }
    );


  // Bấm ra ngoài modal để đóng
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


// ========================================
// DELETE REPORT
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


  const ok =
    confirm(
      `Bạn có chắc muốn xóa báo cáo của "${row.user_name || ""}" không?`
    );


  if (!ok) {
    return;
  }


  showManagerMessage(
    "⏳ Đang xóa...",
    "blue"
  );


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
      "Lỗi delete:",
      error
    );

    showManagerMessage(
      "❌ Xóa thất bại: " +
      error.message,
      "red"
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


  showManagerMessage(
    "✅ Đã xóa báo cáo.",
    "green"
  );

}


// ========================================
// LỌC
// ========================================

filterBtn.addEventListener(
  "click",
  () => {

    currentPage = 1;

    applyCurrentFilter();

    showManagerMessage(
      `🔎 Đã lọc ${filteredData.length} báo cáo.`,
      "blue"
    );

  }
);


// ========================================
// ENTER KHI LỌC CÁN BỘ
// ========================================

filterUser.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Enter"
    ) {

      filterBtn.click();

    }

  }
);


// ========================================
// LÀM MỚI
// ========================================

refreshBtn.addEventListener(
  "click",
  async () => {

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


// ========================================
// XUẤT EXCEL
// ========================================

exportBtn.addEventListener(
  "click",
  () => {

    if (
      filteredData.length === 0
    ) {

      alert(
        "⚠️ Không có dữ liệu để xuất."
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
      "✅ Đã xuất Excel thành công.",
      "green"
    );

  }
);


// ========================================
// PAGINATION
// ========================================

function renderPagination(
  totalPages
) {

  pagination.innerHTML =
    "";


  if (
    totalPages <= 1
  ) {
    return;
  }


  // NÚT TRƯỚC

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


  // ======================================
  // SỐ TRANG
  // ======================================

  const pages =
    getPageNumbers(
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


      const button =
        document.createElement(
          "button"
        );

      button.textContent =
        page;


      if (
        page === currentPage
      ) {

        button.className =
          "active";

      }


      button.onclick =
        () => {

          currentPage =
            page;

          renderData();

          scrollToTable();

        };


      pagination.appendChild(
        button
      );

    }
  );


  // ======================================
  // NÚT SAU
  // ======================================

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
// TẠO DANH SÁCH TRANG
// ========================================

function getPageNumbers(
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
      (_, i) => i + 1
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
// SCROLL TABLE
// ========================================

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


// ========================================
// LOGOUT
// ========================================

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


    showLoginMessage(
      "✅ Đã đăng xuất.",
      "green"
    );

  }
);


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

    return value;

  }


  let str =
    String(value)
      .trim();


  // Xóa ký hiệu tiền
  str =
    str.replace(
      /đ|₫|VND|VNĐ/gi,
      ""
    );


  // Xử lý số có dấu chấm/phẩy
  str =
    str.replace(
      /,/g,
      ""
    );


  str =
    str.replace(
      /\s/g,
      ""
    );


  const result =
    Number(str);


  return isNaN(result)
    ? 0
    : result;

}


// ========================================
// FORMAT MONEY
// ========================================

function formatMoney(
  value
) {

  const number =
    Number(value) || 0;


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


  const str =
    String(value);


  // Nếu đã là dd/mm/yyyy
  if (
    /^\d{2}\/\d{2}\/\d{4}$/.test(
      str
    )
  ) {

    return str;

  }


  // yyyy-mm-dd
  if (
    /^\d{4}-\d{2}-\d{2}$/.test(
      str
    )
  ) {

    const [
      year,
      month,
      day
    ] =
      str.split("-");


    return `${day}/${month}/${year}`;

  }


  const date =
    new Date(value);


  if (
    isNaN(
      date.getTime()
    )
  ) {

    return str;

  }


  return [
    String(
      date.getDate()
    ).padStart(2, "0"),

    String(
      date.getMonth() + 1
    ).padStart(2, "0"),

    date.getFullYear()

  ].join("/");

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
// MESSAGE
// ========================================

function showLoginMessage(
  message,
  type
) {

  loginMessage.textContent =
    message;


  if (
    type === "red"
  ) {

    loginMessage.style.color =
      "#dc2626";

  }
  else if (
    type === "green"
  ) {

    loginMessage.style.color =
      "#16a34a";

  }
  else {

    loginMessage.style.color =
      "#2563eb";

  }

}


function showManagerMessage(
  message,
  type
) {

  managerMessage.textContent =
    message;


  if (
    type === "red"
  ) {

    managerMessage.style.color =
      "#dc2626";

  }
  else if (
    type === "green"
  ) {

    managerMessage.style.color =
      "#16a34a";

  }
  else {

    managerMessage.style.color =
      "#2563eb";

  }

}


// ========================================
// CHO PHÉP HTML INLINE GỌI HÀM
// ========================================

window.editUserName =
  editUserName;

window.deleteReport =
  deleteReport;

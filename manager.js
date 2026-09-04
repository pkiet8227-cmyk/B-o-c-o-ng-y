const client = window.supabase.createClient(

  window.SUPABASE_URL,

  window.SUPABASE_ANON_KEY

);

// =====================================

// ELEMENT

// =====================================

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

// =====================================

// BIẾN

// =====================================

let allData = [];

let filteredData = [];

let currentPage = 1;

// Mỗi trang 20 dòng

const rowsPerPage = 20;

// =====================================

// KIỂM TRA PHÂN TRANG

// Nếu HTML chưa có #pagination

// thì tự tạo luôn

// =====================================

let paginationBox = pagination;

if (!paginationBox) {

  paginationBox =

    document.createElement("div");

  paginationBox.id = "pagination";

  const tableWrap =

    document.querySelector(".table-wrap");

  if (tableWrap) {

    tableWrap.insertAdjacentElement(

      "afterend",

      paginationBox

    );

  } else {

    managerBox.appendChild(

      paginationBox

    );

  }

}

// =====================================

// STYLE PHÂN TRANG

// Không phụ thuộc CSS bên ngoài

// =====================================

function setupPaginationStyle() {

  paginationBox.style.display =

    "flex";

  paginationBox.style.justifyContent =

    "flex-start";

  paginationBox.style.alignItems =

    "center";

  paginationBox.style.gap =

    "5px";

  paginationBox.style.marginTop =

    "15px";

  paginationBox.style.marginBottom =

    "15px";

  paginationBox.style.flexWrap =

    "wrap";

}

setupPaginationStyle();

// =====================================

// ĐĂNG NHẬP

// =====================================

document

  .getElementById("loginBtn")

  .addEventListener(

    "click",

    login

  );

async function login() {

  const email =

    document

      .getElementById("email")

      .value

      .trim();

  const password =

    document

      .getElementById("password")

      .value;

  if (!email || !password) {

    loginMessage.textContent =

      "⚠️ Vui lòng nhập email và mật khẩu.";

    loginMessage.style.color =

      "#dc2626";

    return;

  }

  loginMessage.textContent =

    "⏳ Đang đăng nhập...";

  loginMessage.style.color =

    "#6366f1";

  const { error } =

    await client.auth.signInWithPassword({

      email: email,

      password: password

    });

  if (error) {

    loginMessage.textContent =

      "❌ Đăng nhập thất bại: "

      + error.message;

    loginMessage.style.color =

      "#dc2626";

    return;

  }

  loginMessage.textContent = "";

  loginBox.style.display =

    "none";

  managerBox.style.display =

    "block";

  await loadData();

}

// =====================================

// TẢI DỮ LIỆU

// =====================================

async function loadData() {

  managerMessage.textContent =

    "⏳ Đang tải dữ liệu...";

  managerMessage.style.color =

    "#6366f1";

  const { data, error } =

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

    managerMessage.textContent =

      "❌ Không tải được dữ liệu: "

      + error.message;

    managerMessage.style.color =

      "#dc2626";

    return;

  }

  allData =

    data || [];

  // Luôn bắt đầu từ trang 1

  currentPage = 1;

  applyCurrentFilter();

  managerMessage.textContent = "";

}

// =====================================

// LỌC DỮ LIỆU

// =====================================

document

  .getElementById("filterBtn")

  .addEventListener(

    "click",

    applyCurrentFilter

  );

function applyCurrentFilter() {

  const user =

    document

      .getElementById("filterUser")

      .value

      .trim()

      .toLowerCase();

  const date =

    document

      .getElementById("filterDate")

      .value;

  filteredData =

    allData.filter(row => {

      const matchUser =

        !user ||

        (

          row.user_name || ""

        )

          .toLowerCase()

          .includes(user);

      const matchDate =

        !date ||

        row.field_date === date;

      return (

        matchUser &&

        matchDate

      );

    });

  // Lọc thì quay về trang 1

  currentPage = 1;

  renderData();

}

// =====================================

// HIỂN THỊ DỮ LIỆU

// =====================================

function renderData() {

  tableBody.innerHTML = "";

  // ===================================

  // TỔNG TOÀN BỘ DỮ LIỆU ĐÃ LỌC

  // ===================================

  let total = 0;

  filteredData.forEach(row => {

    total +=

      Number(

        row.expected_amount || 0

      );

  });

  document.getElementById(

    "totalReports"

  ).textContent =

    filteredData.length;

  document.getElementById(

    "totalAmount"

  ).textContent =

    formatMoney(total)

    + " đ";

  // ===================================

  // TÍNH SỐ TRANG

  // ===================================

  const totalPages =

    Math.ceil(

      filteredData.length /

      rowsPerPage

    );

  // ===================================

  // KHÔNG CÓ DỮ LIỆU

  // ===================================

  if (totalPages === 0) {

    tableBody.innerHTML = `

      <tr>

        <td

          colspan="10"

          style="

            text-align:center;

            padding:20px;

          "

        >

          Không có dữ liệu.

        </td>

      </tr>

    `;

    // Không có dữ liệu thì xóa phân trang

    renderPagination(0);

    return;

  }

  // ===================================

  // KIỂM TRA TRANG HIỆN TẠI

  // ===================================

  if (

    currentPage < 1

  ) {

    currentPage = 1;

  }

  if (

    currentPage > totalPages

  ) {

    currentPage =

      totalPages;

  }

  // ===================================

  // LẤY DỮ LIỆU TRANG HIỆN TẠI

  // ===================================

  const startIndex =

    (

      currentPage - 1

    ) *

    rowsPerPage;

  const endIndex =

    startIndex +

    rowsPerPage;

  const pageData =

    filteredData.slice(

      startIndex,

      endIndex

    );

  // ===================================

  // HIỂN THỊ 20 DÒNG

  // ===================================

  pageData.forEach(row => {

    const tr =

      document.createElement("tr");

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

          row.expected_amount

        )} đ

      </td>

      <td>

        ${escapeHtml(

          row.next_action || ""

        )}

      </td>

      <td>

        <button

          class="delete-btn"

          onclick="deleteReport(${row.id})"

        >

          🗑️ Xóa

        </button>

      </td>

    `;

    tableBody.appendChild(tr);

  });

  // ===================================

  // HIỂN THỊ PHÂN TRANG

  // KỂ CẢ CHỈ CÓ 1 TRANG

  // ===================================

  renderPagination(totalPages);

}

// =====================================

// PHÂN TRANG

// =====================================

function renderPagination(totalPages) {

  paginationBox.innerHTML = "";

  // Không có dữ liệu

  if (totalPages === 0) {

    paginationBox.style.display =

      "none";

    return;

  }

  // Có dữ liệu thì LUÔN hiện

  // kể cả chỉ có 1 trang

  paginationBox.style.display =

    "flex";

  paginationBox.style.justifyContent =

    "flex-start";

  paginationBox.style.alignItems =

    "center";

  paginationBox.style.gap =

    "5px";

  paginationBox.style.marginTop =

    "15px";

  paginationBox.style.marginBottom =

    "15px";

  paginationBox.style.flexWrap =

    "wrap";

  // ===================================

  // NÚT TRANG TRƯỚC

  // ===================================

  const prevButton =

    document.createElement("button");

  prevButton.type =

    "button";

  prevButton.className =

    "arrow";

  prevButton.textContent =

    "‹";

  prevButton.disabled =

    currentPage === 1;

  stylePaginationButton(

    prevButton,

    true

  );

  prevButton.addEventListener(

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

  paginationBox.appendChild(

    prevButton

  );

  // ===================================

  // CÁC TRANG

  // ===================================

  const pages =

    getPaginationPages(

      currentPage,

      totalPages

    );

  pages.forEach(page => {

    // Dấu ...

    if (page === "...") {

      const dots =

        document.createElement("span");

      dots.textContent =

        "...";

      dots.style.padding =

        "0 5px";

      dots.style.lineHeight =

        "36px";

      dots.style.color =

        "#64748b";

      paginationBox.appendChild(

        dots

      );

      return;

    }

    // Nút trang

    const button =

      document.createElement("button");

    button.type =

      "button";

    button.textContent =

      page;

    if (

      page === currentPage

    ) {

      button.classList.add(

        "active"

      );

    }

    stylePaginationButton(

      button,

      false

    );

    button.addEventListener(

      "click",

      () => {

        if (

          currentPage === page

        ) {

          return;

        }

        currentPage =

          page;

        renderData();

        scrollToTable();

      }

    );

    paginationBox.appendChild(

      button

    );

  });

  // ===================================

  // NÚT TRANG SAU

  // ===================================

  const nextButton =

    document.createElement("button");

  nextButton.type =

    "button";

  nextButton.className =

    "arrow";

  nextButton.textContent =

    "›";

  nextButton.disabled =

    currentPage === totalPages;

  stylePaginationButton(

    nextButton,

    true

  );

  nextButton.addEventListener(

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

  paginationBox.appendChild(

    nextButton

  );

}

// =====================================

// STYLE NÚT PHÂN TRANG

// =====================================

function stylePaginationButton(

  button,

  isArrow

) {

  button.style.width =

    "36px";

  button.style.height =

    "36px";

  button.style.minWidth =

    "36px";

  button.style.padding =

    "0";

  button.style.border =

    "1px solid #cbd5e1";

  button.style.borderRadius =

    "7px";

  button.style.background =

    "white";

  button.style.color =

    "#334155";

  button.style.fontSize =

    isArrow

      ? "20px"

      : "14px";

  button.style.fontWeight =

    isArrow

      ? "bold"

      : "normal";

  button.style.cursor =

    "pointer";

  if (

    button.classList.contains(

      "active"

    )

  ) {

    button.style.background =

      "#2563eb";

    button.style.color =

      "white";

    button.style.borderColor =

      "#2563eb";

    button.style.fontWeight =

      "bold";

  }

  if (

    button.disabled

  ) {

    button.style.opacity =

      "0.4";

    button.style.cursor =

      "not-allowed";

  }

}

// =====================================

// TẠO DANH SÁCH SỐ TRANG

// =====================================

function getPaginationPages(

  current,

  total

) {

  // ===================================

  // 1 - 7 TRANG

  // Hiện toàn bộ

  // ===================================

  if (

    total <= 7

  ) {

    return Array.from(

      {

        length: total

      },

      (_, index) =>

        index + 1

    );

  }

  const pages = [];

  // ===================================

  // TRANG ĐẦU

  // ===================================

  pages.push(1);

  // ===================================

  // ĐANG Ở ĐẦU

  // ===================================

  if (

    current <= 4

  ) {

    pages.push(2);

    pages.push(3);

    pages.push(4);

    pages.push(5);

    pages.push("...");

    pages.push(total);

  }

  // ===================================

  // ĐANG Ở CUỐI

  // ===================================

  else if (

    current >=

    total - 3

  ) {

    pages.push("...");

    pages.push(

      total - 4

    );

    pages.push(

      total - 3

    );

    pages.push(

      total - 2

    );

    pages.push(

      total - 1

    );

    pages.push(total);

  }

  // ===================================

  // ĐANG Ở GIỮA

  // ===================================

  else {

    pages.push("...");

    pages.push(

      current - 1

    );

    pages.push(

      current

    );

    pages.push(

      current + 1

    );

    pages.push("...");

    pages.push(total);

  }

  return pages;

}

// =====================================

// CUỘN VỀ BẢNG

// =====================================

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

// =====================================

// XÓA BÁO CÁO

// =====================================

async function deleteReport(id) {

  const row =

    allData.find(

      item =>

        item.id === id

    );

  if (!row) {

    alert(

      "❌ Không tìm thấy báo cáo."

    );

    return;

  }

  const ok =

    confirm(

      "⚠️ Bạn có chắc muốn xóa báo cáo này?\n\n"

      + "Cán bộ: "

      + (

        row.user_name || ""

      )

      + "\nKhách hàng: "

      + (

        row.customer_name || ""

      )

      + "\nCIF: "

      + (

        row.cif || ""

      )

      + "\nNgày field: "

      + formatDate(

        row.field_date

      )

    );

  if (!ok) {

    return;

  }

  managerMessage.textContent =

    "⏳ Đang xóa...";

  managerMessage.style.color =

    "#6366f1";

  const { error } =

    await client

      .from("bao_cao_ngay")

      .delete()

      .eq(

        "id",

        id

      );

  if (error) {

    managerMessage.textContent =

      "❌ Xóa thất bại: "

      + error.message;

    managerMessage.style.color =

      "#dc2626";

    return;

  }

  // ===================================

  // XÓA KHỎI DỮ LIỆU GỐC

  // ===================================

  allData =

    allData.filter(

      item =>

        item.id !== id

    );

  // ===================================

  // LỌC LẠI

  // ===================================

  const user =

    document

      .getElementById("filterUser")

      .value

      .trim()

      .toLowerCase();

  const date =

    document

      .getElementById("filterDate")

      .value;

  filteredData =

    allData.filter(row => {

      const matchUser =

        !user ||

        (

          row.user_name || ""

        )

          .toLowerCase()

          .includes(user);

      const matchDate =

        !date ||

        row.field_date === date;

      return (

        matchUser &&

        matchDate

      );

    });

  // ===================================

  // TÍNH LẠI SỐ TRANG

  // ===================================

  const totalPages =

    Math.ceil(

      filteredData.length /

      rowsPerPage

    );

  // ===================================

  // ĐIỀU CHỈNH TRANG

  // ===================================

  if (

    totalPages === 0

  ) {

    currentPage = 1;

  }

  else if (

    currentPage > totalPages

  ) {

    currentPage =

      totalPages;

  }

  renderData();

  managerMessage.textContent =

    "✅ Đã xóa báo cáo thành công.";

  managerMessage.style.color =

    "#16a34a";

}

// =====================================

// LÀM MỚI

// =====================================

document

  .getElementById("refreshBtn")

  .addEventListener(

    "click",

    loadData

  );

// =====================================

// XUẤT EXCEL

// =====================================

document

  .getElementById("exportBtn")

  .addEventListener(

    "click",

    exportExcel

  );

function exportExcel() {

  const user =

    document

      .getElementById("filterUser")

      .value

      .trim()

      .toLowerCase();

  const date =

    document

      .getElementById("filterDate")

      .value;

  // Xuất toàn bộ dữ liệu sau khi lọc

  // Không chỉ 20 dòng của trang hiện tại

  const filtered =

    allData.filter(row => {

      const matchUser =

        !user ||

        (

          row.user_name || ""

        )

          .toLowerCase()

          .includes(user);

      const matchDate =

        !date ||

        row.field_date === date;

      return (

        matchUser &&

        matchDate

      );

    });

  if (!filtered.length) {

    alert(

      "⚠️ Không có dữ liệu để xuất Excel."

    );

    return;

  }

  const excelData =

    filtered.map(row => ({

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

        Number(

          row.expected_amount || 0

        ),

      "Hướng tác động tiếp theo":

        row.next_action || ""

    }));

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

}

// =====================================

// ĐĂNG XUẤT

// =====================================

document

  .getElementById("logoutBtn")

  .addEventListener(

    "click",

    async () => {

      await client.auth.signOut();

      managerBox.style.display =

        "none";

      loginBox.style.display =

        "block";

      allData = [];

      filteredData = [];

      currentPage = 1;

      tableBody.innerHTML =

        "";

      paginationBox.innerHTML =

        "";

      paginationBox.style.display =

        "none";

      document.getElementById(

        "totalReports"

      ).textContent =

        "0";

      document.getElementById(

        "totalAmount"

      ).textContent =

        "0 đ";

      managerMessage.textContent =

        "";

    }

  );

// =====================================

// FORMAT TIỀN

// =====================================

function formatMoney(value) {

  return Number(

    value || 0

  )

    .toLocaleString(

      "vi-VN"

    );

}

// =====================================

// FORMAT NGÀY

// =====================================

function formatDate(value) {

  if (!value) {

    return "";

  }

  const parts =

    value.split("-");

  if (

    parts.length !== 3

  ) {

    return value;

  }

  return (

    parts[2]

    + "/"

    + parts[1]

    + "/"

    + parts[0]

  );

}

// =====================================

// CHỐNG HTML

// =====================================

function escapeHtml(value) {

  return String(value)

    .replaceAll(

      "&",

      "&amp;"

    )

    .replaceAll(

      "<",

      "&lt;"

    )

    .replaceAll(

      ">",

      "&gt;"

    )

    .replaceAll(

      '"',

      "&quot;"

    )

    .replaceAll(

      "'",

      "&#039;"

    );

}

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

const rowsPerPage = 20;


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


  // Khi lọc luôn quay về trang 1
  currentPage = 1;


  renderData();

}


// =====================================
// HIỂN THỊ DỮ LIỆU
// =====================================

function renderData() {

  tableBody.innerHTML = "";


  // ===================================
  // TÍNH TỔNG TRÊN TOÀN BỘ DỮ LIỆU LỌC
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
  // TÍNH PHÂN TRANG
  // ===================================

  const totalPages =
    Math.ceil(
      filteredData.length /
      rowsPerPage
    );


  // Nếu xóa dữ liệu ở trang cuối
  if (
    totalPages > 0 &&
    currentPage > totalPages
  ) {

    currentPage =
      totalPages;

  }


  if (totalPages === 0) {

    tableBody.innerHTML = `

      <tr>

        <td
          colspan="10"
          style="text-align:center;padding:20px">

          Không có dữ liệu.

        </td>

      </tr>

    `;


    renderPagination(0);

    return;
  }


  // ===================================
  // LẤY 20 DÒNG CỦA TRANG HIỆN TẠI
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
  // HIỂN THỊ
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
          onclick="deleteReport(${row.id})">

          🗑️ Xóa

        </button>

      </td>

    `;


    tableBody.appendChild(tr);

  });


  // ===================================
  // HIỂN THỊ PHÂN TRANG
  // ===================================

  renderPagination(totalPages);

}


// =====================================
// PHÂN TRANG
// =====================================

function renderPagination(totalPages) {

  pagination.innerHTML = "";


  if (totalPages <= 1) {

    return;

  }


  // ===================================
  // NÚT TRANG TRƯỚC
  // ===================================

  const prevButton =
    document.createElement("button");


  prevButton.className =
    "arrow";


  prevButton.textContent =
    "‹";


  prevButton.disabled =
    currentPage === 1;


  prevButton.addEventListener(
    "click",
    () => {

      if (currentPage > 1) {

        currentPage--;

        renderData();

        scrollToTable();

      }

    }
  );


  pagination.appendChild(
    prevButton
  );


  // ===================================
  // TẠO DANH SÁCH TRANG
  // ===================================

  const pages =
    getPaginationPages(
      currentPage,
      totalPages
    );


  pages.forEach(page => {

    if (page === "...") {

      const dots =
        document.createElement("span");


      dots.textContent =
        "...";


      dots.style.padding =
        "0 5px";


      dots.style.lineHeight =
        "36px";


      pagination.appendChild(
        dots
      );


      return;

    }


    const button =
      document.createElement("button");


    button.textContent =
      page;


    if (page === currentPage) {

      button.classList.add(
        "active"
      );

    }


    button.addEventListener(
      "click",
      () => {

        currentPage =
          page;

        renderData();

        scrollToTable();

      }
    );


    pagination.appendChild(
      button
    );

  });


  // ===================================
  // NÚT TRANG SAU
  // ===================================

  const nextButton =
    document.createElement("button");


  nextButton.className =
    "arrow";


  nextButton.textContent =
    "›";


  nextButton.disabled =
    currentPage === totalPages;


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


  pagination.appendChild(
    nextButton
  );

}


// =====================================
// TẠO SỐ TRANG
// =====================================

function getPaginationPages(
  current,
  total
) {

  // Ít trang thì hiện hết
  if (total <= 7) {

    return Array.from(
      {
        length: total
      },
      (_, index) =>
        index + 1
    );

  }


  const pages = [];


  // Trang đầu
  pages.push(1);


  // -----------------------------------
  // KHU VỰC GẦN TRANG HIỆN TẠI
  // -----------------------------------

  if (current <= 4) {

    pages.push(2);
    pages.push(3);
    pages.push(4);
    pages.push(5);

    pages.push("...");

    pages.push(total);

  }

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
// XÓA
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
      .eq("id", id);


  if (error) {

    managerMessage.textContent =
      "❌ Xóa thất bại: "
      + error.message;

    managerMessage.style.color =
      "#dc2626";

    return;
  }


  allData =
    allData.filter(
      item =>
        item.id !== id
    );


  // Lọc lại dữ liệu
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


  // Nếu trang hiện tại không còn dữ liệu
  const totalPages =
    Math.ceil(
      filteredData.length /
      rowsPerPage
    );


  if (
    totalPages > 0 &&
    currentPage > totalPages
  ) {

    currentPage =
      totalPages;

  }


  if (
    filteredData.length === 0
  ) {

    currentPage = 1;

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


      pagination.innerHTML =
        "";


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
    .toLocaleString("vi-VN");

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


  if (parts.length !== 3) {

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

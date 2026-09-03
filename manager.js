const client = window.supabase.createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);


const loginBox =
  document.getElementById("loginBox");

const managerBox =
  document.getElementById("managerBox");

const loginMessage =
  document.getElementById("loginMessage");

const managerMessage =
  document.getElementById("managerMessage");


let allData = [];


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


  applyCurrentFilter();


  managerMessage.textContent =
    "";

}


// =====================================
// HIỂN THỊ
// =====================================

function renderData(data) {

  const tbody =
    document.getElementById(
      "tableBody"
    );


  tbody.innerHTML = "";


  let total = 0;


  data.forEach(row => {

    total +=
      Number(
        row.expected_amount || 0
      );


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


    tbody.appendChild(tr);

  });


  document.getElementById(
    "totalReports"
  ).textContent =
    data.length;


  document.getElementById(
    "totalAmount"
  ).textContent =
    formatMoney(total)
    + " đ";

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
      + row.user_name

      + "\nKhách hàng: "
      + row.customer_name

      + "\nCIF: "
      + row.cif

      + "\nNgày field: "
      + formatDate(row.field_date)

    );


  if (!ok) {

    return;

  }


  managerMessage.textContent =
    "⏳ Đang xóa...";


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


  applyCurrentFilter();


  managerMessage.textContent =
    "✅ Đã xóa báo cáo thành công.";

  managerMessage.style.color =
    "#16a34a";

}


// =====================================
// LỌC
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


  renderData(filtered);

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


      document.getElementById(
        "tableBody"
      ).innerHTML = "";


      document.getElementById(
        "totalReports"
      ).textContent = "0";


      document.getElementById(
        "totalAmount"
      ).textContent = "0 đ";

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

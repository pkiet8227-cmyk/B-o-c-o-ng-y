// ========================================
// KHỞI TẠO SUPABASE
// ========================================

if (!window.supabase) {
  alert("❌ Không tải được Supabase. Hãy kiểm tra Internet.");
  throw new Error("Supabase library chưa được tải.");
}

if (
  !window.SUPABASE_URL ||
  !window.SUPABASE_ANON_KEY
) {
  alert("❌ Chưa cấu hình Supabase. Kiểm tra config.js.");
  throw new Error("Supabase config không hợp lệ.");
}

const client = window.supabase.createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);


// ========================================
// LẤY CÁC PHẦN TỬ HTML
// ========================================

const form = document.getElementById("reportForm");
const button = document.getElementById("submitBtn");
const message = document.getElementById("message");

const amountInput =
  document.getElementById("expected_amount");

const fieldDate =
  document.getElementById("field_date");


// ========================================
// KIỂM TRA HTML
// ========================================

if (!form) {
  throw new Error("Không tìm thấy reportForm.");
}

if (!button) {
  throw new Error("Không tìm thấy submitBtn.");
}

if (!message) {
  throw new Error("Không tìm thấy message.");
}

if (!amountInput) {
  throw new Error("Không tìm thấy expected_amount.");
}

if (!fieldDate) {
  throw new Error("Không tìm thấy field_date.");
}


// ========================================
// NGÀY MẶC ĐỊNH
// ========================================

function getToday() {
  const now = new Date();

  const year = now.getFullYear();

  const month =
    String(now.getMonth() + 1)
      .padStart(2, "0");

  const day =
    String(now.getDate())
      .padStart(2, "0");

  return `${year}-${month}-${day}`;
}

fieldDate.value = getToday();


// ========================================
// TỰ ĐỘNG THÊM DẤU PHẨY CHO DỰ THU
// ========================================

amountInput.addEventListener(
  "input",
  function () {

    let value =
      this.value.replace(/\D/g, "");

    value =
      value.replace(/^0+(?=\d)/, "");

    if (value) {

      this.value =
        Number(value)
          .toLocaleString("en-US");

    } else {

      this.value = "";

    }
  }
);


// ========================================
// HIỂN THỊ THÔNG BÁO
// ========================================

function showMessage(text, color) {

  message.textContent = text;
  message.style.color = color;

}


// ========================================
// GỬI BÁO CÁO
// ========================================

form.addEventListener(
  "submit",
  async function (event) {

    event.preventDefault();

    button.disabled = true;

    button.innerHTML =
      "⏳ ĐANG LƯU...";

    showMessage(
      "⏳ Đang lưu dữ liệu...",
      "#6366f1"
    );


    // ========================================
    // LẤY DỮ LIỆU
    // ========================================

    const userName =
      document
        .getElementById("user_name")
        .value
        .trim();

    const cif =
      document
        .getElementById("cif")
        .value
        .trim();

    const customerName =
      document
        .getElementById("customer_name")
        .value
        .trim();

    const result =
      document
        .getElementById("result")
        .value;

    const connection =
      document
        .getElementById("connection")
        .value;

    const detail =
      document
        .getElementById("detail")
        .value
        .trim();

    const nextAction =
      document
        .getElementById("next_action")
        .value
        .trim();


    // ========================================
    // CHUYỂN TIỀN VỀ NUMBER
    // ========================================

    const cleanAmount =
      amountInput.value
        .replace(/,/g, "")
        .replace(/\./g, "")
        .trim();

    const expectedAmount =
      cleanAmount
        ? Number(cleanAmount)
        : 0;


    // ========================================
    // KIỂM TRA DỮ LIỆU
    // ========================================

    if (!userName) {
      showMessage(
        "⚠️ Vui lòng nhập Cán bộ.",
        "#dc2626"
      );

      button.disabled = false;
      button.innerHTML =
        "<span>🚀</span> GỬI BÁO CÁO";

      return;
    }

    if (!fieldDate.value) {
      showMessage(
        "⚠️ Vui lòng chọn ngày.",
        "#dc2626"
      );

      button.disabled = false;
      button.innerHTML =
        "<span>🚀</span> GỬI BÁO CÁO";

      return;
    }

    if (!cif) {
      showMessage(
        "⚠️ Vui lòng nhập Số CIF.",
        "#dc2626"
      );

      button.disabled = false;
      button.innerHTML =
        "<span>🚀</span> GỬI BÁO CÁO";

      return;
    }

    if (!customerName) {
      showMessage(
        "⚠️ Vui lòng nhập Tên khách hàng.",
        "#dc2626"
      );

      button.disabled = false;
      button.innerHTML =
        "<span>🚀</span> GỬI BÁO CÁO";

      return;
    }

    if (!result) {
      showMessage(
        "⚠️ Vui lòng chọn Kết quả.",
        "#dc2626"
      );

      button.disabled = false;
      button.innerHTML =
        "<span>🚀</span> GỬI BÁO CÁO";

      return;
    }

    if (!connection) {
      showMessage(
        "⚠️ Vui lòng chọn Kết nối.",
        "#dc2626"
      );

      button.disabled = false;
      button.innerHTML =
        "<span>🚀</span> GỬI BÁO CÁO";

      return;
    }

    if (!detail) {
      showMessage(
        "⚠️ Vui lòng nhập Kết quả chi tiết.",
        "#dc2626"
      );

      button.disabled = false;
      button.innerHTML =
        "<span>🚀</span> GỬI BÁO CÁO";

      return;
    }

    if (!nextAction) {
      showMessage(
        "⚠️ Vui lòng nhập Hướng tác động tiếp theo.",
        "#dc2626"
      );

      button.disabled = false;
      button.innerHTML =
        "<span>🚀</span> GỬI BÁO CÁO";

      return;
    }


    // ========================================
    // TẠO DỮ LIỆU GỬI SUPABASE
    // ========================================

    const data = {

      user_name: userName,

      field_date:
        fieldDate.value,

      cif: cif,

      customer_name:
        customerName,

      result: result,

      connection:
        connection,

      detail:
        detail,

      expected_amount:
        expectedAmount,

      next_action:
        nextAction

    };


    console.log(
      "Dữ liệu chuẩn bị lưu:",
      data
    );


    // ========================================
    // LƯU SUPABASE
    // ========================================

    try {

      const { data: savedData, error } =
  await client
    .from("bao_cao_ngay")
    .insert([data]);

if (error) {
  console.error("SUPABASE INSERT ERROR:", error);

  showMessage(
    "❌ Supabase: " +
    error.message +
    " | Code: " +
    (error.code || "N/A"),
    "#dc2626"
  );

  button.disabled = false;
  button.innerHTML = "<span>🚀</span> GỬI BÁO CÁO";
  return;
}

      if (error) {

        console.error(
          "SUPABASE INSERT ERROR:",
          error
        );

        throw error;
      }


      console.log(
        "Đã lưu thành công:",
        savedData
      );


      // ========================================
      // THÔNG BÁO THÀNH CÔNG
      // ========================================

      showMessage(
        "✅ Đã lưu báo cáo thành công!",
        "#16a34a"
      );


      // Xóa form

      form.reset();


      // Đặt lại ngày hôm nay

      fieldDate.value =
        getToday();


      // Đưa con trỏ về Cán bộ

      const userInput =
        document.getElementById("user_name");

      if (userInput) {
        userInput.focus();
      }


    } catch (error) {

      console.error(
        "LỖI LƯU BÁO CÁO:",
        error
      );


      showMessage(
        "❌ Lưu thất bại: " +
        (error.message || "Lỗi không xác định"),
        "#dc2626"
      );

    }


    // ========================================
    // MỞ LẠI NÚT
    // ========================================

    button.disabled = false;

    button.innerHTML =
      "<span>🚀</span> GỬI BÁO CÁO";

  }
);

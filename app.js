const client = window.supabase.createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);

const form =
  document.getElementById("reportForm");

const button =
  document.getElementById("submitBtn");

const message =
  document.getElementById("message");

const amountInput =
  document.getElementById("expected_amount");

const fieldDate =
  document.getElementById("field_date");


// ===============================
// NGÀY MẶC ĐỊNH
// ===============================

fieldDate.value =
  new Date()
    .toISOString()
    .split("T")[0];


// ===============================
// TỰ ĐỘNG THÊM DẤU PHẨY
// ===============================

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


// ===============================
// GỬI BÁO CÁO
// ===============================

form.addEventListener(
  "submit",
  async function (event) {

    event.preventDefault();

    button.disabled = true;

    button.innerHTML =
      "⏳ ĐANG LƯU...";

    message.textContent = "";

    message.style.color =
      "#6366f1";


    // Bỏ dấu phẩy trước khi lưu
    const amountValue =
      amountInput.value
        .replace(/,/g, "");


    const data = {

      user_name:
        document
          .getElementById("user_name")
          .value
          .trim(),

      field_date:
        fieldDate.value,

      cif:
        document
          .getElementById("cif")
          .value
          .trim(),

      customer_name:
        document
          .getElementById("customer_name")
          .value
          .trim(),

      result:
        document
          .getElementById("result")
          .value,

      connection:
        document
          .getElementById("connection")
          .value,

      detail:
        document
          .getElementById("detail")
          .value
          .trim(),

      expected_amount:
        amountValue
          ? Number(amountValue)
          : 0,

      next_action:
        document
          .getElementById("next_action")
          .value
          .trim()

    };


    // ===============================
    // KIỂM TRA
    // ===============================

    if (
      !data.user_name ||
      !data.field_date ||
      !data.cif ||
      !data.customer_name ||
      !data.result ||
      !data.connection ||
      !data.detail ||
      !data.next_action
    ) {

      message.textContent =
        "⚠️ Vui lòng nhập đầy đủ thông tin bắt buộc.";

      message.style.color =
        "#dc2626";

      button.disabled = false;

      button.innerHTML =
        "<span>🚀</span> GỬI BÁO CÁO";

      return;
    }


    try {

      const { error } =
        await client
          .from("bao_cao_ngay")
          .insert([data]);


      if (error) {

        throw error;

      }


      message.textContent =
        "✅ Đã lưu báo cáo thành công!";

      message.style.color =
        "#16a34a";


      form.reset();


      fieldDate.value =
        new Date()
          .toISOString()
          .split("T")[0];


      document
        .getElementById("user_name")
        .focus();


    } catch (error) {

      console.error(error);

      message.textContent =
        "❌ Lưu thất bại: "
        + error.message;

      message.style.color =
        "#dc2626";

    }


    button.disabled = false;

    button.innerHTML =
      "<span>🚀</span> GỬI BÁO CÁO";

  }
);

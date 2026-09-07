// ============================================================

// MANAGER.JS

// QUẢN LÝ BÁO CÁO NGÀY

// BẢN HOÀN CHỈNH

// ============================================================

(() => {

    "use strict";

    // ==========================================================

    // 1. SUPABASE

    // ==========================================================

    const SUPABASE_URL_VALUE =

        typeof SUPABASE_URL !== "undefined"

            ? SUPABASE_URL

            : window.SUPABASE_URL;

    const SUPABASE_KEY_VALUE =

        typeof SUPABASE_ANON_KEY !== "undefined"

            ? SUPABASE_ANON_KEY

            : window.SUPABASE_ANON_KEY;

    if (!SUPABASE_URL_VALUE || !SUPABASE_KEY_VALUE) {

        alert("❌ Chưa cấu hình Supabase trong config.js");

        return;

    }

    const db = supabase.createClient(

        SUPABASE_URL_VALUE,

        SUPABASE_KEY_VALUE

    );

    // ==========================================================

    // 2. CẤU HÌNH

    // ==========================================================

    const TABLE_NAME = "bao_cao_ngay";

    const PAGE_SIZE = 20;

    let allData = [];

    let filteredData = [];

    let currentPage = 1;

    let currentUser = null;

    // ==========================================================

    // 3. DOM

    // ==========================================================

    const loginBox =

        document.getElementById("loginBox");

    const managerBox =

        document.getElementById("managerBox");

    const loginId =

        document.getElementById("loginId") ||

        document.getElementById("email");

    const password =

        document.getElementById("password");

    const loginBtn =

        document.getElementById("loginBtn");

    const logoutBtn =

        document.getElementById("logoutBtn");

    const loginMessage =

        document.getElementById("loginMessage");

    const managerMessage =

        document.getElementById("managerMessage");

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

    const tableBody =

        document.getElementById("tableBody");

    const totalReports =

        document.getElementById("totalReports");

    const totalAmount =

        document.getElementById("totalAmount");

    const pagination =

        document.getElementById("pagination");

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

    const menuLogoutBtn =

        document.getElementById("menuLogoutBtn");

    // ==========================================================

    // 4. TIỆN ÍCH

    // ==========================================================

    function escapeHTML(value) {

        if (value === null || value === undefined) {

            return "";

        }

        return String(value)

            .replace(/&/g, "&amp;")

            .replace(/</g, "&lt;")

            .replace(/>/g, "&gt;")

            .replace(/"/g, "&quot;")

            .replace(/'/g, "&#039;");

    }

    function formatMoney(value) {

        const number = Number(value);

        if (!Number.isFinite(number)) {

            return "0";

        }

        return number.toLocaleString("vi-VN");

    }

    function formatDate(value) {

        if (!value) {

            return "";

        }

        return String(value).substring(0, 10);

    }

    function showLoginMessage(message, type = "error") {

        if (!loginMessage) return;

        loginMessage.textContent = message;

        loginMessage.style.color =

            type === "success"

                ? "green"

                : "red";

    }

    function showManagerMessage(message, type = "success") {

        if (!managerMessage) return;

        managerMessage.textContent = message;

        managerMessage.style.color =

            type === "error"

                ? "red"

                : "green";

        setTimeout(() => {

            if (managerMessage) {

                managerMessage.textContent = "";

            }

        }, 4000);

    }

    // ==========================================================

    // 5. HIỂN THỊ LOGIN / MANAGER

    // ==========================================================

    function showLogin() {

        if (loginBox) {

            loginBox.style.display = "";

        }

        if (managerBox) {

            managerBox.style.display = "none";

        }

        if (menuBtn) {

            menuBtn.style.display = "none";

        }

    }

    function showManager() {

        if (loginBox) {

            loginBox.style.display = "none";

        }

        if (managerBox) {

            managerBox.style.display = "";

        }

        if (menuBtn) {

            menuBtn.style.display = "";

        }

    }

    // ==========================================================

    // 6. KIỂM TRA SESSION

    // ==========================================================

    async function checkSession() {

        try {

            const {

                data,

                error

            } = await db.auth.getSession();

            if (error) {

                console.error(error);

                showLogin();

                return;

            }

            if (data?.session?.user) {

                currentUser =

                    data.session.user;

                showManager();

                await loadData();

            } else {

                showLogin();

            }

        } catch (error) {

            console.error(

                "Lỗi kiểm tra session:",

                error

            );

            showLogin();

        }

    }

    // ==========================================================

    // 7. ĐĂNG NHẬP

    // ==========================================================

    async function login() {

        if (!loginId || !password) {

            return;

        }

        const email =

            loginId.value.trim();

        const pass =

            password.value;

        if (!email) {

            showLoginMessage(

                "❌ Vui lòng nhập Gmail."

            );

            loginId.focus();

            return;

        }

        if (!pass) {

            showLoginMessage(

                "❌ Vui lòng nhập mật khẩu."

            );

            password.focus();

            return;

        }

        if (loginBtn) {

            loginBtn.disabled = true;

            loginBtn.textContent =

                "⏳ ĐANG ĐĂNG NHẬP...";

        }

        showLoginMessage("");

        try {

            const {

                data,

                error

            } = await db.auth.signInWithPassword({

                email: email,

                password: pass

            });

            if (error) {

                console.error(

                    "Supabase login error:",

                    error

                );

                showLoginMessage(

                    "❌ Đăng nhập thất bại: " +

                    error.message

                );

                return;

            }

            if (!data?.session) {

                showLoginMessage(

                    "❌ Không tạo được phiên đăng nhập."

                );

                return;

            }

            currentUser =

                data.user;

            showLogin();

            showManager();

            currentPage = 1;

            await loadData();

        } catch (error) {

            console.error(error);

            showLoginMessage(

                "❌ Có lỗi khi đăng nhập: " +

                error.message

            );

        } finally {

            if (loginBtn) {

                loginBtn.disabled = false;

                loginBtn.textContent =

                    "🔐 ĐĂNG NHẬP";

            }

        }

    }

    // ==========================================================

    // 8. ĐĂNG XUẤT

    // ==========================================================

    async function logout() {

        try {

            await db.auth.signOut();

        } catch (error) {

            console.error(

                "Logout error:",

                error

            );

        }

        currentUser = null;

        allData = [];

        filteredData = [];

        currentPage = 1;

        if (tableBody) {

            tableBody.innerHTML = "";

        }

        if (pagination) {

            pagination.innerHTML = "";

        }

        showLogin();

        closeMenu();

    }

    // ==========================================================

    // 9. LẤY DỮ LIỆU

    // ==========================================================

    async function loadData() {

        if (!tableBody) return;

        tableBody.innerHTML = `

            <tr>

                <td colspan="10"

                    style="text-align:center;padding:30px;">

                    ⏳ Đang tải dữ liệu...

                </td>

            </tr>

        `;

        try {

            const {

                data,

                error

            } = await db

                .from(TABLE_NAME)

                .select("*")

                .order(

                    "created_at",

                    {

                        ascending: false

                    }

                );

            if (error) {

                console.error(

                    "Load data error:",

                    error

                );

                tableBody.innerHTML = `

                    <tr>

                        <td colspan="10"

                            style="text-align:center;color:red;padding:30px;">

                            ❌ Không tải được dữ liệu

                            <br>

                            ${escapeHTML(error.message)}

                        </td>

                    </tr>

                `;

                showManagerMessage(

                    "❌ Không tải được báo cáo: " +

                    error.message,

                    "error"

                );

                return;

            }

            allData =

                Array.isArray(data)

                    ? data

                    : [];

            updateUserCount();

            applyFilter();

        } catch (error) {

            console.error(error);

            tableBody.innerHTML = `

                <tr>

                    <td colspan="10"

                        style="text-align:center;color:red;padding:30px;">

                        ❌ Lỗi hệ thống

                    </td>

                </tr>

            `;

        }

    }

    // ==========================================================

    // 10. DANH SÁCH CÁN BỘ

    // ==========================================================

    function getUniqueUsers() {

        const users = new Set();

        allData.forEach(row => {

            const name =

                String(row.user_name || "")

                    .trim();

            if (name) {

                users.add(name);

            }

        });

        return Array.from(users)

            .sort((a, b) =>

                a.localeCompare(

                    b,

                    "vi"

                )

            );

    }

    function updateUserCount() {

        const users =

            getUniqueUsers();

        if (submittedUserCount) {

            submittedUserCount.textContent =

                users.length;

        }

    }

    // ==========================================================

    // 11. LỌC

    // ==========================================================

    function applyFilter() {

        const userValue =

            filterUser

                ? filterUser.value

                    .trim()

                    .toLowerCase()

                : "";

        const dateValue =

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

                    formatDate(

                        row.field_date

                    );

                const matchUser =

                    !userValue ||

                    rowUser.includes(

                        userValue

                    );

                const matchDate =

                    !dateValue ||

                    rowDate === dateValue;

                return (

                    matchUser &&

                    matchDate

                );

            });

        currentPage = 1;

        render();

    }

    // ==========================================================

    // 12. RENDER

    // ==========================================================

    function render() {

        if (!tableBody) return;

        // ------------------------------------------------------

        // THỐNG KÊ

        // ------------------------------------------------------

        if (totalReports) {

            totalReports.textContent =

                filteredData.length;

        }

        const total =

            filteredData.reduce(

                (sum, row) => {

                    const amount =

                        Number(

                            row.expected_amount

                            ?? row.amount

                            ?? 0

                        );

                    return sum +

                        (

                            Number.isFinite(amount)

                                ? amount

                                : 0

                        );

                },

                0

            );

        if (totalAmount) {

            totalAmount.textContent =

                formatMoney(total);

        }

        // ------------------------------------------------------

        // KHÔNG CÓ DỮ LIỆU

        // ------------------------------------------------------

        if (filteredData.length === 0) {

            tableBody.innerHTML = `

                <tr>

                    <td colspan="10"

                        style="text-align:center;padding:40px;">

                        📭 Không có báo cáo

                    </td>

                </tr>

            `;

            renderPagination();

            return;

        }

        // ------------------------------------------------------

        // PHÂN TRANG

        // ------------------------------------------------------

        const start =

            (currentPage - 1) *

            PAGE_SIZE;

        const end =

            start +

            PAGE_SIZE;

        const pageData =

            filteredData.slice(

                start,

                end

            );

        // ------------------------------------------------------

        // HIỂN THỊ BẢNG

        // ------------------------------------------------------

        tableBody.innerHTML =

            pageData.map(row => {

                const amount =

                    Number(

                        row.expected_amount

                        ?? row.amount

                        ?? 0

                    );

                return `

                    <tr>

                        <td>

                            ${escapeHTML(

                                row.user_name || ""

                            )}

                        </td>

                        <td>

                            ${escapeHTML(

                                formatDate(

                                    row.field_date

                                )

                            )}

                        </td>

                        <td>

                            ${escapeHTML(

                                row.cif || ""

                            )}

                        </td>

                        <td>

                            ${escapeHTML(

                                row.customer_name || ""

                            )}

                        </td>

                        <td>

                            ${escapeHTML(

                                row.result || ""

                            )}

                        </td>

                        <td>

                            ${escapeHTML(

                                row.connection || ""

                            )}

                        </td>

                        <td>

                            ${escapeHTML(

                                row.detail || ""

                            )}

                        </td>

                        <td>

                            <strong>

                                ${formatMoney(amount)}

                            </strong>

                        </td>

                        <td>

                            ${escapeHTML(

                                row.next_action || ""

                            )}

                        </td>

                        <td class="action-cell">

                            <button

                                type="button"

                                class="edit-report-btn"

                                data-id="${escapeHTML(row.id)}"

                            >

                                ✏️ Sửa

                            </button>

                            <button

                                type="button"

                                class="delete-report-btn"

                                data-id="${escapeHTML(row.id)}"

                            >

                                🗑️ Xóa

                            </button>

                        </td>

                    </tr>

                `;

            }).join("");

        // ------------------------------------------------------

        // GẮN SỰ KIỆN SỬA / XÓA

        // ------------------------------------------------------

        tableBody

            .querySelectorAll(

                ".edit-report-btn"

            )

            .forEach(button => {

                button.addEventListener(

                    "click",

                    () => {

                        const id =

                            button.dataset.id;

                        editReport(id);

                    }

                );

            });

        tableBody

            .querySelectorAll(

                ".delete-report-btn"

            )

            .forEach(button => {

                button.addEventListener(

                    "click",

                    () => {

                        const id =

                            button.dataset.id;

                        deleteReport(id);

                    }

                );

            });

        renderPagination();

    }

    // ==========================================================

    // 13. PHÂN TRANG

    // ==========================================================

    function renderPagination() {

        if (!pagination) return;

        pagination.innerHTML = "";

        const totalPages =

            Math.ceil(

                filteredData.length /

                PAGE_SIZE

            );

        if (totalPages <= 1) {

            return;

        }

        // NÚT TRƯỚC

        const prev =

            document.createElement(

                "button"

            );

        prev.type = "button";

        prev.textContent =

            "‹ Trước";

        prev.disabled =

            currentPage === 1;

        prev.addEventListener(

            "click",

            () => {

                if (currentPage > 1) {

                    currentPage--;

                    render();

                    window.scrollTo({

                        top: 0,

                        behavior: "smooth"

                    });

                }

            }

        );

        pagination.appendChild(prev);

        // CÁC TRANG

        for (

            let page = 1;

            page <= totalPages;

            page++

        ) {

            const button =

                document.createElement(

                    "button"

                );

            button.type = "button";

            button.textContent =

                page;

            if (

                page === currentPage

            ) {

                button.classList.add(

                    "active"

                );

            }

            button.addEventListener(

                "click",

                () => {

                    currentPage =

                        page;

                    render();

                    window.scrollTo({

                        top: 0,

                        behavior: "smooth"

                    });

                }

            );

            pagination.appendChild(

                button

            );

        }

        // NÚT SAU

        const next =

            document.createElement(

                "button"

            );

        next.type = "button";

        next.textContent =

            "Sau ›";

        next.disabled =

            currentPage === totalPages;

        next.addEventListener(

            "click",

            () => {

                if (

                    currentPage <

                    totalPages

                ) {

                    currentPage++;

                    render();

                    window.scrollTo({

                        top: 0,

                        behavior: "smooth"

                    });

                }

            }

        );

        pagination.appendChild(next);

    }

    // ==========================================================

    // 14. SỬA BÁO CÁO

    // ==========================================================

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

        // ------------------------------------------------------

        // TẠO FORM SỬA

        // ------------------------------------------------------

        const modal =

            createEditModal(row);

        document.body.appendChild(

            modal

        );

        const form =

            modal.querySelector(

                "#editReportForm"

            );

        const cancelBtn =

            modal.querySelector(

                "#cancelEditBtn"

            );

        cancelBtn.addEventListener(

            "click",

            () => {

                modal.remove();

            }

        );

        form.addEventListener(

            "submit",

            async event => {

                event.preventDefault();

                const saveBtn =

                    modal.querySelector(

                        "#saveEditBtn"

                    );

                saveBtn.disabled = true;

                saveBtn.textContent =

                    "⏳ Đang lưu...";

                const formData =

                    new FormData(form);

                const updateData = {

                    user_name:

                        formData.get(

                            "user_name"

                        )?.trim(),

                    field_date:

                        formData.get(

                            "field_date"

                        ),

                    cif:

                        formData.get(

                            "cif"

                        )?.trim(),

                    customer_name:

                        formData.get(

                            "customer_name"

                        )?.trim(),

                    result:

                        formData.get(

                            "result"

                        ),

                    connection:

                        formData.get(

                            "connection"

                        ),

                    detail:

                        formData.get(

                            "detail"

                        )?.trim(),

                    expected_amount:

                        Number(

                            String(

                                formData.get(

                                    "expected_amount"

                                ) || "0"

                            )

                            .replace(

                                /[^\d.-]/g,

                                ""

                            )

                        ) || 0,

                    next_action:

                        formData.get(

                            "next_action"

                        )?.trim()

                };

                try {

                    const {

                        data,

                        error

                    } = await db

                        .from(TABLE_NAME)

                        .update(

                            updateData

                        )

                        .eq(

                            "id",

                            id

                        )

                        .select()

                        .single();

                    if (error) {

                        console.error(

                            "Update error:",

                            error

                        );

                        alert(

                            "❌ Sửa thất bại:\n" +

                            error.message

                        );

                        return;

                    }

                    // Cập nhật dữ liệu local

                    const index =

                        allData.findIndex(

                            item =>

                                String(

                                    item.id

                                ) ===

                                String(id)

                        );

                    if (index !== -1) {

                        allData[index] = {

                            ...allData[index],

                            ...data

                        };

                    }

                    modal.remove();

                    updateUserCount();

                    applyFilter();

                    showManagerMessage(

                        "✅ Đã sửa báo cáo thành công."

                    );

                } catch (error) {

                    console.error(error);

                    alert(

                        "❌ Có lỗi khi sửa:\n" +

                        error.message

                    );

                } finally {

                    saveBtn.disabled = false;

                    saveBtn.textContent =

                        "💾 LƯU THAY ĐỔI";

                }

            }

        );

    }

    // ==========================================================

    // 15. TẠO MODAL SỬA

    // ==========================================================

    function createEditModal(row) {

        const modal =

            document.createElement(

                "div"

            );

        modal.id =

            "editReportModal";

        modal.style.cssText = `

            position:fixed;

            inset:0;

            z-index:99999;

            background:rgba(0,0,0,.65);

            display:flex;

            align-items:center;

            justify-content:center;

            padding:15px;

            overflow:auto;

        `;

        modal.innerHTML = `

            <div style="

                background:#fff;

                width:100%;

                max-width:650px;

                max-height:95vh;

                overflow:auto;

                border-radius:18px;

                padding:20px;

                box-shadow:0 10px 40px rgba(0,0,0,.3);

            ">

                <h2 style="

                    margin-top:0;

                    text-align:center;

                ">

                    ✏️ SỬA BÁO CÁO

                </h2>

                <form id="editReportForm">

                    <label>Cán bộ</label>

                    <input

                        name="user_name"

                        type="text"

                        value="${escapeHTML(

                            row.user_name || ""

                        )}"

                        required

                        style="

                            width:100%;

                            padding:12px;

                            margin:6px 0 12px;

                            box-sizing:border-box;

                        "

                    >

                    <label>Ngày field</label>

                    <input

                        name="field_date"

                        type="date"

                        value="${escapeHTML(

                            formatDate(

                                row.field_date

                            )

                        )}"

                        required

                        style="

                            width:100%;

                            padding:12px;

                            margin:6px 0 12px;

                            box-sizing:border-box;

                        "

                    >

                    <label>Số CIF</label>

                    <input

                        name="cif"

                        type="text"

                        value="${escapeHTML(

                            row.cif || ""

                        )}"

                        style="

                            width:100%;

                            padding:12px;

                            margin:6px 0 12px;

                            box-sizing:border-box;

                        "

                    >

                    <label>Tên khách hàng</label>

                    <input

                        name="customer_name"

                        type="text"

                        value="${escapeHTML(

                            row.customer_name || ""

                        )}"

                        style="

                            width:100%;

                            padding:12px;

                            margin:6px 0 12px;

                            box-sizing:border-box;

                        "

                    >

                    <label>Kết quả</label>

                    <select

                        name="result"

                        style="

                            width:100%;

                            padding:12px;

                            margin:6px 0 12px;

                            box-sizing:border-box;

                        "

                    >

                        <option value="">

                            -- Chọn --

                        </option>

                        <option

                            value="Sống"

                            ${row.result === "Sống"

                                ? "selected"

                                : ""}

                        >

                            Sống

                        </option>

                        <option

                            value="Chết"

                            ${row.result === "Chết"

                                ? "selected"

                                : ""}

                        >

                            Chết

                        </option>

                    </select>

                    <label>Kết nối</label>

                    <input

                        name="connection"

                        type="text"

                        value="${escapeHTML(

                            row.connection || ""

                        )}"

                        style="

                            width:100%;

                            padding:12px;

                            margin:6px 0 12px;

                            box-sizing:border-box;

                        "

                    >

                    <label>Kết quả chi tiết</label>

                    <textarea

                        name="detail"

                        rows="4"

                        style="

                            width:100%;

                            padding:12px;

                            margin:6px 0 12px;

                            box-sizing:border-box;

                            resize:vertical;

                        "

                    >${escapeHTML(

                        row.detail || ""

                    )}</textarea>

                    <label>Dự thu</label>

                    <input

                        name="expected_amount"

                        type="number"

                        min="0"

                        value="${Number(

                            row.expected_amount

                            ?? row.amount

                            ?? 0

                        ) || 0}"

                        style="

                            width:100%;

                            padding:12px;

                            margin:6px 0 12px;

                            box-sizing:border-box;

                        "

                    >

                    <label>

                        Hướng tác động tiếp theo

                    </label>

                    <textarea

                        name="next_action"

                        rows="4"

                        style="

                            width:100%;

                            padding:12px;

                            margin:6px 0 18px;

                            box-sizing:border-box;

                            resize:vertical;

                        "

                    >${escapeHTML(

                        row.next_action || ""

                    )}</textarea>

                    <div style="

                        display:flex;

                        gap:10px;

                    ">

                        <button

                            id="cancelEditBtn"

                            type="button"

                            style="

                                flex:1;

                                padding:14px;

                                border:0;

                                border-radius:10px;

                                background:#777;

                                color:#fff;

                                font-weight:bold;

                            "

                        >

                            ❌ HỦY

                        </button>

                        <button

                            id="saveEditBtn"

                            type="submit"

                            style="

                                flex:1;

                                padding:14px;

                                border:0;

                                border-radius:10px;

                                background:#16a34a;

                                color:#fff;

                                font-weight:bold;

                            "

                        >

                            💾 LƯU THAY ĐỔI

                        </button>

                    </div>

                </form>

            </div>

        `;

        return modal;

    }

    // ==========================================================

    // 16. XÓA BÁO CÁO

    // ==========================================================

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

        const customerName =

            row.customer_name ||

            row.cif ||

            "báo cáo này";

        const confirmed =

            confirm(

                "⚠️ Bạn có chắc chắn muốn XÓA báo cáo này?\n\n" +

                "Cán bộ: " +

                (row.user_name || "") +

                "\n" +

                "Khách hàng: " +

                customerName +

                "\n" +

                "CIF: " +

                (row.cif || "") +

                "\n\n" +

                "❗ Dữ liệu đã xóa không thể khôi phục."

            );

        if (!confirmed) {

            return;

        }

        try {

            const {

                error

            } = await db

                .from(TABLE_NAME)

                .delete()

                .eq(

                    "id",

                    id

                );

            if (error) {

                console.error(

                    "Delete error:",

                    error

                );

                alert(

                    "❌ Xóa thất bại:\n" +

                    error.message

                );

                return;

            }

            // Xóa khỏi local

            allData =

                allData.filter(

                    item =>

                        String(item.id) !==

                        String(id)

                );

            updateUserCount();

            applyFilter();

            showManagerMessage(

                "✅ Đã xóa báo cáo."

            );

        } catch (error) {

            console.error(error);

            alert(

                "❌ Có lỗi khi xóa:\n" +

                error.message

            );

        }

    }

    // ==========================================================

    // 17. CÁN BỘ ĐÃ NHẬP BÁO CÁO

    // ==========================================================

    function showSubmittedUsers() {

        const users =

            getUniqueUsers();

        const modal =

            document.createElement(

                "div"

            );

        modal.id =

            "submittedUsersModal";

        modal.style.cssText = `

            position:fixed;

            inset:0;

            z-index:99998;

            background:rgba(0,0,0,.65);

            display:flex;

            align-items:center;

            justify-content:center;

            padding:15px;

        `;

        let userHTML = "";

        if (users.length === 0) {

            userHTML = `

                <div style="

                    text-align:center;

                    padding:30px;

                ">

                    📭 Chưa có cán bộ nào nhập báo cáo.

                </div>

            `;

        } else {

            userHTML =

                users.map(

                    (user, index) => {

                        const count =

                            allData.filter(

                                row =>

                                    String(

                                        row.user_name || ""

                                    )

                                    .trim() ===

                                    user

                            ).length;

                        return `

                            <button

                                type="button"

                                class="submitted-user-item"

                                data-user="${escapeHTML(user)}"

                                style="

                                    width:100%;

                                    display:flex;

                                    justify-content:space-between;

                                    align-items:center;

                                    padding:15px;

                                    margin-bottom:8px;

                                    border:1px solid #ddd;

                                    border-radius:12px;

                                    background:#f8fafc;

                                    text-align:left;

                                    font-size:16px;

                                "

                            >

                                <span>

                                    👤

                                    <strong>

                                        ${escapeHTML(user)}

                                    </strong>

                                </span>

                                <span style="

                                    background:#2563eb;

                                    color:#fff;

                                    padding:5px 10px;

                                    border-radius:20px;

                                    font-weight:bold;

                                ">

                                    ${count}

                                </span>

                            </button>

                        `;

                    }

                ).join("");

        }

        modal.innerHTML = `

            <div style="

                background:#fff;

                width:100%;

                max-width:500px;

                max-height:85vh;

                overflow:auto;

                border-radius:18px;

                padding:20px;

                box-shadow:0 10px 40px rgba(0,0,0,.3);

            ">

                <div style="

                    display:flex;

                    justify-content:space-between;

                    align-items:center;

                    margin-bottom:15px;

                ">

                    <h2 style="

                        margin:0;

                    ">

                        👥 CÁN BỘ ĐÃ NHẬP BÁO CÁO

                    </h2>

                    <button

                        id="closeSubmittedUsers"

                        type="button"

                        style="

                            border:0;

                            background:#eee;

                            border-radius:50%;

                            width:40px;

                            height:40px;

                            font-size:20px;

                        "

                    >

                        ✕

                    </button>

                </div>

                <div>

                    ${userHTML}

                </div>

            </div>

        `;

        document.body.appendChild(

            modal

        );

        // Đóng

        modal

            .querySelector(

                "#closeSubmittedUsers"

            )

            .addEventListener(

                "click",

                () => {

                    modal.remove();

                }

            );

        // Bấm cán bộ → lọc

        modal

            .querySelectorAll(

                ".submitted-user-item"

            )

            .forEach(button => {

                button.addEventListener(

                    "click",

                    () => {

                        const user =

                            button.dataset.user;

                        if (filterUser) {

                            filterUser.value =

                                user;

                        }

                        if (filterDate) {

                            filterDate.value =

                                "";

                        }

                        modal.remove();

                        applyFilter();

                        window.scrollTo({

                            top: 0,

                            behavior: "smooth"

                        });

                    }

                );

            });

        // Bấm nền để đóng

        modal.addEventListener(

            "click",

            event => {

                if (

                    event.target ===

                    modal

                ) {

                    modal.remove();

                }

            }

        );

    }

    // ==========================================================

    // 18. XUẤT EXCEL

    // ==========================================================

    function exportExcel() {

        if (

            typeof XLSX ===

            "undefined"

        ) {

            alert(

                "❌ Chưa tải được thư viện Excel."

            );

            return;

        }

        if (

            !filteredData.length

        ) {

            alert(

                "⚠️ Không có dữ liệu để xuất Excel."

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

                        Number(

                            row.expected_amount

                            ?? row.amount

                            ?? 0

                        ) || 0,

                    "Hướng tác động tiếp theo":

                        row.next_action || "",

                    "Thời gian tạo":

                        row.created_at || ""

                })

            );

        const worksheet =

            XLSX.utils.json_to_sheet(

                excelData

            );

        // Độ rộng cột

        worksheet["!cols"] = [

            { wch: 18 },

            { wch: 14 },

            { wch: 14 },

            { wch: 28 },

            { wch: 12 },

            { wch: 22 },

            { wch: 45 },

            { wch: 18 },

            { wch: 45 },

            { wch: 25 }

        ];

        const workbook =

            XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(

            workbook,

            worksheet,

            "Bao Cao Ngay"

        );

        const now =

            new Date();

        const date =

            now

                .toISOString()

                .substring(0, 10);

        XLSX.writeFile(

            workbook,

            `Bao_Cao_Ngay_${date}.xlsx`

        );

    }

    // ==========================================================

    // 19. MENU

    // ==========================================================

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

    // ==========================================================

    // 20. AUTH STATE

    // ==========================================================

    db.auth.onAuthStateChange(

        (event, session) => {

            if (

                event ===

                "SIGNED_OUT"

            ) {

                currentUser = null;

                showLogin();

            }

            if (

                event ===

                "SIGNED_IN"

            ) {

                currentUser =

                    session?.user ||

                    null;

            }

        }

    );

    // ==========================================================

    // 21. SỰ KIỆN

    // ==========================================================

    document.addEventListener(

        "DOMContentLoaded",

        () => {

            // -----------------------------------------------

            // LOGIN

            // -----------------------------------------------

            if (loginBtn) {

                loginBtn.addEventListener(

                    "click",

                    login

                );

            }

            if (password) {

                password.addEventListener(

                    "keydown",

                    event => {

                        if (

                            event.key ===

                            "Enter"

                        ) {

                            login();

                        }

                    }

                );

            }

            if (loginId) {

                loginId.addEventListener(

                    "keydown",

                    event => {

                        if (

                            event.key ===

                            "Enter"

                        ) {

                            login();

                        }

                    }

                );

            }

            // -----------------------------------------------

            // LOGOUT

            // -----------------------------------------------

            if (logoutBtn) {

                logoutBtn.addEventListener(

                    "click",

                    logout

                );

            }

            if (menuLogoutBtn) {

                menuLogoutBtn.addEventListener(

                    "click",

                    logout

                );

            }

            // -----------------------------------------------

            // FILTER

            // -----------------------------------------------

            if (filterBtn) {

                filterBtn.addEventListener(

                    "click",

                    applyFilter

                );

            }

            if (filterUser) {

                filterUser.addEventListener(

                    "keydown",

                    event => {

                        if (

                            event.key ===

                            "Enter"

                        ) {

                            applyFilter();

                        }

                    }

                );

            }

            if (filterDate) {

                filterDate.addEventListener(

                    "change",

                    applyFilter

                );

            }

            // -----------------------------------------------

            // REFRESH

            // -----------------------------------------------

            if (refreshBtn) {

                refreshBtn.addEventListener(

                    "click",

                    async () => {

                        refreshBtn.disabled =

                            true;

                        const oldText =

                            refreshBtn.textContent;

                        refreshBtn.textContent =

                            "⏳ Đang tải...";

                        await loadData();

                        refreshBtn.disabled =

                            false;

                        refreshBtn.textContent =

                            oldText;

                    }

                );

            }

            // -----------------------------------------------

            // EXPORT

            // -----------------------------------------------

            if (exportBtn) {

                exportBtn.addEventListener(

                    "click",

                    exportExcel

                );

            }

            // -----------------------------------------------

            // SUBMITTED USERS

            // -----------------------------------------------

            if (

                showSubmittedUsersBtn

            ) {

                showSubmittedUsersBtn.addEventListener(

                    "click",

                    showSubmittedUsers

                );

            }

            // -----------------------------------------------

            // MENU

            // -----------------------------------------------

            if (menuBtn) {

                menuBtn.style.display =

                    "inline-flex";

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

            // -----------------------------------------------

            // KIỂM TRA SESSION

            // -----------------------------------------------

            checkSession();

        }

    );

})();

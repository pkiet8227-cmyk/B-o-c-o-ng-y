// ============================================================

// MANAGER.JS

// QUẢN LÝ BÁO CÁO NGÀY

// ============================================================

(() => {

    "use strict";

    // ==========================================================

    // KIỂM TRA SUPABASE

    // ==========================================================

    if (!window.supabase) {

        alert("❌ Không tìm thấy Supabase.\n\nVui lòng kiểm tra lại thư viện Supabase.");

        return;

    }

    const supabaseClient = window.supabase.createClient(

        window.SUPABASE_URL,

        window.SUPABASE_ANON_KEY

    );

    let allData = [];

    let filteredData = [];

    let currentPage = 1;

    const PAGE_SIZE = 20;

    let currentUser = null;

    // ==========================================================

    // DOM

    // ==========================================================

    const loginBox = document.getElementById("loginBox");

    const managerBox = document.getElementById("managerBox");

    const emailInput = document.getElementById("emailInput");

    const passwordInput = document.getElementById("passwordInput");

    const loginBtn = document.getElementById("loginBtn");

    const logoutBtn = document.getElementById("logoutBtn");

    const loginMessage = document.getElementById("loginMessage");

    const managerMessage = document.getElementById("managerMessage");

    const totalReports = document.getElementById("totalReports");

    const totalAmount = document.getElementById("totalAmount");

    const filterUser = document.getElementById("filterUser");

    const filterDate = document.getElementById("filterDate");

    const filterBtn = document.getElementById("filterBtn");

    const refreshBtn = document.getElementById("refreshBtn");

    const exportBtn = document.getElementById("exportBtn");

    const tableBody = document.getElementById("tableBody");

    const pagination = document.getElementById("pagination");

    const menuBtn = document.getElementById("menuBtn");

    const sideMenu = document.getElementById("sideMenu");

    const sideMenuOverlay = document.getElementById("sideMenuOverlay");

    const sideMenuClose = document.getElementById("sideMenuClose");

    const menuReportsBtn = document.getElementById("menuReportsBtn");

    const menuLogoutBtn = document.getElementById("menuLogoutBtn");

    const showSubmittedUsersBtn = document.getElementById("showSubmittedUsersBtn");

    const submittedUserCount = document.getElementById("submittedUserCount");

    document.addEventListener("DOMContentLoaded", init);

    async function init() {

        if (filterDate) {

            filterDate.value = getTodayVietnam();

        }

        if (loginBtn) {

            loginBtn.addEventListener("click", login);

        }

        if (passwordInput) {

            passwordInput.addEventListener("keydown", function(event) {

                if (event.key === "Enter") login();

            });

        }

        if (logoutBtn) {

            logoutBtn.addEventListener("click", logout);

        }

        if (filterBtn) {

            filterBtn.addEventListener("click", function() {

                currentPage = 1;

                applyFilter();

            });

        }

        if (refreshBtn) {

            refreshBtn.addEventListener("click", async function() {

                await loadData();

            });

        }

        if (exportBtn) {

            exportBtn.addEventListener("click", exportExcel);

        }

        if (menuBtn) {

            menuBtn.addEventListener("click", openMenu);

        }

        if (sideMenuClose) {

            sideMenuClose.addEventListener("click", closeMenu);

        }

        if (sideMenuOverlay) {

            sideMenuOverlay.addEventListener("click", closeMenu);

        }

        if (menuReportsBtn) {

            menuReportsBtn.addEventListener("click", function() {

                closeMenu();

                window.scrollTo({

                    top: 0,

                    behavior: "smooth"

                });

            });

        }

        if (menuLogoutBtn) {

            menuLogoutBtn.addEventListener("click", logout);

        }

        if (showSubmittedUsersBtn) {

            showSubmittedUsersBtn.addEventListener(

                "click",

                showSubmittedUsers

            );

        }

        await checkSession();

    }

    // ==========================================================

    // LẤY NGÀY HÔM NAY THEO GIỜ VIỆT NAM

    // ==========================================================

    function getTodayVietnam() {

        try {

            return new Intl.DateTimeFormat("en-CA", {

                timeZone: "Asia/Ho_Chi_Minh",

                year: "numeric",

                month: "2-digit",

                day: "2-digit"

            }).format(new Date());

        } catch (error) {

            const now = new Date();

            const year = now.getFullYear();

            const month = String(

                now.getMonth() + 1

            ).padStart(2, "0");

            const day = String(

                now.getDate()

            ).padStart(2, "0");

            return `${year}-${month}-${day}`;

        }

    }

    // ==========================================================

    // CHECK SESSION

    // ==========================================================

    async function checkSession() {

        try {

            const { data, error } =

                await supabaseClient.auth.getSession();

            if (error) {

                console.error(

                    "Session error:",

                    error

                );

                showLogin();

                return;

            }

            const session = data?.session;

            if (!session) {

                showLogin();

                return;

            }

            currentUser = session.user;

            if (!checkUserRole(currentUser)) {

                await supabaseClient.auth.signOut();

                showLogin();

                if (loginMessage) {

                    loginMessage.textContent =

                        "❌ Tài khoản không có quyền quản lý.";

                }

                return;

            }

            showManager();

            await loadData();

        } catch (error) {

            console.error(

                "checkSession:",

                error

            );

            showLogin();

        }

    }

    // ==========================================================

    // KIỂM TRA QUYỀN

    // ==========================================================

    function checkUserRole(user) {

        if (!user) return false;

        const userMetadata =

            user.user_metadata || {};

        const appMetadata =

            user.app_metadata || {};

        const role =

            userMetadata.role ||

            appMetadata.role ||

            "";

        const normalizedRole =

            String(role)

                .trim()

                .toLowerCase();

        return (

            normalizedRole === "manager" ||

            normalizedRole === "admin"

        );

    }

    // ==========================================================

    // HIỆN LOGIN

    // ==========================================================

    function showLogin() {

        if (loginBox) {

            loginBox.style.display = "";

        }

        if (managerBox) {

            managerBox.style.display = "none";

        }

        currentUser = null;

    }

    // ==========================================================

    // HIỆN MANAGER

    // ==========================================================

    function showManager() {

        if (loginBox) {

            loginBox.style.display = "none";

        }

        if (managerBox) {

            managerBox.style.display = "";

        }

    }

    // ==========================================================

    // LOGIN

    // ==========================================================

    async function login() {

        const email =

            emailInput?.value.trim();

        const password =

            passwordInput?.value;

        if (!email) {

            if (loginMessage) {

                loginMessage.textContent =

                    "⚠️ Vui lòng nhập email.";

            }

            return;

        }

        if (!password) {

            if (loginMessage) {

                loginMessage.textContent =

                    "⚠️ Vui lòng nhập mật khẩu.";

            }

            return;

        }

        if (loginMessage) {

            loginMessage.textContent =

                "⏳ Đang đăng nhập...";

        }

        if (loginBtn) {

            loginBtn.disabled = true;

        }

        try {

            const { data, error } =

                await supabaseClient.auth.signInWithPassword({

                    email: email,

                    password: password

                });

            if (error) throw error;

            const user = data?.user;

            if (!user) {

                throw new Error(

                    "Không lấy được thông tin tài khoản."

                );

            }

            if (!checkUserRole(user)) {

                await supabaseClient.auth.signOut();

                throw new Error(

                    "Tài khoản không có quyền manager/admin."

                );

            }

            currentUser = user;

            if (loginMessage) {

                loginMessage.textContent = "";

            }

            showManager();

            await loadData();

        } catch (error) {

            console.error(

                "Login error:",

                error

            );

            if (loginMessage) {

                loginMessage.textContent =

                    "❌ " +

                    (

                        error?.message ||

                        "Đăng nhập thất bại."

                    );

            }

        } finally {

            if (loginBtn) {

                loginBtn.disabled = false;

            }

        }

    }

    // ==========================================================

    // LOGOUT

    // ==========================================================

    async function logout() {

        try {

            await supabaseClient.auth.signOut();

        } catch (error) {

            console.error(

                "Logout error:",

                error

            );

        }

        currentUser = null;

        allData = [];

        filteredData = [];

        showLogin();

        closeMenu();

    }

    // ==========================================================

    // LOAD DATA

    // ==========================================================

    async function loadData() {

        if (managerMessage) {

            managerMessage.textContent =

                "⏳ Đang tải dữ liệu...";

        }

        try {

            const { data, error } =

                await supabaseClient

                    .from("bao_cao_ngay")

                    .select("*")

                    .order(

                        "created_at",

                        {

                            ascending: false

                        }

                    );

            if (error) throw error;

            allData =

                Array.isArray(data)

                    ? data

                    : [];

            currentPage = 1;

            if (

                filterDate &&

                !filterDate.value

            ) {

                filterDate.value =

                    getTodayVietnam();

            }

            applyFilter();

            if (managerMessage) {

                managerMessage.textContent =

                    `Đã tải ${allData.length} báo cáo.`;

            }

        } catch (error) {

            console.error(

                "Load data error:",

                error

            );

            allData = [];

            filteredData = [];

            if (managerMessage) {

                managerMessage.textContent =

                    "❌ Không thể tải dữ liệu: " +

                    (

                        error?.message ||

                        "Lỗi không xác định."

                    );

            }

            render();

        }

    }

    // ==========================================================

    // FILTER

    // ==========================================================

    function applyFilter() {

        const userKeyword =

            (

                filterUser?.value ||

                ""

            )

                .trim()

                .toLowerCase();

        let dateKeyword =

            filterDate?.value ||

            "";

        if (!dateKeyword) {

            dateKeyword =

                getTodayVietnam();

            if (filterDate) {

                filterDate.value =

                    dateKeyword;

            }

        }

        filteredData =

            allData.filter(function(row) {

                const userName =

                    String(

                        row?.user_name ||

                        ""

                    )

                        .trim()

                        .toLowerCase();

                const reportDate =

                    String(

                        row?.field_date ||

                        ""

                    )

                        .substring(0, 10);

                const matchUser =

                    !userKeyword ||

                    userName.includes(

                        userKeyword

                    );

                const matchDate =

                    reportDate ===

                    dateKeyword;

                return (

                    matchUser &&

                    matchDate

                );

            });

        currentPage =

            Math.max(

                1,

                currentPage

            );

        updateSubmittedUserCount();

        render();

    }

    // ==========================================================

    // ĐẾM CÁN BỘ DUY NHẤT

    // ==========================================================

    function updateSubmittedUserCount() {

        if (!submittedUserCount) return;

        const uniqueUsers =

            new Set();

        filteredData.forEach(function(row) {

            const name =

                String(

                    row?.user_name ||

                    ""

                )

                    .trim()

                    .toLowerCase();

            if (name) {

                uniqueUsers.add(name);

            }

        });

        submittedUserCount.textContent =

            uniqueUsers.size;

    }

    // ==========================================================

    // RENDER

    // ==========================================================

    function render() {

        if (!tableBody) return;

        tableBody.innerHTML = "";

        if (

            !filteredData ||

            filteredData.length === 0

        ) {

            tableBody.innerHTML = `

                <tr>

                    <td

                        colspan="100"

                        style="text-align:center;padding:30px;"

                    >

                        📭 Không có báo cáo trong ngày này.

                    </td>

                </tr>

            `;

            if (totalReports) {

                totalReports.textContent = "0";

            }

            if (totalAmount) {

                totalAmount.textContent = "0";

            }

            if (pagination) {

                pagination.innerHTML = "";

            }

            return;

        }

        if (totalReports) {

            totalReports.textContent =

                filteredData.length;

        }

        let amountTotal = 0;

        filteredData.forEach(function(row) {

            amountTotal +=

                parseNumber(

                    row?.expected_amount

                );

        });

        if (totalAmount) {

            totalAmount.textContent =

                formatMoney(amountTotal);

        }

        const totalPages =

            Math.max(

                1,

                Math.ceil(

                    filteredData.length /

                    PAGE_SIZE

                )

            );

        if (currentPage > totalPages) {

            currentPage = totalPages;

        }

        const startIndex =

            (currentPage - 1) *

            PAGE_SIZE;

        const endIndex =

            startIndex +

            PAGE_SIZE;

        const pageData =

            filteredData.slice(

                startIndex,

                endIndex

            );

        pageData.forEach(function(row, index) {

            const realIndex =

                startIndex + index;

            const tr =

                document.createElement("tr");

            tr.innerHTML = `

                <td>${realIndex + 1}</td>

                <td>

                    ${escapeHtml(

                        row?.user_name || ""

                    )}

                </td>

                <td>

                    ${formatDate(

                        row?.field_date

                    )}

                </td>

                <td>

                    ${escapeHtml(

                        row?.cif || ""

                    )}

                </td>

                <td>

                    ${escapeHtml(

                        row?.customer_name || ""

                    )}

                </td>

                <td>

                    ${escapeHtml(

                        row?.result || ""

                    )}

                </td>

                <td>

                    ${escapeHtml(

                        row?.connection || ""

                    )}

                </td>

                <td>

                    ${escapeHtml(

                        row?.detail || ""

                    )}

                </td>

                <td>

                    ${formatMoney(

                        row?.expected_amount

                    )}

                </td>

                <td>

                    ${escapeHtml(

                        row?.next_action || ""

                    )}

                </td>

                <td>

                    <button

                        type="button"

                        class="manager-edit-btn"

                    >

                        ✏️

                    </button>

                    <button

                        type="button"

                        class="manager-delete-btn"

                    >

                        🗑️

                    </button>

                </td>

            `;

            const editBtn =

                tr.querySelector(

                    ".manager-edit-btn"

                );

            if (editBtn) {

                editBtn.addEventListener(

                    "click",

                    function() {

                        editReport(

                            row?.id

                        );

                    }

                );

            }

            const deleteBtn =

                tr.querySelector(

                    ".manager-delete-btn"

                );

            if (deleteBtn) {

                deleteBtn.addEventListener(

                    "click",

                    function() {

                        deleteReport(

                            row?.id

                        );

                    }

                );

            }

            tableBody.appendChild(tr);

        });

        renderPagination();

    }

    // ==========================================================

    // PAGINATION

    // ==========================================================

    function renderPagination() {

        if (!pagination) return;

        pagination.innerHTML = "";

        const totalPages =

            Math.max(

                1,

                Math.ceil(

                    filteredData.length /

                    PAGE_SIZE

                )

            );

        if (totalPages <= 1) return;

        const prev =

            document.createElement("button");

        prev.type = "button";

        prev.textContent = "‹";

        prev.disabled =

            currentPage <= 1;

        prev.addEventListener(

            "click",

            function() {

                if (currentPage > 1) {

                    currentPage--;

                    render();

                }

            }

        );

        pagination.appendChild(prev);

        for (

            let page = 1;

            page <= totalPages;

            page++

        ) {

            const btn =

                document.createElement("button");

            btn.type = "button";

            btn.textContent =

                page;

            if (

                page === currentPage

            ) {

                btn.classList.add(

                    "active"

                );

            }

            btn.addEventListener(

                "click",

                function() {

                    currentPage =

                        page;

                    render();

                }

            );

            pagination.appendChild(btn);

        }

        const next =

            document.createElement("button");

        next.type = "button";

        next.textContent = "›";

        next.disabled =

            currentPage >= totalPages;

        next.addEventListener(

            "click",

            function() {

                if (

                    currentPage <

                    totalPages

                ) {

                    currentPage++;

                    render();

                }

            }

        );

        pagination.appendChild(next);

    }

    // ==========================================================

    // EDIT REPORT

    // ==========================================================

    function editReport(id) {

        const row =

            allData.find(function(item) {

                return String(item?.id) ===

                    String(id);

            });

        if (!row) {

            alert(

                "❌ Không tìm thấy báo cáo."

            );

            return;

        }

        createEditModal(row);

    }

    // ==========================================================

    // CREATE EDIT MODAL

    // ==========================================================

    function createEditModal(row) {

        removeEditModal();

        const modal =

            document.createElement("div");

        modal.id =

            "managerEditModal";

        modal.style.cssText = `

            position:fixed;

            inset:0;

            background:rgba(0,0,0,.55);

            display:flex;

            align-items:center;

            justify-content:center;

            z-index:99999;

            padding:15px;

        `;

        modal.innerHTML = `

            <div

                style="

                    background:#fff;

                    width:min(700px,100%);

                    max-height:90vh;

                    overflow:auto;

                    border-radius:14px;

                    padding:20px;

                    box-sizing:border-box;

                "

            >

                <h2

                    style="

                        margin-top:0;

                        margin-bottom:20px;

                    "

                >

                    ✏️ Sửa báo cáo

                </h2>

                <div

                    style="

                        display:grid;

                        gap:12px;

                    "

                >

                    <label>

                        Cán bộ

                        <input

                            id="editUserName"

                            type="text"

                            value="${escapeAttr(

                                row?.user_name || ""

                            )}"

                            style="

                                width:100%;

                                box-sizing:border-box;

                            "

                        >

                    </label>

                    <label>

                        Ngày field

                        <input

                            id="editFieldDate"

                            type="date"

                            value="${escapeAttr(

                                normalizeDateInput(

                                    row?.field_date

                                )

                            )}"

                            style="

                                width:100%;

                                box-sizing:border-box;

                            "

                        >

                    </label>

                    <label>

                        CIF

                        <input

                            id="editCif"

                            type="text"

                            value="${escapeAttr(

                                row?.cif || ""

                            )}"

                            style="

                                width:100%;

                                box-sizing:border-box;

                            "

                        >

                    </label>

                    <label>

                        Tên khách hàng

                        <input

                            id="editCustomerName"

                            type="text"

                            value="${escapeAttr(

                                row?.customer_name || ""

                            )}"

                            style="

                                width:100%;

                                box-sizing:border-box;

                            "

                        >

                    </label>

                    <label>

                        Kết quả

                        <input

                            id="editResult"

                            type="text"

                            value="${escapeAttr(

                                row?.result || ""

                            )}"

                            style="

                                width:100%;

                                box-sizing:border-box;

                            "

                        >

                    </label>

                    <label>

                        Kết nối

                        <input

                            id="editConnection"

                            type="text"

                            value="${escapeAttr(

                                row?.connection || ""

                            )}"

                            style="

                                width:100%;

                                box-sizing:border-box;

                            "

                        >

                    </label>

                    <label>

                        Kết quả chi tiết

                        <textarea

                            id="editDetail"

                            rows="4"

                            style="

                                width:100%;

                                box-sizing:border-box;

                            "

                        >${escapeHtml(

                            row?.detail || ""

                        )}</textarea>

                    </label>

                    <label>

                        Dự thu

                        <input

                            id="editExpectedAmount"

                            type="number"

                            value="${escapeAttr(

                                row?.expected_amount ?? ""

                            )}"

                            style="

                                width:100%;

                                box-sizing:border-box;

                            "

                        >

                    </label>

                    <label>

                        Hướng tác động tiếp theo

                        <textarea

                            id="editNextAction"

                            rows="4"

                            style="

                                width:100%;

                                box-sizing:border-box;

                            "

                        >${escapeHtml(

                            row?.next_action || ""

                        )}</textarea>

                    </label>

                </div>

                <div

                    style="

                        display:flex;

                        justify-content:flex-end;

                        gap:10px;

                        margin-top:20px;

                    "

                >

                    <button

                        type="button"

                        id="editCancelBtn"

                    >

                        Hủy

                    </button>

                    <button

                        type="button"

                        id="editSaveBtn"

                    >

                        💾 Lưu

                    </button>

                </div>

            </div>

        `;

        document.body.appendChild(modal);

        const cancelBtn =

            document.getElementById(

                "editCancelBtn"

            );

        const saveBtn =

            document.getElementById(

                "editSaveBtn"

            );

        if (cancelBtn) {

            cancelBtn.addEventListener(

                "click",

                removeEditModal

            );

        }

        if (saveBtn) {

            saveBtn.addEventListener(

                "click",

                function() {

                    saveEditReport(

                        row?.id

                    );

                }

            );

        }

        modal.addEventListener(

            "click",

            function(event) {

                if (

                    event.target ===

                    modal

                ) {

                    removeEditModal();

                }

            }

        );

    }

    // ==========================================================

    // SAVE EDIT REPORT

    // ==========================================================

    async function saveEditReport(id) {

        const userName =

            document.getElementById(

                "editUserName"

            )?.value.trim();

        const fieldDate =

            document.getElementById(

                "editFieldDate"

            )?.value;

        const cif =

            document.getElementById(

                "editCif"

            )?.value.trim();

        const customerName =

            document.getElementById(

                "editCustomerName"

            )?.value.trim();

        const result =

            document.getElementById(

                "editResult"

            )?.value.trim();

        const connection =

            document.getElementById(

                "editConnection"

            )?.value.trim();

        const detail =

            document.getElementById(

                "editDetail"

            )?.value.trim();

        const expectedAmount =

            document.getElementById(

                "editExpectedAmount"

            )?.value;

        const nextAction =

            document.getElementById(

                "editNextAction"

            )?.value.trim();

        if (!userName) {

            alert(

                "⚠️ Vui lòng nhập tên cán bộ."

            );

            return;

        }

        if (!fieldDate) {

            alert(

                "⚠️ Vui lòng chọn ngày."

            );

            return;

        }

        const saveBtn =

            document.getElementById(

                "editSaveBtn"

            );

        if (saveBtn) {

            saveBtn.disabled = true;

            saveBtn.textContent =

                "⏳ Đang lưu...";

        }

        try {

            const updateData = {

                user_name:

                    userName,

                field_date:

                    fieldDate,

                cif:

                    cif,

                customer_name:

                    customerName,

                result:

                    result,

                connection:

                    connection,

                detail:

                    detail,

                expected_amount:

                    expectedAmount === ""

                        ? null

                        : Number(

                            expectedAmount

                        ),

                next_action:

                    nextAction

            };

            const { error } =

                await supabaseClient

                    .from("bao_cao_ngay")

                    .update(updateData)

                    .eq("id", id);

            if (error) throw error;

            alert(

                "✅ Đã cập nhật báo cáo."

            );

            removeEditModal();

            await loadData();

        } catch (error) {

            console.error(

                "Save edit error:",

                error

            );

            alert(

                "❌ Không thể cập nhật:\n\n" +

                (

                    error?.message ||

                    "Lỗi không xác định."

                )

            );

        } finally {

            if (saveBtn) {

                saveBtn.disabled = false;

                saveBtn.textContent =

                    "💾 Lưu";

            }

        }

    }

    // ==========================================================

    // DELETE REPORT

    // ==========================================================

    async function deleteReport(id) {

        const row =

            allData.find(function(item) {

                return String(item?.id) ===

                    String(id);

            });

        const customerName =

            row?.customer_name ||

            "báo cáo này";

        const confirmed =

            confirm(

                `⚠️ Bạn có chắc muốn xóa báo cáo của "${customerName}" không?\n\nDữ liệu sẽ bị xóa khỏi hệ thống.`

            );

        if (!confirmed) return;

        try {

            const { error } =

                await supabaseClient

                    .from("bao_cao_ngay")

                    .delete()

                    .eq("id", id);

            if (error) throw error;

            alert(

                "✅ Đã xóa báo cáo."

            );

            await loadData();

        } catch (error) {

            console.error(

                "Delete error:",

                error

            );

            alert(

                "❌ Không thể xóa báo cáo:\n\n" +

                (

                    error?.message ||

                    "Lỗi không xác định."

                )

            );

        }

    }

    // ==========================================================

    // HIỂN THỊ CÁN BỘ ĐÃ NHẬP BÁO CÁO

    // ==========================================================

    function showSubmittedUsers() {

        closeMenu();

        removeSubmittedUserModal();

        const users =

            new Map();

        filteredData.forEach(function(row) {

            const originalName =

                String(

                    row?.user_name ||

                    ""

                ).trim();

            if (!originalName) return;

            const key =

                originalName.toLowerCase();

            if (!users.has(key)) {

                users.set(

                    key,

                    {

                        name:

                            originalName,

                        count:

                            1

                    }

                );

            } else {

                users.get(key).count++;

            }

        });

        const userList =

            Array.from(

                users.values()

            ).sort(function(a, b) {

                return a.name.localeCompare(

                    b.name,

                    "vi"

                );

            });

        const modal =

            document.createElement("div");

        modal.id =

            "submittedUsersModal";

        modal.style.cssText = `

            position:fixed;

            inset:0;

            background:rgba(0,0,0,.55);

            display:flex;

            align-items:center;

            justify-content:center;

            z-index:99998;

            padding:15px;

        `;

        let content = "";

        if (userList.length === 0) {

            content = `

                <div

                    style="

                        text-align:center;

                        padding:30px;

                    "

                >

                    📭 Chưa có cán bộ nào nhập báo cáo trong ngày này.

                </div>

            `;

        } else {

            content = `

                <div

                    style="

                        display:flex;

                        flex-direction:column;

                        gap:8px;

                    "

                >

            `;

            userList.forEach(function(user) {

                content += `

                    <button

                        type="button"

                        class="submitted-user-item"

                        data-user="${escapeAttr(

                            user.name

                        )}"

                        style="

                            width:100%;

                            display:flex;

                            align-items:center;

                            justify-content:space-between;

                            padding:12px 14px;

                            border:1px solid #ddd;

                            background:#fff;

                            border-radius:10px;

                            cursor:pointer;

                            text-align:left;

                        "

                    >

                        <span>

                            👤 ${escapeHtml(

                                user.name

                            )}

                        </span>

                        <strong>

                            ${user.count} báo cáo

                        </strong>

                    </button>

                `;

            });

            content += `

                </div>

            `;

        }

        modal.innerHTML = `

            <div

                style="

                    background:#fff;

                    width:min(500px,100%);

                    max-height:85vh;

                    overflow:auto;

                    border-radius:14px;

                    padding:20px;

                    box-sizing:border-box;

                "

            >

                <div

                    style="

                        display:flex;

                        justify-content:space-between;

                        align-items:center;

                        gap:10px;

                        margin-bottom:18px;

                    "

                >

                    <h2

                        style="

                            margin:0;

                            font-size:20px;

                        "

                    >

                        👥 CÁN BỘ ĐÃ NHẬP BÁO CÁO

                    </h2>

                    <button

                        type="button"

                        id="closeSubmittedUsers"

                    >

                        ✕

                    </button>

                </div>

                <div

                    style="

                        margin-bottom:15px;

                        padding:10px 12px;

                        background:#f5f5f5;

                        border-radius:8px;

                    "

                >

                    Tổng:

                    <strong>

                        ${userList.length}

                    </strong>

                    cán bộ

                </div>

                ${content}

            </div>

        `;

        document.body.appendChild(modal);

        const closeBtn =

            document.getElementById(

                "closeSubmittedUsers"

            );

        if (closeBtn) {

            closeBtn.addEventListener(

                "click",

                removeSubmittedUserModal

            );

        }

        modal.addEventListener(

            "click",

            function(event) {

                if (

                    event.target ===

                    modal

                ) {

                    removeSubmittedUserModal();

                }

            }

        );

        modal

            .querySelectorAll(

                ".submitted-user-item"

            )

            .forEach(function(button) {

                button.addEventListener(

                    "click",

                    function() {

                        const user =

                            this.dataset.user ||

                            "";

                        if (filterUser) {

                            filterUser.value =

                                user;

                        }

                        currentPage = 1;

                        applyFilter();

                        removeSubmittedUserModal();

                    }

                );

            });

    }

    // ==========================================================

    // REMOVE USER MODAL

    // ==========================================================

    function removeSubmittedUserModal() {

        const modal =

            document.getElementById(

                "submittedUsersModal"

            );

        if (modal) {

            modal.remove();

        }

    }

    // ==========================================================

    // MENU

    // ==========================================================

    function openMenu() {

        if (sideMenu) {

            sideMenu.classList.add("open");

        }

        if (sideMenuOverlay) {

            sideMenuOverlay.classList.add("open");

        }

    }

    function closeMenu() {

        if (sideMenu) {

            sideMenu.classList.remove("open");

        }

        if (sideMenuOverlay) {

            sideMenuOverlay.classList.remove("open");

        }

    }

    // ==========================================================

    // EXPORT EXCEL

    // ==========================================================

    function exportExcel() {

        if (

            !filteredData ||

            filteredData.length === 0

        ) {

            alert(

                "⚠️ Không có dữ liệu để xuất."

            );

            return;

        }

        if (!window.XLSX) {

            alert(

                "❌ Chưa tải thư viện Excel XLSX."

            );

            return;

        }

        const exportData =

            filteredData.map(function(row, index) {

                return {

                    "STT":

                        index + 1,

                    "Cán bộ":

                        row?.user_name || "",

                    "Ngày field":

                        formatDate(

                            row?.field_date

                        ),

                    "Số CIF":

                        row?.cif || "",

                    "Tên khách hàng":

                        row?.customer_name || "",

                    "Kết quả":

                        row?.result || "",

                    "Kết nối":

                        row?.connection || "",

                    "Kết quả chi tiết":

                        row?.detail || "",

                    "Dự thu":

                        parseNumber(

                            row?.expected_amount

                        ),

                    "Hướng tác động tiếp theo":

                        row?.next_action || ""

                };

            });

        const worksheet =

            XLSX.utils.json_to_sheet(

                exportData

            );

        const workbook =

            XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(

            workbook,

            worksheet,

            "BaoCaoNgay"

        );

        const today =

            getTodayVietnam();

        XLSX.writeFile(

            workbook,

            `BaoCaoNgay_${today}.xlsx`

        );

    }

    // ==========================================================

    // PARSE NUMBER

    // ==========================================================

    function parseNumber(value) {

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

        if (!text) return 0;

        text =

            text

                .replace(

                    /₫|đ|VNĐ|VND/gi,

                    ""

                )

                .replace(

                    /\s/g,

                    ""

                );

        if (

            text.includes(".") &&

            !text.includes(",")

        ) {

            text =

                text.replace(

                    /\./g,

                    ""

                );

        } else {

            text =

                text.replace(

                    /,/g,

                    ""

                );

        }

        const number =

            Number(text);

        return isNaN(number)

            ? 0

            : number;

    }

    // ==========================================================

    // FORMAT MONEY

    // ==========================================================

    function formatMoney(value) {

        const number =

            parseNumber(value);

        return number.toLocaleString(

            "vi-VN"

        );

    }

    // ==========================================================

    // FORMAT DATE

    // ==========================================================

    function formatDate(value) {

        if (!value) return "";

        const text =

            String(value);

        const datePart =

            text.substring(0, 10);

        const parts =

            datePart.split("-");

        if (parts.length === 3) {

            return (

                parts[2] +

                "/" +

                parts[1] +

                "/" +

                parts[0]

            );

        }

        return text;

    }

    // ==========================================================

    // NORMALIZE DATE INPUT

    // ==========================================================

    function normalizeDateInput(value) {

        if (!value) return "";

        return String(value)

            .substring(0, 10);

    }

    // ==========================================================

    // ESCAPE HTML

    // ==========================================================

    function escapeHtml(value) {

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

    // ==========================================================

    // ESCAPE ATTRIBUTE

    // ==========================================================

    function escapeAttr(value) {

        return escapeHtml(value);

    }

    // ==========================================================

    // REMOVE EDIT MODAL

    // ==========================================================

    function removeEditModal() {

        const modal =

            document.getElementById(

                "managerEditModal"

            );

        if (modal) {

            modal.remove();

        }

    }

    // ==========================================================

    // AUTH STATE CHANGE

    // ==========================================================

    supabaseClient.auth.onAuthStateChange(

        function(event, session) {

            if (

                event ===

                "SIGNED_OUT"

            ) {

                currentUser = null;

                showLogin();

                return;

            }

            if (session?.user) {

                currentUser =

                    session.user;

            }

        }

    );

})();

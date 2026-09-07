// ============================================================
// MANAGER.JS
// TRANG QUẢN LÝ BÁO CÁO NGÀY
//
// ĐĂNG NHẬP:
// Email + Mật khẩu
//
// PHÂN QUYỀN:
// Supabase Authentication → Users → User Metadata
//
// Tài khoản có:
// {
//   "role": "manager"
// }
//
// hoặc:
// {
//   "role": "admin"
// }
//
// mới được vào trang quản lý.
//
// KHÔNG CẦN CHẠY SQL MỖI LẦN CẤP QUYỀN
// ============================================================
(() => {
    "use strict";
    // ========================================================
    // KIỂM TRA SUPABASE
    // ========================================================
    if (!window.supabase) {
        alert("❌ Không tìm thấy Supabase.");
        return;
    }
    if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
        alert("❌ Thiếu SUPABASE_URL hoặc SUPABASE_ANON_KEY.");
        return;
    }
    const client = window.supabase.createClient(
        window.SUPABASE_URL,
        window.SUPABASE_ANON_KEY
    );
    // ========================================================
    // BIẾN
    // ========================================================
    let currentUser = null;
    let allReports = [];
    let filteredReports = [];
    let currentPage = 1;
    const PAGE_SIZE = 10;
    // ========================================================
    // DOM
    // ========================================================
    let loginBox;
    let managerBox;
    let loginId;
    let password;
    let loginBtn;
    let loginMessage;
    let logoutBtn;
    let totalReports;
    let totalAmount;
    let filterUser;
    let filterDate;
    let filterBtn;
    let refreshBtn;
    let exportBtn;
    let showSubmittedUsersBtn;
    let submittedUserCount;
    let tableBody;
    let pagination;
    let managerMessage;
    // Menu
    let menuBtn;
    let sideMenu;
    let sideMenuOverlay;
    let sideMenuClose;
    let menuReportsBtn;
    let menuPermissionBtn;
    let menuLogoutBtn;
    // ========================================================
    // DOM READY
    // ========================================================
    document.addEventListener("DOMContentLoaded", init);
    async function init() {
        // ----------------------------------------------------
        // Lấy DOM
        // ----------------------------------------------------
        loginBox =
            document.getElementById("loginBox");
        managerBox =
            document.getElementById("managerBox");
        loginId =
            document.getElementById("loginId");
        password =
            document.getElementById("password");
        loginBtn =
            document.getElementById("loginBtn");
        loginMessage =
            document.getElementById("loginMessage");
        logoutBtn =
            document.getElementById("logoutBtn");
        totalReports =
            document.getElementById("totalReports");
        totalAmount =
            document.getElementById("totalAmount");
        filterUser =
            document.getElementById("filterUser");
        filterDate =
            document.getElementById("filterDate");
        filterBtn =
            document.getElementById("filterBtn");
        refreshBtn =
            document.getElementById("refreshBtn");
        exportBtn =
            document.getElementById("exportBtn");
        showSubmittedUsersBtn =
            document.getElementById("showSubmittedUsersBtn");
        submittedUserCount =
            document.getElementById("submittedUserCount");
        tableBody =
            document.getElementById("tableBody");
        pagination =
            document.getElementById("pagination");
        managerMessage =
            document.getElementById("managerMessage");
        // Menu
        menuBtn =
            document.getElementById("menuBtn");
        sideMenu =
            document.getElementById("sideMenu");
        sideMenuOverlay =
            document.getElementById("sideMenuOverlay");
        sideMenuClose =
            document.getElementById("sideMenuClose");
        menuReportsBtn =
            document.getElementById("menuReportsBtn");
        menuPermissionBtn =
            document.getElementById("menuPermissionBtn");
        menuLogoutBtn =
            document.getElementById("menuLogoutBtn");
        // ----------------------------------------------------
        // Sự kiện
        // ----------------------------------------------------
        if (loginBtn) {
            loginBtn.addEventListener(
                "click",
                handleLogin
            );
        }
        if (password) {
            password.addEventListener(
                "keydown",
                event => {
                    if (event.key === "Enter") {
                        handleLogin();
                    }
                }
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
                applyFilters
            );
        }
        if (refreshBtn) {
            refreshBtn.addEventListener(
                "click",
                loadReports
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
        // ----------------------------------------------------
        // Menu
        // ----------------------------------------------------
        if (menuBtn) {
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
                    loadReports();
                }
            );
        }
        if (menuPermissionBtn) {
            menuPermissionBtn.addEventListener(
                "click",
                openPermission
            );
        }
        if (menuLogoutBtn) {
            menuLogoutBtn.addEventListener(
                "click",
                logout
            );
        }
        // ----------------------------------------------------
        // Kiểm tra session hiện tại
        // ----------------------------------------------------
        const {
            data: {
                session
            }
        } = await client.auth.getSession();
        if (session?.user) {
            currentUser =
                session.user;
            const allowed =
                checkManagerPermission(
                    currentUser
                );
            if (allowed) {
                showManager();
                await loadReports();
            } else {
                await client.auth.signOut();
                showLogin();
            }
        } else {
            showLogin();
        }
    }
    // ========================================================
    // KIỂM TRA QUYỀN MANAGER
    // ========================================================
    function checkManagerPermission(user) {
        if (!user) {
            return false;
        }
        // ----------------------------------------------------
        // Lấy User Metadata
        // ----------------------------------------------------
        const metadata =
            user.user_metadata || {};
        const role =
            String(
                metadata.role || ""
            )
            .trim()
            .toLowerCase();
        // ----------------------------------------------------
        // Manager hoặc Admin được phép
        // ----------------------------------------------------
        if (
            role === "manager" ||
            role === "admin"
        ) {
            return true;
        }
        return false;
    }
    // ========================================================
    // ĐĂNG NHẬP
    // ========================================================
    async function handleLogin() {
        clearLoginMessage();
        const email =
            String(
                loginId?.value || ""
            ).trim();
        const pass =
            String(
                password?.value || ""
            );
        // ----------------------------------------------------
        // Kiểm tra email
        // ----------------------------------------------------
        if (!email) {
            showLoginError(
                "❌ Vui lòng nhập Email."
            );
            return;
        }
        // ----------------------------------------------------
        // Kiểm tra mật khẩu
        // ----------------------------------------------------
        if (!pass) {
            showLoginError(
                "❌ Vui lòng nhập mật khẩu."
            );
            return;
        }
        // ----------------------------------------------------
        // Kiểm tra định dạng email
        // ----------------------------------------------------
        if (!email.includes("@")) {
            showLoginError(
                "❌ Email không hợp lệ."
            );
            return;
        }
        // ----------------------------------------------------
        // Khóa nút
        // ----------------------------------------------------
        if (loginBtn) {
            loginBtn.disabled = true;
            loginBtn.textContent =
                "⏳ Đang đăng nhập...";
        }
        try {
            // =================================================
            // SUPABASE AUTH EMAIL + PASSWORD
            // =================================================
            const {
                data,
                error
            } =
                await client.auth.signInWithPassword({
                    email: email,
                    password: pass
                });
            // -------------------------------------------------
            // Lỗi đăng nhập
            // -------------------------------------------------
            if (error) {
                console.error(
                    "LOGIN ERROR:",
                    error
                );
                showLoginError(
                    getLoginErrorMessage(error)
                );
                return;
            }
            // -------------------------------------------------
            // Không có user
            // -------------------------------------------------
            if (!data?.user) {
                showLoginError(
                    "❌ Không xác định được tài khoản."
                );
                return;
            }
            currentUser =
                data.user;
            // -------------------------------------------------
            // Kiểm tra email đã xác nhận chưa
            // -------------------------------------------------
            if (
                !currentUser.email_confirmed_at
            ) {
                showLoginError(
                    "❌ Email chưa được xác nhận. Vui lòng kiểm tra hộp thư."
                );
                await client.auth.signOut();
                currentUser = null;
                return;
            }
            // =================================================
            // KIỂM TRA QUYỀN MANAGER
            // =================================================
            const allowed =
                checkManagerPermission(
                    currentUser
                );
            if (!allowed) {
                showLoginError(
                    "❌ Tài khoản chưa được cấp quyền quản lý."
                );
                await client.auth.signOut();
                currentUser = null;
                return;
            }
            // -------------------------------------------------
            // Đăng nhập thành công
            // -------------------------------------------------
            showLogin();
            await new Promise(
                resolve =>
                    setTimeout(
                        resolve,
                        200
                    )
            );
            showManager();
            await loadReports();
        } catch (error) {
            console.error(
                "LOGIN EXCEPTION:",
                error
            );
            showLoginError(
                "❌ Có lỗi xảy ra khi đăng nhập."
            );
        } finally {
            if (loginBtn) {
                loginBtn.disabled = false;
                loginBtn.textContent =
                    "Đăng nhập";
            }
        }
    }
    // ========================================================
    // HIỂN THỊ LỖI LOGIN
    // ========================================================
    function showLoginError(message) {
        if (!loginMessage) {
            return;
        }
        loginMessage.textContent =
            message;
        loginMessage.style.display =
            "block";
        loginMessage.style.color =
            "#dc2626";
    }
    function clearLoginMessage() {
        if (!loginMessage) {
            return;
        }
        loginMessage.textContent = "";
        loginMessage.style.display =
            "none";
    }
    // ========================================================
    // DỊCH LỖI SUPABASE
    // ========================================================
    function getLoginErrorMessage(error) {
        const message =
            String(
                error?.message || ""
            ).toLowerCase();
        if (
            message.includes(
                "invalid login credentials"
            )
        ) {
            return (
                "❌ Email hoặc mật khẩu không đúng."
            );
        }
        if (
            message.includes(
                "email not confirmed"
            )
        ) {
            return (
                "❌ Email chưa được xác nhận."
            );
        }
        if (
            message.includes(
                "too many requests"
            )
        ) {
            return (
                "❌ Bạn đăng nhập quá nhiều lần. Vui lòng thử lại sau."
            );
        }
        return (
            "❌ " +
            (
                error?.message ||
                "Đăng nhập thất bại."
            )
        );
    }
    // ========================================================
    // HIỂN THỊ LOGIN
    // ========================================================
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
    // ========================================================
    // HIỂN THỊ MANAGER
    // ========================================================
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
    // ========================================================
    // LOAD BÁO CÁO
    // ========================================================
    async function loadReports() {
        if (!currentUser) {
            return;
        }
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
                    "LOAD REPORT ERROR:",
                    error
                );
                showManagerMessage(
                    "❌ Không tải được dữ liệu: " +
                    error.message
                );
                return;
            }
            allReports =
                Array.isArray(data)
                    ? data
                    : [];
            filteredReports =
                [...allReports];
            currentPage = 1;
            updateStats();
            renderTable();
            updateSubmittedUserCount();
            showManagerMessage(
                `✅ Đã tải ${allReports.length} báo cáo.`
            );
        } catch (error) {
            console.error(error);
            showManagerMessage(
                "❌ Có lỗi khi tải dữ liệu."
            );
        }
    }
    // ========================================================
    // LỌC
    // ========================================================
    function applyFilters() {
        const userFilter =
            String(
                filterUser?.value || ""
            )
            .trim()
            .toLowerCase();
        const dateFilter =
            String(
                filterDate?.value || ""
            )
            .trim();
        filteredReports =
            allReports.filter(
                report => {
                    // -----------------------------------------
                    // Người báo cáo
                    // -----------------------------------------
                    let matchUser = true;
                    if (userFilter) {
                        const userName =
                            String(
                                report.user_name ||
                                report.email ||
                                report.username ||
                                ""
                            )
                            .toLowerCase();
                        matchUser =
                            userName.includes(
                                userFilter
                            );
                    }
                    // -----------------------------------------
                    // Ngày
                    // -----------------------------------------
                    let matchDate = true;
                    if (dateFilter) {
                        const reportDate =
                            String(
                                report.field_date ||
                                report.date ||
                                report.created_at ||
                                ""
                            )
                            .substring(
                                0,
                                10
                            );
                        matchDate =
                            reportDate ===
                            dateFilter;
                    }
                    return (
                        matchUser &&
                        matchDate
                    );
                }
            );
        currentPage = 1;
        updateStats();
        renderTable();
    }
    // ========================================================
    // THỐNG KÊ
    // ========================================================
    function updateStats() {
        if (totalReports) {
            totalReports.textContent =
                filteredReports.length;
        }
        let amount = 0;
        filteredReports.forEach(
            report => {
                const value =
                    report.expected_amount ??
                    report.amount ??
                    report.du_thu ??
                    0;
                const number =
                    Number(
                        String(value)
                            .replace(
                                /,/g,
                                ""
                            )
                    );
                if (
                    Number.isFinite(number)
                ) {
                    amount += number;
                }
            }
        );
        if (totalAmount) {
            totalAmount.textContent =
                formatMoney(amount);
        }
    }
    // ========================================================
    // RENDER TABLE
    // ========================================================
    function renderTable() {
        if (!tableBody) {
            return;
        }
        const totalPages =
            Math.max(
                1,
                Math.ceil(
                    filteredReports.length /
                    PAGE_SIZE
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
            (
                currentPage -
                1
            ) *
            PAGE_SIZE;
        const end =
            start +
            PAGE_SIZE;
        const pageReports =
            filteredReports.slice(
                start,
                end
            );
        tableBody.innerHTML = "";
        if (!pageReports.length) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="20"
                        style="text-align:center;padding:25px;">
                        Không có dữ liệu
                    </td>
                </tr>
            `;
            renderPagination(
                totalPages
            );
            return;
        }
        pageReports.forEach(
            report => {
                const tr =
                    document.createElement(
                        "tr"
                    );
                const fieldDate =
                    report.field_date ||
                    report.date ||
                    "";
                const amount =
                    report.expected_amount ??
                    report.amount ??
                    report.du_thu ??
                    0;
                tr.innerHTML = `
                    <td>
                        ${escapeHtml(
                            report.user_name ||
                            report.email ||
                            report.username ||
                            ""
                        )}
                    </td>
                    <td>
                        ${escapeHtml(
                            formatDate(fieldDate)
                        )}
                    </td>
                    <td>
                        ${escapeHtml(
                            report.cif ||
                            ""
                        )}
                    </td>
                    <td>
                        ${escapeHtml(
                            report.customer_name ||
                            ""
                        )}
                    </td>
                    <td>
                        ${escapeHtml(
                            report.result ||
                            ""
                        )}
                    </td>
                    <td>
                        ${escapeHtml(
                            report.connection ||
                            ""
                        )}
                    </td>
                    <td>
                        ${escapeHtml(
                            report.detail ||
                            ""
                        )}
                    </td>
                    <td>
                        ${escapeHtml(
                            formatMoney(amount)
                        )}
                    </td>
                    <td>
                        ${escapeHtml(
                            report.next_action ||
                            ""
                        )}
                    </td>
                    <td>
                        <button
                            type="button"
                            onclick="managerEditReport('${report.id}')">
                            ✏️
                        </button>
                        <button
                            type="button"
                            onclick="managerDeleteReport('${report.id}')">
                            🗑️
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
    // ========================================================
    // PHÂN TRANG
    // ========================================================
    function renderPagination(
        totalPages
    ) {
        if (!pagination) {
            return;
        }
        pagination.innerHTML = "";
        if (totalPages <= 1) {
            return;
        }
        const prev =
            document.createElement(
                "button"
            );
        prev.textContent =
            "‹ Trước";
        prev.disabled =
            currentPage <= 1;
        prev.onclick =
            () => {
                if (
                    currentPage > 1
                ) {
                    currentPage--;
                    renderTable();
                }
            };
        pagination.appendChild(
            prev
        );
        for (
            let page = 1;
            page <= totalPages;
            page++
        ) {
            const btn =
                document.createElement(
                    "button"
                );
            btn.textContent =
                page;
            if (
                page === currentPage
            ) {
                btn.disabled = true;
            }
            btn.onclick =
                () => {
                    currentPage =
                        page;
                    renderTable();
                };
            pagination.appendChild(
                btn
            );
        }
        const next =
            document.createElement(
                "button"
            );
        next.textContent =
            "Sau ›";
        next.disabled =
            currentPage >=
            totalPages;
        next.onclick =
            () => {
                if (
                    currentPage <
                    totalPages
                ) {
                    currentPage++;
                    renderTable();
                }
            };
        pagination.appendChild(
            next
        );
    }
    // ========================================================
    // SỬA BÁO CÁO
    // ========================================================
    async function editReport(id) {
        const report =
            allReports.find(
                item =>
                    String(item.id) ===
                    String(id)
            );
        if (!report) {
            alert(
                "❌ Không tìm thấy báo cáo."
            );
            return;
        }
        const oldAmount =
            report.expected_amount ??
            report.amount ??
            report.du_thu ??
            "";
        const newAmount =
            prompt(
                "Nhập số tiền dự thu mới:",
                oldAmount
            );
        if (
            newAmount === null
        ) {
            return;
        }
        const amount =
            Number(
                String(newAmount)
                    .replace(
                        /,/g,
                        ""
                    )
                    .trim()
            );
        if (
            !Number.isFinite(amount)
        ) {
            alert(
                "❌ Số tiền không hợp lệ."
            );
            return;
        }
        try {
            const {
                error
            } =
                await client
                    .from("bao_cao_ngay")
                    .update({
                        expected_amount:
                            amount
                    })
                    .eq(
                        "id",
                        id
                    );
            if (error) {
                console.error(
                    error
                );
                alert(
                    "❌ Không thể sửa báo cáo:\n" +
                    error.message
                );
                return;
            }
            alert(
                "✅ Đã cập nhật báo cáo."
            );
            await loadReports();
        } catch (error) {
            console.error(
                error
            );
            alert(
                "❌ Có lỗi khi cập nhật."
            );
        }
    }
    // ========================================================
    // XÓA BÁO CÁO
    // ========================================================
    async function deleteReport(id) {
        const ok =
            confirm(
                "Bạn có chắc muốn xóa báo cáo này không?"
            );
        if (!ok) {
            return;
        }
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
                alert(
                    "❌ Không thể xóa:\n" +
                    error.message
                );
                return;
            }
            alert(
                "✅ Đã xóa báo cáo."
            );
            await loadReports();
        } catch (error) {
            console.error(
                error
            );
            alert(
                "❌ Có lỗi khi xóa báo cáo."
            );
        }
    }
    // ========================================================
    // XUẤT EXCEL
    // ========================================================
    function exportExcel() {
        if (
            typeof XLSX ===
            "undefined"
        ) {
            alert(
                "❌ Chưa tải thư viện Excel."
            );
            return;
        }
        if (
            !filteredReports.length
        ) {
            alert(
                "⚠️ Không có dữ liệu để xuất."
            );
            return;
        }
        const rows =
            filteredReports.map(
                report => ({
                    "Người báo cáo":
                        report.user_name ||
                        report.email ||
                        report.username ||
                        "",
                    "Ngày":
                        report.field_date ||
                        report.date ||
                        "",
                    "CIF":
                        report.cif ||
                        "",
                    "Tên khách hàng":
                        report.customer_name ||
                        "",
                    "Kết quả":
                        report.result ||
                        "",
                    "Quan hệ":
                        report.connection ||
                        "",
                    "Chi tiết":
                        report.detail ||
                        "",
                    "Dự thu":
                        report.expected_amount ??
                        report.amount ??
                        report.du_thu ??
                        0,
                    "Hành động tiếp theo":
                        report.next_action ||
                        ""
                })
            );
        const worksheet =
            XLSX.utils.json_to_sheet(
                rows
            );
        const workbook =
            XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(
            workbook,
            worksheet,
            "BaoCao"
        );
        const now =
            new Date();
        const date =
            now
                .toISOString()
                .substring(
                    0,
                    10
                );
        XLSX.writeFile(
            workbook,
            `BaoCaoNgay_${date}.xlsx`
        );
    }
    // ========================================================
    // ĐẾM USER ĐÃ GỬI BÁO CÁO
    // ========================================================
    function updateSubmittedUserCount() {
        if (
            !submittedUserCount
        ) {
            return;
        }
        const users =
            new Set();
        allReports.forEach(
            report => {
                const name =
                    report.user_name ||
                    report.email ||
                    report.username;
                if (name) {
                    users.add(
                        String(name)
                            .trim()
                    );
                }
            }
        );
        submittedUserCount.textContent =
            users.size;
    }
    // ========================================================
    // HIỂN THỊ USER ĐÃ GỬI BÁO CÁO
    // ========================================================
    function showSubmittedUsers() {
        const users =
            new Map();
        allReports.forEach(
            report => {
                const name =
                    report.user_name ||
                    report.email ||
                    report.username ||
                    "Không xác định";
                const key =
                    String(name)
                        .trim();
                if (
                    !users.has(key)
                ) {
                    users.set(
                        key,
                        0
                    );
                }
                users.set(
                    key,
                    users.get(key) + 1
                );
            }
        );
        const list =
            Array.from(
                users.entries()
            )
            .sort(
                (a, b) =>
                    b[1] - a[1]
            );
        if (!list.length) {
            alert(
                "Chưa có cán bộ nào gửi báo cáo."
            );
            return;
        }
        let message =
            "👥 CÁN BỘ ĐÃ GỬI BÁO CÁO\n\n";
        list.forEach(
            ([name, count], index) => {
                message +=
                    `${index + 1}. ${name} — ${count} báo cáo\n`;
            }
        );
        alert(
            message
        );
    }
    // ========================================================
    // MENU
    // ========================================================
    function openMenu() {
        if (sideMenu) {
            sideMenu.classList.add(
                "active"
            );
        }
        if (sideMenuOverlay) {
            sideMenuOverlay.classList.add(
                "active"
            );
        }
    }
    function closeMenu() {
        if (sideMenu) {
            sideMenu.classList.remove(
                "active"
            );
        }
        if (sideMenuOverlay) {
            sideMenuOverlay.classList.remove(
                "active"
            );
        }
    }
    // ========================================================
    // THÔNG TIN PHÂN QUYỀN
    // ========================================================
    function openPermission() {
        closeMenu();
        alert(
`🔐 CẤP QUYỀN QUẢN LÝ
Vào:
Supabase
→ Authentication
→ Users
→ Chọn tài khoản cần cấp quyền
→ User Metadata
Nhập:
{
  "role": "manager"
}
Sau đó lưu lại.
Tài khoản đó sẽ được phép đăng nhập trang quản lý.
Tài khoản không có role manager/admin
sẽ không được vào trang quản lý.
Không cần chạy SQL mỗi lần cấp quyền.`
        );
    }
    // ========================================================
    // ĐĂNG XUẤT
    // ========================================================
    async function logout() {
        try {
            await client.auth.signOut();
        } catch (error) {
            console.error(
                error
            );
        } finally {
            currentUser = null;
            allReports = [];
            filteredReports = [];
            showLogin();
            closeMenu();
            if (loginId) {
                loginId.value = "";
            }
            if (password) {
                password.value = "";
            }
            clearLoginMessage();
            if (tableBody) {
                tableBody.innerHTML = "";
            }
        }
    }
    // ========================================================
    // MESSAGE MANAGER
    // ========================================================
    function showManagerMessage(
        message
    ) {
        if (!managerMessage) {
            return;
        }
        managerMessage.textContent =
            message;
    }
    // ========================================================
    // FORMAT TIỀN
    // ========================================================
    function formatMoney(
        value
    ) {
        const number =
            Number(value) || 0;
        return number.toLocaleString(
            "vi-VN"
        ) + " đ";
    }
    // ========================================================
    // FORMAT DATE
    // ========================================================
    function formatDate(
        value
    ) {
        if (!value) {
            return "";
        }
        const text =
            String(value);
        if (
            /^\d{4}-\d{2}-\d{2}/.test(
                text
            )
        ) {
            const parts =
                text.substring(
                    0,
                    10
                )
                .split("-");
            if (
                parts.length === 3
            ) {
                return (
                    parts[2] +
                    "/" +
                    parts[1] +
                    "/" +
                    parts[0]
                );
            }
        }
        return text;
    }
    // ========================================================
    // ESCAPE HTML
    // ========================================================
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
    // ========================================================
    // GLOBAL FUNCTIONS
    // ========================================================
    window.managerEditReport =
        editReport;
    window.managerDeleteReport =
        deleteReport;
    window.managerGoPage =
        page => {
            currentPage =
                Number(page) || 1;
            renderTable();
        };
})();

// =====================================================
// BÁO CÁO NGÀY - MANAGER.JS
// PHÂN QUYỀN + QUẢN LÝ BÁO CÁO
// =====================================================

const client = window.supabase.createClient(
    window.SUPABASE_URL,
    window.SUPABASE_ANON_KEY
);

// =====================================================
// BIẾN
// =====================================================

let currentUser = null;
let reports = [];
let filteredReports = [];

let currentPage = 1;
const pageSize = 20;

let editingReportId = null;


// =====================================================
// ELEMENT
// =====================================================

const loginBox =
    document.getElementById("loginBox");

const managerBox =
    document.getElementById("managerBox");

const loginId =
    document.getElementById("loginId");

const password =
    document.getElementById("password");

const loginBtn =
    document.getElementById("loginBtn");

const loginMessage =
    document.getElementById("loginMessage");

const managerMessage =
    document.getElementById("managerMessage");

const logoutBtn =
    document.getElementById("logoutBtn");

const totalReports =
    document.getElementById("totalReports");

const totalAmount =
    document.getElementById("totalAmount");

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

const pagination =
    document.getElementById("pagination");


// =====================================================
// MENU
// =====================================================

const menuBtn =
    document.getElementById("menuBtn");

const sideMenuOverlay =
    document.getElementById("sideMenuOverlay");

const sideMenu =
    document.getElementById("sideMenu");

const sideMenuClose =
    document.getElementById("sideMenuClose");

const menuReportsBtn =
    document.getElementById("menuReportsBtn");

const menuPermissionBtn =
    document.getElementById("menuPermissionBtn");

const menuLogoutBtn =
    document.getElementById("menuLogoutBtn");


// =====================================================
// KHỞI ĐỘNG
// =====================================================

document.addEventListener("DOMContentLoaded", async () => {

    if (loginBtn) {
        loginBtn.addEventListener("click", login);
    }

    if (logoutBtn) {
        logoutBtn.addEventListener("click", logout);
    }

    if (filterBtn) {
        filterBtn.addEventListener("click", applyFilter);
    }

    if (refreshBtn) {
        refreshBtn.addEventListener("click", loadReports);
    }

    if (exportBtn) {
        exportExcel();
    }

    if (showSubmittedUsersBtn) {
        showSubmittedUsersBtn.addEventListener(
            "click",
            showSubmittedUsers
        );
    }

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
                showManagerPage();
            }
        );
    }

    if (menuPermissionBtn) {
        menuPermissionBtn.addEventListener(
            "click",
            () => {
                closeMenu();
                openPermissionModal();
            }
        );
    }

    if (menuLogoutBtn) {
        menuLogoutBtn.addEventListener(
            "click",
            logout
        );
    }

    // Enter để đăng nhập
    if (password) {
        password.addEventListener(
            "keydown",
            e => {
                if (e.key === "Enter") {
                    login();
                }
            }
        );
    }

    await checkSession();
});


// =====================================================
// SESSION
// =====================================================

async function checkSession() {

    const {
        data,
        error
    } = await client.auth.getSession();

    if (error) {
        showLogin();
        return;
    }

    if (
        data &&
        data.session &&
        data.session.user
    ) {

        const allowed =
            await checkManagerPermission();

        if (allowed) {
            currentUser =
                data.session.user;

            showManager();

            await loadReports();

        } else {

            await client.auth.signOut();

            showLogin();

            showLoginMessage(
                "❌ Tài khoản chưa được cấp quyền quản lý."
            );
        }

    } else {

        showLogin();
    }
}


// =====================================================
// KIỂM TRA QUYỀN MANAGER
// =====================================================
// KHÔNG query trực tiếp manager_permissions
// vì bảng đang bật RLS.
// Dùng RPC is_manager().
// =====================================================

async function checkManagerPermission() {

    try {

        const {
            data,
            error
        } = await client.rpc(
            "is_manager"
        );

        if (error) {

            console.error(
                "is_manager error:",
                error
            );

            return false;
        }

        return data === true;

    } catch (err) {

        console.error(err);

        return false;
    }
}


// =====================================================
// LOGIN
// =====================================================

async function login() {

    const identifier =
        loginId.value.trim();

    const pwd =
        password.value;

    if (!identifier) {

        showLoginMessage(
            "⚠️ Vui lòng nhập User hoặc Email."
        );

        return;
    }

    if (!pwd) {

        showLoginMessage(
            "⚠️ Vui lòng nhập mật khẩu."
        );

        return;
    }

    setLoginLoading(true);

    try {

        let email = identifier;

        // ---------------------------------------------
        // Nếu nhập USER thì tìm email Auth qua Edge
        // ---------------------------------------------

        if (!identifier.includes("@")) {

            const result =
                await callPermissionFunction(
                    "resolve",
                    {
                        identifier: identifier
                    },
                    false
                );

            if (
                !result ||
                !result.auth_email
            ) {

                throw new Error(
                    "Không tìm thấy User hoặc tài khoản chưa được cấp quyền."
                );
            }

            email =
                result.auth_email;
        }

        // ---------------------------------------------
        // Đăng nhập Supabase Auth
        // ---------------------------------------------

        const {
            data,
            error
        } = await client.auth.signInWithPassword({

            email: email,

            password: pwd
        });

        if (error) {
            throw error;
        }

        if (
            !data ||
            !data.user
        ) {

            throw new Error(
                "Không lấy được thông tin tài khoản."
            );
        }

        // ---------------------------------------------
        // Kiểm tra quyền
        // ---------------------------------------------

        const allowed =
            await checkManagerPermission();

        if (!allowed) {

            await client.auth.signOut();

            throw new Error(
                "Tài khoản chưa được cấp quyền quản lý."
            );
        }

        currentUser =
            data.user;

        showManager();

        clearLoginMessage();

        await loadReports();

    } catch (err) {

        console.error(
            "LOGIN ERROR:",
            err
        );

        showLoginMessage(
            "❌ " +
            getErrorMessage(err)
        );

    } finally {

        setLoginLoading(false);
    }
}


// =====================================================
// LOGOUT
// =====================================================

async function logout() {

    await client.auth.signOut();

    currentUser = null;

    reports = [];
    filteredReports = [];

    closeMenu();

    showLogin();
}


// =====================================================
// GIAO DIỆN
// =====================================================

function showLogin() {

    if (loginBox) {
        loginBox.style.display = "block";
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
        managerBox.style.display = "block";
    }

    if (menuBtn) {
        menuBtn.style.display = "flex";
    }
}


function showManagerPage() {

    if (managerBox) {
        managerBox.style.display = "block";
    }

    if (menuBtn) {
        menuBtn.style.display = "flex";
    }
}


// =====================================================
// MENU
// =====================================================

function openMenu() {

    if (sideMenuOverlay) {
        sideMenuOverlay.classList.add("show");
    }

    if (sideMenu) {
        sideMenu.classList.add("show");
    }
}


function closeMenu() {

    if (sideMenuOverlay) {
        sideMenuOverlay.classList.remove("show");
    }

    if (sideMenu) {
        sideMenu.classList.remove("show");
    }
}


// =====================================================
// LOAD REPORTS
// =====================================================

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
            throw error;
        }

        reports =
            Array.isArray(data)
                ? data
                : [];

        filteredReports =
            [...reports];

        currentPage = 1;

        renderStats();

        renderSubmittedUserCount();

        renderTable();

        clearManagerMessage();

    } catch (err) {

        console.error(
            "LOAD REPORTS ERROR:",
            err
        );

        showManagerMessage(
            "❌ Không tải được dữ liệu: " +
            getErrorMessage(err)
        );
    }
}


// =====================================================
// STATS
// =====================================================

function renderStats() {

    if (totalReports) {

        totalReports.textContent =
            reports.length;
    }

    if (totalAmount) {

        let total = 0;

        reports.forEach(
            report => {

                total +=
                    parseMoney(
                        report.amount
                    );
            }
        );

        totalAmount.textContent =
            formatMoney(total);
    }
}


// =====================================================
// USER COUNT
// =====================================================

function renderSubmittedUserCount() {

    if (!submittedUserCount) {
        return;
    }

    const users =
        new Set();

    reports.forEach(
        r => {

            const user =
                r.username ||
                r.user_name ||
                r.email ||
                r.user_email ||
                r.user_id;

            if (user) {
                users.add(user);
            }
        }
    );

    submittedUserCount.textContent =
        users.size;
}


// =====================================================
// FILTER
// =====================================================

function applyFilter() {

    const user =
        filterUser
            ? filterUser.value
                .trim()
                .toLowerCase()
            : "";

    const date =
        filterDate
            ? filterDate.value
            : "";

    filteredReports =
        reports.filter(
            report => {

                let okUser = true;
                let okDate = true;

                // -------------------------------------
                // USER
                // -------------------------------------

                if (user) {

                    const value = (

                        report.username ||
                        report.user_name ||
                        report.email ||
                        report.user_email ||
                        report.full_name ||
                        report.ho_ten ||
                        ""

                    )
                        .toString()
                        .toLowerCase();

                    okUser =
                        value.includes(user);
                }

                // -------------------------------------
                // DATE
                // -------------------------------------

                if (date) {

                    const reportDate =
                        getReportDate(report);

                    okDate =
                        reportDate === date;
                }

                return (
                    okUser &&
                    okDate
                );
            }
        );

    currentPage = 1;

    renderTable();
}


// =====================================================
// TABLE
// =====================================================

function renderTable() {

    if (!tableBody) {
        return;
    }

    tableBody.innerHTML = "";

    if (
        !filteredReports ||
        filteredReports.length === 0
    ) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="99"
                    style="text-align:center;padding:30px">
                    Không có dữ liệu
                </td>
            </tr>
        `;

        renderPagination();

        return;
    }

    const start =
        (currentPage - 1) *
        pageSize;

    const end =
        start + pageSize;

    const pageData =
        filteredReports.slice(
            start,
            end
        );

    pageData.forEach(
        (report, index) => {

            const tr =
                document.createElement("tr");

            const realIndex =
                start + index + 1;

            tr.innerHTML = `
                <td>${realIndex}</td>

                <td>
                    ${escapeHtml(
                        getUserName(report)
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        getReportDate(report)
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        getField(
                            report,
                            [
                                "customer_name",
                                "khach_hang",
                                "ho_ten",
                                "name"
                            ]
                        )
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        getField(
                            report,
                            [
                                "content",
                                "noi_dung",
                                "note",
                                "ghi_chu"
                            ]
                        )
                    )}
                </td>

                <td>
                    ${formatMoney(
                        parseMoney(
                            report.amount
                        )
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        getField(
                            report,
                            [
                                "time",
                                "gio",
                                "created_time"
                            ]
                        )
                    )}
                </td>

                <td>
                    <button
                        class="manager-edit-btn"
                        onclick="editReport('${report.id}')">
                        ✏️ Sửa
                    </button>

                    <button
                        class="manager-delete-btn"
                        onclick="deleteReport('${report.id}')">
                        🗑️ Xóa
                    </button>
                </td>
            `;

            tableBody.appendChild(tr);
        }
    );

    renderPagination();
}


// =====================================================
// PAGINATION
// =====================================================

function renderPagination() {

    if (!pagination) {
        return;
    }

    pagination.innerHTML = "";

    const totalPages =
        Math.ceil(
            filteredReports.length /
            pageSize
        );

    if (totalPages <= 1) {
        return;
    }

    const prev =
        document.createElement("button");

    prev.textContent = "‹";

    prev.disabled =
        currentPage === 1;

    prev.onclick = () => {

        if (currentPage > 1) {

            currentPage--;

            renderTable();
        }
    };

    pagination.appendChild(prev);


    for (
        let i = 1;
        i <= totalPages;
        i++
    ) {

        const btn =
            document.createElement("button");

        btn.textContent = i;

        if (i === currentPage) {
            btn.classList.add("active");
        }

        btn.onclick = () => {

            currentPage = i;

            renderTable();
        };

        pagination.appendChild(btn);
    }


    const next =
        document.createElement("button");

    next.textContent = "›";

    next.disabled =
        currentPage === totalPages;

    next.onclick = () => {

        if (
            currentPage <
            totalPages
        ) {

            currentPage++;

            renderTable();
        }
    };

    pagination.appendChild(next);
}


// =====================================================
// EDIT REPORT
// =====================================================

window.editReport = async function(id) {

    const report =
        reports.find(
            r => String(r.id) === String(id)
        );

    if (!report) {
        alert("Không tìm thấy báo cáo.");
        return;
    }

    editingReportId =
        report.id;

    openEditModal(report);
};


// =====================================================
// EDIT MODAL
// =====================================================

function openEditModal(report) {

    closeExistingEditModal();

    const modal =
        document.createElement("div");

    modal.id =
        "managerEditModal";

    modal.innerHTML = `
        <div class="manager-modal-overlay">

            <div class="manager-modal">

                <h3>✏️ Sửa báo cáo</h3>

                <label>Khách hàng</label>

                <input
                    id="editCustomerName"
                    value="${escapeAttribute(
                        getField(
                            report,
                            [
                                "customer_name",
                                "khach_hang",
                                "ho_ten",
                                "name"
                            ]
                        )
                    )}"
                >

                <label>Nội dung</label>

                <textarea
                    id="editContent"
                >${escapeHtml(
                    getField(
                        report,
                        [
                            "content",
                            "noi_dung",
                            "note",
                            "ghi_chu"
                        ]
                    )
                )}</textarea>

                <label>Số tiền</label>

                <input
                    id="editAmount"
                    inputmode="decimal"
                    value="${escapeAttribute(
                        getField(
                            report,
                            [
                                "amount",
                                "so_tien"
                            ]
                        )
                    )}"
                >

                <div class="manager-modal-actions">

                    <button
                        onclick="saveEditedReport()">
                        💾 Lưu
                    </button>

                    <button
                        onclick="closeExistingEditModal()">
                        Hủy
                    </button>

                </div>

            </div>

        </div>
    `;

    document.body.appendChild(modal);
}


window.closeExistingEditModal =
    function() {

        const modal =
            document.getElementById(
                "managerEditModal"
            );

        if (modal) {
            modal.remove();
        }

        editingReportId = null;
    };


// =====================================================
// SAVE EDIT
// =====================================================

window.saveEditedReport =
    async function() {

        if (!editingReportId) {
            return;
        }

        const customerName =
            document.getElementById(
                "editCustomerName"
            )?.value.trim();

        const content =
            document.getElementById(
                "editContent"
            )?.value.trim();

        const amountRaw =
            document.getElementById(
                "editAmount"
            )?.value;

        const amount =
            parseMoney(amountRaw);

        const oldReport =
            reports.find(
                r =>
                    String(r.id) ===
                    String(editingReportId)
            );

        if (!oldReport) {
            return;
        }

        const updateData = {};

        // ---------------------------------------------
        // Chỉ cập nhật những cột thực sự tồn tại
        // ---------------------------------------------

        setExistingField(
            updateData,
            oldReport,
            [
                "customer_name",
                "khach_hang",
                "ho_ten",
                "name"
            ],
            customerName
        );

        setExistingField(
            updateData,
            oldReport,
            [
                "content",
                "noi_dung",
                "note",
                "ghi_chu"
            ],
            content
        );

        setExistingField(
            updateData,
            oldReport,
            [
                "amount",
                "so_tien"
            ],
            amount
        );

        try {

            const {
                error
            } = await client
                .from("bao_cao_ngay")
                .update(updateData)
                .eq(
                    "id",
                    editingReportId
                );

            if (error) {
                throw error;
            }

            closeExistingEditModal();

            await loadReports();

            alert(
                "✅ Đã cập nhật báo cáo."
            );

        } catch (err) {

            console.error(err);

            alert(
                "❌ Cập nhật thất bại:\n" +
                getErrorMessage(err)
            );
        }
    };


// =====================================================
// DELETE
// =====================================================

window.deleteReport =
    async function(id) {

        const ok =
            confirm(
                "Bạn có chắc muốn xóa báo cáo này?"
            );

        if (!ok) {
            return;
        }

        try {

            const {
                error
            } = await client
                .from("bao_cao_ngay")
                .delete()
                .eq(
                    "id",
                    id
                );

            if (error) {
                throw error;
            }

            await loadReports();

            alert(
                "✅ Đã xóa báo cáo."
            );

        } catch (err) {

            console.error(err);

            alert(
                "❌ Xóa thất bại:\n" +
                getErrorMessage(err)
            );
        }
    };


// =====================================================
// XUẤT EXCEL
// =====================================================

async function exportExcel() {

    if (!exportBtn) {
        return;
    }

    exportBtn.addEventListener(
        "click",
        () => {

            if (
                !filteredReports ||
                filteredReports.length === 0
            ) {

                alert(
                    "Không có dữ liệu để xuất."
                );

                return;
            }

            const data =
                filteredReports.map(
                    (r, index) => ({

                        STT:
                            index + 1,

                        "Người báo cáo":
                            getUserName(r),

                        "Ngày":
                            getReportDate(r),

                        "Khách hàng":
                            getField(
                                r,
                                [
                                    "customer_name",
                                    "khach_hang",
                                    "ho_ten",
                                    "name"
                                ]
                            ),

                        "Nội dung":
                            getField(
                                r,
                                [
                                    "content",
                                    "noi_dung",
                                    "note",
                                    "ghi_chu"
                                ]
                            ),

                        "Số tiền":
                            parseMoney(
                                r.amount
                            ),

                        "Giờ":
                            getField(
                                r,
                                [
                                    "time",
                                    "gio",
                                    "created_time"
                                ]
                            )
                    })
                );

            const worksheet =
                XLSX.utils.json_to_sheet(
                    data
                );

            const workbook =
                XLSX.utils.book_new();

            XLSX.utils.book_append_sheet(
                workbook,
                worksheet,
                "BaoCao"
            );

            XLSX.writeFile(
                workbook,
                "Bao_Cao_Ngay.xlsx"
            );
        }
    );
}


// =====================================================
// DANH SÁCH NGƯỜI ĐÃ NỘP
// =====================================================

async function showSubmittedUsers() {

    const users =
        new Map();

    reports.forEach(
        report => {

            const userId =
                report.user_id ||
                report.username ||
                report.user_name ||
                report.email ||
                report.user_email;

            if (!userId) {
                return;
            }

            if (!users.has(userId)) {

                users.set(
                    userId,
                    {
                        user: getUserName(report),
                        count: 0
                    }
                );
            }

            users.get(userId).count++;
        }
    );

    let html = `
        <div class="submitted-users-modal">
            <div class="submitted-users-box">

                <h3>
                    👥 Người đã nộp báo cáo
                </h3>

                <div class="submitted-users-list">
    `;

    if (users.size === 0) {

        html += `
            <p>Chưa có dữ liệu.</p>
        `;

    } else {

        Array.from(
            users.values()
        ).forEach(
            item => {

                html += `
                    <div class="submitted-user-item">

                        <span>
                            ${escapeHtml(
                                item.user
                            )}
                        </span>

                        <b>
                            ${item.count}
                            báo cáo
                        </b>

                    </div>
                `;
            }
        );
    }

    html += `
                </div>

                <button
                    onclick="closeSubmittedUsersModal()">
                    Đóng
                </button>

            </div>
        </div>
    `;

    const modal =
        document.createElement("div");

    modal.id =
        "submittedUsersModal";

    modal.innerHTML =
        html;

    document.body.appendChild(modal);
}


window.closeSubmittedUsersModal =
    function() {

        const modal =
            document.getElementById(
                "submittedUsersModal"
            );

        if (modal) {
            modal.remove();
        }
    };


// =====================================================
// PHÂN QUYỀN
// =====================================================

async function openPermissionModal() {

    const allowed =
        await checkManagerPermission();

    if (!allowed) {

        alert(
            "❌ Tài khoản không có quyền."
        );

        return;
    }

    closeExistingPermissionModal();

    const modal =
        document.createElement("div");

    modal.id =
        "permissionModal";

    modal.innerHTML = `

        <div class="manager-modal-overlay">

            <div class="manager-modal permission-modal">

                <h3>
                    🔐 Phân quyền quản lý
                </h3>

                <p style="font-size:13px;color:#666">
                    Cấp quyền đăng nhập trang quản lý
                    cho User hoặc Email.
                </p>

                <label>
                    User hoặc Email
                </label>

                <input
                    id="permissionIdentifier"
                    type="text"
                    placeholder="Ví dụ: hoinv12 hoặc email@gmail.com"
                    autocomplete="off"
                >

                <label>
                    Mật khẩu
                </label>

                <input
                    id="permissionPassword"
                    type="password"
                    placeholder="Nhập mật khẩu"
                    autocomplete="new-password"
                >

                <button
                    id="grantPermissionBtn"
                    class="permission-primary-btn">
                    ➕ Cấp quyền
                </button>

                <hr>

                <h4>
                    👥 Tài khoản đã được cấp quyền
                </h4>

                <div
                    id="permissionList"
                    style="margin-top:10px">
                    Đang tải...
                </div>

                <button
                    onclick="closeExistingPermissionModal()">
                    Đóng
                </button>

            </div>

        </div>
    `;

    document.body.appendChild(modal);

    document
        .getElementById(
            "grantPermissionBtn"
        )
        .addEventListener(
            "click",
            grantPermission
        );

    await loadPermissionList();
}


window.openPermissionModal =
    openPermissionModal;


// =====================================================
// CLOSE PERMISSION
// =====================================================

window.closeExistingPermissionModal =
    function() {

        const modal =
            document.getElementById(
                "permissionModal"
            );

        if (modal) {
            modal.remove();
        }
    };


// =====================================================
// EDGE FUNCTION HELPER
// =====================================================

async function callPermissionFunction(
    action,
    payload = {},
    requireAuth = true
) {

    const url =
        `${window.SUPABASE_URL}/functions/v1/manager-permission`;

    const headers = {

        "Content-Type":
            "application/json"
    };

    if (requireAuth) {

        const {
            data
        } = await client.auth.getSession();

        const session =
            data?.session;

        if (!session) {

            throw new Error(
                "Phiên đăng nhập đã hết hạn."
            );
        }

        headers.Authorization =
            `Bearer ${session.access_token}`;
    }

    const response =
        await fetch(
            url,
            {
                method: "POST",
                headers,
                body: JSON.stringify({
                    action,
                    ...payload
                })
            }
        );

    let result = null;

    try {
        result =
            await response.json();
    } catch {
        result = {};
    }

    if (!response.ok) {

        throw new Error(
            result?.error ||
            result?.message ||
            `HTTP ${response.status}`
        );
    }

    if (result?.error) {

        throw new Error(
            result.error
        );
    }

    return result;
}


// =====================================================
// CẤP QUYỀN
// =====================================================

async function grantPermission() {

    const identifier =
        document
            .getElementById(
                "permissionIdentifier"
            )
            ?.value
            .trim();

    const pwd =
        document
            .getElementById(
                "permissionPassword"
            )
            ?.value;

    if (!identifier) {

        alert(
            "Vui lòng nhập User hoặc Email."
        );

        return;
    }

    if (!pwd) {

        alert(
            "Vui lòng nhập mật khẩu."
        );

        return;
    }

    const btn =
        document.getElementById(
            "grantPermissionBtn"
        );

    if (btn) {

        btn.disabled = true;

        btn.textContent =
            "⏳ Đang cấp quyền...";
    }

    try {

        await callPermissionFunction(
            "grant",
            {
                identifier,
                password: pwd
            },
            true
        );

        // Xóa mật khẩu khỏi ô nhập ngay
        const passwordInput =
            document.getElementById(
                "permissionPassword"
            );

        if (passwordInput) {
            passwordInput.value = "";
        }

        alert(
            "✅ Cấp quyền thành công!"
        );

        await loadPermissionList();

    } catch (err) {

        console.error(err);

        alert(
            "❌ Cấp quyền thất bại:\n" +
            getErrorMessage(err)
        );

    } finally {

        if (btn) {

            btn.disabled = false;

            btn.textContent =
                "➕ Cấp quyền";
        }
    }
}


// =====================================================
// LOAD PERMISSION LIST
// =====================================================

async function loadPermissionList() {

    const box =
        document.getElementById(
            "permissionList"
        );

    if (!box) {
        return;
    }

    box.innerHTML =
        "⏳ Đang tải...";

    try {

        const result =
            await callPermissionFunction(
                "list",
                {},
                true
            );

        const users =
            Array.isArray(
                result?.users
            )
                ? result.users
                : [];

        if (users.length === 0) {

            box.innerHTML =
                `<p>Chưa có tài khoản nào.</p>`;

            return;
        }

        box.innerHTML = "";

        users.forEach(
            user => {

                const item =
                    document.createElement(
                        "div"
                    );

                item.className =
                    "permission-user-item";

                const display =
                    user.display_identifier ||
                    user.auth_email ||
                    "Không xác định";

                const email =
                    user.auth_email || "";

                const isInternal =
                    email.endsWith(
                        "@manager.local"
                    );

                item.innerHTML = `

                    <div>

                        <strong>
                            ${escapeHtml(
                                display
                            )}
                        </strong>

                        ${
                            email &&
                            !isInternal
                                ? `
                                    <div
                                      style="font-size:12px;color:#777">
                                      ${escapeHtml(
                                          email
                                      )}
                                    </div>
                                  `
                                : ""
                        }

                        <div
                            style="font-size:12px;color:${
                                user.enabled
                                    ? "#16803c"
                                    : "#999"
                            }">

                            ${
                                user.enabled
                                    ? "● Đang hoạt động"
                                    : "● Đã thu hồi"
                            }

                        </div>

                    </div>

                    ${
                        user.enabled
                            ? `
                                <button
                                    class="permission-revoke-btn"
                                    onclick="revokePermission('${user.auth_user_id}')">
                                    🚫 Thu hồi
                                </button>
                              `
                            : `
                                <span>
                                    Đã thu hồi
                                </span>
                              `
                    }
                `;

                box.appendChild(item);
            }
        );

    } catch (err) {

        console.error(err);

        box.innerHTML = `
            <p style="color:red">
                ❌ ${escapeHtml(
                    getErrorMessage(err)
                )}
            </p>
        `;
    }
}


// =====================================================
// THU HỒI QUYỀN
// =====================================================

window.revokePermission =
    async function(authUserId) {

        if (!authUserId) {
            return;
        }

        const ok =
            confirm(
                "Bạn có chắc muốn thu hồi quyền tài khoản này?"
            );

        if (!ok) {
            return;
        }

        try {

            await callPermissionFunction(
                "revoke",
                {
                    auth_user_id:
                        authUserId
                },
                true
            );

            alert(
                "✅ Đã thu hồi quyền."
            );

            await loadPermissionList();

        } catch (err) {

            console.error(err);

            alert(
                "❌ Thu hồi thất bại:\n" +
                getErrorMessage(err)
            );
        }
    };


// =====================================================
// HELPER
// =====================================================

function getUserName(report) {

    return (
        report.username ||
        report.user_name ||
        report.full_name ||
        report.ho_ten ||
        report.email ||
        report.user_email ||
        report.user_id ||
        "Không xác định"
    );
}


function getReportDate(report) {

    const value =
        report.report_date ||
        report.date ||
        report.ngay ||
        report.created_at;

    if (!value) {
        return "";
    }

    const d =
        new Date(value);

    if (isNaN(d.getTime())) {

        return String(value)
            .substring(0, 10);
    }

    return [
        d.getFullYear(),
        String(
            d.getMonth() + 1
        ).padStart(2, "0"),
        String(
            d.getDate()
        ).padStart(2, "0")
    ].join("-");
}


function getField(
    obj,
    fields
) {

    for (
        const field of fields
    ) {

        if (
            obj[field] !== undefined &&
            obj[field] !== null
        ) {

            return String(
                obj[field]
            );
        }
    }

    return "";
}


function setExistingField(
    target,
    source,
    fields,
    value
) {

    for (
        const field of fields
    ) {

        if (
            Object.prototype.hasOwnProperty
                .call(
                    source,
                    field
                )
        ) {

            target[field] =
                value;

            return;
        }
    }
}


function parseMoney(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return 0;
    }

    if (typeof value === "number") {
        return value;
    }

    let text =
        String(value)
            .trim()
            .replace(/\s/g, "");

    // 1.000.000
    if (
        text.includes(".") &&
        !text.includes(",")
    ) {

        text =
            text.replace(
                /\./g,
                ""
            );
    }

    // 1,000,000
    if (
        text.includes(",") &&
        !text.includes(".")
    ) {

        text =
            text.replace(
                /,/g,
                ""
            );
    }

    // 1.000.000,50
    if (
        text.includes(".") &&
        text.includes(",")
    ) {

        text =
            text
                .replace(
                    /\./g,
                    ""
                )
                .replace(
                    ",",
                    "."
                );
    }

    const result =
        Number(text);

    return isNaN(result)
        ? 0
        : result;
}


function formatMoney(value) {

    return new Intl.NumberFormat(
        "vi-VN"
    ).format(
        Number(value) || 0
    );
}


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


function escapeAttribute(value) {

    return escapeHtml(value);
}


function getErrorMessage(err) {

    if (!err) {
        return "Lỗi không xác định.";
    }

    return (
        err.message ||
        err.error_description ||
        err.error ||
        String(err)
    );
}


// =====================================================
// MESSAGE
// =====================================================

function showLoginMessage(message) {

    if (loginMessage) {

        loginMessage.textContent =
            message;

        loginMessage.style.display =
            "block";
    }
}


function clearLoginMessage() {

    if (loginMessage) {

        loginMessage.textContent =
            "";

        loginMessage.style.display =
            "none";
    }
}


function showManagerMessage(message) {

    if (managerMessage) {

        managerMessage.textContent =
            message;

        managerMessage.style.display =
            "block";
    }
}


function clearManagerMessage() {

    if (managerMessage) {

        managerMessage.textContent =
            "";

        managerMessage.style.display =
            "none";
    }
}


function setLoginLoading(loading) {

    if (!loginBtn) {
        return;
    }

    loginBtn.disabled =
        loading;

    loginBtn.textContent =
        loading
            ? "⏳ Đang đăng nhập..."
            : "Đăng nhập";
}

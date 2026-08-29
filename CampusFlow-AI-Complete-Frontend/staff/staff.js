/* ============================================================
   CAMPUSFLOW AI — STAFF / FACULTY PORTAL
   staff.js

   CURRENT VERSION:
   - Frontend demo only
   - No backend required yet
   - No framework
   - Vanilla JavaScript ES6+
   - Prepared for future Node.js + MongoDB + Redis + Notion
   ============================================================ */


/* ============================================================
   1. WAIT FOR HTML TO LOAD
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {

    initializeStaffPortal();

});


/* ============================================================
   2. MAIN INITIALIZATION
   ============================================================ */

function initializeStaffPortal() {

    setupNavigation();

    setupMobileSidebar();

    setupAttendanceDemo();

    setupApplicationActions();

    setupActionQueue();

    setupNoticeEngine();

    setupAIChat();

    setupSecurityActions();

    setupQuickActions();

    setupNotifications();

    addInitialLog(
        "SYSTEM",
        "Staff portal initialized successfully.",
        "success"
    );

}


/* ============================================================
   3. NAVIGATION
   ============================================================ */

function setupNavigation() {

    const navItems =
        document.querySelectorAll(".staff-nav-item");

    const views =
        document.querySelectorAll(".staff-view");

    const pageTitle =
        document.querySelector(".staff-page-title h1");

    navItems.forEach(item => {

        item.addEventListener("click", () => {

            const target =
                item.dataset.view;

            if (!target) return;


            /* --------------------------------------------
               Remove active state
               -------------------------------------------- */

            navItems.forEach(nav => {

                nav.classList.remove("active");

            });


            /* --------------------------------------------
               Activate clicked navigation item
               -------------------------------------------- */

            item.classList.add("active");


            /* --------------------------------------------
               Hide all views
               -------------------------------------------- */

            views.forEach(view => {

                view.classList.remove("active");

            });


            /* --------------------------------------------
               Show requested view
               -------------------------------------------- */

            const selectedView =
                document.getElementById(target);

            if (selectedView) {

                selectedView.classList.add("active");

            }


            /* --------------------------------------------
               Update topbar title
               -------------------------------------------- */

            if (pageTitle) {

                pageTitle.textContent =
                    getPageTitle(target);

            }


            /* --------------------------------------------
               Close mobile sidebar
               -------------------------------------------- */

            closeMobileSidebar();

        });

    });

}


/* ============================================================
   PAGE TITLE MAPPING
   ============================================================ */

function getPageTitle(viewName) {

    const titles = {

        dashboard:
            "Faculty Dashboard",

        attendance:
            "AI Attendance",

        students:
            "Student Directory",

        risk:
            "Performance Risk Radar",

        applications:
            "Application Tracking",

        notices:
            "Smart Notice Engine",

        queue:
            "Notion Action Queue",

        assistant:
            "CampusFlow AI Assistant",

        security:
            "Security & Audit",

        profile:
            "Faculty Profile"

    };

    return titles[viewName] || "Faculty Dashboard";

}


/* ============================================================
   4. MOBILE SIDEBAR
   ============================================================ */

function setupMobileSidebar() {

    const menuButton =
        document.querySelector(".mobile-menu-button");

    const sidebar =
        document.querySelector(".staff-sidebar");

    const backdrop =
        document.querySelector(".sidebar-backdrop");


    if (!menuButton || !sidebar) return;


    menuButton.addEventListener("click", () => {

        sidebar.classList.toggle("open");

        if (backdrop) {

            backdrop.classList.toggle("active");

        }

    });


    if (backdrop) {

        backdrop.addEventListener("click", () => {

            closeMobileSidebar();

        });

    }

}


function closeMobileSidebar() {

    const sidebar =
        document.querySelector(".staff-sidebar");

    const backdrop =
        document.querySelector(".sidebar-backdrop");


    if (sidebar) {

        sidebar.classList.remove("open");

    }


    if (backdrop) {

        backdrop.classList.remove("active");

    }

}


/* ============================================================
   5. ATTENDANCE DEMO
   ============================================================ */

function setupAttendanceDemo() {

    const startButton =
        document.querySelector("#startAttendance");

    const stopButton =
        document.querySelector("#stopAttendance");

    const scanOverlay =
        document.querySelector(".scan-overlay");

    const cameraStatus =
        document.querySelector("#cameraStatus");

    const scanStatus =
        document.querySelector("#scanStatus");


    if (!startButton) return;


    startButton.addEventListener("click", () => {

        /* --------------------------------------------
           Start fake AI scanning
           -------------------------------------------- */

        if (scanOverlay) {

            scanOverlay.classList.add("active");

        }


        if (cameraStatus) {

            cameraStatus.textContent =
                "AI CAMERA ACTIVE";

        }


        if (scanStatus) {

            scanStatus.textContent =
                "SCANNING";

        }


        startButton.disabled = true;

        if (stopButton) {

            stopButton.disabled = false;

        }


        addInitialLog(
            "ATTENDANCE",
            "AI facial verification started.",
            "success"
        );


        showToast(
            "Attendance Scanner",
            "AI verification is now active."
        );


        /* --------------------------------------------
           Demo result after 3 seconds
           -------------------------------------------- */

        setTimeout(() => {

            if (!scanOverlay) return;

            if (
                scanOverlay.classList.contains("active")
            ) {

                if (scanStatus) {

                    scanStatus.textContent =
                        "MATCH FOUND";

                }

                addInitialLog(
                    "FACE-AI",
                    "Student identity verified. Liveness check passed.",
                    "success"
                );

                showToast(
                    "Check-in Verified",
                    "Face matched successfully."
                );

            }

        }, 3000);

    });


    if (stopButton) {

        stopButton.addEventListener("click", () => {

            stopAttendanceScanner();

        });

    }

}


function stopAttendanceScanner() {

    const startButton =
        document.querySelector("#startAttendance");

    const stopButton =
        document.querySelector("#stopAttendance");

    const scanOverlay =
        document.querySelector(".scan-overlay");

    const cameraStatus =
        document.querySelector("#cameraStatus");

    const scanStatus =
        document.querySelector("#scanStatus");


    if (scanOverlay) {

        scanOverlay.classList.remove("active");

    }


    if (cameraStatus) {

        cameraStatus.textContent =
            "CAMERA READY";

    }


    if (scanStatus) {

        scanStatus.textContent =
            "STANDBY";

    }


    if (startButton) {

        startButton.disabled = false;

    }


    if (stopButton) {

        stopButton.disabled = true;

    }


    addInitialLog(
        "ATTENDANCE",
        "AI attendance scanner stopped.",
        "muted"
    );

}


/* ============================================================
   6. APPLICATION APPROVALS
   ============================================================ */

function setupApplicationActions() {

    const approveButtons =
        document.querySelectorAll(".approve-button");

    const rejectButtons =
        document.querySelectorAll(".reject-button");


    approveButtons.forEach(button => {

        button.addEventListener("click", () => {

            const card =
                button.closest(".application-card");

            if (!card) return;


            const badge =
                card.querySelector(".status-badge");


            if (badge) {

                badge.textContent =
                    "APPROVED";

                badge.className =
                    "status-badge approved";

            }


            button.disabled = true;


            addInitialLog(
                "APPLICATION",
                "Application approved by faculty.",
                "success"
            );


            showToast(
                "Application Approved",
                "The request has been approved."
            );

        });

    });


    rejectButtons.forEach(button => {

        button.addEventListener("click", () => {

            const card =
                button.closest(".application-card");

            if (!card) return;


            const badge =
                card.querySelector(".status-badge");


            if (badge) {

                badge.textContent =
                    "REJECTED";

                badge.className =
                    "status-badge rejected";

            }


            button.disabled = true;


            addInitialLog(
                "APPLICATION",
                "Application rejected by faculty.",
                "warning"
            );


            showToast(
                "Application Rejected",
                "The request status was updated."
            );

        });

    });

}


/* ============================================================
   7. NOTION ACTION QUEUE
   ============================================================ */

function setupActionQueue() {

    const approveButtons =
        document.querySelectorAll(
            ".action-card-buttons .approve-button"
        );

    const rejectButtons =
        document.querySelectorAll(
            ".action-card-buttons .reject-button"
        );


    approveButtons.forEach(button => {

        button.addEventListener("click", () => {

            const card =
                button.closest(".action-card");

            if (!card) return;


            const label =
                card.querySelector(
                    ".action-card-label"
                );


            if (label) {

                label.textContent =
                    "APPROVED";

                label.style.color =
                    "var(--success)";

            }


            button.disabled = true;


            addInitialLog(
                "NOTION",
                "Action approved. Backend execution queued.",
                "success"
            );


            showToast(
                "Action Approved",
                "Action moved to execution queue."
            );

        });

    });


    rejectButtons.forEach(button => {

        button.addEventListener("click", () => {

            const card =
                button.closest(".action-card");

            if (!card) return;


            const label =
                card.querySelector(
                    ".action-card-label"
                );


            if (label) {

                label.textContent =
                    "REJECTED";

                label.style.color =
                    "var(--danger)";

            }


            button.disabled = true;


            addInitialLog(
                "NOTION",
                "Action rejected by human approver.",
                "warning"
            );


            showToast(
                "Action Rejected",
                "The AI recommendation was rejected."
            );

        });

    });

}


/* ============================================================
   8. SMART NOTICE ENGINE
   ============================================================ */

function setupNoticeEngine() {

    const generateButton =
        document.querySelector("#generateNotice");

    const noticeInput =
        document.querySelector("#noticeInput");

    const noticeOutput =
        document.querySelector("#noticeOutput");


    if (!generateButton) return;


    generateButton.addEventListener("click", () => {

        const text =
            noticeInput
                ? noticeInput.value.trim()
                : "";


        if (!text) {

            showToast(
                "Notice Engine",
                "Enter some notice information first."
            );

            return;

        }


        /* --------------------------------------------
           Demo AI processing
           -------------------------------------------- */

        generateButton.disabled = true;

        generateButton.textContent =
            "Generating...";


        setTimeout(() => {

            if (noticeOutput) {

                noticeOutput.textContent =
                    generateDemoNotice(text);

            }


            generateButton.disabled = false;

            generateButton.textContent =
                "Generate AI Notice";


            addInitialLog(
                "NOTICE-AI",
                "Notice draft generated successfully.",
                "success"
            );


            showToast(
                "Notice Generated",
                "AI draft is ready for review."
            );

        }, 1200);

    });

}


function generateDemoNotice(input) {

    return (
        "CAMPUS NOTICE\n\n" +
        input +
        "\n\n" +
        "Please ensure that all concerned students " +
        "follow the instructions within the specified " +
        "timeline.\n\n" +
        "— Campus Administration"
    );

}


/* ============================================================
   9. AI ASSISTANT
   ============================================================ */

function setupAIChat() {

    const form =
        document.querySelector(".assistant-form");

    const input =
        form
            ? form.querySelector("input")
            : null;

    const messages =
        document.querySelector(".assistant-messages");

    const suggestionButtons =
        document.querySelectorAll(
            ".suggestion-chip"
        );


    /* --------------------------------------------
       Suggestion buttons
       -------------------------------------------- */

    suggestionButtons.forEach(button => {

        button.addEventListener("click", () => {

            if (!input) return;

            input.value =
                button.textContent.trim();

            input.focus();

        });

    });


    if (!form || !input || !messages) return;


    /* --------------------------------------------
       Submit assistant message
       -------------------------------------------- */

    form.addEventListener("submit", event => {

        event.preventDefault();


        const question =
            input.value.trim();


        if (!question) return;


        addAssistantMessage(
            question,
            true
        );


        input.value = "";


        /* --------------------------------------------
           Demo AI response
           -------------------------------------------- */

        setTimeout(() => {

            const response =
                generateAssistantResponse(
                    question
                );

            addAssistantMessage(
                response,
                false
            );

        }, 800);

    });

}


/* ============================================================
   ASSISTANT RESPONSE — DEMO
   ============================================================ */

function generateAssistantResponse(question) {

    const text =
        question.toLowerCase();


    if (
        text.includes("attendance")
    ) {

        return (
            "The attendance dashboard indicates " +
            "that AI verification can identify " +
            "students and perform a liveness check " +
            "before marking attendance. This is " +
            "currently a frontend demonstration."
        );

    }


    if (
        text.includes("risk") ||
        text.includes("marks")
    ) {

        return (
            "The Performance Risk Radar is designed " +
            "to combine attendance and academic " +
            "signals to highlight students who may " +
            "need faculty intervention."
        );

    }


    if (
        text.includes("application") ||
        text.includes("leave")
    ) {

        return (
            "Applications are routed through the " +
            "human approval workflow. In the full " +
            "backend, approved actions will be " +
            "synchronized with the action queue."
        );

    }


    if (
        text.includes("security")
    ) {

        return (
            "CampusFlow AI is designed around encrypted " +
            "data storage, signed requests, rate " +
            "limiting and role-based access control. " +
            "The current interface demonstrates the " +
            "security architecture rather than implementing " +
            "production cryptography."
        );

    }


    return (
        "I can help analyze attendance, academic risk, " +
        "applications, notices, action queue activity " +
        "and campus security. The current response is " +
        "a local demo response; the production AI API " +
        "will be connected during backend integration."
    );

}


/* ============================================================
   ADD ASSISTANT MESSAGE
   ============================================================ */

function addAssistantMessage(
    text,
    isUser
) {

    const messages =
        document.querySelector(
            ".assistant-messages"
        );


    if (!messages) return;


    const wrapper =
        document.createElement("div");


    wrapper.className =
        "assistant-message" +
        (isUser
            ? " user-message"
            : "");


    wrapper.innerHTML = `

        ${
            isUser
                ? ""
                : `
                    <div class="assistant-avatar">
                        AI
                    </div>
                `
        }

        <div class="assistant-bubble">

            <strong>
                ${isUser ? "You" : "CampusFlow AI"}
            </strong>

            <p></p>

        </div>

    `;


    const paragraph =
        wrapper.querySelector("p");


    /* --------------------------------------------
       textContent prevents HTML injection
       -------------------------------------------- */

    paragraph.textContent = text;


    messages.appendChild(wrapper);


    messages.scrollTop =
        messages.scrollHeight;

}


/* ============================================================
   10. SECURITY ACTIONS
   ============================================================ */

function setupSecurityActions() {

    const buttons =
        document.querySelectorAll(
            "[data-security-action]"
        );


    buttons.forEach(button => {

        button.addEventListener("click", () => {

            const action =
                button.dataset.securityAction;


            if (action === "rotate") {

                rotateDemoToken();

            }


            if (action === "audit") {

                runSecurityAudit();

            }

        });

    });

}


/* ============================================================
   DEMO TOKEN ROTATION
   ============================================================ */

function rotateDemoToken() {

    addInitialLog(
        "SECURITY",
        "Demo JWT rotation requested.",
        "success"
    );


    showToast(
        "Security",
        "Demo token rotation completed."
    );

}


/* ============================================================
   SECURITY AUDIT
   ============================================================ */

function runSecurityAudit() {

    addInitialLog(
        "SECURITY",
        "Running RBAC + rate-limit + HMAC checks...",
        "success"
    );


    setTimeout(() => {

        addInitialLog(
            "SECURITY",
            "Security audit completed. No demo violations found.",
            "success"
        );


        showToast(
            "Security Audit",
            "All demo security checks passed."
        );

    }, 900);

}


/* ============================================================
   11. QUICK ACTIONS
   ============================================================ */

function setupQuickActions() {

    const buttons =
        document.querySelectorAll(
            ".quick-action"
        );


    buttons.forEach(button => {

        button.addEventListener("click", () => {

            const target =
                button.dataset.target;


            if (!target) return;


            const navItem =
                document.querySelector(
                    `.staff-nav-item[data-view="${target}"]`
                );


            if (navItem) {

                navItem.click();

            }

        });

    });

}


/* ============================================================
   12. NOTIFICATIONS
   ============================================================ */

function setupNotifications() {

    const notificationButton =
        document.querySelector(
            ".notification-button"
        );


    if (!notificationButton) return;


    notificationButton.addEventListener(
        "click",
        () => {

            showToast(
                "Notifications",
                "3 new faculty workflow events."
            );

        }
    );

}


/* ============================================================
   13. DEMO LOG SYSTEM
   ============================================================ */

function addInitialLog(
    source,
    message,
    type = "success"
) {

    const consoleElement =
        document.querySelector(
            ".log-console"
        );


    if (!consoleElement) return;


    const line =
        document.createElement("div");


    line.className =
        "log-line";


    if (type === "warning") {

        line.classList.add("warning");

    }


    if (type === "error") {

        line.classList.add("error");

    }


    if (type === "muted") {

        line.classList.add("muted");

    }


    const timestamp =
        new Date().toLocaleTimeString();


    line.textContent =
        `[${timestamp}] [${source}] ${message}`;


    consoleElement.appendChild(line);


    consoleElement.scrollTop =
        consoleElement.scrollHeight;

}


/* ============================================================
   14. TOAST NOTIFICATION
   ============================================================ */

let toastTimeout;


function showToast(
    title,
    message
) {

    const toast =
        document.querySelector(
            ".staff-toast"
        );


    if (!toast) return;


    const toastTitle =
        toast.querySelector("strong");

    const toastMessage =
        toast.querySelector("span");


    if (toastTitle) {

        toastTitle.textContent =
            title;

    }


    if (toastMessage) {

        toastMessage.textContent =
            message;

    }


    toast.classList.add("show");


    clearTimeout(toastTimeout);


    toastTimeout =
        setTimeout(() => {

            toast.classList.remove("show");

        }, 3500);

}


/* ============================================================
   15. FUTURE AI API FUNCTION
   ============================================================

   IMPORTANT:

   This is intentionally NOT called automatically yet.

   Later, when we start backend integration, this frontend
   function will NOT contain the real OpenAI secret.

   Production architecture:

   Browser
       ↓
   Node.js Backend
       ↓
   AI Provider
       ↓
   MongoDB / Redis / Notion

   NEVER expose a production API key inside frontend JS.
   ============================================================ */


/*
async function callAI(userPrompt) {

    const API_KEY = "YOUR_API_KEY_HERE";

    const systemPrompt = `
        You are CampusFlow AI.

        Return ONLY valid JSON.

        Required structure:

        {
            "type": "string",
            "title": "string",
            "summary": "string",
            "recommendation": "string",
            "confidence": 0
        }

        Do not return markdown.
        Do not return additional text.
    `;


    try {

        const response =
            await fetch(
                "YOUR_AI_ENDPOINT_HERE",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Authorization":
                            `Bearer ${API_KEY}`
                    },

                    body: JSON.stringify({

                        messages: [

                            {
                                role: "system",
                                content: systemPrompt
                            },

                            {
                                role: "user",
                                content: userPrompt
                            }

                        ]

                    })

                }
            );


        if (!response.ok) {

            throw new Error(
                "AI API request failed."
            );

        }


        const data =
            await response.json();


        return data;

    }

    catch (error) {

        console.error(
            "AI ERROR:",
            error
        );

        return null;

    }

}
*/


/* ============================================================
   END OF STAFF.JS
   ============================================================ */
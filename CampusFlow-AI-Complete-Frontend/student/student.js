/* ============================================================
   CAMPUSFLOW AI — STUDENT PORTAL
   student.js

   DEMO VERSION

   This file handles:
   - Sidebar navigation
   - Mobile sidebar
   - Notifications
   - Attendance check-in simulation
   - Application submission
   - Opportunity filtering
   - AI assistant demo
   - Toast notifications
   - Profile interactions
   - Basic dynamic UI updates

   IMPORTANT:
   This is a frontend prototype.

   Real implementation will later connect:
   - Node.js backend
   - MongoDB Atlas
   - Redis
   - Notion API
   - Real facial recognition
   - Real AI/NLP model
   - Authentication/JWT
============================================================ */


/* ============================================================
   1. GLOBAL STATE
============================================================ */

const StudentApp = {

    currentView: "dashboard",

    student: {
        name: "Yenika Choudhary",
        id: "CF2026-1042",
        department: "Computer Science & Engineering",
        semester: "2nd Semester"
    },

    notifications: 3,

    attendance: {
        overall: 87,
        lastCheckIn: "Today, 09:02 AM"
    },

    applications: [],

    opportunities: [],

    aiMessages: [],

    isCheckingIn: false
};


/* ============================================================
   2. DOM READY
============================================================ */

document.addEventListener("DOMContentLoaded", () => {

    console.log("CampusFlow AI Student Portal initialized.");

    initializeNavigation();

    initializeMobileMenu();

    initializeNotifications();

    initializeAttendance();

    initializeApplications();

    initializeOpportunityFilters();

    initializeAI();

    initializeProfile();

    initializeDemoButtons();

    initializeStudentData();

});


/* ============================================================
   3. STUDENT DATA
============================================================ */

function initializeStudentData() {

    const studentNameElements =
        document.querySelectorAll("[data-student-name]");

    studentNameElements.forEach(element => {

        element.textContent =
            StudentApp.student.name;

    });


    const studentIdElements =
        document.querySelectorAll("[data-student-id]");

    studentIdElements.forEach(element => {

        element.textContent =
            StudentApp.student.id;

    });


    const departmentElements =
        document.querySelectorAll("[data-student-department]");

    departmentElements.forEach(element => {

        element.textContent =
            StudentApp.student.department;

    });


    const semesterElements =
        document.querySelectorAll("[data-student-semester]");

    semesterElements.forEach(element => {

        element.textContent =
            StudentApp.student.semester;

    });
}


/* ============================================================
   4. NAVIGATION
============================================================ */

/* ============================================================
   STUDENT PORTAL NAVIGATION
============================================================ */

function initializeNavigation() {

    const navItems =
        document.querySelectorAll(
            ".student-nav-item[data-view]"
        );

    const views =
        document.querySelectorAll(
            ".student-view[data-view]"
        );

    const pageTitle =
        document.querySelector("#pageTitle");


    const titles = {

        dashboard:
            "Student Dashboard",

        attendance:
            "My Attendance",

        academics:
            "Academic Performance",

        applications:
            "My Applications",

        opportunities:
            "Campus Opportunities",

        notices:
            "Notices",

        assistant:
            "AI Student Assistant",

        profile:
            "My Profile"

    };


    navItems.forEach(item => {

        item.addEventListener(
            "click",
            () => {

                const target =
                    item.dataset.view;


                /* -----------------------------
                   Update active navigation
                ----------------------------- */

                navItems.forEach(nav => {

                    nav.classList.remove(
                        "active"
                    );

                });


                item.classList.add(
                    "active"
                );


                /* -----------------------------
                   Hide every view
                ----------------------------- */

                views.forEach(view => {

                    view.classList.remove(
                        "active"
                    );

                });


                /* -----------------------------
                   Show requested view
                ----------------------------- */

                const targetView =
                    document.querySelector(
                        `.student-view[data-view="${target}"]`
                    );


                if (targetView) {

                    targetView.classList.add(
                        "active"
                    );

                }


                /* -----------------------------
                   Update topbar title
                ----------------------------- */

                if (pageTitle) {

                    pageTitle.textContent =
                        titles[target] ||
                        "Student Portal";

                }


                /* -----------------------------
                   Scroll to top
                ----------------------------- */

                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });


                console.log(
                    `Student view: ${target}`
                );

            }
        );

    });


    /* -----------------------------------------
       Dashboard AI button
    ----------------------------------------- */

    const dashboardAIButton =
        document.querySelector(
            "[data-view-target='assistant']"
        );


    if (dashboardAIButton) {

        dashboardAIButton.addEventListener(
            "click",
            () => {

                const assistantNav =
                    document.querySelector(
                        ".student-nav-item[data-view='assistant']"
                    );


                if (assistantNav) {

                    assistantNav.click();

                }

            }
        );

    }

}


/* ============================================================
   CHANGE STUDENT VIEW
============================================================ */

function switchStudentView(viewName) {

    const views =
        document.querySelectorAll(".student-view");

    const navItems =
        document.querySelectorAll(".student-nav-item");


    let targetViewFound = false;


    views.forEach(view => {

        const matches =
            view.dataset.view === viewName;

        view.classList.toggle(
            "active",
            matches
        );

        if (matches) {
            targetViewFound = true;
        }

    });


    navItems.forEach(item => {

        const matches =
            item.dataset.view === viewName;

        item.classList.toggle(
            "active",
            matches
        );

    });


    if (!targetViewFound) {

        console.warn(
            `Student view "${viewName}" not found.`
        );

        return;
    }


    StudentApp.currentView = viewName;


    /* Close mobile sidebar after navigation */

    const sidebar =
        document.querySelector(".student-sidebar");

    if (sidebar) {

        sidebar.classList.remove("open");

    }


    /* Scroll to top */

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });


    console.log(
        `Student view changed to: ${viewName}`
    );
}


/* ============================================================
   5. MOBILE SIDEBAR
============================================================ */

function initializeMobileMenu() {

    const button =
        document.querySelector(
            "#mobileMenuButton"
        );

    const sidebar =
        document.querySelector(
            "#studentSidebar"
        );


    if (!button || !sidebar) {
        return;
    }


    button.addEventListener(
        "click",
        () => {

            sidebar.classList.toggle(
                "open"
            );

        }
    );

}

/* ============================================================
   6. NOTIFICATIONS
============================================================ */

function initializeNotifications() {

    const notificationButton =
        document.querySelector(".notification-button");


    if (!notificationButton) {
        return;
    }


    notificationButton.addEventListener(
        "click",
        () => {

            showToast(
                "Notifications",
                "You have 3 new campus updates."
            );

            StudentApp.notifications = 0;

            updateNotificationBadge();

        }
    );

}


/* ============================================================
   UPDATE NOTIFICATION BADGE
============================================================ */

function updateNotificationBadge() {

    const badge =
        document.querySelector(".notification-count");


    if (!badge) {
        return;
    }


    if (StudentApp.notifications <= 0) {

        badge.style.display = "none";

        return;
    }


    badge.textContent =
        StudentApp.notifications;

}


/* ============================================================
   7. ATTENDANCE
============================================================ */

function initializeAttendance() {

    const checkInButtons =
        document.querySelectorAll(
            "[data-action='attendance-checkin']"
        );


    checkInButtons.forEach(button => {

        button.addEventListener(
            "click",
            startAttendanceCheckIn
        );

    });


    const modal =
        document.querySelector(".checkin-modal");


    const closeButton =
        modal?.querySelector(".modal-close");


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeAttendanceModal
        );

    }


    if (modal) {

        modal.addEventListener(
            "click",
            event => {

                if (
                    event.target === modal
                ) {

                    closeAttendanceModal();

                }

            }
        );

    }

}


/* ============================================================
   START FACE CHECK-IN
============================================================ */

function startAttendanceCheckIn() {

    if (StudentApp.isCheckingIn) {
        return;
    }


    const modal =
        document.querySelector(".checkin-modal");


    if (!modal) {

        showToast(
            "Attendance",
            "Camera verification interface is unavailable."
        );

        return;
    }


    StudentApp.isCheckingIn = true;


    modal.classList.remove("hidden");


    runFaceVerificationDemo();

}


/* ============================================================
   FACE VERIFICATION DEMO
============================================================ */

function runFaceVerificationDemo() {

    const status =
        document.querySelector(".camera-status");


    const steps =
        document.querySelectorAll(".checkin-step");


    if (!status) {
        return;
    }


    const verificationSteps = [

        {
            message: "Initializing secure camera...",
            delay: 900
        },

        {
            message: "Detecting face...",
            delay: 1000
        },

        {
            message: "Checking liveness...",
            delay: 1200
        },

        {
            message: "Extracting encrypted face embedding...",
            delay: 1200
        },

        {
            message: "Matching identity...",
            delay: 1000
        },

        {
            message: "Attendance verified successfully.",
            delay: 800
        }

    ];


    let index = 0;


    function runStep() {

        if (index >= verificationSteps.length) {

            finishAttendanceCheckIn();

            return;
        }


        const currentStep =
            verificationSteps[index];


        status.textContent =
            currentStep.message;


        steps.forEach((step, stepIndex) => {

            step.classList.toggle(
                "active",
                stepIndex === index
            );

        });


        index++;


        setTimeout(
            runStep,
            currentStep.delay
        );

    }


    runStep();

}


/* ============================================================
   FINISH CHECK-IN
============================================================ */

function finishAttendanceCheckIn() {

    StudentApp.isCheckingIn = false;

    StudentApp.attendance.lastCheckIn =
        "Just now";


    closeAttendanceModal();


    showToast(
        "Attendance Verified",
        "Your face was successfully verified. Attendance marked."
    );


    updateAttendanceUI();

}


/* ============================================================
   UPDATE ATTENDANCE UI
============================================================ */

function updateAttendanceUI() {

    const attendanceElements =
        document.querySelectorAll(
            "[data-attendance]"
        );


    attendanceElements.forEach(element => {

        element.textContent =
            `${StudentApp.attendance.overall}%`;

    });


    const checkInTimeElements =
        document.querySelectorAll(
            "[data-last-checkin]"
        );


    checkInTimeElements.forEach(element => {

        element.textContent =
            StudentApp.attendance.lastCheckIn;

    });

}


/* ============================================================
   CLOSE ATTENDANCE MODAL
============================================================ */

function closeAttendanceModal() {

    const modal =
        document.querySelector(".checkin-modal");


    if (!modal) {
        return;
    }


    modal.classList.add("hidden");


    StudentApp.isCheckingIn = false;

}


/* ============================================================
   8. APPLICATIONS
============================================================ */

function initializeApplications() {

    const forms =
        document.querySelectorAll(
            "[data-application-form]"
        );


    forms.forEach(form => {

        form.addEventListener(
            "submit",
            handleApplicationSubmit
        );

    });

}


/* ============================================================
   APPLICATION SUBMISSION
============================================================ */

function handleApplicationSubmit(event) {

    event.preventDefault();


    const form =
        event.currentTarget;


    const formData =
        new FormData(form);


    const application = {

        id:
            `APP-${Date.now()}`,

        type:
            formData.get("applicationType") ||
            "Campus Application",

        reason:
            formData.get("reason") ||
            "",

        status:
            "Submitted",

        submittedAt:
            new Date().toLocaleString()

    };


    StudentApp.applications.push(
        application
    );


    form.reset();


    showToast(
        "Application Submitted",
        "Your application has been securely submitted for review."
    );


    console.log(
        "Demo application:",
        application
    );


    /*
       FUTURE BACKEND:

       POST /api/applications

       The Node.js backend will eventually:

       1. Validate JWT
       2. Validate request
       3. Sign payload using HMAC
       4. Store application in MongoDB
       5. Push approval task to Notion
       6. Return application ID
    */

}


/* ============================================================
   9. OPPORTUNITY FILTERS
============================================================ */

function initializeOpportunityFilters() {

    const filterButtons =
        document.querySelectorAll(
            ".filter-chip"
        );


    const opportunityCards =
        document.querySelectorAll(
            ".opportunity-card"
        );


    filterButtons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                filterButtons.forEach(
                    item =>
                        item.classList.remove("active")
                );


                button.classList.add("active");


                const filter =
                    button.dataset.filter ||
                    "all";


                opportunityCards.forEach(card => {

                    const category =
                        card.dataset.category ||
                        "all";


                    if (
                        filter === "all" ||
                        category === filter
                    ) {

                        card.style.display = "";

                    } else {

                        card.style.display = "none";

                    }

                });

            }
        );

    });

}


/* ============================================================
   10. AI ASSISTANT
============================================================ */

function initializeAI() {

    const assistantForm =
        document.querySelector(
            "[data-ai-form]"
        );


    if (assistantForm) {

        assistantForm.addEventListener(
            "submit",
            handleAIQuestion
        );

    }


    const suggestionButtons =
        document.querySelectorAll(
            ".suggestion-chip"
        );


    suggestionButtons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const question =
                    button.dataset.question ||
                    button.textContent.trim();


                processAIQuestion(question);

            }
        );

    });

}


/* ============================================================
   AI QUESTION FORM
============================================================ */

function handleAIQuestion(event) {

    event.preventDefault();


    const input =
        event.currentTarget.querySelector(
            "input"
        );


    if (!input) {
        return;
    }


    const question =
        input.value.trim();


    if (!question) {

        showToast(
            "AI Assistant",
            "Please enter a question first."
        );

        return;
    }


    input.value = "";


    processAIQuestion(question);

}


/* ============================================================
   PROCESS AI QUESTION
============================================================ */

function processAIQuestion(question) {

    addAIMessage(
        "user",
        question
    );


    showAILoading();

    if (window.CampusFlowAPI) {
        window.CampusFlowAPI.ai(question)
            .then(result => {
                removeAILoading();
                addAIMessage(
                    "assistant",
                    result.answer || generateDemoAIResponse(question)
                );
            })
            .catch(() => finishDemoAIResponse(question));
        return;
    }

    finishDemoAIResponse(question);

}

function finishDemoAIResponse(question) {
    setTimeout(() => {
        removeAILoading();
        addAIMessage("assistant", generateDemoAIResponse(question));
    }, 900);

}


/* ============================================================
   DEMO AI RESPONSE
============================================================ */

function generateDemoAIResponse(question) {

    const text =
        question.toLowerCase();


    if (
        text.includes("attendance") ||
        text.includes("absent")
    ) {

        return `
            Your current overall attendance is
            <strong>87%</strong>.
            Your attendance is currently above the
            recommended threshold. I recommend maintaining
            consistent attendance in your core subjects.
        `;

    }


    if (
        text.includes("grade") ||
        text.includes("marks") ||
        text.includes("academic")
    ) {

        return `
            Your current academic performance is
            <strong>8.4 CGPA</strong>.
            Your strongest area is programming, while
            Mathematics should receive slightly more
            revision time before the next assessment.
        `;

    }


    if (
        text.includes("leave")
    ) {

        return `
            You can submit a leave request from the
            <strong>Applications</strong> section.
            Once submitted, the request enters the
            administrative approval workflow.
        `;

    }


    if (
        text.includes("scholarship") ||
        text.includes("opportunity")
    ) {

        return `
            I found several opportunities matching your
            academic profile. Open the
            <strong>Opportunities</strong> section to view
            scholarships, internships and campus programs.
        `;

    }


    return `
        I can help you with attendance, academics,
        applications, scholarships, campus opportunities
        and general student services.
        <br><br>
        Try asking:
        <strong>"What is my attendance?"</strong>
        or
        <strong>"How are my grades?"</strong>
    `;

}


/* ============================================================
   ADD AI MESSAGE
============================================================ */

function addAIMessage(type, message) {

    const container =
        document.querySelector(
            ".assistant-messages"
        );


    if (!container) {
        return;
    }


    const messageElement =
        document.createElement("div");


    messageElement.className =
        `assistant-message ${type}`;


    const avatar =
        type === "assistant"
            ? "AI"
            : "YOU";


    const sender =
        type === "assistant"
            ? "CampusFlow AI"
            : "You";


    messageElement.innerHTML = `

        <div class="assistant-avatar">
            ${avatar}
        </div>

        <div class="assistant-bubble">

            <strong>
                ${sender}
            </strong>

            <p>
                ${message}
            </p>

        </div>

    `;


    container.appendChild(
        messageElement
    );


    container.scrollTop =
        container.scrollHeight;


    StudentApp.aiMessages.push({
        type,
        message
    });

}


/* ============================================================
   AI LOADING INDICATOR
============================================================ */

function showAILoading() {

    const container =
        document.querySelector(
            ".assistant-messages"
        );


    if (!container) {
        return;
    }


    const loading =
        document.createElement("div");


    loading.id =
        "ai-loading";


    loading.className =
        "assistant-message";


    loading.innerHTML = `

        <div class="assistant-avatar">
            AI
        </div>

        <div class="assistant-bubble">

            <strong>
                CampusFlow AI
            </strong>

            <p>
                Analyzing your request...
            </p>

        </div>

    `;


    container.appendChild(
        loading
    );


    container.scrollTop =
        container.scrollHeight;

}


/* ============================================================
   REMOVE AI LOADING
============================================================ */

function removeAILoading() {

    const loading =
        document.querySelector(
            "#ai-loading"
        );


    if (loading) {
        loading.remove();
    }

}


/* ============================================================
   11. PROFILE
============================================================ */

function initializeProfile() {

    const editButton =
        document.querySelector(
            "[data-action='edit-profile']"
        );


    if (!editButton) {
        return;
    }


    editButton.addEventListener(
        "click",
        () => {

            showToast(
                "Profile",
                "Profile editing will be connected to the backend in the production version."
            );

        }
    );

}


/* ============================================================
   12. DEMO BUTTONS
============================================================ */

function initializeDemoButtons() {

    const buttons =
        document.querySelectorAll(
            "[data-demo-action]"
        );


    buttons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const action =
                    button.dataset.demoAction;


                handleDemoAction(action);

            }
        );

    });

}


/* ============================================================
   HANDLE DEMO ACTION
============================================================ */

function handleDemoAction(action) {

    switch (action) {

        case "apply":

            showToast(
                "Application",
                "Application workflow opened."
            );

            break;


        case "download":

            showToast(
                "Academic Report",
                "Demo report generation triggered."
            );

            break;


        case "refresh":

            showToast(
                "Data Refreshed",
                "Student dashboard data has been refreshed."
            );

            break;


        case "security":

            showToast(
                "Security Status",
                "Account security checks are currently passing."
            );

            break;


        default:

            showToast(
                "CampusFlow AI",
                "Demo action triggered."
            );

    }

}


/* ============================================================
   13. TOAST SYSTEM
============================================================ */

let toastTimer = null;


function showToast(title, message) {

    const toast =
        document.querySelector(
            ".student-toast"
        );


    if (!toast) {

        console.log(
            `[${title}] ${message}`
        );

        return;
    }


    const titleElement =
        toast.querySelector(
            "[data-toast-title]"
        );


    const messageElement =
        toast.querySelector(
            "[data-toast-message]"
        );


    if (titleElement) {

        titleElement.textContent =
            title;

    }


    if (messageElement) {

        messageElement.textContent =
            message;

    }


    toast.classList.add("show");


    clearTimeout(toastTimer);


    toastTimer =
        setTimeout(() => {

            toast.classList.remove("show");

        }, 3500);

}


/* ============================================================
   14. AI API PLACEHOLDER
============================================================ */

/*
    IMPORTANT:

    DO NOT put a real OpenAI API key inside frontend
    JavaScript in production.

    Anyone can inspect browser JavaScript.

    This function is intentionally prepared as a
    placeholder for the future backend implementation.

    Production architecture:

        Student Browser
              ↓
        Node.js Backend
              ↓
        AI/NLP Model
              ↓
        MongoDB / Redis
*/


const AI_CONFIG = {

    API_KEY: "YOUR_API_KEY_HERE",

    ENDPOINT:
        "https://api.openai.com/v1/chat/completions",

    MODEL:
        "YOUR_MODEL_HERE"

};


/* ============================================================
   FUTURE AI API FUNCTION
============================================================ */

async function callAI(question) {

    /*
       This function is NOT automatically executed.

       For the demo we use generateDemoAIResponse().

       Later, the request should go through your
       Node.js backend instead of exposing the API key.
    */


    const systemPrompt = `
        You are CampusFlow AI, an intelligent
        university student assistant.

        You help students with:

        - attendance
        - academics
        - applications
        - scholarships
        - campus opportunities
        - notices
        - student services

        Always return valid JSON.

        Required format:

        {
            "intent": "string",
            "answer": "string",
            "confidence": 0.0,
            "action": null
        }

        Never return markdown outside the JSON object.
    `;


    try {

        const response =
            await fetch(
                AI_CONFIG.ENDPOINT,
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Authorization":
                            `Bearer ${AI_CONFIG.API_KEY}`

                    },

                    body:
                        JSON.stringify({

                            model:
                                AI_CONFIG.MODEL,

                            messages: [

                                {
                                    role: "system",

                                    content:
                                        systemPrompt
                                },

                                {
                                    role: "user",

                                    content:
                                        question
                                }

                            ],

                            temperature: 0.2

                        })

                }
            );


        if (!response.ok) {

            throw new Error(
                `AI request failed: ${response.status}`
            );

        }


        const data =
            await response.json();


        const rawContent =
            data.choices?.[0]?.message?.content;


        if (!rawContent) {

            throw new Error(
                "AI returned an empty response."
            );

        }


        /*
           Strict JSON parsing.
        */

        const parsed =
            JSON.parse(rawContent);


        return parsed;

    }

    catch (error) {

        console.error(
            "AI API error:",
            error
        );


        return {

            intent: "error",

            answer:
                "The AI service is currently unavailable.",

            confidence: 0,

            action: null

        };

    }

}


/* ============================================================
   15. SECURITY DEMO
============================================================ */

function demonstrateSecurityLayer() {

    /*
       Frontend demonstration only.

       Real security must happen on the server.

       Production:

       JWT
       ↓
       RBAC Middleware
       ↓
       HMAC Verification
       ↓
       Rate Limiter
       ↓
       Controller
       ↓
       MongoDB
    */


    console.log(
        "CampusFlow AI security layer: DEMO MODE"
    );

}


/* ============================================================
   16. DEMO DATA REFRESH
============================================================ */

function refreshStudentData() {

    showToast(
        "Sync Complete",
        "Student data synchronized successfully."
    );


    console.log(
        "Demo data refreshed."
    );

}


/* ============================================================
   17. PUBLIC DEBUG OBJECT
============================================================ */

/*
   Helpful while building the project.

   Open browser console and type:

       StudentApp

   to inspect the current demo state.
*/

window.CampusFlowStudent = {

    StudentApp,

    switchStudentView,

    showToast,

    refreshStudentData,

    callAI

};


/* ============================================================
   END OF STUDENT.JS
============================================================ */
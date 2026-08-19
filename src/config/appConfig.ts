// ============================================================================
// 🚀 APP CONFIGURATION FILE
// Centralized configuration for permissions, constants, and system defaults
// ============================================================================

export const APP_CONFIG = {
  // --------------------------------------------------------------------------
  // 🌍 Countries & Currencies
  // --------------------------------------------------------------------------
  COUNTRIES: [
    {
      code: "IN",
      name: "India",
      currency: "INR",
      currencySymbol: "₹",
    },
    {
      code: "AE",
      name: "United Arab Emirates",
      currency: "AED",
      currencySymbol: "د.إ",
    },
  ],

  // --------------------------------------------------------------------------
  // 💳 Subscription Plans
  // --------------------------------------------------------------------------
  SUBSCRIPTIONS: {
    Free: {
      LABEL: "Free",
      TAGLINE: "Perfect for Startups",
      DESCRIPTION: "Core HR, Attendance, Leave & Payroll",
      CTA: "Get Started",

      LIMITS: {
        EMPLOYEES: 5,
        ORGANIZATIONS: 1,
        CLIENTS: 1,
        PROJECTS: 2,
        TASKS_PER_MONTH: 20,
        STORAGE_GB: 1,
      },
      ALLOWED_JOBS: [
        "birthday_checker",
        "monthly_accrual",
        "year_end_carry_forward",
        "carry_forward_expiry",
        "employee_xyear_completion",
      ],
      ALLOWED_EMAIL_TEMPLATES: [
        "birthday_greetings",
        "birthday_summary_hr",
        "x-year-completion",
        "x-year-summary",
        "leave_application",
        "password-reset",
        "onboarding",
        "onboarding-with-docs",
      ],
      FEATURES: {
        EMPLOYEE_LIFECYCLE: [
          "Employee Onboarding",
          "Employee Records",
          "Department Management",
          "Designation Management",
          "Employee Profile Photos",
          "Probation Tracking",
          "Confirmation Tracking",
          "Employee Transfers",
          "Employee Promotions",
          "Employee Offboarding",
           "Final Settlement",
        ],

        PROJECTS: [
          "Client Management",
          "Project Management",
          "Task Management",
          "Project Reports",
          "Employee Assignments",
          "Project Burn Reports",
          "Project Pipeline Reports",
          "Resource Allocation Reports",
                  
        ],

        ATTENDANCE: [
          "Clock In / Clock Out",
          "Attendance Tracking",
          "Attendance Corrections",
          "Late Arrival Tracking",
          "Attendance Reports",
          "Holiday Calendar",
        ],

        LEAVES: [
          "Leave Requests",
          "Leave Approvals",
          "Leave Policies",
          "Leave Balances",
          "Leave Carry Forward",
          "Leave Encashment Rules",
          "Holiday Management",
        ],

        TIMESHEETS: [
          "Timesheet Entry",
          "Daily Time Tracking",
          "Weekly Timesheets",
          "Timesheet Submission",
          "Timesheet Approval Workflow",
          "Timesheet Corrections",
          "Timesheet Reports",
        ],

        PAYROLL: [
          "Payroll Processing",
          "Payslips",
          "Salary Certificates",
          "Joining Certificates",
          "Payroll Settings",
        ],

        DOCUMENTS: [
          "Employee Documents",
          "Document Categories",
          "Document Downloads",
        ],

        SELF_SERVICE: [
          "Employee Self Service Portal",
          "Payslip Downloads",
          "Document Downloads",
          "Attendance History",
          "Leave Applications",
        ],

        OPERATIONS: [
          "Email Templates (Limited)",
          "System Job Templates (Limited)",
        ],

        NOTIFICATIONS: [
          "Birthday Notifications",
          "Work Anniversary Notifications",
          "Leave Notifications",
        ],

        REPORTING: [
          "Employee Reports",
          "Attendance Reports",
          "Leave Reports",
          "Basic Reports",
        ],
      },

      FEATURE_FLAGS: {
        EMPLOYEES: true,
        ATTENDANCE: true,
        LEAVES: true,
        TIMESHEETS: true,
        PAYROLL: true,
        DOCUMENTS: true,
        OCR: true,
        SELF_SERVICE: true,
        INVOICES: false, 

        CLIENTS: true,
        PROJECTS: true,
        TASKS: true,
        EXPENSES: false,
        AUDIT_LOGS: false,
        EMAIL_TEMPLATES: false,
        JOB_SCHEDULER: true,
        SYSTEM_MAINTENANCE: false,
        BACKUP_MANAGEMENT: false,
        COMPLIANCE: false,
        MULTI_ORGANIZATION: false,
        PRIORITY_SUPPORT: false,
      },

      COMPARISON: {
        PAYROLL: true,
        ATTENDANCE: true,
        LEAVE_MANAGEMENT: true,
        TIMESHEETS: true,
        EMPLOYEE_SELF_SERVICE: true,
        OCR_DOCUMENTS: true,
        PROJECT_MANAGEMENT: true,
        TASK_MANAGEMENT: true,
        EXPENSE_MANAGEMENT: false,
        AUDIT_LOGS: false,
        JOB_SCHEDULER: true,
        BACKUP_MANAGEMENT: false,
        COMPLIANCE: false,
        MULTI_ORGANIZATION: false,
        PRIORITY_SUPPORT: false,
      },
    },

    Growth: {
      LABEL: "Growth",
      TAGLINE: "Most Popular",
      DESCRIPTION: "Everything in Free + Workforce Operations",
      CTA: "Subscribe Now",

      INHERITS: ["Free"],

      INR: {
        MONTHLY_PRICE: 2999,
        ANNUAL_PRICE: 29999,
      },

      AED: {
        MONTHLY_PRICE: 149,
        ANNUAL_PRICE: 1490,
      },

      ALLOWED_JOBS: ["*"],
      ALLOWED_EMAIL_TEMPLATES: ["*"],

      LIMITS: {
        EMPLOYEES: 50,
        ORGANIZATIONS: 2,
        CLIENTS: 50,
        PROJECTS: 100,
        TASKS_PER_MONTH: 1000,
        STORAGE_GB: 50,
      },

      FEATURES: {
        PROJECTS: [
          "Client Management",
          "Project Management",
          "Task Management",
          "Employee Assignments",
          "Project Burn Reports",
          "Project Pipeline Reports",
          "Resource Allocation Reports",
        ],

        EXPENSES: [
          "Expense Claims",
          "Expense Categories",
          "Expense Approvals",
          "Expense Reports",
        ],

        OPERATIONS: [
          "HR Announcements",
          "Email Templates",
          "System Job Templates",
          "Audit Logs",
        ],
        COMPLIANCE: [
        "Gratuity Calculation",
        "Notice Period Management",
        "Final Settlement",
        "Compliance Alerts"
      ],

       AUTOMATION: [
        "Auto Invoice Generation",
        "Birthday Automation",
        "Clock-Out Monitoring",
        "Employee Compliance Monitoring",
        "Work Anniversary Automation",
        "Gratuity Eligibility Monitoring",
        "Monthly Leave Accrual",
        "Year-End Leave Carry Forward",
        "Carry Forward Expiry Processing"
], 
NOTIFICATIONS: [
  "Birthday Notifications",
  "Birthday Summary Notifications",
  "Leave Notifications",
  "Compliance Notifications",
  "Compliance Summary Notifications",
  "Probation Notifications",
  "Probation Summary Notifications",
  "Gratuity Eligibility Notifications",
  "Attendance Notifications",
  "Employee Onboarding Notifications",
  "Salary Increment Notifications",
  "Salary Certificate Notifications",
  "Joining Certificate Notifications",
  "Invoice Notifications",
  "Task Assignment Notifications",
  "Task Management Notifications",
  "Timesheet Submission Notifications",
  "Timesheet Status Notifications",
  "Timesheet Edit Request Notifications",
  "Timesheet Approval Notifications",
  "Timesheet Rejection Notifications",
  "Work Anniversary Notifications",
  "Work Anniversary Summary Notifications",
],

        REPORTING: [
          "Advanced Reports",
          "Payroll Reports",
          "Expense Reports",
          "Project Reports",
        ],
      },

      FEATURE_FLAGS: {
        EMPLOYEES: true,
        ATTENDANCE: true,
        LEAVES: true,
        TIMESHEETS: true,
        PAYROLL: true,
        DOCUMENTS: true,
        OCR: true,
        REPORTS: true,
        SELF_SERVICE: true,
        CLIENTS: true,
        PROJECTS: true,
        TASKS: true,
        EXPENSES: true,
        AUDIT_LOGS: false,
        EMAIL_TEMPLATES: true,
        PAYROLL_AUTOMATION: true,
        INVOICES: true, 

        JOB_SCHEDULER: true,
        SYSTEM_MAINTENANCE: true,
        BACKUP_MANAGEMENT: false,
        COMPLIANCE: true,
        MULTI_ORGANIZATION: true,
        PRIORITY_SUPPORT: false,
      },

      COMPARISON: {
        PAYROLL: true,
        ATTENDANCE: true,
        LEAVE_MANAGEMENT: true,
        TIMESHEETS: true,
        EMPLOYEE_SELF_SERVICE: true,
        OCR_DOCUMENTS: true,
        PROJECT_MANAGEMENT: true,
        TASK_MANAGEMENT: true,
        EXPENSE_MANAGEMENT: true,
        AUDIT_LOGS: true,
        JOB_SCHEDULER: false,
        BACKUP_MANAGEMENT: false,
        COMPLIANCE: false,
        MULTI_ORGANIZATION: true,
        PRIORITY_SUPPORT: false,
      },
    },

    Enterprise: {
      LABEL: "Enterprise",
      TAGLINE: "For Scaling Organizations",
      DESCRIPTION: "Everything in Growth + Enterprise Automation",
      CTA: "Subsribe Now",

      INHERITS: ["Free", "Growth"],

      INR: {
        MONTHLY_PRICE: 14000,
        ANNUAL_PRICE: 140000,
      },

      AED: {
        MONTHLY_PRICE: 699,
        ANNUAL_PRICE: 6990,
      },

      ALLOWED_JOBS: ["*"],
      ALLOWED_EMAIL_TEMPLATES: ["*"],

      LIMITS: {
        EMPLOYEES: 500,
        ORGANIZATIONS: 10,
        CLIENTS: 1000,
        PROJECTS: 3000,
        TASKS_PER_MONTH: 10000,
        STORAGE_GB: 500,
      },

      FEATURES: { 
        ENTERPRISE: [
          "Multi Organization",
          "Multi-Company Support",
          "Large Workforce Management",
          "High-Volume Document Processing",
          "Large Document Storage Capacity",
          "Priority Support",
          "Enterprise Billing",
          "Dedicated Account Manager",
          "Dedicated Onboarding Assistance",
        ],
      },

      FEATURE_FLAGS: {
        EMPLOYEES: true,
        ATTENDANCE: true,
        LEAVES: true,
        TIMESHEETS: true,
        PAYROLL: true,
        DOCUMENTS: true,
        OCR: true,
        REPORTS: true,
        SELF_SERVICE: true,

        CLIENTS: true,
        PROJECTS: true,
        TASKS: true,
        EXPENSES: true,
        AUDIT_LOGS: true,
        EMAIL_TEMPLATES: true,
        PAYROLL_AUTOMATION: true,
        INVOICES: true, 

        JOB_SCHEDULER: true,
        BACKUP_MANAGEMENT: true,
        COMPLIANCE: true,
        MULTI_ORGANIZATION: true,
        PRIORITY_SUPPORT: true,
      },

      COMPARISON: {
        PAYROLL: true,
        ATTENDANCE: true,
        LEAVE_MANAGEMENT: true,
        TIMESHEETS: true,
        EMPLOYEE_SELF_SERVICE: true,
        OCR_DOCUMENTS: true,
        PROJECT_MANAGEMENT: true,
        TASK_MANAGEMENT: true,
        EXPENSE_MANAGEMENT: true,
        AUDIT_LOGS: true,
        JOB_SCHEDULER: true,
        SYSTEM_MAINTENANCE: true,
        BACKUP_MANAGEMENT: true,
        COMPLIANCE: true,
        MULTI_ORGANIZATION: true,
        PRIORITY_SUPPORT: true,
      },
    },
  },

  ATTENDANCE_FILTER_OPTIONS_ALL: [
    /* { value: "clocked_in", label: "Clocked-In-Only" },*/
    { value: "all", label: "All" },
    { value: "absent", label: "Absent" },
    { value: "present", label: "Present" },
    /* { value: "late", label: "Late" },*/
  ],

  ENABLE_MANUAL_EDIT_PAYSLIP: false,

  // --------------------------------------------------------------------------
  // ⚙️ General Settings
  // --------------------------------------------------------------------------
  PAGE_SIZE: 10,
  DATE_FORMAT: "YYYY-MM-DD",

  // --------------------------------------------------------------------------
  // 📎 File Upload Rules (Shared for all modules)
  // --------------------------------------------------------------------------
  UPLOAD_RULES: {
    MAX_FILE_SIZE_MB: 15,
    SUPPORTED_FILE_TYPES: [".pdf", ".png", ".jpg", ".jpeg", ".bmp", ".gif"],
  },

  // --------------------------------------------------------------------------
  // 📌 Notice Period Default Values (Country Level Fallbacks)
  // --------------------------------------------------------------------------

  // --------------------------------------------------------------------------
  // 📊 Status Options
  // --------------------------------------------------------------------------
  STATUS_OPTIONS_MAIN: [
    { value: "draft", label: "Draft" },
    { value: "submitted", label: "Submitted" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
  ],

  STATUS_OPTIONS_SUB: [
    { value: "todo", label: "Todo" },
    { value: "in_progress", label: "In Progress" },
    { value: "done", label: "Done" },
    { value: "blocked", label: "Blocked" },
  ],

  // --------------------------------------------------------------------------
  // ⚖️ Final Settlement Settings
  // --------------------------------------------------------------------------
  FINAL_SETTLEMENT: {
    REASON_OPTIONS: [
      { value: "RESIGNATION_ELIGIBLE", label: "Resignation (after 1 year)" },
      { value: "RESIGNATION_PROBATION", label: "Resignation during probation" },
      { value: "TERMINATION_MISCONDUCT", label: "Termination — Misconduct" },
      { value: "TERMINATION_CAUSE", label: "Termination — For Cause" },
      { value: "TERMINATION_NO_CAUSE", label: "Termination — Without Cause" },
      { value: "CONTRACT_EXPIRY", label: "Contract End (Non-Renewal)" },
      { value: "RETIREMENT", label: "Retirement" },
      { value: "UNAVAILABLE_NO_SHOW", label: "Unavailable / No Show" },
      { value: "DISABILITY", label: "Permanent Disability" },
      { value: "MUTUAL_SEPARATION", label: "Mutual Separation Agreement" },
      { value: "PROBATION_TERMINATION", label: "Termination during probation" },
    ],
  },

  // --------------------------------------------------------------------------
  // 🔐 Permission Groups
  // --------------------------------------------------------------------------
PERMISSION_GROUPS: [
  {
    name: "organization",
    children: ["view", "update"],
  },

  {
    name: "roles",
    children: ["view", "create", "update", "delete"],
  },

  {
    name: "users",
    children: ["view", "create", "update", "delete", "assign-role"],
  },

  {
    name: "customers",
    children: ["view", "create", "update", "delete"],
  },

  {
    name: "vehicles",
    children: ["view", "create", "update", "delete"],
  },

  {
    name: "appointments",
    children: [
      "view",
      "create",
      "update",
      "delete",
      "assign",
      "reschedule",
      "cancel",
    ],
  },

  {
    name: "inspections",
    children: [
      "view",
      "create",
      "update",
      "delete",
      "assign",
      "start",
      "complete",
      "approve",
    ],
  },

  {
    name: "inspection-checklists",
    children: ["view", "create", "update", "delete"],
  },

  {
    name: "inspection-reports",
    children: [
      "view",
      "create",
      "update",
      "approve",
      "download",
      "send",
    ],
  },

  {
    name: "job-cards",
    children: [
      "view",
      "create",
      "update",
      "delete",
      "assign",
      "start",
      "complete",
      "close",
    ],
  },

  {
    name: "services",
    children: ["view", "create", "update", "delete"],
  },

  {
    name: "estimates",
    children: [
      "view",
      "create",
      "update",
      "delete",
      "approve",
      "send",
    ],
  },

  {
    name: "invoices",
    children: [
      "view",
      "create",
      "update",
      "delete",
      "issue",
      "send",
      "mark-paid",
      "void",
      "credit",
      "preview",
    ],
  },

  {
    name: "payments",
    children: ["view", "create", "update", "refund"],
  },

  {
    name: "inventory",
    children: ["view", "create", "update", "delete", "adjust-stock"],
  },

  {
    name: "parts",
    children: ["view", "create", "update", "delete"],
  },

  {
    name: "vendors",
    children: ["view", "create", "update", "delete"],
  },

  {
    name: "purchase-orders",
    children: [
      "view",
      "create",
      "update",
      "delete",
      "approve",
      "receive",
    ],
  },

  {
    name: "expenses",
    children: ["view", "create", "update", "delete", "approve"],
  },

  {
    name: "documents",
    children: ["view", "create", "update", "delete", "download"],
  },

  {
    name: "notifications",
    children: ["view", "create", "update", "delete", "send"],
  },

  {
    name: "email-templates",
    children: ["view", "create", "update", "delete", "send"],
  },

  {
    name: "reports",
    children: [
      "view",
      "appointments",
      "inspections",
      "job-cards",
      "service",
      "revenue",
      "payments",
      "expenses",
      "inventory",
    ],
  },

  {
    name: "audit-logs",
    children: ["view"],
  },

  {
    name: "settings",
    children: ["view", "update"],
  },
],
};

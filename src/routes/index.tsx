import { Routes, Route, Navigate } from "react-router-dom";

import EmployeesList from "../features/employees/EmployeesList";
import EmployeeForm from "../features/employees/EmployeeForm";
import EmployeeDetail from "../features/employees/EmployeeDetail";

// Tab components
import EmployeeGeneralTab from "../features/employees/tabs/EmployeeGeneralTab";
import EmployeePersonalTab from "../features/employees/personal/EmployeePersonalTab";
import EmployeeEmploymentTab from "../features/employees/employment/EmployeeEmploymentTab";
import EmployeeShortTermTab from "../features/employees/tabs/EmployeeShortTermTab";
import EmployeeCompensationTab from "../features/employees/tabs/EmployeeCompensationTab";
import EmployeeLeaveTab from "../features/employees/tabs/EmployeeLeaveTab";

import AttendanceList from "../features/attendance/AttendanceList";
import TimesheetList from "../features/timesheets/TimesheetList";

import ClientList from "../features/clients/ClientList";
import ClientForm from "../features/clients/ClientForm";

import ProjectList from "../features/projects/ProjectList";
import ProjectForm from "../features/projects/ProjectForm";
import SalaryCategoryList from "../features/payroll/category/SalaryCategoryList";
import SalaryCategoryForm from "../features/payroll/category/SalaryCategoryForm";
import ComponentForm from "../features/payroll/salary-component/ComponentForm";
import ClockInForm from "../features/clock-in/ClockInForm";
import ClockOutForm from "../features/clock-in/ClockOutForm";
import ProjectEmployeesList from "../features/projects/ProjectEmployeesList";
import WeeklyTimesheetForm from "../features/timesheets/employee/WeeklyTimesheetForm";
import SmartSheet from "../features/tasks/SmartSheet";
import SettingsPage from "../features/organizations/settings/SettingsPage";
import HolidayPage from "../features/organizations/settings/HolidayPage";
import LeavePolicyPage from "../features/organizations/settings/leave-policy/LeavePolicyPage";
import PayrollSettingsPage from "../features/organizations/settings/payroll/PayrollSettingsPage";
import DepartmentList from "../features/organizations/settings/departments/DepartmentList";
import DesignationList from "../features/organizations/settings/designations/DesignationList";
import EmployeeComplainceDocumentsTab from "../features/employees/documents/EmployeeComplainceDocuments";
import ResetPasswordPage from "../features/auth/ResetPasswordPage";
import TimeSheetAttendance from "../features/employees/timesheets-attendance";
import MyTaskList from "../features/tasks/MyTaskList";
import LeaveApplicationForm from "../features/employees/leave/LeaveApplicationForm";
import LeaveApprovalsPage from "../features/employees/leave/LeaveApprovalsPage";
import RoleList from "../features/organizations/settings/roles/RoleList";
import TimesheetSummaryPage from "../features/timesheets/manager/TimesheetSummaryPage";
import EmployeeDashboard from "../features/dashboard/EmployeeDashboard";
import PreferencesPage from "../features/organizations/settings/preferences/PreferencesPage";
import SystemSettingsPage from "../features/system-settings/SystemSettingsPage";
import JobsPage from "../features/system-settings/jobs/JobsPage";
import EmployeePayroll from "../features/employees/payslip/EmployeePayroll";
import ComplianceAuditList from "../features/compliance/ComplianceAuditList";
import EmployeeSelfDocuments from "../features/employees/documents/EmployeeSelfDocuments";
import SelectOrganizationPage from "../features/auth/SelectOrganizationPage";
import EmployeeAllocationReportPage from "../features/reports/EmployeeAllocationReportPage";
import ProjectBurnReportPage from "../features/reports/ProjectBurnReportPage";
import EmployeeAllocationMatrixPage from "../features/reports/EmployeeAllocationMatrixPage";
import PasswordForceResetEmail from "../features/employees/PasswordForceResetEmail";
import OnboardingDocumentsPage from "../features/employees/documents/OnboardingDocumentsPage";
import EmployeeSelfExpenses from "../features/expenses/self/EmployeeSelfExpenses";
import EmployeeExpensesManage from "../features/expenses/self/EmployeeExpensesManage";
import EmailTemplateManager from "../features/email-templates/EmailTemplateManager";
import EmployeePayslipView from "../features/employees/payslip/EmployeePayslipView";
import FinalSettlementsList from "../features/final-settlement/FinalSettlementsList";
import EmployeeLeaveDetailsPage from "../features/employees/leave/EmployeeLeaveDetailsPage";
import DashboardRouter from "../DashboardRouter";
import ProjectPortfolioReportPage from "../features/reports/ProjectPortfolioReportPage";
import AuditList from "../features/audit/AuditList";
import BackupsPage from "../features/system-settings/system-backups/BackupsPage";
import AttendanceListEmployee from "../features/attendance/AttendanceListEmployee";
import EmployeesManagedList from "../features/employees/EmployeesManagedList";
import BulkOnboardingDocumentsPage from "../features/employees/documents/BulkOnboardingDocumentsPage";
import SalaryCertificatesList from "../features/salary-certificate/SalaryCertificatesPage";
import SalaryCertificatesSelf from "../features/salary-certificate/SalaryCertificatesSelf";
import EmployeeSalaryCertificateSection from "../features/salary-certificate/EmployeeSalaryCertificateSection";
import EmployeeJoiningCertificateSection from "../features/joiningCertificates/JoiningCertificateSection";
import JoiningCertificatesList from "../features/joiningCertificates/JoiningCertificatesList";
import EmployeeViewOnlyCompensationTab from "../features/employees/tabs/EmployeeViewOnlyCompensationTab";
import EmployeeDirectoryList from "../features/employees/EmployeeDirectoryList";
import HrAnnouncementList from "../features/hr-announcements/HrAnnouncementList";
import AnnouncementsPage from "../features/hr-announcements/AnnouncementsPage";
import EmployeeSearchPage from "../features/employees/EmployeeSearchPage";
import EmployeeProfilePublic from "../features/employees/EmployeeProfilePublic";
import MyProfilePage from "../features/employees/MyProfilePage";
import LeaveBalancePage from "../features/employees/leave/LeaveBalancePage";
import PendingLeaveApprovals from "../features/employees/leave/PendingLeaveApprovals";
import EmployeesGroupList from "../features/employees/groups/EmployeesGroupList";
import InvoiceCreate from "../features/invoice/InvoiceCreate";
import InvoiceList from "../features/invoice/InvoiceList";
import ProjectEmployeeAssignment from "../features/project-employee/ProjectEmployeeAssignment";
import ContractList from "../features/client-contracts/ContractList";
import ContractCreate from "../features/client-contracts/ContractCreate";
import OrganizationAccessPage from "../features/organization-access/OrganizationAccessPage";
import MaintenancePage from "../pages/MaintenancePage";
import MaintenanceSettingsPage from "../features/system-settings/MaintenanceSettingsPage";
import MaintenanceControlPage from "../pages/MaintenanceControlPage";
import PricingPlans from "../features/plans/PricingPlans";
import BillingPage from "../features/plans/BillingPage";
import SubscriptionPage from "../features/plans/SubscriptionPage";
import EmailTemplatesPage from "../features/system-settings/email-templates/email-templates";
import EmailTemplateManagePage from "../features/system-settings/email-templates/EmailTemplateManagePage";
import OrganizationsList from "../features/super-admin/OrganizationsList";
import JobTemplatesPage from "../features/system-settings/job-templates/JobTemplatesPage";
import JobTemplateManagePage from "../features/system-settings/job-templates/JobTemplateManagePage";
import AdminChangePasswordPage from "../features/auth/AdminChangePasswordPage";
import ForgotPasswordPage from "../features/auth/ForgotPasswordPage";
 

import { drivelyRoutes } from "./DrivelyRoutes";


export default function RoutesIndex() {
  return (
    <Routes>
      {/* Start HR Routes */}
      <Route path="/" element={<DashboardRouter />} />
      <Route path="/general" element={<EmployeeGeneralTab />} />
      <Route path="/personal" element={<EmployeePersonalTab />} />
      <Route
        path="/compensation"
        element={<EmployeeViewOnlyCompensationTab />}
      />

      <Route path="/select-organization" element={<SelectOrganizationPage />} />

      <Route path="/assign-organization" element={<OrganizationAccessPage />} />

      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/change-password" element={<AdminChangePasswordPage />} />     

      <Route path="/settings" element={<SettingsPage />} />

      <Route path="/plans" element={<PricingPlans />} />
      <Route path="/payment" element={<BillingPage />} />

      <Route path="/subscription" element={<SubscriptionPage />} />

      <Route path="/payment" element={<BillingPage />} />

      <Route path="/settings/system" element={<SystemSettingsPage />} />
      <Route path="/settings/system/jobs" element={<JobsPage />} />

      <Route path="/system/settings/backups" element={<BackupsPage />} />

      <Route
        path="/settings/system/maintenance"
        element={<MaintenanceSettingsPage />}
      />
      <Route path="/mcp" element={<MaintenanceControlPage />} />
      <Route path="/plan/organizations" element={<OrganizationsList />} />

      <Route
        path="/settings/system/email-templates"
        element={<EmailTemplatesPage />}
      />
      <Route
        path="/settings/system/email-templates/manage"
        element={<EmailTemplateManagePage />}
      />
      <Route
        path="/settings/system/job-templates"
        element={<JobTemplatesPage />}
      />

      <Route
        path="/settings/system/job-templates/manage"
        element={<JobTemplateManagePage />}
      />

      <Route path="/settings/preferences" element={<PreferencesPage />} />

      <Route path="/settings/holidays" element={<HolidayPage />} />

      <Route path="/settings/leave-policies" element={<LeavePolicyPage />} />
      <Route path="/settings/payroll" element={<PayrollSettingsPage />} />
      <Route path="/settings/departments" element={<DepartmentList />} />
      <Route path="/settings/roles" element={<RoleList />} />
      <Route path="/settings/designations" element={<DesignationList />} />

      {/* Invoices */}
      <Route path="/client-contracts" element={<ContractList />} />
      <Route path="/client-contracts/create" element={<ContractCreate />} />
      <Route path="/client-contracts/:id/edit" element={<ContractCreate />} />
      <Route path="/client-contracts/create" element={<ContractCreate />} />
      <Route path="/invoices" element={<InvoiceList />} />
      <Route path="/client-resources" element={<ProjectEmployeeAssignment />} />

      {/* Employees */}
      <Route path="/employees" element={<EmployeesList />} />
      <Route path="/employees/profile" element={<MyProfilePage />} />
      <Route path="/managed-employees" element={<EmployeesManagedList />} />
      <Route path="/group-employees" element={<EmployeesGroupList />} />
      <Route path="/employees/create" element={<EmployeeForm />} />

      {/* Employee Detail with Tabs */}
      <Route path="/employees/:employeeId" element={<EmployeeDetail />}>
        <Route index element={<Navigate to="general" replace />} />
        <Route path="general" element={<EmployeeGeneralTab />} />
        <Route path="personal" element={<EmployeePersonalTab />} />
        <Route path="employment" element={<EmployeeEmploymentTab />} />
        <Route path="short-term" element={<EmployeeShortTermTab />} />
        <Route path="compensation" element={<EmployeeCompensationTab />} />
        <Route path="documents" element={<EmployeeComplainceDocumentsTab />} />
        <Route
          path="onboarding-documents"
          element={<OnboardingDocumentsPage />}
        />
        <Route path="leave" element={<EmployeeLeaveTab />} />
      </Route>

      <Route path="/employee/leave-balances" element={<LeaveBalancePage />} />
      <Route
        path="/employee/expense-tracker"
        element={<EmployeeSelfExpenses />}
      />
      <Route
        path="/employee/active-directory"
        element={<EmployeeSearchPage />}
      />
      <Route path="/hr-announcements" element={<HrAnnouncementList />} />
      <Route path="/hr-announcements-view" element={<AnnouncementsPage />} />
      <Route
        path="/directory/:employeeId"
        element={<EmployeeProfilePublic />}
      />

      <Route
        path="/employee/onboarding-all"
        element={<BulkOnboardingDocumentsPage />}
      />
      <Route
        path="/employee/expense-tracker-manage"
        element={<EmployeeExpensesManage />}
      />

      <Route
        path="/employees/:employeeId/timesheet-attendance"
        element={<TimeSheetAttendance />}
      />
      <Route
        path="/employees/:employeeId/view-leave-submission"
        element={<LeaveApprovalsPage />}
      />

      <Route path="/employees/:employeeId/edit" element={<EmployeeForm />} />

      <Route
        path="/employee/document-uploader"
        element={<EmployeeSelfDocuments />}
      />
      <Route
        path="/force-reset-password"
        element={<PasswordForceResetEmail />}
      />

      {/* Attendance */}
      <Route path="/attendance" element={<AttendanceList />} />

      <Route path="/tasks" element={<MyTaskList />} />

      {/* Timesheets */}
      <Route path="/timesheets" element={<TimesheetSummaryPage />} />

      <Route path="/leave-apply" element={<EmployeeLeaveDetailsPage />} />

      <Route
        path="/leaves/pending-approvals"
        element={<PendingLeaveApprovals />}
      />

      {/* Clients */}
      <Route path="/clients" element={<ClientList />} />
      <Route path="/clients/create" element={<ClientForm />} />
      <Route path="/clients/:id/edit" element={<ClientForm />} />

      {/* Projects */}
      <Route path="/projects" element={<ProjectList />} />
      <Route path="/projects/create" element={<ProjectForm />} />
      <Route
        path="/projects/:projectId/tasks/create"
        element={<SmartSheet />}
      />
      <Route path="/projects/:projectId/edit" element={<ProjectForm />} />

      {/* Payroll */}
      <Route
        path="/payroll/salary-categories"
        element={<SalaryCategoryList />}
      />
      <Route path="/payroll/employee-payroll" element={<EmployeePayroll />} />
      <Route path="/employee/payslips" element={<EmployeePayslipView />} />
      <Route
        path="/payroll/salary-categories/create"
        element={<SalaryCategoryForm />}
      />
      <Route
        path="/payroll/salary-categories/:categoryId/edit"
        element={<SalaryCategoryForm />}
      />
      <Route
        path="/payroll/salary-categories/:categoryId/components/create"
        element={<ComponentForm />}
      />
      <Route
        path="/payroll/salary-categories/:categoryId/components/:componentId/edit"
        element={<ComponentForm />}
      />

      <Route path="/compliance-field-alert" element={<ComplianceAuditList />} />

      <Route path="/audit-logs" element={<AuditList />} />

      <Route path="/final-settlement" element={<FinalSettlementsList />} />

      <Route
        path="/manage-salary-certificates"
        element={<SalaryCertificatesList />}
      />
      <Route
        path="/manage-joining-certificates"
        element={<JoiningCertificatesList />}
      />

      {/* End HR Routes */}

      {/* Start Employee Routes q*/}
      <Route path="/clock-in" element={<ClockInForm />} />
      <Route path="/clock-out" element={<ClockOutForm />} />
      <Route path="/employee/timesheets/" element={<WeeklyTimesheetForm />} />
      <Route
        path="/employee/self-attendance"
        element={<AttendanceListEmployee />}
      />
      <Route
        path="/projects/:projectId/employees"
        element={<ProjectEmployeesList />}
      />
      <Route
        path="/employee/salary-certificate"
        element={<EmployeeSalaryCertificateSection />}
      />
      <Route
        path="/employee/joining-certificate"
        element={<EmployeeJoiningCertificateSection />}
      />

      {/* End Employee Routes */}

      <Route
        path="/reports/employee-allocation"
        element={<EmployeeAllocationReportPage />}
      />
      <Route path="/reports/project-burn" element={<ProjectBurnReportPage />} />
      <Route
        path="/reports/project-report"
        element={<ProjectPortfolioReportPage />}
      />

      <Route path="/email/manage-template" element={<EmailTemplateManager />} />




   { /* Drively Routes */}
  
     
      {drivelyRoutes}


    </Routes>
  );
}

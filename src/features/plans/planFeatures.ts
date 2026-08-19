import { APP_CONFIG } from "../../config/appConfig";


type PlanName = keyof typeof APP_CONFIG.SUBSCRIPTIONS;

type FeatureFlag =
  keyof typeof APP_CONFIG.SUBSCRIPTIONS.Free.FEATURE_FLAGS;

export function hasFeatureEnabledForSelectedPlan(
  plan: string | null | undefined,
  feature: FeatureFlag,
): boolean {
  if (!plan) return false;

  const normalizedPlan =
    Object.keys(APP_CONFIG.SUBSCRIPTIONS).find(
      (p) => p.toLowerCase() === plan.toLowerCase(),
    ) as PlanName | undefined;

  if (!normalizedPlan) {
    return false;
  }

  return (
    APP_CONFIG.SUBSCRIPTIONS[
      normalizedPlan
    ]?.FEATURE_FLAGS?.[feature] === true
  );
}

export function getPlanFeatures(
  organizationPlan?: string | null
) {
  return {
    hasProjects: hasFeatureEnabledForSelectedPlan(
      organizationPlan,
      "PROJECTS"
    ),

    hasClients: hasFeatureEnabledForSelectedPlan(
      organizationPlan,
      "CLIENTS"
    ),

    hasEmailTemplates: hasFeatureEnabledForSelectedPlan(
      organizationPlan,
      "EMAIL_TEMPLATES"
    ),

    hasExpenses: hasFeatureEnabledForSelectedPlan(
      organizationPlan,
      "EXPENSES"
    ),

    hasCompliance: hasFeatureEnabledForSelectedPlan(
      organizationPlan,
      "COMPLIANCE"
    ),
    hasInvoices: hasFeatureEnabledForSelectedPlan(
      organizationPlan,
      "INVOICES"
    ),

    hasAuditLogs: hasFeatureEnabledForSelectedPlan(
      organizationPlan,
      "AUDIT_LOGS"
    ),

    hasJobScheduler: hasFeatureEnabledForSelectedPlan(
      organizationPlan,
      "JOB_SCHEDULER"
    ),

    hasBackupManagement: hasFeatureEnabledForSelectedPlan(
      organizationPlan,
      "BACKUP_MANAGEMENT"
    ),
    hasSystemMaintenance: hasFeatureEnabledForSelectedPlan(
      organizationPlan,
      "SYSTEM_MAINTENANCE"
    ),

    hasMultiOrganization: hasFeatureEnabledForSelectedPlan(
      organizationPlan,
      "MULTI_ORGANIZATION"
    ),
  };
}

export function isJobAvailableForSelectedPlan(
  plan: string | null | undefined,
  jobName: string,
): boolean {
  if (!plan) return false;

  const normalizedPlan =
    Object.keys(APP_CONFIG.SUBSCRIPTIONS).find(
      (p) => p.toLowerCase() === plan.toLowerCase(),
    ) as PlanName | undefined;

  if (!normalizedPlan) return false;

  const allowedJobs =
    APP_CONFIG.SUBSCRIPTIONS[normalizedPlan].ALLOWED_JOBS ?? [];

  if (allowedJobs.includes("*")) {
    return true;
  }

  return allowedJobs.some(
    (job) => job.toLowerCase() === jobName.toLowerCase(),
  );
}

export function isEmailTemplateAvailableForSelectedPlan(
  plan: string | null | undefined,
  templateType: string,
): boolean {
  if (!plan) return false;

  const normalizedPlan =
    Object.keys(APP_CONFIG.SUBSCRIPTIONS).find(
      (p) => p.toLowerCase() === plan.toLowerCase(),
    );

  if (!normalizedPlan) return false;

  console.log("templateType>>>",templateType);

  const allowedTemplates =
    APP_CONFIG.SUBSCRIPTIONS[normalizedPlan]
      ?.ALLOWED_EMAIL_TEMPLATES ?? [];

  if (allowedTemplates.includes("*")) {
    return true;
  }

  return allowedTemplates.includes(templateType);
}

export function canSendEmailForPlan(
  plan: string | null | undefined,
  emailType: string,
): boolean {
  return isEmailTemplateAvailableForSelectedPlan(
    plan,
    emailType,
  );
}
import { useState, useMemo, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Plus, Save, Trash2, Eye, RefreshCw, Lock } from "lucide-react";
import { useAuth } from "../auth/AuthProvider";
import { useCan } from "../../utils/permissions";
import {
  useEmailTemplates,
  useEmailTemplate,
  useUpsertEmailTemplate,
  useDeleteEmailTemplate,
} from "./hooks";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { useIsMobile } from "../../utils/useIsMobile";
import Split from "react-split";
import {
  getPlanFeatures,
  isEmailTemplateAvailableForSelectedPlan,
} from "../plans/planFeatures";

export default function EmailTemplatesManager() {
  const isMobile = useIsMobile();
  if (isMobile)
    return (
      <p className="text-gray-500 text-sm p-6">
        Sorry! Email template editing is not available on mobile devices to
        prevent accidental changes.
      </p>
    );

  const { organization_id, organization_plan } = useAuth();

  const { hasEmailTemplates } = getPlanFeatures(organization_plan);

  const can = useCan();

  const canView = can("email-templates:view");
  const canCreate = can("email-templates:create");
  const canUpdate = can("email-templates:update");
  const canDelete = can("email-templates:delete");

  if (!canView) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center max-w-md">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-12 h-12 text-red-500 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-.01-10a9 9 0 100 18 9 9 0 000-18z"
            />
          </svg>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            Access Restricted
          </h2>
          <p className="text-sm text-gray-500">
            You do not have permission to view this page. Please contact your HR
            or Administrator if you believe this is an error.
          </p>
        </div>
      </div>
    );
  }

  const [selectedType, setSelectedType] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  const [html, setHtml] = useState<string>("");
  const [preview, setPreview] = useState<boolean>(false);
  const [newType, setNewType] = useState<string>("");
  const [deleteType, setDeleteType] = useState<string | null>(null);

  const {
    data: templates = [],
    isLoading,
    refetch,
  } = useEmailTemplates(organization_id!);
  const { data: currentTemplate, isFetching } = useEmailTemplate(
    organization_id!,
    selectedType,
  );
  const upsert = useUpsertEmailTemplate(organization_id!);
  const remove = useDeleteEmailTemplate(organization_id!);

  useMemo(() => {
    if (currentTemplate && selectedType) {
      setSubject(currentTemplate.subject || "");
      setHtml(currentTemplate.html || "");
    } else if (!selectedType && !newType) {
      setSubject("");
      setHtml("");
    }
  }, [currentTemplate, selectedType, newType]);

  useEffect(() => {
    if (selectedType) setNewType("");
  }, [selectedType]);

  const handleSelect = (type: string) => {
    setSelectedType(type);
    setPreview(false);
    setNewType("");
  };

  const handleStartNew = () => {
    if (!canUpdate)
      return toast.error("You don’t have permission to create templates.");
    setSelectedType("");
    setNewType(" ");
    setSubject("");
    setHtml("");
    setPreview(false);
  };

  const handleSave = async () => {
    if (!canUpdate)
      return toast.error("You don’t have permission to update templates.");

    const isCreatingNew = !!newType.trim() && !selectedType;
    const type = isCreatingNew ? newType.trim() : selectedType;

    if (!type)
      return toast.error("Please select a template or enter a new type");
    if (!subject.trim() || !html.trim())
      return toast.error("Subject and HTML are required");

    if (isCreatingNew && templates.some((t: any) => t.type === type))
      return toast.error("A template with this type already exists");

    try {
      await upsert.mutateAsync({ type, subject, html });
      toast.success(isCreatingNew ? "Template created!" : "Template updated!");
      if (isCreatingNew) {
        setSelectedType(type);
        setNewType("");
      }
      refetch();
    } catch {
      toast.error("Failed to save template");
    }
  };

  const handleDelete = () => {
    if (!canDelete)
      return toast.error("You don’t have permission to delete templates.");
    if (selectedType) setDeleteType(selectedType);
  };

  const confirmDelete = async () => {
    if (!deleteType) return;
    try {
      await remove.mutateAsync(deleteType);
      toast.success("Template deleted");
      setSelectedType("");
      setSubject("");
      setHtml("");
      setNewType("");
      setDeleteType(null);
      refetch();
    } catch {
      toast.error("Failed to delete template");
    }
  };

  const isEditingExisting = !!selectedType && !newType;
  const isCreatingNew = !!newType.trim() && !selectedType;
  const activeTemplateName = selectedType || newType || "None";
  const activeTemplateAllowed =
  !selectedType ||
  isEmailTemplateAvailableForSelectedPlan(
    organization_plan,
    selectedType,
  );

  return (
    <>
      <div className="p-6 space-y-6">
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">Email Templates</h1>

             {organization_plan?.toLowerCase() === "free" && (
  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
    Limited
  </span>
)}
            </div>
            {!canUpdate && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Lock size={12} /> View-only access
              </span>
            )}
          </div>
          <button
            onClick={refetch}
            disabled={isLoading}
            className="text-sm bg-gray-100 hover:bg-gray-200 disabled:opacity-50 px-3 py-1.5 rounded-md flex items-center gap-2"
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>

        {/* MAIN SPLIT VIEW - Slim & Elegant Gutter */} 
        <div className="h-[80vh] border border-gray-200 rounded-2xl overflow-hidden shadow-lg bg-white">
          <Split
            className="flex h-full w-full"
            sizes={[32, 68]}
            minSize={[280, 500]}
            gutterSize={8}
            gutterAlign="center"
            snapOffset={30}
            gutter={(index, direction) => {
              const gutter = document.createElement("div");
              gutter.className =
                "gutter relative flex items-center justify-center bg-transparent hover:bg-indigo-100 transition-colors cursor-col-resize group";
              gutter.innerHTML = `
                <div class="absolute inset-y-0 w-0.5 bg-gray-300 group-hover:bg-indigo-500 transition-colors"></div>
              `;
              return gutter;
            }}
          >
            {/* Left: Template List Panel */}
            <div className="flex flex-col h-full bg-gray-50">
              <div className="p-4 border-b bg-white">
                <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
                  Templates
                </h2>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-3">
                {isLoading ? (
                  <div className="text-gray-500 text-sm py-8 text-center">
                    Loading templates...
                  </div>
                ) : templates.length === 0 ? (
                  <div className="text-gray-400 text-sm italic py-8 text-center">
                    No templates yet
                  </div>
                ) : (
                  <ul className="space-y-1">
                    {templates.map((tpl: any) => {
                      const isAllowed = isEmailTemplateAvailableForSelectedPlan(
                        organization_plan,
                        tpl.type,
                      );

                      return (
                        <li key={tpl.type}>
                          <button
                            disabled={!isAllowed}
                            onClick={() => isAllowed && handleSelect(tpl.type)}
                            className={`w-full text-left px-4 py-3 rounded-lg
          ${!isAllowed ? "opacity-60 cursor-not-allowed" : ""}
        `}
                          >
                            <div className="flex justify-between items-center">
                              <span>{tpl.type}</span>

                              {!isAllowed && (
                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-700">
                                  Growth
                                </span>
                              )}
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* Create New - Fixed at bottom */}
              {canCreate && hasEmailTemplates && (
                <div className="border-t bg-white p-4 space-y-3">
                  {selectedType === "" && newType ? (
                    <>
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                        placeholder="Template type (e.g. welcome_email)"
                        value={newType}
                        onChange={(e) => setNewType(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSave()}
                        autoFocus
                      />
                      <button
                        onClick={handleSave}
                        disabled={!newType.trim() || upsert.isPending}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-md py-2.5 text-sm font-medium flex items-center justify-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        Create Template
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleStartNew}
                      className="w-full hidden flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md py-3 text-sm font-medium shadow-sm"
                      disabled
                   >
                      <Plus className="w-4 h-4"/>
                      Start New Template
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Right: Editor */}
           <div className="flex flex-col h-full bg-white p-5">
              {/* Editor content remains exactly the same */}
              {isFetching ? (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  Loading template…
                </div>
              ) : isEditingExisting || isCreatingNew ? (
                <>
                  <div className="flex items-center justify-between mb-5 pb-4 border-b">
                    <h2 className="text-lg font-semibold">
                      {isCreatingNew ? "Creating" : "Editing"}:{" "}
                      <span className="text-indigo-700 font-mono">
                        {activeTemplateName}
                      </span>
                    </h2>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setPreview(!preview)}
                        className="flex items-center gap-2 text-sm bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-md"
                      >
                        <Eye className="w-4 h-4" />
                        {preview ? "Edit" : "Preview"}
                      </button>

                      {canUpdate && (
                        <button
                          onClick={handleSave}
                         disabled={
  !activeTemplateAllowed ||
  upsert.isPending ||
  !subject.trim() ||
  !html.trim()
}
                          className="flex items-center gap-2 text-sm bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2 rounded-md"
                        >
                          <Save className="w-4 h-4" />
                          {isCreatingNew ? "Create" : "Save"}
                        </button>
                      )}

                     {isEditingExisting &&
  canDelete &&
  activeTemplateAllowed && (
                        <button
                          onClick={handleDelete}
                          className="flex items-center gap-2 text-sm bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col space-y-5 overflow-auto">
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">
                        Subject
                      </label>
                      <input
  className="w-full border rounded-md px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
  value={subject}
  onChange={(e) => setSubject(e.target.value)}
  placeholder="Email subject line..."
  readOnly={!canUpdate || !activeTemplateAllowed}
/>
                    </div>

                    <div className="flex-1 flex flex-col">
                      <label className="text-xs font-medium text-gray-600 mb-1 block">
                        HTML Content
                      </label>
                      <textarea
                        className="flex-1 border rounded-md px-4 py-3 text-sm font-mono resize-none focus:ring-2 focus:ring-indigo-500"
                        value={html}
                        onChange={(e) => setHtml(e.target.value)}
                        placeholder="<p>Hello {{name}},</p>..."
                        readOnly={!canUpdate || !activeTemplateAllowed}
                      />
                    </div>

                    {preview && (
                      <div className="border-t pt-5">
                        <h3 className="text-sm font-semibold mb-3">
                          Live Preview
                        </h3>
                        <div
                          className="border rounded-lg p-5 bg-gray-50 text-sm prose prose-sm max-w-none overflow-auto min-h-[300px] shadow-inner"
                          dangerouslySetInnerHTML={{
                            __html:
                              html ||
                              "<em class='text-gray-400'>Preview will appear here...</em>",
                          }}
                        />
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-center text-gray-500">
                  <div>
                    <div className="bg-gray-200 border-2 border-dashed rounded-xl w-20 h-20 mx-auto mb-5" />
                    <p className="text-lg italic">
                     Install Email Templates from system settings to appear here.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Split>
        </div>
      </div>

      {/* DELETE CONFIRMATION */}
      {canDelete && (
        <ConfirmDialog
          open={!!deleteType}
          title="Delete Email Template"
          description={`Are you sure you want to delete the template "${deleteType}"? This action cannot be undone.`}
          confirmLabel="Delete"
          danger
          isLoading={remove.isLoading}
          onConfirm={confirmDelete}
          onClose={() => setDeleteType(null)}
        />
      )}
    </>
  );
}

// src/payroll/salary-component/ComponentListInline.tsx
import {
  useComponentsByCategory,
  useDeleteComponent,
  useCreateComponent,
  useUpdateComponentOrder,
} from "./hooks";
import { useNavigate } from "react-router-dom";
import {
  Pencil,
  Trash2,
  Plus,
  Loader2,
  Info,
  GripVertical,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  MouseSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState, useEffect } from "react";
import { APP_CONFIG } from "../../../config/appConfig";
import { useOrganization } from "../../../features/organizations/settings/preferences/hooks";
import FormDialog from "../../../components/ui/FormDialog";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import { toast } from "react-hot-toast";
import { useCan } from "../../../utils/permissions";

export default function ComponentListInline({
  categoryId,
}: {
  categoryId: string;
}) {
  const nav = useNavigate();
  const can = useCan();
  const canUpdate = can("payslip-settings:update");

  const [page, setPage] = useState(1);
  const limit = APP_CONFIG.PAGE_SIZE;

  const { data, isLoading, isFetching, refetch } = useComponentsByCategory(
    categoryId,
    page,
    limit
  );
  const del = useDeleteComponent(categoryId);
  const createComponent = useCreateComponent();
  const updateOrder = useUpdateComponentOrder();
  const { data: org } = useOrganization();

  const [assignDialog, setAssignDialog] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [components, setComponents] = useState<any[]>([]);

  // DELETE CONFIRMATION STATE
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  useEffect(() => {
    if (data?.components) {
      const sorted = [...data.components].sort(
        (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)
      );
      setComponents(sorted);
    }
  }, [data?.components]);

  const handleAssignTypes = async () => {
    try {
      const orgTypes = org?.compensation_settings?.types || [];
      const selected = orgTypes.filter((t: any) =>
        selectedTypes.includes(t.id)
      );

      await Promise.all(
        selected.map(async (t: any) => {
          const payload = {
            organization_id: org.id,
            category_id: categoryId,
            code: t.name.toLowerCase().replace(/\s+/g, "_"),
            name: t.name,
            description: "",
            is_active: true,
            is_taxable: true,
            rule_type: "FIXED_AMOUNT",
            reference_type_id: t.id,
          };
          await createComponent.mutateAsync(payload);
        })
      );

      toast.success("Types assigned successfully");
      setAssignDialog(false);
      setSelectedTypes([]);
      refetch();
    } catch (err) {
      console.error(err);
      toast.error("Failed to assign types");
    }
  };

  // DnD setup - Fixed for mobile touch support
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = components.findIndex((i) => i.id === active.id);
    const newIndex = components.findIndex((i) => i.id === over.id);
    const reordered = arrayMove(components, oldIndex, newIndex).map(
      (item, idx) => ({
        ...item,
        display_order: idx + 1,
      })
    );
    setComponents(reordered);

    updateOrder.mutate({
      category_id: categoryId,
      items: reordered.map((c) => ({
        id: c.id,
        display_order: c.display_order,
      })),
    });
  };

  // DELETE WITH CONFIRMATION
  const handleDelete = (component: any) => {
    setDeleteTarget(component);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await del.mutateAsync(deleteTarget.id);
      toast.success("Component deleted");
      refetch();
    } catch (err) {
      toast.error("Failed to delete component");
    } finally {
      setDeleteTarget(null);
    }
  };

    // 🧩 Helper — Get label & description for each component type
  const getTypeLabel = (comp: any) => {
    const type =
      org?.compensation_settings?.types?.find(
        (t: any) => t.id === comp.reference_type_id
      ) || null;

    if (type?.is_from_expense_tracker) {
      return {
        label: "EXPENSE TRACKER",
        description: "Value retrieved from approved expense report",
      };
    }

    // Default cases
    if (comp.rule_type === "FIXED_AMOUNT") {
      return {
        label: "FIXED_AMOUNT",
        description: "Value retrieved from Employee Compensation",
      };
    }

    return {
      label: comp.rule_type || "—",
      description: "Derived by rule or formula",
    };
  };


  // ------------------- RENDER -------------------
  if (isLoading)
    return <p className="text-sm text-gray-500">Loading components…</p>;

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="font-medium text-sm text-gray-700">Components</h3>

        {canUpdate && (
          <div className="flex items-center gap-2">
            <button
              className="btn btn-xs btn-outline"
              onClick={() => setAssignDialog(true)}
            >
              Assign Types
            </button>

            <button
              className="btn-primary btn-xs flex items-center gap-1"
              onClick={() =>
                nav(
                  `/payroll/salary-categories/${categoryId}/components/create`
                )
              }
            >
              <Plus className="w-3 h-3" /> Add
            </button>
          </div>
        )}
      </div>

      {/* MOBILE CARD VIEW */}
      <div className="block lg:hidden space-y-3">
        {!components?.length ? (
          <p className="text-sm text-gray-500 italic">No components yet.</p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={components.map((c) => c.id)} strategy={verticalListSortingStrategy}>
              {components.map((c) => (
               <SortableMobileCard
                key={c.id}
                c={c}
                onEdit={() =>
                  nav(`/payroll/salary-categories/${categoryId}/components/${c.id}/edit`)
                }
                onDelete={() => handleDelete(c)}
                canUpdate={canUpdate}
                getTypeLabel={getTypeLabel}
              /> 
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* DESKTOP TABLE */}
      <div className="hidden lg:block overflow-x-auto border rounded-md">
        {!components?.length ? (
          <p className="text-sm text-gray-500 italic p-3">No components yet.</p>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="w-8"></th>
                <th className="w-1/6 text-left px-3 py-2">Code</th>
                <th className="w-1/4 text-left px-3 py-2">Name</th>
                <th className="w-1/3 text-left px-3 py-2">Type</th>
                <th className="w-1/6 text-left px-3 py-2">Active</th>
                {canUpdate && <th className="w-24 text-center px-3 py-2">Actions</th>}
              </tr>
            </thead>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={components.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                <tbody>
                  {components.map((c) => (
                   <SortableRow
                  key={c.id}
                  c={c}
                  onEdit={() =>
                    nav(`/payroll/salary-categories/${categoryId}/components/${c.id}/edit`)
                  }
                  onDelete={() => handleDelete(c)}
                  canUpdate={canUpdate}
                  getTypeLabel={getTypeLabel}
                />

                  ))}
                </tbody>
              </SortableContext>
            </DndContext>
          </table>
        )}
      </div>

      {/* Pagination */}
      <div className="flex justify-end gap-2 text-xs mt-2">
        {isFetching && (
          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
        )}
        <button
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
          className="btn-secondary btn-xs"
        >
          Prev
        </button>
        <button
          disabled={page >= (data?.paginationMetaInfo?.totalPages ?? 1)}
          onClick={() => setPage((p) => p + 1)}
          className="btn-secondary btn-xs"
        >
          Next
        </button>
      </div>

      {/* Assign Types Dialog */}
      <FormDialog
        open={assignDialog}
        title="Assign Types"
        onClose={() => setAssignDialog(false)}
        primaryAction={{
          label: "Save",
          loading: createComponent.isPending,
          onClick: handleAssignTypes,
        }}
        secondaryAction={{
          label: "Cancel",
          onClick: () => setAssignDialog(false),
        }}
      >
        <div className="space-y-3">
          <label className="block text-sm font-medium">Select Types</label>
          <select
            multiple
            className="input w-full h-48"
            value={selectedTypes}
            onChange={(e) =>
              setSelectedTypes(
                Array.from(e.target.selectedOptions, (opt) => opt.value)
              )
            }
          >
            {org?.compensation_settings?.types
              ?.filter((t: any) => !t.deleted)
              .map((t: any) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
          </select>
        </div>
      </FormDialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Component"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        danger
        isLoading={del.isPending}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

// Mobile Card - Fixed Type overflow + better drag handle
function SortableMobileCard({
  c,
  onEdit,
  onDelete,
  canUpdate,
  getTypeLabel,
}: {
  c: any;
  onEdit: () => void;
  onDelete: () => void;
  canUpdate: boolean;
  getTypeLabel: (comp: any) => { label: string; description: string }; // ✅ add type
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: c.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm"
    >
      <div className="flex items-start gap-4">
        {canUpdate && (
          <div
            {...attributes}
            {...listeners}
            className="mt-1 p-2 -ml-2 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"
          >
            <GripVertical className="w-6 h-6" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-3">
            <code className="text-sm font-mono text-gray-600 shrink-0">
              {c.code}
            </code>
            <h4 className="font-semibold text-gray-900 truncate">
              {c.name}
            </h4>
          </div>

          {/* Fixed Type section - no overflow */}
        <div className="mb-3">
          {(() => {
            const { label, description } = getTypeLabel(c);
            return (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-gray-500 whitespace-nowrap">Type:</span>
                  <span className="text-sm font-medium truncate">{label}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                  <Info className="w-3.5 h-3.5" />
                  {description}
                </div>
              </>
            );
          })()}
      </div>


          <div className="flex items-center justify-between mb-4">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              c.is_active
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-600"
            }`}>
              {c.is_active ? "Active" : "Inactive"}
            </span>
          </div>

          {canUpdate && (
            <div className="flex gap-3">
              {/* Edit Button */}
              <button
                onClick={onEdit}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 active:bg-gray-300 transition text-sm shadow-sm"
              >
                <Pencil className="w-4 h-4" />
                Edit
              </button>

              {/* Delete Button - soft red */}
              <button
                onClick={onDelete}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-100 text-red-700 rounded-xl font-medium hover:bg-red-200 active:bg-red-300 transition text-sm shadow-sm"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Desktop Row - unchanged
function SortableRow({
  c,
  onEdit,
  onDelete,
  canUpdate,
  getTypeLabel,
}: {
  c: any;
  onEdit: () => void;
  onDelete: () => void;
  canUpdate: boolean;
  getTypeLabel: (comp: any) => { label: string; description: string }; // ✅ add type
}) {

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: c.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className="border-t hover:bg-gray-50 transition"
    >
      <td className="px-3 py-2 cursor-grab text-gray-400" {...attributes} {...listeners}>
        <GripVertical className="w-3 h-3" />
      </td>
      <td className="px-3 py-2">{c.code}</td>
      <td className="px-3 py-2">{c.name}</td>
<td className="px-3 py-2">
  {(() => {
    const { label, description } = getTypeLabel(c);
    return (
      <div>
        <div className="font-medium">{label}</div>
        <div className="text-[11px] text-gray-500 italic flex items-center gap-1 mt-0.5">
          <Info className="w-3 h-3 text-gray-400" />
          {description}
        </div>
      </div>
    );
  })()}
</td>


      <td className="px-3 py-2">{c.is_active ? "Yes" : "No"}</td>

      {canUpdate && (
        <td className="px-3 py-2 flex gap-2">
          <button className="icon-btn" onClick={onEdit}>
            <Pencil className="w-4 h-4" />
          </button>
          <button
            className="icon-btn text-red-600 hover:text-red-700"
            onClick={onDelete}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </td>
      )}
    </tr>
  );
}
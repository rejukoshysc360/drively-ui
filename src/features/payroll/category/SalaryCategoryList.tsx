// src/payroll/salary-categories/CategoryList.tsx
import {
  useEffect,
  useMemo,
  useState,
  useRef,
  useCallback,
} from "react";
import { ColumnDef } from "@tanstack/react-table";
import DataTable from "../../../components/ui/DataTable";
import {
  useCategories,
  useDeleteCategory,
} from "./hooks";
import { useNavigate } from "react-router-dom";
import {
  Trash2,
  Pencil,
  Plus,
  Loader2,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  ArrowDown,
  Filter,
  Settings,
  Building2,
} from "lucide-react";
import { APP_CONFIG } from "../../../config/appConfig";
import ComponentListInline from "../salary-component/ComponentListInline";
import { useOrganization } from "../../../features/organizations/settings/preferences/hooks";
import { useCreateComponent } from "../salary-component/hooks";
import { toast } from "react-hot-toast";
import FormDialog from "../../../components/ui/FormDialog";
import { useCreateRule } from "../salary-component/hooks";
import { useCan } from "../../../utils/permissions";

type Row = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  display_order: number;
  is_active: boolean;
  polarity: number;
  component_count: number;
};

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const h = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(h);
  }, [value, delay]);
  return debouncedValue;
}

export default function CategoryList() {
  const can = useCan();
  const canUpdate = can("payslip-settings:update");
  const canViewAll = can("payslip-settings:view");

   // 🔒 Restrict page access for non-HR/admin roles
  if (!canViewAll) {
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
            You do not have permission to view this page. Please contact your HR or
            Administrator if you believe this is an error.
          </p>
        </div>
      </div>
    );
  }

  const nav = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: org } = useOrganization();
  const createComponent = useCreateComponent();
  const createRule = useCreateRule();

  const [page, setPage] = useState(1);
  const limit = APP_CONFIG.PAGE_SIZE;
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput.trim(), 350);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const [assignDialog, setAssignDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  const { data, isFetching, isLoading } = useCategories(page, limit, debouncedSearch);
  const del = useDeleteCategory();

  useEffect(() => {
    if (data && isInitialLoad) setIsInitialLoad(false);
  }, [data, isInitialLoad]);

  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Row | null>(null);

  const onAskDelete = useCallback((row: Row) => {
    setDeleteTarget(row);
  }, []);

  const onConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await del.mutateAsync(deleteTarget.id);
      toast.success("Category deleted");
      setDeleteTarget(null);
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete");
    }
  }, [del, deleteTarget]);

  const handleOpenAssign = (category: any) => {
    setSelectedCategory(category);
    setSelectedTypes([]);
    setAssignDialog(true);
  };

  const handleAssignTypes = async () => {
    if (!selectedCategory || !selectedTypes.length) return;
    try {
      const orgTypes = org?.compensation_settings?.types || [];
      const selected = orgTypes.filter((t: any) => selectedTypes.includes(t.id));

      await Promise.all(
        selected.map(async (t: any) => {
          const compPayload = {
            organization_id: org.id,
            category_id: selectedCategory.id,
            code: t.name.toLowerCase().replace(/\s+/g, "_"),
            name: t.name,
            description: "",
            is_active: true,
            is_taxable: true,
            rule_type: "FIXED_AMOUNT",
            reference_type_id: t.id,
          };
          const newComponent = await createComponent.mutateAsync(compPayload);

          const rulePayload = {
            rule_type: "FIXED_AMOUNT",
            reference_type_id: t.id,
            fixed_amount: null,
            expression: null,
            is_active: true,
          };

          await createRule.mutateAsync({
            componentId: newComponent.id,
            payload: rulePayload,
          });
        })
      );

      toast.success("Types assigned successfully");
      setAssignDialog(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to assign types");
    }
  };

 

  const columns: ColumnDef<Row>[] = useMemo(() => {
    const baseCols: ColumnDef<Row>[] = [
      {
        header: "",
        id: "expander",
        cell: ({ row }) => (
          <div className="flex justify-center">
            <button
              className="p-2 rounded-lg hover:bg-gray-50 transition"
              onClick={() =>
                setExpandedRow(expandedRow === row.original.id ? null : row.original.id)
              }
            >
              {expandedRow === row.original.id ? (
                <ChevronUp className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-600" />
              )}
            </button>
          </div>
        ),
      },
      {
        header: "Code",
        accessorKey: "code",
        cell: ({ getValue }) => <span className="font-medium">{getValue()}</span>,
      },
      {
        header: "Name",
        accessorKey: "name",
        cell: ({ getValue }) => (
          <span className="font-medium text-indigo-900">{getValue()}</span>
        ),
      },
      {
        header: "Polarity",
        accessorKey: "polarity",
        cell: ({ getValue }) => {
          const v = Number(getValue());
          if (v === 1)
            return (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <ArrowUp className="w-3.5 h-3.5" /> Contribute
              </span>
            );
          if (v === -1)
            return (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                <ArrowDown className="w-3.5 h-3.5" /> Deduct
              </span>
            );
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
              Unknown
            </span>
          );
        },
      },
      {
        header: "Description",
        accessorKey: "description",
        cell: ({ getValue }) => {
          const v = getValue() || "";
          return v ? (
            <span
              title={v}
              className="text-sm text-gray-600 truncate max-w-[200px] block"
            >
              {v.length > 50 ? v.slice(0, 50) + "..." : v}
            </span>
          ) : (
            <span className="text-gray-400 text-sm">—</span>
          );
        },
      },
      {
        header: "Order",
        accessorKey: "display_order",
        cell: ({ getValue }) => (
          <span className="text-sm font-medium">{getValue()}</span>
        ),
      },
      {
        header: "Active",
        accessorKey: "is_active",
        cell: ({ getValue }) =>
          getValue() ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Yes
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
              No
            </span>
          ),
      },
      {
        header: "Components",
        accessorKey: "component_count",
        cell: ({ getValue }) => {
          const v = Number(getValue() ?? 0);
          return (
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                v > 0 ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-700"
              }`}
            >
              {v}
            </span>
          );
        },
      },
    ];

    if (canUpdate) {
      baseCols.push({
        header: "Actions",
        cell: ({ row }) => {
          const inUse = (row.original.component_count ?? 0) > 0;

          return (
            <div className="flex items-center justify-center gap-1">
              <button
                className="p-2 rounded-lg hover:bg-gray-50 transition"
                title="Edit"
                onClick={() =>
                  nav(`/payroll/salary-categories/${row.original.id}/edit`)
                }
              >
                <Pencil className="w-4 h-4 text-gray-600" />
              </button>

              <button
                className={`p-2 rounded-lg transition ${
                  inUse ? "opacity-40 cursor-not-allowed" : "hover:bg-red-50"
                }`}
                title={inUse ? "Cannot delete: has components" : "Delete category"}
                disabled={inUse}
                onClick={() => !inUse && onAskDelete(row.original)}
              >
                <Trash2 className="w-4 h-4 text-red-600" />
              </button>
            </div>
          );
        },
      });
    }

    return baseCols;
  }, [expandedRow, nav, onAskDelete, canUpdate]);

  const rows = (data?.categories ?? []) as Row[];


const total =
  data?.paginationMetaInfo?.totalCount ?? 0;

const [categoryCount, setCategoryCount] = useState(0);

useEffect(() => {
  if (!debouncedSearch && data?.paginationMetaInfo?.totalCount != null) {
    setCategoryCount(data.paginationMetaInfo.totalCount);
  }
}, [data, debouncedSearch]);

const disableNew = categoryCount >= 2;


  return (
    <div className="p-4 sm:p-6 w-full mx-auto bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
          <Settings className="w-8 h-8 text-indigo-600" />
          Payslip Configurator
        </h1>
        <p className="text-slate-600 mt-1">Manage salary categories and components</p>
      </div>

      {/* Search + Add */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex-1 relative max-w-md">
            <input
              ref={inputRef}
              type="text"
              placeholder="Search code, name, description..."
              className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            {isFetching && !isLoading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-indigo-600" />
            )}
          </div>

          <button
            onClick={() => !disableNew && nav("/payroll/salary-categories/create")}
            disabled={disableNew}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-white shadow-sm font-medium
              ${disableNew
                ? "bg-gray-300 cursor-not-allowed opacity-60"
                : "bg-indigo-600 hover:bg-indigo-700"}
            `}
          >
            <Plus className="w-4 h-4" />
            New Category
          </button>
        </div>
      </div>

      {/* === MOBILE CARD VIEW (ONLY ON MOBILE) === */}
      <div className="block lg:hidden space-y-4">
        {rows.map((cat) => (
          <div key={cat.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm">
            <div className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm text-gray-600">{cat.code}</span>
                    <h3 className="text-lg font-bold text-gray-900">{cat.name}</h3>
                  </div>
                  {cat.description && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">{cat.description}</p>
                  )}
                </div>
                <button
                  onClick={() => setExpandedRow(expandedRow === cat.id ? null : cat.id)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  {expandedRow === cat.id ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm mb-5">
                <div>
                  <span className="text-gray-500">Polarity:</span>{" "}
                  {cat.polarity === 1 ? (
                    <span className="text-green-700 font-medium">Contribute</span>
                  ) : cat.polarity === -1 ? (
                    <span className="text-red-700 font-medium">Deduct</span>
                  ) : (
                    <span className="text-gray-500">—</span>
                  )}
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    cat.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                  }`}>
                    {cat.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Order:</span> <strong>{cat.display_order}</strong>
                </div>
                <div className="text-right">
                  <span className="text-gray-500">Components:</span>{" "}
                  <strong className={cat.component_count > 0 ? "text-blue-700" : "text-gray-500"}>
                    {cat.component_count}
                  </strong>
                </div>
              </div>

              {canUpdate && (
                <div className="flex gap-3">
                  <button
                    onClick={() => nav(`/payroll/salary-categories/${cat.id}/edit`)}
                    className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition flex items-center justify-center gap-2"
                  >
                    <Pencil className="w-5 h-5" />
                    Edit
                  </button>
                  <button
                    onClick={() => !cat.component_count && onAskDelete(cat)}
                    disabled={cat.component_count > 0}
                    className={`flex-1 py-3 rounded-xl font-medium transition flex items-center justify-center gap-2 ${
                      cat.component_count > 0
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-red-600 text-white hover:bg-red-700"
                    }`}
                  >
                    <Trash2 className="w-5 h-5" />
                    Delete
                  </button>
                </div>
              )}
            </div>

            {expandedRow === cat.id && (
              <div className="border-t border-gray-200 bg-gray-50 px-5 py-4">
                <ComponentListInline categoryId={cat.id} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* === DESKTOP TABLE - 100% YOUR ORIGINAL CODE === */}
      <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {rows.length === 0 && !isLoading ? (
          <div className="text-center py-16">
            <div className="bg-gray-100 border-2 border-dashed rounded-xl w-24 h-24 mx-auto mb-4 flex items-center justify-center">
              <Filter className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-1">No categories found</h3>
            <p className="text-gray-500">Try adjusting your search or create a new category.</p>
          </div>
        ) : (
          <DataTable
            data={rows}
            columns={columns}
            total={total}
            page={page}
            limit={limit}
            onPageChange={setPage}
            isFetching={isFetching}
            renderSubRow={(row) =>
              expandedRow === row.id ? (
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-t border-gray-200 px-6 py-4">
                  <ComponentListInline categoryId={row.id} />
                </div>
              ) : null
            }
          />
        )}
      </div>

      {/* Loading & Empty States */}
      {isLoading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="h-12 bg-gray-100 rounded"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {rows.length === 0 && !isLoading && (
        <div className="text-center py-16">
          <div className="bg-gray-100 border-2 border-dashed rounded-xl w-24 h-24 mx-auto mb-4 flex items-center justify-center">
            <Filter className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">No categories found</h3>
          <p className="text-gray-500">Try adjusting your search or create a new category.</p>
        </div>
      )}

      {/* Delete Confirmation */}
      <FormDialog
        open={!!deleteTarget}
        title="Delete Category"
        onClose={() => setDeleteTarget(null)}
        primaryAction={{
          label: "Delete",
          loading: del.isPending,
          onClick: onConfirmDelete,
          danger: true,
        }}
        secondaryAction={{
          label: "Cancel",
          onClick: () => setDeleteTarget(null),
        }}
      >
        <p className="text-sm text-gray-600">
          This will permanently delete the category{" "}
          <strong className="text-gray-900">
            {deleteTarget?.code}
            {deleteTarget?.name && ` – ${deleteTarget.name}`}
          </strong>
          . This action cannot be undone.
        </p>
      </FormDialog>

      {/* Assign Types Dialog */}
      <FormDialog
        open={assignDialog}
        title={`Assign Types to ${selectedCategory?.name || ""}`}
        onClose={() => setAssignDialog(false)}
        primaryAction={{
          label: createComponent.isPending ? "Assigning..." : "Assign",
          loading: createComponent.isPending,
          onClick: handleAssignTypes,
        }}
        secondaryAction={{
          label: "Cancel",
          onClick: () => setAssignDialog(false),
        }}
      >
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Select Compensation Types
          </label>
          <select
            multiple
            size={8}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 bg-white"
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
                <option key={t.id} value={t.id} className="py-1.5">
                  {t.name}
                </option>
              ))}
          </select>
          <p className="text-xs text-gray-500">
            Hold Ctrl/Cmd to select multiple types
          </p>
        </div>
      </FormDialog>
    </div>
  );
}
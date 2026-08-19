import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { useRole, useCreateRole, useUpdateRole } from "./hooks";

type RoleFormValues = {
  id?: string;
  name: string;
  slug: string;
};

export default function RoleForm() {
  const { roleId } = useParams();
  const isEdit = !!roleId;
  const navigate = useNavigate();

  const { data: role, isLoading } = useRole(roleId || "");
  const createMutation = useCreateRole();
  const updateMutation = useUpdateRole(roleId || "");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RoleFormValues>({
    defaultValues: {
      name: "",
      slug: "",
    },
  });

  useEffect(() => {
    if (role) reset({ name: role.name, slug: role.slug });
  }, [role, reset]);

  const onSubmit = (values: RoleFormValues) => {
    if (isEdit) {
      updateMutation.mutate(values, {
        onSuccess: () => navigate("/settings/roles"),
      });
    } else {
      createMutation.mutate(values, {
        onSuccess: () => navigate("/settings/roles"),
      });
    }
  };

  if (isEdit && isLoading) return <div className="p-6">Loading…</div>;

  return (
    <div className="max-w-lg mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">
        {isEdit ? "Edit Role" : "Add Role"}
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Role Name</label>
          <input
            className="input w-full"
            {...register("name", { required: true })}
          />
          {errors.name && (
            <p className="text-xs text-red-600 mt-1">Required</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium">Slug</label>
          <input
            className="input w-full"
            {...register("slug", { required: true })}
          />
          {errors.slug && (
            <p className="text-xs text-red-600 mt-1">Required</p>
          )}
        </div>

        <button
          type="submit"
          className="btn-primary"
          disabled={createMutation.isLoading || updateMutation.isLoading}
        >
          {isEdit
            ? updateMutation.isLoading
              ? "Updating..."
              : "Update Role"
            : createMutation.isLoading
            ? "Creating..."
            : "Create Role"}
        </button>
      </form>
    </div>
  );
}

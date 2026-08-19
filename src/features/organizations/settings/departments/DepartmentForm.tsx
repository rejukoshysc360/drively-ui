import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import {
  useDepartment,
  useCreateDepartment,
  useUpdateDepartment,
} from './hooks';

type Department = {
  id?: string;
  name: string;
  description?: string;
};

export default function DepartmentForm() {
  const { departmentId } = useParams();
  const isEdit = !!departmentId;
  const navigate = useNavigate();

  const { data: department, isLoading } = useDepartment(departmentId || '');
  const createMutation = useCreateDepartment();
  const updateMutation = useUpdateDepartment(departmentId || '');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Department>({
    defaultValues: {
      name: '',
      description: '',
    },
  });

  useEffect(() => {
    if (department) {
      reset({
        name: department.name || '',
        description: department.description || '',
      });
    }
  }, [department, reset]);

  const onSubmit = (values: Department) => {
    if (isEdit) {
      updateMutation.mutate(values, {
        onSuccess: () => navigate('/settings/departments'),
      });
    } else {
      createMutation.mutate(values, {
        onSuccess: () => navigate('/settings/departments'),
      });
    }
  };

  if (isEdit && isLoading) {
    return <div className="p-6">Loading…</div>;
  }

  return (
    <div className="max-w-lg mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">
        {isEdit ? 'Edit Department' : 'Add Department'}
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Name</label>
          <input
            className="input w-full"
            {...register('name', { required: true })}
          />
          {errors.name && <p className="text-xs text-red-600 mt-1">Required</p>}
        </div>

        <div>
          <label className="block text-sm font-medium">Description</label>
          <textarea
            className="input w-full"
            {...register('description')}
            rows={3}
          />
        </div>

        <button
          type="submit"
          className="btn-primary"
          disabled={createMutation.isLoading || updateMutation.isLoading}
        >
          {isEdit
            ? updateMutation.isLoading
              ? 'Updating...'
              : 'Update Department'
            : createMutation.isLoading
            ? 'Creating...'
            : 'Create Department'}
        </button>
      </form>
    </div>
  );
}

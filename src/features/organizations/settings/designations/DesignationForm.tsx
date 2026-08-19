import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useDesignation, useCreateDesignation, useUpdateDesignation } from './hooks';
import { useDepartments } from '../departments/hooks';

type Designation = {
  id?: string;
  name: string;
  description?: string;
  department_id: string;
};

export default function DesignationForm() {
  const { departmentId, designationId } = useParams();
  const isEdit = !!designationId;
  const navigate = useNavigate();

  const { data: designation, isLoading } = useDesignation(departmentId || '', designationId || '');
  const createMutation = useCreateDesignation(departmentId || '');
  const updateMutation = useUpdateDesignation(departmentId || '', designationId || '');

  const { data: deptData } = useDepartments(1, 100); // load all departments
  const departments = deptData?.departments ?? [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Designation>({
    defaultValues: {
      name: '',
      description: '',
      department_id: departmentId || '',
    },
  });

  useEffect(() => {
    if (designation) {
      reset({
        name: designation.name || '',
        description: designation.description || '',
        department_id: designation.department_id || '',
      });
    }
  }, [designation, reset]);

  const onSubmit = (values: Designation) => {
    if (isEdit) {
      updateMutation.mutate(values, {
        onSuccess: () => navigate('/settings/designations'),
      });
    } else {
      createMutation.mutate(values, {
        onSuccess: () => navigate('/settings/designations'),
      });
    }
  };

  if (isEdit && isLoading) {
    return <div className="p-6">Loading…</div>;
  }

  return (
    <div className="max-w-lg mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">
        {isEdit ? 'Edit Designation' : 'Add Designation'}
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Department</label>
          <select
            className="input w-full"
            {...register('department_id', { required: true })}
          >
            <option value="">Select department</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          {errors.department_id && <p className="text-xs text-red-600 mt-1">Required</p>}
        </div>

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
              : 'Update Designation'
            : createMutation.isLoading
            ? 'Creating...'
            : 'Create Designation'}
        </button>
      </form>
    </div>
  );
}

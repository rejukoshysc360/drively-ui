import React from "react";

export function InputField({
  name,
  label,
  type = "text",
  isEditing = false,
  disabled = false,
  className = "",
  registerTracked,
  errors,
}: {
  name: string;
  label: string;
  type?: string;
  isEditing?: boolean;
  disabled?: boolean;
  className?: string;
  registerTracked: any;
  errors?: Record<string, any>;
}) {
  const errorMessage = errors?.[name]?.message;

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={name}
        className="block text-xs font-medium text-gray-600"
      >
        {label}
      </label>

      <input
        id={name}
        type={type}
        className={`input w-full ${className} ${
          errorMessage
            ? "border-red-500 focus:ring-red-500 focus:border-red-500"
            : ""
        }`}
        disabled={!isEditing || disabled}
        {...registerTracked(name)}
      />

      {errorMessage && (
        <p className="text-xs text-red-600 mt-0.5">{errorMessage}</p>
      )}
    </div>
  );
}

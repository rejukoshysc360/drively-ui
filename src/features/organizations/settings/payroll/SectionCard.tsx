import React from "react";

const SectionCard: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
    <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">{title}</h2>
    <div className="space-y-4">{children}</div>
  </div>
);

export default SectionCard;

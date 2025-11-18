'use client';

import { CreateSimpleEntityForm } from '../../components/forms/CreateSimpleEntityForm';

export default function CategoriesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Manage Categories</h1>
      <CreateSimpleEntityForm
        entityName="Category"
        taskType="create-category"
      />
      {/* You would add a list/table of existing categories here */}
    </div>
  );
}
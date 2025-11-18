'use client';

import { CreateSimpleEntityForm } from '../../components/forms/CreateSimpleEntityForm';

export default function BrandsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Manage Brands</h1>
      <CreateSimpleEntityForm
        entityName="Brand"
        taskType="create-brand"
      />
      {/* You would add a list/table of existing brands here */}
    </div>
  );
}
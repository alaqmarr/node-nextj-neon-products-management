'use client';

import { CreateSimpleEntityForm } from '../../components/forms/CreateSimpleEntityForm';

export default function PurposesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Manage Purposes</h1>
      <CreateSimpleEntityForm
        entityName="Purpose"
        taskType="create-purpose"
      />
      {/* You would add a list/table of existing purposes here */}
    </div>
  );
}
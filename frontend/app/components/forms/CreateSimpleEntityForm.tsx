'use client';

import { useState } from 'react';
import { useTaskStore, TaskType } from '../../store/taskStore';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@radix-ui/react-label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface CreateSimpleEntityFormProps {
  entityName: string;
  taskType: TaskType;
}

export function CreateSimpleEntityForm({
  entityName,
  taskType,
}: CreateSimpleEntityFormProps) {
  const [name, setName] = useState('');
  const addTask = useTaskStore((state) => state.addTask);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      toast.error('Name cannot be empty.');
      return;
    }

    addTask(taskType, { name });
    setName(''); // Clear form
  };

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>Create New {entityName}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">{entityName} Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`e.g. "Electronics" or "Nike"`}
              required
            />
          </div>
          <Button type="submit">Add to Queue</Button>
        </form>
      </CardContent>
    </Card>
  );
}
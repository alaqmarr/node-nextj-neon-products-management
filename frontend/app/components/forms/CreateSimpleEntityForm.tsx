'use client';

import { useState } from 'react';
import { useTaskStore, TaskType } from '../../store/taskStore';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@radix-ui/react-label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Loader2, Hash, Library, Tag, Goal, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreateSimpleEntityFormProps {
  entityName: string;
  taskType: TaskType;
}

const entityConfig = {
  brand: {
    icon: Library,
    color: 'from-blue-500 to-cyan-500',
    borderColor: 'border-blue-200 dark:border-blue-800',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    placeholder: 'e.g., "Nike", "Apple", "Samsung"',
    description: 'Create a new brand for your products'
  },
  category: {
    icon: Tag,
    color: 'from-green-500 to-emerald-500',
    borderColor: 'border-green-200 dark:border-green-800',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    placeholder: 'e.g., "Electronics", "Clothing", "Home & Garden"',
    description: 'Organize products into categories'
  },
  purpose: {
    icon: Goal,
    color: 'from-purple-500 to-violet-500',
    borderColor: 'border-purple-200 dark:border-purple-800',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    placeholder: 'e.g., "Sports", "Casual", "Professional"',
    description: 'Define the purpose or use case'
  }
};

export function CreateSimpleEntityForm({
  entityName,
  taskType,
}: CreateSimpleEntityFormProps) {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const addTask = useTaskStore((state) => state.addTask);

  const config = entityConfig[taskType as keyof typeof entityConfig] || {
    icon: Hash,
    color: 'from-gray-500 to-slate-500',
    borderColor: 'border-gray-200 dark:border-gray-800',
    bgColor: 'bg-gray-50 dark:bg-gray-900/20',
    placeholder: `Enter ${entityName} name`,
    description: `Create a new ${entityName.toLowerCase()}`
  };

  const EntityIcon = config.icon;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Please enter a name');
      return;
    }

    if (name.length < 2) {
      toast.error('Name must be at least 2 characters long');
      return;
    }

    if (name.length > 50) {
      toast.error('Name must be less than 50 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      addTask(taskType, { name });
      
      // Show success feedback
      toast.success(`${entityName} "${name}" added to queue!`, {
        icon: '🚀',
        duration: 3000,
      });
      
      setName(''); // Clear form
    } catch (error) {
      toast.error('Failed to add to queue. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <Card className={cn(
      "max-w-md mx-auto shadow-xl border-2 transition-all duration-300 hover:shadow-2xl",
      config.borderColor,
      "bg-gradient-to-br from-white to-slate-50/50 dark:from-gray-900 dark:to-gray-800/20"
    )}>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-3 rounded-xl bg-gradient-to-r",
            config.color,
            "shadow-lg"
          )}>
            <EntityIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              Create {entityName}
            </CardTitle>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {config.description}
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Input */}
          <div className="space-y-3">
            <Label 
              htmlFor="name" 
              className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2"
            >
              <Hash className="h-4 w-4 text-slate-400" />
              {entityName} Name *
            </Label>
            
            <div className="relative">
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={config.placeholder}
                required
                disabled={isSubmitting}
                className={cn(
                  "h-12 text-lg pl-10 pr-4 border-2 transition-all duration-200",
                  "border-slate-200 dark:border-gray-600",
                  "focus:border-blue-500 dark:focus:border-blue-400",
                  "focus:ring-2 focus:ring-blue-500/20",
                  name && "border-green-300 dark:border-green-500",
                  isSubmitting && "opacity-60 cursor-not-allowed"
                )}
                maxLength={50}
              />
              
              <EntityIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              
              {/* Character counter */}
              {name.length > 0 && (
                <div className={cn(
                  "absolute right-3 top-1/2 transform -translate-y-1/2 text-xs",
                  name.length > 40 ? "text-amber-600" : "text-slate-400"
                )}>
                  {name.length}/50
                </div>
              )}
            </div>

            {/* Validation hints */}
            <div className="space-y-1">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                • Name must be 2-50 characters long
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                • Use descriptive, unique names
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={!name.trim() || name.length < 2 || isSubmitting}
            className={cn(
              "w-full h-12 text-base font-semibold transition-all duration-200",
              "bg-gradient-to-r shadow-lg hover:shadow-xl",
              config.color,
              "hover:scale-[1.02] active:scale-[0.98]",
              (!name.trim() || name.length < 2) && 
                "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed hover:scale-100"
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Adding to Queue...
              </>
            ) : (
              <>
                <Plus className="h-5 w-5 mr-2" />
                Add to Task Queue
              </>
            )}
          </Button>

          {/* Success State Preview */}
          {name.length >= 2 && (
            <div className={cn(
              "p-3 rounded-lg border-2 transition-all duration-300",
              config.bgColor,
              config.borderColor
            )}>
              <div className="flex items-center gap-2 text-sm">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Ready to create:
                </span>
                <span className="text-slate-600 dark:text-slate-400 truncate">
                  "{name}"
                </span>
              </div>
            </div>
          )}

          {/* Helper Text */}
          <div className="text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              This {entityName.toLowerCase()} will be processed through the real-time task queue
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
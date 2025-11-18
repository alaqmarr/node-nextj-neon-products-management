import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { api } from '../lib/axios';

// 1. Definte Types
export type TaskStatus = 'queued' | 'processing' | 'success' | 'error';

export type TaskType =
  | 'create-brand'
  | 'create-category'
  | 'create-purpose' // <-- Added
  | 'create-product'
  | 'update-product-name';

// ... (Interface Task remains the same) ...
export interface Task {
  id: string;
  type: TaskType;
  payload: any;
  status: TaskStatus;
  error?: string;
  createdAt: number;
}

// 2. Define State and Actions
interface TaskStoreState {
  tasks: Task[];
  isProcessing: boolean;
  addTask: (type: TaskType, payload: any) => void;
  _processQueue: () => Promise<void>;
  _executeTask: (task: Task) => Promise<any>;
  _updateTaskStatus: (
    taskId: string,
    status: TaskStatus,
    error?: string
  ) => void;
  _handleWebSocketUpdate: (data: {
    taskId: string;
    status: TaskStatus;
    error?: string;
  }) => void;
}

// 3. Create Store
export const useTaskStore = create<TaskStoreState>((set, get) => ({
  tasks: [],
  isProcessing: false,

  addTask: (type, payload) => {
    const newTask: Task = {
      id: uuidv4(),
      type,
      payload,
      status: 'queued',
      createdAt: Date.now(),
    };
    set((state) => ({ tasks: [newTask, ...state.tasks] }));
    if (!get().isProcessing) {
      get()._processQueue();
    }
  },

  _processQueue: async () => {
    const { tasks, _executeTask, _updateTaskStatus } = get();
    const nextTask = tasks.find((t) => t.status === 'queued');

    if (!nextTask) {
      set({ isProcessing: false });
      return;
    }

    set({ isProcessing: true });
    _updateTaskStatus(nextTask.id, 'processing');

    try {
      await _executeTask(nextTask);
    } catch (axiosError: any) {
      const errorMsg =
        axiosError.response?.data?.error ||
        axiosError.message ||
        'Network error';
      get()._handleWebSocketUpdate({
        taskId: nextTask.id,
        status: 'error',
        error: errorMsg,
      });
    }
  },

  /**
   * Internal: Maps task types to API calls.
   */
  _executeTask: async (task: Task) => {
    const payloadWithId = { ...task.payload, taskId: task.id };

    switch (task.type) {
      case 'create-brand':
        return api.post('/brands', payloadWithId);
      
      case 'create-category': // <-- Added
        return api.post('/categories', payloadWithId);

      case 'create-purpose': // <-- Added
        return api.post('/purposes', payloadWithId);

      case 'create-product':
        const formData = new FormData();
        formData.append('name', task.payload.name);
        formData.append('image', task.payload.imageFile);
        formData.append('taskId', task.id);
        // Link Brand, Category, Purpose IDs
        if (task.payload.categoryId) formData.append('categoryId', task.payload.categoryId);
        if (task.payload.brandId) formData.append('brandId', task.payload.brandId);
        if (task.payload.purposeId) formData.append('purposeId', task.payload.purposeId);
        
        return api.post('/products', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

      case 'update-product-name':
        return api.put(
          `/products/${task.payload.productId}/name`,
          payloadWithId
        );

      default:
        console.error(`Unknown task type: ${task.type}`);
        return Promise.reject(new Error(`Unknown task type: ${task.type}`));
    }
  },
  
  // ... (rest of the store remains the same) ...
  _updateTaskStatus: (taskId, status, error) => {
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, status, error: error || undefined } : t
      ),
    }));
  },

  _handleWebSocketUpdate: ({ taskId, status, error }) => {
    get()._updateTaskStatus(taskId, status, error);
    if (status === 'success' || status === 'error') {
      get()._processQueue();
    }
  },
}));
// store/taskStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { api } from '../lib/axios';

// 1. Define Types
export type TaskStatus = 'queued' | 'processing' | 'success' | 'error';

export type TaskType =
  | 'create-brand'
  | 'create-category'
  | 'create-purpose'
  | 'create-product'
  | 'update-product-name';

export interface Task {
  id: string;
  type: TaskType;
  payload: any;
  status: TaskStatus;
  result?: any;
  entity?: string;
  error?: string;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
}

// 2. Define State and Actions - UPDATED INTERFACE
interface TaskStoreState {
  tasks: Task[];
  isProcessing: boolean;
  wsConnected: boolean;
  addTask: (type: TaskType, payload: any) => void;
  _processQueue: () => Promise<void>;
  _executeTask: (task: Task) => Promise<any>;
  _updateTaskStatus: (
    taskId: string,
    status: TaskStatus,
    result?: any,
    error?: string
  ) => void;
  _handleWebSocketUpdate: (data: {
    taskId: string;
    status: TaskStatus;
    result?: any;
    error?: string;
  }) => void;
  setWsConnected: (connected: boolean) => void;
  clearCompletedTasks: () => void;
  getTaskStats: () => {
    total: number;
    queued: number;
    processing: number;
    success: number;
    error: number;
  };
  // ADD THE MISSING METHODS:
  _persistTaskToBackend: (task: Task) => Promise<void>;
  _updateTaskInBackend: (taskId: string, updateData: Partial<Task>) => Promise<void>;
  syncTasksFromBackend: () => Promise<void>;
}

// 3. Create Store with Persistence
export const useTaskStore = create<TaskStoreState>()(
  persist(
    (set, get) => ({
      tasks: [],
      isProcessing: false,
      wsConnected: false,

      addTask: (type, payload) => {
        const newTask: Task = {
          id: uuidv4(),
          type,
          payload,
          status: 'queued',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          entity: type.split('-')[1] // Extract entity from task type
        };
        
        console.log('🆕 Adding new task:', newTask);
        
        set((state) => ({ 
          tasks: [newTask, ...state.tasks].slice(0, 1000)
        }));
        
        // Send task to backend for persistence
        get()._persistTaskToBackend(newTask);
        
        if (!get().isProcessing) {
          get()._processQueue();
        }
      },

      _persistTaskToBackend: async (task: Task) => {
        try {
          console.log('💾 Persisting task to backend:', task.id);
          await api.post('/tasks', task);
        } catch (error) {
          console.error('❌ Failed to persist task to backend:', error);
          // You might want to queue this for retry
        }
      },

      _processQueue: async () => {
        const { tasks, _executeTask } = get();
        const nextTask = tasks.find((t) => t.status === 'queued');

        if (!nextTask) {
          console.log('✅ No tasks in queue');
          set({ isProcessing: false });
          return;
        }

        console.log('⚡ Processing task:', nextTask.id);
        set({ isProcessing: true });
        get()._updateTaskStatus(nextTask.id, 'processing');

        try {
          await _executeTask(nextTask);
          // WebSocket will handle the final status update from backend
        } catch (axiosError: any) {
          console.error('❌ Task execution failed:', axiosError);
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

      _executeTask: async (task: Task) => {
        const payloadWithId = { ...task.payload, taskId: task.id };

        switch (task.type) {
          case 'create-brand':
            return api.post('/brands', payloadWithId);
          
          case 'create-category':
            return api.post('/categories', payloadWithId);

          case 'create-purpose':
            return api.post('/purposes', payloadWithId);

          case 'create-product':
            const formData = new FormData();
            formData.append('name', task.payload.name);
            formData.append('image', task.payload.imageFile);
            formData.append('taskId', task.id);
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
            console.error(`❌ Unknown task type: ${task.type}`);
            return Promise.reject(new Error(`Unknown task type: ${task.type}`));
        }
      },
      
      _updateTaskStatus: (taskId, status, result, error) => {
        console.log('🔄 Updating task status:', { taskId, status, error });
        
        const updateData: Partial<Task> = {
          status,
          updatedAt: Date.now(),
          ...(result && { result }),
          ...(error && { error }),
        };

        if (status === 'success' || status === 'error') {
          updateData.completedAt = Date.now();
        }

        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId ? { ...t, ...updateData } : t
          ),
        }));

        // Update backend if it's a final state
        if (status === 'success' || status === 'error') {
          get()._updateTaskInBackend(taskId, updateData);
        }
      },

      _updateTaskInBackend: async (taskId: string, updateData: Partial<Task>) => {
        try {
          console.log('💾 Updating task in backend:', taskId);
          await api.patch(`/tasks/${taskId}`, updateData);
        } catch (error) {
          console.error('❌ Failed to update task in backend:', error);
        }
      },

      _handleWebSocketUpdate: ({ taskId, status, result, error }) => {
        console.log('📡 WebSocket update received:', { taskId, status, error });
        get()._updateTaskStatus(taskId, status, result, error);
        
        // Continue processing queue if this task completed
        if (status === 'success' || status === 'error') {
          setTimeout(() => get()._processQueue(), 100);
        }
      },

      setWsConnected: (connected: boolean) => {
        console.log('🔗 WebSocket connection state:', connected);
        set({ wsConnected: connected });
      },

      clearCompletedTasks: () => {
        console.log('🧹 Clearing completed tasks');
        set((state) => ({
          tasks: state.tasks.filter(task => 
            task.status === 'queued' || task.status === 'processing'
          )
        }));
      },

      getTaskStats: () => {
        const tasks = get().tasks;
        const stats = {
          total: tasks.length,
          queued: tasks.filter(t => t.status === 'queued').length,
          processing: tasks.filter(t => t.status === 'processing').length,
          success: tasks.filter(t => t.status === 'success').length,
          error: tasks.filter(t => t.status === 'error').length,
        };
        console.log('📊 Task stats:', stats);
        return stats;
      },

      // New method to sync tasks from backend
      syncTasksFromBackend: async () => {
        try {
          console.log('🔄 Syncing tasks from backend');
          const response = await api.get('/tasks');
          const backendTasks = response.data;
          
          set((state) => ({
            tasks: [...backendTasks, ...state.tasks.filter(t => 
              !backendTasks.some((bt:any) => bt.id === t.id)
            )].slice(0, 1000)
          }));
        } catch (error) {
          console.error('❌ Failed to sync tasks from backend:', error);
        }
      },
    }),
    {
      name: 'task-store',
      version: 1,
      partialize: (state) => ({ 
        tasks: state.tasks 
      }),
    }
  )
);
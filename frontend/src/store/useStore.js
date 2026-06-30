import { create } from 'zustand';

export const useStore = create((set, get) => ({
  // Active Leads & Search Cache
  leads: [],
  setLeads: (leads) => set({ leads }),
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  
  // Pipeline State & Optimistic UI Moves
  pipeline: {},
  setPipeline: (pipeline) => set({ pipeline }),
  pipelineAnalytics: null,
  setPipelineAnalytics: (analytics) => set({ pipelineAnalytics: analytics }),
  moveLeadOptimistic: (leadId, sourceStage, targetStage) => {
    const { pipeline } = get();
    if (!pipeline[sourceStage] || sourceStage === targetStage) return;

    const leadToMove = pipeline[sourceStage].find(l => l.id === leadId);
    if (!leadToMove) return;

    const updatedSource = pipeline[sourceStage].filter(l => l.id !== leadId);
    const updatedLead = { ...leadToMove, pipeline_stage: targetStage };
    const updatedTarget = [updatedLead, ...(pipeline[targetStage] || [])];

    set({
      pipeline: {
        ...pipeline,
        [sourceStage]: updatedSource,
        [targetStage]: updatedTarget,
      }
    });
  },

  // Notification Feed State
  notifications: [],
  setNotifications: (notifications) => set({ notifications }),
  addNotification: (notification) => set((state) => {
    // Avoid duplicates by tracking ID
    const exists = state.notifications.some(n => n.id === notification.id);
    if (exists) return {};
    return { notifications: [notification, ...state.notifications] };
  }),
  markNotificationAsRead: (id) => set((state) => ({
    notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
  })),

  // Global Activity Logs Telemetry
  activities: [],
  setActivities: (activities) => set({ activities }),
  addActivity: (activity) => set((state) => ({
    activities: [activity, ...state.activities]
  })),

  // Live Socket Connection Reference
  socket: null,
  setSocket: (socket) => set({ socket }),

  // Shared UX State & Telemetry Loaders
  loading: {},
  setLoading: (key, isLoading) => set((state) => ({
    loading: { ...state.loading, [key]: isLoading }
  })),
  error: null,
  setError: (error) => set({ error }),
}));

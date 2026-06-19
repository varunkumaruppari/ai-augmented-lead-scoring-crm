import api from './api';

export const getLeads = (params) => api.get('/leads', { params });
export const getLead = (id) => api.get(`/leads/${id}`);
export const createLead = (data) => api.post('/leads', data);
export const updateLead = (id, data) => api.put(`/leads/${id}`, data);
export const deleteLead = (id) => api.delete(`/leads/${id}`);
export const assignLead = (id, agent_id) => api.post(`/leads/${id}/assign`, { agent_id });
export const addActivity = (id, data) => api.post(`/leads/${id}/activities`, data);
export const getActivities = (id) => api.get(`/leads/${id}/activities`);
export const getScoreHistory = (id) => api.get(`/leads/${id}/score-history`);
export const getFollowUps = (id) => api.get(`/leads/${id}/follow-ups`);
export const createFollowUp = (id, data) => api.post(`/leads/${id}/follow-ups`, data);
export const completeFollowUp = (leadId, fid, outcome) => api.post(`/leads/${leadId}/follow-ups/${fid}/complete`, { outcome });
export const getDashboard = () => api.get('/leads/dashboard/summary');
export const getAnalytics = () => api.get('/leads/analytics');
export const getIntelligenceSummary = () => api.get('/intelligence/summary');
export const getLeadIntelligence = (leadId) => api.get(`/intelligence/${leadId}`);
export const getPipeline = () => api.get('/pipeline');
export const movePipelineLead = (leadId, stage) => api.put('/pipeline/move', { leadId, stage });
export const getPipelineAnalytics = () => api.get('/pipeline/analytics');
export const getGlobalActivities = (params) => api.get('/activities', { params });
export const getAgentPerformance = () => api.get('/agents/performance');
export const getAllFollowUps = (params) => api.get('/followups', { params });
export const createFollowUpDirect = (data) => api.post('/followups', data);
export const updateFollowUp = (id, data) => api.put(`/followups/${id}`, data);
export const completeFollowUpDirect = (id, outcome) => api.put(`/followups/${id}/complete`, { outcome });

export const getLeadAIInsights = (leadId) => api.get(`/intelligence/ai/${leadId}`);
export const regenerateLeadAIInsights = (leadId) => api.post(`/intelligence/ai/${leadId}/regenerate`);
export const getGlobalAIInsights = () => api.get('/intelligence/ai/global');

export const getRevenueAnalytics = () => api.get('/analytics/revenue');
export const getLeadAnalyticsList = () => api.get('/analytics/leads');
export const getSourceAnalyticsList = () => api.get('/analytics/sources');
export const getAgentAnalyticsList = () => api.get('/analytics/agents');
export const getForecastAnalytics = () => api.get('/analytics/forecast');
export const getInsightsAnalytics = () => api.get('/analytics/insights');

export const getReportCenterMetadata = () => api.get('/reports');
export const generateReport = (data) => api.post('/reports/generate', data);
export const scheduleReport = (data) => api.post('/reports/schedule', data);
export const getReportHistory = () => api.get('/reports/history');
export const getExecutiveSummaryAI = () => api.get('/reports/executive-summary');

// ─── PHASE 9: Admin & Settings API ────────────────────────────────────────────
export const getSystemHealth   = () => api.get('/admin/system-health');
export const getAuditLogs      = (params) => api.get('/admin/audit-logs', { params });
export const getMetrics        = () => api.get('/admin/metrics');
export const getSystemStatus   = () => api.get('/admin/status');

export const getAdminSettings  = () => api.get('/settings');
export const updateAdminSettings = (entries) => api.put('/settings', entries);

import { api } from './api';

export const studentService = {
  async getDashboard() {
    try {
      return await api.get('/student/dashboard');
    } catch (err) {
      console.warn('Backend API unavailable, using fallback empty state:', err.message);
      return {
        user: null,
        stats: { projectsCount: 0, totalTasks: 0, completedTasks: 0, pendingTasks: 0, collaborationScore: null },
        projects: [],
        recentActivities: []
      };
    }
  },

  async getProjects() {
    try {
      return await api.get('/student/projects');
    } catch (err) {
      return [];
    }
  },

  async getTasks() {
    try {
      return await api.get('/student/tasks');
    } catch (err) {
      return [];
    }
  },

  async updateTaskStatus(taskId, status) {
    try {
      return await api.put(`/student/tasks/${taskId}`, { status });
    } catch (err) {
      throw err;
    }
  },

  async submitTask(taskId, notes) {
    try {
      return await api.post('/student/tasks/submit', { taskId, notes });
    } catch (err) {
      throw err;
    }
  },

  async getActivity() {
    try {
      return await api.get('/student/activity');
    } catch (err) {
      return [];
    }
  },

  async logActivity(type, description, scoreChange = 0) {
    try {
      return await api.post('/activities', { type, description, scoreChange });
    } catch (err) {
      throw err;
    }
  },

  async getDiscussions() {
    try {
      return await api.get('/student/discussions');
    } catch (err) {
      return [];
    }
  },

  async getDiscussionProjects() {
    try {
      return await api.get('/student/discussions/projects');
    } catch (err) {
      return [];
    }
  },

  async getProjectDiscussion(projectId) {
    try {
      return await api.get(`/student/discussions/projects/${projectId}`);
    } catch (err) {
      throw err;
    }
  },

  async postProjectMessage(projectId, message, attachmentUrl = null) {
    try {
      return await api.post(`/student/discussions/projects/${projectId}`, { message, attachmentUrl });
    } catch (err) {
      throw err;
    }
  },

  async postDiscussion(message, attachmentUrl = null) {
    try {
      return await api.post('/student/discussions', { message, attachmentUrl });
    } catch (err) {
      throw err;
    }
  },

  async getScore() {
    try {
      return await api.get('/student/score');
    } catch (err) {
      return { score: null, breakdown: { taskContribution: 0, participationRate: 0, communicationSentiment: 0, peerFeedback: 0 } };
    }
  },

  async getAnalytics() {
    try {
      return await api.get('/student/analytics');
    } catch (err) {
      return { trendData: [], radarData: [], activityData: [] };
    }
  },

  async getAIInsights() {
    try {
      return await api.get('/student/ai-insights');
    } catch (err) {
      return { insights: null };
    }
  },

  async runAIAnalysis() {
    try {
      return await api.post('/student/ai-insights/analyze', {});
    } catch (err) {
      throw err;
    }
  },

  async getNotifications() {
    try {
      return await api.get('/student/notifications');
    } catch (err) {
      return [];
    }
  }
};

export default studentService;

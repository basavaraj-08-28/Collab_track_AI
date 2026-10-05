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

  async getProjectById(projectId) {
    try {
      return await api.get(`/student/projects/${projectId}`);
    } catch (err) {
      throw err;
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

  async submitTask(taskId, notes = '', submissionFile = null) {
    try {
      const fileName = typeof submissionFile === 'string' 
        ? submissionFile 
        : (submissionFile?.name || null);
      return await api.post('/student/tasks/submit', { taskId, notes, submissionFile: fileName });
    } catch (err) {
      throw err;
    }
  },

  async getActivity(filter = 'All') {
    try {
      const query = filter && filter !== 'All' ? `?filter=${encodeURIComponent(filter)}` : '';
      return await api.get(`/student/activity${query}`);
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

  async sendDiscussionHeartbeat(projectId) {
    try {
      return await api.post(`/student/discussions/projects/${projectId}/heartbeat`, {});
    } catch (err) {
      // Ignore heartbeat errors silently
      return null;
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

  async getAnalytics(range = 'Last 30 days') {
    try {
      const query = range ? `?range=${encodeURIComponent(range)}` : '';
      return await api.get(`/student/analytics${query}`);
    } catch (err) {
      return { 
        weeklyParticipation: [], 
        taskCompletion: [], 
        scoreTrend: [], 
        communicationQuality: [], 
        activityDistribution: [],
        summary: null
      };
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
  },

  async chatWithAI(message) {
    try {
      return await api.post('/student/ai/chat', { message });
    } catch (err) {
      throw err;
    }
  }
};

export default studentService;

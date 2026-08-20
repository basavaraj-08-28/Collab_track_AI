import { api } from './api';

export const instructorService = {
  async getDashboard() {
    try {
      return await api.get('/instructor/dashboard');
    } catch (err) {
      console.warn('Backend API unavailable, using fallback empty state:', err.message);
      return {
        stats: { activeProjects: 0, totalStudents: 0, avgCollaborationScore: null, atRiskStudents: 0 },
        projects: []
      };
    }
  },

  async getProjects() {
    try {
      return await api.get('/instructor/projects');
    } catch (err) {
      return [];
    }
  },

  async getProjectById(projectId) {
    try {
      const projects = await this.getProjects();
      const proj = (projects || []).find((p) => String(p.id) === String(projectId));
      if (!proj) return null;
      const members = await this.getProjectMembers(projectId);
      return {
        ...proj,
        members: members || []
      };
    } catch (err) {
      return null;
    }
  },

  async createProject(projectData) {
    try {
      return await api.post('/instructor/projects', projectData);
    } catch (err) {
      throw err;
    }
  },

  async updateProject(projectId, updateData) {
    try {
      return await api.put(`/instructor/projects/${projectId}`, updateData);
    } catch (err) {
      throw err;
    }
  },

  async deleteProject(projectId) {
    try {
      return await api.delete(`/instructor/projects/${projectId}`);
    } catch (err) {
      throw err;
    }
  },

  async getGroups() {
    try {
      return await api.get('/groups');
    } catch (err) {
      return [];
    }
  },

  async createGroup(groupData) {
    try {
      return await api.post('/groups', groupData);
    } catch (err) {
      throw err;
    }
  },

  async getStudents() {
    try {
      return await api.get('/instructor/students');
    } catch (err) {
      return [];
    }
  },

  async addStudent(studentData) {
    try {
      return await api.post('/instructor/students', studentData);
    } catch (err) {
      throw err;
    }
  },

  async assignProject(studentId, projectId) {
    try {
      return await api.post('/instructor/students/assign', { studentId, projectId });
    } catch (err) {
      throw err;
    }
  },

  async getProjectMembers(projectId) {
    try {
      return await api.get(`/instructor/projects/${projectId}/members`);
    } catch (err) {
      return [];
    }
  },

  async getProjectTasks(projectId) {
    try {
      return await api.get(`/instructor/projects/${projectId}/tasks`);
    } catch (err) {
      return [];
    }
  },

  async createProjectTask(projectId, taskData) {
    try {
      return await api.post(`/instructor/projects/${projectId}/tasks`, taskData);
    } catch (err) {
      throw err;
    }
  },

  async updateTask(taskId, updateData) {
    try {
      return await api.put(`/instructor/tasks/${taskId}`, updateData);
    } catch (err) {
      throw err;
    }
  },

  async deleteTask(taskId) {
    try {
      return await api.delete(`/instructor/tasks/${taskId}`);
    } catch (err) {
      throw err;
    }
  },

  async assignTask(taskId, studentId) {
    try {
      return await api.post(`/instructor/tasks/${taskId}/assign`, { studentId });
    } catch (err) {
      throw err;
    }
  },

  async getAnalytics() {
    try {
      return await api.get('/instructor/analytics');
    } catch (err) {
      return [];
    }
  },

  async runAIGrading(projectId, weights) {
    try {
      return await api.post('/instructor/ai/grading', { projectId, weights });
    } catch (err) {
      throw err;
    }
  },

  async getReports() {
    try {
      return await api.get('/instructor/reports');
    } catch (err) {
      return [];
    }
  },

  async generateReport(reportType) {
    try {
      return await api.post('/instructor/reports', { reportType });
    } catch (err) {
      throw err;
    }
  },

  async getNotifications() {
    try {
      return await api.get('/instructor/notifications');
    } catch (err) {
      return [];
    }
  }
};

export default instructorService;

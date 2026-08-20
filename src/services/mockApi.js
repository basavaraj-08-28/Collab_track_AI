import { studentService } from './studentService';
import { instructorService } from './instructorService';

export const mockApi = {
  // Authentication & Profile
  async login(email, password, role = 'student') {
    if (role === 'instructor') {
      const prof = await instructorService.getProfile();
      return { success: true, user: prof, token: 'jwt-instructor-session' };
    }
    const prof = await studentService.getProfile();
    return { success: true, user: prof, token: 'jwt-student-session' };
  },

  async getProfile(role = 'student') {
    return role === 'instructor' ? instructorService.getProfile() : studentService.getProfile();
  },

  // Student Endpoints
  async getStudentDashboard() {
    return studentService.getDashboard();
  },

  async getProjects() {
    return studentService.getProjects();
  },

  async getProjectById(id) {
    return studentService.getProjectById(id);
  },

  async getTasks(filterStatus = 'All') {
    return studentService.getTasks(filterStatus);
  },

  async getCollaborationActivity(filter = 'All') {
    return studentService.getActivity(filter);
  },

  async getMessages(projectId = null) {
    return studentService.getDiscussions(projectId);
  },

  async sendMessage(content, user = 'Student', channel = '#general') {
    return studentService.postDiscussionMessage(content, channel, user);
  },

  async getCollaborationScore() {
    return studentService.getScore();
  },

  async getAnalytics(dateRange = 'Last 30 days') {
    return studentService.getAnalytics(dateRange);
  },

  async getAIInsights() {
    return studentService.getAIInsights();
  },

  async triggerAIAnalysis() {
    return studentService.triggerAIAnalysis();
  },

  // Instructor Endpoints
  async getInstructorDashboard() {
    return instructorService.getDashboard();
  },

  async getInstructorProjects() {
    return instructorService.getProjects();
  },

  async createInstructorProject(projectData) {
    return instructorService.createProject(projectData);
  },

  async getInstructorGroups(projectId = null) {
    return instructorService.getGroups(projectId);
  },

  async createInstructorGroup(groupData) {
    return instructorService.createGroup(groupData);
  },

  async getInstructorStudents() {
    return instructorService.getStudents();
  },

  async addInstructorStudent(studentData) {
    return instructorService.addStudent(studentData);
  },

  async getInstructorContributions() {
    return instructorService.getContributions();
  },

  async getGroupComparison() {
    return instructorService.getGroups();
  },

  async runAIGrading(projectId = null) {
    return instructorService.runAIGrading(projectId);
  },

  async getInstructorReports() {
    return instructorService.getReports();
  },

  async generateInstructorReport(type) {
    return instructorService.generateReport(type);
  },

  async getNotifications(role = 'student') {
    return role === 'instructor' ? instructorService.getNotifications() : studentService.getNotifications();
  }
};

export default mockApi;

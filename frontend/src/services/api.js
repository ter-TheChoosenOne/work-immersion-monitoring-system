import axios from "axios";

const API = axios.create({
  baseURL: "https://work-immersion-monitoring-system.onrender.com", // change if deployed
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Admin API instance
const AdminAPI = axios.create({
  baseURL: "https://work-immersion-monitoring-system.onrender.com",
});

AdminAPI.interceptors.request.use((config) => {
  const adminToken = localStorage.getItem("adminToken");

  if (adminToken) {
    config.headers.Authorization = `Bearer ${adminToken}`;
  }

  return config;
});

export const registerUser = (data) => API.post("/auth/register", data);
export const loginUser = (data) => API.post("/auth/login", data);
export const adminLoginUser = (data) => API.post("/auth/admin/login", data);
export const forgotPasswordUser = (data) => API.post("/auth/forgot-password", data);
export const resetPasswordUser = (data) => API.post("/auth/reset-password", data);

export const getStudentProfile = () => API.get("/student/me");
export const updateStudentProfile = (data) =>
  API.put("/student/me", data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
export const timeInStudent = () => API.post("/student/time-in");
export const timeOutStudent = () => API.post("/student/time-out");
export const getStudentAttendance = () => API.get("/student/attendance");
export const getStudentAttendanceSession = () => API.get("/student/attendance/session");
export const getStudentReports = () => API.get("/student/reports");
export const createStudentReport = (data) =>
  API.post("/student/reports", data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
export const updateStudentReport = (id, data) =>
  API.put(`/student/reports/${id}`, data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
export const submitStudentReport = (id) => API.post(`/student/reports/${id}/submit`);
export const deleteStudentReport = (id) => API.delete(`/student/reports/${id}`);

export const getTeacherProfile = () => API.get("/teacher/me");
export const updateTeacherProfile = (data) => API.put("/teacher/me", data);
export const getTeacherStudents = () => API.get("/teacher/students");
export const getTeacherStudentById = (id) => API.get(`/teacher/students/${id}`);
export const startAMAttendance = () => API.post("/teacher/attendance/start-am");
export const startPMAttendance = () => API.post("/teacher/attendance/start-pm");
export const closeTeacherAttendance = () => API.post("/teacher/attendance/close");
export const getTeacherAttendance = (params) => API.get("/teacher/attendance", { params });
export const deleteAttendance = (id) => API.delete("/teacher/attendance", { params: { id } });
export const deleteAllAttendance = () => API.delete("/teacher/attendance", { params: { deleteAll: true } });
export const getActiveAttendanceSession = () => API.get("/teacher/attendance/session");
export const getNotifications = () => API.get("/notifications");
export const markNotificationRead = (id) => API.put(`/notifications/read/${id}`);

export const getTeacherReports = (params) => API.get("/teacher/reports", { params });
export const getTeacherStudentReports = (id) => API.get(`/teacher/students/${id}/reports`);
export const approveStudent = (studentId) => API.post(`/teacher/students/${studentId}/approve`);
export const rejectStudent = (studentId) => API.post(`/teacher/students/${studentId}/reject`);
// Temporarily mock for testing - replace with API.post when backend is fixed
export const gradeReport = (reportId, grade) => {
  console.log('Mock grading report', reportId, 'with grade', grade);
  return Promise.resolve({ message: 'Mock success' });
};

// Admin API functions
export const getAllUsers = (params) => AdminAPI.get("/admin/users", { params });
export const getAllStudents = () => AdminAPI.get("/admin/students");
export const getAllTeachers = () => AdminAPI.get("/admin/teachers");
export const updateUser = (id, data) => AdminAPI.put(`/admin/users/${id}`, data);
export const deleteUser = (id) => AdminAPI.delete(`/admin/users/${id}`);
export const getAttendanceReports = (params) => AdminAPI.get("/admin/attendance/reports", { params });
export const getAttendanceSummary = (params) => AdminAPI.get("/admin/attendance/summary", { params });

export default API;

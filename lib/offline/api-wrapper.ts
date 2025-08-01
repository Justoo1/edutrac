// lib/offline/api-wrapper.ts
import { offlineStorage } from './storage';
import { syncManager } from './sync-manager';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  offline?: boolean;
  queued?: boolean;
  requestId?: string;
}

export class OfflineApiWrapper {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  // Generic request handler with offline support
  async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const { method = 'GET', headers = {}, body } = options;

    try {
      if (navigator.onLine) {
        // Online: attempt network request
        const response = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
        });

        if (response.ok) {
          const data = await response.json();
          
          // Cache successful GET responses
          if (method === 'GET') {
            await offlineStorage.cacheApiResponse(url, data, 30); // 30 min TTL
          }
          
          // Update local storage for data mutations
          if (['POST', 'PUT', 'PATCH'].includes(method) && data) {
            await this.updateLocalStorage(endpoint, method, data);
          }

          return { success: true, data };
        } else {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
      } else {
        // Offline: handle based on method
        return await this.handleOfflineRequest<T>(url, method, headers, body);
      }
    } catch (error) {
      console.error('API request failed:', error);
      
      // Try to recover from cache for GET requests
      if (method === 'GET') {
        const cachedData = await offlineStorage.getCachedApiResponse(url);
        if (cachedData) {
          return { 
            success: true, 
            data: cachedData, 
            offline: true 
          };
        }
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        offline: !navigator.onLine
      };
    }
  }

  private async handleOfflineRequest<T>(
    url: string,
    method: string,
    headers: any,
    body: any
  ): Promise<ApiResponse<T>> {
    if (method === 'GET') {
      // Try to serve from cache
      const cachedData = await offlineStorage.getCachedApiResponse(url);
      if (cachedData) {
        return { 
          success: true, 
          data: cachedData, 
          offline: true 
        };
      } else {
        return {
          success: false,
          error: 'No cached data available for offline request',
          offline: true
        };
      }
    } else {
      // Queue non-GET requests for later sync
      const requestId = await syncManager.queueRequest(
        url,
        method,
        headers,
        body ? JSON.stringify(body) : null
      );

      // For offline mutations, optimistically update local storage
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        await this.handleOptimisticUpdate(url, method, body);
      }

      return {
        success: true,
        queued: true,
        requestId,
        offline: true,
        data: body // Return the sent data for optimistic UI updates
      };
    }
  }

  private async updateLocalStorage(endpoint: string, method: string, data: any): Promise<void> {
    const segments = endpoint.split('/').filter(Boolean);
    
    if (segments.length === 0) return;
    
    const resource = segments[0]; // students, staff, classes, etc.
    const validResources = ['students', 'staff', 'classes', 'subjects', 'attendance', 'exams', 'grades'];
    
    if (!validResources.includes(resource)) return;

    try {
      if (method === 'POST' && data.id) {
        await offlineStorage.storeData(resource as any, data.id, data);
      } else if (['PUT', 'PATCH'].includes(method) && data.id) {
        await offlineStorage.storeData(resource as any, data.id, data);
      } else if (method === 'DELETE' && segments.length > 1) {
        const id = segments[1];
        await offlineStorage.deleteData(resource as any, id);
      }
    } catch (error) {
      console.warn('Failed to update local storage:', error);
    }
  }

  private async handleOptimisticUpdate(url: string, method: string, body: any): Promise<void> {
    const urlObj = new URL(url, window.location.origin);
    const segments = urlObj.pathname.split('/').filter(Boolean);
    
    if (segments.length < 2) return; // Need at least /api/resource
    
    const resource = segments[1]; // Skip 'api'
    const validResources = ['students', 'staff', 'classes', 'subjects', 'attendance', 'exams', 'grades'];
    
    if (!validResources.includes(resource)) return;

    try {
      if (method === 'POST') {
        // Create optimistic ID for new records
        const optimisticId = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const optimisticData = { ...body, id: optimisticId, _offline: true };
        await offlineStorage.storeData(resource as any, optimisticId, optimisticData);
      } else if (['PUT', 'PATCH'].includes(method) && segments.length > 2) {
        const id = segments[2];
        const existingData = await offlineStorage.getData(resource as any, id);
        const updatedData = { ...existingData, ...body, _offline: true };
        await offlineStorage.storeData(resource as any, id, updatedData);
      } else if (method === 'DELETE' && segments.length > 2) {
        const id = segments[2];
        await offlineStorage.deleteData(resource as any, id);
      }
    } catch (error) {
      console.warn('Failed to perform optimistic update:', error);
    }
  }

  // Specific methods for common operations
  async getStudents(schoolId?: string): Promise<ApiResponse<any[]>> {
    const endpoint = schoolId ? `/students?schoolId=${schoolId}` : '/students';
    return this.request(endpoint);
  }

  async createStudent(studentData: any): Promise<ApiResponse<any>> {
    return this.request('/students', {
      method: 'POST',
      body: JSON.stringify(studentData),
    });
  }

  async updateStudent(id: string, studentData: any): Promise<ApiResponse<any>> {
    return this.request(`/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(studentData),
    });
  }

  async deleteStudent(id: string): Promise<ApiResponse<void>> {
    return this.request(`/students/${id}`, {
      method: 'DELETE',
    });
  }

  async getStaff(schoolId?: string): Promise<ApiResponse<any[]>> {
    const endpoint = schoolId ? `/staff?schoolId=${schoolId}` : '/staff';
    return this.request(endpoint);
  }

  async createStaff(staffData: any): Promise<ApiResponse<any>> {
    return this.request('/staff', {
      method: 'POST',
      body: JSON.stringify(staffData),
    });
  }

  async updateStaff(id: string, staffData: any): Promise<ApiResponse<any>> {
    return this.request(`/staff/${id}`, {
      method: 'PUT',
      body: JSON.stringify(staffData),
    });
  }

  async getClasses(schoolId?: string): Promise<ApiResponse<any[]>> {
    const endpoint = schoolId ? `/classes?schoolId=${schoolId}` : '/classes';
    return this.request(endpoint);
  }

  async createClass(classData: any): Promise<ApiResponse<any>> {
    return this.request('/classes', {
      method: 'POST',
      body: JSON.stringify(classData),
    });
  }

  async recordAttendance(attendanceData: any): Promise<ApiResponse<any>> {
    return this.request('/attendance', {
      method: 'POST',
      body: JSON.stringify(attendanceData),
    });
  }

  async getAttendance(classId: string, date: string): Promise<ApiResponse<any[]>> {
    return this.request(`/attendance?classId=${classId}&date=${date}`);
  }

  async createExam(examData: any): Promise<ApiResponse<any>> {
    return this.request('/exams', {
      method: 'POST',
      body: JSON.stringify(examData),
    });
  }

  async submitGrades(examId: string, grades: any[]): Promise<ApiResponse<any>> {
    return this.request(`/exams/${examId}/grades`, {
      method: 'POST',
      body: JSON.stringify({ grades }),
    });
  }

  async getExamResults(examId: string): Promise<ApiResponse<any[]>> {
    return this.request(`/exams/${examId}/results`);
  }

  // Bulk operations for initial data sync
  async syncAllData(schoolId: string): Promise<{
    students: ApiResponse<any[]>;
    staff: ApiResponse<any[]>;
    classes: ApiResponse<any[]>;
    subjects: ApiResponse<any[]>;
  }> {
    const [students, staff, classes, subjects] = await Promise.all([
      this.getStudents(schoolId),
      this.getStaff(schoolId),
      this.getClasses(schoolId),
      this.request(`/subjects?schoolId=${schoolId}`),
    ]);

    return { students, staff, classes, subjects };
  }

  // Get offline data directly
  async getOfflineStudents(): Promise<any[]> {
    return await offlineStorage.getAllData('students');
  }

  async getOfflineStaff(): Promise<any[]> {
    return await offlineStorage.getAllData('staff');
  }

  async getOfflineClasses(): Promise<any[]> {
    return await offlineStorage.getAllData('classes');
  }

  async getOfflineAttendance(): Promise<any[]> {
    return await offlineStorage.getAllData('attendance');
  }

  // Search offline data
  async searchOfflineStudents(query: string): Promise<any[]> {
    const students = await this.getOfflineStudents();
    const searchTerm = query.toLowerCase();
    
    return students.filter(student => 
      student.firstName?.toLowerCase().includes(searchTerm) ||
      student.lastName?.toLowerCase().includes(searchTerm) ||
      student.studentId?.toLowerCase().includes(searchTerm) ||
      student.email?.toLowerCase().includes(searchTerm)
    );
  }

  async searchOfflineStaff(query: string): Promise<any[]> {
    const staff = await this.getOfflineStaff();
    const searchTerm = query.toLowerCase();
    
    return staff.filter(member => 
      member.name?.toLowerCase().includes(searchTerm) ||
      member.staffId?.toLowerCase().includes(searchTerm) ||
      member.email?.toLowerCase().includes(searchTerm) ||
      member.position?.toLowerCase().includes(searchTerm)
    );
  }

  // Data validation for offline submissions
  validateStudentData(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!data.firstName) errors.push('First name is required');
    if (!data.lastName) errors.push('Last name is required');
    if (!data.studentId) errors.push('Student ID is required');
    if (!data.schoolId) errors.push('School ID is required');
    
    // Add more validation rules as needed
    
    return { valid: errors.length === 0, errors };
  }

  validateAttendanceData(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!data.studentId) errors.push('Student ID is required');
    if (!data.classId) errors.push('Class ID is required');
    if (!data.date) errors.push('Date is required');
    if (!data.status) errors.push('Attendance status is required');
    
    const validStatuses = ['present', 'absent', 'excused', 'late'];
    if (data.status && !validStatuses.includes(data.status)) {
      errors.push('Invalid attendance status');
    }
    
    return { valid: errors.length === 0, errors };
  }

  // Clear all offline data
  async clearAllOfflineData(): Promise<void> {
    const stores = ['students', 'staff', 'classes', 'subjects', 'attendance', 'exams', 'grades'];
    await Promise.all(stores.map(store => offlineStorage.clearStore(store as any)));
  }

  // Get sync statistics
  async getSyncStats(): Promise<{
    pendingSync: number;
    failedSync: number;
    lastSync: number | null;
    offlineDataCount: { [key: string]: number };
  }> {
    const storageInfo = await syncManager.getStorageInfo();
    
    return {
      pendingSync: storageInfo.pendingSync,
      failedSync: storageInfo.failedSync,
      lastSync: storageInfo.lastSyncAttempt,
      offlineDataCount: storageInfo.storageStats
    };
  }
}

// Singleton instance
export const offlineApi = new OfflineApiWrapper();

// Utility function to check if data is from offline source
export function isOfflineData(data: any): boolean {
  return data && (data._offline === true || data.id?.startsWith('offline_'));
}

// Utility function to merge online and offline data
export function mergeOnlineOfflineData<T extends { id: string }>(
  onlineData: T[],
  offlineData: T[]
): T[] {
  const merged = [...onlineData];
  const onlineIds = new Set(onlineData.map(item => item.id));
  
  // Add offline-only items
  offlineData.forEach(item => {
    if (!onlineIds.has(item.id)) {
      merged.push(item);
    }
  });
  
  return merged.sort((a, b) => {
    // Sort offline items to the end
    if (isOfflineData(a) && !isOfflineData(b)) return 1;
    if (!isOfflineData(a) && isOfflineData(b)) return -1;
    return 0;
  });
}
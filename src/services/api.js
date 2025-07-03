// Service pour gérer les appels API vers le backend
const API_URL = 'http://localhost:3000/api';

// Fonction helper pour les requêtes HTTP
async function httpRequest(endpoint, method = 'GET', data = null) {
  const url = `${API_URL}${endpoint}`;
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const config = {
    method,
    headers
  };
  
  if (data) {
    config.body = JSON.stringify(data);
  }
  
  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      // Si le token est invalide (401), déconnecter l'utilisateur
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }
      
      const error = await response.json();
      throw new Error(error.message || 'Une erreur est survenue');
    }
    
    // Pour les requêtes DELETE qui peuvent ne pas renvoyer de contenu
    if (method === 'DELETE' && response.status === 204) {
      return { success: true };
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Services d'authentification
export const authService = {
  login: (credentials) => httpRequest('/auth/login', 'POST', credentials),
  register: (userData) => httpRequest('/auth/register', 'POST', userData),
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
};

// Service de gestion des étudiants
export const studentService = {
  getAll: () => httpRequest('/students'),
  getById: (id) => httpRequest(`/students/${id}`),
  create: (student) => httpRequest('/students', 'POST', student),
  update: (id, student) => httpRequest(`/students/${id}`, 'PUT', student),
  delete: (id) => httpRequest(`/students/${id}`, 'DELETE')
};

// Service de gestion des formulaires
export const formService = {
  getAll: () => httpRequest('/forms'),
  getById: (id) => httpRequest(`/forms/${id}`),
  create: (form) => httpRequest('/forms', 'POST', form),
  update: (id, form) => httpRequest(`/forms/${id}`, 'PUT', form),
  delete: (id) => httpRequest(`/forms/${id}`, 'DELETE')
};

// Service de gestion des évaluations
export const evaluationService = {
  getAll: () => httpRequest('/evaluations'),
  getById: (id) => httpRequest(`/evaluations/${id}`),
  getByStudentId: (studentId) => httpRequest(`/evaluations/student/${studentId}`),
  getByFormId: (formId) => httpRequest(`/evaluations/form/${formId}`),
  create: (evaluation) => httpRequest('/evaluations', 'POST', evaluation),
  update: (id, evaluation) => httpRequest(`/evaluations/${id}`, 'PUT', evaluation),
  delete: (id) => httpRequest(`/evaluations/${id}`, 'DELETE'),
  exportCSV: (filters) => httpRequest('/evaluations/export', 'POST', filters)
};

// Service pour les statistiques du tableau de bord
export const statsService = {
  getDashboardStats: () => httpRequest('/stats/dashboard')
};

export default {
  auth: authService,
  students: studentService,
  forms: formService,
  evaluations: evaluationService,
  stats: statsService
};

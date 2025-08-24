import axios from 'axios'

const API_BASE_URL = (import.meta.env?.VITE_API_URL as string) || 'http://localhost:3001/api'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Ne pas rediriger si on est déjà sur la page de connexion
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user')
        window.location.href = '/login'
      }
    }
    
    // Ne pas afficher de toast ici car les mutations gèrent leurs propres erreurs
    // const message = error.response?.data?.error || 'Une erreur est survenue'
    // toast.error(message)
    
    return Promise.reject(error)
  }
)

// API Templates
export const templatesAPI = {
  getStatus: () => api.get('/templates/status'),
  downloadTemplate: (templateType: string) => 
    api.get(`/templates/${templateType}/download`, { 
      responseType: 'blob' 
    }),
  uploadTemplate: (templateType: string, formData: FormData) => 
    api.post(`/templates/${templateType}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  restoreTemplate: (templateType: string) => 
    api.post(`/templates/${templateType}/restore`),
  
  // Nouvelles fonctions de versioning
  getVersions: (templateType: string) => 
    api.get(`/templates/${templateType}/versions`),
  activateVersion: (templateType: string, versionId: string) => 
    api.post(`/templates/${templateType}/activate/${versionId}`),
  deleteVersion: (templateType: string, versionId: string) => 
    api.delete(`/templates/${templateType}/versions/${versionId}`),
  downloadVersion: (templateType: string, versionId: string) => 
    api.get(`/templates/${templateType}/versions/${versionId}/download`, { 
      responseType: 'blob' 
    }),
  getTemplateStatus: (templateType: string) => 
    api.get(`/templates/${templateType}/status`),
}

export default api
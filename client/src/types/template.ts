export interface TemplateVersion {
  id: string
  templateType: string
  versionNumber: number
  filename: string
  originalName: string
  isActive: boolean
  fileSize: number | null
  uploadedBy: {
    nom: string
    prenom: string
  }
  createdAt: string
  updatedAt: string
}

export interface Template {
  name: string
  filename: string
  status: 'default' | 'custom'
}

export interface Templates {
  decision: Template
  convention: Template
  avenant: Template
  reglement: Template
}

export interface TemplateStats {
  totalTemplates: number
  customTemplates: number
  defaultTemplates: number
}

export interface TemplateStatusDetail {
  type: string
  status: 'default' | 'custom'
  filename: string
  activeVersion: TemplateVersion | null
}
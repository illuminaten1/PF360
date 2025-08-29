# Guide de Migration vers TanStack Forms

## 📋 Vue d'ensemble

Ce guide vous aide à migrer vos modaux React existants vers TanStack Forms + Zod pour une meilleure gestion d'état et validation.

## 🎯 Avantages de la migration

- **Réduction de code** : ~12.5% de lignes de code en moins
- **Validation centralisée** : Schémas Zod réutilisables  
- **État simplifié** : Plus de `useState` manuel pour les champs
- **Expérience développeur** : Meilleure autocomplétion et type safety
- **Performance** : Validation optimisée et re-renders minimisés

## 🔄 Processus de migration

### 1. Installation des dépendances

```bash
npm install @tanstack/react-form @tanstack/zod-form-adapter
# zod est déjà installé dans le projet
```

### 2. Créer le schéma de validation Zod

**Avant (validation manuelle):**
```typescript
const validateForm = () => {
  const newErrors: { [key: string]: string } = {}
  
  if (!formData.montantTTC) {
    newErrors.montantTTC = 'Le montant TTC est obligatoire'
  }
  
  if (!formData.sgamiId) {
    newErrors.sgamiId = 'Le SGAMI est obligatoire'
  }
  
  // ... plus de validation manuelle
  
  setErrors(newErrors)
  return Object.keys(newErrors).length === 0
}
```

**Après (schéma Zod):**
```typescript
const mySchema = z.object({
  montantTTC: z.string().min(1, 'Le montant TTC est obligatoire')
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: 'Le montant TTC doit être un nombre positif'
    }),
  sgamiId: z.string().min(1, 'Le SGAMI est obligatoire'),
  // ... validation déclarative
})
```

### 3. Remplacer useState par useModalForm

**Avant:**
```typescript
const [formData, setFormData] = useState({
  field1: '',
  field2: '',
  // ... nombreux champs
})
const [errors, setErrors] = useState<{ [key: string]: string }>({})

const handleChange = (e) => {
  const { name, value } = e.target
  setFormData(prev => ({ ...prev, [name]: value }))
}

const handleSubmit = (e) => {
  e.preventDefault()
  if (!validateForm()) return
  // ... logique de soumission
}
```

**Après:**
```typescript
const {
  form,
  handleSubmit,
  canSubmit,
  isSubmitting
} = useModalForm({
  schema: mySchema,
  isOpen,
  initialData: existingData,
  onSubmit: (data) => {
    // ... logique de soumission
  },
  defaultValues: {
    field1: '',
    field2: '',
    // ... valeurs par défaut
  }
})
```

### 4. Utiliser les helpers pour les champs

**Avant:**
```typescript
<input
  name="field1"
  value={formData.field1}
  onChange={handleChange}
  className={`input-class ${errors.field1 ? 'error-class' : ''}`}
/>
{errors.field1 && <p className="error">{errors.field1}</p>}
```

**Après:**
```typescript
{renderFieldWithError(form, 'field1', (field) => 
  createStandardInput(field, { type: 'text', placeholder: 'Placeholder...' })
)}
```

## 📁 Structure des fichiers

```
src/
├── hooks/
│   └── useModalForm.ts           # Hook principal
├── components/forms/
│   ├── PaiementModal.tsx         # Original (964 lignes)
│   ├── PaiementModal.refactored.tsx # Version complète refactorisée
│   ├── PaiementModal.simplified.tsx # Version avec hook
│   └── ExampleModal.tsx          # Exemple simple
```

## 🚀 Exemple de modal simple

```typescript
// Schema de validation
const userSchema = z.object({
  nom: z.string().min(1, 'Le nom est obligatoire'),
  email: z.string().email('Email invalide'),
  age: z.string().refine(val => !isNaN(Number(val)), 'Age invalide')
})

const UserModal = ({ isOpen, onClose, onSubmit, user }) => {
  const { form, handleSubmit, canSubmit } = useModalForm({
    schema: userSchema,
    isOpen,
    initialData: user,
    onSubmit,
    defaultValues: { nom: '', email: '', age: '' }
  })

  const renderFieldWithError = createFieldRenderer

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <form.Provider>
        <form onSubmit={handleSubmit}>
          {/* Nom */}
          {renderFieldWithError(form, 'nom', (field) => 
            createStandardInput(field, { placeholder: 'Nom complet' })
          )}
          
          {/* Email */}
          {renderFieldWithError(form, 'email', (field) => 
            createStandardInput(field, { type: 'email', placeholder: 'email@exemple.com' })
          )}
          
          {/* Age */}
          {renderFieldWithError(form, 'age', (field) => 
            createStandardInput(field, { type: 'number', placeholder: '25' })
          )}

          <button type="submit" disabled={!canSubmit}>
            Sauvegarder
          </button>
        </form>
      </form.Provider>
    </Dialog>
  )
}
```

## 📈 Métriques de la migration PaiementModal

| Métrique | Avant | Après | Économie |
|----------|-------|-------|----------|
| Lignes de code | 964 | ~700 | ~27% |
| useState hooks | 8 | 4 | 50% |
| Validation manuelle | 50 lignes | 0 | 100% |
| Gestion d'erreurs | Manuelle | Automatique | - |

## 🔧 Helpers disponibles

### `useModalForm`
Hook principal pour gérer le formulaire modal.

### `createFieldRenderer` 
Créé un champ avec gestion d'erreur automatique.

### `createStandardInput`
Input avec styles cohérents et gestion d'erreur.

### `createStandardSelect`
Select/dropdown standardisé.

### `useRadioButtons`
Gestion des boutons radio avec styles.

## ✅ Checklist de migration

- [ ] Installer TanStack Form
- [ ] Créer le schéma Zod
- [ ] Remplacer useState par useModalForm
- [ ] Migrer les champs avec les helpers
- [ ] Tester le formulaire
- [ ] Nettoyer l'ancien code
- [ ] Mettre à jour les tests

## 🔄 Migration des 20 autres modaux

1. **Identifiez les patterns communs** dans vos modaux existants
2. **Créez des helpers spécifiques** pour vos cas d'usage
3. **Migrez par ordre de complexité** (simple → complexe)
4. **Testez chaque modal** après migration
5. **Documentez** les patterns spécifiques à votre domaine

## 📚 Ressources

- [TanStack Form Documentation](https://tanstack.com/form)
- [Zod Documentation](https://github.com/colinhacks/zod)
- [React Hook Form vs TanStack Form](https://tanstack.com/form/latest/docs/framework/react/guides/migrating-from-react-hook-form)

---

Cette migration vous fera gagner du temps à long terme et améliorera la maintenabilité de vos formulaires !
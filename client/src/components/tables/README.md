# Server-Side Tables - Documentation

Ce dossier contient les composants réutilisables pour créer des tables server-side avec TanStack Table v8.

## 📁 Structure

```
tables/
├── ServerDataTable.tsx          # Composant principal de table réutilisable
├── filters/
│   └── TableFilters.tsx         # Composants de filtres réutilisables
├── examples/
│   └── DemandesTableExample.tsx # Exemple d'utilisation
├── index.ts                     # Exports
└── README.md                    # Documentation
```

## 🚀 Utilisation rapide

### 1. Import

```tsx
import {
  ServerDataTable,
  ServerDataTableRef,
  DebouncedTextFilter,
  MultiSelectFilter,
  DateRangeFilter
} from '@/components/tables'
```

### 2. Définir les colonnes

```tsx
const columns = useMemo<ColumnDef<YourType>[]>(() => [
  {
    accessorKey: 'name',
    header: 'Nom',
    cell: ({ getValue }) => <div>{getValue<string>()}</div>,
    enableColumnFilter: true,
    meta: {
      filterComponent: (column) => (
        <DebouncedTextFilter column={column} placeholder="Nom..." />
      )
    }
  },
  {
    accessorKey: 'status',
    header: 'Statut',
    enableColumnFilter: true,
    meta: {
      filterComponent: (column) => (
        <MultiSelectFilter
          column={column}
          options={['Active', 'Inactive']}
          placeholder="Tous"
        />
      )
    }
  },
  // ... autres colonnes
], [dependencies])
```

### 3. Utiliser le composant

```tsx
<ServerDataTable
  endpoint="/api/your-endpoint"
  queryKey="your-query-key"
  columns={columns}
  onRowClick={handleRowClick}
  initialPageSize={50}
  initialSorting={[{ id: 'createdAt', desc: true }]}
/>
```

## 📚 API Référence

### ServerDataTable Props

#### Props Obligatoires

| Prop | Type | Description |
|------|------|-------------|
| `endpoint` | `string` | L'endpoint API à appeler (ex: `/api/demandes`) |
| `queryKey` | `string \| string[]` | La clé de requête pour TanStack Query |
| `columns` | `ColumnDef<TData>[]` | Définition des colonnes TanStack Table |

#### Props Optionnelles - Configuration

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `initialPageSize` | `number` | `50` | Taille de page initiale |
| `initialSorting` | `SortingState` | `[]` | État de tri initial |
| `initialColumnVisibility` | `VisibilityState` | `{}` | Visibilité des colonnes initiale |
| `buildParams` | `function` | `defaultBuildParams` | Fonction pour construire les params API |

#### Props Optionnelles - Features

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `enableGlobalFilter` | `boolean` | `true` | Activer la recherche globale |
| `enableColumnFilters` | `boolean` | `true` | Activer les filtres de colonnes |
| `enableSorting` | `boolean` | `true` | Activer le tri |
| `enablePagination` | `boolean` | `true` | Activer la pagination |
| `showClearFilters` | `boolean` | `true` | Afficher le bouton "Effacer tous les filtres" |

#### Props Optionnelles - Customisation

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `emptyMessage` | `string` | `"Aucun résultat trouvé"` | Message si aucun résultat |
| `loadingRows` | `number` | `10` | Nombre de lignes skeleton durant le chargement |
| `rowClassName` | `(row: TData) => string` | - | Classe CSS pour les lignes |
| `onRowClick` | `(row: TData) => void` | - | Handler au clic sur une ligne |
| `onRowContextMenu` | `(e, row: TData) => void` | - | Handler au clic droit sur une ligne |

#### Props Optionnelles - Toolbar

| Prop | Type | Description |
|------|------|-------------|
| `toolbarLeft` | `React.ReactNode` | Contenu à gauche de la barre d'outils |
| `toolbarRight` | `React.ReactNode` | Contenu à droite de la barre d'outils |
| `toolbarBottom` | `React.ReactNode` | Contenu en bas de la barre d'outils |

#### Props Optionnelles - Pagination

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `pageSizeOptions` | `number[]` | `[10, 20, 50, 100, 200]` | Options de taille de page |

#### Props Optionnelles - Transformation

| Prop | Type | Description |
|------|------|-------------|
| `transform` | `(data: any) => { data: TData[], total: number, pageCount: number }` | Fonction pour transformer la réponse API |

### ServerDataTableRef

Le composant expose ces méthodes via ref :

```tsx
interface ServerDataTableRef {
  setColumnFilters: (filters: ColumnFiltersState) => void
  clearAllFilters: () => void
  refetch: () => void
}
```

Exemple d'utilisation :

```tsx
const tableRef = useRef<ServerDataTableRef>(null)

// Appliquer un filtre
tableRef.current?.setColumnFilters([
  { id: 'status', value: 'Active' }
])

// Effacer tous les filtres
tableRef.current?.clearAllFilters()

// Recharger les données
tableRef.current?.refetch()
```

## 🎨 Composants de Filtres

### DebouncedTextFilter

Filtre texte avec debouncing pour éviter trop de requêtes API.

```tsx
<DebouncedTextFilter
  column={column}
  placeholder="Rechercher..."
  debounceMs={500}  // optionnel, défaut: 500ms
/>
```

### MultiSelectFilter

Filtre dropdown avec multi-sélection et checkboxes.

```tsx
<MultiSelectFilter
  column={column}
  options={['Option 1', 'Option 2', 'Option 3']}
  placeholder="Tous"
/>
```

### DateRangeFilter

Filtre de plage de dates avec sélection "de" et "à".

```tsx
<DateRangeFilter column={column} />
```

## 🔧 Hook useServerTable

Si vous avez besoin de plus de contrôle, vous pouvez utiliser directement le hook `useServerTable` :

```tsx
import { useServerTable } from '@/hooks/useServerTable'

const {
  data,
  totalRows,
  pageCount,
  isLoading,
  pagination,
  sorting,
  columnFilters,
  globalFilter,
  setPagination,
  setSorting,
  setColumnFilters,
  setGlobalFilter,
  clearAllFilters,
  refetch
} = useServerTable({
  endpoint: '/api/your-endpoint',
  queryKey: 'your-key',
  initialPageSize: 50,
  initialSorting: [{ id: 'date', desc: true }]
})
```

## 📝 Personnalisation des Paramètres API

Par défaut, `ServerDataTable` utilise `defaultBuildParams` qui convertit les états TanStack Table en paramètres API standards :

```
pagination → { page, limit }
sorting → { sortBy, sortOrder }
globalFilter → { search }
columnFilters → { [columnId]: value }
dateRangeFilters → { [columnId]Debut, [columnId]Fin }
```

Pour personnaliser cette conversion, passez votre propre fonction `buildParams` :

```tsx
const buildCustomParams = (pagination, sorting, columnFilters, globalFilter) => {
  const params: any = {
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize
  }

  // Logique custom pour vos filtres
  columnFilters.forEach((filter) => {
    if (filter.id === 'specialField') {
      params.customParam = transformValue(filter.value)
    }
  })

  return params
}

<ServerDataTable
  buildParams={buildCustomParams}
  // ... autres props
/>
```

## 📊 Transformation de Données

Si votre API ne retourne pas le format standard `{ data, total, pagination: { pages } }`, utilisez la prop `transform` :

```tsx
<ServerDataTable
  transform={(apiResponse) => ({
    data: apiResponse.results,           // Vos données
    total: apiResponse.totalCount,       // Total d'éléments
    pageCount: apiResponse.numberOfPages // Nombre de pages
  })}
  // ... autres props
/>
```

## 🎯 Exemples Complets

### Exemple Simple

```tsx
import { ServerDataTable } from '@/components/tables'

function MyTable() {
  const columns = useMemo(() => [
    { accessorKey: 'name', header: 'Nom' },
    { accessorKey: 'email', header: 'Email' }
  ], [])

  return (
    <ServerDataTable
      endpoint="/api/users"
      queryKey="users"
      columns={columns}
    />
  )
}
```

### Exemple avec Filtres

```tsx
import {
  ServerDataTable,
  DebouncedTextFilter,
  MultiSelectFilter
} from '@/components/tables'

function MyTableWithFilters() {
  const columns = useMemo(() => [
    {
      accessorKey: 'name',
      header: 'Nom',
      enableColumnFilter: true,
      meta: {
        filterComponent: (column) => (
          <DebouncedTextFilter column={column} placeholder="Nom..." />
        )
      }
    },
    {
      accessorKey: 'status',
      header: 'Statut',
      enableColumnFilter: true,
      meta: {
        filterComponent: (column) => (
          <MultiSelectFilter
            column={column}
            options={['Active', 'Inactive']}
          />
        )
      }
    }
  ], [])

  return (
    <ServerDataTable
      endpoint="/api/users"
      queryKey="users"
      columns={columns}
    />
  )
}
```

### Exemple Avancé avec Ref

Voir `examples/DemandesTableExample.tsx` pour un exemple complet.

## 🔄 Migration depuis une Table Client-Side

### Avant (Client-side)

```tsx
// ~800-1000 lignes de code
const table = useReactTable({
  data: allData,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getPaginationRowModel: getPaginationRowModel()
})
```

### Après (Server-side)

```tsx
// ~300 lignes de code
<ServerDataTable
  endpoint="/api/your-data"
  queryKey="your-data"
  columns={columns}
/>
```

## 💡 Bonnes Pratiques

1. **Mémoïsation des colonnes** : Toujours utiliser `useMemo` pour les colonnes
2. **QueryKey unique** : Utiliser une clé de requête unique par table
3. **Facets depuis API** : Charger les options de filtres depuis l'API (voir exemple Demandes)
4. **Transform si nécessaire** : N'utilisez `transform` que si votre API ne suit pas le format standard
5. **BuildParams personnalisé** : Créez une fonction `buildParams` si votre API a des conventions spécifiques

## 🐛 Debugging

Pour débugger les requêtes API :

```tsx
<ServerDataTable
  endpoint="/api/data"
  queryKey="data"
  columns={columns}
  buildParams={(pagination, sorting, columnFilters, globalFilter) => {
    const params = defaultBuildParams(pagination, sorting, columnFilters, globalFilter)
    console.log('API Params:', params)
    return params
  }}
/>
```

## 📈 Performance

- **Debouncing** : Les filtres texte sont automatiquement debouncés (500ms par défaut)
- **PlaceholderData** : Les données précédentes sont affichées pendant le chargement de nouvelles données
- **React Query** : Utilise le cache de TanStack Query pour optimiser les requêtes

## 🎨 Styling

Toutes les classes CSS utilisent Tailwind CSS. Pour personnaliser :

1. **Lignes** : Utilisez `rowClassName`
2. **Global** : Modifiez directement `ServerDataTable.tsx`
3. **Filtres** : Modifiez les composants dans `filters/TableFilters.tsx`

## 🔗 Ressources

- [TanStack Table v8 Docs](https://tanstack.com/table/v8)
- [TanStack Query Docs](https://tanstack.com/query/latest)
- Exemple complet : `examples/DemandesTableExample.tsx`

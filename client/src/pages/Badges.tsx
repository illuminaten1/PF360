import React from 'react'
import { TagIcon } from '@heroicons/react/24/outline'
import { Badge } from '@/types'
import ManagementPage from '@/components/common/ManagementPage'
import BadgesTable from '@/components/tables/BadgesTable'
import BadgeModal from '@/components/forms/BadgeModal'

const Badges: React.FC = () => {
  return (
    <ManagementPage<Badge>
      config={{
        entityName: "badge",
        entityDisplayName: "Badge",
        entityPluralName: "badges",
        apiEndpoint: "/badges",
        icon: TagIcon,
        hasStats: true
      }}
      TableComponent={BadgesTable}
      ModalComponent={BadgeModal}
    />
  )
}

export default Badges
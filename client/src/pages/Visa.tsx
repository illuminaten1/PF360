import React from 'react'
import { EyeIcon } from '@heroicons/react/24/outline'
import { Visa } from '@/types'
import ManagementPage from '@/components/common/ManagementPage'
import VisaTable from '@/components/tables/VisaTable'
import VisaModal from '@/components/forms/VisaModal'

const VisaPage: React.FC = () => {
  return (
    <ManagementPage<Visa>
      config={{
        entityName: "visa",
        entityDisplayName: "Visa",
        entityPluralName: "visas",
        apiEndpoint: "/visa",
        icon: EyeIcon,
        hasStats: true,
        hasCreate: false,
        hasDelete: false
      }}
      TableComponent={VisaTable}
      ModalComponent={VisaModal}
    />
  )
}

export default VisaPage
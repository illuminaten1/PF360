import React from 'react'
import { StatistiquesAutoControle } from '../types'

interface AutoControlePanelProps {
  autoControle: StatistiquesAutoControle | undefined
}

const AutoControlePanel: React.FC<AutoControlePanelProps> = ({ autoControle }) => (
  <div className="h-full flex flex-col">
    <div className="flex-1 overflow-auto">
      <table className="w-full h-full border-collapse" style={{ tableLayout: 'fixed' }}>
        <tbody className="bg-white h-full">
          <tr className="bg-white border-b border-gray-100" style={{ height: '14.28%' }}>
            <td className="px-2 py-2 text-sm font-medium text-gray-900 align-middle">
              PJ en attente de convention
            </td>
            <td className="px-2 py-2 text-right text-sm font-semibold text-red-600 align-middle">
              {autoControle?.pjEnAttenteConvention || 0}
            </td>
          </tr>
          <tr className="bg-gray-50 border-b border-gray-100" style={{ height: '14.28%' }}>
            <td className="px-2 py-2 text-sm font-medium text-gray-900 align-middle">
              Ancienneté moyenne non traités
            </td>
            <td className="px-2 py-2 text-right text-sm font-semibold text-gray-900 align-middle">
              {autoControle?.ancienneteMoyenneNonTraites?.toFixed(2) || '0,00'}
            </td>
          </tr>
          <tr className="bg-white border-b border-gray-100" style={{ height: '14.28%' }}>
            <td className="px-2 py-2 pl-6 text-sm text-gray-600 align-middle">
              Dont BAP
            </td>
            <td className="px-2 py-2 text-right text-sm font-semibold text-gray-900 align-middle">
              {autoControle?.ancienneteMoyenneBAP?.toFixed(2) || '0,00'}
            </td>
          </tr>
          <tr className="bg-gray-50 border-b border-gray-100" style={{ height: '14.28%' }}>
            <td className="px-2 py-2 pl-6 text-sm text-gray-600 align-middle">
              Dont BRPF
            </td>
            <td className="px-2 py-2 text-right text-sm font-semibold text-gray-900 align-middle">
              {autoControle?.ancienneteMoyenneBRP?.toFixed(2) || '0,00'}
            </td>
          </tr>
          <tr className="bg-white border-b border-gray-100" style={{ height: '14.28%' }}>
            <td className="px-2 py-2 text-sm font-medium text-gray-900 align-middle">
              Délai de traitement moyen
            </td>
            <td className="px-2 py-2 text-right text-sm font-semibold text-gray-900 align-middle">
              {autoControle?.delaiTraitementMoyen?.toFixed(2) || '0,00'}
            </td>
          </tr>
          <tr className="bg-gray-50 border-b border-gray-100" style={{ height: '14.28%' }}>
            <td className="px-2 py-2 pl-6 text-sm text-gray-600 align-middle">
              Dont BAP
            </td>
            <td className="px-2 py-2 text-right text-sm font-semibold text-gray-900 align-middle">
              {autoControle?.delaiTraitementBAP?.toFixed(2) || '0,00'}
            </td>
          </tr>
          <tr className="bg-white" style={{ height: '14.28%' }}>
            <td className="px-2 py-2 pl-6 text-sm text-gray-600 align-middle">
              Dont BRPF
            </td>
            <td className="px-2 py-2 text-right text-sm font-semibold text-gray-900 align-middle">
              {autoControle?.delaiTraitementBRP?.toFixed(2) || '0,00'}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
)

export default AutoControlePanel
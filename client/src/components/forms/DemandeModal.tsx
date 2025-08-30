import React, { useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { Demande, Dossier } from '@/types'
import api from '@/utils/api'
import GradeSelector from './GradeSelector'

const demandeSchema = z.object({
  numeroDS: z.string().min(1, 'Numéro DS requis'),
  type: z.enum(['VICTIME', 'MIS_EN_CAUSE'], { message: 'Type requis' }),
  
  // Infos militaires
  nigend: z.string().optional(),
  gradeId: z.string().min(1, 'Grade requis'),
  statutDemandeur: z.string().min(1, 'Statut du demandeur requis'),
  branche: z.string().optional(),
  formationAdministrative: z.string().optional(),
  departement: z.string().optional(),
  nom: z.string().min(1, 'Nom requis'),
  prenom: z.string().min(1, 'Prénom requis'),
  adressePostaleLigne1: z.string().optional(),
  adressePostaleLigne2: z.string().optional(),
  telephoneProfessionnel: z.string().optional(),
  telephonePersonnel: z.string().optional(),
  emailProfessionnel: z.string().email('Email professionnel invalide').optional().or(z.literal('')),
  emailPersonnel: z.string().email('Email personnel invalide').optional().or(z.literal('')),
  unite: z.string().optional(),
  
  // Infos faits
  dateFaits: z.string().optional(),
  commune: z.string().optional(),
  codePostal: z.string().optional(),
  position: z.string().optional().refine(
    (val) => !val || ['EN_SERVICE', 'HORS_SERVICE'].includes(val),
    { message: 'Position invalide' }
  ),
  contexteMissionnel: z.string().optional(),
  qualificationInfraction: z.string().optional(),
  resume: z.string().optional(),
  blessures: z.string().optional(),
  partieCivile: z.boolean().default(false),
  montantPartieCivile: z.union([z.number(), z.nan(), z.undefined()]).optional().transform((val) => {
    if (typeof val === 'number' && !isNaN(val)) return val;
    return undefined;
  }),
  qualificationsPenales: z.string().optional(),
  dateAudience: z.string().optional(),
  
  // Soutiens
  soutienPsychologique: z.boolean().default(false),
  soutienSocial: z.boolean().default(false),
  soutienMedical: z.boolean().default(false),
  
  // Date de réception
  dateReception: z.string().optional(),
  
  // Association dossier (uniquement pour modification)
  dossierId: z.string().optional(),
  
}).refine(
  (data) => {
    // Si partieCivile est false, on ignore le montant
    if (!data.partieCivile) return true;
    // Si partieCivile est true, le montant peut être undefined (optionnel)
    return true;
  },
  {
    message: "Validation des données de partie civile"
  }
)

type DemandeFormData = z.infer<typeof demandeSchema>

interface DemandeModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: DemandeFormData) => Promise<void>
  demande?: Demande | null
  title: string
}

const DemandeModal: React.FC<DemandeModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  demande,
  title
}) => {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<DemandeFormData>({
    resolver: zodResolver(demandeSchema),
    mode: 'onBlur',
    defaultValues: {
      numeroDS: '',
      type: 'VICTIME',
      nigend: '',
      gradeId: '',
      statutDemandeur: '',
      branche: '',
      formationAdministrative: '',
      departement: '',
      nom: '',
      prenom: '',
      adressePostaleLigne1: '',
      adressePostaleLigne2: '',
      telephoneProfessionnel: '',
      telephonePersonnel: '',
      emailProfessionnel: '',
      emailPersonnel: '',
      unite: '',
      dateFaits: '',
      commune: '',
      codePostal: '',
      position: '',
      contexteMissionnel: '',
      qualificationInfraction: '',
      resume: '',
      blessures: '',
      partieCivile: false,
      montantPartieCivile: undefined,
      qualificationsPenales: '',
      dateAudience: '',
      soutienPsychologique: false,
      soutienSocial: false,
      soutienMedical: false,
      dateReception: new Date().toISOString().split('T')[0],
      dossierId: ''
    }
  })

  const partieCivile = watch('partieCivile')

  // Nettoyer le montant quand partieCivile est décochée
  React.useEffect(() => {
    if (!partieCivile) {
      setValue('montantPartieCivile', undefined)
    }
  }, [partieCivile, setValue])

  // Fetch dossiers for assignment (only when editing existing demande)
  const { data: dossiers = [] } = useQuery<Dossier[]>({
    queryKey: ['dossiers'],
    queryFn: async () => {
      const response = await api.get('/dossiers')
      return response.data
    },
    enabled: !!demande // Only fetch when editing an existing demande
  })


  useEffect(() => {
    if (isOpen) {
      if (demande) {
        // Mode édition : remplir avec les données existantes
        reset({
          numeroDS: demande.numeroDS,
          type: demande.type as 'VICTIME' | 'MIS_EN_CAUSE',
          nigend: demande.nigend || '',
          gradeId: demande.grade?.id || '',
          statutDemandeur: demande.statutDemandeur || '',
          branche: demande.branche || '',
          formationAdministrative: demande.formationAdministrative || '',
          departement: demande.departement || '',
          nom: demande.nom,
          prenom: demande.prenom,
          adressePostaleLigne1: demande.adressePostaleLigne1 || '',
          adressePostaleLigne2: demande.adressePostaleLigne2 || '',
          telephoneProfessionnel: demande.telephoneProfessionnel || '',
          telephonePersonnel: demande.telephonePersonnel || '',
          emailProfessionnel: demande.emailProfessionnel || '',
          emailPersonnel: demande.emailPersonnel || '',
          unite: demande.unite || '',
          dateFaits: demande.dateFaits ? new Date(demande.dateFaits).toISOString().split('T')[0] : '',
          commune: demande.commune || '',
          codePostal: demande.codePostal || '',
          position: demande.position || '',
          contexteMissionnel: demande.contexteMissionnel || '',
          qualificationInfraction: demande.qualificationInfraction || '',
          resume: demande.resume || '',
          blessures: demande.blessures || '',
          partieCivile: demande.partieCivile,
          montantPartieCivile: demande.montantPartieCivile || undefined,
          qualificationsPenales: demande.qualificationsPenales || '',
          dateAudience: demande.dateAudience ? new Date(demande.dateAudience).toISOString().split('T')[0] : '',
          soutienPsychologique: demande.soutienPsychologique,
          soutienSocial: demande.soutienSocial,
          soutienMedical: demande.soutienMedical,
          dateReception: demande.dateReception ? new Date(demande.dateReception).toISOString().split('T')[0] : '',
          dossierId: demande.dossier?.id || ''
        })
      } else {
        // Mode création : réinitialiser complètement le formulaire
        reset({
          numeroDS: '',
          type: 'VICTIME',
          nigend: '',
          gradeId: '',
          statutDemandeur: '',
          branche: '',
          formationAdministrative: '',
          departement: '',
          nom: '',
          prenom: '',
          adressePostaleLigne1: '',
          adressePostaleLigne2: '',
          telephoneProfessionnel: '',
          telephonePersonnel: '',
          emailProfessionnel: '',
          emailPersonnel: '',
          unite: '',
          dateFaits: '',
          commune: '',
          codePostal: '',
          position: '',
          contexteMissionnel: '',
          qualificationInfraction: '',
          resume: '',
          blessures: '',
          partieCivile: false,
          montantPartieCivile: undefined,
          qualificationsPenales: '',
          dateAudience: '',
          soutienPsychologique: false,
          soutienSocial: false,
          soutienMedical: false,
          dateReception: new Date().toISOString().split('T')[0], // Date actuelle par défaut
          dossierId: ''
        })
      }
    }
  }, [isOpen, demande, reset])

  const handleFormSubmit = async (data: DemandeFormData) => {
    try {
      // Nettoyer les données avant soumission
      const cleanedData = { ...data }
      
      // Si partieCivile est false, s'assurer que montantPartieCivile est undefined
      if (!cleanedData.partieCivile) {
        cleanedData.montantPartieCivile = undefined
      } else if (cleanedData.montantPartieCivile) {
        // Convert string numbers to numbers si nécessaire
        cleanedData.montantPartieCivile = Number(cleanedData.montantPartieCivile)
      }
      
      await onSubmit(cleanedData)
      onClose()
    } catch {
      // L'erreur sera gérée par la mutation dans le parent
      // Ne pas fermer le modal en cas d'erreur
    }
  }

  return (
    <Transition appear show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                    {title}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
                  {/* Informations générales */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Informations générales</h4>
                    <div className={`grid grid-cols-1 gap-4 ${demande ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
                      <div>
                        <label className="label block text-gray-700 mb-2">
                          Numéro DS <span className="text-red-500">*</span>
                        </label>
                        <input
                          {...register('numeroDS')}
                          className="input w-full"
                          placeholder="Ex: 2024-001234"
                          disabled={isSubmitting}
                        />
                        {errors.numeroDS && (
                          <p className="mt-1 text-sm text-red-600">{errors.numeroDS.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="label block text-gray-700 mb-2">
                          Type <span className="text-red-500">*</span>
                        </label>
                        <select
                          {...register('type')}
                          className="input w-full"
                          disabled={isSubmitting}
                        >
                          <option value="VICTIME">Victime</option>
                          <option value="MIS_EN_CAUSE">Mis en cause</option>
                        </select>
                        {errors.type && (
                          <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="label block text-gray-700 mb-2">
                          Date de réception <span className="text-red-500">*</span>
                        </label>
                        <input
                          {...register('dateReception')}
                          type="date"
                          className="input w-full"
                          disabled={isSubmitting}
                        />
                      </div>

                      {/* Afficher le champ dossier uniquement en mode modification */}
                      {demande && (
                        <div>
                          <label className="label block text-gray-700 mb-2">
                            Dossier associé
                          </label>
                          <select
                            {...register('dossierId')}
                            className="input w-full"
                            disabled={isSubmitting}
                          >
                            <option value="">Aucun dossier</option>
                            {dossiers.map((dossier) => (
                              <option key={dossier.id} value={dossier.id}>
                                {dossier.numero} {dossier.sgami?.nom && `(${dossier.sgami.nom})`}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                    
                    {/* Message informatif pour les nouvelles demandes */}
                    {!demande && (
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <p className="text-sm text-blue-700">
                          La demande sera créée sans dossier. Vous pourrez l&apos;associer à un dossier ultérieurement depuis la liste des demandes.
                        </p>
                      </div>
                    )}

                  </div>

                  {/* Informations militaires */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Informations militaires</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="label block text-gray-700 mb-2">
                          NIGEND
                        </label>
                        <input
                          {...register('nigend')}
                          className="input w-full"
                          placeholder="Ex: 375788"
                          disabled={isSubmitting}
                        />
                      </div>

                      <div>
                        <label className="label block text-gray-700 mb-2">
                          Grade <span className="text-red-500">*</span>
                        </label>
                        <GradeSelector
                          value={watch('gradeId')}
                          onChange={(value) => setValue('gradeId', value)}
                          disabled={isSubmitting}
                          required
                          className="input w-full"
                        />
                        {errors.gradeId && (
                          <p className="mt-1 text-sm text-red-600">{errors.gradeId.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="label block text-gray-700 mb-2">
                          Statut du demandeur <span className="text-red-500">*</span>
                        </label>
                        <select
                          {...register('statutDemandeur', { required: 'Statut du demandeur requis' })}
                          className="input w-full"
                          disabled={isSubmitting}
                        >
                          <option value="">-- Sélectionner un statut --</option>
                          <option value="OG">OG</option>
                          <option value="OCTA">OCTA</option>
                          <option value="SOG">SOG</option>
                          <option value="CSTAGN">CSTAGN</option>
                          <option value="GAV">GAV</option>
                          <option value="Civil">Civil</option>
                          <option value="Réserviste">Réserviste</option>
                          <option value="Retraité">Retraité</option>
                          <option value="Ayant-droit">Ayant-droit</option>
                        </select>
                        {errors.statutDemandeur && (
                          <p className="mt-1 text-sm text-red-600">{errors.statutDemandeur.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="label block text-gray-700 mb-2">
                          Branche
                        </label>
                        <select
                          {...register('branche')}
                          className="input w-full"
                          disabled={isSubmitting}
                        >
                          <option value="">-- Sélectionner une branche --</option>
                          <option value="GD">GD</option>
                          <option value="GM">GM</option>
                          <option value="GR">GR</option>
                          <option value="État-Major">État-Major</option>
                          <option value="GIE SPÉ">GIE SPÉ</option>
                          <option value="DG et ORG. CENTRAUX">DG et ORG. CENTRAUX</option>
                          <option value="GIGN">GIGN</option>
                        </select>
                      </div>

                      <div>
                        <label className="label block text-gray-700 mb-2">
                          Formation administrative
                        </label>
                        <select
                          {...register('formationAdministrative')}
                          className="input w-full"
                          disabled={isSubmitting}
                        >
                          <option value="">-- Sélectionner une formation --</option>
                          <option value="Auvergne-Rhône-Alpes">Auvergne-Rhône-Alpes</option>
                          <option value="Bourgogne-Franche-Comté">Bourgogne-Franche-Comté</option>
                          <option value="Bretagne">Bretagne</option>
                          <option value="Centre-Val-de-Loire">Centre-Val-de-Loire</option>
                          <option value="Corse">Corse</option>
                          <option value="Grand Est">Grand Est</option>
                          <option value="Hauts-de-France">Hauts-de-France</option>
                          <option value="Ile-de-France">Ile-de-France</option>
                          <option value="Nouvelle-Aquitaine">Nouvelle-Aquitaine</option>
                          <option value="Normandie">Normandie</option>
                          <option value="Occitanie">Occitanie</option>
                          <option value="Pays-de-la-Loire">Pays-de-la-Loire</option>
                          <option value="Provence-Alpes-Côte-d'Azur">Provence-Alpes-Côte-d&apos;Azur</option>
                          <option value="Guadeloupe">Guadeloupe</option>
                          <option value="Guyane">Guyane</option>
                          <option value="Martinique">Martinique</option>
                          <option value="Mayotte">Mayotte</option>
                          <option value="Nouvelle-Calédonie">Nouvelle-Calédonie</option>
                          <option value="Wallis-et-Futuna">Wallis-et-Futuna</option>
                          <option value="Polynésie française">Polynésie française</option>
                          <option value="La Réunion">La Réunion</option>
                          <option value="Saint Barthélémy / Saint-Martin">Saint Barthélémy / Saint-Martin</option>
                          <option value="Saint-Pierre-et-Miquelon">Saint-Pierre-et-Miquelon</option>
                          <option value="Garde républicaine">Garde républicaine</option>
                          <option value="IGAG">IGAG</option>
                          <option value="IGGN">IGGN</option>
                          <option value="DGGN">DGGN</option>
                          <option value="GIGN">GIGN</option>
                          <option value="COMSOPGN">COMSOPGN</option>
                          <option value="PJGN">PJGN</option>
                          <option value="CEGN">CEGN</option>
                          <option value="CGOM">CGOM</option>
                          <option value="CRJ">CRJ</option>
                          <option value="ANFSI">ANFSI</option>
                          <option value="COSSEN">COSSEN</option>
                          <option value="COMCYBER-MI">COMCYBER-MI</option>
                          <option value="CESAN">CESAN</option>
                          <option value="SAILMI">SAILMI</option>
                          <option value="GSAN">GSAN</option>
                          <option value="GTA">GTA</option>
                          <option value="GARM">GARM</option>
                          <option value="CFAGN">CFAGN</option>
                          <option value="GMAR">GMAR</option>
                          <option value="GAIR">GAIR</option>
                          <option value="AUTRE">AUTRE</option>
                        </select>
                      </div>

                      <div>
                        <label className="label block text-gray-700 mb-2">
                          Département d&apos;affectation
                        </label>
                        <select
                          {...register('departement')}
                          className="input w-full"
                          disabled={isSubmitting}
                        >
                          <option value="">-- Sélectionner un département --</option>
                          <option value="1">1</option>
                          <option value="2A">2A</option>
                          <option value="2B">2B</option>
                          <option value="2">2</option>
                          <option value="3">3</option>
                          <option value="4">4</option>
                          <option value="5">5</option>
                          <option value="6">6</option>
                          <option value="7">7</option>
                          <option value="8">8</option>
                          <option value="9">9</option>
                          <option value="10">10</option>
                          <option value="11">11</option>
                          <option value="12">12</option>
                          <option value="13">13</option>
                          <option value="14">14</option>
                          <option value="15">15</option>
                          <option value="16">16</option>
                          <option value="17">17</option>
                          <option value="18">18</option>
                          <option value="19">19</option>
                          <option value="20">20</option>
                          <option value="21">21</option>
                          <option value="22">22</option>
                          <option value="23">23</option>
                          <option value="24">24</option>
                          <option value="25">25</option>
                          <option value="26">26</option>
                          <option value="27">27</option>
                          <option value="28">28</option>
                          <option value="29">29</option>
                          <option value="30">30</option>
                          <option value="31">31</option>
                          <option value="32">32</option>
                          <option value="33">33</option>
                          <option value="34">34</option>
                          <option value="35">35</option>
                          <option value="36">36</option>
                          <option value="37">37</option>
                          <option value="38">38</option>
                          <option value="39">39</option>
                          <option value="40">40</option>
                          <option value="41">41</option>
                          <option value="42">42</option>
                          <option value="43">43</option>
                          <option value="44">44</option>
                          <option value="45">45</option>
                          <option value="46">46</option>
                          <option value="47">47</option>
                          <option value="48">48</option>
                          <option value="49">49</option>
                          <option value="50">50</option>
                          <option value="51">51</option>
                          <option value="52">52</option>
                          <option value="53">53</option>
                          <option value="54">54</option>
                          <option value="55">55</option>
                          <option value="56">56</option>
                          <option value="57">57</option>
                          <option value="58">58</option>
                          <option value="59">59</option>
                          <option value="60">60</option>
                          <option value="61">61</option>
                          <option value="62">62</option>
                          <option value="63">63</option>
                          <option value="64">64</option>
                          <option value="65">65</option>
                          <option value="66">66</option>
                          <option value="67">67</option>
                          <option value="68">68</option>
                          <option value="69">69</option>
                          <option value="70">70</option>
                          <option value="71">71</option>
                          <option value="72">72</option>
                          <option value="73">73</option>
                          <option value="74">74</option>
                          <option value="75">75</option>
                          <option value="76">76</option>
                          <option value="77">77</option>
                          <option value="78">78</option>
                          <option value="79">79</option>
                          <option value="80">80</option>
                          <option value="81">81</option>
                          <option value="82">82</option>
                          <option value="83">83</option>
                          <option value="84">84</option>
                          <option value="85">85</option>
                          <option value="86">86</option>
                          <option value="87">87</option>
                          <option value="88">88</option>
                          <option value="89">89</option>
                          <option value="90">90</option>
                          <option value="91">91</option>
                          <option value="92">92</option>
                          <option value="93">93</option>
                          <option value="94">94</option>
                          <option value="95">95</option>
                          <option value="971">971</option>
                          <option value="972">972</option>
                          <option value="973">973</option>
                          <option value="974">974</option>
                          <option value="976">976</option>
                          <option value="986">986</option>
                          <option value="987">987</option>
                          <option value="988">988</option>
                          <option value="975">975</option>
                          <option value="978">978</option>
                          <option value="GGM I/3">GGM I/3</option>
                          <option value="GGM I/5">GGM I/5</option>
                          <option value="GGM I/6">GGM I/6</option>
                          <option value="GGM I/7">GGM I/7</option>
                          <option value="GGM I/9">GGM I/9</option>
                          <option value="GGM II/1">GGM II/1</option>
                          <option value="GGM II/2">GGM II/2</option>
                          <option value="GGM II/3">GGM II/3</option>
                          <option value="GGM II/5">GGM II/5</option>
                          <option value="GGM II/6">GGM II/6</option>
                          <option value="GGM II/7">GGM II/7</option>
                          <option value="GGM III/3">GGM III/3</option>
                          <option value="GGM III/6">GGM III/6</option>
                          <option value="GGM III/7">GGM III/7</option>
                          <option value="GGM IV/2">GGM IV/2</option>
                          <option value="GGM IV/3">GGM IV/3</option>
                          <option value="GGM IV/7">GGM IV/7</option>
                          <option value="GTGM">GTGM</option>
                          <option value="GBGM">GBGM</option>
                        </select>
                      </div>

                      <div>
                        <label className="label block text-gray-700 mb-2">
                          Nom <span className="text-red-500">*</span>
                        </label>
                        <input
                          {...register('nom')}
                          className="input w-full"
                          placeholder="Nom de famille"
                          disabled={isSubmitting}
                          onChange={(e) => {
                            const upperValue = e.target.value.toUpperCase();
                            e.target.value = upperValue;
                            setValue('nom', upperValue);
                          }}
                        />
                        {errors.nom && (
                          <p className="mt-1 text-sm text-red-600">{errors.nom.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="label block text-gray-700 mb-2">
                          Prénom <span className="text-red-500">*</span>
                        </label>
                        <input
                          {...register('prenom')}
                          className="input w-full"
                          placeholder="Prénom"
                          disabled={isSubmitting}
                        />
                        {errors.prenom && (
                          <p className="mt-1 text-sm text-red-600">{errors.prenom.message}</p>
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <label className="label block text-gray-700 mb-2">
                          Unité
                        </label>
                        <input
                          {...register('unite')}
                          className="input w-full"
                          placeholder="Ex: COB MURET (31)"
                          disabled={isSubmitting}
                        />
                      </div>

                      <div>
                        <label className="label block text-gray-700 mb-2">
                          Adresse postale ligne 1
                        </label>
                        <input
                          {...register('adressePostaleLigne1')}
                          className="input w-full"
                          placeholder="123 Rue de la République"
                          disabled={isSubmitting}
                        />
                      </div>

                      <div>
                        <label className="label block text-gray-700 mb-2">
                          Adresse postale ligne 2
                        </label>
                        <input
                          {...register('adressePostaleLigne2')}
                          className="input w-full"
                          placeholder="92240 MALAKOFF"
                          disabled={isSubmitting}
                        />
                      </div>

                      <div>
                        <label className="label block text-gray-700 mb-2">
                          Téléphone professionnel
                        </label>
                        <input
                          {...register('telephoneProfessionnel')}
                          type="tel"
                          className="input w-full"
                          placeholder="Ex: 06 12 34 56 78"
                          disabled={isSubmitting}
                        />
                      </div>

                      <div>
                        <label className="label block text-gray-700 mb-2">
                          Téléphone personnel
                        </label>
                        <input
                          {...register('telephonePersonnel')}
                          type="tel"
                          className="input w-full"
                          placeholder="Ex: 07 23 45 67 89"
                          disabled={isSubmitting}
                        />
                      </div>

                      <div>
                        <label className="label block text-gray-700 mb-2">
                          Email professionnel
                        </label>
                        <input
                          {...register('emailProfessionnel')}
                          type="email"
                          className="input w-full"
                          placeholder="prenom.nom@gendarmerie.interieur.gouv.fr"
                          disabled={isSubmitting}
                        />
                        {errors.emailProfessionnel && (
                          <p className="text-red-500 text-sm mt-1">{errors.emailProfessionnel.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="label block text-gray-700 mb-2">
                          Email personnel
                        </label>
                        <input
                          {...register('emailPersonnel')}
                          type="email"
                          className="input w-full"
                          placeholder="exemple@gmail.com"
                          disabled={isSubmitting}
                        />
                        {errors.emailPersonnel && (
                          <p className="text-red-500 text-sm mt-1">{errors.emailPersonnel.message}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Informations sur les faits */}
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Informations sur les faits</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="label block text-gray-700 mb-2">
                          Date des faits
                        </label>
                        <input
                          {...register('dateFaits')}
                          type="date"
                          className="input w-full"
                          disabled={isSubmitting}
                        />
                      </div>

                      <div>
                        <label className="label block text-gray-700 mb-2">
                          Position
                        </label>
                        <select
                          {...register('position')}
                          className="input w-full"
                          disabled={isSubmitting}
                        >
                          <option value="">Non précisé</option>
                          <option value="EN_SERVICE">En service</option>
                          <option value="HORS_SERVICE">Hors service</option>
                        </select>
                        {errors.position && (
                          <p className="mt-1 text-sm text-red-600">{errors.position.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="label block text-gray-700 mb-2">
                          Contexte missionnel
                        </label>
                        <select
                          {...register('contexteMissionnel')}
                          className="input w-full"
                          disabled={isSubmitting}
                        >
                          <option value="">-- Sélectionner un contexte --</option>
                          <option value="Prévention de proximité">Prévention de proximité</option>
                          <option value="Police route">Police route</option>
                          <option value="MO/RO">MO/RO</option>
                          <option value="Police judiciaire">Police judiciaire</option>
                          <option value="Chargé d'accueil">Chargé d&apos;accueil</option>
                          <option value="Sécurisation d'événement">Sécurisation d&apos;événement</option>
                          <option value="Intervention spécialisée">Intervention spécialisée</option>
                          <option value="Surveillance particulière">Surveillance particulière</option>
                          <option value="Escorte/Transfèrement">Escorte/Transfèrement</option>
                          <option value="International">International</option>
                          <option value="Relations interpersonnelles">Relations interpersonnelles</option>
                          <option value="Hors service">Hors service</option>
                          <option value="Autre">Autre</option>
                        </select>
                      </div>

                      <div>
                        <label className="label block text-gray-700 mb-2">
                          Qualification de l&apos;infraction
                        </label>
                        <select
                          {...register('qualificationInfraction')}
                          className="input w-full"
                          disabled={isSubmitting}
                        >
                          <option value="">-- Sélectionner une qualification --</option>
                          <option value="OUTRAGE / MENACES">OUTRAGE / MENACES</option>
                          <option value="RÉBELLION avec ou sans outrage">RÉBELLION avec ou sans outrage</option>
                          <option value="VIOLENCES hors rébellion">VIOLENCES hors rébellion</option>
                          <option value="REFUS D'OBTEMPÉRER / Mise en danger de la vie d'autrui">REFUS D&apos;OBTEMPÉRER / Mise en danger de la vie d&apos;autrui</option>
                          <option value="HARCÈLEMENT MORAL AU TRAVAIL / DISCRIMINATION">HARCÈLEMENT MORAL AU TRAVAIL / DISCRIMINATION</option>
                          <option value="VIOLENCES SEXUELLES ET SEXISTES">VIOLENCES SEXUELLES ET SEXISTES</option>
                          <option value="DÉFENSEUR DES DROITS">DÉFENSEUR DES DROITS</option>
                          <option value="ACCIDENT DE LA CIRC. ROUTIÈRE">ACCIDENT DE LA CIRC. ROUTIÈRE</option>
                          <option value="DIFFAMATION / INJURES">DIFFAMATION / INJURES</option>
                          <option value="TENTATIVE D'HOMICIDE">TENTATIVE D&apos;HOMICIDE</option>
                          <option value="INFRACTION INVOLONTAIRE HORS ACCIDENT CIRC. ROUTIÈRE">INFRACTION INVOLONTAIRE HORS ACCIDENT CIRC. ROUTIÈRE</option>
                          <option value="AUTRE">AUTRE</option>
                        </select>
                      </div>

                      <div>
                        <label className="label block text-gray-700 mb-2">
                          Commune
                        </label>
                        <input
                          {...register('commune')}
                          className="input w-full"
                          disabled={isSubmitting}
                        />
                      </div>

                      <div>
                        <label className="label block text-gray-700 mb-2">
                          Code postal
                        </label>
                        <input
                          {...register('codePostal')}
                          className="input w-full"
                          disabled={isSubmitting}
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="label block text-gray-700 mb-2">
                          Résumé des faits
                        </label>
                        <textarea
                          {...register('resume')}
                          className="input w-full h-24 resize-none"
                          disabled={isSubmitting}
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="label block text-gray-700 mb-2">
                          Blessures (nombre de jours d&apos;ITT et détail)
                        </label>
                        <textarea
                          {...register('blessures')}
                          className="input w-full h-20 resize-none"
                          disabled={isSubmitting}
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="label block text-gray-700 mb-2">
                          Qualifications pénales susceptibles d&apos;être retenues
                        </label>
                        <input
                          {...register('qualificationsPenales')}
                          className="input w-full"
                          disabled={isSubmitting}
                        />
                      </div>

                      <div>
                        <label className="label block text-gray-700 mb-2">
                          Date d&apos;audience
                        </label>
                        <input
                          {...register('dateAudience')}
                          type="date"
                          className="input w-full"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Partie civile */}
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Partie civile</h4>
                    <div className="space-y-4">
                      <label className="flex items-center cursor-pointer p-2 rounded-md hover:bg-red-100 transition-colors">
                        <input
                          {...register('partieCivile')}
                          type="checkbox"
                          className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors"
                        />
                        <span className="ml-3 text-sm font-medium text-gray-700 select-none">
                          Constitution de partie civile
                        </span>
                      </label>

                      {partieCivile && (
                        <div>
                          <label className="label block text-gray-700 mb-2">
                            Montant réclamé (€)
                          </label>
                          <input
                            {...register('montantPartieCivile', { valueAsNumber: true })}
                            type="number"
                            min="0"
                            step="0.01"
                            className="input w-full md:w-1/2"
                            disabled={isSubmitting}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Soutiens */}
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Soutiens demandés</h4>
                    <div className="space-y-2">
                      <label className="flex items-center cursor-pointer p-2 rounded-md hover:bg-green-100 transition-colors">
                        <input
                          {...register('soutienPsychologique')}
                          type="checkbox"
                          className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors"
                        />
                        <span className="ml-3 text-sm font-medium text-gray-700 select-none">
                          Soutien psychologique
                        </span>
                      </label>

                      <label className="flex items-center cursor-pointer p-2 rounded-md hover:bg-green-100 transition-colors">
                        <input
                          {...register('soutienSocial')}
                          type="checkbox"
                          className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors"
                        />
                        <span className="ml-3 text-sm font-medium text-gray-700 select-none">
                          Soutien social
                        </span>
                      </label>

                      <label className="flex items-center cursor-pointer p-2 rounded-md hover:bg-green-100 transition-colors">
                        <input
                          {...register('soutienMedical')}
                          type="checkbox"
                          className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors"
                        />
                        <span className="ml-3 text-sm font-medium text-gray-700 select-none">
                          Soutien médical
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={onClose}
                      className="btn-secondary"
                      disabled={isSubmitting}
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Enregistrement...' : demande ? 'Modifier' : 'Créer'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

export default DemandeModal
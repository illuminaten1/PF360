import { Layout } from 'react-grid-layout'

export const INITIAL_GRID_LAYOUTS = {
  lg: [
    { i: 'general', x: 0, y: 0, w: 3, h: 5, minW: 3, minH: 3 },
    { i: 'users', x: 3, y: 0, w: 9, h: 25, minW: 4, minH: 6 },
    { i: 'extraction', x: 0, y: 56, w: 8, h: 14, minW: 4, minH: 4 },
    { i: 'badges', x: 0, y: 14, w: 3, h: 6, minW: 3, minH: 4 },
    { i: 'reponseBrpf', x: 3, y: 56, w: 3, h: 14, minW: 3, minH: 8 },
    { i: 'bap', x: 6, y: 40, w: 2, h: 16, minW: 2, minH: 4 },
    { i: 'qualite', x: 0, y: 20, w: 3, h: 5, minW: 2, minH: 4 },
    { i: 'infractions', x: 3, y: 25, w: 5, h: 15, minW: 2, minH: 4 },
    { i: 'contexte', x: 0, y: 37, w: 3, h: 19, minW: 2, minH: 4 },
    { i: 'formation', x: 3, y: 40, w: 3, h: 16, minW: 2, minH: 4 },
    { i: 'branche', x: 8, y: 56, w: 4, h: 14, minW: 2, minH: 4 },
    { i: 'statut', x: 0, y: 25, w: 3, h: 12, minW: 2, minH: 4 },
    { i: 'autocontrole', x: 0, y: 5, w: 3, h: 9, minW: 2, minH: 6 },
    { i: 'fluxmensuels', x: 8, y: 25, w: 4, h: 15, minW: 4, minH: 6 },
    { i: 'fluxhebdo', x: 8, y: 40, w: 4, h: 16, minW: 4, minH: 8 }
  ] as Layout[],
  md: [
    { i: 'general', x: 0, y: 0, w: 5, h: 4, minW: 3, minH: 3 },
    { i: 'users', x: 5, y: 0, w: 5, h: 8, minW: 4, minH: 6 },
    { i: 'extraction', x: 0, y: 4, w: 5, h: 6, minW: 4, minH: 4 },
    { i: 'badges', x: 5, y: 8, w: 5, h: 6, minW: 3, minH: 4 },
    { i: 'reponseBrpf', x: 0, y: 10, w: 5, h: 8, minW: 3, minH: 6 },
    { i: 'bap', x: 5, y: 14, w: 5, h: 6, minW: 3, minH: 4 },
    { i: 'qualite', x: 0, y: 18, w: 5, h: 6, minW: 3, minH: 4 },
    { i: 'infractions', x: 5, y: 20, w: 5, h: 6, minW: 3, minH: 4 },
    { i: 'contexte', x: 0, y: 24, w: 5, h: 6, minW: 3, minH: 4 },
    { i: 'formation', x: 5, y: 26, w: 5, h: 6, minW: 3, minH: 4 },
    { i: 'branche', x: 0, y: 30, w: 5, h: 6, minW: 3, minH: 4 },
    { i: 'statut', x: 5, y: 32, w: 5, h: 6, minW: 3, minH: 4 },
    { i: 'autocontrole', x: 0, y: 36, w: 5, h: 8, minW: 3, minH: 6 },
    { i: 'fluxmensuels', x: 5, y: 38, w: 5, h: 8, minW: 4, minH: 6 },
    { i: 'fluxhebdo', x: 0, y: 44, w: 10, h: 10, minW: 6, minH: 8 }
  ] as Layout[],
  sm: [
    { i: 'general', x: 0, y: 0, w: 6, h: 4, minW: 4, minH: 3 },
    { i: 'users', x: 0, y: 4, w: 6, h: 8, minW: 4, minH: 6 },
    { i: 'extraction', x: 0, y: 12, w: 6, h: 6, minW: 4, minH: 4 },
    { i: 'badges', x: 0, y: 18, w: 6, h: 6, minW: 4, minH: 4 },
    { i: 'reponseBrpf', x: 0, y: 24, w: 6, h: 8, minW: 4, minH: 6 },
    { i: 'bap', x: 0, y: 32, w: 6, h: 6, minW: 4, minH: 4 },
    { i: 'qualite', x: 0, y: 38, w: 6, h: 6, minW: 4, minH: 4 },
    { i: 'infractions', x: 0, y: 44, w: 6, h: 6, minW: 4, minH: 4 },
    { i: 'contexte', x: 0, y: 50, w: 6, h: 6, minW: 4, minH: 4 },
    { i: 'formation', x: 0, y: 56, w: 6, h: 6, minW: 4, minH: 4 },
    { i: 'branche', x: 0, y: 62, w: 6, h: 6, minW: 4, minH: 4 },
    { i: 'statut', x: 0, y: 68, w: 6, h: 6, minW: 4, minH: 4 },
    { i: 'autocontrole', x: 0, y: 74, w: 6, h: 8, minW: 4, minH: 6 },
    { i: 'fluxmensuels', x: 0, y: 82, w: 6, h: 8, minW: 4, minH: 6 },
    { i: 'fluxhebdo', x: 0, y: 90, w: 6, h: 10, minW: 4, minH: 8 }
  ] as Layout[]
}
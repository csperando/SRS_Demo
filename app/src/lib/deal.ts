import type { DealInputs } from './sizing'

export interface Deal {
  id: string
  name: string
  propertyType: string
  location: string
  source: 'mock' | 'excel' | 'google-sheet'
  inputs: DealInputs
}

import type { Deal } from '../lib/deal'
import type { MarketRates } from '../lib/sizing'
import harborIndustrial from './deals/harbor-industrial.json'
import meridianRetail from './deals/meridian-retail.json'
import riversidePlaza from './deals/riverside-plaza.json'
import summitOffice from './deals/summit-office.json'
import rates from './rates.json'

export const mockDeals: Deal[] = [riversidePlaza, harborIndustrial, meridianRetail, summitOffice] as Deal[]

export const mockRates: MarketRates = rates as MarketRates

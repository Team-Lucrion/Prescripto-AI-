import { CreditPack } from './types';

export const CREDIT_PACKS: CreditPack[] = [
  {
    id: 'starter',
    name: 'Starter Pack',
    price: 49,
    credits: 20,
    label: 'Good for trying',
    description: 'Perfect for a single prescription analysis'
  },
  {
    id: 'popular',
    name: 'Popular Pack',
    price: 99,
    credits: 50,
    label: 'Most Popular',
    badge: 'Best Seller',
    description: 'Ideal for family health management'
  },
  {
    id: 'power',
    name: 'Power Pack',
    price: 199,
    credits: 120,
    label: 'Best Value',
    description: 'Maximum savings for chronic care'
  }
];

export const ANALYSIS_COSTS = {
  BASIC: 1,
  PRO: 3
};

export const ADMIN_PASSWORD = 'hidden-admin-portal-7x92'; // In a real app, this would be handled differently

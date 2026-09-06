import React from 'react';
import { Filter, RotateCcw } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { COMMODITIES } from '../constants/commodities';
import { INDIAN_LOCATIONS } from '../constants/locations';

export default function FilterPanel({ 
  filters, 
  onFilterChange, 
  onReset 
}) {
  const { t } = useLanguage();

  // Extract list of unique district & market locations for filtering
  const allLocations = [
    'Nashik',
    'Lasalgaon',
    'Pimpalgaon',
    'Pune',
    'Ahmednagar',
    'Nagpur',
    'Solapur',
    'Indore',
    'Neemuch',
    'Mandsaur',
    'Rajkot',
    'Ahmedabad',
    'Unjha',
    'Ludhiana',
    'Amritsar',
    'Karnal'
  ];

  return (
    <div className="filter-panel">
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: '0.85rem', color: 'var(--neutral-700)' }}>
        <Filter size={16} /> {t('filter.filters', 'Filters')}:
      </div>

      {/* Produce Filter */}
      <select 
        className="filter-select"
        value={filters.produce || ''} 
        onChange={(e) => onFilterChange('produce', e.target.value)}
      >
        <option value="">{t('filter.allProduce', 'All Commodities')}</option>
        {COMMODITIES.map((c) => (
          <option key={c.id} value={c.name}>
            {c.emoji} {c.name} {c.hindiName ? `(${c.hindiName})` : ''}
          </option>
        ))}
      </select>

      {/* Location Filter */}
      <select 
        className="filter-select"
        value={filters.location || ''} 
        onChange={(e) => onFilterChange('location', e.target.value)}
      >
        <option value="">{t('filter.allLocations', 'All Locations')}</option>
        {allLocations.map((loc) => (
          <option key={loc} value={loc}>{loc}</option>
        ))}
      </select>

      {/* Quality Grade Filter */}
      <select 
        className="filter-select"
        value={filters.quality || ''} 
        onChange={(e) => onFilterChange('quality', e.target.value)}
      >
        <option value="">{t('filter.allQualityGrades', 'All Quality Grades')}</option>
        <option value="Grade A">{t('filter.gradeAPremium', 'Grade A (Premium)')}</option>
        <option value="Grade B">{t('filter.gradeBStandard', 'Grade B (Standard)')}</option>
        <option value="Grade C">Grade C (Processing / Industrial)</option>
      </select>

      {/* Supplier Type Filter */}
      <select 
        className="filter-select"
        value={filters.type || ''} 
        onChange={(e) => onFilterChange('type', e.target.value)}
      >
        <option value="">{t('filter.allSuppliers', 'All Suppliers (Farmers & FPOs)')}</option>
        <option value="Farmer">{t('filter.individualFarmersOnly', 'Individual Farmers Only')}</option>
        <option value="FPO">{t('filter.fposOnly', 'FPOs (Farmer Producer Orgs)')}</option>
      </select>

      {/* Storage Filter */}
      <select 
        className="filter-select"
        value={filters.storageAvailable || ''} 
        onChange={(e) => onFilterChange('storageAvailable', e.target.value)}
      >
        <option value="">{t('filter.storageAny', 'Storage Any')}</option>
        <option value="true">{t('filter.onFarmStorageReady', 'On-farm Storage Ready')}</option>
      </select>

      {/* Reset button */}
      <button 
        className="btn btn-secondary btn-sm" 
        style={{ marginLeft: 'auto', gap: 4 }}
        onClick={onReset}
      >
        <RotateCcw size={13} /> {t('btn.resetFilters', 'Reset Filters')}
      </button>
    </div>
  );
}

import React from 'react';
import { Search } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function SearchBar({ 
  value = '', 
  onChange, 
  onSearch, 
  placeholder 
}) {
  const { t } = useLanguage();
  const effectivePlaceholder = placeholder || t('search.placeholder', 'Search produce, mandis, or farmers...');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(value);
    }
  };

  return (
    <form 
      className="topbar-search" 
      onSubmit={handleSubmit}
      style={{ 
        maxWidth: '100%', 
        display: 'flex', 
        alignItems: 'center',
        paddingRight: 4
      }}
    >
      <Search className="topbar-search-icon" size={18} />
      <input 
        type="text" 
        value={value} 
        onChange={(e) => onChange && onChange(e.target.value)} 
        placeholder={effectivePlaceholder}
        style={{ flex: 1 }}
      />
      <button
        type="submit"
        className="btn btn-primary btn-sm"
        title={t('common.search', 'Search')}
        aria-label={t('common.search', 'Search')}
        style={{
          padding: '5px 12px',
          fontSize: '0.8rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          borderRadius: 'var(--radius-sm)',
          height: 30,
          border: 'none',
          flexShrink: 0
        }}
      >
        <Search size={13} />
        <span>{t('common.search', 'Search')}</span>
      </button>
    </form>
  );
}

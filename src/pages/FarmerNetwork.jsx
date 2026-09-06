import React, { useState } from 'react';
import { Users, ShieldCheck, MapPin, Building, Search, Sprout } from 'lucide-react';
import FPOCard from '../components/FPOCard';
import Modal from '../components/Modal';
import { useLanguage } from '../context/LanguageContext';

export default function FarmerNetwork({ 
  fpoList = [], 
  farmerListings = [],
  onSelectFPO 
}) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('fpos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFPOModal, setSelectedFPOModal] = useState(null);

  const filteredFPOs = fpoList.filter((fpo) => 
    fpo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    fpo.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">{t('network.title', 'Verified Regional Farmer & FPO Network')}</h1>
        <p className="page-subtitle">
          {t('network.subtitle', 'Partner directly with registered Farmer Producer Companies (FPOs) and individual cultivators in Maharashtra.')}
        </p>
      </div>

      {/* Tabs Switcher */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <button 
            className={`btn ${activeTab === 'fpos' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('fpos')}
          >
            <Users size={16} /> {t('network.fpos', 'Farmer Producer Orgs (FPOs)')} ({fpoList.length})
          </button>
          <button 
            className={`btn ${activeTab === 'farmers' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('farmers')}
          >
            <Sprout size={16} /> {t('network.individualCultivators', 'Individual Cultivators')} ({farmerListings.length})
          </button>
        </div>

        <div style={{ minWidth: 260 }}>
          <input 
            type="text" 
            className="form-control" 
            placeholder={t('network.searchPlaceholder', 'Search by name, district...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {activeTab === 'fpos' ? (
        <div className="cards-grid">
          {filteredFPOs.map((fpo) => (
            <FPOCard 
              key={fpo.id} 
              fpo={fpo} 
              onViewFPO={(f) => setSelectedFPOModal(f)}
            />
          ))}
        </div>
      ) : (
        <div className="cards-grid">
          {farmerListings.map((farmer) => (
            <div key={farmer.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 800 }}>{farmer.farmerName}</h4>
                  <div style={{ fontSize: '0.8rem', color: 'var(--neutral-500)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <MapPin size={13} /> {farmer.location}
                  </div>
                </div>
                <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>{t('common.verified', 'Verified')} ✓</span>
              </div>

              <div style={{ background: 'var(--neutral-50)', padding: 10, borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
                <div>{t('produce.crop', 'Crop')}: <strong>{farmer.emoji || '🌾'} {farmer.produce} ({farmer.quality || 'Grade A'})</strong></div>
                <div style={{ marginTop: 2 }}>{t('produce.currentStock', 'Current Stock')}: <strong>{(farmer.quantity || 0).toLocaleString()} kg</strong></div>
                <div style={{ marginTop: 2, color: 'var(--primary-700)', fontWeight: 700 }}>₹{farmer.expectedPrice || 2800} / {t('common.quintal', 'quintal')}</div>
              </div>

              <div style={{ fontSize: '0.78rem', color: 'var(--neutral-500)', marginTop: 'auto' }}>
                {t('common.contact', 'Contact')}: {farmer.phone}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FPO Details Modal */}
      {selectedFPOModal && (
        <Modal
          isOpen={!!selectedFPOModal}
          onClose={() => setSelectedFPOModal(null)}
          title={selectedFPOModal.name}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: 'var(--primary-50)', padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid var(--primary-200)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="badge badge-success">{t('fpo.govtRegisteredBadge', 'Govt Registered & SFAC Certified ✓')}</span>
                <span style={{ fontWeight: 800, color: 'var(--primary-800)' }}>{selectedFPOModal.membersCount} {t('fpo.memberFarmers', 'Member Farmers')}</span>
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary-900)', marginTop: 6 }}>
                {t('fpo.aggregatedReadyStock', 'Aggregated Ready Stock')}: {selectedFPOModal.currentStockKg.toLocaleString()} kg
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 800 }}>{t('fpo.availableCropsInfra', 'Available Crops & Infrastructure')}</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                {selectedFPOModal.availableProduce.map((p, idx) => (
                  <span key={idx} className="badge badge-grade">{p}</span>
                ))}
              </div>

              <p style={{ fontSize: '0.85rem', color: 'var(--neutral-700)', marginTop: 12 }}>
                <strong>{t('fpo.facilities', 'Facilities')}:</strong> {selectedFPOModal.facilities ? selectedFPOModal.facilities.join(', ') : 'Grading & Sorting packhouse, Solar drying'}
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--neutral-700)', marginTop: 4 }}>
                <strong>{t('fpo.districtHeadOffice', 'District Head Office')}:</strong> {selectedFPOModal.location}
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--neutral-700)', marginTop: 4 }}>
                <strong>{t('fpo.chiefExecutiveContact', 'Chief Executive / Contact')}:</strong> {selectedFPOModal.contactPerson} ({selectedFPOModal.phone})
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
              <button 
                className="btn btn-primary"
                onClick={() => {
                  if (onSelectFPO) onSelectFPO(selectedFPOModal);
                  setSelectedFPOModal(null);
                }}
              >
                {t('fpo.sendRfp', 'Send Sourcing RFP to FPO')}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

import React from 'react';
import RouteVisualizer from '../components/RouteVisualizer';
import { useLanguage } from '../context/LanguageContext';

export default function Logistics({ logisticsData }) {
  const { t } = useLanguage();

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">{t('logistics.title', 'Order Delivery Status')}</h1>
        <p className="page-subtitle">
          {t('logistics.subtitle', 'Live transit milestones and fulfillment status for your active agricultural consignments.')}
        </p>
      </div>

      <RouteVisualizer logisticsData={logisticsData} />
    </div>
  );
}

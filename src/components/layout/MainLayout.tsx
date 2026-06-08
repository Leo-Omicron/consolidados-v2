import React, { Suspense, lazy, useEffect, useState } from 'react';
import { Header } from './Header';
import { FileUploadArea } from '../dashboard/FileUploadArea';
import { useThemeStore } from '../../store/useThemeStore';

const ExecutiveTab = lazy(() => import('../dashboard/ExecutiveTab').then(module => ({ default: module.ExecutiveTab })));
const AnalysisTab = lazy(() => import('../dashboard/AnalysisTab').then(module => ({ default: module.AnalysisTab })));
const ChartsTab = lazy(() => import('../dashboard/ChartsTab').then(module => ({ default: module.ChartsTab })));
const ReportsTab = lazy(() => import('../dashboard/ReportsTab').then(module => ({ default: module.ReportsTab })));
const AlertsTab = lazy(() => import('../dashboard/AlertsTab').then(module => ({ default: module.AlertsTab })));
const TutorsTab = lazy(() => import('../dashboard/TutorsTab').then(module => ({ default: module.TutorsTab })));
const HeatmapTab = lazy(() => import('../dashboard/HeatmapTab').then(module => ({ default: module.HeatmapTab })));
const VolatilityTab = lazy(() => import('../dashboard/VolatilityTab').then(module => ({ default: module.VolatilityTab })));

export const MainLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState('analysis');
  const mode = useThemeStore((state) => state.mode);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'executive':
        return <ExecutiveTab />;
      case 'analysis':
        return <AnalysisTab />;
      case 'charts':
        return <ChartsTab />;
      case 'reports':
        return <ReportsTab />;
      case 'alerts':
        return <AlertsTab />;
      case 'tutors':
        return <TutorsTab />;
      case 'volatility':
        return <VolatilityTab />;
      case 'heatmap':
        return <HeatmapTab />;
      default:
        return <AnalysisTab />;
    }
  };

  return (
    <div className="min-h-screen app-bg app-text transition-premium">
      <div className="no-print">
        <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="no-print">
          <FileUploadArea />
        </div>
        <div className="app-surface rounded-xl shadow-premium border app-border min-h-[500px] transition-premium print-card-flat">
          <Suspense fallback={<div className="p-8 text-center app-text-muted">Cargando módulo...</div>}>
            {renderActiveTab()}
          </Suspense>
        </div>
      </main>
    </div>
  );
};

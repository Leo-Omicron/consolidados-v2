import React, { useEffect, useState } from 'react';
import { Header } from './Header';
import { FileUploadArea } from '../dashboard/FileUploadArea';
import { AnalysisTab } from '../dashboard/AnalysisTab';
import { ChartsTab } from '../dashboard/ChartsTab';
import { ReportsTab } from '../dashboard/ReportsTab';
import { AlertsTab } from '../dashboard/AlertsTab';
import { TutorsTab } from '../dashboard/TutorsTab';
import { HeatmapTab } from '../dashboard/HeatmapTab';
import { VolatilityTab } from '../dashboard/VolatilityTab';
import { useThemeStore } from '../../store/useThemeStore';

export const MainLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState('analysis');
  const mode = useThemeStore((state) => state.mode);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  const renderActiveTab = () => {
    switch (activeTab) {
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
          {renderActiveTab()}
        </div>
      </main>
    </div>
  );
};

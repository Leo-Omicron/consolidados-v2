import React, { useState } from 'react';
import { Header } from './Header';
import { FileUploadArea } from '../dashboard/FileUploadArea';
import { AnalysisTab } from '../dashboard/AnalysisTab';
import { ChartsTab } from '../dashboard/ChartsTab';
import { ReportsTab } from '../dashboard/ReportsTab';

export const MainLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState('analysis');

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'analysis':
        return <AnalysisTab />;
      case 'charts':
        return <ChartsTab />;
      case 'reports':
        return <ReportsTab />;
      default:
        return <AnalysisTab />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 transition-premium">
      <div className="no-print">
        <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="no-print">
          <FileUploadArea />
        </div>
        <div className="bg-white rounded-xl shadow-premium border border-slate-200/50 min-h-[500px] transition-premium print-card-flat">
          {renderActiveTab()}
        </div>
      </main>
    </div>
  );
};

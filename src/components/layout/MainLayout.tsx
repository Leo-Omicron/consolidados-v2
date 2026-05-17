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
    <div className="min-h-screen bg-gray-50">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FileUploadArea />
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 min-h-[500px]">
          {renderActiveTab()}
        </div>
      </main>
    </div>
  );
};

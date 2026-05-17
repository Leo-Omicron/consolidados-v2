import React, { useMemo } from 'react';
import { useDashboardStore } from '../../store/useDashboardStore';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export const ChartsTab: React.FC = () => {
  const estudiantes = useDashboardStore(state => state.estudiantes);
  const rowsArea = useDashboardStore(state => state.rowsArea);

  const { areaChartData, statusChartData } = useMemo(() => {
    // Calcular promedio por área
    const areaAverages: Record<string, { total: number; count: number }> = {};
    let aprobados = 0;
    let reprobados = 0;

    rowsArea.forEach(row => {
      if (!areaAverages[row.areaId]) {
        areaAverages[row.areaId] = { total: 0, count: 0 };
      }
      areaAverages[row.areaId].total += row.notaFinal;
      areaAverages[row.areaId].count += 1;

      if (row.estado === 'APROBADO') aprobados++;
      else reprobados++;
    });

    const labels = Object.keys(areaAverages);
    const data = labels.map(label => 
      areaAverages[label].count > 0 
        ? Number((areaAverages[label].total / areaAverages[label].count).toFixed(2)) 
        : 0
    );

    return {
      areaChartData: {
        labels,
        datasets: [
          {
            label: 'Promedio por Área',
            data,
            backgroundColor: 'rgba(59, 130, 246, 0.5)',
            borderColor: 'rgb(59, 130, 246)',
            borderWidth: 1,
          },
        ],
      },
      statusChartData: {
        labels: ['Aprobados', 'Reprobados'],
        datasets: [
          {
            data: [aprobados, reprobados],
            backgroundColor: [
              'rgba(34, 197, 94, 0.5)',
              'rgba(239, 68, 68, 0.5)',
            ],
            borderColor: [
              'rgb(34, 197, 94)',
              'rgb(239, 68, 68)',
            ],
            borderWidth: 1,
          },
        ],
      }
    };
  }, [rowsArea]);

  if (estudiantes.length === 0) {
    return <div className="p-8 text-center text-gray-500">No hay datos para visualizar. Cargue un archivo Excel.</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-lg font-medium mb-6">Visualización de Rendimiento</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-sm font-medium text-gray-700 mb-4 text-center">Promedio General por Área</h3>
          <div className="h-64">
            <Bar 
              data={areaChartData} 
              options={{ 
                responsive: true, 
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 10
                  }
                }
              }} 
            />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-sm font-medium text-gray-700 mb-4 text-center">Distribución de Estados (Por Área/Estudiante)</h3>
          <div className="h-64 flex justify-center">
            <Pie 
              data={statusChartData} 
              options={{ 
                responsive: true, 
                maintainAspectRatio: false 
              }} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

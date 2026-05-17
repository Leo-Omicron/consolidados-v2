const XLSX = require('xlsx');
const wb = XLSX.utils.book_new();
const rawData = [
  ['No', 'Estudiante', 'CIENCIAS NATURALES', '', '', '', '', '', '', '', 'MATEMATICAS', '', '', '', 'HUMANIDADES', '', '', ''],
  ['', '', 'BIOLOGIA', '', '', 'QUIMICA', '', '', 'FISICA', '', 'ALGEBRA', '', '', 'GEOMETRIA', 'LENGUAJE', '', '', 'INGLES'],
  ['', '', 'P1', 'P2', 'P3', 'P1', 'P2', 'P3', 'P1', 'P2', 'P1', 'P2', 'P3', 'P1', 'P1', 'P2', 'P3', 'P1'],
  [1, 'Perez, Juan', 4.5, 4.0, '', 3.8, 4.2, '', 4.0, 4.1, 4.5, 4.8, '', 4.0, 3.5, 3.8, '', 4.2],
  [2, 'Gomez, Maria', 3.0, 2.5, '', 2.8, 3.1, '', 2.5, 2.0, 4.0, 3.8, '', 3.5, 4.0, 4.2, '', 3.8],
  [3, 'Lopez, Carlos', 3.5, 3.8, '', 3.9, 4.0, '', 3.5, 3.6, 1.5, 2.0, '', 2.0, 3.0, 3.2, '', 3.0],
  [4, 'Diaz, Ana', 4.0, 4.2, '', 3.5, 3.0, '', 4.8, 4.5, 3.2, 3.5, '', 3.8, 4.5, 4.8, '', 4.6],
  [5, 'Ruiz, Pedro', '', 3.0, '', 3.2, '', '', '', 2.8, 3.5, '', '', 3.0, 4.0, '', '', 3.5]
];
const ws = XLSX.utils.aoa_to_sheet(rawData);
XLSX.utils.book_append_sheet(wb, ws, '10A');
XLSX.writeFile(wb, 'Consolidado_Mock_10A.xlsx');
console.log('Mock Excel file created: Consolidado_Mock_10A.xlsx');

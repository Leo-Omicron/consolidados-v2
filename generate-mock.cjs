const XLSX = require('xlsx');
const wb = XLSX.utils.book_new();

// Header has: No, Estudiante, 
// CIENCIAS NATURALES (BIOLOGIA, QUIMICA, FISICA, DEF),
// MATEMATICAS (ALGEBRA, GEOMETRIA, DEF),
// HUMANIDADES (LENGUAJE, INGLES, DEF)
const rawData = [
  ['No', 'Estudiante', 'CIENCIAS NATURALES', '', '', '', '', '', '', '', '', '', '', 'MATEMATICAS', '', '', '', '', '', '', '', '', 'HUMANIDADES', '', '', '', '', '', '', '', ''],
  ['', '', 'BIOLOGIA', '', '', 'QUIMICA', '', '', 'FISICA', '', '', 'DEF', '', '', 'ALGEBRA', '', '', 'GEOMETRIA', '', '', 'DEF', '', '', 'LENGUAJE', '', '', 'INGLES', '', '', 'DEF', '', ''],
  ['', '', 'P1', 'P2', 'P3', 'P1', 'P2', 'P3', 'P1', 'P2', 'P3', 'P1', 'P2', 'P3', 'P1', 'P2', 'P3', 'P1', 'P2', 'P3', 'P1', 'P2', 'P3', 'P1', 'P2', 'P3', 'P1', 'P2', 'P3', 'P1', 'P2', 'P3'],
  // Estudiante 1 (Buen rendimiento)
  [1, 'Perez, Juan', 4.5, 4.0, 4.2, 3.8, 4.2, 4.0, 4.0, 4.1, 4.1, 4.1, 4.1, 4.1, 4.5, 4.8, 4.6, 4.0, 3.5, 3.8, 4.2, 4.1, 4.2, 3.8, 4.0, 3.9, 4.2, 4.5, 4.3, 4.0, 4.2, 4.1],
  // Estudiante 2 (Riesgo en ciencias)
  [2, 'Gomez, Maria', 3.0, 2.5, 2.8, 2.8, 3.1, 3.0, 2.5, 2.0, 2.2, 2.7, 2.5, 2.6, 4.0, 3.8, 3.9, 3.5, 4.0, 3.8, 3.7, 3.9, 3.8, 4.2, 3.8, 4.0, 3.8, 4.0, 3.9, 4.0, 3.9, 3.9],
  // Estudiante 3 (Perdido en mates)
  [3, 'Lopez, Carlos', 3.5, 3.8, 3.6, 3.9, 4.0, 3.9, 3.5, 3.6, 3.5, 3.6, 3.8, 3.6, 1.5, 2.0, 1.8, 2.0, 3.0, 2.5, 1.7, 2.5, 2.1, 3.2, 3.0, 3.1, 3.0, 3.5, 3.2, 3.1, 3.2, 3.1],
  // Estudiante 4 (Variado)
  [4, 'Diaz, Ana', 4.0, 4.2, 4.1, 3.5, 3.0, 3.2, 4.8, 4.5, 4.6, 4.1, 3.9, 3.9, 3.2, 3.5, 3.3, 3.8, 4.5, 4.1, 3.5, 4.0, 3.7, 4.8, 4.6, 4.7, 4.2, 4.0, 4.1, 4.5, 4.3, 4.4],
  // Estudiante 5 (Faltan notas)
  [5, 'Ruiz, Pedro', '', 3.0, '', 3.2, '', '', '', 2.8, '', '', 2.9, '', 3.5, '', '', 3.0, 4.0, '', 3.2, '', '', '', '', '', 3.5, '', '', '', '', '']
];
const ws = XLSX.utils.aoa_to_sheet(rawData);
XLSX.utils.book_append_sheet(wb, ws, '10A');
XLSX.writeFile(wb, 'Consolidado_Mock_10A.xlsx');
console.log('Mock Excel file created: Consolidado_Mock_10A.xlsx');

import * as XLSX from 'xlsx';

export function generateMockExcelBuffer(): Buffer {
  // We mock a legacy excel format for simplicity since excelParser.ts supports it.
  const aoa = [
    ['', 'ESTUDIANTE', 'MATEMÁTICAS', 'MATEMÁTICAS', 'CIENCIAS', 'CIENCIAS', 'PRO'],
    ['', '',           'MAT',         'MAT',         'NAT',      'NAT',      'PRO'],
    ['', '',           'P1',          'P2',          'P1',       'P2',       'PRO'],
    ['1', 'Juan Perez', 4.0,           5.0,           3.0,        3.5,        3.88],
    ['2', 'Ana Gomez',  2.0,           3.0,           4.0,        5.0,        3.50]
  ];
  
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Grupo 1');
  
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  
  return buffer;
}

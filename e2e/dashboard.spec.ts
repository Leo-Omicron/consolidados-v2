import { test, expect } from '@playwright/test';
import { generateMockExcelBuffer } from './fixtures/generateMock';

const MOCK_FILE_NAME = 'mock-consolidados.xlsx';

test.describe('Dashboard Baseline E2E', () => {
  test('CUJ 1: Verificar carga del dashboard y título principal', async ({ page }) => {
    // 1. Navegar a la página principal
    await page.goto('/');

    // 2. Esperar a que el título principal sea visible (usamos el selector por rol 'heading')
    const mainHeading = page.getByRole('heading', { name: /Cargar Datos de Estudiantes/i });
    await expect(mainHeading).toBeVisible();

    // 3. Verificar que el área de subida de archivos está presente
    const fileUploadAreaText = page.getByText(/Arrastrá y soltá tu planilla Excel/i);
    await expect(fileUploadAreaText).toBeVisible();
  });

  test('CUJ 3: Data-Driven Flow - Subida de Excel y cálculo estadístico', async ({ page }) => {
    // 1. Navegar a la página principal
    await page.goto('/');

    // Generar el buffer en memoria (sin I/O de disco)
    const excelBuffer = generateMockExcelBuffer();

    // Usar el aria-label correcto para accesibilidad
    const fileInput = page.getByLabel('Subir archivo Excel');
    
    // Inyectar el archivo como buffer directamente
    await fileInput.setInputFiles({
      name: MOCK_FILE_NAME,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: excelBuffer,
    });

    // 2. Esperar a que la tabla de promedios se renderice buscando los estudiantes
    const student1Cell = page.getByText('Juan Perez').first();
    await expect(student1Cell).toBeVisible();

    const student2Cell = page.getByText('Ana Gomez').first();
    await expect(student2Cell).toBeVisible();

    // 3. Verificar que los cálculos de Promedios están presentes en la UI usando la fila del estudiante
    const juanRow = page.locator('div').filter({ hasText: 'Juan Perez' }).filter({ hasText: '3.90' });
    await expect(juanRow.first()).toBeVisible();

    const anaRow = page.locator('div').filter({ hasText: 'Ana Gomez' }).filter({ hasText: '3.50' });
    await expect(anaRow.first()).toBeVisible();
  });
});

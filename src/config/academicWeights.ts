export function getPresetWeights(areaName: string, subjects: string[], grade: number): Record<string, number> | null {
  const normArea = areaName.toUpperCase().trim();
  const normSubjects = subjects.map(s => s.toUpperCase().trim());

  // 1. Área de Humanidades
  if (normArea === 'HUMANIDADES Y LENGUA CASTELLANA' || normArea === 'HUMANIDADES' || normArea === 'HUMANIDADES Y LENGUA CAST') {
    const compKey = subjects.find(s => s.toUpperCase().trim() === 'COMPRENSION LECTORA' || s.toUpperCase().trim() === 'COMPRENSIÓN LECTORA') || '';
    const espKey = subjects.find(s => s.toUpperCase().trim() === 'ESPAÑOL' || s.toUpperCase().trim() === 'ESPANOL') || '';
    
    if (compKey && espKey) {
      if (grade >= 10) {
        return { [compKey]: 0.60, [espKey]: 0.40 };
      } else {
        // Grados 1 al 9
        return { [compKey]: 0.50, [espKey]: 0.50 };
      }
    }
  }

  // 2. Área de Matemáticas
  if (normArea === 'MATEMATICAS' || normArea === 'MATEMÁTICAS') {
    const estKey = subjects.find(s => s.toUpperCase().trim().includes('ESTADI')) || '';
    const geoKey = subjects.find(s => s.toUpperCase().trim().includes('GEOME')) || '';
    const matKey = subjects.find(s => 
      s.toUpperCase().trim() === 'MATEMATICA' || 
      s.toUpperCase().trim() === 'MATEMÁTICA' || 
      s.toUpperCase().trim() === 'MATEMATICAS' || 
      s.toUpperCase().trim() === 'MATEMÁTICAS' || 
      s.toUpperCase().trim() === 'ARITMETICA' || 
      s.toUpperCase().trim() === 'ARITMÉTICA' || 
      s.toUpperCase().trim() === 'ALGEBRA' || 
      s.toUpperCase().trim() === 'ÁLGEBRA' || 
      s.toUpperCase().trim() === 'TRIGONOMETRIA' || 
      s.toUpperCase().trim() === 'TRIGONOMETRÍA' || 
      s.toUpperCase().trim() === 'CALCULO' || 
      s.toUpperCase().trim() === 'CÁLCULO'
    ) || '';

    if (estKey && geoKey && matKey) {
      if (grade >= 1 && grade <= 5) {
        return { [estKey]: 0.25, [geoKey]: 0.25, [matKey]: 0.50 };
      } else {
        // Grados 6 al 11
        return { [estKey]: 0.30, [geoKey]: 0.20, [matKey]: 0.50 };
      }
    }
  }

  // 3. Área de Ciencias Naturales
  if (normArea === 'CIENCIAS NATURALES Y AMBIENTALES' || normArea === 'CIENCIAS NATURALES' || normArea === 'NATURALES') {
    if (grade >= 1 && grade <= 5) {
      const ambKey = subjects.find(s => s.toUpperCase().trim().includes('AMBIENTAL')) || '';
      const natKey = subjects.find(s => s.toUpperCase().trim() === 'NATURALES' || s.toUpperCase().trim() === 'CIENCIAS NATURALES') || '';
      if (ambKey && natKey) {
        return { [ambKey]: 0.60, [natKey]: 0.40 };
      }
    } else if (grade >= 6 && grade <= 9) {
      const ambKey = subjects.find(s => s.toUpperCase().trim().includes('AMBIENTAL')) || '';
      const bioKey = subjects.find(s => s.toUpperCase().trim() === 'BIOLOGIA' || s.toUpperCase().trim() === 'BIOLOGÍA') || '';
      if (ambKey && bioKey) {
        return { [ambKey]: 0.40, [bioKey]: 0.60 };
      }
    } else if (grade >= 10) {
      // Excepción detectada: Sólo Física y Química
      const quiKey = subjects.find(s => s.toUpperCase().trim() === 'QUIMICA' || s.toUpperCase().trim() === 'QUÍMICA') || '';
      const fisKey = subjects.find(s => s.toUpperCase().trim() === 'FISICA' || s.toUpperCase().trim() === 'FÍSICA') || '';
      if (quiKey && fisKey) {
        return { [quiKey]: 0.50, [fisKey]: 0.50 };
      }
    }
  }

  // 4. Área de Ciencias Sociales
  if (normArea === 'CIENCIAS SOCIALES' || normArea === 'SOCIALES') {
    const histKey = subjects.find(s => s.toUpperCase().trim() === 'HISTORIA' || s.toUpperCase().trim() === 'HISTORÍA') || '';
    const geoKey = subjects.find(s => s.toUpperCase().trim() === 'GEOGRAFIA' || s.toUpperCase().trim() === 'GEOGRAFÍA') || '';
    const compKey = subjects.find(s => s.toUpperCase().trim() === 'COMPETENCIAS CIUDADANAS' || s.toUpperCase().trim() === 'COMPETENCIA CIUDADANA') || '';
    const catKey = subjects.find(s => s.toUpperCase().trim() === 'CATEDRA DE LA PAZ' || s.toUpperCase().trim() === 'CÁTEDRA DE LA PAZ' || s.toUpperCase().trim() === 'CATEDRA' || s.toUpperCase().trim() === 'CÁTEDRA') || '';
    const ecoKey = subjects.find(s => s.toUpperCase().trim() === 'ECONOMIA' || s.toUpperCase().trim() === 'ECONOMÍA') || '';

    if (grade >= 1 && grade <= 8) {
      if (histKey && geoKey && compKey) {
        return { [histKey]: 0.40, [geoKey]: 0.20, [compKey]: 0.40 };
      }
    } else if (grade === 9) {
      // Excepción detectada: Sin Geografía, con Cátedra de la Paz
      if (histKey && catKey && compKey) {
        return { [histKey]: 0.40, [catKey]: 0.20, [compKey]: 0.40 };
      }
    } else if (grade >= 10) {
      if (ecoKey && compKey) {
        return { [ecoKey]: 0.50, [compKey]: 0.50 };
      }
    }
  }

  return null;
}

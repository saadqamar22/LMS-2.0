/**
 * GPA Calculator Utilities
 * Converts percentage to GPA (out of 4.0) and vice versa
 */

/**
 * Convert percentage to GPA (out of 4.0)
 * Standard conversion:
 * 90-100% = 4.0 (A)
 * 80-89% = 3.0-3.9 (B)
 * 70-79% = 2.0-2.9 (C)
 * 60-69% = 1.0-1.9 (D)
 * Below 60% = 0.0-0.9 (F)
 */
export function percentageToGPA(percentage: number): number {
  if (percentage >= 90) return 4.0;
  if (percentage >= 80) return 3.0 + ((percentage - 80) / 10) * 0.9; // 3.0 to 3.9
  if (percentage >= 70) return 2.0 + ((percentage - 70) / 10) * 0.9; // 2.0 to 2.9
  if (percentage >= 60) return 1.0 + ((percentage - 60) / 10) * 0.9; // 1.0 to 1.9
  if (percentage >= 50) return 0.0 + ((percentage - 50) / 10) * 0.9; // 0.0 to 0.9
  return 0.0;
}

/**
 * Convert GPA (out of 4.0) to percentage
 */
export function gpaToPercentage(gpa: number): number {
  if (gpa >= 4.0) return 100;
  if (gpa >= 3.0) return 80 + ((gpa - 3.0) / 0.9) * 10; // 80-89%
  if (gpa >= 2.0) return 70 + ((gpa - 2.0) / 0.9) * 10; // 70-79%
  if (gpa >= 1.0) return 60 + ((gpa - 1.0) / 0.9) * 10; // 60-69%
  if (gpa >= 0.0) return 50 + ((gpa - 0.0) / 0.9) * 10; // 50-59%
  return 0;
}

/**
 * Calculate overall GPA from marks
 * Takes an array of marks with obtained_marks and module_total_marks
 */
export function calculateGPAFromMarks(
  marks: Array<{ obtained_marks: number | null | undefined; module_total_marks: number | null | undefined }>,
): { gpa: number; percentage: number } {
  const validMarks = marks.filter(
    (m) => 
      m.obtained_marks !== null && 
      m.obtained_marks !== undefined &&
      m.module_total_marks !== null && 
      m.module_total_marks !== undefined && 
      m.module_total_marks > 0,
  );

  if (validMarks.length === 0) {
    return { gpa: 0, percentage: 0 };
  }

  const totalObtained = validMarks.reduce((sum, m) => sum + (m.obtained_marks || 0), 0);
  const totalPossible = validMarks.reduce((sum, m) => sum + (m.module_total_marks || 0), 0);
  const percentage = totalPossible > 0 ? (totalObtained / totalPossible) * 100 : 0;
  const gpa = percentageToGPA(percentage);

  return {
    gpa: Math.round(gpa * 100) / 100, // Round to 2 decimal places
    percentage: Math.round(percentage * 100) / 100,
  };
}

/**
 * Format GPA for display
 */
export function formatGPA(gpa: number): string {
  return gpa.toFixed(2);
}

/**
 * Format percentage for display
 */
export function formatPercentage(percentage: number): string {
  return `${Math.round(percentage)}%`;
}


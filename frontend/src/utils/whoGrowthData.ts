// WHO Growth Standards Data (simplified)
// Source: WHO Child Growth Standards
// Values are for weight (kg) and height/length (cm) by age in months

export interface GrowthPercentile {
  age: number; // months
  p3: number;
  p15: number;
  p50: number;
  p85: number;
  p97: number;
}

// Boys Weight (kg) by age (months)
export const boysWeight: GrowthPercentile[] = [
  { age: 0, p3: 2.5, p15: 2.9, p50: 3.3, p85: 3.9, p97: 4.4 },
  { age: 1, p3: 3.4, p15: 3.9, p50: 4.5, p85: 5.1, p97: 5.8 },
  { age: 2, p3: 4.3, p15: 4.9, p50: 5.6, p85: 6.3, p97: 7.1 },
  { age: 3, p3: 5.0, p15: 5.7, p50: 6.4, p85: 7.2, p97: 8.0 },
  { age: 4, p3: 5.6, p15: 6.2, p50: 7.0, p85: 7.8, p97: 8.7 },
  { age: 5, p3: 6.0, p15: 6.7, p50: 7.5, p85: 8.4, p97: 9.3 },
  { age: 6, p3: 6.4, p15: 7.1, p50: 7.9, p85: 8.8, p97: 9.8 },
  { age: 7, p3: 6.7, p15: 7.4, p50: 8.3, p85: 9.2, p97: 10.3 },
  { age: 8, p3: 6.9, p15: 7.7, p50: 8.6, p85: 9.6, p97: 10.7 },
  { age: 9, p3: 7.1, p15: 8.0, p50: 8.9, p85: 9.9, p97: 11.0 },
  { age: 10, p3: 7.4, p15: 8.2, p50: 9.2, p85: 10.2, p97: 11.4 },
  { age: 11, p3: 7.6, p15: 8.4, p50: 9.4, p85: 10.5, p97: 11.7 },
  { age: 12, p3: 7.7, p15: 8.6, p50: 9.6, p85: 10.8, p97: 12.0 },
  { age: 18, p3: 8.8, p15: 9.8, p50: 10.9, p85: 12.2, p97: 13.7 },
  { age: 24, p3: 9.7, p15: 10.8, p50: 12.2, p85: 13.6, p97: 15.3 },
];

// Girls Weight (kg) by age (months)
export const girlsWeight: GrowthPercentile[] = [
  { age: 0, p3: 2.4, p15: 2.8, p50: 3.2, p85: 3.7, p97: 4.2 },
  { age: 1, p3: 3.2, p15: 3.6, p50: 4.2, p85: 4.8, p97: 5.5 },
  { age: 2, p3: 3.9, p15: 4.5, p50: 5.1, p85: 5.8, p97: 6.6 },
  { age: 3, p3: 4.5, p15: 5.2, p50: 5.8, p85: 6.6, p97: 7.5 },
  { age: 4, p3: 5.0, p15: 5.7, p50: 6.4, p85: 7.3, p97: 8.2 },
  { age: 5, p3: 5.4, p15: 6.1, p50: 6.9, p85: 7.8, p97: 8.8 },
  { age: 6, p3: 5.7, p15: 6.5, p50: 7.3, p85: 8.2, p97: 9.3 },
  { age: 7, p3: 6.0, p15: 6.8, p50: 7.6, p85: 8.6, p97: 9.8 },
  { age: 8, p3: 6.3, p15: 7.0, p50: 7.9, p85: 9.0, p97: 10.2 },
  { age: 9, p3: 6.5, p15: 7.3, p50: 8.2, p85: 9.3, p97: 10.5 },
  { age: 10, p3: 6.7, p15: 7.5, p50: 8.5, p85: 9.6, p97: 10.9 },
  { age: 11, p3: 6.9, p15: 7.7, p50: 8.7, p85: 9.9, p97: 11.2 },
  { age: 12, p3: 7.0, p15: 7.9, p50: 8.9, p85: 10.1, p97: 11.5 },
  { age: 18, p3: 8.1, p15: 9.1, p50: 10.2, p85: 11.6, p97: 13.2 },
  { age: 24, p3: 9.0, p15: 10.2, p50: 11.5, p85: 13.0, p97: 14.8 },
];

// Boys Height (cm) by age (months)
export const boysHeight: GrowthPercentile[] = [
  { age: 0, p3: 46.1, p15: 47.9, p50: 49.9, p85: 51.8, p97: 53.7 },
  { age: 1, p3: 50.8, p15: 52.7, p50: 54.7, p85: 56.7, p97: 58.6 },
  { age: 2, p3: 54.4, p15: 56.4, p50: 58.4, p85: 60.4, p97: 62.4 },
  { age: 3, p3: 57.3, p15: 59.4, p50: 61.4, p85: 63.5, p97: 65.5 },
  { age: 4, p3: 59.7, p15: 61.8, p50: 63.9, p85: 66.0, p97: 68.0 },
  { age: 5, p3: 61.7, p15: 63.8, p50: 65.9, p85: 68.0, p97: 70.1 },
  { age: 6, p3: 63.3, p15: 65.5, p50: 67.6, p85: 69.8, p97: 71.9 },
  { age: 7, p3: 64.8, p15: 67.0, p50: 69.2, p85: 71.3, p97: 73.5 },
  { age: 8, p3: 66.2, p15: 68.4, p50: 70.6, p85: 72.8, p97: 75.0 },
  { age: 9, p3: 67.5, p15: 69.7, p50: 72.0, p85: 74.2, p97: 76.5 },
  { age: 10, p3: 68.7, p15: 71.0, p50: 73.3, p85: 75.6, p97: 77.9 },
  { age: 11, p3: 69.9, p15: 72.2, p50: 74.5, p85: 76.9, p97: 79.2 },
  { age: 12, p3: 71.0, p15: 73.4, p50: 75.7, p85: 78.1, p97: 80.5 },
  { age: 18, p3: 76.9, p15: 79.6, p50: 82.3, p85: 85.0, p97: 87.7 },
  { age: 24, p3: 81.7, p15: 84.8, p50: 87.8, p85: 90.9, p97: 93.9 },
];

// Girls Height (cm) by age (months)
export const girlsHeight: GrowthPercentile[] = [
  { age: 0, p3: 45.4, p15: 47.2, p50: 49.1, p85: 51.0, p97: 52.9 },
  { age: 1, p3: 49.8, p15: 51.7, p50: 53.7, p85: 55.6, p97: 57.6 },
  { age: 2, p3: 53.0, p15: 55.0, p50: 57.1, p85: 59.1, p97: 61.1 },
  { age: 3, p3: 55.6, p15: 57.7, p50: 59.8, p85: 61.9, p97: 64.0 },
  { age: 4, p3: 57.8, p15: 59.9, p50: 62.1, p85: 64.3, p97: 66.4 },
  { age: 5, p3: 59.6, p15: 61.8, p50: 64.0, p85: 66.2, p97: 68.5 },
  { age: 6, p3: 61.2, p15: 63.5, p50: 65.7, p85: 68.0, p97: 70.3 },
  { age: 7, p3: 62.7, p15: 65.0, p50: 67.3, p85: 69.6, p97: 71.9 },
  { age: 8, p3: 64.0, p15: 66.4, p50: 68.7, p85: 71.1, p97: 73.5 },
  { age: 9, p3: 65.3, p15: 67.7, p50: 70.1, p85: 72.6, p97: 75.0 },
  { age: 10, p3: 66.5, p15: 69.0, p50: 71.5, p85: 73.9, p97: 76.4 },
  { age: 11, p3: 67.7, p15: 70.3, p50: 72.8, p85: 75.3, p97: 77.8 },
  { age: 12, p3: 68.9, p15: 71.4, p50: 74.0, p85: 76.6, p97: 79.2 },
  { age: 18, p3: 74.9, p15: 77.8, p50: 80.7, p85: 83.6, p97: 86.5 },
  { age: 24, p3: 80.0, p15: 83.2, p50: 86.4, p85: 89.6, p97: 92.9 },
];

export function getPercentileForValue(
  value: number,
  ageMonths: number,
  data: GrowthPercentile[]
): number {
  // Find the closest age bracket
  let closestData = data[0];
  let minDiff = Math.abs(data[0].age - ageMonths);
  
  for (const d of data) {
    const diff = Math.abs(d.age - ageMonths);
    if (diff < minDiff) {
      minDiff = diff;
      closestData = d;
    }
  }

  // Determine percentile
  if (value <= closestData.p3) return 3;
  if (value <= closestData.p15) return Math.round(3 + ((value - closestData.p3) / (closestData.p15 - closestData.p3)) * 12);
  if (value <= closestData.p50) return Math.round(15 + ((value - closestData.p15) / (closestData.p50 - closestData.p15)) * 35);
  if (value <= closestData.p85) return Math.round(50 + ((value - closestData.p50) / (closestData.p85 - closestData.p50)) * 35);
  if (value <= closestData.p97) return Math.round(85 + ((value - closestData.p85) / (closestData.p97 - closestData.p85)) * 12);
  return 97;
}

export function getGrowthPercentile(
  value: number,
  ageMonths: number,
  gender: string | undefined,
  type: 'weight' | 'height'
): number {
  const isBoy = gender === 'male';
  
  if (type === 'weight') {
    return getPercentileForValue(value, ageMonths, isBoy ? boysWeight : girlsWeight);
  } else {
    return getPercentileForValue(value, ageMonths, isBoy ? boysHeight : girlsHeight);
  }
}

export function getPercentileColor(percentile: number): string {
  if (percentile < 3 || percentile > 97) return '#EF4444'; // Red - outside normal range
  if (percentile < 15 || percentile > 85) return '#F59E0B'; // Amber - edge of normal
  return '#10B981'; // Green - normal range
}

export function getPercentileLabel(percentile: number): string {
  if (percentile < 3) return 'Below 3rd';
  if (percentile <= 15) return `${percentile}th`;
  if (percentile <= 85) return `${percentile}th`;
  if (percentile <= 97) return `${percentile}th`;
  return 'Above 97th';
}

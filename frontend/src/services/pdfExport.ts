import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { Baby, DailyStats, GrowthRecord, FeedingRecord, SleepRecord, DiaperRecord } from '../types';
import { formatDate, formatDuration, calculateAge } from '../utils/dateUtils';
import { getGrowthPercentile, getPercentileLabel } from '../utils/whoGrowthData';

export async function generateBabyReport(
  baby: Baby,
  stats: DailyStats,
  growthRecords: GrowthRecord[],
  recentFeedings: FeedingRecord[],
  recentSleep: SleepRecord[],
  recentDiapers: DiaperRecord[]
): Promise<void> {
  const age = calculateAge(baby.birth_date);
  const latestGrowth = growthRecords[0];
  
  // Calculate percentiles if we have growth data
  let weightPercentile = '';
  let heightPercentile = '';
  
  if (latestGrowth?.weight_kg) {
    const p = getGrowthPercentile(latestGrowth.weight_kg, age.months, baby.gender, 'weight');
    weightPercentile = getPercentileLabel(p);
  }
  
  if (latestGrowth?.height_cm) {
    const p = getGrowthPercentile(latestGrowth.height_cm, age.months, baby.gender, 'height');
    heightPercentile = getPercentileLabel(p);
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Baby Day Book Report - ${baby.name}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 40px;
            color: #1F2937;
            line-height: 1.6;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #7C3AED;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header h1 {
            color: #7C3AED;
            margin: 0;
            font-size: 28px;
          }
          .header p {
            color: #6B7280;
            margin: 5px 0;
          }
          .section {
            margin-bottom: 30px;
          }
          .section h2 {
            color: #7C3AED;
            border-bottom: 1px solid #E5E7EB;
            padding-bottom: 10px;
            font-size: 20px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
          }
          .info-card {
            background: #F8F4FF;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
          }
          .info-card .label {
            color: #6B7280;
            font-size: 12px;
            text-transform: uppercase;
          }
          .info-card .value {
            color: #1F2937;
            font-size: 24px;
            font-weight: bold;
          }
          .info-card .subvalue {
            color: #7C3AED;
            font-size: 12px;
          }
          .stats-row {
            display: flex;
            justify-content: space-between;
            gap: 15px;
          }
          .stat-box {
            flex: 1;
            background: #F3F4F6;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
          }
          .stat-box.feeding { background: #FEF3C7; }
          .stat-box.sleep { background: #E0E7FF; }
          .stat-box.diaper { background: #D1FAE5; }
          .stat-box .icon { font-size: 24px; }
          .stat-box .number { font-size: 28px; font-weight: bold; }
          .stat-box .label { color: #6B7280; font-size: 12px; }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
          }
          th, td {
            padding: 10px;
            text-align: left;
            border-bottom: 1px solid #E5E7EB;
          }
          th {
            background: #F3F4F6;
            font-weight: 600;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            color: #9CA3AF;
            font-size: 12px;
            border-top: 1px solid #E5E7EB;
            padding-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Baby Day Book Report</h1>
          <p>Generated on ${formatDate(new Date().toISOString())}</p>
        </div>

        <div class="section">
          <h2>Baby Information</h2>
          <div class="info-grid">
            <div class="info-card">
              <div class="label">Name</div>
              <div class="value">${baby.name}</div>
            </div>
            <div class="info-card">
              <div class="label">Age</div>
              <div class="value">${age.text}</div>
              <div class="subvalue">Born ${formatDate(baby.birth_date)}</div>
            </div>
            <div class="info-card">
              <div class="label">Gender</div>
              <div class="value">${baby.gender === 'male' ? 'Boy' : baby.gender === 'female' ? 'Girl' : '-'}</div>
            </div>
          </div>
        </div>

        ${latestGrowth ? `
        <div class="section">
          <h2>Latest Growth Measurements</h2>
          <p style="color: #6B7280;">Recorded on ${formatDate(latestGrowth.date)}</p>
          <div class="info-grid">
            ${latestGrowth.weight_kg ? `
            <div class="info-card">
              <div class="label">Weight</div>
              <div class="value">${latestGrowth.weight_kg} kg</div>
              <div class="subvalue">${weightPercentile} percentile</div>
            </div>
            ` : ''}
            ${latestGrowth.height_cm ? `
            <div class="info-card">
              <div class="label">Height</div>
              <div class="value">${latestGrowth.height_cm} cm</div>
              <div class="subvalue">${heightPercentile} percentile</div>
            </div>
            ` : ''}
            ${latestGrowth.head_circumference_cm ? `
            <div class="info-card">
              <div class="label">Head Circumference</div>
              <div class="value">${latestGrowth.head_circumference_cm} cm</div>
            </div>
            ` : ''}
          </div>
        </div>
        ` : ''}

        <div class="section">
          <h2>Today's Summary</h2>
          <div class="stats-row">
            <div class="stat-box feeding">
              <div class="number">${stats.feeding.count}</div>
              <div class="label">Feedings</div>
              ${stats.feeding.total_bottle_ml > 0 ? `<div class="subvalue">${stats.feeding.total_bottle_ml} ml total</div>` : ''}
            </div>
            <div class="stat-box sleep">
              <div class="number">${stats.sleep.total_hours}h</div>
              <div class="label">Sleep</div>
              <div class="subvalue">${stats.sleep.count} sessions</div>
            </div>
            <div class="stat-box diaper">
              <div class="number">${stats.diaper.total}</div>
              <div class="label">Diapers</div>
              <div class="subvalue">${stats.diaper.wet} wet, ${stats.diaper.dirty} dirty</div>
            </div>
          </div>
        </div>

        ${growthRecords.length > 1 ? `
        <div class="section">
          <h2>Growth History</h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Weight (kg)</th>
                <th>Height (cm)</th>
                <th>Head (cm)</th>
              </tr>
            </thead>
            <tbody>
              ${growthRecords.slice(0, 10).map(g => `
                <tr>
                  <td>${formatDate(g.date)}</td>
                  <td>${g.weight_kg || '-'}</td>
                  <td>${g.height_cm || '-'}</td>
                  <td>${g.head_circumference_cm || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        <div class="footer">
          <p>Generated by Baby Day Book App</p>
          <p>This report is for informational purposes only. Please consult your pediatrician for medical advice.</p>
        </div>
      </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({ html });
    
    if (Platform.OS === 'web') {
      // For web, open print dialog
      await Print.printAsync({ html });
    } else {
      // For mobile, share the PDF
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `${baby.name}'s Baby Day Book Report`,
          UTI: 'com.adobe.pdf'
        });
      }
    }
  } catch (error) {
    console.error('Failed to generate PDF:', error);
    throw error;
  }
}

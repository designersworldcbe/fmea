import ExcelJS from 'exceljs';
import { FMEA, FMEAItem, ControlPlan, ControlPlanItem } from '../types';

export async function exportFMEAToExcel(fmea: FMEA) {
  // ... existing code ...
}

export async function exportControlPlanToExcel(cp: ControlPlan) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Control Plan');

  // Set column widths
  worksheet.columns = [
    { width: 20 }, // Process Name
    { width: 20 }, // Machine Name
    { width: 10 }, // Balloon No
    { width: 20 }, // Product Char
    { width: 20 }, // Process Char
    { width: 20 }, // Spec
    { width: 20 }, // Eval Method
    { width: 15 }, // Sample Size
    { width: 15 }, // Sample Freq
    { width: 20 }, // Control Method
    { width: 20 }, // Reaction Plan
  ];

  // Header
  worksheet.mergeCells('A1:K1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = 'CONTROL PLAN - ' + cp.part_name;
  titleCell.font = { bold: true, size: 14 };
  titleCell.alignment = { horizontal: 'center' };

  // Table Headers
  const headerRow = worksheet.addRow([
    'Process Name', 'Machine Name', 'Balloon No', 'Product Char', 'Process Char', 
    'Spec', 'Eval Method', 'Sample Size', 'Sample Freq', 'Control Method', 'Reaction Plan'
  ]);
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF004F8C' } };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { horizontal: 'center' };
  });

  // Add Items
  cp.items?.forEach(item => {
    worksheet.addRow([
      item.process_name,
      item.machine_name,
      item.balloon_no,
      item.product_char,
      item.process_char,
      item.spec,
      item.eval_method,
      item.sample_size,
      item.sample_freq,
      item.control_method,
      item.reaction_plan
    ]);
  });

  // Generate and download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `ControlPlan_${cp.cp_no || 'Export'}.xlsx`;
  anchor.click();
  window.URL.revokeObjectURL(url);
}


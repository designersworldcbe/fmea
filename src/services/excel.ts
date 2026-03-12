import ExcelJS from 'exceljs';
import { FMEA, FMEAItem } from '../types';

export async function exportFMEAToExcel(fmea: FMEA) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('PFMEA');

  // Set column widths
  worksheet.columns = [
    { width: 12 }, // Process Step
    { width: 15 }, // Function
    { width: 5 },  // ID
    { width: 15 }, // Product
    { width: 15 }, // Process
    { width: 20 }, // Failure Mode
    { width: 20 }, // Effects
    { width: 5 },  // Sev
    { width: 5 },  // Class
    { width: 20 }, // Causes
    { width: 5 },  // Occ
    { width: 20 }, // Prev
    { width: 20 }, // Det Control
    { width: 5 },  // Det
    { width: 8 },  // RPN
    { width: 20 }, // Rec Action
    { width: 15 }, // Resp
    { width: 12 }, // Target Date
    { width: 20 }, // Action Taken
    { width: 12 }, // Eff Date
    { width: 5 },  // Res Sev
    { width: 5 },  // Res Occ
    { width: 5 },  // Res Det
    { width: 8 },  // Res RPN
  ];

  // Header Section
  // Row 1: Logo | Company Name | Title
  worksheet.mergeCells('A1:B1');
  const logoCell = worksheet.getCell('A1');
  logoCell.value = 'GEEKEYY';
  logoCell.font = { bold: true, size: 10 };
  logoCell.alignment = { vertical: 'middle', horizontal: 'center' };

  worksheet.mergeCells('C1:O1');
  const companyCell = worksheet.getCell('C1');
  companyCell.value = 'GEE KEYY ENGINEERING CO., COIMBATORE - 049';
  companyCell.font = { bold: true, size: 12 };
  companyCell.alignment = { vertical: 'middle', horizontal: 'center' };
  
  worksheet.mergeCells('P1:X1');
  const titleCell = worksheet.getCell('P1');
  titleCell.value = 'PROCESS FAILURE MODE EFFECTS ANALYSIS - MACHINING';
  titleCell.font = { bold: true, size: 12, color: { argb: 'FFFF0000' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

  // Row 2
  worksheet.mergeCells('A2:B2');
  worksheet.getCell('A2').value = 'DRAWING NO : ' + fmea.draw_no;
  worksheet.mergeCells('C2:O2');
  worksheet.getCell('C2').value = 'PROCESS RESPONSIBILITY : ' + fmea.process_responsibility;
  worksheet.mergeCells('P2:S2');
  worksheet.getCell('P2').value = 'FMEA NO';
  worksheet.mergeCells('T2:X2');
  worksheet.getCell('T2').value = fmea.fmea_no;

  // Row 3
  worksheet.mergeCells('A3:B3');
  worksheet.getCell('A3').value = 'PART NAME : ' + fmea.part_name;
  worksheet.mergeCells('C3:O3');
  worksheet.getCell('C3').value = 'KEY REVIEW DATE : ' + fmea.key_review_date;
  worksheet.mergeCells('P3:S3');
  worksheet.getCell('P3').value = 'DATE (ORI)';
  worksheet.mergeCells('T3:X3');
  worksheet.getCell('T3').value = fmea.date;

  // Row 4
  worksheet.mergeCells('A4:B4');
  worksheet.getCell('A4').value = 'CUSTOMER : ' + fmea.customer_name;
  worksheet.mergeCells('P4:S4');
  worksheet.getCell('P4').value = 'REV NO & DATE';
  worksheet.mergeCells('T4:X4');
  worksheet.getCell('T4').value = `${fmea.rev_no} - ${fmea.rev_date}`;

  // Row 5
  worksheet.mergeCells('P5:S5');
  worksheet.getCell('P5').value = 'PREPARED BY';
  worksheet.mergeCells('T5:X5');
  worksheet.getCell('T5').value = fmea.prepared_by;

  // Apply borders to header area
  for (let r = 1; r <= 5; r++) {
    const row = worksheet.getRow(r);
    for (let c = 1; c <= 24; c++) {
      const cell = row.getCell(c);
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      if (r > 1) {
        cell.font = { size: 9, bold: true };
      }
    }
  }

  // Table Headers
  // Row 6 & 7
  worksheet.mergeCells('A6:A7'); worksheet.getCell('A6').value = 'Process Step';
  worksheet.mergeCells('B6:B7'); worksheet.getCell('B6').value = 'Function';
  worksheet.mergeCells('C6:E6'); worksheet.getCell('C6').value = 'Characteristics Requirements';
  worksheet.getCell('C7').value = 'ID';
  worksheet.getCell('D7').value = 'Product';
  worksheet.getCell('E7').value = 'Process';
  worksheet.mergeCells('F6:F7'); worksheet.getCell('F6').value = 'Potential Failure Mode';
  worksheet.mergeCells('G6:G7'); worksheet.getCell('G6').value = 'Potential Effects of Failure';
  worksheet.mergeCells('H6:H7'); worksheet.getCell('H6').value = 'Severity';
  worksheet.mergeCells('I6:I7'); worksheet.getCell('I6').value = 'Class';
  worksheet.mergeCells('J6:J7'); worksheet.getCell('J6').value = 'Potential Causes / Mechanism of Failure';
  worksheet.mergeCells('K6:K7'); worksheet.getCell('K6').value = 'Occurrence';
  worksheet.mergeCells('L6:M6'); worksheet.getCell('L6').value = 'Current Process Controls';
  worksheet.getCell('L7').value = 'Prevention';
  worksheet.getCell('M7').value = 'Detection';
  worksheet.mergeCells('N6:N7'); worksheet.getCell('N6').value = 'Detection';
  worksheet.mergeCells('O6:O7'); worksheet.getCell('O6').value = 'RPN';
  worksheet.mergeCells('P6:P7'); worksheet.getCell('P6').value = 'Recommended Action';
  worksheet.mergeCells('Q6:Q7'); worksheet.getCell('Q6').value = 'Responsibility';
  worksheet.mergeCells('R6:R7'); worksheet.getCell('R6').value = 'Target Completion Date';
  worksheet.mergeCells('S6:X6'); worksheet.getCell('S6').value = 'Action Results';
  worksheet.getCell('S7').value = 'Action Taken';
  worksheet.getCell('T7').value = 'Effective Date';
  worksheet.getCell('U7').value = 'Severity';
  worksheet.getCell('V7').value = 'Occurrence';
  worksheet.getCell('W7').value = 'Detection';
  worksheet.getCell('X7').value = 'RPN';

  // Styling headers
  for (let r = 6; r <= 7; r++) {
    const row = worksheet.getRow(r);
    for (let c = 1; c <= 24; c++) {
      const cell = row.getCell(c);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } }; // Yellow background
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      cell.font = { bold: true, size: 8 };
      cell.alignment = { wrapText: true, vertical: 'middle', horizontal: 'center' };
    }
  }

  // Add Items
  fmea.items?.forEach(item => {
    const row = worksheet.addRow([
      item.process_step,
      item.function,
      item.char_id,
      item.product,
      item.process,
      item.potential_failure_mode,
      item.potential_effects,
      item.severity,
      item.class,
      item.potential_causes,
      item.occurrence,
      item.current_prevention,
      item.current_detection,
      item.detection,
      item.rpn,
      item.recommended_action,
      item.responsibility,
      item.target_date,
      item.action_taken,
      item.effective_date,
      item.res_severity,
      item.res_occurrence,
      item.res_detection,
      item.res_rpn
    ]);
    
    for (let c = 1; c <= 24; c++) {
      const cell = row.getCell(c);
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      cell.alignment = { wrapText: true, vertical: 'top' };
      cell.font = { size: 8 };
    }
  });

  // Generate and download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `FMEA_${fmea.fmea_no || 'Export'}.xlsx`;
  anchor.click();
  window.URL.revokeObjectURL(url);
}


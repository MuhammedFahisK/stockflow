import * as XLSX from 'xlsx';

export const exportToExcel = (data, fileName = 'export.xlsx', sheetName = 'Sheet1') => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  
  // Add some styling
  const colWidths = Object.keys(data[0] || {}).map(() => ({ wch: 15 }));
  worksheet['!cols'] = colWidths;
  
  XLSX.writeFile(workbook, fileName);
};

export const exportMultipleSheets = (sheetsData, fileName = 'export.xlsx') => {
  const workbook = XLSX.utils.book_new();
  
  sheetsData.forEach(({ name, data }) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, name);
  });
  
  XLSX.writeFile(workbook, fileName);
};

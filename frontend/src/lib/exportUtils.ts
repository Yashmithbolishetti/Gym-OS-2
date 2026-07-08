/**
 * GymOS Elite Data Export Engine
 * Natively generates and downloads CSV, Excel, and high-fidelity Vector PDF files client-side.
 */

// Helper to sanitize fields for CSV/Spreadsheets
function clean(value: any): string {
  if (value === null || value === undefined) return "";
  const str = String(value).replace(/"/g, '""');
  if (str.includes(",") || str.includes("\n") || str.includes('"')) {
    return `"${str}"`;
  }
  return str;
}

// 1. CSV Actual Exporter
export function exportToCSV(data: any[], columns: { header: string; key: string }[], fileName: string) {
  const headers = columns.map(col => clean(col.header)).join(",");
  const rows = data.map(row => {
    return columns.map(col => clean(row[col.key])).join(",");
  });
  
  const csvContent = [headers, ...rows].join("\n");
  const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${fileName}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// 2. Excel Fully Formatted Spreadsheet Exporter (.xls MIME HTML format)
export function exportToExcel(data: any[], columns: { header: string; key: string }[], fileName: string) {
  let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">`;
  html += `<head><meta charset="UTF-8">\n<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>GymOS Sheet</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->`;
  html += `<style>
    body { font-family: sans-serif; }
    th { background-color: #1e3a8a; color: #ffffff; font-weight: bold; padding: 8px; border: 1px solid #ddd; }
    td { padding: 6px; border: 1px solid #ddd; }
  </style></head><body>`;
  
  html += `<table><thead><tr>`;
  columns.forEach(col => {
    html += `<th>${col.header}</th>`;
  });
  html += `</tr></thead><tbody>`;
  
  data.forEach(row => {
    html += `<tr>`;
    columns.forEach(col => {
      html += `<td>${row[col.key] ?? ""}</td>`;
    });
    html += `</tr>`;
  });
  
  html += `</tbody></table></body></html>`;

  const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${fileName}.xls`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// 3. PDF Exporter using dynamic vector high-fidelity print layouts
export function exportToPDF(title: string, columns: { header: string; key: string }[], data: any[], fileName: string) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups to export the PDF file.");
    return;
  }

  let tableHeaderHtml = "<tr>";
  columns.forEach(col => {
    tableHeaderHtml += `<th style="text-align: left; padding: 12px 8px; border-bottom: 2px solid #222; font-size: 13px; font-weight: 700; text-transform: uppercase;">${col.header}</th>`;
  });
  tableHeaderHtml += "</tr>";

  let tableRowsHtml = "";
  data.forEach((row, idx) => {
    const bg = idx % 2 === 0 ? "#f9f9f9" : "#ffffff";
    tableRowsHtml += `<tr style="background: ${bg};">`;
    columns.forEach(col => {
      tableRowsHtml += `<td style="padding: 10px 8px; border-bottom: 1px solid #eee; font-size: 12px; color: #333;">${row[col.key] ?? ""}</td>`;
    });
    tableRowsHtml += "</tr>";
  });

  printWindow.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #111; margin: 0; padding: 0; }
          .header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 30px; border-bottom: 3px solid #2563eb; padding-bottom: 15px; }
          .logo { font-size: 24px; font-weight: bold; letter-spacing: -1px; }
          .logo span { color: #2563eb; }
          .title { font-size: 16px; color: #555; text-transform: uppercase; margin: 0; font-weight: 600; }
          .meta { font-size: 11px; text-align: right; color: #666; font-family: monospace; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          .footer { margin-top: 40px; border-top: 1px solid #ddd; padding-top: 10px; font-size: 10px; color: #777; display: flex; justify-content: space-between; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">Gym<span>OS</span> Enterprise</div>
            <div class="title">${title}</div>
          </div>
          <div class="meta">
            Generated: ${new Date().toLocaleString()}<br/>
            Scope: Live Records Sync
          </div>
        </div>
        
        <table>
          <thead>${tableHeaderHtml}</thead>
          <tbody>${tableRowsHtml}</tbody>
        </table>

        <div class="footer">
          <div>GymOS SaaS — Premium Central Platform</div>
          <div>Page 1 of 1</div>
        </div>

        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          }
        </script>
      </body>
    </html>
  `);

  printWindow.document.close();
}

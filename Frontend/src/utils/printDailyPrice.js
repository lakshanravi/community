const waitForImagesToLoad = (container) => {
  const images = container.querySelectorAll("img");
  const promises = Array.from(images).map(
    img =>
      new Promise(resolve => {
        if (img.complete) resolve();
        else {
          img.onload = resolve;
          img.onerror = resolve;
        }
      })
  );
  return Promise.all(promises);
};

export const printDailyPrices = async ({ prices, date, ui, productNames, types }) => {
  if (!prices || prices.length === 0) {
    alert(ui.noPrices);
    return;
  }

  // Group by original product.type string
  const grouped = prices.reduce((acc, item) => {
    const type = item.product?.type || ui.uncategorized;
    if (!acc[type]) acc[type] = [];
    acc[type].push(item);
    return acc;
  }, {});

  // Flatten grouped with translated category headers
  const categorizedList = [];
  function capitalizeFirst(str) {
    if (!str) return "";
    return str[0].toLocaleUpperCase() + str.slice(1);
  }
  for (const [type, items] of Object.entries(grouped)) {
    let translatedType = (types && types[type]) || type;
    translatedType = capitalizeFirst(translatedType);
    categorizedList.push({ isHeader: true, label: translatedType });
    items.forEach(item => categorizedList.push({ isHeader: false, item }));
  }

  const numColumnSets = 2;
  const rowsPerColumn = Math.ceil(categorizedList.length / numColumnSets);

  const columns = [];
  for (let i = 0; i < numColumnSets; i++) {
    columns.push(categorizedList.slice(i * rowsPerColumn, (i + 1) * rowsPerColumn));
  }

  const headerRow = Array(numColumnSets)
    .fill(`
      <th style="border:1px solid #000; padding:0 4px; font-size:8px; width:4%;">${ui.tableHeaders.number}</th>
      <th style="border:1px solid #000; padding:0 4px; font-size:8px;">${ui.tableHeaders.item}</th>
      <th style="border:1px solid #000; padding:0 4px; font-size:8px; width:13%;">${ui.tableHeaders.minPrice}</th>
      <th style="border:1px solid #000; padding:0 4px; font-size:8px; width:13%;">${ui.tableHeaders.maxPrice}</th>
    `)
    .join(`<th style="width:12px; border:none;"></th>`);

  const itemsCountPerColumn = columns.map(col =>
    col.reduce((count, entry) => count + (entry.isHeader ? 0 : 1), 0)
  );

  const cumulativeCounts = [];
  itemsCountPerColumn.reduce((acc, count, i) => {
    cumulativeCounts[i] = acc;
    return acc + count;
  }, 0);

  let tableRows = "";
  const maxRows = rowsPerColumn;

  for (let row = 0; row < maxRows; row++) {
    tableRows += "<tr>";
    for (let col = 0; col < numColumnSets; col++) {
      const entry = columns[col][row];
      if (!entry) {
        tableRows += `
          <td style="border:none; padding:0;"></td>
          <td style="border:none; padding:0;"></td>
          <td style="border:none; padding:0;"></td>
          <td style="border:none; padding:0;"></td>
        `;
      } else if (entry.isHeader) {
        tableRows += `
          <td colspan="4" style="border:1px solid #000; background:#ddd; font-weight:bold; font-size:8px; padding:0 8px; text-align:left;">
            ${entry.label}
          </td>
        `;
      } else {
        const colItems = columns[col];
        let itemIndexInCol = 0;
        for (let i = 0; i <= row; i++) {
          if (colItems[i] && !colItems[i].isHeader) itemIndexInCol++;
        }
        const number = cumulativeCounts[col] + itemIndexInCol;

        const item = entry.item;
        const productName = productNames[item.product?.name] || item.product?.name || "";

        tableRows += `
          <td style="border:1px solid #000; padding:0 8px; font-size:7px;">${number}</td>
          <td style="border:1px solid #000; padding:0 8px; font-size:7px; text-align:left;">${productName}</td>
          <td style="border:1px solid #000; padding:0 8px; font-size:7px; text-align:right;">${
            item.min_price ? "Rs. " + Number(item.min_price).toFixed(2) : ""
          }</td>
          <td style="border:1px solid #000; padding:0 8px; font-size:7px; text-align:right;">${
            item.max_price ? "Rs. " + Number(item.max_price).toFixed(2) : ""
          }</td>
        `;
      }
      if (col < numColumnSets - 1) {
        tableRows += `<td style="width:12px; border:none;"></td>`;
      }
    }
    tableRows += "</tr>";
  }

  const tableHtml = `
    <table style="width:100%; border-collapse:collapse; margin-top:6px; margin-bottom:6px; page-break-inside: avoid; font-size:7px;">
      <thead>
        <tr style="background:#f5f5f5;">
          ${headerRow}
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>
  `;

  const printableContent = `
    <div style="font-family: 'Iskoola Pota', 'Noto Sans Sinhala', Arial, sans-serif; color:#222; font-size:7px;">
      <div style="display:flex; align-items:center; justify-content:space-between; border-bottom:2px solid #333; margin-bottom:12px; padding-bottom:8px;">
<img src="/images/Gov.jpg" alt="Logo" style="height:48px;">
        <div style="text-align:center; flex:1;">
          <div style="font-size:14px; font-weight:bold;">${ui.title}</div>
          <div style="font-size:9px; margin-top:2px;">${ui.center}</div>
        </div>
        <img src="/images/logo.jpg" alt="Logo" style="height:48px;">
      </div>
      <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:8px;">
        <div>${ui.tel}</div>
        <div>${ui.dateLabel}: <strong>${date}</strong></div>
        <div>${ui.emailLabel}: dambulladec@gmail.com</div>
      </div>
      <div style="page-break-inside: avoid;">
        ${tableHtml}
      </div>
      <div style="margin-top:6px; font-size:8px; background:#fff3cd; border:1px solid #000; padding:4px;">
        <strong>${ui.inquiry}</strong> ${ui.manager}<br/>
        ${ui.contact}
      </div>
    </div>
  `;

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert(ui.popupBlocked);
    return;
  }

  printWindow.document.write(`
    <html>
      <head>
        <title>${ui.title}</title>
        <style>
          @page { size: A4 portrait; margin: 8mm; }
          body { margin:0; padding:0; font-size:7px; }
          table, th, td { border-collapse: collapse; }
          body, td, th {
            font-family: 'Iskoola Pota', 'Noto Sans Sinhala', Arial, sans-serif !important;
          }
        </style>
        <link href="https://fonts.googleapis.com/css?family=Noto+Sans+Sinhala:400,700&display=swap" rel="stylesheet">
      </head>
      <body class="printable-content">
        ${printableContent}
      </body>
    </html>
  `);

  printWindow.document.close();

  await waitForImagesToLoad(printWindow.document.body);

  printWindow.focus();
  printWindow.print();
};

const express = require('express');
const router = express.Router();
const ExcelJS = require('exceljs');
const { Op } = require('sequelize');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const Rent = require('../models/Rent');
const Fine = require('../models/Fine');
const OperationFee = require('../models/OperationFee');
const VAT = require('../models/VAT');
const ShopBalance = require('../models/ShopBalance');
const { getPaymentsByShopAndInvoice } = require('../utils/reportUtils');

router.get('/monthly-income', async (req, res) => {
  try {
    let { month, year } = req.query;
    let selectedMonth, selectedYear, selectedMonthYear;

    if (!month || !year) {
      const latestInvoice = await Invoice.findOne({ order: [['month_year', 'DESC']] });
      if (!latestInvoice) return res.status(404).send('No invoices found.');
      selectedMonthYear = new Date(latestInvoice.month_year);
      selectedMonth = selectedMonthYear.getMonth() + 1;
      selectedYear = selectedMonthYear.getFullYear();
    } else {
      selectedMonth = parseInt(month);
      selectedYear = parseInt(year);

      if (isNaN(selectedMonth) || isNaN(selectedYear) || selectedMonth < 1 || selectedMonth > 12) {
        return res.status(400).json({ success: false, message: 'Invalid month or year provided.' });
      }

      selectedMonthYear = new Date(selectedYear, selectedMonth - 1);
    }

    const startOfPeriod = new Date(selectedYear, selectedMonth - 1, 1);
    const endOfPeriod = new Date(selectedYear, selectedMonth, 0);
    const latestMonthStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;

    const invoices = await Invoice.findAll({
      where: { month_year: { [Op.between]: [startOfPeriod, endOfPeriod] } },
      order: [['shop_id', 'ASC'], ['createdAt', 'ASC']],
    });

    const allPayments = await Payment.findAll({ attributes: ['shop_id', 'payment_date', 'amount_paid'], raw: true });
    const shopBalances = await ShopBalance.findAll({ attributes: ['shop_id', 'balance_amount'], raw: true });

    const balanceByShop = shopBalances.reduce((map, sb) => {
      map[sb.shop_id] = parseFloat(sb.balance_amount);
      return map;
    }, {});

    const [rentMap, rentCross] = await getPaymentsByShopAndInvoice(Rent, startOfPeriod, endOfPeriod, selectedMonthYear);
    const [fineMap, fineCross] = await getPaymentsByShopAndInvoice(Fine, startOfPeriod, endOfPeriod, selectedMonthYear);
    const [opMap, opCross] = await getPaymentsByShopAndInvoice(OperationFee, startOfPeriod, endOfPeriod, selectedMonthYear);
    const [vatMap, vatCross] = await getPaymentsByShopAndInvoice(VAT, startOfPeriod, endOfPeriod, selectedMonthYear);
    const finesThisMonth = await Fine.findAll({
      where: {
        invoice_id: { [Op.in]: invoices.map(inv => inv.invoice_id) }
      },
      attributes: ['invoice_id', 'fine_amount'],
      raw: true,
    });
    
    const fineByInvoiceId = finesThisMonth.reduce((map, fine) => {
      map[fine.invoice_id] = parseFloat(fine.fine_amount || 0);
      return map;
    }, {});
    
    
    const invoiceMapByShop = {};
    invoices.forEach(inv => {
      if (!invoiceMapByShop[inv.shop_id]) invoiceMapByShop[inv.shop_id] = [];
      invoiceMapByShop[inv.shop_id].push(inv);
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Monthly Income');

    sheet.columns = [
      { header: 'Shop ID', key: 'shop_id' },
      { header: 'Month', key: 'month' },
      { header: 'This month remaining Rent Amount', key: 't_r_rent_amount' },
      { header: 'This month remaining Operation Fee', key: 't_r_operation_fee' },
      { header: 'This month remaining Operation VAT', key: 't_r_vat_amount' },
      { header: 'This month remaining Fine', key: 't_r_fine_for_this_invoice' },
      { header: 'Previous total remaining', key: 'p_t_arrest' }, // ✅ Add this
      { header: 'total Remaining', key: 't_remaining' },
      
    ];

    const totals = {
      t_r_rent_amount:0,
      t_r_operation_fee:0,
      t_r_vat_amount:0,
      t_r_fine_for_this_invoice:0,
      p_t_arrest:0,
      t_remaining:0,

       // ✅ Fix: add this line
    };

    for (const inv of invoices) {
      const shop_id = inv.shop_id;
      const shopInvoices = invoiceMapByShop[shop_id] || [];
      const currentIndex = shopInvoices.findIndex(i => i.invoice_id === inv.invoice_id);
      const nextInvoice = shopInvoices[currentIndex + 1];
      const invStart = new Date(inv.createdAt).getTime();
      const invEnd = nextInvoice ? new Date(nextInvoice.createdAt).getTime() : Date.now();
      const fineThisInvoice =  parseFloat(fineByInvoiceId[inv.invoice_id] || 0);
       console.log("Fine for this invoice:",fineThisInvoice);
      // Normalize both shop_ids to lower case for comparison
      const paidForThisInvoice = allPayments
        .filter(payment => {
          const paymentDate = new Date(payment.payment_date);
          const paymentTime = paymentDate.getTime();
      
          // Check if payment is in the selected month and year
          const isSameMonth =
            paymentDate.getFullYear() === selectedYear &&
            paymentDate.getMonth() + 1 === selectedMonth;
      
          // Normalize both shop_ids to lower case for comparison
          const isSameShop = payment.shop_id.toLowerCase() === shop_id.toLowerCase();
      
          // Check if payment is within the invoice date range
          const isInInvoiceRange = paymentTime >= invStart && paymentTime < invEnd;
      
          // Return the filter criteria
          return isSameMonth && isSameShop && isInInvoiceRange;
        })
        .reduce((sum, payment) => sum + parseFloat(payment.amount_paid || 0), 0);
      
      console.log("Paid for this invoice:", paidForThisInvoice);
      
      
      let prevBalance = parseFloat(inv.previous_balance);


      let remaining = parseFloat(inv.total_amount) - paidForThisInvoice;
      remaining = Math.max(remaining, 0);
      const shop_balance = balanceByShop[shop_id] || 0;
      let adjusted_arrears = parseFloat(inv.total_arrears);



      let other_arrears_paid = 0; // ✅ Declare and initialize
      let effective_shop_balance = shop_balance; // Clone before potential modification

      if (prevBalance < 0) {
        prevBalance = Math.abs(prevBalance);
        adjusted_arrears += prevBalance;

        if (effective_shop_balance > 0) {
          effective_shop_balance = 0;
        }
      
        let s_balance = Math.abs(effective_shop_balance);
        other_arrears_paid = Math.max(prevBalance - s_balance, 0);

      }
      const absPreviousBalance = Math.max(0, parseFloat(inv.previous_balance));  // Take absolute value to ensure it's positive
      // Add negative shop_balance to total arrears
      // Calculate individual components first
      const t_r_rent_amount = parseFloat(inv.rent_amount || 0) - parseFloat(rentMap[shop_id]?.current || 0);
      const t_r_operation_fee = parseFloat(inv.operation_fee || 0) - parseFloat(opMap[shop_id]?.current || 0);
      const t_r_vat_amount = parseFloat(inv.vat_amount || 0) - parseFloat(vatMap[shop_id]?.current || 0);
      const t_r_fine_for_this_invoice = parseFloat(fineThisInvoice || 0) - parseFloat(fineMap[shop_id]?.current || 0);
      
console.log(`\n--- Arrears Calculation for Shop ID: ${shop_id} ---`);
console.log(`adjusted_arrears: ${adjusted_arrears}`);
console.log(`inv.fines: ${inv.fines}`);
console.log(`rentMap.other: ${rentMap[shop_id]?.other || 0}`);
console.log(`vatMap.other: ${vatMap[shop_id]?.other || 0}`);
console.log(`opMap.other: ${opMap[shop_id]?.other || 0}`);
console.log(`fineMap.other: ${fineMap[shop_id]?.other || 0}`);
console.log(`other_arrears_paid: ${other_arrears_paid}`);

console.log(`Adjusted arrears: ${adjusted_arrears}`);

// Adjusted arrears with negative shop balance added (if applicable)
const p_t_arrest = 
  parseFloat(adjusted_arrears || 0) +
  parseFloat(inv.fines || 0) -
  parseFloat(rentMap[shop_id]?.other || 0) -
  parseFloat(vatMap[shop_id]?.other || 0) -
  parseFloat(opMap[shop_id]?.other || 0) -
  parseFloat(other_arrears_paid || 0) -
  parseFloat(fineMap[shop_id]?.other || 0);

// Total remaining amount to be paid
const t_remaining = t_r_rent_amount + t_r_operation_fee + t_r_vat_amount + t_r_fine_for_this_invoice + p_t_arrest;

// Add row to sheet
sheet.addRow({
  shop_id,
  month: latestMonthStr,
  t_r_rent_amount,
  t_r_operation_fee,
  t_r_vat_amount,
  t_r_fine_for_this_invoice,
  p_t_arrest,
  t_remaining,
});


      totals.t_r_rent_amount += t_r_rent_amount; // Add to the totals
      totals.t_r_operation_fee += t_r_operation_fee;
      totals.t_r_vat_amount += t_r_vat_amount;
      totals.t_r_fine_for_this_invoice += t_r_fine_for_this_invoice;
      totals.p_t_arrest += p_t_arrest;
      totals.t_remaining += t_remaining;
    }

    sheet.getRow(1).eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0070C0' } };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    });

    const totalRow = sheet.addRow({
      shop_id: 'Total',
      t_r_rent_amount:totals.t_r_rent_amount,// Add to the totals
      t_r_operation_fee:totals.t_r_operation_fee,
      t_r_vat_amount:totals.t_r_vat_amount,
      t_r_fine_for_this_invoice:totals.t_r_fine_for_this_invoice,
      p_t_arrest:totals.p_t_arrest,
      t_remaining:totals.t_remaining,


    });

    totalRow.eachCell(cell => {
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    sheet.columns.forEach(column => {
      column.width = Math.max(15, column.header.length + 5);
    });

   


    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Monthly_Income_Report_${latestMonthStr}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).send('Error generating report');
  }
});

module.exports = router;

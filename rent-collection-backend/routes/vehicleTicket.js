// routes/vehicleTickets.js

const express = require('express');
const { Op, fn, col, literal } = require('sequelize');
const VehicleTicket = require('../models/VehicleTicket');
const { authenticateUser, authorizeRole } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * ✅ Issue a new vehicle ticket
 */
router.post('/', authenticateUser, authorizeRole(['admin', 'superadmin', 'tiketing']), async (req, res) => {
  const { vehicleNumber, vehicleType, ticketPrice } = req.body;

  if (!vehicleNumber || !vehicleType || !ticketPrice) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().split(' ')[0];
    const byWhom = req.user.email;

    const ticket = await VehicleTicket.create({
      vehicleNumber,
      vehicleType,
      ticketPrice,
      date,
      time,
      byWhom
    });

    res.status(201).json({
      message: 'Ticket issued successfully',
      ticketId: ticket.id,
      ticket
    });
  } catch (error) {
    res.status(500).json({ message: 'Error issuing ticket', error: error.message });
  }
});

/**
 * 📋 Get tickets filtered by date and optionally by byWhom
 */
router.get('/by-date', authenticateUser, authorizeRole(['admin', 'superadmin']), async (req, res) => {
  const { date, byWhom, page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  try {
    const whereClause = {};
    if (date) whereClause.date = date;
    if (byWhom) whereClause.byWhom = { [Op.like]: `%${byWhom}%` };

    const { rows: tickets, count } = await VehicleTicket.findAndCountAll({
      where: whereClause,
      attributes: ['id', 'vehicleNumber', 'vehicleType', 'ticketPrice', 'date', 'time', 'byWhom'],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['id', 'DESC']]
    });

    res.status(200).json({ total: count, page: +page, tickets });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tickets', error: error.message });
  }
});

/**
 * 💰 Daily income summary (supports ?date=YYYY-MM-DD and ?byWhom)
 */
router.get('/daily-income', authenticateUser, authorizeRole(['admin', 'superadmin']), async (req, res) => {
  const { date, byWhom } = req.query;

  try {
    const whereClause = {};
    if (date) whereClause.date = date;
    if (byWhom) whereClause.byWhom = { [Op.like]: `%${byWhom}%` };

    const dailyIncome = await VehicleTicket.findAll({
      attributes: [
        [fn('DATE', col('date')), 'date'],
        [fn('SUM', col('ticketPrice')), 'totalIncome'],
        [fn('COUNT', col('id')), 'ticketCount']
      ],
      where: whereClause,
      group: [literal('DATE(date)')],
      order: [[literal('DATE(date)'), 'DESC']]
    });

    res.status(200).json(dailyIncome);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching daily income data', error: error.message });
  }
});

/**
 * 📆 Monthly income summary
 */
router.get('/monthly-income', authenticateUser, authorizeRole(['admin', 'superadmin']), async (req, res) => {
  try {
    const monthlyIncome = await VehicleTicket.findAll({
      attributes: [
        [fn('YEAR', col('date')), 'year'],
        [fn('MONTH', col('date')), 'month'],
        [fn('SUM', col('ticketPrice')), 'totalIncome'],
        [fn('COUNT', col('id')), 'ticketCount']
      ],
      group: [fn('YEAR', col('date')), fn('MONTH', col('date'))],
      order: [
        [fn('YEAR', col('date')), 'DESC'],
        [fn('MONTH', col('date')), 'DESC']
      ]
    });

    res.status(200).json(monthlyIncome);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching monthly income data', error: error.message });
  }
});

/**
 * ❌ Delete a vehicle ticket by ID
 */
router.delete('/:id', authenticateUser, authorizeRole(['admin', 'superadmin']), async (req, res) => {
  try {
    const ticket = await VehicleTicket.findByPk(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    await ticket.destroy();

    res.status(200).json({ message: 'Ticket deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting ticket', error: error.message });
  }
});


module.exports = router;

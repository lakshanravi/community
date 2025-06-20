const express = require('express');
const { Op, fn, col, literal } = require('sequelize');
const Sanitation = require('../models/Sanitation');
const { authenticateUser, authorizeRole } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * ✅ Issue a new sanitation ticket
 */
router.post('/', authenticateUser, authorizeRole(['admin', 'superadmin', 'tiketing']), async (req, res) => {
  const { price } = req.body;

  if (!price) {
    return res.status(400).json({ message: 'Price is required.' });
  }

  try {
    const now = new Date();
    const date = now.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    const byWhom = req.user.email;

    const ticket = await Sanitation.create({
      price,
      date,
      byWhom
    });

    res.status(201).json({
      message: 'Sanitation ticket issued successfully',
      ticketId: ticket.id,
      ticket
    });
  } catch (error) {
    res.status(500).json({ message: 'Error issuing sanitation ticket', error: error.message });
  }
});

/**
 * 📅 Get sanitation tickets by date and byWhom (optional query params: ?date=YYYY-MM-DD&byWhom=email)
 */

const moment = require('moment-timezone');


router.get('/by-date', authenticateUser, authorizeRole(['admin', 'superadmin']), async (req, res) => {
  const { date, byWhom } = req.query;

  try {
    const whereClause = {};

    if (byWhom) whereClause.byWhom = byWhom;

    if (date) {
      // Define start and end of the given day in Asia/Colombo, convert to UTC
      const startOfDay = moment.tz(date, 'Asia/Colombo').startOf('day').toDate();
      const endOfDay = moment.tz(date, 'Asia/Colombo').endOf('day').toDate();

      console.log("Sri Lanka Start of Day:", startOfDay);
      console.log("Sri Lanka End of Day:", endOfDay);

      whereClause.createdAt = {
        [Op.gte]: startOfDay,
        [Op.lte]: endOfDay
      };
    }

    const tickets = await Sanitation.findAll({
      where: whereClause,
      attributes: ['id', 'price', 'date', 'byWhom', 'createdAt'],
      order: [['createdAt', 'DESC'], ['id', 'DESC']],
      raw: true
    });

    const formattedTickets = tickets.map(ticket => ({
      ...ticket,
      createdAtSriLanka: new Date(ticket.createdAt).toLocaleString('en-GB', {
        timeZone: 'Asia/Colombo',
        hour12: false
      })
    }));

    res.status(200).json({ count: tickets.length, tickets: formattedTickets });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching sanitation tickets', error: error.message });
  }
});

/**
 * 💰 Daily income summary (optional query params: ?date=YYYY-MM-DD&byWhom=email)
 */


router.get('/daily-income', authenticateUser, authorizeRole(['admin', 'superadmin']), async (req, res) => {
  const { startDate, endDate, byWhom } = req.query;

  try {
    const whereClause = {};
    if (byWhom) whereClause.byWhom = byWhom;

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
        const start = moment.tz(startDate, 'Asia/Colombo').startOf('day').toDate();
        whereClause.createdAt[Op.gte] = start;
      }
      if (endDate) {
        const end = moment.tz(endDate, 'Asia/Colombo').endOf('day').toDate();
        whereClause.createdAt[Op.lte] = end;
      }
    }

    const dailyIncome = await Sanitation.findAll({
      attributes: [
        [fn('DATE', literal("CONVERT_TZ(`createdAt`, '+00:00', '+05:30')")), 'date'],
        [fn('SUM', col('price')), 'totalIncome'],
        [fn('COUNT', col('id')), 'ticketCount']
      ],
      where: whereClause,
      group: [literal("DATE(CONVERT_TZ(`createdAt`, '+00:00', '+05:30'))")],
      order: [[literal("DATE(CONVERT_TZ(`createdAt`, '+00:00', '+05:30'))"), 'DESC']],
      raw: true
    });

    res.status(200).json(dailyIncome);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching daily income', error: error.message });
  }
});

router.get('/monthly-income', authenticateUser, authorizeRole(['admin', 'superadmin']), async (req, res) => {
  const { startDate, endDate, byWhom } = req.query;

  try {
    const whereClause = {};
    if (byWhom) whereClause.byWhom = byWhom;

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
        const start = moment.tz(startDate, 'Asia/Colombo').startOf('month').toDate();
        whereClause.createdAt[Op.gte] = start;
      }
      if (endDate) {
        const end = moment.tz(endDate, 'Asia/Colombo').endOf('month').toDate();
        whereClause.createdAt[Op.lte] = end;
      }
    }

    const monthlyIncome = await Sanitation.findAll({
      attributes: [
        [fn('YEAR', literal("CONVERT_TZ(`createdAt`, '+00:00', '+05:30')")), 'year'],
        [fn('MONTH', literal("CONVERT_TZ(`createdAt`, '+00:00', '+05:30')")), 'month'],
        [fn('SUM', col('price')), 'totalIncome'],
        [fn('COUNT', col('id')), 'ticketCount']
      ],
      where: whereClause,
      group: [
        literal("YEAR(CONVERT_TZ(`createdAt`, '+00:00', '+05:30'))"),
        literal("MONTH(CONVERT_TZ(`createdAt`, '+00:00', '+05:30'))")
      ],
      order: [
        [literal("YEAR(CONVERT_TZ(`createdAt`, '+00:00', '+05:30'))"), 'DESC'],
        [literal("MONTH(CONVERT_TZ(`createdAt`, '+00:00', '+05:30'))"), 'DESC']
      ],
      raw: true
    });

    res.status(200).json(monthlyIncome);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching monthly income', error: error.message });
  }
});


router.delete('/:id', authenticateUser, authorizeRole(['admin', 'superadmin']), async (req, res) => {
  const { id } = req.params;

  try {
    const ticket = await Sanitation.findByPk(id);
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

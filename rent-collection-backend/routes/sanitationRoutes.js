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
router.get('/by-date', authenticateUser, authorizeRole(['admin', 'superadmin']), async (req, res) => {
  const { date, byWhom } = req.query;

  try {
    const whereClause = {};
    if (date) whereClause.date = date;
    if (byWhom) whereClause.byWhom = byWhom;

    const tickets = await Sanitation.findAll({
      where: whereClause,
      attributes: ['id', 'price', 'date', 'byWhom'],
      order: [['date', 'DESC'], ['id', 'DESC']]
    });

    res.status(200).json({ count: tickets.length, tickets });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching sanitation tickets', error: error.message });
  }
});

/**
 * 💰 Daily income summary (optional query params: ?date=YYYY-MM-DD&byWhom=email)
 */
router.get('/daily-income', authenticateUser, authorizeRole(['admin', 'superadmin']), async (req, res) => {
  const { date, byWhom } = req.query;

  try {
    const whereClause = {};
    if (date) whereClause.date = date;
    if (byWhom) whereClause.byWhom = byWhom;

    const dailyIncome = await Sanitation.findAll({
      attributes: [
        [fn('DATE', col('date')), 'date'],
        [fn('SUM', col('price')), 'totalIncome'],
        [fn('COUNT', col('id')), 'ticketCount']
      ],
      where: whereClause,
      group: [literal('DATE(date)')],
      order: [[literal('DATE(date)'), 'DESC']]
    });

    res.status(200).json(dailyIncome);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching daily income', error: error.message });
  }
});

/**
 * 📆 Monthly income summary (optional query param: ?byWhom=email)
 */
router.get('/monthly-income', authenticateUser, authorizeRole(['admin', 'superadmin']), async (req, res) => {
  const { byWhom } = req.query;

  try {
    const whereClause = {};
    if (byWhom) whereClause.byWhom = byWhom;

    const monthlyIncome = await Sanitation.findAll({
      attributes: [
        [fn('YEAR', col('date')), 'year'],
        [fn('MONTH', col('date')), 'month'],
        [fn('SUM', col('price')), 'totalIncome'],
        [fn('COUNT', col('id')), 'ticketCount']
      ],
      where: whereClause,
      group: [fn('YEAR', col('date')), fn('MONTH', col('date'))],
      order: [
        [fn('YEAR', col('date')), 'DESC'],
        [fn('MONTH', col('date')), 'DESC']
      ]
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

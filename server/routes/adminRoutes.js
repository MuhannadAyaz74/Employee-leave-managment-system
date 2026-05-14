const express = require('express');
const router = express.Router();
const { getUsers, createUser, deleteUser, getLeaveTypes, createLeaveType, getAllLeaves } = require('../controllers/adminController');
const verifyToken = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/users', getUsers);
router.post('/users', createUser);
router.delete('/users/:id', deleteUser);

router.get('/leave-types', getLeaveTypes);
router.post('/leave-types', createLeaveType);

router.get('/leaves', getAllLeaves);

module.exports = router;

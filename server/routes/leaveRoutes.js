const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });
const { applyLeave, getMyLeaves, getLeaveById, cancelLeave, getLeaveTypes, getPendingLeaves, approveLeave, rejectLeave } = require('../controllers/leaveController');
const verifyToken = require('../middleware/authMiddleware');

router.use(verifyToken);

router.post('/apply', upload.single('attachment'), applyLeave);
router.get('/my', getMyLeaves);
router.get('/types', getLeaveTypes);
router.get('/pending', getPendingLeaves);
router.get('/:id', getLeaveById);
router.put('/:id/cancel', cancelLeave);
router.put('/:id/approve', approveLeave);
router.put('/:id/reject', rejectLeave);

module.exports = router;

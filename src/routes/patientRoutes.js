const express = require('express');
const multer = require('multer');

const { protect, authorizeRoles } = require('../middlewares/authMiddleware');
const patientController = require('../controllers/patientController');

const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    },
});

const upload = multer({ storage });

router.get('/', protect, patientController.getPatients);
router.get('/:id', protect, patientController.getPatientById);

router.post(
    '/',
    protect,
    authorizeRoles('admin', 'coach'),
    upload.fields([
        { name: 'profileImage', maxCount: 1 },
        { name: 'reportPDF', maxCount: 1 },
    ]),
    patientController.createPatient,
);

router.put(
    '/:id',
    protect,
    authorizeRoles('admin', 'coach'),
    upload.fields([
        { name: 'profileImage', maxCount: 1 },
        { name: 'reportPDF', maxCount: 1 },
    ]),
    patientController.updatePatient,
);

router.delete('/:id', protect, authorizeRoles('admin'), patientController.deletePatient);

module.exports = router;

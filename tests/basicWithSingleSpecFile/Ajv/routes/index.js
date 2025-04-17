const express = require('express');
const userController = require('../controllers/userController');
const valiteDto = require('../middleware/validate-dto');
const userSchema = require('../schema/user');


const router = express.Router();
router.post('/register',valiteDto(userSchema), userController.createUser);




module.exports = router;
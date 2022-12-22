const express = require('express')
const messageController = require('../controllers/messageController')

const router = express.Router()

router.post('/create', messageController.create)

module.exports = router

export {}

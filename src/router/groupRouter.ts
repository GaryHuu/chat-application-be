const express = require('express')
const groupsController = require('../controllers/groupsController')

const router = express.Router()

router.post('/create', groupsController.create)

module.exports = router

export {}

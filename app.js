require('dotenv').config()
const createError = require('http-errors')
const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const logger = require('morgan')
const bodyParser = require('body-parser')
const cors = require('cors')
const app = express()

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.static(path.join(__dirname, 'node_modules')))
app.use('/dkg', express.static(__dirname + 'node_modules/dkg.js'))
app.use('/util', express.static(__dirname + 'public/util'))
app.use(bodyParser.json({limit: '50mb', extended: true}));
app.use(bodyParser.urlencoded({limit: "50mb", extended: true, parameterLimit:50000}));
app.use(bodyParser.text({ limit: '200mb' }));
app.use(cors())

//dkg
const getRouter_otp = require('./routes/dkg/get')
const getBidSuggestionRouter_otp = require('./routes/dkg/getBidSuggestion')
const getLatestStateIssuerRouter_otp = require('./routes/dkg/getLatestStateIssuer')
const getOwnerRouter_otp = require('./routes/dkg/getOwner')
const getStateIssuerRouter_otp = require('./routes/dkg/getStateIssuer')
const getStatesRouter_otp = require('./routes/dkg/getStates')
const createRouter_otp = require('./routes/dkg/create')
const queryRouter_otp = require('./routes/dkg/query')
const transferRouter_otp = require('./routes/dkg/transfer')
const create_n_transferRouter_otp = require('./routes/dkg/create_n_transfer')
const checkTransactionRouter_otp = require('./routes/dkg/checkTransaction')
const updateRouter_otp = require('./routes/dkg/update')
const isValidUALRouter_otp = require('./routes/dkg/isValidUAL')

//otp
const v_nodes_statsRouter_otp = require('./routes/otp/v_nodes_stats')
const v_nodes_stats_lastRouter_otp = require('./routes/otp/v_nodes_stats_last')
const v_nodes_rank_lastRouter_otp = require('./routes/otp/v_nodes_rank_last')
const v_nodesRouter_otp = require('./routes/otp/v_nodes')
const v_pubs_statsRouter_otp = require('./routes/otp/v_pubs_stats')
const v_pubs_stats_lastRouter_otp = require('./routes/otp/v_pubs_stats_last')
const assetHistory_otp = require('./routes/otp/assetHistory')
const assetInventory_otp = require('./routes/otp/assetInventory')

//otp_testnet
const v_nodes_statsRouter_otp_testnet = require('./routes/otp_testnet/v_nodes_stats')
const v_nodes_stats_lastRouter_otp_testnet = require('./routes/otp_testnet/v_nodes_stats_last')
const v_nodes_rank_lastRouter_otp_testnet = require('./routes/otp_testnet/v_nodes_rank_last')
const v_nodesRouter_otp_testnet = require('./routes/otp_testnet/v_nodes')
const v_pubs_statsRouter_otp_testnet = require('./routes/otp_testnet/v_pubs_stats')
const v_pubs_stats_lastRouter_otp_testnet = require('./routes/otp_testnet/v_pubs_stats_last')
const assetHistory_otp_testnet = require('./routes/otp_testnet/assetHistory')
const assetInventory_otp_testnet = require('./routes/otp_testnet/assetInventory')

//dkg
app.use('/dkg/get', getRouter_otp)
app.use('/dkg/getBidSuggestion', getBidSuggestionRouter_otp)
app.use('/dkg/getLatestStateIssuer', getLatestStateIssuerRouter_otp)
app.use('/dkg/getOwner', getOwnerRouter_otp)
app.use('/dkg/getStateIssuer', getStateIssuerRouter_otp)
app.use('/dkg/getStates', getStatesRouter_otp)
app.use('/dkg/create', createRouter_otp)
app.use('/dkg/update', updateRouter_otp)
app.use('/dkg/query', queryRouter_otp)
app.use('/dkg/transfer', transferRouter_otp)
app.use('/dkg/create_n_transfer', create_n_transferRouter_otp)
app.use('/dkg/checkTransaction', checkTransactionRouter_otp)
app.use('/dkg/isValidUAL', isValidUALRouter_otp)

//otp
app.use('/otp/v_nodes_stats', v_nodes_statsRouter_otp)
app.use('/otp/v_nodes_stats_last', v_nodes_stats_lastRouter_otp)
app.use('/otp/v_nodes_rank_last', v_nodes_rank_lastRouter_otp)
app.use('/otp/v_nodes', v_nodesRouter_otp)
app.use('/otp/v_pubs_stats', v_pubs_statsRouter_otp)
app.use('/otp/v_pubs_stats_last', v_pubs_stats_lastRouter_otp)
app.use('/otp/assetHistory', assetHistory_otp)
app.use('/otp/assetInventory', assetInventory_otp)

//otp_testnet
app.use('/otp_testnet/v_nodes_stats', v_nodes_statsRouter_otp_testnet)
app.use('/otp_testnet/v_nodes_stats_last', v_nodes_stats_lastRouter_otp_testnet)
app.use('/otp_testnet/v_nodes_rank_last', v_nodes_rank_lastRouter_otp_testnet)
app.use('/otp_testnet/v_nodes', v_nodesRouter_otp_testnet)
app.use('/otp_testnet/v_pubs_stats', v_pubs_statsRouter_otp_testnet)
app.use('/otp_testnet/v_pubs_stats_last', v_pubs_stats_lastRouter_otp_testnet)
app.use('/otp_testnet/assetHistory', assetHistory_otp_testnet)
app.use('/otp_testnet/assetInventory', assetInventory_otp_testnet)


// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404))
})

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  // render the error page
  res.status(err.status || 500)
  res.json({ result: 'Invalid Path.' })
})

module.exports = app

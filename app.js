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
const getRouter = require('./routes/dkg/get')
const getBidSuggestionRouter = require('./routes/dkg/getBidSuggestion')
const getLatestStateIssuerRouter = require('./routes/dkg/getLatestStateIssuer')
const getOwnerRouter = require('./routes/dkg/getOwner')
const getStateIssuerRouter = require('./routes/dkg/getStateIssuer')
const getStatesRouter = require('./routes/dkg/getStates')
const createRouter= require('./routes/dkg/create')
const queryRouter = require('./routes/dkg/query')
const transferRouter = require('./routes/dkg/transfer')
const create_n_transferRouter = require('./routes/dkg/create_n_transfer')
const checkTransactionRouter = require('./routes/dkg/checkTransaction')
const updateRouter = require('./routes/dkg/update')
const isValidUALRouter = require('./routes/dkg/isValidUAL')

//app
const appInfoRouter = require('./routes/app/info')
const appCreateRouter = require('./routes/app/create')
const appDeleteRouter = require('./routes/app/delete')
const appEditRouter = require('./routes/app/edit')

//key
const keyInfoRouter = require('./routes/key/info')
const keyCreateRouter = require('./routes/key/create')
const keyDeleteRouter = require('./routes/key/delete')

//txn
const txnInfoRouter = require('./routes/txn/info')
const txnCompleteRouter = require('./routes/txn/complete')
const txnRejectRouter = require('./routes/txn/reject')

//assets
const assetActivityRouter = require('./routes/assets/activity')
const assetHistoryRouter = require('./routes/assets/history')
const assetInventoryRouter = require('./routes/assets/inventory')
const assetsInfoRouter = require('./routes/assets/info')

//auth
const authRegisterRouter = require('./routes/auth/register')
const authSignRouter = require('./routes/auth/sign')

//blockchains
const othubHomeRouter = require('./routes/othub/home')

//nodes
const nodeActivityRouter = require('./routes/nodes/activity')
const nodeInfoRouter = require('./routes/nodes/info')
const nodeStatsRouter = require('./routes/nodes/stats')

//delegators
const delegatorsActivityRouter = require('./routes/delegators/activity')
const delegatorsStatsRouter = require('./routes/delegators/stats')

//pubs
const pubStatsRouter = require('./routes/pubs/stats')

//notifications
const telegramEditRouter = require('./routes/notifications/telegram/edit')
const telegramInfoRouter = require('./routes/notifications/telegram/info')
const telegramNotifyRouter = require('./routes/notifications/telegram/notify')

//images
const imagesRouter = require('./routes/images/index')

//misc
const syncStatusRouter = require('./routes/misc/sync_status')
const blockchainsRouter = require('./routes/misc/blockchains')

//dkg
app.use('/dkg/get', getRouter)
app.use('/dkg/getBidSuggestion', getBidSuggestionRouter)
app.use('/dkg/getLatestStateIssuer', getLatestStateIssuerRouter)
app.use('/dkg/getOwner', getOwnerRouter)
app.use('/dkg/getStateIssuer', getStateIssuerRouter)
app.use('/dkg/getStates', getStatesRouter)
app.use('/dkg/create', createRouter)
app.use('/dkg/update', updateRouter)
app.use('/dkg/query', queryRouter)
app.use('/dkg/transfer', transferRouter)
app.use('/dkg/create_n_transfer', create_n_transferRouter)
app.use('/dkg/checkTransaction', checkTransactionRouter)
app.use('/dkg/isValidUAL', isValidUALRouter)

//app
app.use('/app/info', appInfoRouter)
app.use('/app/create', appCreateRouter)
app.use('/app/delete', appDeleteRouter)
app.use('/app/edit', appEditRouter)

//key
app.use('/app/key/info', keyInfoRouter)
app.use('/app/key/create', keyCreateRouter)
app.use('/app/key/delete', keyDeleteRouter)

//txn
app.use('/app/txn/info', txnInfoRouter)
app.use('/app/txn/complete', txnCompleteRouter)
app.use('/app/txn/reject', txnRejectRouter)

//assets
app.use('/assets/activity', assetActivityRouter)
app.use('/assets/history', assetHistoryRouter)
app.use('/assets/inventory', assetInventoryRouter)
app.use('/assets/info', assetsInfoRouter)

//auth
app.use('/auth/register', authRegisterRouter)
app.use('/auth/sign', authSignRouter)

//othub
app.use('/othub/home', othubHomeRouter)

//nodes
app.use('/nodes/activity', nodeActivityRouter)
app.use('/nodes/info', nodeInfoRouter)
app.use('/nodes/stats', nodeStatsRouter)

//nodes
app.use('/delegators/activity', delegatorsActivityRouter)
app.use('/delegators/stats', delegatorsStatsRouter)

//pubs
app.use('/pubs/stats', pubStatsRouter)

//notifications
app.use('/notifications/telegram/edit', telegramEditRouter)
app.use('/notifications/telegram/info', telegramInfoRouter)
app.use('/notifications/telegram/notify', telegramNotifyRouter)

//images
app.use('/images', imagesRouter)

//misc
app.use('/misc/sync_status', syncStatusRouter)
app.use('/misc/blockchains', blockchainsRouter)

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

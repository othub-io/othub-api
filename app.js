require('dotenv').config()
const createError = require('http-errors')
const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const logger = require('morgan')

//docs
const docsRouter_otp = require('./routes/otp/docs')

//node
const apiPublishRouter_otp = require('./routes/otp/node/publish')
const getRouter_otp = require('./routes/otp/node/get')
const apiQueryRouter_otp = require('./routes/otp/node/query')
//const apiUpdateRouter = require('./routes/api/otp/node/update')
//const apiSearchRouter = require('./routes/api/otp/node/search')

//views
const v_dbg_txs_staging_checkRouter_otp = require('./routes/otp/views/v_dbg_txs_staging_check')
const v_latest_synched_blockRouter_otp  = require('./routes/otp/views/v_latest_synched_block')
const v_nodesRouter_otp = require('./routes/otp/views/v_nodes')
const v_nodes_statsRouter_otp = require('./routes/otp/views/v_nodes_stats')
const v_sys_events_failed_txRouter_otp  = require('./routes/otp/views/v_sys_events_failed_tx')
const v_sys_events_uselessRouter_otp  = require('./routes/otp/views/v_sys_events_useless')
const v_sys_txs_failedRouter_otp  = require('./routes/otp/views/v_sys_txs_failed')

//alliance
const spicyTacosRouter = require('./routes/alliance/spicyTacosXXL')

const app = express()

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.static(path.join(__dirname, 'node_modules')))
app.use('/util', express.static(__dirname + 'public/util'))

app.use('/otp/docs', docsRouter_otp)
app.use('/otp/node/get', getRouter_otp)
app.use('/otp/node/publish', apiPublishRouter_otp)
app.use('/otp/node/query', apiQueryRouter_otp)
//app.use('/api/otp/node/update', apiUpdateRouter)
//app.use('/api/otp/node/search', apiSearchRouter)

app.use('/otp/views/v_dbg_txs_staging_check', v_dbg_txs_staging_checkRouter_otp)
app.use('/otp/views/v_latest_synched_block', v_latest_synched_blockRouter_otp)
app.use('/otp/views/v_nodes', v_nodesRouter_otp) 
app.use('/otp/views/v_nodes_stats', v_nodes_statsRouter_otp) 
app.use('/otp/views/v_sys_events_failed_tx', v_sys_events_failed_txRouter_otp)
app.use('/otp/views/v_sys_events_useless ', v_sys_events_uselessRouter_otp)
app.use('/otp/views/v_sys_txs_failed  ', v_sys_txs_failedRouter_otp)

//misc
app.use('/spicyTacosXXL', spicyTacosRouter)

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
  res.render('error')
})

module.exports = app

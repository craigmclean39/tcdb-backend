const express = require('express');
const cors = require('cors');
const path = require('path');
const logger = require('morgan');
const dotenv = require('dotenv');
dotenv.config();
const schedule = require('node-schedule');
const updateAllPodcasts = require('./updatePodcast.js');

//Routers
const indexRouter = require('./routes/index');
const apiRouter = require('./routes/api');

//MongoDB Setup
const mongoose = require('mongoose');
const mongoDB = process.env.MONGODB_CONNECT;
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

//Express Initialization
const app = express();

//Middleware setup
const corsOptions = {
  exposedHeaders: 'X-Total-Count',
};

app.use(cors(corsOptions));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/api', apiRouter);

//Recurring Job
const rule = new schedule.RecurrenceRule();
rule.minute = 1;

const job = schedule.scheduleJob(rule, () => {
  updateAllPodcasts();
});

module.exports = app;

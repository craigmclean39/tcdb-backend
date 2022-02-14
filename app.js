const express = require('express');
const cors = require('cors');
const path = require('path');
const logger = require('morgan');
const dotenv = require('dotenv');
dotenv.config();
const schedule = require('node-schedule');
const updateAllPodcasts = require('./updatePodcast.js');

const indexRouter = require('./routes/index');
const apiRouter = require('./routes/api');

const User = require('./models/user');

const mongoose = require('mongoose');
const login = process.env.MONGODB_LOGIN;
const mongoDB = `mongodb+srv://${login}@sandbox.1gheh.mongodb.net/truecrimedb?retryWrites=true&w=majority`;
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

const app = express();

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

const rule = new schedule.RecurrenceRule();
rule.second = 1;

const job = schedule.scheduleJob(rule, () => {
  updateAllPodcasts();
});

module.exports = app;

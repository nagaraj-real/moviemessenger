const express = require('express');
const bodyParser = require('body-parser');

const verificationController = require('./controllers/verification');
const messageWebhookController = require('./controllers/messageWebhook');
const apiAiWebhookController = require('./controllers/apiAiWebhook');
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', verificationController);
app.post('/', messageWebhookController);
app.post('/apiAi', apiAiWebhookController);

app.listen(5000, () => console.log('Webhook server is listening, port 5000'));
const express = require('express');
const bodyParser = require('body-parser');

const verificationController = require('./controllers/verification');
const messageWebhookController = require('./controllers/messageWebhook');
const apiAiWebhookController = require('./controllers/apiAiWebhook');
const app = express();

const path=require('path');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname,'www/public')));

app.get('/', verificationController);

app.post('/', messageWebhookController);

app.get('/apiAi', apiAiWebhookController);

app.get('/webview', (req,res)=>{
    res.sendFile(path.join(__dirname,'www/index.html'));
});

let port = process.env.PORT || 5000;

app.listen(port, () => console.log('Webhook server is listening, port 5000'));
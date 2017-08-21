const express = require('express');
const path=require('path');
const bodyParser = require('body-parser');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static('public'));

app.get('/', (req,res)=>{
    res.sendFile(path.join(__dirname,'index.html'));
});


let port = 8080;

app.listen(port, () => console.log('Webhook server is listening, port 5000'));
const helpers = require('../helpers/helpers');
const FACEBOOK_ACCESS_TOKEN = 'EAAByIfAfYzkBABNUB8eBsVKwp3LwiNagyLIQT9CEOvc2UKE6OsuGOO5VAqUNnVyLUq2IjbvUFaVQcWhWgAkQJ8RKR1OcOLd1G9pfQfMm85pf3Nnoj825V1L5Iv4D9xPqTKQptvA8auXcyhx21aD5iyjLClZAOsZBDbuZBBO3AZDZD';

const request = require('request');
let userInfo=null;


const {processMessage,processPostback}=helpers;

const getUserInfo = (userid, callback) => {
    request({
        url: `https://graph.facebook.com/v2.6/${userid}`,
        qs: { access_token: FACEBOOK_ACCESS_TOKEN },
        method: 'GET'
    }, callback);
}

module.exports = (req, res) => {
    if (req.body.object === 'page') {
        req.body.entry.forEach(entry => {
            entry.messaging.forEach(event => {
                if (event.message && (event.message.text || event.message.attachments)) {
                    if (!userInfo) {
                        getUserInfo(event.sender.id, (err, response, body) => {
                            userInfo = JSON.parse(body);
                            processMessage(event,userInfo);
                        });
                    } else {                       
                         processMessage(event,userInfo);
                    }
                }else if(event.postback){
                    processPostback(event);
                }
            });
        });

        res.status(200).end();
    }
};
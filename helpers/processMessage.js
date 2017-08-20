const FACEBOOK_ACCESS_TOKEN = 'EAAByIfAfYzkBABNUB8eBsVKwp3LwiNagyLIQT9CEOvc2UKE6OsuGOO5VAqUNnVyLUq2IjbvUFaVQcWhWgAkQJ8RKR1OcOLd1G9pfQfMm85pf3Nnoj825V1L5Iv4D9xPqTKQptvA8auXcyhx21aD5iyjLClZAOsZBDbuZBBO3AZDZD';
const CAT_IMAGE_URL = 'https://botcube.co/public/blog/apiai-tutorial-bot/hosico_cat.jpg';

const API_AI_TOKEN = 'ca2d3e98530b4fdbae1b74064d68e769';
const apiAiClient = require('apiai')(API_AI_TOKEN);

const request = require('request');


const sendAttachments = (senderId, imageUri, type) => {
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: { access_token: FACEBOOK_ACCESS_TOKEN },
        method: 'POST',
        json: {
            recipient: { id: senderId },
            message: {
                attachment: {
                    type: type,
                    payload: { url: imageUri }
                }
            }
        }
    });
};

const sendTextMessage = (senderId, text, quick_replies) => {
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: { access_token: FACEBOOK_ACCESS_TOKEN },
        method: 'POST',
        json: {
            recipient: { id: senderId },
            message: {
                text: text,
                quick_replies: quick_replies
            }
        }
    });
};





const startOverAction = (senderId,userInfo) => {
    let text = `Hi ${userInfo.first_name}, I am Movie bot ;-) here to help you with movie info and reviews. Let's get started!!! Enter a movie name`;
    sendTextMessage(senderId, text)
}



module.exports = (event,userInfo) => {
    const senderId = event.sender.id;
    const message = event.message.text;
    const attachments = event.message.attachments;
    

    if (attachments && attachments.length > 0) {

        sendAttachments(senderId, attachments[0].payload.url, attachments[0].type)

    } else {

        const apiaiSession = apiAiClient.textRequest(message, { sessionId: 'botcube_co' });

        apiaiSession.on('response', (response) => {
            const result = response.result.fulfillment.speech;
            const action = response.result.action;
            switch (action) {
                case 'start.over': startOverAction(senderId,userInfo)
                    break;
                case 'input.welcome': sendAttachments(senderId, CAT_IMAGE_URL, 'image')
                    break;
                default: sendTextMessage(senderId, result || result.trim() != '' || 'sorry what was that');
            }
        });

        apiaiSession.on('error', error => console.log(error));
        apiaiSession.end();
    }
};
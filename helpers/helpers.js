

const CAT_IMAGE_URL = 'https://botcube.co/public/blog/apiai-tutorial-bot/hosico_cat.jpg';

const API_AI_TOKEN = 'ca2d3e98530b4fdbae1b74064d68e769';
const apiAiClient = require('apiai')(API_AI_TOKEN);

let {currentcontext} = require('./commonVar');

const actionHelpers = require('./actionHelpers');
const apiFunctionHelpers = require('./apiFunctionHelpers');

const { selectMovieAction, selectMovieFallbackAction, selectMovieViewMoreAction,
    selectMovieSelectionAction, movieSearchAction, sendWelcomeMessageAction, movieDiscoverAction } = actionHelpers;
const { sendTextMessage, sendAttachments } = apiFunctionHelpers;

const processAction = (action, senderId, params, userInfo, payload) => {

    switch (action) {
        case 'input.welcome': sendAttachments(senderId, CAT_IMAGE_URL, 'image')
            break;
        case 'MOVIE_SEARCH_ENTER': selectMovieAction(senderId, params);
            break;
        case 'MOVIE_SEARCH_FALLBACK': selectMovieFallbackAction(senderId);
            break;
        case 'MOVIE_VIEW_MORE': selectMovieViewMoreAction(senderId);
            break;
        case 'MOVIE_SELECTION': selectMovieSelectionAction(senderId, payload.MOVIE_SELECTION.id);
            break;
        case 'MOVIE_SEARCH': movieSearchAction(senderId)
            break;
        case 'FACEBOOK_WELCOME': sendWelcomeMessageAction(senderId, userInfo);
            break;
        case 'MOVIE_DISCOVER': movieDiscoverAction(senderId);
            break;
        default: sendTextMessage(senderId, 'sorry what was that');
    }

}


const processMessage = (event, userInfo) => {
    const senderId = event.sender.id;
    const message = event.message.text;
    const attachments = event.message.attachments;


    if (attachments && attachments.length > 0) {
        sendAttachments(senderId, attachments[0].payload.url, attachments[0].type)
    } else {
        let apioptions = {};
        apioptions.sessionId = 'moviebot' + event.sender.id;
        if (currentcontext) {
            apioptions.contexts = currentcontext;
        }
        const apiaiSession = apiAiClient.textRequest(message, apioptions);
        currentcontext = [];
        apiaiSession.on('response', (response) => {
            currentcontext = [];
            const speech = response.result.fulfillment.speech;
            const params = response.result.parameters;
            const action = response.result.action;
            if (speech && speech.trim() != '') {
                sendTextMessage(senderId, speech);
            } else {
                processAction(action, senderId, params, userInfo, null)
            }

            apiaiSession.end();

        });

        apiaiSession.on('error', error => console.log(error));
        apiaiSession.end();
    }
};

const processPostback = (event, userInfo) => {
    const senderId = event.sender.id;
    let payload = {};
    try {
        payload = JSON.parse(event.postback.payload);
    } catch (e) {
        payload[event.postback.payload] = null;
    }
    const title = event.postback.title;
    const action = Object.keys(payload)[0];
    processAction(action, senderId, null, userInfo, payload);
}


module.exports = {
    processMessage: processMessage,
    processPostback: processPostback
}
const FACEBOOK_ACCESS_TOKEN = 'EAAByIfAfYzkBABNUB8eBsVKwp3LwiNagyLIQT9CEOvc2UKE6OsuGOO5VAqUNnVyLUq2IjbvUFaVQcWhWgAkQJ8RKR1OcOLd1G9pfQfMm85pf3Nnoj825V1L5Iv4D9xPqTKQptvA8auXcyhx21aD5iyjLClZAOsZBDbuZBBO3AZDZD';
const MOVIEDB_TOKEN = '113cf8306f2b957e9c88f5f3fc2914cc';
const MOVIEDB_URL = 'https://api.themoviedb.org/3/search/movie';
const CAT_IMAGE_URL = 'https://botcube.co/public/blog/apiai-tutorial-bot/hosico_cat.jpg';
const MOVIEDB_IMAGE_URL = 'https://image.tmdb.org/t/p/w500';


const API_AI_TOKEN = 'ca2d3e98530b4fdbae1b74064d68e769';
const apiAiClient = require('apiai')(API_AI_TOKEN);

const request = require('request');

let currentcontext = null;



function listElements(title, subtitle, image_url, buttons) {
    this.title = title;
    this.subtitle = subtitle;
    this.image_url = image_url;
    this.buttons = buttons;
}

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

const sendList = (senderId, elementList) => {
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: { access_token: FACEBOOK_ACCESS_TOKEN },
        method: 'POST',
        json: {
            recipient: { id: senderId },
            message: {
                attachment: {
                    type: "template",
                    payload: {
                        template_type: "list",
                        top_element_style: "compact",
                        elements: elementList,
                        buttons: [
                            {
                                title: "View More",
                                type: "postback",
                                payload: "payload"
                            }
                        ]
                    }
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


const fetchMovie = (moviename, callback) => {
    request({
        url: MOVIEDB_URL,
        qs: {
            api_key: MOVIEDB_TOKEN,
            page: 1,
            include_adult: false,
            query: moviename,
            language: 'en-US'
        },
        method: 'GET'
    }, callback);
}





const startOverAction = (senderId, userInfo) => {
    let text = `Hi ${userInfo.first_name}, I am Movie bot ;-) here to help you with movie info and reviews. Let's get started!!! Enter a movie name`;
    currentcontext = [
                    {
                        name: 'start_over-followup',
                        lifespan: 1
                    }
    ];
    sendTextMessage(senderId, text);
}

const selectMovieAction = (senderId, speech, params) => {
    let movieInfo = {};
    let movieresults = [];
    if (speech && speech.trim() != '') {
        sendTextMessage(senderId, speech)
    } else if (params['movie-name'] && params['movie-name'].trim() != '') {
        const moviename = params['movie-name'];
        fetchMovie(moviename, (err, response, body) => {
            movieInfo = JSON.parse(body);
            if (movieInfo.total_results === 0) {
                currentcontext = [
                    {
                        name: 'start_over-followup',
                        lifespan: 1
                    }
                ];
                sendTextMessage(senderId, `Sorry I couldn't find any info about ${moviename}.Let's try another movie`);

            } else {
                movieInfo.results=movieInfo.results.filter((res)=>res.title && res.title.trim()!==''
                && res.overview && res.overview.trim()!==''
                && res.poster_path && res.poster_path.trim()!=='')

                movieresults = movieInfo.results.length <= 5 ? movieInfo.results : movieInfo.results.slice(0, 4);
                let elementlist = [];
                movieresults.forEach((result) => {
                    const payload = {
                        movieselection: {
                            id: result.id
                        }
                    }

                    let buttons = [
                        {
                            title: "Select",
                            type: "postback",
                            payload: JSON.stringify(payload)
                        }
                    ]
                    elementlist.push(new listElements(result.title, result.overview, MOVIEDB_IMAGE_URL + result.poster_path, buttons));

                })
                sendList(senderId, elementlist)
            }
        })

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
        apioptions.sessionId = 'moviebot' + event.message.text;
        if (currentcontext) {
            apioptions.contexts = currentcontext;
        }
        const apiaiSession = apiAiClient.textRequest(message, apioptions);

        apiaiSession.on('response', (response) => {
            currentcontext=null;
            const speech = response.result.fulfillment.speech;
            const params = response.result.parameters;
            const action = response.result.action;
            switch (action) {
                case 'start.over': startOverAction(senderId, userInfo)
                    break;
                case 'input.welcome': sendAttachments(senderId, CAT_IMAGE_URL, 'image')
                    break;
                case 'select.movie.name': selectMovieAction(senderId, speech, params);
                    break;
                default: sendTextMessage(senderId, speech || speech.trim() != '' || 'sorry what was that');
            }
            //apiaiSession.end();
        });

        apiaiSession.on('error', error => console.log(error));
        apiaiSession.end();
    }
};

const processPostback = (event) => {
    const senderId = event.sender.id;
    const payload = JSON.parse(event.postback.payload);
    const title = event.postback.title;

    switch (Object.keys(payload)[0]) {
        case 'movieselection': sendTextMessage(senderId, payload.movieselection.id);
    }


}

module.exports = {
    processMessage: processMessage,
    processPostback: processPostback
}
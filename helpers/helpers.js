const FACEBOOK_ACCESS_TOKEN = 'EAAByIfAfYzkBABNUB8eBsVKwp3LwiNagyLIQT9CEOvc2UKE6OsuGOO5VAqUNnVyLUq2IjbvUFaVQcWhWgAkQJ8RKR1OcOLd1G9pfQfMm85pf3Nnoj825V1L5Iv4D9xPqTKQptvA8auXcyhx21aD5iyjLClZAOsZBDbuZBBO3AZDZD';
const MOVIEDB_TOKEN = '113cf8306f2b957e9c88f5f3fc2914cc';
const MOVIEDB_URL = 'https://api.themoviedb.org/3/search/movie';
const CAT_IMAGE_URL = 'https://botcube.co/public/blog/apiai-tutorial-bot/hosico_cat.jpg';
const MOVIEDB_IMAGE_URL = 'https://image.tmdb.org/t/p/w500';


const API_AI_TOKEN = 'ca2d3e98530b4fdbae1b74064d68e769';
const apiAiClient = require('apiai')(API_AI_TOKEN);

const request = require('request');

let currentcontext = null;

let movieInfo = {};

let movieInfoTopIndex = 0;



function listElements(title, subtitle, image_url, buttons, default_action) {
    this.title = title;
    this.subtitle = subtitle;
    this.image_url = image_url;
    this.buttons = buttons;
    this.default_action = default_action;
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

const sendTemplate = (senderId, payload,callback) => {
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: { access_token: FACEBOOK_ACCESS_TOKEN },
        method: 'POST',
        json: {
            recipient: { id: senderId },
            message: {
                attachment: {
                    type: "template",
                    payload: payload
                }
            }

        }
    },callback);
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
                movieInfo.results = movieInfo.results.filter((res) => res.title && res.title.trim() !== ''
                    && res.overview && res.overview.trim() !== ''
                    && res.poster_path && res.poster_path.trim() !== '')

                sendMovieList(movieInfo, senderId);
            }
        })

    }

}



const sendMovieList = (movieInfo, senderId) => {
    let elementlist = [];

    movieresults = movieInfo.results.length <= 4 ? movieInfo.results : movieInfo.results.slice(movieInfoTopIndex, movieInfoTopIndex + 4);

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
        // let defaultaction = {
        //     type: "web_url",
        //     url: "https://87c78775.ngrok.io/",
        //     messenger_extensions: true,
        //     webview_height_ratio: "tall",
        //     fallback_url: "https://87c78775.ngrok.io/"
        // }

        elementlist.push(new listElements(result.title, result.overview, MOVIEDB_IMAGE_URL + result.poster_path, buttons));

    });
    const actionpayload = {
        viewmore: null
    }

    let actionbuttons = [{
        title: "View More",
        type: "postback",
        payload: JSON.stringify(actionpayload)
    }]

    currentcontext = [
        {
            name: 'select_movie_name-followup',
            lifespan: 1
        }
    ];


    let payload = {
        template_type: "list",
        top_element_style: "compact",
        elements: elementlist
    }

    if ((movieInfoTopIndex + 4) <= movieInfo.results.length) {
        payload.buttons = actionbuttons;
    } else {
        currentcontext = null;
    }

    sendTemplate(senderId, payload);

}

const selectMovieFallbackAction = (senderId, speech) => {
    if (speech && speech.trim() != '') {
        sendTextMessage(senderId, speech);
    } else {
        sendTextMessage(senderId, `fallback`);
    }
}

const selectMovieViewMoreAction = (senderId, speech) => {
    if (speech && speech.trim() != '') {
        sendTextMessage(senderId, speech);
    } else {
        movieInfoTopIndex = movieInfoTopIndex + 5;
        sendMovieList(movieInfo, senderId);
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
            currentcontext = null;
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
                case 'select.movie.fallback': selectMovieFallbackAction(senderId, speech);
                    break;
                case 'select.movie.viewmore': selectMovieViewMoreAction(senderId, speech);
                    break;
                default: sendTextMessage(senderId, speech || speech.trim() != '' || 'sorry what was that');
            }
            apiaiSession.end();

        });

        apiaiSession.on('error', error => console.log(error));
        apiaiSession.end();
    }
};

const selectMovieSelectionAction =(senderId, id)=>{
    let selectedMovie=movieInfo.results.find(p=>p.id===id);
    let elementlist=[];
    let imageurl=selectedMovie.backdrop_path && selectedMovie.backdrop_path.trim()!=='' ? selectedMovie.backdrop_path:selectedMovie.poster_path;
    elementlist.push(new listElements(selectedMovie.title, undefined, MOVIEDB_IMAGE_URL + imageurl));
    let payload = {
        template_type: "generic",
        elements:elementlist
    }
    sendTemplate(senderId, payload,(err, response, body)=>{
        sendTextMessage(senderId,selectedMovie.overview)
    });
    
}

const processPostback = (event) => {
    const senderId = event.sender.id;
    const payload = JSON.parse(event.postback.payload);
    const title = event.postback.title;

    switch (Object.keys(payload)[0]) {
        case 'movieselection': selectMovieSelectionAction(senderId, payload.movieselection.id);
            break;
        case 'viewmore': selectMovieViewMoreAction(senderId);
            break;
        default: sendTextMessage(senderId, speech || speech.trim() != '' || 'sorry what was that');
    }


}

module.exports = {
    processMessage: processMessage,
    processPostback: processPostback
}
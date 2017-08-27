const apiFunctionHelpers = require('./apiFunctionHelpers');

const { listElements, sendTemplate, sendTextMessage, sendAttachments, fetchMovie } = apiFunctionHelpers;

const MOVIEDB_IMAGE_URL = 'https://image.tmdb.org/t/p/w500';

let movieInfo = {};
let movieInfoTopIndex = 0;

let {currentcontext} = require('./commonVar');

sendMovieList = (movieInfo, senderId) => {
    let elementlist = [];

    movieresults = movieInfo.results.length <= 4 ? movieInfo.results : movieInfo.results.slice(movieInfoTopIndex, movieInfoTopIndex + 4);

    movieresults.forEach((result) => {
        let payload = {
            MOVIE_SELECTION: {
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
    let actionpayload = {
        MOVIE_VIEW_MORE: null
    }

    let actionbuttons = [{
        title: "View More",
        type: "postback",
        payload: JSON.stringify(actionpayload)
    }]

    currentcontext.push(
        {
            name: 'select_movie_name-followup',
            lifespan: 1
        }
    );


    let payload = {
        template_type: "list",
        top_element_style: "compact",
        elements: elementlist
    }

    if ((movieInfoTopIndex + 4) <= movieInfo.results.length) {
        payload.buttons = actionbuttons;
    } else {
        currentcontext = [];
    }

    sendTemplate(senderId, payload);

}


selectMovieSelectionAction = (senderId, id) => {
    let selectedMovie = movieInfo.results.find(p => p.id === id);
    let elementlist = [];
    let imageurl = selectedMovie.backdrop_path && selectedMovie.backdrop_path.trim() !== '' ? selectedMovie.backdrop_path : selectedMovie.poster_path;
    elementlist.push(new listElements(selectedMovie.title, undefined, MOVIEDB_IMAGE_URL + imageurl));
    let payload = {
        template_type: "generic",
        elements: elementlist
    }
    sendTemplate(senderId, payload, (err, response, body) => {
        sendTextMessage(senderId, selectedMovie.overview)
    });

}


selectMovieAction = (senderId, params) => {

    let movieresults = [];
    if (params['movie-name'] && params['movie-name'].trim() != '') {
        moviename = params['movie-name'];
        fetchMovie(moviename, (err, response, body) => {
            movieInfo = JSON.parse(body);
            movieInfo.results = movieInfo.results.filter((res) => res.title && res.title.trim() !== ''
                && res.overview && res.overview.trim() !== ''
                && res.poster_path && res.poster_path.trim() !== '')
            if (movieInfo.results.length === 0) {
                currentcontext.push({
                    name: 'start_over-followup',
                    lifespan: 1
                });
                sendTextMessage(senderId, `Sorry I couldn't find any info about ${moviename}.Let's try another movie`);

            } else {

                if (movieInfo.results.length === 1) {
                    selectMovieSelectionAction(senderId, movieInfo.results[0].id)
                } else if (movieInfo.results.length > 1) {
                    sendMovieList(movieInfo, senderId)
                }

            }
        })

    }

}

selectMovieFallbackAction = (senderId) => {
    sendTextMessage(senderId, `fallback`);
}

selectMovieViewMoreAction = (senderId) => {
    movieInfoTopIndex = movieInfoTopIndex + 5;
    sendMovieList(movieInfo, senderId);
}

sendWelcomeMessageAction = (senderId, userInfo) => {
    let movieSearchPayload = JSON.stringify({ MOVIE_SEARCH: null });
    let movieDiscoverPayload = JSON.stringify({ MOVIE_DISCOVER: null });

    let quick_replies = [
        {
            content_type: "text",
            title: "Search Movies",
            payload: movieSearchPayload
        },
        {
            content_type: "text",
            title: "Discover Movies",
            payload: movieDiscoverPayload
        }
    ]
    sendTextMessage(senderId, `Hi ${userInfo.first_name}, I am Movie bot.I can help you with movie information and reviews.`, quick_replies)
}

movieSearchAction = (senderId) => {
    let text = `Enter a movie name`;
    currentcontext.push(
        {
            name: 'start_over-followup',
            lifespan: 1
        });

    sendTextMessage(senderId, text);
}

movieDiscoverAction = (senderId) => {
    let text = `This section is Coming soon..`;

    sendTextMessage(senderId, text);
}

module.exports = {
    sendMovieList: sendMovieList,
    selectMovieSelectionAction: selectMovieSelectionAction,
    selectMovieAction: selectMovieAction,
    selectMovieFallbackAction: selectMovieFallbackAction,
    selectMovieViewMoreAction: selectMovieViewMoreAction,
    sendWelcomeMessageAction: sendWelcomeMessageAction,
    movieSearchAction: movieSearchAction,
    movieDiscoverAction: movieDiscoverAction
}
const apiFunctionHelpers = require('./apiFunctionHelpers');

const { listElements, sendTemplate, sendTextMessage, sendAttachments, fetchMovie, fetchMovieVideos, fetchMovieDetails } = apiFunctionHelpers;

const MOVIEDB_IMAGE_URL = 'https://image.tmdb.org/t/p/w500';

const WEBVIEW_URL='https://99de6cda.ngrok.io/webview';

let movieInfo = {};
let movieInfoTopIndex = 0;

let { currentcontext } = require('./commonVar');

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
        currentcontext.splice(0, currentcontext.length)
    }

    sendTemplate(senderId, payload);

}

selectMovieSelectionAction = (senderId, id) => {
    let selectedMovie = movieInfo.results.find(p => p.id === id);
    let elementlist = [];
    let imageurl = selectedMovie.backdrop_path && selectedMovie.backdrop_path.trim() !== '' ? selectedMovie.backdrop_path : selectedMovie.poster_path;



    let quick_replies = [];

    let parameters = {};

    let buttons = [];

    fetchMovieDetails(selectedMovie.id, (err, response, body) => {
        let results = JSON.parse(body);
        if (results.imdb_id && results.imdb_id.trim() !== '') {
            const imdburl=WEBVIEW_URL+"?imdburl="+results.imdb_id;
            buttons.push({
                type: "web_url",
                url: imdburl,
                title:"View Reviews",
                messenger_extensions: true,
                webview_height_ratio: "tall",
                fallback_url: imdburl
            })
            parameters.movie_review_key = results.imdb_id;
        }
        parameters.movie_name = results.title;
        fetchMovieVideos(selectedMovie.id, (err, response, body) => {
            let results = JSON.parse(body).results;
            let officialTrailerObj = results.filter(p => p.name === 'Official Trailer' && p.site === 'YouTube');
            let officialTeaserObj = results.filter(p => p.name === 'Official Teaser' && p.site === 'YouTube')
            if (officialTrailerObj && officialTrailerObj.length > 0) {
                quick_replies.push({
                    content_type: "text",
                    title: "Watch Trailer",
                    payload: JSON.stringify({ MOVIE_VIDEOS: officialTrailerObj[0].key })
                });
                parameters.movie_video_key = officialTrailerObj[0].key;
            } else if (officialTeaserObj && officialTeaserObj.length > 0) {
                quick_replies.push({
                    content_type: "text",
                    title: "Watch Teaser",
                    payload: JSON.stringify({ MOVIE_VIDEOS: officialTeaserObj[0].key })
                });
                parameters.movie_video_key = officialTeaserObj[0].key;
            }
            currentcontext.push(
                {
                    name: 'movie_after_selection',
                    lifespan: 1,
                    parameters: parameters
                }
            );
            elementlist.push(new listElements(selectedMovie.title, undefined, MOVIEDB_IMAGE_URL + imageurl,buttons));
            let payload = {
                template_type: "generic",
                elements: elementlist
            }
            sendTemplate(senderId, payload, (err, response, body) => {
                sendTextMessage(senderId, selectedMovie.overview, quick_replies)
            });
        });

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

movieVideosAction = (senderId, params) => {
    const urlkey = params['movie_video_key'];
    const YOUTUBE_URL = 'https://www.youtube.com/watch?v=';
    const text = YOUTUBE_URL + urlkey;

    let payload = {
        template_type: "open_graph",
        elements: [
            {
                url: text
            }
        ]
    }

    sendTemplate(senderId, payload);
}

movieReviewsAction = (senderId, params) => {
    let reviewId = params['movie_review_key'];

    let text = `This revies is ${reviewId} Coming soon..`;

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
    movieDiscoverAction: movieDiscoverAction,
    movieVideosAction: movieVideosAction,
    movieReviewsAction: movieReviewsAction
}
const FACEBOOK_ACCESS_TOKEN = 'EAAByIfAfYzkBABNUB8eBsVKwp3LwiNagyLIQT9CEOvc2UKE6OsuGOO5VAqUNnVyLUq2IjbvUFaVQcWhWgAkQJ8RKR1OcOLd1G9pfQfMm85pf3Nnoj825V1L5Iv4D9xPqTKQptvA8auXcyhx21aD5iyjLClZAOsZBDbuZBBO3AZDZD';
const MOVIEDB_TOKEN = '113cf8306f2b957e9c88f5f3fc2914cc';
const MOVIEDB_SEARCH_URL = 'https://api.themoviedb.org/3/search/movie';

const request = require('request');

function listElements(title, subtitle, image_url, buttons, default_action) {
    this.title = title;
    this.subtitle = subtitle;
    this.image_url = image_url;
    this.buttons = buttons;
    this.default_action = default_action;
}

sendAttachments = (senderId, imageUri, type) => {
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
}

sendTemplate = (senderId, payload, callback) => {
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
    }, callback);
}

sendTextMessage = (senderId, text, quick_replies) => {
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
}

fetchMovie = (moviename, callback) => {
    request({
        url: MOVIEDB_SEARCH_URL,
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

fetchMovieDetails = (id, callback) => {
    const MOVIEDB_SEARCH_DETAIL_URL = `https://api.themoviedb.org/3/movie/${id}`;
    request({
        url: MOVIEDB_SEARCH_DETAIL_URL,
        qs: {
            api_key: MOVIEDB_TOKEN,
            language: 'en-US'
        },
        method: 'GET'
    }, callback);
}

fetchMovieVideos = (id, callback) => {
    const MOVIEDB_SEARCH_VIDEOS_URL = `https://api.themoviedb.org/3/movie/${id}/videos`;
    request({
        url: MOVIEDB_SEARCH_VIDEOS_URL,
        qs: {
            api_key: MOVIEDB_TOKEN,
            language: 'en-US'
        },
        method: 'GET'
    }, callback);
}

module.exports = {
    listElements: listElements,
    sendAttachments: sendAttachments,
    sendTemplate: sendTemplate,
    sendTextMessage: sendTextMessage,
    fetchMovie: fetchMovie,
    fetchMovieVideos: fetchMovieVideos,
    fetchMovieDetails: fetchMovieDetails
}



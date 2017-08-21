const request = require('request');

const imageAction = () => {
    const imageName = req.body.result.parameters['image_name'];

    request({
        uri: apiUrl,
        methos: 'GET',
        headers: { 'Api-Key': GETTY_IMAGES_API_KEY }
    }, (err, response, body) => {
        const imageUri = JSON.parse(body).images[0].display_sizes[0].uri;

        return res.json({
            speech: imageUri,
            displayText: imageUri,
            source: 'image_name'
        });
    })
}

const selectMovieAction = () => {
    const imageName = req.body.result.parameters['movie-name'];

    return res.json({
        speech: imageName,
        displayText: imageName,
        source: 'movie-name'
    });
}

module.exports = (req, res) => {
    let action = req.body.result.action;

    switch (action) {
        case 'image': imageAction();
            break;
        case 'select.movie.name': selectMovieAction();
            break;
        default: imageAction();
    }
}
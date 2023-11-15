const AppError = require("../util/appError");
const axios = require('axios');
const catchAsync = require("../util/catchAsync");

//todo: format physical data because frontend developer is frustrated

// returns categories
exports.getCategories = catchAsync(async (req, res, next) => {
    res.status(200).json({
        status: 'success',
        data: [{DisplayName: "Celestial Objects", id: "celestialobjects"}, {
            DisplayName: "Events",
            id: "events"
        }, {DisplayName: "Missions", id: "missions"}]
    });
});

exports.getCategoryContent = catchAsync(async (req, res, next) => {
    console.log("here")
    const cat = req.params.category;
    switch (cat) {
        case "celestialobjects":
            getCelestialObjects(req, res, next);
            break;
        case "events":
            getEvents(req, res, next);
            break;
        case "missions":
            getMissions(req, res, next);
            break;
        default:
            return next(new AppError("There is no such category!", 400));
    }
})

const getCelestialObjects = (req, res, next) => {

    res.status(200).json({
        status: 'success',
        data: [{DisplayName: "Planets", id: "Planet"}, {DisplayName: "Stars", id: "Star"}, {
            DisplayName: "Moon",
            id: "Moon"
        }, {DisplayName: "Asteroids", id: "Asteroid"}, {
            DisplayName: "Dwarf Planets",
            id: "Dwarf%20Planet"
        }, {DisplayName: "Galaxies", id: "galaxies"}]
    });
}

const getEvents = catchAsync((req, res, next) => {
    // todo: this
});

const getMissions = catchAsync((req, res, next) => {
    // todo: this
});


exports.getCoContent = catchAsync(async (req, res, next) => {

    const coC = req.params.coC;
    switch (coC) {
        case "galaxies":
            handleGalaxies(req, res, next);
            break;
        case "Planet":
        case "Star":
        case "Moon":
        case "Asteroid":
        case "Dwarf Planet":
            handleNonGalaxies(req, res, next);
            break;
        default:
            return next(new AppError("No such celestial Object.", 400));
    }

});

const handleGalaxies = catchAsync(async (req, res, next) => {
    res.status(200).json({
        status: 'success',
        data: [{englishName: "Milky Way", id: "Milky_Way"}, {
            englishName: "Andromeda Galaxy (M31)",
            id: "Andromeda_Galaxy"
        }, {englishName: "Triangulum Galaxy (M33)", id: "Triangulum_Galaxy"}, {
            englishName: "Messier 87 (M87)",
            id: "Messier_87"
        }, {englishName: "Whirlpool Galaxy (M51)", id: "Whirlpool_Galaxy"}, {
            englishName: "Sombrero Galaxy (M104)",
            id: "Sombrero_Galaxy"
        }, {
            englishName: "Large Magellanic Cloud (LMC)",
            id: "Large_Magellanic_Cloud"
        }, {
            englishName: "Small Magellanic Cloud (SMC):",
            id: "Small_Magellanic_Cloud"
        }, {englishName: "Pinwheel Galaxy", id: "Pinwheel_Galaxy"}, {
            englishName: "Triangulum Galaxy",
            id: "Triangulum_Galaxy "
        }]
    });
})


const handleNonGalaxies = catchAsync(async (req, res, next) => {

    const coC = req.params.coC;
    //was actually intended to use pagination but leader is frustrated by the work load '>'
    const response = await axios.get(`https://api.le-systeme-solaire.net/rest/bodies/?data=englishName,id&filter[]=bodyType,eq,${coC}&order=englishName}`);

    const data = response.data;

    res.status(200).json({
        status: "success", data: data.bodies
    })

});


exports.getBody = catchAsync(async (req, res, next) => {
    const coC = req.params.coC;

    // console.log(coC);

    switch (coC) {
        case "galaxies":
        case "Planet":
        case "Star":
        case "Moon":
        case "Asteroid":
        case "Dwarf Planet":
            getBodyData(req, res, next);
            break;
        default:
            return next(new AppError("No such celestial Object.", 400));
    }
});

const getBodyData = async (req, res, next) => {
    const coC = req.params.coC;
    const body = req.params.body;

    //get facts
    const options = {
        method: 'GET', url: 'https://wiki-briefs.p.rapidapi.com/search', params: {
            q: `${body}`, topk: '5'
        }, headers: {
            // todo: store this in env
            'X-RapidAPI-Key': '4bf4c71207mshdb3d68f149c3089p14773fjsn7765b58b98f6',
            'X-RapidAPI-Host': 'wiki-briefs.p.rapidapi.com'
        }
    };


    let response = await axios.request(options);
    const facts = response.data.summary;
    const image = response.data.image;
    const altBodyName = response.data.url.split('/').pop();

    response = await axios.get(`https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&explaintext=1&titles=${altBodyName}&continue=&format=json&formatversion=2`)
    const jsonData = await response.data;
    const dataFromWiki = Object.values(jsonData.query.pages)[0];
    const info = dataFromWiki.extract;


    let physicalData = undefined;
    if (coC !== "galaxies") {
        let response = await axios.get(`https://api.le-systeme-solaire.net/rest/bodies/${body}`);
        physicalData = response.data;
    }

    res.status(200).json({
        status: "success", data: {
            image: image, info: info, facts: facts, physicalData: physicalData
        }
    })
};
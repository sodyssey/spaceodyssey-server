const AppError = require("../util/appError");
const axios = require('axios');
const catchAsync = require("../util/catchAsync");

//todo: format physical data because frontend developer isn't going to

exports.getCategories = catchAsync(async (req, res, next) => {
    res.status(200).json({
        status: 'success', data: [{DisplayName: "Celestial Objects", id: "celestialobjects"}, {
            DisplayName: "Events", id: "events"
        }, {DisplayName: "Missions", id: "missions"}]
    });
});

exports.getCategoryContent = catchAsync(async (req, res, next) => {
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
        status: 'success', data: [{DisplayName: "Planets", id: "Planet"}, {DisplayName: "Stars", id: "Star"}, {
            DisplayName: "Moon", id: "Moon"
        }, {DisplayName: "Asteroids", id: "Asteroid"}, {
            DisplayName: "Dwarf Planets", id: "Dwarf%20Planet"
        }, {DisplayName: "Galaxies", id: "galaxies"}]
    });
}

const getEvents = catchAsync((req, res, next) => {

    res.status(200).json({
        status: "success", data: [{
            DisplayName: "Big Bang",
            subHeading: "Approximately 13.8 billion years ago",
            image: "https://firebasestorage.googleapis.com/v0/b/space-odyssey-28b84.appspot.com/o/bigBang.jpg?alt=media&token=842dd578-e27b-477b-a94c-e7d106cdb3e2",
            id: "Big_Bang"
        }, {
            DisplayName: "Formation of the First Stars",
            subHeading: "Approximately 100-400 million years after the Big Bang",
            image: "https://firebasestorage.googleapis.com/v0/b/space-odyssey-28b84.appspot.com/o/steelarPopulation.jpg?alt=media&token=88b1a459-0a91-47c2-af0a-1f204c711ea7",
            id: "Stellar_population"
        }, {
            DisplayName: "Supernova Explosions",
            subHeading: "Ongoing",
            image: "https://firebasestorage.googleapis.com/v0/b/space-odyssey-28b84.appspot.com/o/supernova.jpg?alt=media&token=516d000e-b52c-43b1-9f08-9dc7414f9503",
            id: "Supernova"
        }, {
            DisplayName: "Formation of Galaxies",
            subHeading: "Approximately 1 billion years after the Big Bang",
            image: "https://firebasestorage.googleapis.com/v0/b/space-odyssey-28b84.appspot.com/o/Hubble_Tuning_Fork_diagram.jpg?alt=media&token=bd26af18-0e6f-4c51-b2dc-f5e7a17259cb",
            id: "Galaxy_formation_and_evolution"
        }, {
            DisplayName: "Cosmic Microwave Background",
            subHeading: "CMB",
            image: "https://firebasestorage.googleapis.com/v0/b/space-odyssey-28b84.appspot.com/o/Ilc_9yr_moll4096.png?alt=media&token=522d0456-a3d0-499b-a915-d91ffc7b23b6",
            id: "Cosmic_microwave_background"
        }, {
            DisplayName: "Formation of Planets and Solar Systems ",
            subHeading: "Ongoing",
            image: "https://firebasestorage.googleapis.com/v0/b/space-odyssey-28b84.appspot.com/o/formationOfSolarSystem.jpg?alt=media&token=92b9e6b8-bd05-49d6-9639-afa5ae5da773",
            id: "Formation_and_evolution_of_the_Solar_System"
        }, {
            DisplayName: "Dark Energy Acceleration ",
            subHeading: "Approximately 5 billion years ago",
            image: "https://firebasestorage.googleapis.com/v0/b/space-odyssey-28b84.appspot.com/o/Lambda-Cold_Dark_Matter%2C_Accelerated_Expansion_of_the_Universe%2C_Big_Bang-Inflation.jpg?alt=media&token=0a8867ce-c53c-47a6-b18b-df9d69d32cf9",
            id: "Accelerating_expansion_of_the_universe"
        }, {
            DisplayName: "Formation of Black Holes and Quasars",
            subHeading: "Throughout cosmic history",
            image: "https://firebasestorage.googleapis.com/v0/b/space-odyssey-28b84.appspot.com/o/Quasar.jpg?alt=media&token=6030e797-4bd4-4368-9f9d-3c6aaac6f62b",
            id: "Quasar"
        }, {
            DisplayName: "Merger of Galaxies",
            subHeading: "Ongoing",
            image: "https://firebasestorage.googleapis.com/v0/b/space-odyssey-28b84.appspot.com/o/galacticMerger.jpg?alt=media&token=0b3217d5-9bb8-4f72-a129-299057e9d567",
            id: "Interacting_galaxy"
        }]
    });

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
        status: 'success', data: [{englishName: "Milky Way", id: "Milky_Way"}, {
            englishName: "Andromeda Galaxy (M31)", id: "Andromeda_Galaxy"
        }, {englishName: "Triangulum Galaxy (M33)", id: "Triangulum_Galaxy"}, {
            englishName: "Messier 87 (M87)", id: "Messier_87"
        }, {englishName: "Whirlpool Galaxy (M51)", id: "Whirlpool_Galaxy"}, {
            englishName: "Sombrero Galaxy (M104)", id: "Sombrero_Galaxy"
        }, {
            englishName: "Large Magellanic Cloud (LMC)", id: "Large_Magellanic_Cloud"
        }, {
            englishName: "Small Magellanic Cloud (SMC):", id: "Small_Magellanic_Cloud"
        }, {englishName: "Pinwheel Galaxy", id: "Pinwheel_Galaxy"}, {
            englishName: "Triangulum Galaxy", id: "Triangulum_Galaxy "
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
    });

});


exports.getBody = catchAsync(async (req, res, next) => {
    const coC = req.params.coC;

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

exports.getBodyData = async (req, res, next) => {
    const coC = req.params.coC;
    const body = req.params.body || req.params.event;

    //get facts
    const options = {
        method: 'GET', url: 'https://wiki-briefs.p.rapidapi.com/search', params: {
            q: `${body}`, topk: '5'
        }, headers: {
            'X-RapidAPI-Key': process.env.RAPID_KEY, 'X-RapidAPI-Host': 'wiki-briefs.p.rapidapi.com'
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
    if (coC && coC !== "galaxies") {
        let response = await axios.get(`https://api.le-systeme-solaire.net/rest/bodies/${body}`);
        physicalData = response.data;
    }

    res.status(200).json({
        status: "success", data: {
            image: image, info: info, facts: facts, physicalData: physicalData
        }
    })
};

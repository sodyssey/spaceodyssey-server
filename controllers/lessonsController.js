const AppError = require("../util/appError");
const axios = require('axios');
const catchAsync = require("../util/catchAsync");

exports.getCategories = catchAsync(async (req, res, next) => {
    const response = await axios.get("https://api.le-systeme-solaire.net/rest/knowncount");

    const data = response.data;
    const toReturn = [];

    for (const el of data.knowncount) {
        const toAdd = {};
        toAdd.id = el.id;
        toAdd.count = el.knownCount;
        toReturn.push(toAdd);
    }

    res.status(200).json({
        status: "success",
        data: toReturn
    })
});

exports.getCategoryContent = catchAsync(async (req, res, next) => {
    const category = req.params.category;
    const page = req.query.page * 1 || 1;

    const response = await axios.get(`https://api.le-systeme-solaire.net/rest/bodies/?data=englishName,id&filter[]=bodyType,eq,${category}&order=englishName&page=${page}`);

    const data = response.data;

    res.status(200).json({
        status: "success",
        data: data.bodies
    })
});

exports.getBodyData = catchAsync(async (req, res, next) => {
    const category = req.params.category;
    const body = req.params.body;

    let response = await axios.get(`https://api.le-systeme-solaire.net/rest/bodies/${body}`);
    const physicalData = response.data;

    response = await axios.get(`https://en.wikipedia.org/w/api.php?action=query&prop=extracts|pageimages&exintro=1&explaintext=1&continue=&format=json&formatversion=2&pithumbsize=500&titles=${body}`)
    const jsonData = await response.data;
    const dataFromWiki = Object.values(jsonData.query.pages)[0];
    const info = dataFromWiki.extract;
    const image = dataFromWiki.thumbnail?.source;


    res.status(200).json({
        status: "success",
        data: {
            image: image,
            info: info,
            physicalData: physicalData
        }
    })


});
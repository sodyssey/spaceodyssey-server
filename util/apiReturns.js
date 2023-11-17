const axios = require("axios");

exports.wikiBriefs = async (q, topk) => {
    const options = {
        method: 'GET', url: 'https://wiki-briefs.p.rapidapi.com/search', params: {
            q: `${q}`, topk: `${topk}`
        }, headers: {
            'X-RapidAPI-Key': process.env.RAPID_KEY, 'X-RapidAPI-Host': 'wiki-briefs.p.rapidapi.com'
        }
    };

    return await axios.request(options);
};

exports.getWikiExtracts = async (title) => {
    return await axios.get(`https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&explaintext=1&titles=${title}&continue=&format=json&formatversion=2`)
};

exports.getCelestialPhysicalData = async (body) => {
    //todo: format physical data to include units
    //todo: also return definitions ?
    return await axios.get(`https://api.le-systeme-solaire.net/rest/bodies/${body}`);
};

exports.getPeopleInISS = async (req,res,next)=>{
    return await axios.get('http://api.open-notify.org/astros.json');
}
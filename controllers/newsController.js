const axios = require('axios');
const catchAsync = require("../util/catchAsync");
const authControlelr = require("./authController");

const ENTRIES_PER_PAGE = 10;

const newsImages = {
    "NASA": "https://firebasestorage.googleapis.com/v0/b/space-odyssey-28b84.appspot.com/o/space%20agencies%2Fnasa-6.svg?alt=media&token=baa933c4-90b2-45d3-9b90-6dc0d2174f08",
    "ESA": "https://firebasestorage.googleapis.com/v0/b/space-odyssey-28b84.appspot.com/o/space%20agencies%2Fesa.svg?alt=media&token=0f70da86-1b6b-4801-b342-59faf13db44b",
    "Roscosmos": "https://firebasestorage.googleapis.com/v0/b/space-odyssey-28b84.appspot.com/o/space%20agencies%2Froscosmos-logo-ru.svg?alt=media&token=bf9bf082-b4f7-41c3-8525-269bad09053e",
    "CNSA": "https://firebasestorage.googleapis.com/v0/b/space-odyssey-28b84.appspot.com/o/space%20agencies%2Fcnsa.png?alt=media&token=0f9b824f-afa5-4783-96cf-9266bfd26760",
    "ISRO": "https://firebasestorage.googleapis.com/v0/b/space-odyssey-28b84.appspot.com/o/space%20agencies%2Fisro.png?alt=media&token=f15096fd-368f-45bb-8851-718ae526164e",
    "JAXA": "https://firebasestorage.googleapis.com/v0/b/space-odyssey-28b84.appspot.com/o/space%20agencies%2Fjaxa-logo.svg?alt=media&token=3a959930-7877-4635-94ad-500df2a735e8",
    "CSA": "https://firebasestorage.googleapis.com/v0/b/space-odyssey-28b84.appspot.com/o/space%20agencies%2Fcsa.png?alt=media&token=9d7c95b7-5e07-4cc6-b301-b48e5f15880c",
    "UK Space Agency": "https://firebasestorage.googleapis.com/v0/b/space-odyssey-28b84.appspot.com/o/space%20agencies%2FUKSA_logo_RGB_60pc.jpg?alt=media&token=640044cb-df46-4f89-951b-9271a58754f0",
    "ASAL": "https://firebasestorage.googleapis.com/v0/b/space-odyssey-28b84.appspot.com/o/space%20agencies%2Fasal.jpg?alt=media&token=a51280c6-372d-488a-852d-e4c353848d12",
    "CONAE": "https://firebasestorage.googleapis.com/v0/b/space-odyssey-28b84.appspot.com/o/space%20agencies%2Fconae.png?alt=media&token=517a2053-c1d0-4b9b-b2a7-211eb4f9ea84",
    "ISA": "https://firebasestorage.googleapis.com/v0/b/space-odyssey-28b84.appspot.com/o/space%20agencies%2FISA.png?alt=media&token=72028572-add5-40d1-a2d0-6e2e42c01fdc",
    "KARI": "https://firebasestorage.googleapis.com/v0/b/space-odyssey-28b84.appspot.com/o/space%20agencies%2Fkari.png?alt=media&token=3639f58c-9774-41b1-b371-449c610f4698",
    "UAE Space Agency": "https://firebasestorage.googleapis.com/v0/b/space-odyssey-28b84.appspot.com/o/space%20agencies%2Fuaesa.png?alt=media&token=2bbc2257-8cb2-4734-8b48-4ea1afb55d89",
    "Israel Space Agency": "https://firebasestorage.googleapis.com/v0/b/space-odyssey-28b84.appspot.com/o/space%20agencies%2FIsrael_Space_Agency_logo.png?alt=media&token=5ac40802-b2e1-48eb-a4c5-9a103bce5b67",
    "NSAU": "https://firebasestorage.googleapis.com/v0/b/space-odyssey-28b84.appspot.com/o/space%20agencies%2Fssau.png?alt=media&token=bbac7552-2a8e-48f6-ba3d-dd0e8d287603"
};
exports.newsImages = newsImages;

//return available newsAgencies to follow
exports.getNewsAgencies = catchAsync((req, res, next) => {
    //we have selected only 5 space agencies
    const agencies = [];

    for (const sa of ["NASA", "ISRO", "ESA", "Roscosmos", "CNSA"]) {
        const toAdd = {};
        toAdd.name = sa;
        toAdd.image = newsImages[sa];
        agencies.push(toAdd);
    }

    res.status(200).json({
        status: 'success', data: {
            agencies: agencies
        }
    })
});

exports.getNews = catchAsync(async (req, res, next) => {
    //adding the user to the request, if there is a user
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        await authControlelr.addUserToRequest(req, res, next);
    }

    const follows = req.user?.follows || [];
    const entriesPerPage = follows.length * ENTRIES_PER_PAGE || ENTRIES_PER_PAGE;
    const offset = req.params.offset * 1 || 0;
    const response = await axios.get(`https://api.spaceflightnewsapi.net/v4/articles/?format=json&limit=${entriesPerPage}&offset=${offset}&ordering=-published_at&summary_contains_one=${follows.join("%2C")}`);
    const data = response.data;
    const toReturn = {};
    toReturn.count = data.count;
    toReturn.length = 0;
    toReturn.tags = follows;
    toReturn.loadMore = offset + entriesPerPage < data.count ? `/news/news/${offset + entriesPerPage}` : null;
    toReturn.news = [];
    for (const news of data.results) {
        const toAdd = {};
        toAdd.id = news.id;
        toAdd.title = news.title;
        toAdd.summary = news.summary;
        toAdd.image = news.image_url;
        toAdd.externalUrl = news.url;
        toAdd.publishedAt = news.published_at;
        toReturn.news.push(toAdd);
    }
    toReturn.length = toReturn.news.length;
    res.status(200).json({
        status: 'success', data: toReturn
    });
});


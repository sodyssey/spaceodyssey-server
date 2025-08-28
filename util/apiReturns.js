const axios = require("axios");

//only keeps allowedFields in obj
const filterObj = (obj, allowedFields) => {
  // console.log(obj)
  // console.log(Object.keys(obj))
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.wikiBriefs = async (q) => {
  const pagesResponse = await axios.get("https://en.wikipedia.org/w/api.php", {
    params: {
      action: "query",
      format: "json",
      formatversion: 2,
      prop: "extracts|pageimages",
      exintro: 1,
      explaintext: 1,
      pithumbsize: 500,
      generator: "search",
      gsrsearch: q,
      gsrlimit: 1, // number of results you want
    },
  });

  // Pages come as an object of id → page, convert to array
  let pages = pagesResponse.data.query?.pages || [];
  return {
    data: pages.map((page) => ({
      id: page.pageid,
      title: page.title,
      summary: page.extract,
      image: page.thumbnail?.source || null,
    }))[0],
  };
};

exports.getWikiExtracts = async (title) => {
  await axios.get(
    `https://en.wikipedia.org/w/api.php?action=query&prop=extracts|pageimages&exintro=1&explaintext=1&continue=&format=json&formatversion=2&pithumbsize=500&titles=${title}`
  );
};

exports.getCelestialPhysicalData = async (body) => {
  const toKeep = {
    semimajorAxis: "km",
    perihelion: "km",
    aphelion: "km",
    eccentricity: "km",
    inclination: "°",
    density: "g.cm<sup>3</sup>",
    gravity: "m.s<sup>-1</sup>",
    escape: "m.s<sup>-1</sup>",
    meanRadius: "km",
    equalRadius: "km",
    polarRadius: "km",
    axialTilt: "°",
    avgTemp: "K",
    moons: "",
    mass: "kg",
    vol: "kg<sup>3</sup>",
    aroundPlanet: "",
    englishName: "",
  };
  const response = await axios.get(
    `https://api.le-systeme-solaire.net/rest/bodies/${body}`
  );
  let data = response.data;
  //api sometime is returning invalid json data
  if (typeof data === "string") {
    data = data.replace(/:,/g, ":null,");
    data = JSON.parse(data);
  }
  data = filterObj(data, Object.keys(toKeep));
  const moons = [];
  for (const moon of data.moons || []) {
    moons.push(moon.moon);
  }
  data.moons = moons.length > 0 ? moons : undefined;
  data.aroundPlanet = data.aroundPlanet?.planet || undefined;
  data.mass =
    data.mass &&
    `${data.mass?.massValue}×10<sup>${data.mass?.massExponent}</sup>`;
  data.vol =
    data.vol && `${data.vol?.volValue}×10<sup>${data.vol?.volExponent}</sup>`;
  for (const property of Object.keys(data)) {
    data[property] = data[property]
      ? `${data[property]} ${toKeep[property]}`
      : undefined;
  }
  response.data = data;
  return response;
};

// exports.getPeopleInISS = async () => {
//   return await axios.get("http://api.open-notify.org/astros.json");
// };

// modifying code because the http api call gets sent as https and the open-notify api stopped supporting https.
// Fix: forcing request as http

exports.getPeopleInISS = async () => {
  const http = require("http");
  const dns = require("dns");

  const httpAgent = new http.Agent({
    keepAlive: true,
    // Force IPv4 to avoid some DNS/IPv6 edge cases behind proxies/VPNs
    lookup: (hostname, options, cb) => dns.lookup(hostname, { family: 4 }, cb),
  });

  try {
    // Primary: HTTP-only API. Bypass env proxies for this call.
    const res = await axios.get("http://api.open-notify.org/astros.json", {
      timeout: 10000,
      proxy: false, // <— key change
      httpAgent,
      maxRedirects: 0,
      validateStatus: (s) => s >= 200 && s < 300,
    });
    return res;
  } catch (err) {
    // Fallback to an HTTPS source and map to the same shape
    try {
      const fallback = await axios.get(
        "https://www.howmanypeopleareinspacerightnow.com/peopleinspace.json",
        { timeout: 10000 }
      );
      const people = fallback.data?.people || [];
      const data = {
        message: "success",
        number:
          typeof fallback.data?.number === "number"
            ? fallback.data.number
            : people.length,
        people: people.map((p) => ({
          name: p.name,
          craft: p.craft || "ISS",
        })),
      };
      return { data };
    } catch (fallbackErr) {
      const reason = err?.code || err?.message || "unknown network error";
      throw new Error(`getPeopleInISS failed: ${reason}`);
    }
  }
};

exports.getMarsRoverAdditionalData = async () => {
  return [
    {
      rover: "Sojourner (NASA)",
      launch: "December 4, 1996",
      landing: "July 4, 1997",
      duration: "83 days",
    },
    {
      rover: "Spirit (NASA)",
      launch: "June 10, 2003",
      landing: "January 4, 2004",
      duration: "Operated until March 22, 2010",
    },
    {
      rover: "Opportunity (NASA)",
      launch: "July 7, 2003",
      landing: "January 25, 2004",
      duration: "Operated until June 10, 2018",
    },
    {
      rover: "Curiosity (NASA)",
      launch: "November 26, 2011",
      landing: "August 5, 2012",
      duration: "Ongoing Mission",
    },
    {
      rover: "Perseverance (NASA)",
      launch: "July 30, 2020",
      landing: "February 18, 2021",
      duration: "Ongoing Mission",
    },
  ];
};

exports.getMarsImages = async (date) => {
  const response = await axios.get(
    `https://api.nasa.gov/mars-photos/api/v1/rovers/curiosity/photos?earth_date=${date}&api_key=${process.env.NASA_KEY}`
  );
  const photos = response.data.photos;
  const photosToReturn = [];
  for (const photo of photos) {
    const inDatabase = photosToReturn.map((obj) =>
      obj.img_src.split("_").slice(1).join("_")
    );
    const newImageSrc = photo.img_src.split("_").slice(1).join("_");
    if (inDatabase.indexOf(newImageSrc) < 0) {
      const toAdd = {};
      toAdd.id = photo.id;
      toAdd.roverName = photo.rover.name;
      toAdd.camera = photo.camera.full_name;
      toAdd.img_src = photo.img_src;
      photosToReturn.push(toAdd);
    }
  }
  return photosToReturn;
};

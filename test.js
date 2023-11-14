//we are trying to get data from wikipedia api and parse from wikitext to simple text

//get the data in wikitext format
import fetch from "node-fetch";
import wtf from "wikitext-parser";
import cheerio from "cheerio";

async function getData() {
    //get the raw response
    const response = await fetch("https://en.wikipedia.org/w/api.php?action=query&titles=mars&prop=revisions&rvprop=content&format=json");

    //todo: response not ok=> return appropriate res
    console.log(response.ok);

    //parse to json and wikitext
    const jsonData = await response.json();
    var dynamicValue = Object.values(jsonData.query.pages)[0];
    return dynamicValue.revisions[0]["*"];
}


function parseWikitextToHTML(wikitext) {
    const parsed = wtf(wikitext);
    console.log(parsed);
    return parsed.html();
}

function extractTextFromPTags(html) {
    const $ = cheerio.load(html);
    const paragraphs = $('p').map((index, element) => $(element).text()).get();
    return paragraphs.join('\n');
}

// Example usage
const wikitext = await getData();  // Replace with the actual wikitext content
const html = parseWikitextToHTML(wikitext);
const plainText = extractTextFromPTags(html);
console.log(plainText);
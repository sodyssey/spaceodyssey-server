const celestialBodies = [
    { displayName: "Sun", id: "sun" },
    { displayName: "Mercury", id: "mercury" },
    { displayName: "Venus", id: "venus" },
    { displayName: "Earth", id: "earth" },
    { displayName: "Mars", id: "mars" },
    { displayName: "Asteroids", id: "asteroids" },
    { displayName: "Jupiter", id: "jupyter" },
    { displayName: "Saturn", id: "saturn" },
    { displayName: "Uranus", id: "uranus" },
    { displayName: "Neptune", id: "neptune" }
];

celestialBodies.forEach(body => {
    console.log(`case "${body.id}":`);
});
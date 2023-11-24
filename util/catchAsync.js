module.exports = (fn) => {
    return (req, res, next) => fn(req, res, next).catch(next); //catch will call next
};
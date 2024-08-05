const { getUsersByProximity } = require('./nearby.service');
const { rate } = require('./rate.service');

module.exports = {
    getUsersByProximity,
    rate
}
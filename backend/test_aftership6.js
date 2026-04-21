const { AfterShip } = require('aftership');
const aftership = new AfterShip('asat_16bd25430f2844518c2a71fca3ba1ff7');

async function test() {
    try {
        console.log("Getting DHL tracking...");
        let data = await aftership.tracking.getTracking({ tracking_number: "6101150200448615", slug: "dhl" });
        console.log(data.data.tracking);
    } catch (e) {
        console.error(e);
    }
}
test();

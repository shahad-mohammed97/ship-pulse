const { AfterShip } = require('aftership');

const aftership = new AfterShip('asat_16bd25430f2844518c2a71fca3ba1ff7');

async function test() {
    try {
        await aftership.tracking.createTracking({ tracking_number: "1ST06007525845", slug: "royal-mail" });
    } catch (e) {
        console.dir(e, { depth: null });
    }
}

test();

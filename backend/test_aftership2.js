const { AfterShip } = require('aftership');

const aftership = new AfterShip('asat_16bd25430f2844518c2a71fca3ba1ff7');

async function test() {
    try {
        console.log("Testing with pure object { tracking_number: ... }");
        await aftership.tracking.createTracking({ tracking_number: "1ST06007525845", slug: "royal-mail" });
    } catch (e) {
        console.error("Format 3 failed:", e.message);
    }

    try {
        console.log("Testing with body: { tracking_number: ... }");
        await aftership.tracking.createTracking({ body: { tracking_number: "1ST06007525845", slug: "royal-mail" } });
    } catch (e) {
        console.error("Format 4 failed:", e.message);
    }
}

test();

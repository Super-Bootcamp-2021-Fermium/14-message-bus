/* eslint-disable no-unused-vars */
function send(data) {

    const nats = require('nats');
    const client = nats.connect();

    client.on('connect', () => {
        main(data);
    });

    client.on('close', (err) => {
        if (err) {
            console.error(err);
        }
        console.log('connection close');
    });


    function subscriber() {
        let subId1;
        subId1 = client.subscribe('command', (msg, reply, subject, sid) => {
            console.log('sub-1: ', msg);
            client.unsubscribe(subId1);
        });
    }

    function streamer(data) {
        client.publish('command', data);

    }

    function main(data) {
        subscriber();
        streamer(data);
    }
}

module.exports = {
    send,
};
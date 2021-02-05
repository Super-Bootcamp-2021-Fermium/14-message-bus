const mime = require('mime-types');
const { Client } = require('minio');

function randomFileName(mimetype) {
    return (
        new Date().getTime() +
        '-' +
        Math.round(Math.random() * 1000) +
        '.' +
        mime.extension(mimetype)
    );
}

function checkBucket(client, name) {
    client.bucketExists(name, async(err, exists) => {
        if (err) {
            return err;
        }

        if (!exists) {
            await makeBucket(client, name);
        }
    });
}

function makeBucket(client, name) {
    client.makeBucket(name, (err) => {
        if (err) return err;
    });
}

async function saveFile(file, mimetype, fieldname) {
    const client = new Client({
        endPoint: '127.0.0.1',
        port: 9000,
        useSSL: false,
        accessKey: 'user',
        secretKey: 'password',
    });
    const filename = randomFileName(mimetype);

    await checkBucket(client, fieldname);

    return new Promise((resolve, reject) => {
        client.putObject(fieldname, filename, file, (err, etag) => {
            if (err) {
                reject(err);
            }
            resolve(etag);
        });
    });
}

module.exports = {
    saveFile,
};
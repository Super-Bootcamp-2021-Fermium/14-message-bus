const Busboy = require('busboy');
const { Writable } = require('stream');
const { saveFile } = require('../lib/minio');
const { writeTask, updateTask, readTask } = require('./task');
const { send } = require('../nats/index')

async function addTaskService(req, res) {
    const busboy = new Busboy({ headers: req.headers });
    let obj = {};
    let finished = false;

    function abort() {
        req.unpipe(busboy);
        if (!req.aborted) {
            res.statusCode = 413;
            res.end();
        }
    }

    busboy.on('file', async(fieldname, file, filename, encoding, mimetype) => {
        switch (fieldname) {
            case 'attachment':
                saveFile(file, mimetype, fieldname);
                break;
            default:
                {
                    const noop = new Writable({
                        write(chunk, encding, callback) {
                            setImmediate(callback);
                        },
                    });
                    file.pipe(noop);
                }
        }
    });

    busboy.on('field', async(fieldname, val) => {
        obj[`${fieldname}`] = val;

    });

    busboy.on('finish', async() => {
        //finished = true;
        await writeTask(obj);
        res.write('data pekerjaan berhasil disimpan');
        send('Data pekerjaan baru ditambahkan');
        res.end();
    });

    req.on('aborted', abort);
    busboy.on('error', abort);

    req.pipe(busboy);
}

async function finishTaskService(req, res) {
    const busboy = new Busboy({ headers: req.headers });
    let id;

    function abort() {
        req.unpipe(busboy);
        if (!req.aborted) {
            res.statusCode = 413;
            res.end();
        }
    }

    busboy.on('field', async(fieldname, val) => {
        id = val;
    });

    busboy.on('finish', async() => {
        await updateTask({ done: true }, id);
        res.statusCode = 200;
        res.write(`pekerjaan dengan id ${id} berhasil diselesaikan`);
        send(`Pekerjaan dengan id ${id} diupdate menjadi selesai`);
        res.end();
    });

    req.on('aborted', abort);
    busboy.on('error', abort);

    req.pipe(busboy);
}

async function cancelTaskService(req, res) {
    const busboy = new Busboy({ headers: req.headers });
    let id;

    function abort() {
        req.unpipe(busboy);
        if (!req.aborted) {
            res.statusCode = 413;
            res.end();
        }
    }

    busboy.on('field', async(fieldname, val) => {
        id = val;
    });

    busboy.on('finish', async() => {
        await updateTask({ cancel: true }, id);
        res.statusCode = 200;
        res.write(`pekerjaan ${id} telah dibatalkan`);
        send(`Pekerjaan dengan id ${id} diupdate menjadi dibatalkan`);
        res.end();
    });

    req.on('aborted', abort);
    busboy.on('error', abort);
    req.pipe(busboy);
}

async function readTaskService(req, res) {
    const data = await readTask();
    res.setHeader('Content-Type', 'application/json');
    res.write(data);
    res.statusCode = 200;
    res.end();
}

module.exports = {
    addTaskService,
    readTaskService,
    finishTaskService,
    cancelTaskService,
};
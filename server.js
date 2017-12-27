const express = require('express'),
multer = require('multer'),
path = require('path'),
fs = require('fs'),
http = require('http'),
Raven = require('raven'),
miniDumpsPath = path.join(__dirname, 'app-crashes');

const app = express(),
    server = http.createServer(app);

Raven.config('https://8b71cd6f4174477bb676af0180606e95:249b0addee054517982a153247ef9092@sentry.io/226455').install();

app.use(Raven.requestHandler());

const upload = multer({
    dest: miniDumpsPath
}).single('upload_file_minidump');

function handleStackTrace(error, report) {
    if (error){
        console.log(error);
    } else {
        console.log(report);
    }
}

app.post('/desktop/crash-report', upload, function (req, res) {
    req.body.filename = req.file.filename;
    const crashLog = JSON.stringify(req.body, undefined, 2);

    fs.writeFile(req.file.path + '.json', crashLog, function (err) {
        if (err) return console.error('Error saving crash report: ' + err.message);
    });

    var error = new Error();
    error.message ='Orbit Desktop crash on version ' + req.body.packageVersion;

    console.log(error);

    Raven.captureException(error);

    res.end()
});

app.use(Raven.errorHandler());

app.use(function onError(err, req, res) {
    res.statusCode = 500;
    res.end(res.sentry + '\n');
});


server.listen(3000, function() {
    console.log('running on port 3000');
});
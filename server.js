const express = require('express'),
multer = require('multer'),
// bodyParser = require('body-parser'),
path = require('path'),
fs = require('fs'),
http = require('http'),
Raven = require('raven'),
miniDumpsPath = path.join(__dirname, 'app-crashes'),
minidump = require('minidump');

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
        // Raven.captureException(error);
    } else {
        console.log(report);
    }
}

app.post('/desktop/crash-report', upload, function (req, res) {
    // minidump.walkStack(req.file.path, __dirname + '/electron.breakpad.syms', handleStackTrace);

    req.body.filename = req.file.filename;
    const crashLog = JSON.stringify(req.body, undefined, 2);

    fs.writeFile(req.file.path + '.json', crashLog, function (err) {
        if (err) return console.error('Error saving crash report: ' + err.message);
        // console.log('Saved crash report:\n\t' + crashLog);
        // console.log(req.file.path + '.json');
    });
    //TODO: minidump meesturen
    // Raven.context({
    //     extra: {file: req.file}
    // });

    // var error = new Error('Orbit Desktop crash on version ' + req.body.packageVersion);
    var error = new Error();
    error.message ='Orbit Desktop crash on version ' + req.body.packageVersion;
    // error.stacktrace = fs.readFileSync(req.file.path);
    // error.fileName = req.file.path + '.json';
    // const error = {
    //     message: 'Orbit Desktop crash on version ' + crashLog.appVersion,
    //     fileName: req.file.path + '.json'
    // };

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
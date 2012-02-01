var EventEmitter = require('events').EventEmitter;
var emitter = new EventEmitter;

var express = require('express');
var app = express.createServer();

app.use(express.static(__dirname));
app.use(express.bodyParser())

app.post('/stripe-webhook', function(request, response){
	console.log(request.body)
	if (request.body.type === 'charge.succeeded') {
		console.log(request.body.data.object);
		emitter.emit('chargeSucceeded', request.body.data.object);
	}
	response.send('OK');
});

function chargeServer(client, con) {
	con.on('ready', function () {
		if (typeof client['chargeSucceeded'] === 'function') {
			emitter.on('chargeSucceeded', client['chargeSucceeded']);
		}
    });

    con.on('end', function () {
        if (typeof client['chargeSucceeded'] === 'function') {
            emitter.removeListener('chargeSucceeded', client['chargeSucceeded']);
        }
    });
}

app.listen(process.env.PORT || 8080);

// then just pass the server app handle to .listen()!

var dnode = require('dnode');
var server = dnode(chargeServer);
server.listen(app);

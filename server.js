var EventEmitter = require('events').EventEmitter;
var emitter = new EventEmitter;

var express = require('express');
var app = express.createServer();
var stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

app.use(express.static(__dirname));
app.use(express.bodyParser())

app.post('/test-payment', function(request, response){
	stripe.charges.create({
		currency: 'usd',
		amount: Math.floor(request.body.amount*100) || 100,
		description: request.body.description || "",
		card: {
			number: '4242424242424242',
			exp_month: '12',
			exp_year: '2018'
		}
	}, function(err, charge){
		response.send(JSON.stringify(charge));
	})
});

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

console.log("Starting on port: "+process.env.PORT)
app.listen(process.env.PORT || 8080);

// then just pass the server app handle to .listen()!

var dnode = require('dnode');
var server = dnode(chargeServer);
server.listen(app, {"io":{"transports":['xhr-polling'], "polling duration":10}});

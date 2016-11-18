var express = require('express');
var app = express();
var pg = require('pg');
var bodyParser = require('body-parser');
var multer = require('multer');

app.use(bodyParser({limit: '1mb'}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(multer());


app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));

app.set('view engine', 'ejs');


app.get('/', function(req, res) {
	res.render('index', {
		shared: false,
		track_id: 0
	});
});

app.get('/track/:id', function(req, res) {
	res.render('index', {
		shared: true,
		track_id: req.param("id")
	});
});


app.get('/get', function (req, res) {
	pg.connect(process.env.DATABASE_URL, function(err, client, done) {
		if (err) throw (err);
		var id = req.param("id");
		console.log(id);
		client.query('SELECT * FROM track_table where id=$1', [id], function(err, result) {
			done();
			if (err) {
				console.error(err);
				res.send("Error " + err);
			}else{
				if ( result.rows.length > 0 ){
					res.send(result.rows[0].data);
				}else{
					res.send("Error not found");
				}
			}
		});
	});
})


app.post('/post', function (req, res) {
	pg.connect(process.env.DATABASE_URL, function(err, client, done) {
		var data = req.body.data;
		generateID();

		function generateID() {
			var id = Math.random().toString(36).slice(-8);
			client.query('SELECT * FROM track_table where id=$1', [id], function(err, result) {
				done();
				if (err) {
					console.error(err);
					res.send("Error " + err);
				}else{
					if ( result.rows.length > 1 ){
						generateID();
					}else{
						insertData(id);
					}
				}
			});
		}

		function insertData(id) {
			console.log(id)
			client.query('INSERT INTO track_table (id, data) VALUES ($1, $2)', [id, data], function(err, result) {
				done();
				if (err) {
					console.error(err);
					res.send("Error " + err);
				}else{
					res.send({ id: id });
				}
			});
		}
	});
})

app.listen(app.get('port'), function() {
 	console.log("Node app is running at localhost:" + app.get('port'));
});

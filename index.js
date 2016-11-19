var express = require('express');
var app = express();
var pg = require('pg');
var bodyParser = require('body-parser');
var multer = require('multer');

var corser = require("corser");
app.use(corser.create());

app.use(bodyParser.json({ limit:'5mb' }));
app.use(multer());


app.set('port', (process.env.PORT || 5000));


app.get('/', function(req, res) {
	res.send("Trackbox API Sever!");
});


app.get('/get', function (req, res) {
	pg.connect(process.env.DATABASE_URL, function(err, client, done) {
		if (err) throw (err);

		var id = req.param("id");
		getTrack(client, id, function(data){
			res.jsonp(data);
		});
	});
});

app.get('/edit', function (req, res) {
	pg.connect(process.env.DATABASE_URL, function(err, client, done) {
		if (err) throw (err);

		var id = req.param("id");
		getTrackId(client, id, function(track_id){
			if (track_id){
				getTrack(client, track_id, function(data){
					res.jsonp(data);
				});

			}else{
				res.jsonp({ error: "invalid id" });
			}
		});
	});
});


app.post('/post', function (req, res) {
	pg.connect(process.env.DATABASE_URL, function(err, client, done) {
		var data = req.body.data;
		console.log(data);
		
		generateTrackId(client, function (track_id){
			generateEditId(client, function (edit_id) {
				if (!track_id || !edit_id) {
					return res.send("error!");
				}

				insertData(client, track_id, data, function (){
					insertEditId(client, edit_id, track_id, function (){
						res.send({
							id: track_id,
							edit_id: edit_id
						});
					});
				});
			});
		});
	});
})

app.post('/update', function (req, res) {
	pg.connect(process.env.DATABASE_URL, function(err, client, done) {
		if (err) throw (err);

		var id = req.body.id;
		var data = req.body.data;

		getTrackId(client, id, function(track_id){
			if (track_id){
				updateData(client, track_id, data, function(r){
					res.jsnop(r);
				});

			}else{
				res.jsonp({ error: "invalid id" });
			}
		});
	});
});

app.listen(app.get('port'), function() {
 	console.log("Node app is running at " + app.get('port'));
});



//-----------------------------------------------------------------------------
// functions
//-----------------------------------------------------------------------------

function getTrack(client, id, callback) {
	client.query('SELECT * FROM track where id=$1', [id], function(err, result) {
		if (err) {
			console.error(err);
			callback({ error: "Database error:" + err });

		}else{
			if (result.rows.length > 0){
				callback(result.rows[0].data);

			}else{
				callback({ error: "not found" });
			}
		}
	});
}

function getTrackId(client, edit_id, callback) {
	client.query('SELECT * FROM edit where id=$1', [edit_id], function(err, result) {
		if (err) {
			console.error(err);
			callback();

		}else{
			if (result.rows.length > 0){
				callback(result.rows[0].track_id);

			}else{
				callback();
			}
		}
	});
}

function generateTrackId(client, callback) {
	var id = Math.random().toString(36).slice(-9);
	client.query('SELECT * FROM track where id=$1', [id], function(err, result) {
		if (err) {
			console.error(err);
			callback();

		}else{
			if ( result.rows.length > 1 ){
				generateTrackId(client, callback);
			}else{
				callback(id);
			}
		}
	});
}

function generateEditId(client, callback) {
	var id = Math.random().toString(36).slice(-12);
	client.query('SELECT * FROM edit where id=$1', [id], function(err, result) {
		if (err) {
			console.error(err);
			callback();

		}else{
			if ( result.rows.length > 1 ){
				generateEditId(client, callback);
			}else{
				callback(id);
			}
		}
	});
}

function insertData(client, id, data, callback) {
	console.log(id)
	client.query('INSERT INTO track (id, data) VALUES ($1, $2)', [id, data], function(err, result) {
		if (err) {
			console.error(err);
			callback("Error " + err);

		}else{
			callback();
		}
	});
}

function updateData(client, id, data, callback) {
	console.log(id)
	client.query('UPDATE track SET data=$2 WHERE id=$1', [id, data], function(err, result) {
		if (err) {
			console.error(err);
			callback({ error: "Error " + err });

		}else{
			callback({ success: "updated" });
		}
	});
}

function insertEditId(client, id, track_id, callback) {
	console.log(id)
	client.query('INSERT INTO edit (id, track_id) VALUES ($1, $2)', [id, track_id], function(err, result) {
		if (err) {
			console.error(err);
			callback("Error " + err);

		}else{
			callback();
		}
	});
}

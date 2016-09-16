var express = require('express');
var app = express();
var mongoose = require('mongoose');
var request = require('request');
//var url = 'mongodb://localhost:27017/test'; 

////url hidden according to the wiki
var url = process.env.MONGOLAB_URI;
var apiKey = process.env.apiKey;
//https://github.com/FreeCodeCamp/FreeCodeCamp/wiki/Using-MongoDB-And-Deploying-To-Heroku
////SET MONGOLAB_URI="mongodb://username:password@ds01316.mlab.com:1316/food" The quotes are wrong (the correct format is without the quotes)

//console.log(url);
mongoose.connect(url); //mlab db url

var Schema = mongoose.Schema;
var PORT = process.env.PORT || 3000; //for deploying in heroku
var imageSchema = new Schema({ //replace urlData with image
    searchterm: String,
    time:String,
    timestamp:Number
});

var image = mongoose.model('image', imageSchema ); 

function saveData(term, date, timestamp){
        var item = {
        searchterm:term,
        time:date,
        timestamp:timestamp}
        var data = new image(item);
        data.save();
        console.log('data saved');
}

app.get('/api/latest/imagesearch', function(req, res){
   // http://stackoverflow.com/questions/5830513/how-do-i-limit-the-number-of-returned-items
        image.find().sort('timestamp').limit(10)    // sorting the results   
        .then(function(doc){
        res.send( {items:doc}.items.map(function(obj){
            var rObj = {};
            rObj['searchterm'] = obj.searchterm;
            rObj['time'] = obj.time.slice(0,24);
            return rObj;
        }));
});
});


app.get('/api/imagesearch/:querry', function(req,res){
    var querrystr = req.params.querry;   //<-- Attentionhttp://stackoverflow.com/questions/17007997/how-to-access-the-get-parameters-after-in-express
     
    if (offset === undefined){ offset = 0}         // <-- check for undefined 
    if (!isFinite(req.query.offset)){var offset = 0}
    else {
    var offset = Math.floor(Number(req.query.offset));}     //<-- Attention http://expressjs.com/en/api.html#req.query
    
    request('https://pixabay.com/api/?key='+ apiKey + '&q=' + querrystr + '&per_page=200', function (error, response, body) {
    if (!error && response.statusCode == 200) {
        var results  = JSON.parse(body);
        results = results.hits;
      
        results = results.map(function(obj){
            var rObj = {};
            rObj['url'] = obj.webformatURL;
            rObj['snippet'] = obj.tags;
            rObj['thumbnail'] = obj.previewURL;
            rObj['context'] = obj.pageURL;
            return rObj; //200 items
        }); 
        console.log(results.length);
        if (results.length === 0){res.send('There are no results for your search')}
        else if (results.length < 10){res.send(results)}
        else if (offset > (results.length - 11) || offset < 0){res.send('offset can\'t be bigger than ' + (results.length - 11).toString() + ' or less than 0')}
        else{
        results = results.slice(offset,offset+10);
        console.log(results.length);
        res.send(results);}
        console.log(new Date().toString());   
        var adate = new Date().toString();
        var atimestamp = new Date().getTime();
    }
     saveData(querrystr,adate, atimestamp);   
})

});

app.listen(PORT, function(){
    console.log('Express listening on port '+ PORT + '!');
});
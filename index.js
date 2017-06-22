var jsdom = require("jsdom");
var RSS = require('rss');

process.env.TZ = 'America/New_York';

if (process.argv.length < 3) {
    console.log('Add theater ID as argument');
    return;
}

var theaterId = process.argv[2];
var now = new Date();
if (now.getHours() > 20) {
    now.setTime(now.getTime() + 86400000);
}
var month = '' + (now.getMonth() + 1);
if (month.length < 2) {
    month = '0' + month;
}
var dt = '' + now.getDate();
if (dt.length < 2) {
    dt = '0' + dt;
}

jsdom.env(
    'https://www.cinemark.com/umbraco/surface/showtimes/getbytheaterid?theaterId=' + theaterId + '&showDate=' + month + '/' + dt + '/' + now.getFullYear(),
    function(err, window) {
        var details = getDetails(window.document);
        var xml = buildFeed(details);
        console.log(xml);
    }
);

function getDetails(document) {
    var details = [];
    var movieBlocks = document.getElementsByClassName('showtimeMovieBlock');
    var movie;
    for (var x = 0; x < movieBlocks.length; x++) {
        movie = getMovieDetails(movieBlocks[x]);
        if (movie.id) {
            details[movie.id] = movie;
        }
    }

    return details;
}

function getMovieDetails(movieDiv) {
    var s, d, movie = {};
    if (d = movieDiv.getElementsByClassName('movieBlockPoster')[0]) {
        if (s = d.getElementsByTagName('source')[0]) {
            movie.poster = 'https://www.cinemark.com' + s.srcset;
        }
    }

    if (d = movieDiv.getElementsByClassName('movieBlockInfo')[0]) {
        if (s = d.getElementsByTagName('h2')[0]) {
            movie.name = s.innerHTML;
            movie.id = s.id;
        }
    }

    movie.showtimes = {};

    d = movieDiv.getElementsByClassName('showtimePrintType');
    var d2 = movieDiv.getElementsByClassName('showtimeMovieTimes');
    for (var x = 0; x < d.length; x++) {
        movie.showtimes[getTypeName(d[x])] = getTimes(d2[x]);
    }

    return movie;
}

function getTypeName(typeDiv) {
    var typeNames = {};
    var imgs = typeDiv.getElementsByTagName('img');
    for (var x = 0; x < imgs.length; x++) {
        if (imgs[x].className == 'access') {
            continue;
        }
        typeNames[imgs[x].alt] = true;
    }

    var t;
    var h = typeDiv.getElementsByTagName('h4');
    for (x = 0; x < h.length; x++) {
        t = h[x].innerHTML.replace(/^\s+|\s+$/, '');
        if (t) {
            typeNames[t] = true;
        }
    }

    delete typeNames['No Passes'];

    var r = [];
    for (x in typeNames) {
        if (!typeNames.hasOwnProperty(x)) {
            continue;
        }
        r.push(x);
    }

    return r.join(' / ');
}

function getTimes(timesDiv) {
    var times = [];
    var a = timesDiv.getElementsByTagName('a');
    for (var x = 0; x < a.length; x++) {
        times.push(a[x].innerHTML);
    }
    return times;
}

function buildFeed(details) {
    var feed = new RSS({
        title: 'Cinemark Theater ' + theaterId,
        site_url: 'https://www.cinemark.com/theatre-' + theaterId,
    });

    var movie, desc, type, x;

    for (var id in details) {
        if (!details.hasOwnProperty(id)) {
            continue;
        }

        movie = details[id];
        desc = '';

        for (type in movie.showtimes) {
            if (!movie.showtimes.hasOwnProperty(type)) {
                continue;
            }

            desc += (desc ? '<br><br>' : '') + '<b>' + type + '</b><br>';
            for (x = 0; x < movie.showtimes[type].length; x++) {
                desc += (x > 0 ? ' - ' : '') + movie.showtimes[type][x];
            }
        }

        if (movie.poster) {
            desc = '<img src="' + movie.poster + '"><br><br>' + desc;
        }

        feed.item({
            title: movie.name,
            description: desc,
            guid: 'cinemark-rss-theater' + theaterId + '-movie' + id,
        });
    }

    return feed.xml({indent: true});
}
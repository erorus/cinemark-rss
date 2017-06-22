var jsdom = require("jsdom");
var RSS = require('rss');
var async = require('async');
var request = require('request');

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

var RtResponse = function(callback, error, response, body) {
    if (error || response.statusCode != 200 || !body.results) {
        return callback(error, []);
    }
    return callback(error, body.results);
};

var BuildRtRequest = function(type) {
    return function(callback) {
        request({ url: 'https://www.rottentomatoes.com/api/private/v2.0/browse?sortBy=popularity&type=' + type, json: true },
            RtResponse.bind(null, callback));
    }
};

var BuildCinemarkRequest = function(day) {
    var when = new Date(now);

    if (day) {
        when.setTime(when.getTime() + 86400000 * day);
    }

    var month = '' + (when.getMonth() + 1);
    if (month.length < 2) {
        month = '0' + month;
    }
    var dt = '' + when.getDate();
    if (dt.length < 2) {
        dt = '0' + dt;
    }

    return function(callback) {
        jsdom.env(
            'https://www.cinemark.com/umbraco/surface/showtimes/getbytheaterid?theaterId=' + theaterId + '&showDate=' + month + '/' + dt + '/' + when.getFullYear(),
            function(err, window) {
                callback(err, getDetails(window.document));
            }
        );
    }
};

async.parallel([
    BuildRtRequest('in-theaters'),
    BuildRtRequest('opening'),
    BuildCinemarkRequest(0),
    BuildCinemarkRequest(1)
], function(err, results) {
    var x, k, cine = {};
    for (x = 2; x < results.length; x++) {
        for (k in results[x]) {
            if (!results[x].hasOwnProperty(k)) {
                continue;
            }
            cine[k] = results[x][k];
        }
    }

    var xml = buildFeed(cine, results[0].concat(results[1]));
    console.log(xml);
});

function getDetails(document) {
    var details = {};
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

function buildFeed(cinemark, rtResults) {
    var feed = new RSS({
        title: 'Cinemark Theater ' + theaterId,
        site_url: 'https://www.cinemark.com/theatre-' + theaterId,
    });

    var movie, desc, type, x, rt;

    for (var id in cinemark) {
        if (!cinemark.hasOwnProperty(id)) {
            continue;
        }

        movie = cinemark[id];
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

        rt = findRtRecord(movie.name, rtResults);

        if (rt !== false) {
            desc += '<br><br><a href="https://www.rottentomatoes.com' + rt.url + '">Rotten Tomatoes</a>: ';
            desc += ((rt.hasOwnProperty('tomatoScore') && rt.tomatoScore != null) ? rt.tomatoScore + '% - ' : '') + rt.synopsis;
        }

        feed.item({
            title: movie.name,
            description: desc,
            guid: 'cinemark-rss-theater' + theaterId + '-movie' + id,
        });
    }

    return feed.xml({indent: true});
}

function findRtRecord(name, rt) {
    var candidates = [];
    name = name.toLowerCase()
        .replace(/\([^\)]*subtitle[^\)]*\)/g, '')
        .replace(/[^a-z0-9 ]/g, '')
        .replace(/ {2,}/g, ' ')
        .replace(/^ | $/g, '');

    for (var x = 0; x < rt.length; x++) {
        if (!rt[x].cinemarkTitle) {
            rt[x].cinemarkTitle = rt[x].title.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/ {2,}/g, ' ').replace(/^ | $/g, '');
        }

        if (rt[x].cinemarkTitle.indexOf(name) == 0 || name.indexOf(rt[x].cinemarkTitle) == 0) {
            candidates.push(rt[x]);
        }
    }

    candidates.sort(function(a,b){
        return b.cinemarkTitle.length - a.cinemarkTitle.length;
    });

    if (candidates.length) {
        return candidates.shift();
    }

    return false;
}
//change these variables to the domain to parse and the output file name to write.
var website = "http://www.handletheheat.com/";
var outfileName = "handletheheat";

//import the modules
var Crawler = require('crawler');
var readline = require('readline');
var fs = require('fs');
var csv = require('fast-csv');

//create a csv stream and a fs stream, then connect fs and csv with pipe.
var csvStream = csv.createWriteStream({headers: true});
var writableStream = fs.createWriteStream(outfileName + '.csv');
csvStream.pipe(writableStream);

var urlin = website;
//regex to match urls for html and check if they are in the given domain.
var reg = new RegExp("^http:\/\/(www.)?" + website.split('/')[2] + ".*(\/|(\/\?.*=[0-9]*))$");
//to leave out comments and replies
var regComment = new RegExp(".*#(comment|respond).*");
//to filter out pages, add a regex check:
//var regPage = new RegExp(".*/page/.*");

//this will contain all the urls that are in the website
var urls = [];


//checks if a page has a YouTube video in it, if it does writes title and url to the specified csv file.
function checkYouTube($, title, url) {
  if ($('p>iframe').length > 0) {
  	//specify the column names and write data to csv file
    csvStream.write({title: title, url: url});
  }
}

//crawls through every page in the website
var c = new Crawler({
	maxConnections : 10,
	//onDrain called when nothing left in queue, so just exit the function
	onDrain : function() {
        process.exit();
    },

	//called for each page
	callback : function(error, result, $) {
		//check if there's an error
		if(!error) {
			//if we have a result
			if (result) {
				//$ is already in Cheerio
				//get page title
				var title = $('title').text();
				//get the current page url
				var url = result.uri;
				//check if the page has a YouTube video in it
				checkYouTube($, title, url);
			}

			//get all the links in the page and queue them into the crawler
			//keep track of the checked URLs in urls, so that we check every page once
			$('a').each(function(index, element) {
				var queueURL = $(element).attr('href');
				//check if url matches the domain and is html, and to see if we have already visited it
				if (!regComment.test(queueURL) && reg.test(queueURL) && (urls.indexOf(queueURL) == -1)) {
					urls.push(queueURL);
					c.queue(queueURL);
				}
			});
		}
		//if there's an error exit.
		else {
			process.exit();
		}
	}
});

//start crawling throught the website
urls.push(urlin);
c.queue(urlin);

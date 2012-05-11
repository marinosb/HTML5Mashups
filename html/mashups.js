/*
*	Marinos Bernitsas bernitsas.com
*/

var db = openDatabase('mashupsdb', '1.0', 'my first database', 2 * 1024 * 1024);
var requests=0;
var numOfflines=0;

if(!db) alert("null db");

function addSampleFeeds()
{
	var feed="http://www.nytimes.com/services/xml/rss/nyt/HomePage.xml";
	  var li = document.createElement('li');

	    li.innerHTML = feed;

	  var ul = drop.getElementsByTagName('ul')[0];

	db.transaction(function (tx) {
	  tx.executeSql('CREATE TABLE IF NOT EXISTS feeds (id INTEGER PRIMARY KEY, url TEXT)');
	  tx.executeSql('INSERT INTO feeds (id,url) VALUES (null,?)',[feed], showFeeds());
	});

	    updateCache();
}

function showFeeds()
{
	var drop=document.getElementById('drop');
	drop.innerHTML="<ul></ul>";
	db.transaction(function (tx) {
	  	tx.executeSql('SELECT * FROM feeds ORDER BY id ASC', [], function (tx, results) {
		  var len = results.rows.length, i;
		  for (i = 0; i < len; i++) {

			var li = document.createElement('li');

				var feed='<a onclick="javascript:removeFeed('+results.rows.item(i).id+')"><img src="delete.png"/> </a>'+results.rows.item(i).url;
			    li.innerHTML = feed;

			drop.getElementsByTagName('ul')[0].appendChild(li);
		  }
		});
	});
}


function dropTables()
{
	db.transaction(function (tx) {
		tx.executeSql('DROP TABLE IF EXISTS articles');
	  	tx.executeSql('DROP TABLE IF EXISTS feeds');
	  	
	});
	showFeeds();
	showArticles();
}

function dropArticles()
{
	db.transaction(function (tx) {
		tx.executeSql('DROP TABLE IF EXISTS articles');
	  	
	});
}

function removeFeed(id)
{
	db.transaction(function (tx) {
		tx.executeSql('DROP TABLE IF EXISTS articles');
		
	  	tx.executeSql('DELETE FROM feeds WHERE id=?', [id], function (tx, results) {
		  //alert("table dropped");
		showFeeds();
		  
		});
	});
	
	updateCache();
}

function updateCache()
{
	document.getElementById('loading').style.display='block';
	document.getElementById('offline').style.display='none';
	numOfflines=0;
	
	db.transaction(function (tx) {
		//tx.executeSql('DROP TABLE IF EXISTS articles');
	  	tx.executeSql('SELECT * FROM feeds ORDER BY id ASC', [], function (tx, results) {
		  var len = results.rows.length, i;
		if(len==0)
		{ 
			document.getElementById('loading').style.display='none';
			document.getElementById("contents").innerHTML='';
		}
		  for (i = 0; i < len; i++) {
			requests++;
			getFeed(results.rows.item(i).url);
		  }
		},
		function err(){document.getElementById('loading').style.display='none';});
	});
	
	
}

function addArticle(date, title, link, feedtitle)
{
	//alert("inserting "+date+" : "+title);
	db.transaction(function (tx) {
	  tx.executeSql('CREATE TABLE IF NOT EXISTS articles (id INTEGER PRIMARY KEY, date INTEGER UNIQUE , title TEXT, link TEXT, feedtitle TEXT)');
	  tx.executeSql('INSERT INTO articles (id,date,title,link,feedtitle) VALUES (null,?,?,?,?)',[date,title,link,feedtitle] );
	});
}

function showArticles()
{
	var contents = document.getElementById("contents");
   contents.innerHTML='';
	db.transaction(function (tx) {
	  	tx.executeSql('SELECT * FROM articles ORDER BY date DESC', [], function (tx, results) {
		  var len = results.rows.length, i;
		  for (i = 0; i < len; i++) {
			var date=new Date(results.rows.item(i).date);
			var title=results.rows.item(i).title;
			var link=results.rows.item(i).link;
			var feedtitle=results.rows.item(i).feedtitle;
			
			var listItem = document.createElement("p");
			
		     listItem.innerHTML=(date.toLocaleDateString()+'@'+date.toLocaleTimeString()+': <a href="'+link+'">'+title+'</a> ('+feedtitle+')');
		     contents.appendChild(listItem);
		
		  }
		});
	});
}







function cancel(e) {
  if (e.preventDefault) e.preventDefault(); // required by FF + Safari
  e.dataTransfer.dropEffect = 'copy'; // tells the browser what drop effect is allowed here
  return false; // required by IE
}

function entities(s) {
  var e = {
    '"' : '"',
    '&' : '&',
    '<' : '<',
    '>' : '>'
  };
  return s.replace(/["&<>]/g, function (m) {
    return e[m];
  });
}


// Tells the browser that we *can* drop on this target
addEvent(drop, 'dragenter', cancel);

addEvent(drop, 'dragover', function (e) {
    if (e.preventDefault) e.preventDefault(); // allows us to drop
    this.className = 'over';
    e.dataTransfer.dropEffect = 'copy';
    return false;
  });

addEvent(drop, 'dragleave', function () {
    this.className = '';
  });


addEvent(drop, 'drop', function (e) {
  if (e.preventDefault) e.preventDefault(); // stops the browser from redirecting off to the text.

  
  var li = document.createElement('li');
  
	//grab the url for images etc
	var feed=feed=e.dataTransfer.getData('url');
	
	//grab the pure text
	if(!feed) feed=e.dataTransfer.getData('Text');
	
	drop.className = '';
	
	if(!feed.match('^http://')) return false;
    
	li.innerHTML = feed;
  
  var ul = drop.getElementsByTagName('ul')[0];


db.transaction(function (tx) {
  tx.executeSql('CREATE TABLE IF NOT EXISTS feeds (id INTEGER PRIMARY KEY, url TEXT)');
  tx.executeSql('INSERT INTO feeds (id,url) VALUES (null,?)',[feed], showFeeds());
});
 
    updateCache();


	
  return false;
});


function getFeed(url) {

 var req = newXMLHttpRequest();

 req.onreadystatechange = getReadyStateHandler(req, updateFeed);

 req.open("GET", "http://bernitsas.com/dev/mashups/proxy.php?url="+url, true);
 req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
 req.send();
}


/*
 * Update shopping-cart area of page to reflect contents of cart
 * described in XML document.
 */
function updateFeed(feedXML) {
		
	if(feedXML)
	{
		var feedTitle=feedXML.getElementsByTagName("channel")[0].getElementsByTagName("title")[0].firstChild.nodeValue;

	   var contents = document.getElementById("contents");
	   contents.innerHTML = "";

	   var items = feedXML.getElementsByTagName("item");

	   for (var I = 0 ; I < items.length ; I++) {

	     var title = items[I].getElementsByTagName("title")[0].firstChild.nodeValue;

	     var date = items[I].getElementsByTagName("pubDate")[0].firstChild.nodeValue;

	     var link = items[I].getElementsByTagName("link")[0].firstChild.nodeValue;

		date=Date.parse(date);

		addArticle(date, title, link, feedTitle);

	   }
	}
	else alert("one of the feeds was not rss");
	
	--requests;
	
	if(requests==0)
	{
		showArticles();
		document.getElementById('loading').style.display='none';
	 
	}
	
 }

function handleAjaxError(message)
{
	--requests;
	++numOfflines;
	//alert("One of your feeds could not be accessed. Using cached copy instead."+message);
	document.getElementById('offline').innerHTML=numOfflines+" of your feeds could not get updated";
	document.getElementById('offline').style.display='block';
	
	if(requests==0)
	{
		showArticles();
		document.getElementById('loading').style.display='none';
	 
	}
}


showFeeds();
updateCache();

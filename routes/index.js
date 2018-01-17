var express = require('express');
var router = express.Router();
var config = require('../config');
const bookSearch = require('../bookSearch');

/* GET home page. */
router.get('/', function(req, res, next) {
  bookSearch.getBook(config.featuredBook.ISBN, function(featured) {
    res.render('index', { 
      pageTitle: 'Look up how long it will take to read any book in the world',
      title: 'Reading Length',
      description: 'Find out how long it will take you to read any book based on the book\'s wordcount and your reading speed (WPM) using our simple search engine.',
      ref: config.amazonAPI.associatesTag,
      FeaturedMonth: config.featuredBook.month,
      FeaturedTitle: featured.Title,
      FeaturedImage: featured.Image,
      FeaturedISBN: featured.ISBN,
      FeaturedWordcount: featured.Wordcount.toLocaleString()
    });
  });
});

/* POST book search page */
router.post('/book-search', function(req, res, next) {
  var searchQuery = req.sanitize(req.body.query);
  bookSearch.search(searchQuery, function(results) {
    //res.send(results);
    if (results == 0) {
      res.status(404).redirect('/404');
    } else {
      res.redirect('/book/isbn-' + results + '/');
    };
  });
});

router.get('/book/isbn-404', function(req, res, next) { //Bad design decisions
  res.status(404).redirect('/404');
})

/* GET books page (\\d{9}[\\d|X]$)*/
router.get('/book/isbn-:urlISBN/?', function(req, res, next) {
  var ISBN = req.params['urlISBN'];
  bookSearch.getBook(config.featuredBook.ISBN, function(featured) {
    bookSearch.getBook(ISBN.toUpperCase(), function(results) { //toUpperCase bc X at the end needs to be capitalized
      if (results == null) {
        res.redirect('/404');
      } else {
        //res.status(200).send(results); //JSON
        //bookSearch.getBookPrice(ISBN, function(price) {
          var WPM = config.wordsPerMinuteReading;
          var estMin = (results.Wordcount / WPM);
          var avgEstHr = Math.floor(estMin / 60);
          var avgEstMin = Math.floor(estMin - (avgEstHr * 60));
          switch (results.Accuracy) { 
            case 'Verified':
              var dot = 'dot dot-success';
              break;
            case 'Estimate':
              var dot = 'dot dot-warning';
              break;
            default:
              var dot = 'dot dot-danger';
          }
          if (results.Pages > 0) {
            var PagesC = results.Pages.toLocaleString();
          } else {
            var PagesC = 'Unknown page count';
          }
          if (results.Wordcount > 0) {
            var WordcountC = results.Wordcount.toLocaleString();
          } else {
            var WordcountC = 'Unknown number of';
          }
          var fWordcountC = featured.Wordcount.toLocaleString();
          if (results.Description != null) {
            var Description = results.Description.replace(/<(?:.|\n)*?>/gm, '');
          } else {
            var Description = 'Sorry, no description found.';
          }
          res.render('books', {
            pageTitle: results.Title,
            description: "The average reader will take " + avgEstHr + " hours, " + avgEstMin + " minutes to read " + results.Title + " at a speed of 250 WPM. Estimated " + results.Wordcount + " words in " + results.Pages + " pages. Find out how long it will take you to read it!",
            avgEstHr: avgEstHr,
            avgEstMin: avgEstMin,
            WPM: WPM,
            ref: config.amazonAPI.associatesTag,
            ISBN: results.ISBN,
            Title: results.Title,
            Author: results.Author,
            //MSRP: results.MSRP,
            Pages: PagesC,
            Wordcount: WordcountC,
            Dot: dot,
            Accuracy: results.Accuracy,
            AccuracyDesc: results.AccuracyDesc,
            ReleaseDate: results.ReleaseDate,
            Sim1ISBN: results.Sim1ISBN, 
            Sim1Title: results.Sim1Title,
            Sim2ISBN: results.Sim2ISBN,
            Sim2Title: results.Sim2Title,
            Sim3ISBN: results.Sim3ISBN,
            Sim3Title: results.Sim3Title,
            Image: results.Image,
            Description: Description,
            //Price: price,
            FeaturedMonth: config.featuredBook.month,
            FeaturedTitle: featured.Title,
            FeaturedImage: featured.Image,
            FeaturedISBN: featured.ISBN,
            FeaturedWordcount: fWordcountC,
            adsDiv: config.responsiveAdId,
            adsSrc: config.responsiveAdSrc
          //});
        });
      };
    });
  });
});

/* GET wpm page */
router.get('/wpm', function(req, res, next) {
  bookSearch.getBook(config.featuredBook.ISBN, function(featured) {
    res.render('wpm', {
      pageTitle: 'Words Per Minute (WPM) Calculators',
      description: 'Find your reading speed in words per minute using any of the following texts. Try to select the reading level that corresponds to the category of book you will be reading.',
      FeaturedMonth: config.featuredBook.month,
      ref: config.amazonAPI.associatesTag,
      FeaturedTitle: featured.Title,
      FeaturedImage: featured.Image,
      FeaturedISBN: featured.ISBN,
      FeaturedWordcount: featured.Wordcount.toLocaleString()
    });
  });
});

/* Get wpm ttopr page */
router.get('/wpm/ttopr', function(req, res, next) {
  bookSearch.getBook(config.featuredBook.ISBN, function(featured) {
    res.render('wpmttopr', {
      pageTitle: 'WPM Calculator for Elementary Text',
      description: '',
      ref: config.amazonAPI.associatesTag,
      FeaturedMonth: config.featuredBook.month,
      FeaturedTitle: featured.Title,
      FeaturedImage: featured.Image,
      FeaturedISBN: featured.ISBN,
      FeaturedWordcount: featured.Wordcount.toLocaleString()
    });
  });
});

/* Get wpm tpodg page */
router.get('/wpm/tpodg', function(req, res, next) {
  bookSearch.getBook(config.featuredBook.ISBN, function(featured) {
    res.render('wpmtpodg', {
      pageTitle: 'WPM Calculator for High School Text',
      description: '',
      ref: config.amazonAPI.associatesTag,
      FeaturedMonth: config.featuredBook.month,
      FeaturedTitle: featured.Title,
      FeaturedImage: featured.Image,
      FeaturedISBN: featured.ISBN,
      FeaturedWordcount: featured.Wordcount.toLocaleString()
    });
  });
});

/* Get wpm atotc page */
router.get('/wpm/atotc', function(req, res, next) {
  bookSearch.getBook(config.featuredBook.ISBN, function(featured) {
    res.render('wpmatotc', {
      pageTitle: 'WPM Calculator for College Text',
      description: '',
      ref: config.amazonAPI.associatesTag,
      FeaturedMonth: config.featuredBook.month,
      FeaturedTitle: featured.Title,
      FeaturedImage: featured.Image,
      FeaturedISBN: featured.ISBN,
      FeaturedWordcount: featured.Wordcount.toLocaleString()
    });
  });
});

/* GET about page */
router.get('/about', function(req, res, next) {
  bookSearch.getBook(config.featuredBook.ISBN, function(featured) {
    res.render('about', {
      pageTitle: 'About the site',
      description: 'Reading Length is a website where you can find estimates of the word count for any book in the world, and see how long it will take you to read.',
      ref: config.amazonAPI.associatesTag,
      FeaturedMonth: config.featuredBook.month,
      FeaturedTitle: featured.Title,
      FeaturedImage: featured.Image,
      FeaturedISBN: featured.ISBN,
      FeaturedWordcount: featured.Wordcount.toLocaleString()
    });
  });
});

/*404 Handling*/
router.get('/404', function(req, res, next) {
  bookSearch.getBook(config.featuredBook.ISBN, function(featured) {
    res.status(404).render('404', {
      pageTitle: '404 Not Found',
      description: 'The page you were looking for was not found',
      ref: config.amazonAPI.associatesTag,
      FeaturedMonth: config.featuredBook.month,
      FeaturedTitle: featured.Title,
      FeaturedImage: featured.Image,
      FeaturedISBN: featured.ISBN,
      FeaturedWordcount: featured.Wordcount.toLocaleString()
    });
  });
});

router.get('*', function(req, res, next) {
  res.status(404).redirect('/404');
});



module.exports = router;

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
      res.redirect('/404');
    } else {
      res.redirect('/book/isbn-' + results + '/');
    };
  });
});

/* GET books page */
router.get('/book/isbn-:urlISBN(\\d{9}[\\d|X]$)/', function(req, res, next) {
  var ISBN = req.params['urlISBN'];
  if (ISBN == '404') {
    res.redirect('/404');
  }
  bookSearch.getBook(config.featuredBook.ISBN, function(featured) {
    bookSearch.getBook(ISBN, function(results) {
      if (!results) {
        res.redirect('/404');
      } else {
        //res.status(200).send(results); //JSON
        bookSearch.getBookPrice(ISBN, function(price) {
          var WPM = config.wordsPerMinuteReading;
          var estMin = (results.Wordcount / WPM);
          var avgEstHr = Math.floor(estMin / 60);
          var avgEstMin = Math.floor(estMin - (avgEstHr * 60));
          switch (results.Accuracy) { //Accuracy dot selection. Ugly. Please fix.
            case 'Verified':
              var dot = 'dot dot-success';
              break;
            case 'Estimate':
              var dot = 'dot dot-warning';
              break;
            default:
              var dot = 'dot dot-danger';
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
            MSRP: results.MSRP,
            Pages: results.Pages.toLocaleString(),
            Wordcount: results.Wordcount.toLocaleString(),
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
            Description: results.Description.replace(/<(?:.|\n)*?>/gm, ''),
            Price: price,
            FeaturedMonth: config.featuredBook.month,
            FeaturedTitle: featured.Title,
            FeaturedImage: featured.Image,
            FeaturedISBN: featured.ISBN,
            FeaturedWordcount: featured.Wordcount.toLocaleString(),
            adsDiv: config.responsiveAdId,
            adsSrc: config.responsiveAdSrc
          });
        });
      };
    });
  });
});

/* GET books page */
router.get('/book/isbn-:urlISBN(\\d{9}[\\d|X]$)', function(req, res, next) {
  var ISBN = req.params['urlISBN'];
  if (ISBN == '404') {
    res.redirect('/404');
  }
  bookSearch.getBook(config.featuredBook.ISBN, function(featured) {
    bookSearch.getBook(ISBN, function(results) {
      if (!results) {
        res.redirect('/404');
      } else {
        //res.status(200).send(results); //JSON
        bookSearch.getBookPrice(ISBN, function(price) {
          var WPM = config.wordsPerMinuteReading;
          var estMin = (results.Wordcount / WPM);
          var avgEstHr = Math.floor(estMin / 60);
          var avgEstMin = Math.floor(estMin - (avgEstHr * 60));
          switch (results.Accuracy) { //Accuracy dot selection. Ugly. Please fix.
            case 'Verified':
              var dot = 'dot dot-success';
              break;
            case 'Estimate':
              var dot = 'dot dot-warning';
              break;
            default:
              var dot = 'dot dot-danger';
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
            MSRP: results.MSRP,
            Pages: results.Pages.toLocaleString(),
            Wordcount: results.Wordcount.toLocaleString(),
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
            Description: results.Description.replace(/<(?:.|\n)*?>/gm, ''),
            Price: price,
            FeaturedMonth: config.featuredBook.month,
            FeaturedTitle: featured.Title,
            FeaturedImage: featured.Image,
            FeaturedISBN: featured.ISBN,
            FeaturedWordcount: featured.Wordcount.toLocaleString(),
            adsDiv: config.responsiveAdId,
            adsSrc: config.responsiveAdSrc
          });
        });
      };
    });
  });
});
/* GET 404 page */
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

module.exports = router;

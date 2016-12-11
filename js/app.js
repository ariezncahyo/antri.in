/*! 
 * Roots v 2.0.0
 * Follow me @adanarchila at Codecanyon.net
 * URL: http://codecanyon.net/item/roots-phonegapcordova-multipurpose-hybrid-app/9525999
 * Don't forget to rate Roots if you like it! :)
 */

// In this file we are goint to include all the Controllers our app it's going to need

(function(){
  'use strict';
 
  var app = angular.module('app', ['onsen', 'angular-images-loaded', 'ngMap', 'angular-carousel','firebase']);

  // Initialize Firebase
  var config = {
    apiKey: "AIzaSyAW2hD8hZVhrXFLusKOlRwGN977xcuDkUc",
    authDomain: "antriin-22b07.firebaseapp.com",
    databaseURL: "https://antriin-22b07.firebaseio.com",
    storageBucket: "antriin-22b07.appspot.com",
    messagingSenderId: "424719960904"
  };
  firebase.initializeApp(config);

  // Filter to convert HTML content to string by removing all HTML tags
  app.filter('htmlToPlaintext', function() {
      return function(text) {
        return String(text).replace(/<[^>]+>/gm, '');
      }
    }
  );

  app.directive('datePicker', function () {
      return {
          link: function postLink(scope, element, attrs) {
              scope.$watch(attrs.datePicker, function () {
                  if (attrs.datePicker === 'start') {
                      //element.pickadate();
                  }
              });
          }
      };
  });

  app.controller('networkController', function($scope){

    // Check if is Offline
    document.addEventListener("offline", function(){

      offlineMessage.show();

      /* 
       * With this line of code you can hide the modal in 8 seconds but the user will be able to use your app
       * If you want to block the use of the app till the user gets internet again, please delete this line.       
       */

      setTimeout('offlineMessage.hide()', 8000);  

    }, false);

    document.addEventListener("online", function(){
      // If you remove the "setTimeout('offlineMessage.hide()', 8000);" you must remove the comment for the line above      
      // offlineMessage.hide();
    });

  });

  // This functions will help us save the JSON in the localStorage to read the website content offline

  Storage.prototype.setObject = function(key, value) {
      this.setItem(key, JSON.stringify(value));
  }

  Storage.prototype.getObject = function(key) {
      var value = this.getItem(key);
      return value && JSON.parse(value);
  }

  // This directive will allow us to cache all the images that have the img-cache attribute in the <img> tag
  app.directive('imgCache', ['$document', function ($document) {
    return {
      link: function (scope, ele, attrs) {
        var target = $(ele);

        scope.$on('ImgCacheReady', function () {

          ImgCache.isCached(attrs.src, function(path, success){
            if(success){
              ImgCache.useCachedFile(target);
            } else {
              ImgCache.cacheFile(attrs.src, function(){
                ImgCache.useCachedFile(target);
              });
            }
          });
        }, false);

      }
    };
  }]);    



  // News Controller / Show Latest Posts
  // This controller gets all the posts from our WordPress site and inserts them into a variable called $scope.items
  app.controller('newsController', [ '$http', '$scope', '$rootScope', function($http, $scope, $rootScope){

    $scope.yourAPI = 'http://dev.studio31.co/api/get_recent_posts';
    $scope.items = [];
    $scope.totalPages = 0;
    $scope.currentPage = 1;
    $scope.pageNumber = 1;
    $scope.isFetching = true;
    $scope.lastSavedPage = 0;

    // Let's initiate this on the first Controller that will be executed.
    ons.ready(function() {
      
      // Cache Images Setup
      // Set the debug to false before deploying your app
      ImgCache.options.debug = true;

      ImgCache.init(function(){

        //console.log('ImgCache init: success!');
        $rootScope.$broadcast('ImgCacheReady');
        // from within this function you're now able to call other ImgCache methods
        // or you can wait for the ImgCacheReady event

      }, function(){
        //console.log('ImgCache init: error! Check the log for errors');
      });

    });


    $scope.pullContent = function(){
      
      $http.jsonp($scope.yourAPI+'/?page='+$scope.pageNumber+'&callback=JSON_CALLBACK').success(function(response) {

        if($scope.pageNumber > response.pages){

          // hide the more news button
          $('#moreButton').fadeOut('fast');  

        } else {

          $scope.items = $scope.items.concat(response.posts);
          window.localStorage.setObject('rootsPosts', $scope.items); // we save the posts in localStorage
          window.localStorage.setItem('rootsDate', new Date());
          window.localStorage.setItem("rootsLastPage", $scope.currentPage);
          window.localStorage.setItem("rootsTotalPages", response.pages);

          // For dev purposes you can remove the comment for the line below to check on the console the size of your JSON in local Storage
          // for(var x in localStorage)console.log(x+"="+((localStorage[x].length * 2)/1024/1024).toFixed(2)+" MB");

          $scope.totalPages = response.pages;
          $scope.isFetching = false;

          if($scope.pageNumber == response.pages){

            // hide the more news button
            $('#moreButton').fadeOut('fast'); 

          }

        }

      });

    }

    $scope.getAllRecords = function(pageNumber){

      $scope.isFetching = true;    

      if (window.localStorage.getItem("rootsLastPage") == null ) {

        $scope.pullContent();

      } else {
        
        var now = new Date();
        var saved = new Date(window.localStorage.getItem("rootsDate"));

        var difference = Math.abs( now.getTime() - saved.getTime() ) / 3600000;

        // Lets compare the current dateTime with the one we saved when we got the posts.
        // If the difference between the dates is more than 24 hours I think is time to get fresh content
        // You can change the 24 to something shorter or longer

        if(difference > 24){
          // Let's reset everything and get new content from the site.
          $scope.currentPage = 1;
          $scope.pageNumber = 1;
          $scope.lastSavedPage = 0;
          window.localStorage.removeItem("rootsLastPage");
          window.localStorage.removeItem("rootsPosts");
          window.localStorage.removeItem("rootsTotalPages");
          window.localStorage.removeItem("rootsDate");

          $scope.pullContent();
        
        } else {
          
          $scope.lastSavedPage = window.localStorage.getItem("rootsLastPage");

          // If the page we want is greater than the last saved page, we need to pull content from the web
          if($scope.currentPage > $scope.lastSavedPage){

            $scope.pullContent();
          
          // else if the page we want is lower than the last saved page, we have it on local Storage, so just show it.
          } else {

            $scope.items = window.localStorage.getObject('rootsPosts');
            $scope.currentPage = $scope.lastSavedPage;
            $scope.totalPages = window.localStorage.getItem("rootsTotalPages");
            $scope.isFetching = false;

          }

        }

      }

    };

    $scope.imgLoadedEvents = {
        done: function(instance) {
            angular.element(instance.elements[0]).removeClass('is-loading').addClass('is-loaded');
        }
    };

    $scope.showPost = function(index){
        
      $rootScope.postContent = $scope.items[index];
      $scope.ons.navigator.pushPage('post.html');

    };

    $scope.nextPage = function(){

      $scope.currentPage++; 
      $scope.pageNumber = $scope.currentPage;                 
      $scope.getAllRecords($scope.pageNumber);        

    }

  }]);

  // This controller let us print the Post Content in the post.html template
  app.controller('postController', [ '$scope', '$rootScope', '$sce', function($scope, $rootScope, $sce){
    
    $scope.item = $rootScope.postContent;

    $scope.renderHtml = function (htmlCode) {
      return $sce.trustAsHtml(htmlCode);
    };

    $scope.imgLoadedEvents = {
        done: function(instance) {
            angular.element(instance.elements[0]).removeClass('is-loading').addClass('is-loaded');
        }
    };    

  }]);

  // Map Markers Controller

  app.controller('markersController', function($scope, $compile){
    
    $scope.infoWindow = {
      title: 'title',
      content: 'content'
    };

    $scope.markers = [
      {
        'title' : 'Location #1',
        'content' : 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras a viverra magna',
        'location'  : [40.7112, -74.213]
      }, 
      {
        'title' : 'Location #2',
        'content' : 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras a viverra magna',
        'location'  : [40.7243, -74.2014]
      }, 
      {
        'title' : 'Location #3',
        'content' : 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras a viverra magna',
        'location'  : [40.7312, -74.1923]
      }
      ];

      $scope.showMarker = function(event){

        $scope.marker = $scope.markers[this.id];
          $scope.infoWindow = {
          title: $scope.marker.title,
          content: $scope.marker.content
        };
        $scope.$apply();
        $scope.showInfoWindow(event, 'marker-info', this.getPosition());

      }

  });


  app.controller('bookingController', function($scope, $compile, $filter,$firebaseArray,$firebaseAuth){

    $scope.bookdate = 'Pick Reservation Date';
    $scope.booktime = 'Pick Reservation Time';

    var fb = $firebaseAuth();
    var auth=fb.$getAuth();
    if(auth)
    {
        console.log("coba dapetin data");
        var ref=firebase.database().ref();
        //console.log(ref);
        var syncArray=$firebaseArray(ref);
        $scope.book = syncArray;        
        // console.log(book);
    }
    else
    {
      console.log("belum login");
    }

    $scope.bankpars=gallery.getCurrentPage().options.param1;
    $scope.lokasipars=gallery.getCurrentPage().options.param2;

    $scope.upload = function(tipeantrian,fullname,email,phone,message)
    {
      console.log("coba upload");
      if(auth)
      {
        console.log("udah login");
        var ref=firebase.database().ref("myqueue/" + auth.uid);
        var syncArray=$firebaseArray(ref);
        var bankpars = gallery.getCurrentPage().options.param1;
        var lokasipars = gallery.getCurrentPage().options.param2;
        syncArray.$add({bankpars,lokasipars,tipeantrian:tipeantrian, fullname: fullname, email:email, phone:phone, message:message}).then(function(syncArray)
        {
          console.log("data telah ditambahkan");
        }
        ).catch(function(error) 
        {
          console.error("Error: ", error);
        });
      }
      else
      {
        console.log("belum login");
      }
    }
    

    $scope.chooseDate = function()
    {
      
      var options = {
        date: new Date(),
        mode: 'date'
      };

      datePicker.show(options, function(date){
        
        var day   = date.getDate();
          var month   = date.getMonth() + 1;
          var year  = date.getFullYear();

          $scope.$apply(function(){
            $scope.bookdate = $filter('date')(date, 'MMMM d, yyyy');      
          });

      });

    }

    $scope.chooseTime = function(){
      
      var options = {
        date: new Date(),
        mode: 'time'
      };

      datePicker.show(options, function(time){
          $scope.$apply(function(){
            $scope.booktime = $filter('date')(time, 'hh:mm a');
          });
      });

    }

  });

  app.controller('loginController', function($scope, $compile, $location,$filter, $firebaseAuth){

    $scope.bookdate = 'Pick Reservation Date';
    $scope.booktime = 'Pick Reservation Time';

    $scope.login = function(email,password,navigator,navigator2)
    {
      console.log("logging in");
      var auth = $firebaseAuth();

      auth.$signInWithEmailAndPassword(email, password)
      .then(function(firebaseUser) 
      {
        console.log("Signed in as:", firebaseUser.uid);
        navigator.show();

      }).catch(function(error) 
      {
        console.error(error);
        navigator2.show();
      });
    }

    $scope.chooseTime = function(){
      
      var options = {
        date: new Date(),
        mode: 'time'
      };

      datePicker.show(options, function(time){
          $scope.$apply(function(){
            $scope.booktime = $filter('date')(time, 'hh:mm a');
          });
      });

    }

  });

  app.controller('uporgController',function($scope,$compile,$filter,$firebaseAuth,$firebaseArray){

    var fb = $firebaseAuth();
    var auth=fb.$getAuth();
    console.log("masuk");
    $scope.uporg = function(organisasi,lokasi,navigator3,navigator4)
    {
        if(auth)
        {
            console.log("coba upload org");
            var ref=firebase.database().ref("orgs/");
            //console.log(ref);
            var syncArray=$firebaseArray(ref);
            syncArray.$add({organisasi:organisasi, lokasi:lokasi}).then(function(syncArray)
            {
              console.log("data org telah ditambahkan");
              navigator3.show();
            }
            ).catch(function(error) 
            {
              console.error("Error: ", error);
            });             
        }
        else
        {
          console.error("Error: ", error);
          navigator4.show();
        }
    }
  });

  app.controller('dishesController', function($scope,$compile,$filter,$firebaseAuth,$firebaseArray)
  {

    var fb = $firebaseAuth();
    var auth=fb.$onAuthStateChanged(function(firebaseUser){
        console.log("coba get data antrian bank ku");
        var ref=firebase.database().ref("myqueue/" + firebaseUser.uid);
        var syncArray=$firebaseArray(ref);
        $scope.dishes=syncArray;
    }
      );

  });

  app.controller('signupController', function($scope, $compile, $filter, $firebaseAuth,$firebaseArray){

    $scope.bookdate = 'Pick Reservation Date';
    $scope.booktime = 'Pick Reservation Time';


    $scope.signup = function(first,last,email,password,navigator3,navigator4)
    {
      var auth = $firebaseAuth();

      console.log("signing up");

      auth.$createUserWithEmailAndPassword(email, password)
      .then(function(firebaseUser) 
      {
        console.log("User " + firebaseUser.uid + " created successfully!");
        var fb = $firebaseAuth();
        var auth=fb.$getAuth();
        if(auth)
        {
            console.log("coba signup email & nama");
            var ref=firebase.database().ref("users/" + auth.uid);
            //console.log(ref);
            var syncArray=$firebaseArray(ref);
            syncArray.$add({email:email, first: first, last:last}).then(function(syncArray)
            {
              console.log("data telah ditambahkan");
            }
            ).catch(function(error) 
            {
              console.error("Error: ", error);
            });             
                //console.log(book);
        }
        navigator3.show();
      }).catch(function(error) 
      {
        console.error("Error: ", error);
        navigator4.show();
      });
    }

    $scope.chooseTime = function(){
      
      var options = {
        date: new Date(),
        mode: 'time'
      };

      datePicker.show(options, function(time){
          $scope.$apply(function(){
            $scope.booktime = $filter('date')(time, 'hh:mm a');
          });
      });

    }

  });

  app.controller('profileController', function($scope, $compile, $filter, $firebaseAuth,$firebaseArray)
  {
    var fb = $firebaseAuth();
    var auth=fb.$onAuthStateChanged(function(firebaseUser)
    {
        console.log("coba signup email & nama");
        var ref=firebase.database().ref("users/" + firebaseUser.uid);
        var syncArray=$firebaseArray(ref);
        $scope.profil=syncArray;
    }
      );

  });

  app.controller('daftarorgController', function($scope, $compile, $filter, $firebaseAuth,$firebaseArray)
  {
    var fb = $firebaseAuth();
    var ref=firebase.database().ref("orgs/");
    var syncArray = $firebaseArray(ref);
    $scope.profilorg=syncArray;

    $scope.upload = function(tipeantrian,fullname,email,phone,message)
    {
      console.log("coba upload");
      if(auth)
      {
        console.log("udah login");
        var ref=firebase.database().ref();
        var syncArray=$firebaseArray(ref);
        syncArray.$add({tipeantrian:tipeantrian, fullname: fullname, email:email, phone:phone, message:message}).then(function(syncArray)
        {
          console.log("data telah ditambahkan");
        }
        ).catch(function(error) 
        {
          console.error("Error: ", error);
        });
      }
      else
      {
        console.log("belum login");
      }
    }

  });

  app.controller('barcodeController', function( $scope ){
    
    $scope.barcode = {
      'result': '',
      'format': '',
      'cancelled': ''
    }

    $scope.startScanner = function(){
      
      cordova.plugins.barcodeScanner.scan(
        function (result) {

          $scope.$apply(function(){
            $scope.barcode = {
              'result': result.text,
              'format': result.format,
              'cancelled': result.cancelled
            } 
          });
                       
        }, 
        function (error) {

          alert("Scanning failed: " + error);
          
        }
      );

    };
      
  });

  app.controller('cameraController', function( $scope ){
    
    $scope.lastPhoto = 'images/profile.png';

    $scope.camOptions = {};

    var originalPhoto = document.getElementById('photo');

    // This function takes care of opening the camera and getting the URL
    $scope.openCamera = function(){
      ons.ready(function() {
        $scope.camOptions = { 
          quality : 100,
          destinationType : navigator.camera.DestinationType.FILE_URI,
          sourceType : navigator.camera.PictureSourceType.PHOTOLIBRARY,
          allowEdit : true,
          encodingType: navigator.camera.EncodingType.JPEG,
          targetWidth: 640,
          targetHeight: 640,
          saveToPhotoAlbum: true 
        };      
        navigator.camera.getPicture( $scope.onSuccess, $scope.onFail, $scope.camOptions );
      });
    }

    // This is the function that will trigger if we succeded taking the picture
    $scope.onSuccess = function(imageURI) {
      console.log(imageURI);
      $scope.$apply(function(){
        $scope.lastPhoto = imageURI;
      });
    }

    // This is the function that will trigger if we failed to take a picture
    $scope.onFail = function(message) {
        console.log('Failed because: ' + message);
    }

          
  });
  // Plugins Controller



  app.controller('pluginsController', function($scope, $compile){

    $scope.openWebsite = function(){
      var ref = window.open('http://google.com', '_blank', 'location=yes');
    }

    $scope.openSocialSharing = function(){
      
      window.plugins.socialsharing.share('Message, image and link', null, 'https://www.google.com/images/srpr/logo4w.png', 'http://www.google.com');

      /*
       *  Social Sharing Examples
       *  For more examples check the documentation: https://github.com/EddyVerbruggen/SocialSharing-PhoneGap-Plugin
   
        window.plugins.socialsharing.share('Message only')
        window.plugins.socialsharing.share('Message and subject', 'The subject')
        window.plugins.socialsharing.share(null, null, null, 'http://www.google.com')
        window.plugins.socialsharing.share('Message and link', null, null, 'http://www.google.com')
        window.plugins.socialsharing.share(null, null, 'https://www.google.com/images/srpr/logo4w.png', null)
        window.plugins.socialsharing.share('Message and image', null, 'https://www.google.com/images/srpr/logo4w.png', null)
        window.plugins.socialsharing.share('Message, image and link', null, 'https://www.google.com/images/srpr/logo4w.png', 'http://www.google.com')
        window.plugins.socialsharing.share('Message, subject, image and link', 'The subject', 'https://www.google.com/images/srpr/logo4w.png', 'http://www.google.com')
      *
      */

    }


    $scope.openEmailClient = function(){

      ons.ready(function(){

        cordova.plugins.email.open({
          to:      'han@solo.com',
          subject: 'Hey!',
          body:    'May the <strong>force</strong> be with you',
          isHtml:  true
        });

      });
      
    }

    $scope.getDirectionsApple = function(){
      
      window.location.href = "maps://maps.apple.com/?q=37.774929,-122.419416";

    }

    $scope.getDirectionsGoogle = function(){

      var ref = window.open('http://maps.google.com/maps?q=37.774929,-122.419416', '_system', 'location=yes');

    }

    $scope.getDate = function(){
      
      var options = {
        date: new Date(),
        mode: 'date'
      };

      datePicker.show(options, function(date){
        alert("date result " + date);  
      });

    }

  });

})();
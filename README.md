### 23 Video API for Node.js

The `node-23video` project is a full implementation of [The 23 Video API](http://www.23developer.com/api) (or more correctly, The Visualplatform API) for [Node.js](http://www.nodejs.org). 

`node-23video` includes:

* Implementations of all the methods in the API.
* OAuth signatures through (23's fork of `restler`)[http://github.com/23/restler].
* Methods to handle the exchange of OAuth of credentials ([more information](http://www.23developer.com/api/oauth)).
* A handy command-line interface to the 23 Video API.


### Using the 23 Video API in Node.js

Making simple request to the open API:

    var visualplatform = Visualplatform(domain);
    visualplatform.album.list({search:'test'})
      .then(
        function(data){...},
        function(errorMessage){...}
      );

Making OAuth signed requests to the API:

    var visualplatform = Visualplatform(domain, key, secret);
    visualplatform.album.create({title:'New album'}, access_token. access_token_secret)
      .then(
        function(data){...},
        function(errorMessage){...}
      );

Methods can be called as:

    visualplatform.photo.updateUploadToken(...)
    visualplatform['photo.updateUploadToken'](...)
    visualplatform['/api/photo/update-upload-token'](...)

The first parameter is always a JS object with the filter data described in [the API documentation](http://www.23developer.com/api/#methods).

All methods requiring authentication takes `access_token` and `access_token_secret` as their second and third parameters.

The library using [@kriszyp](https://twitter.com/kriszyp)'s [`node-promise`](https://github.com/kriszyp/node-promise) complete implementation of JavaScript promises.


### Exchanging token (or: Having user grant access to the API)

The library includes two methods wrapping the OAuth token flow, `.beginAuthentication()` and `.endAuthentication()`.

A few examples can illustrate how the methods are used. First, [the command-line interface](https://github.com/23/node-23video/blob/master/lib/cli.js) uses it like this:

    var visualplatform = require('./visualplatform')(program.domain, program.key, program.secret, 'oob');
    visualplatform.beginAuthentication()
      .then(function(url){
            console.log('To verify access, open the following URL in your browser and follow the instructions.\n  '+url+'\n');
            program.prompt('To complete the authorization, paste the string from the browser here: ', function(verifier){        
                             process.stdin.destroy();
                             visualplatform.completeAuthentication(null, verifier)
                               .then(
                                 function(credentials){
                                       console.log('\nCREDENTIALS FOR 23 VIDEO:');
                                       console.log('Domain:\t\t\t', credentials.domain);
                                       console.log('Consumer key:\t\t', program.key);
                                       console.log('Consumer secret:\t', program.secret);
                                       console.log('Access token:\t\t', credentials.oauth_token);
                                       console.log('Access token secret:\t', credentials.oauth_token_secret);
                                       console.log('')
                                     },
                                 function(message){
                                       console.log('Error while completing authentication:', message);
                                     });
                           });
          }, function(message){
            console.log('Error while beginning authentication:', message);
          });

A more likely example handles login through 23 Video. In the [Express application framework](http://expressjs.com/), this might be achieved like this:

    // Instance of the library
    var visualplatform = require('./visualplatform')(null, program.key, program.secret, 'http://examples.com/oauth/23video');

    // Bootstrap Express to handle HTTP service
    var express = require('express');
    var app = express.createServer();

    // Set up session support
    app.use(express.cookieParser());
    app.use(express.session({secret:config.express.sessionSecret}));


    // Create a URL at http://examples.com/oauth/23video/redirect which initiates the flow
    app.get('/oauth/23video/redirect', function(req, res){
        visualplatform.beginAuthentication()
          .then(function(url){
              res.redirect(url);
           })
    });

    // Create a URL at http://examples.com/oauth/23video to handle callback and retrieval of access credentials
    app.get('/oauth/23video, function(req, res){
        visualplatform.completeAuthentication(req.query.oauth_token, req.query.oauth_verifier)
          .then(function(credentials){
              console.log('domain', credentials.domain);
              console.log('site_id', credentials.site_id);
              console.log('token', credentials.oauth_token);
              console.log('token secret', credentials.oauth_token_secret)
              res.redirect('/');
            })
    });


### Using the command-line interface for Node.js

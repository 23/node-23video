### 23 Video API for Node.js

`node-23video` is a full implementation of [The 23 Video API](http://www.23developer.com/api) (or more correctly, The Visualplatform API) for [Node.js](http://www.nodejs.org). 

The library includes:

* Implementations of all the methods in the API.
* OAuth signatures through (23's fork of `restler`)[http://github.com/23/restler].
* Methods to handle the exchange of OAuth of credentials ([more information](http://www.23developer.com/api/oauth)).
* A handy command-line interface to the 23 Video API.

The library and it dependencies is easily installed throuh `git`:

    git clone git@github.com:23/node-23video.git
    cd node-23video
    git submodule init


### Use the 23 Video API in Node.js

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


### Exchanging tokens (or: Having user grant access to the API)

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

The library comes with `./23video` a command-line interface (CLI) for The 23 Video API. Like the library itself, the CLI does open API requests, signed request and can handle token exchange or login.


Open requests without signatures

    ./23video -m photo.list search test limit 30

Signed requests to the API

    ./23video -k <consumer_key> -s <consumer_secret> -at <access_token> -as <access_secret> -m photo.list search test limit 30

Get access credentials from consumer keys

    ./23video --auth -k <consumer_key> -s <consumer_secret>

Full documentation is available with `./23video --help`:

  Usage: 23video [options]

  Options:

    -h, --help                            output usage information
    -V, --version                         output the version number
    -m, --method <method>                 Method to call in the 23 Video API
    -d, --domain [domain]                 Domain for the 23 Video site
    -a, --auth                            Authenticate against the 23 Video API
    -k, --key [key]                       OAuth consumer key
    -s, --secret [secret]                 OAuth consumer secret
    -at, --access_token [access_token]    OAuth access token
    -as, --access_secret [access_secret]  OAuth access token secret


### To-do

* Handle file uploads in the library
* Handle file uploads through CLI
* Store credentials on disk for easy access on the CLI
* Prompt for domain, method, key/secret in CLI when required

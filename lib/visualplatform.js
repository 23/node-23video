/*

var visualplatform = Visualplatform(domain);
visualplatform.album.list({search:'test'})
  .then(
    function(data){...},
    function(errorMessage){...}
  );

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

The first parameter is always a JS object with the filter data  described in
http://www.23developer.com/api/#methods

All methods requiring authentication takes access_token and access_secret
as their second and third parameters.

*/

var OAuthAuthentication = require('./authentication');
var Promise = require("promise");
var oauth = require('./oauth');
var url = require('url');
var querystring = require('querystring');

module.exports = Visualplatform = function(domain, key, secret, callback_url){
  var $ = this;
  var rest = require('restler');
  $.serviceDomain = domain;
  $.consumer_key = key;
  $.consumer_secret = secret;
  $.callback_url = callback_url||'';

  /* API WEB SERVICE API */
  $.call = function(method, data, access_token, access_secret){
    // Handle arguments
    return new Promise(function(fulfill, reject) {
      data = data||{};
      data['format'] = 'json';
      data['raw'] = '1';
      access_token = access_token||'';
      access_secret = access_secret||'';
      console.log(data);

      var handleSuccess = function(res) {
        // Use try/catch to avoid malformed JSON-responses
        try {
          res = JSON.parse(res);
          // Status might not be ok, even though the request went through
          if (!res.status == 'OK') return reject(res.message);
          else {
            return fulfill(res);
          }
        }
        catch (e) {
          console.log('JSON parse error', e);
          return reject('Error parsing response');
        }
      }
      var handleErr = function(res) {
        // Use try/catch to avoid malformed JSON-responses
        try {
          res = JSON.parse(res);
          // If response is object, parse and return err, if response is a number it's a timeout
          if (typeof res == Object) {
            return reject(res.message);
          } else if (!isNaN(res)) {
            return reject('Timeout: ' + res);
          } else {
            return reject(res);
          }
        }
        catch(e) {
          console.log('JSON parse error', e);
          return reject('Error parsing response');
        }
      }

      if (data.requestMethod == 'GET' && (!data.include_unpublished_p || data.include_unpublished_p == 0) && cached.indexOf(method) > -1) {
        // Remove request method from data, since it has no effect on api calls
        delete data.requestMethod;

        // Set up the request with callbacks
        rest.get(url.parse('https://'+$.serviceDomain+':443'+method+'?'+querystring.stringify(data)))
          .on('success', handleSuccess)
          .on('fail', handleErr)
          .on('error', handleErr)
          .on('timeout', handleErr);

      } else {
        // Set up the request with callbacks
        rest.post('https://'+$.serviceDomain+method, {
            data:data,
            headers: {
              Authorization: oauth.signature(url.parse('https://'+$.serviceDomain+':443'+method+'?'+querystring.stringify(data)), {
                oauthConsumerKey: $.consumer_key,
                oauthConsumerSecret: $.consumer_secret,
                oauthAccessToken: access_token,
                oauthAccessTokenSecret: access_secret,
                method: 'POST'
              })
            }
          })
          .on('success', handleSuccess)
          .on('fail', handleErr)
          .on('error', handleErr)
          .on('timeout', handleErr);
      }
    });
  }

  // Map entire Visualplatform API
  var methods = ['/api/analytics/report/event', '/api/analytics/report/play', '/api/analytics/extract/play-details', '/api/analytics/extract/play-totals', '/api/album/create', '/api/album/delete', '/api/album/list', '/api/album/update', '/api/comment/add', '/api/comment/delete', '/api/comment/list', '/api/photo/coordinate/add', '/api/photo/coordinate/delete', '/api/distribution/ios/push-notification', '/api/distribution/ios/register-device', '/api/distribution/ios/unregister-device', '/api/license/list', '/api/live/create', '/api/live/delete', '/api/live/list', '/api/live/update', '/api/live/upload-image', '/api/live/start-recording', '/api/live/stop-recording', '/api/photo/delete', '/api/photo/frame', '/api/photo/get-upload-token', '/api/photo/get-replace-token', '/api/photo/list', '/api/photo/rate', '/api/photo/redeem-replace-token', '/api/photo/redeem-upload-token', '/api/photo/replace', '/api/photo/update', '/api/photo/update-upload-token', '/api/photo/upload', '/api/player/list', '/api/player/settings', '/api/photo/section/create', '/api/photo/section/delete', '/api/photo/section/list', '/api/photo/section/set-thumbnail', '/api/photo/section/update', '/api/session/get-token', '/api/session/redeem-token', '/api/site/get', '/api/photo/subtitle/list', '/api/tag/list', '/api/tag/related', '/api/echo', '/api/user/create', '/api/user/get-login-token', '/api/user/list', '/api/user/redeem-login-token'];
  // Map cached endpoints for saving resources spent on api requests
  var cached = ['/api/album/list','/api/comment/list/','/api/license/list','/api/live/list','/api/photo/frame','/api/photo/list','/api/player/list','/api/player/settings','/api/photo/section/list','/api/site/get','/api/photo/subtitle/list','/api/tag/list','/api/tags/related'];

  // Build functions for each Visualplatform API method
  for (i in methods) {
    var method = methods[i];
    $[method] = (function(method){
        return function(data,access_token,access_secret){
          var data=data||{};
          var access_token=access_token||'';
          var access_secret=access_secret||'';
          return($.call(method, data, access_token, access_secret));
        }
      })(method);

    // Create sub-objects for the different API namespaces
    var camelizedMethod = method.replace(/-(.)/g, function(_,$1){return $1.toUpperCase()});
    var s = camelizedMethod.split('/').slice(2);
    var x = [];
    for (var i=0; i<s.length-1; i++) {
      x.push(s[i]);
      if(!$[x.join('.')]) $[x.join('.')] = {};
    }
    // Create an alias for the method (both $.album.list and $['album.list'])
    if(x.length>0) {
      $[x.join('.')][s[s.length-1]] = $[method];
    } else {
      $[s[s.length-1]] = $[method];
    }
    $[s.join('.')] = $[method];
  };


  /* OAUTH AUTHENTICATION HELPERS */
  $.oauth = OAuthAuthentication('api.visualplatform.net', $.consumer_key, $.consumer_secret, $.callback_url);
  $._oauthToken = '';
  $.beginAuthentication = function(){
    return new Promise(function(fulfill, reject) {
    	$.oauth.request_token().then(
    		function(response) {
	    		$._oauthToken = response.oauth_token;
	    		return fulfill('http://api.visualplatform.net/oauth/authorize?oauth_token=' + $._oauthToken);
    		},function(message) {
	    		return reject(message);
    		}
    	);
    });
  }
  $.completeAuthentication = function(token, verifier){
    return $.oauth.access_token(token||$._oauthToken, verifier);
  }


  return(this);
};


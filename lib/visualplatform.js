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
var Promise = require("../node-promise/promise").Promise;

module.exports = Visualplatform = function(domain, key, secret, callback_url){
  var $ = this;
  var rest = require('../restler');
  $.serviceDomain = domain;
  $.consumer_key = key;
  $.consumer_secret = secret;
  $.callback_url = callback_url||'';
  
  /* API WEB SERVICE API */
  $.call = function(method, data, access_token, access_secret){
    // Handle arguments
    var $p = new Promise();
    data = data||{};
    data['format'] = 'json';
    data['raw'] = '1';
    access_token = access_token||'';
    access_secret = access_secret||'';
    
    // Set up the request with callbacks
    rest.post('http://'+$.serviceDomain+method, {
        oauthConsumerKey: $.consumer_key,
          oauthConsumerSecret: $.consumer_secret,
          oauthAccessToken: access_token,
          oauthAccessTokenSecret: access_secret,
          data:data
          }).on('success', function(res) {            
              res = JSON.parse(res);
              if(res.status == 'ok') {
                $p.resolve(res);
              } else {
                $p.reject(res.message);
              }
            }).on('error', function(err) {
              console.log(err);
                err = JSON.parse(err);
                $p.reject(err.message);
              });
    return($p);
  }
  
  // Map entire Visualplatform API
  var methods = ['/api/analytics/report/event', '/api/analytics/report/play', '/api/album/create', '/api/album/delete', '/api/album/list', '/api/album/update', '/api/comment/add', '/api/comment/delete', '/api/comment/list', '/api/photo/coordinate/add', '/api/photo/coordinate/delete', '/api/distribution/ios/push-notification', '/api/distribution/ios/register-device', '/api/distribution/ios/unregister-device', '/api/license/list', '/api/live/create', '/api/live/delete', '/api/live/list', '/api/live/update', '/api/live/upload-image', '/api/live/start-recording', '/api/live/stop-recording', '/api/photo/delete', '/api/photo/frame', '/api/photo/get-upload-token', '/api/photo/list', '/api/photo/rate', '/api/photo/redeem-upload-token', '/api/photo/replace', '/api/photo/update', '/api/photo/update-upload-token', '/api/photo/upload', '/api/player/list', '/api/player/settings', '/api/photo/section/create', '/api/photo/section/delete', '/api/photo/section/list', '/api/photo/section/set-thumbnail', '/api/photo/section/update', '/api/session/get-token', '/api/session/redeem-token', '/api/site/get', '/api/photo/subtitle/list', '/api/tag/list', '/api/tag/related', '/api/echo', '/api/user/create', '/api/user/get-login-token', '/api/user/list', '/api/user/redeem-login-token'];

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
    var $p = new Promise();
    $.oauth.request_token()
    .then(function(response){
        $._oauthToken = response.oauth_token;
        $p.resolve('http://api.visualplatform.net/oauth/authorize?oauth_token=' + $._oauthToken);
      },function(message){
        $p.reject(message);
      });
    return($p);
  }
  $.completeAuthentication = function(token, verifier){
    return $.oauth.access_token(token||$._oauthToken, verifier);
  }

  return(this);
};


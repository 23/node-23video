/*

var oauth = OAuthAuthentication(domain, key, secret, callback_url);

oauth.request_token()
  .on('complete', function(data){...}
  .on('error', function(message){...}

oauth.access_token(token, verifier)
  .on('complete', function(data){...}
  .on('error', function(message){...}

*/

var qs = require("querystring"),
    rest = require('restler'),
    Promise = require('promise')

module.exports = OAuthAuthentication = function(domain, key, secret, callback_url, protocol, request_token_url, access_token_url, scope){
    var $ = this;
    $.domain = domain;
    $.consumer_key = key;
    $.consumer_secret = secret;
    $.callback_url = callback_url||'oob';
    $.protocol = protocol||'http';
    $.request_token_url = request_token_url||'/oauth/request_token';
    $.access_token_url = access_token_url||'/oauth/access_token';
    $.scope = scope||''; // scope is a Google-specific addition to the OAuth standard
                         // for Google services, you'll know what to do -- otherwise, ignore.
    
    // In-memory storage of request token secrets
    $.secrets = {};

    // Ask for request token
    $.request_token = function(){
    	return new Promise(function(fulfill, reject) {
	    	rest.post($.protocol+'://'+$.domain+$.request_token_url, {
	            oauthConsumerKey: $.consumer_key,
	            oauthConsumerSecret: $.consumer_secret,
	            data:{oauth_callback:$.callback_url, scope:scope}
	        }).on('success', function(res) {
	            var parsed = qs.parse(res);
	            $.secrets[parsed.oauth_token] = parsed.oauth_token_secret;
	            return fulfill(parsed);
	        }).on('error', function(err) {
	        	return reject(err);
	        });    
    	});        
    }

    // Exchange request tokens for access tokens
    $.access_token = function(token, verifier){
    	return new Promise(function(fulfill, reject) {
	        rest.post($.protocol+'://'+$.domain+$.access_token_url, {
	            oauthConsumerKey: $.consumer_key,
	            oauthConsumerSecret: $.consumer_secret,
	            oauthAccessToken: token,
	            oauthAccessTokenSecret: $.secrets[token],
	            data:{oauth_verifier:verifier, scope:scope}
	        }).on('success', function(res) {
	            var parsed = qs.parse(res);
	            delete $.secrets[token];
	            return fulfill(parsed);
	        }).on('error', function(err) {
	        	return reject(err);
	        }); 
       	});
    }
    return(this);
};


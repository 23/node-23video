
/*
 * Usage
 * 
 * Open requests without signatures
 *   ./23video -m photo.list search test limit 30
 * 
 * Signed requests to the API
 *   ./23video -k <consumer_key> -s <consumer_secret> -at <access_token> -as <access_secret> -m photo.list search test limit 30
 * 
 * Get access credentials from consumer keys
 *   ./23video --auth -k <consumer_key> -s <consumer_secret>
 * 
 */



var program = require('../commander.js/lib/commander');
program
  .version('1.0')
  .option('-m, --method <method>', 'Method to call in the 23 Video API')
  .option('-h, --hostname <hostname>]', 'Hostname for the 23 Video site')
  .option('-a, --auth', 'Authenticate against the 23 Video API')
  .option('-k, --key [key]', 'OAuth consumer key', '')
  .option('-s, --secret [secret]', 'OAuth consumer secret', '')
  .option('-x, --access_token [access_token]', 'OAuth access token')
  .option('-y, --access_secret [access_secret]', 'OAuth access token secret')
  .parse(process.argv);

var visualplatform = require('./visualplatform')(program.hostname,program.key,program.secret,'oob');

if(program.auth) {
  // We will do stuff to authenticate the user an generate tokens
    visualplatform.beginAuthentication()
    .then(function(url){
            console.log('To verify access, open the following URL in your browser and follow the instructions.\n  '+url+'\n');
            program.prompt('To complete the authorization, paste the string from the browser here: ', function(verifier){        
                             process.stdin.destroy();
                             visualplatform.completeAuthentication(null, verifier)
                               .then(function(credentials){
                                       console.log('\nCREDENTIALS FOR 23 VIDEO:');
                                       console.log('Hostname:\t\t\t', credentials.domain);
                                       console.log('Consumer key:\t\t', program.key);
                                       console.log('Consumer secret:\t', program.secret);
                                       console.log('Access token:\t\t', credentials.oauth_token);
                                       console.log('Access token secret:\t', credentials.oauth_token_secret);
                                       console.log('')
                                     });
                           });
          }, function(message){
            console.log('Error while beginning authentication:', message);
          });
} else {
  var data = {};
  for(var i=0; i<program.args.length; i+=2) {
    data[program.args[i]] = program.args[i+1]||'';
  }
  visualplatform[program.method](data, program.access_token, program.access_secret).
    then(
      function(data){
        console.log(data);
      }, function(error){
        console.log('Error', error);
      });
}


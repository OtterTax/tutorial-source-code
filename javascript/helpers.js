/*
 *  If using node, be sure to install and require node-fetch.
 * Example tested with node version 14.16.0
 * If "type": "module" does *not* appear in package.json
 * const fetch = require("node-fetch");
 * If type is set to module in package.json
 */
 import fetch from 'node-fetch';

/*
 * Import fs so we can read and write files.
 */
 import fs from 'fs';


/*
 * Obtain an access credential with the email address and password specified in ../config.json.
 * You must first register to obtain a vaild email/password.  Register for the sandbox at
 * https://sandbox.ottertax.com/register and follow instructions for confirming your
 * registration at https://doc.ottertax.com/registration/registration_confirmation.
*/


 /**
  * Function to read JSON file into JavaScript objects.
  * Checks that the JSON config file exists; if it doesn't the function
  * will output error messages and throw an error.
  * @param {String} fileName is the JSON file to read into a JS String
  * @return {String} the JS string containing the file
  */
 function getFileContents(filename) {
   var contents;
   try {
     if(fs.existsSync(filename)){
     contents = fs.readFileSync(filename, 'utf8');
     }
   } catch (err) {
      console.error(err)
   }
   return(contents);
 }

 /**
  * Funciton returns a configuration element containing 
  * the user: email, password or Server URL endpoint.
  * @param {String} elementName name of Object key for the value the method
  *   should return.
  * @return {String} the value of the provided key for this object.
 */
 function getConfigElement(elementName) {
   const config = JSON.parse(getFileContents('../config.json'));
   return(config[elementName]);
 }


 /**
  * Accesses the server to create new credentials (access keys) to allow the user
  * to access and edit their files.
  * The server is specified in the baseUrl parameter of ../config.json
  * @return {Object} credentials key-value pair
 */
 export const getCredential = async () => {
   var email, password;
   ({email, password} = getConfigElement('loginData'));
   const data = { email:    email,
                  password: password };
   const endpoint = getConfigElement('baseUrl') + '/v2/auth/sign_in';
   const response = await fetch( endpoint,
                                { method: "POST",
                                  headers: {"content-type": "application/json"},
                                  body: JSON.stringify(data) })
   const credential = {  'access-token': response.headers.get('access-token'),
                         'client':       response.headers.get('client'),
                         'uid':        response.headers.get('uid') };
   return(credential);
 }


 /**
  * Get the URL to access the server.
  * @return {String} the URL to access the server endpoint
  */
 export const getGraphqlEndpoint = () => {
   return(getConfigElement('baseUrl') + '/v2/graphql');
 }

 /**
  * Parses through the file containing tax statements to
  * create JS objects out of the string stored in the JSON file.
  * @param {string} filename the name of the file
  *   path which contains the JSON file.
  * @return {statements} an array of statements, each containing their
  *   unique key-value pair.
  */
 export const getData = (fileName) => {
   return(JSON.parse(getFileContents(fileName)));
 }


 /**
  * Transform a javascript object into a GraphQL string.
  * @param {object} obj A (non-array) javascript object.
  * @return {String} string of the statements key-value pairs with GQL server syntax.
  */
  export const toGqlObject = (obj) => {
    const items = [];
    for (let [k, v] of Object.entries(obj)) {
      const value = (typeof v === 'object' && !Array.isArray(v)) ?
                    toGqlObject(v) : JSON.stringify(v);
      items.push(`${k}: ${value}`);
    }
    return("\n{" + items.join("\n") + "\n}\n");
  }

 /**
  * Deletes the users temporary access Crdentials from the server.
  * This will require the user to make new credentials for the next edit
  * they make to their account.
  * The server is specified in the baseUrl parameter of ../config.json
  * @param {Object} credential the access keys to be deleted.
  * @return {Boolean} true if the credentials were deleted, false otherwise.
  */
 export async function deleteCredentials(credential) {
   const endpoint = getConfigElement('baseUrl') + '/v2/auth/sign_out';
   const response = await fetch( endpoint,
     { method: "DELETE",
       headers: {"content-type": "application/json"},
       body: JSON.stringify(credential) });

       const newData = await response.json();
       return newData;
 }

 /**
  * Checks which PDF's of the user-inputed ID's, for querying PDF statements from the server,
  * have been returned by the OtterTax server.
  * @param {Object} statements the server response of the statements retrieved by
  *   the OtterTax server.
  * @param {array} Ids list of the user-inputed statement ID's to query their PDF.
  * @returns {array} list of ID's of which a PDF statement was not returned in the
  *   server response.
  */
 export function downloadSuccessChecker(statements, Ids){
   var notDownloaded = [];
   var success = 0;
   var error = 0;
  for (let index = 0; index < Ids.length; index++) {
    statements.forEach((statement) => {
      let fileId = statement.uploaderId;
      if (fileId === Ids[index]){
          success = 1;
      }
    });
      if(success == 0){
        notDownloaded[error] = Ids[index];
        error++;
      }
      success = 0;
  }
  return notDownloaded;
 }
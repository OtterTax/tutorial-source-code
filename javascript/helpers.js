/** 
 *  If using node, be sure to install and require node-fetch.
 * Example tested with node version 14.16.0
 * If "type": "module" does *not* appear in package.json
 * const fetch = require("node-fetch");
 * If type is set to module in package.json
 */
 import fetch from 'node-fetch';

 //This import increases functionality to interact with the file system
 import fs from 'fs';
 
 
 /**
  * Function to read JSON file into JavaScript objects
  * @param {String} fileName is the file to read into a JS String
  * @return {String} the JS string containing the file
  */
 
 function getFileContents(filename) {
   var contents;
   try {
     if(fs.existsSync(filename)){
     contents = fs.readFileSync(filename, 'utf8');
     } 
   } catch (err) {
     /**console.log('No configuration file found.');
     console.log('Run "../build_config.rb" to create one.');
     console.log('Or use "../config.json.example" as a sample to build it from scratch.');*/
     console.error(err)
   }
   return(contents);
 }
 
 
 /**
  * Checks that the JSON config file exists; if it doesn't the function
  * will output error messages and throw an error.
  * @param {String} elementName name of Object key for the value the method should return.
  * @return {String} (config[elementName]) the value of the provided key for this object
 */
 
 function getConfigElement(elementName) {
   //add in tester to see if file is there and error statements if nessicary**********READ MESSAGE********************************************
   const config = JSON.parse(getFileContents('../config.json'));
   return(config[elementName]);
 }
 
 
 /**
  * Accesses the server to create new credentials (access keys) to allow the user to 
  * access and edit their files.
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
  * Get the URL to access the server
  * @return {String} the URL to access the server endpoint
  */
 
 export const getGraphqlEndpoint = () => {
   return(getConfigElement('baseUrl') + '/v2/graphql');
 }
 
 
 /**
  * This function parses through the file to create JS objects out of the
  * string stored in the JSON file
  * @param {string} filename (don't use camelcasing) the name of the file
  *   path which contains the JSON file
  * @return {statements} an array of statements, each containing their 
  *   unique key-value pair 
  */
 
 export const getData = (filename) => {
   return(JSON.parse(getFileContents(filename)));
 }
 
 
 /** 
  * Mutates the JS objects to GraphQL syntax to prep the data to be sent to the server
  * @return String of the statements key-value pair with GQL server syntax 
  */
 
 export const toGqlObject = (obj) => {
   const items = Object.keys(obj).map((k) => {
     return(`${k}: ${JSON.stringify(obj[k])}`)
   });
   return("\n{" + items.join("\n") + "\n}\n");
 }
 
 
 /** 
  * For correct.js
  * Mutates the JS objects to GraphQL syntax to prep the data to be sent to the server
  * @return String of the statements key-value pair with GQL server syntax 
  */
 
 // export const toGqlObjectCorrect = (obj) => {
 //   const items = Object.keys(obj).map((k) => {
 //     if(obj[k] instanceof Object) {
 //        toGqlObjectCorrect(obj[k]); 
 //       console.log("------------------------------------------------------")  
 //     }
 //        /**num1 = value.indexOf('"');
 //      num3 = value.substring(num2).indexOf('"');
 //     num4 = value.substring(num3).indexOf('"');
 //     key */
 
 //     return(`${k}: ${JSON.stringify(obj[k])}`);
 //   });
 //   return("\n{" + items.join("\n") + "\n}\n");
 // }
 //Figure out method to access the nested JSON key-value pairs!!!!!
 
 
 
 /**
  * Deletes the users temporary access Crdentials from the server.
  * This will require you to make new credentials for the next edit 
  * you make to your account.
  * The server is specified in the baseUrl parameter of ../config.json
  * The function will print out "{ success: true }" if the credentials
  * were successfully deleted.
  * @param {Object} credential the access keys to be deleted
  */
 export async function deleteCredentials(credential) {
   const endpoint = getConfigElement('baseUrl') + '/v2/auth/sign_out';//CHANGE TO "sign_out"!!!!!!!!!!!!!!!!!
   const response = await fetch( endpoint,
     { method: "DELETE",
       headers: {"content-type": "application/json"},
       body: JSON.stringify(credential) });
   
       const newData = await response.json( );
 }
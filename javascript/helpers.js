// If using node, be sure to install and require node-fetch.
// Example tested with node version 14.16.0
// If "type": "module" does *not* appear in package.json
// const fetch = require("node-fetch");
// If type is set to module in package.json
import fetch from 'node-fetch';
import fs from 'fs';

function getFileContents(filename) {
  var contents;
  try {
    contents = fs.readFileSync(filename, 'utf8');
  } catch (err) {
    console.error(err)
  }
  return(contents);
}
function getConfigElement(elementName) {
  const config = JSON.parse(getFileContents('../config.json'));
  return(config[elementName]);
}

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
  const credential = { 'access-token': response.headers.get('access-token'),
                        'client':       response.headers.get('client'),
                        'uid':          response.headers.get('uid') };
  return(credential);
}

export const getGraphqlEndpoint = () => {
  return(getConfigElement('baseUrl') + '/v2/graphql');
}

export const getData = (filename) => {
  return(JSON.parse(getFileContents(filename)));
}

export const toGqlObject = (obj) => {
  const items = Object.keys(obj).map((k) => {
    return(`${k}: ${JSON.stringify(obj[k])}`)
  });
  return("\n{" + items.join("\n") + "\n}\n");
}

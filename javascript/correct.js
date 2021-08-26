//This import increases functionality to interact with the file system
import fs from 'fs';

//import our team's helper methods from the file helpers.js
import { getCredential, getGraphqlEndpoint, getData, toGqlObject, deleteCredentials } from './helpers.js'

/**
 * Using graphql-request from
 * https://github.com/prisma-labs/graphql-request
 * Example tested with node version 14.16.0
 */
import { GraphQLClient, gql } from 'graphql-request'


/**
 * Build the GraphQL mutation for correcting statements.
 * @param {array} corrections An array of corrections (parts of statements)  
 *   to update certain statements with.
 * @return {string} The full GraphQL update mutation.
 */

function buildMutation(corrections) {
//work out kinks in mapping a nested JSON file 

  const data = `
  mutation {
    updateF1099necStatements(
      statements: [ ${corrections.map((s) => {return(toGqlObject(s))}).join("\n")}
      ]
    ) {
      statements {
        recordNumber
        statement {
          otxId
          uploaderId
          nonemployeeComp
          recipientCity
          recipientZipCode
        }
        messages
      }
      errors
    }
  }     
  `
  return(data);
}


/**
 * Perform the work to get the access credentials and to read the JSON file 
 * into JS objects.
 * format the corrections into GraphQL syntax
 * and then send them to the server. 
 * Return the uploaded data to a manipulatable String with the updated data.
 */

async function main() {
  
  const credential = await getCredential();
  const corrections = getData('../data/f1099nec-corrections.json', 'utf8');
  const endpoint = getGraphqlEndpoint();
  const graphQLClient = new GraphQLClient(endpoint, { headers: credential });
  const mutation = gql`${buildMutation(corrections)}`;
  const response = await graphQLClient.request(mutation);
 
  /**
   * response is a JS object that you can manipulate to suit your needs.
   * Here we're just going to print it.
   */
  console.log(JSON.stringify(response,' ', '  '));

  /**
   * Delete User Credentials: delete the access keys from the server, this is
   * good security practice to limit access to the user's Tax files
   */
  await deleteCredentials(credential);
  console.log('Credentials Successfully Deleted')
}

main().catch((error) => console.error(error));


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
 * Build the GraphQL mutation for getting the statements from the server.
 * @param {array} uploaderIds array of statement ID's to retrieve those statements
 * @return {string} The full GraphQL get query mutation.
 */

function buildMutation(uploaderIds) {
  const data = `
  mutation {
    submitStatements(
      uploaderIds:  [${uploaderIds.map(D => {return('\"' + D + '\"')})}]
    ) {
      errors
      successCount
    }
  }
  `
  return(data);
}


/**
 * Perform the work to get the access.
 * format the ID's into GraphQL query syntax
 * and then send the query to the server and recieve the tax statements
 * for the user to visulally look through after parsing th
 */

async function main() {
  
  const credential = await getCredential();
  // Uploader IDs are provided by the user who uploads the statement.
  //See ../data/f1099nec-data.json
  var uploaderIds = ['23911','23912','23913','23914','23915'];
  const endpoint = getGraphqlEndpoint();
  const graphQLClient = new GraphQLClient(endpoint, { headers: credential });
  const mutation = gql`${buildMutation(uploaderIds)}`;
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


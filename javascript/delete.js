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
 * Build the GraphQL mutation for deleting statements.
 * @param {array} corrections An array of Uploader ID's of statements to dlete
 * @return {string} The full GraphQL delete mutation.
 */

function buildMutation(uploaderIds) {
  const data = `
    mutation {
      deleteStatements(
        uploaderIds: [${uploaderIds.map(D => {return('\"' + D + '\"')})}]
      ) {
        errors
        deleteCount
      }
    }
  `
  return(data);
}


/**
 * Perform the work to get the access credentials.
 * format the IDs into GraphQL query syntax
 * and then send it to the server to delete the statements.
 * Return the confirmation data to give user success or failiure update.
 */

async function main() {
  
  const credential = await getCredential();
  const endpoint = getGraphqlEndpoint();
  var uploaderIds = ['23913'];
  const graphQLClient = new GraphQLClient(endpoint, { headers: credential });
  const mutation = gql`${buildMutation(uploaderIds)}`;
  const response = await graphQLClient.request(mutation);
 
  /**
   * Print out of server response of conformation that data was deleted,
   * or errors if any occured
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


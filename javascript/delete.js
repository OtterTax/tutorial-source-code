// Import fs so we can read and write files.
import fs from 'fs';

// Import global helper methods
import { getCredential, getGraphqlEndpoint, getData, toGqlObject, deleteCredentials } from './helpers.js'

/*
 * Using graphql-request from
 * https://github.com/prisma-labs/graphql-request
 * Example tested with node version 14.16.0
 */
import { GraphQLClient, gql } from 'graphql-request'

/**
 * Build the GraphQL mutation for deleting statements.
 * @param {array} uploaderIds An array of Uploader IDs of statements to delete.
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
 * Format the IDs into GraphQL syntax, send the mutation to the server
 * to delete the statements, and display the result for the user to review.
 */
async function main() {
  const credential = await getCredential();
  const endpoint = getGraphqlEndpoint();
  var uploaderIds = ['23913'];
  const graphQLClient = new GraphQLClient(endpoint, { headers: credential });
  const mutation = gql`${buildMutation(uploaderIds)}`;
  const response = await graphQLClient.request(mutation);

  /*
   * Print out of server response of conformation that data was deleted,
   * or errors if any occured.
   */
  console.log(JSON.stringify(response,' ', '  '));

  /*
   * Credentials are valid for several days after they've been issued.
   * If you plan to do more work, you can use the same credential.  When done 
   * working, you should delete the credential to provide additional security.
   */
  await deleteCredentials(credential);
  console.log('Credentials Successfully Deleted')
}

main().catch((error) => console.error(error));

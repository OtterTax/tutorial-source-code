/* 
 * Import fs so we can read and write files.
 */
import fs from 'fs';

/*
 * Import global helper methods.
 */
import { getCredential, getGraphqlEndpoint, getData, toGqlObject, deleteCredentials } from './helpers.js'

/*
 * Using graphql-request from
 * https://github.com/prisma-labs/graphql-request
 * Example tested with node version 14.16.0
 */
import { GraphQLClient, gql } from 'graphql-request'

/*
 * Build a GraphQL mutation for submitting statements to the IRS.
 * Statements in the sandbox system are not submitted to the IRS; the
 *  mutation is provided for testing purposes only.} uploaderIds 
 */




/**
 * Build the GraphQL mutation for submitting statements finalized in the server.
 * @param {array} uploaderIds array of statement ID's of statements to submit
 * @return {string} The full GraphQL submit query mutation.
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
 * Get the access credentials.
 * Format the ID's into GraphQL query syntax.
 * Then send the query to the server to submit the statements.
 */
async function main() {
  const credential = await getCredential();
 /*
  * Uploader IDs are provided by the user who uploads the statement.
  * See ../data/f1099nec-data.json to see the ID's used there.
  */
  var uploaderIds = ['23911','23912','23913','23914','23915'];
  const endpoint = getGraphqlEndpoint();
  const graphQLClient = new GraphQLClient(endpoint, { headers: credential });
  const mutation = gql`${buildMutation(uploaderIds)}`;
  const response = await graphQLClient.request(mutation);

  /*
   * Printing out the server response of the status of the query.
   */
  console.log(JSON.stringify(response,' ', '  '));

  /*
   * Credentials are valid for several days after they've been issued.
   * If you plan to do more work, you can use the same credential.  When done 
   * working, you should delete the credential to provide additional security.
   */
  if (await deleteCredentials(credential)){
    console.log('Credentials Successfully Deleted');
  }
}

main().catch((error) => console.error(error));
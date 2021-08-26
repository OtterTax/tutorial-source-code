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
 * Build the GraphQL mutation for getting the statements from the server.
 * @param {array} uploaderIds An array of Uploader IDs of statements to retrieve.
 * @return {string} The full GraphQL get query for retrieveing statements.
 */
function buildMutation(uploaderIds) {
  const data = `
  query {
    getF1099necStatements(
        uploaderIds: [
          ${uploaderIds.map(D => {return('\"' + D + '\"')})}
        ]
    ) {
      errors
      statements {
        pageInfo {
          hasNextPage
        }
        nodes {
          otxId
          uploaderId
          statementValid
          validationMessages
          status
          statusDescription
        }
      }
    }
  }
  `
  return(data);
}

/**
 * Perform the work to get the statements.
 * Format the ID's into GraphQL query syntax, send the query to
 * the server, and display the result for the user to review.
 */
async function main() {
  const credential = await getCredential();
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

  /*
   * Credentials are valid for several days after they've been issued.
   * If you plan to do more work, you can use the same credential.  When done 
   * working, you should delete the credential to provide additional security.
   */
  await deleteCredentials(credential);
  console.log('Credentials Successfully Deleted')
}

main().catch((error) => console.error(error));

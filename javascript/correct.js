/* 
 * Import fs so we can read and write files.
 */
import fs from 'fs';

/*
 * Import global helper methods
 */
import { getCredential, getGraphqlEndpoint, getData, toGqlObject, deleteCredentials } from './helpers.js'

/*
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
 * Get the access credentials and read the JSON file 
 * into JS objects.
 * Format the corrections into GraphQL syntax.
 * Then send them to the server. 
 * Return the uploaded data to a manipulatable String with the updated data.
 */
async function main() {
  const credential = await getCredential();
  const corrections = getData('../data/f1099nec-corrections.json', 'utf8');
  const endpoint = getGraphqlEndpoint();
  const graphQLClient = new GraphQLClient(endpoint, { headers: credential });
  const mutation = gql`${buildMutation(corrections)}`;
  const response = await graphQLClient.request(mutation);

  /*
   * response is a JS object that you can manipulate to suit your needs.
   * Here we're just going to print it.
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


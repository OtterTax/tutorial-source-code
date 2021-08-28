/*
 * Import fs so we can read and write files.
 */
import fs from 'fs';

/*
 *  Import global helper methods
 */
import { getCredential, getGraphqlEndpoint, getData, toGqlObject, deleteCredentials } from './helpers.js'

/*
 * Using graphql-request from
 * https://github.com/prisma-labs/graphql-request
 * Example tested with node version 14.16.0
 */
import { GraphQLClient, gql } from 'graphql-request'


/**
 * Build the GraphQL mutation for adding new statements.
 * @param {array} statements An array of statements to add.
     Each statement in the array is an object.
 * @return {string} The full GraphQL add mutation.
 */
function buildMutation(statements) {
    const data = `
    mutation {
      addF1099necStatements(
        statements: [
          ${statements.map((s) => {return(toGqlObject(s))}).join("\n")}
        ]
      ) {
        errors
        statements {
          recordNumber
          statement {
            otxId
            uploaderId
            recipientFirstName
            recipientLastName
            tags
          }
          messages
        }
      }
    }
  `
  return(data);
}


/**
 * Get the access credentials and to read the JSON file 
 * containing statements into JS objects.
 * Format the statements into GraphQL syntax 
 * and then send them to the server. 
 * Return the uploaded data to a manipulatable String.
 */
async function main() {
  const credential = await getCredential();
  const statements = getData('../data/f1099nec-data.json', 'utf8');
  const endpoint = getGraphqlEndpoint();
  const graphQLClient = new GraphQLClient(endpoint, { headers: credential });
  const mutation = gql`${buildMutation(statements)}`;
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
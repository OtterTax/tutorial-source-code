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

/*
 * Build a GraphQL mutation for finalizing statements.
 * The mutation includes hard-coded bogus credit card information which was obtained from
 * https://fake-card-generator.com/
 * 
 * Credit card information is optional when finalizing statements in the sandbox system,
 * and it is ignored when it is supplied (i.e., there is no charge for finalizing statements
 * in the sandbox system).  Credit card information is supported in the sandbox system so 
 * that users can fully test the finalizeStatements mutation.
 * 
 * In the production system, the OtterTax watermark is removed from statements that have been
 * finalized, but the watermark is not removed in the sandbox system.
*/


/**
 * Build the GraphQL mutation for finalizing statements on the server.
 * @param {array} uploaderIds array of statement ID's to finalize.
 * @return {string} The full GraphQL finalize query mutation.
 */
function buildMutation(uploaderIds) {
  const data = `
  mutation {
    finalizeStatements(
      creditCard: {
        firstName: "Annalise"
        lastName: "Havemeyer"
        companyName: "Big Apple Analytics"
        address: "179 N. 13th Street, Suite 14C"
        city: "Brooklyn"
        state: "NY"
        zipCode: "11249"
        cardNumber: "371648189095315"
        cardExpiration: "0825"
        cvv: "3767"
      }
      uploaderIds: [${uploaderIds.map(D => {return('\"' + D + '\"')})}]
    ) {
      errors
      messages {
        messages
        otxId
        uploaderId
      }
      successCount
    }
  }
  `
  return(data);
}


/**
 * Get user access credentials.
 * Then format the ID's into GraphQL query syntax
 * and then send the query to the server to finalize the tax statements.
 * Recieve back the query update from the server.
 */
async function main() {
  const credential = await getCredential();
 /*
  * Uploader IDs are provided by the user who uploads the statement.
  * See ../data/f1099nec-data.json to see the ID's used there.
  */
  var uploaderIds = ['23913'];
  const endpoint = getGraphqlEndpoint();
  const graphQLClient = new GraphQLClient(endpoint, { headers: credential });
  const mutation = gql`${buildMutation(uploaderIds)}`;
  const response = await graphQLClient.request(mutation);

  /*
   * response is the query status update.
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
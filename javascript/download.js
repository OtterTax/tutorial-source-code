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


/**
 * Build the GraphQL mutation for getting the statements from the server.
 * @param {array} uploaderIds array of statement ID's to retrieve those statements
 * @return {string} The full GraphQL get query mutation.
 */
function buildMutation(uploaderIds) {
  const data = `
  query {
    getStatements(
      uploaderIds: [${uploaderIds.map(D => {return('\"' + D + '\"')})}]
    ) {
      errors
      statements {
        nodes {
          otxId
          uploaderId
          pdf
        }
      }
    }
  }
  `
  return(data);
}


/**
 * Get the access credentials.
 * Format the ID's of the statements you wish to download into GraphQL query syntax.
 * Then send the query to the server and recieve the PDF tax statements in
 * folder 'statements' with the name of the files "'uploaderID'.pdf".
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
  const statements = response.getStatements.statements.nodes;
  const statmentsDirectory = './statements';
  const folderName = 'statements';
  /*
   * First check if the folder "statements" exists, if it does not exist,
   *  it will create a new folder called "statements" and then download
   * the statement PDF's to the folder.
   */
  try {
    if (!fs.existsSync(folderName)) {
        fs.mkdirSync(folderName);
    }
  } catch (err) {
    console.error(err);
  }
  statements.forEach((statement) => {
    let filename = `${statmentsDirectory}/${statement.uploaderId}.pdf`;
    let buffer = Buffer.from(statement.pdf, 'base64');
    fs.writeFile(filename, buffer,{ flag: 'a' }, err => {
        if (err) {
            console.error(err)
            return
          }
    });
  })

  /**
   * If the files were successfully saved this will diplay a success message.
   * otherwise it will display the server response error message and write
   * 'There was an error downloading the statements'
   * This testing method is incomplete:
   *      1. does not check if individual files were downloaded
   *          only that the 'statements' folder exists.
   *      2. The server only responds with an error if none of the uploaderIds
   *          matched the data in the server, but if even 1 out of 5 match
   *          the server's records it will return the PDFs and not throw any error.
   */
  try {
    if (fs.existsSync(folderName)) {
      console.log(`Statements successfully downloaded to folder ${statmentsDirectory}`);
    }
  } catch (err) {
    console.log(`There was an error downloading the statements`);
    console.log(response);
  }
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
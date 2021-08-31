/*
 * Import fs so we can read and write files.
 */
import fs from 'fs';

/*
 * Import global helper methods.
 */
import { getCredential, getGraphqlEndpoint, getData, toGqlObject, deleteCredentials, downloadSuccessChecker} from './helpers.js'

/*
 * Using graphql-request from
 * https://github.com/prisma-labs/graphql-request
 * Example tested with node version 14.16.0
 */
import { GraphQLClient, gql } from 'graphql-request'


/**
 * Build the GraphQL mutation for getting the PDF's from the server.
 * @param {array} uploaderIds array of statement ID's to retrieve their PDF statements
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
  const statementsDirectory = './statements';
  const folderName = 'statements';
  /*
   * First check if the folder "statements" exists, if it does not exist,
   * it will create a new folder called "statements" and then download
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
    let filename = `${statementsDirectory}/${statement.uploaderId}.pdf`;
    let buffer = Buffer.from(statement.pdf, 'base64');
    fs.writeFile(filename, buffer,{ flag: 'a' }, err => {
        if (err) {
            console.error(err)
            return
          }
    });
  })

  /*
   * If the files were successfully saved this will diplay a success message.
   * otherwise it will display an error message and write
   * 'There was an error downloading the statements' and the number of files
   * downloaded out of the amount that were supposed to download.
   * 
   * NOTE: the error was probably a wrong statement ID, the server will
   * silently ignore the query for that statement if it can not find the
   * file in the system.
   * Please check to make sure all file ID's are accurate.
   */
  /*
   * This will send the server response and user-inputed ID's to the checker method
   * to inquire if any statements were not printed.
   */
  var notDownloaded =  downloadSuccessChecker(statements, uploaderIds);
  if(notDownloaded.length == 0){
    console.log('All Statements have successfuly downloaded.\n')
  }else{
    console.log(`There was an error downloading your statements: \n  
     ONLY ${(uploaderIds.length - notDownloaded.length)} of ${uploaderIds.length} statements have been printed. \n
         Please check the Id's to make sure the following files ID's are correct:\n
          ${JSON.stringify(notDownloaded, "\t", '\n\t\t')} \nThe ${uploaderIds.length - notDownloaded.length} statement(s) have downloaded to ${statementsDirectory} folder.\n`);
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
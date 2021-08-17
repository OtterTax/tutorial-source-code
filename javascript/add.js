import fs from 'fs';
import { getCredential, getGraphqlEndpoint, getData, toGqlObject } from './helpers.js'
import { GraphQLClient, gql } from 'graphql-request'

function buildMutation(statements) {
  const mutation = `
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
  return(mutation);
}

async function main() {
  const credential = await getCredential();
  const statements = getData('../data/f1099nec-data.json', 'utf8');
  const endpoint = getGraphqlEndpoint();

  const graphQLClient = new GraphQLClient(endpoint, { headers: credential });
  const mutation = gql`${buildMutation(statements)}`;

  const data = await graphQLClient.request(mutation);
  // data is an object that you can manipulate to suit your needs.
  // Here we're just going to print it.
  console.log(JSON.stringify(data));
}

main().catch((error) => console.error(error));

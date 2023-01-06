package main

import (
  "fmt"
  "net/http"
  "encoding/json"
  "bytes"
  "io/ioutil"
)

func buildQuery(uploaderIds []string) string {
  query := fmt.Sprintf(`
    query {
      getF5498Statements(
        uploaderIds: [
          %s
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
						recipientFirstName
						recipientLastName
						recipientTin
						recipientTinType
						recipientAddress1
						recipientAddress2
						recipientCity
						recipientState
						recipientZipCode
						senderName
						senderTin
						senderAddress1
						senderCity
						senderState
						senderZipCode
						lateContributionCode
						lateContributionYear
						ira
						roth
          }
        }
      }
    }      
  `, formatIds(uploaderIds) )
  return(query)
}

func postGql(gql string, credential Credential) CheckResponse {
  endpoint := getGraphqlEndpoint()
  bodyReader := bytes.NewReader([]byte(formatForBody(gql)))

  req, _ := http.NewRequest(http.MethodPost, endpoint, bodyReader)
  req.Header.Set("Content-Type", "application/json")
  req.Header.Set("access-token", credential.accessToken)
  req.Header.Set("client", credential.client)
  req.Header.Set("uid", credential.uid)
  res, _ := http.DefaultClient.Do(req)
  body, _ := ioutil.ReadAll(res.Body)
  var result CheckResponse
  json.Unmarshal(body, &result)
  return(result)
}

func main() {
	credential := getCredential()
	// See the file ../data/f1098e-data.json for statement data and format.
	uploaderIds := []string{"6733766","6733767","6733768","6733769","6733710"}
	query := buildQuery(uploaderIds)
	response := postGql(query, credential)
  // response is an CheckResponse structure that you can manipulate
  // to suit your needs.  See structures.go for the format.
  // Here we're just going to print it (as a JSON object to make it
  // easier to read).
	formattedResponse, _ := json.MarshalIndent(response, "", "  ")
	fmt.Println(string(formattedResponse))
  // Credentials are valid for several days after they've been issued.
  // If you plan to do more work, you can use the same credential.  When done 
  // working, you should delete the credential to provide additional security.
  if del := deleteCredential(credential); del == true {
  	fmt.Println("\nSuccessfully deleted credential.")
  }
}

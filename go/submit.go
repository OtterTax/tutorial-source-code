package main

import (
  "fmt"
  "net/http"
  "encoding/json"
  "bytes"
  "io/ioutil"
)

func buildMutation(uploaderIds []string) string {
  mutation := fmt.Sprintf(`
    mutation {
      submitStatements(
        uploaderIds: [ %s ]
      ) {
        messages{
          messages
          uploaderId
        }
        errors
        successCount
      }
    }
  `, formatIds(uploaderIds) )
  return(mutation)
}

func postGql(gql string, credential Credential) SubmitResponse {
  endpoint := getGraphqlEndpoint()
  bodyReader := bytes.NewReader([]byte(formatForBody(gql)))

  req, _ := http.NewRequest(http.MethodPost, endpoint, bodyReader)
  req.Header.Set("Content-Type", "application/json")
  req.Header.Set("access-token", credential.accessToken)
  req.Header.Set("client", credential.client)
  req.Header.Set("uid", credential.uid)
  res, _ := http.DefaultClient.Do(req)
  body, _ := ioutil.ReadAll(res.Body)
  var result SubmitResponse
  json.Unmarshal(body, &result)
  return(result)
}

func main() {
	credential := getCredential()
	// See the file ../data/f1098e-data.json for statement data and format.
	uploaderIds := []string{"6733766","6733767","6733768","6733769","6733710"}
	query := buildMutation(uploaderIds)
	response := postGql(query, credential)
  // response is an SubmitResponse structure that you can manipulate
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

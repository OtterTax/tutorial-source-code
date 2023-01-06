package main

import (
  "fmt"
  "net/http"
  "encoding/json"
  "bytes"
  "io/ioutil"
  "encoding/base64"
)

func buildMutation(uploaderIds []string) string {
  query := fmt.Sprintf(`
    query {
      getStatements(
        uploaderIds: [ %s ]
      ) {
        errors
        statements {
          nodes {
            uploaderId
            pdf
          }
        }
      }
    }
  `, formatIds(uploaderIds) )
  return(query)
}

func postGql(gql string, credential Credential) DownloadResponse {
  endpoint := getGraphqlEndpoint()
  bodyReader := bytes.NewReader([]byte(formatForBody(gql)))

  req, _ := http.NewRequest(http.MethodPost, endpoint, bodyReader)
  req.Header.Set("Content-Type", "application/json")
  req.Header.Set("access-token", credential.accessToken)
  req.Header.Set("client", credential.client)
  req.Header.Set("uid", credential.uid)
  res, _ := http.DefaultClient.Do(req)
  body, _ := ioutil.ReadAll(res.Body)
  var result DownloadResponse
  json.Unmarshal(body, &result)
  return(result)
}

func main() {
	credential := getCredential()
	// See the file ../data/f1098e-data.json for statement data and format.
  uploaderIds := []string{"6733766","6733767","6733768","6733769","6733710"}
	mutation := buildMutation(uploaderIds)
	response := postGql(mutation, credential)
  stmts := response.Data.GetStatements.Statements.Nodes
  len := len(stmts)
  downloadDirectory := "./statement_downloads"
  for i := 0 ; i < len ; i++ {
    stmt :=stmts[i]
    fileName := fmt.Sprintf("%s/stmt-%s.pdf", downloadDirectory, stmt.UploaderId)
    data, _ := base64.StdEncoding.DecodeString(stmt.Pdf)
    ioutil.WriteFile(fileName, []byte(data), 0644)
  }
  fmt.Printf( "\nStatements successfully downloaded to %s.\n", downloadDirectory )
  // Credentials are valid for several days after they've been issued.
  // If you plan to do more work, you can use the same credential.  When done 
  // working, you should delete the credential to provide additional security.
  if del := deleteCredential(credential); del == true {
  	fmt.Println("Successfully deleted credential.")
  }
}

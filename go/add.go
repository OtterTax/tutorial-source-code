package main

import (
  "fmt"
  "os"
  "net/http"
  "encoding/json"
  "bytes"
  "io/ioutil"
  "strings"
  "reflect"
)

func buildMutation(statements []F5498Statement) string {
  mutation := fmt.Sprintf(`
    mutation {
      addF5498Statements(
        statements: [
          %s
        ]
      ) {
        errors
        statements {
          recordNumber
          statement {
            uploaderId
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
          messages
        }
      }
    }
  `, gqlFormat(statements) )
  return(mutation)
}

func getStatements() []F5498Statement {
  fileContents, _ := os.ReadFile("../data/f5498-data.json")
  var bytes = []byte(fileContents)
	var statements []F5498Statement
	json.Unmarshal(bytes, &statements)
	return(statements)
}

func postGql(gql string, credential Credential) AddResponse {
  endpoint := getGraphqlEndpoint()
  bodyReader := bytes.NewReader([]byte(formatForBody(gql)))

  req, _ := http.NewRequest(http.MethodPost, endpoint, bodyReader)
  req.Header.Set("Content-Type", "application/json")
  req.Header.Set("access-token", credential.accessToken)
  req.Header.Set("client", credential.client)
  req.Header.Set("uid", credential.uid)
  res, _ := http.DefaultClient.Do(req)
  body, _ := ioutil.ReadAll(res.Body)
  var result AddResponse
  json.Unmarshal(body, &result)
  // Cast a wide net to catch GraphQL errors.
  // You'll want to do something more sophisticated in production.
	if res.StatusCode != 200 || result.Data.AddF5498Statements.Statements == nil {
		fmt.Printf("GraphQL error adding statements.\nStatus code %d.\n", res.StatusCode)
		fmt.Printf("Headers:\n")
  	for headerName, headerValue := range res.Header {
		  fmt.Printf("  %s = %s\n", headerName, strings.Join(headerValue, ", "))
		}
	  fmt.Println(string(body))
	}
  return(result)
}

func gqlFormat(statements []F5498Statement) string {
	var builder strings.Builder
	for i := 0; i < len(statements); i++ {
		statement := statements[i]
		fields := reflect.TypeOf(statement)
		values := reflect.ValueOf(statement)
		builder.WriteString("{\n")

		for j := 0; j < fields.NumField(); j++ {
			name := camelCase(fields.Field(j).Name)
			val := values.Field(j)
			// Handle simple cases when data consists of strings, ints and bools.
			// More sophisticated data handing will be required in production.
			var formattedVal string
			switch val.Kind() {
			case reflect.String:
				if val.String() == "" {
					continue
				}
				formattedVal = fmt.Sprintf("\"%s\"", val.String())
			case reflect.Int:
				if val.Int() == 0 {
					continue
				}
				formattedVal = fmt.Sprintf("%d", val.Int())
			case reflect.Bool:
				formattedVal = fmt.Sprintf("%t", val.Bool())
			default:
				fmt.Printf("Cannot determine data type for structure member %s", name)
			}
			builder.WriteString(fmt.Sprintf("  %s: %s\n", name, formattedVal))
		}
		builder.WriteString("}\n")
	}
	return(builder.String())
}

func main() {
	credential := getCredential()
	// See the file ../data/f5498-data.json for statement data and format.
	statements := getStatements()
	mutation := buildMutation(statements)
	response := postGql(mutation, credential)
  // response is an AddResponse structure that you can manipulate
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

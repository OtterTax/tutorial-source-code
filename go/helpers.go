package main

import (
  "fmt"
  "os"
  "log"
  "net/http"
  "encoding/json"
  "bytes"
  "io/ioutil"
  "strings"
  "errors"
)

func getCredential() Credential {
  var endpoint = fmt.Sprintf("%s/v2/auth/sign_in", getBaseURL())
  var jsonBody = fmt.Sprintf("{\"email\": \"%s\", \"password\": \"%s\"}",
                 getEmail(), getPassword())
  var bodyReader = bytes.NewReader([]byte(jsonBody))
  
  req, _ := http.NewRequest(http.MethodPost, endpoint, bodyReader)
  req.Header.Set("Content-Type", "application/json")
  res, _ := http.DefaultClient.Do(req)
  credential := Credential{
    accessToken: res.Header["Access-Token"][0],
    client:      res.Header["Client"][0],
    uid:         res.Header["Uid"][0] }
  return(credential)
}

func deleteCredential(credential Credential) bool {
  var endpoint = fmt.Sprintf("%s/v2/auth/sign_out", getBaseURL())

  req, _ := http.NewRequest(http.MethodDelete, endpoint, nil)
  req.Header.Set("Content-Type", "application/json")
  req.Header.Set("access-token", credential.accessToken)
  req.Header.Set("client", credential.client)
  req.Header.Set("uid", credential.uid)
  res, _ := http.DefaultClient.Do(req)
  body, _ := ioutil.ReadAll(res.Body)
  success := false
  if res.StatusCode == 200 {
    var result LogoutResponse
    json.Unmarshal(body, &result)
    if result.Success == true {
      success = true
    } 
  } else {
    fmt.Printf("Logout failed:\n%s\n", string(body))
  }
  return(success)
}

func getBaseURL() string {
  var config Config = getConfig()
  return(config.BaseURL)
}

func getGraphqlEndpoint() string {
  return(getBaseURL() + "/v2/graphql")
}

func getEmail() string {
  var config Config = getConfig()
  return(config.LoginData.Email)
}

func getPassword() string {
  var config Config = getConfig()
  return(config.LoginData.Password)
}

func getConfig() Config {
  if !fileExists("../config.json") {
    fmt.Println("No configuration file found." )
    fmt.Println( "Run 'setup.go' to create one." )
    fmt.Println( "Or use '../config.json.example' as a sample to build it from scratch." )
    log.Fatal("Cannot continue.")
  }

  fileContents, _ := os.ReadFile("../config.json")
  var configBytes = []byte(fileContents)
  var config Config
  json.Unmarshal(configBytes, &config)
  return(config)
}

func formatForBody(rawGql string) string {
  gql  := strings.Replace(rawGql, "\"", "\\\"", -1)
  gql = strings.Replace(gql, "\n", " ", -1)
  gql = strings.Replace(gql, "\t", " ", -1)
  body := fmt.Sprintf("{\"query\": \"%s\"}", gql)
  return(body)
}

func camelCase(input string) string {
  firstChar := strings.ToLower(string(input[0]))
  return(firstChar + input[1:])
}

func formatIds(ids []string) string {
  var builder strings.Builder
  len := len(ids)
  for i := 0 ; i < len ; i++ {
    builder.WriteString(fmt.Sprintf("\"%s\"", ids[i]))
    if i < (len - 1) {
      builder.WriteString(",")
    }
  }
  return(builder.String())
}

func fileExists(fileName string) bool {
  if _, err := os.Stat(fileName); errors.Is(err, os.ErrNotExist) {
    return(false)
  } else {
    return(true)
  }
}

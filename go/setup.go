package main

import (
  "fmt"
  "os"
  "os/exec"
  "runtime"
  "regexp"
  "strings"
  "bytes"
  "io/ioutil"
  "net/http"
  "encoding/json"
)

// Global variables
var configFileName = "../config.json"
var responseRegex = regexp.MustCompile("^y(?:es)?$")
var responseRegexWithDefault = regexp.MustCompile("(?:^$)|(?:^y(?:es)?$)")
var baseUrl = ""
var otxPassword = ""
var registrationConfirmed = false
var configFileWritten = false

func clearScreen() {
	opsys := runtime.GOOS
	if opsys == "linux" || opsys == "Windows" {
		var cmd *exec.Cmd
		if opsys == "linux" {
			cmd = exec.Command("clear")
		} else {
			cmd = exec.Command("cmd", "/c", "cls")
		}
		cmd.Stdout = os.Stdout
		cmd.Run()
	}
}

func printIntroduction() {
  text := "This program helps with two tasks that must be completed \n" +
          "before running the demo programs.  First, it confirms your\n" +
          "registration, and second, it creates a configuration file\n" +
          "with your login information.\n" +
          "Either of these tasks can also be completed by hand, so\n" +
          "both are optional."
  clearScreen()
  fmt.Println(text)
  fmt.Printf("Press enter to continue. ")
  var response string
  fmt.Scanln(&response)
}

func confirmRegistration() {
  text := "Would you like to confirm your registration?\n" +
          "To confirm your registration, you must first complete the\n" +
          "registration process to create an account.\n" +
          "To register for the OtterTax sandbox, go to\n" +
          "https://sandbox.ottertax.com/register."
  clearScreen()
  fmt.Println(text)
  fmt.Printf( "Confirm registration? [Y]: " )
  var response string
  fmt.Scanln(&response)
  if responseRegexWithDefault.Match([]byte(strings.ToLower(response))) {
  	doConfirm()
  	registrationConfirmed = true
  }
}

func doConfirm() {
	if baseUrl == "" {
		setBaseUrl()
	}
	if otxPassword == "" {
		setPassword(true)
	}
	token := getConfirmationToken()
	mutation := buildConfirmationMutation(token)
	postRegistrationConfirmation(mutation)
}

func setBaseUrl() {
	text := "\nAvailable environments:\n" +
	        "  1. Sandbox\n" +
	        "  2. Production\n" +
	        "Select the environment you will be using [1]: "
  fmt.Printf(text)
  var response string
  fmt.Scanln(&response)
  if response == "" || response == "1" {
  	baseUrl = "https://sandbox.ottertax.com"
  } else if response == "2" {
  	baseUrl = "https://api.ottertax.com"
  } else {
  	fmt.Println("Invalid environment.  Exiting.")
  	os.Exit(1)
  }
}

func setPassword(newPassword bool) {
	var text string
  if newPassword == true {
    text = "\nEnter the password you will use to access OtterTax.\n" +
           "Please choose a secure password of at least 20 characters.\n" +
           "YOUR PASSWORD WILL BE DISPLAYED AS YOU TYPE.\n" +
           "Your password: "
  } else {
    text = "\nEnter your OtterTax password.\n" +
           "YOUR PASSWORD WILL BE DISPLAYED AS YOU TYPE.\n" +
           "Your password: "
  }
  fmt.Printf(text)
  var response string
  fmt.Scanln(&response)
  otxPassword = response
}

func getConfirmationToken() string {
  text := "\nEnter the confirmation token from the email you received\n" +
         "after registering: "
  fmt.Printf(text)
  var response string
  fmt.Scanln(&response)
  return(response)
}

func getEmailAddress() string {
  text := "\nEnter the email address you used when you registered with\n" +
          "OtterTax.\nYour email address: "
  fmt.Printf(text)
  var response string
  fmt.Scanln(&response)
  return(response)
}

func buildConfirmationMutation(token string) string {
	mutation := fmt.Sprintf(`
    mutation {
    confirmRegistration(
      confirmationToken: "%s",
      password: "%s"
    ) {
        message
      }
    }
	`, token, otxPassword )
	return(mutation)
}

func postRegistrationConfirmation(mutation string) {
	endpoint := fmt.Sprintf("%s/v2/graphql", baseUrl)
  bodyReader := bytes.NewReader([]byte(formatForBody(mutation)))

  req, _ := http.NewRequest(http.MethodPost, endpoint, bodyReader)
  req.Header.Set("Content-Type", "application/json")
  res, _ := http.DefaultClient.Do(req)
  body, _ := ioutil.ReadAll(res.Body)
  var result ConfirmRegistrationResponse
  json.Unmarshal(body, &result)

  successMessage := "Registration confirmation succeeded. " +
                    "You can log in and begin processing statements."
  if result.Data.ConfirmRegistration.Message == successMessage {
  	fmt.Printf("\nRegistration confirmation succeeded. Press enter to continue. ")
  	var response string
  	fmt.Scanln(&response)
  } else {
  	if result.Data.ConfirmRegistration.Message != "" {
  		fmt.Println(result.Data.ConfirmRegistration.Message)
  	} else {
	  	fmt.Println(string(body))
	  }
  	fmt.Println("\nRegistration failed.  Please correct the error above and try again.")
  	os.Exit(1)
  }
}

func writeConfigFile() {
  text := "All of the sample code in this directory requires a\n" +
          "configuration file in the parent directory\n" +
          "(../config.json). You can create the file by hand by\n" +
          "using ../config.json.example as an example or you can\n" +
          "have this program create it for you."
  clearScreen()
  fmt.Println(text)
  fmt.Printf( "Create configuration file? [Y]: " )
  var response string
  fmt.Scanln(&response)
  if responseRegexWithDefault.Match([]byte(strings.ToLower(response))) {
  	doWrite()
  }
}

func doWrite() {
	write := true
	msg := ""
	if fileExists(configFileName) {
		fmt.Printf("\nConfiguration file exists.  Overwrite? [N]: ")
		var response string
		fmt.Scanln(&response)
		if !responseRegex.Match([]byte(strings.ToLower(response))) {
			write = false
			msg = "Not modifying existing configuration file."
		}
	}
	if write == true {
		if baseUrl == "" {
			setBaseUrl()
		}
		emailAddress := getEmailAddress()
		if otxPassword == "" {
			setPassword(true)
		}
		var config = new(Config)
		config.BaseURL = baseUrl
		config.LoginData.Email = emailAddress
		config.LoginData.Password = otxPassword

		var builder strings.Builder
		formattedConfig, _ := json.MarshalIndent(config, "", "  ")
		builder.WriteString(string(formattedConfig))
		builder.WriteString("\n")
		ioutil.WriteFile(configFileName, []byte(builder.String()), 0600)
		msg = "Configuration file was created."
  	configFileWritten = true
	}
	fmt.Printf("\n%s  Press enter to continue. ", msg)
  fmt.Scanln()
}

func reportResults() {
	clearScreen()
	fmt.Println("Setup complete.")
	if registrationConfirmed == true {
		fmt.Println("Registration was confirmed.")
	} else {
		fmt.Println("Registration was not confirmed.")
	}
	if configFileWritten == true {
		fmt.Println("Configuration file was created.")
	} else {
		fmt.Println("Configuration file was not created.")
	}
}


func main() {
	printIntroduction()
	confirmRegistration()
	writeConfigFile()
	reportResults()
}

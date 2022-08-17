import { question } from 'readline-sync';
import { GraphQLClient, gql } from 'graphql-request';
import fs from 'fs';

/** The setup object.
 *  @constructor
 */
class Setup {
  constructor() {
    this.configFileName = '../config.json';
    this.responseRegex = /^y(?:es)?$/
    this.responseRegexWithDefault = /(?:^$)|(?:^y(?:es)?$)/
    this.waitForEnterOptions = {hideEchoBack: true, mask: ''}
    this.environments = { '1': ['Sandbox','https://sandbox.ottertax.com'],
                          '2': ['Production','https://api.ottertax.com'] }
  }
  /**
   * Run the main methods required to complete the setup.
   * No other methods need to be called directly.
   */
  setup() {
    this.printIntroduction();
    this.confirmRegistrationIfUserChooses();
    this.writeConfigFileIfUserChooses();
    this.reportResults();
    return;
  }

  /**
    * Provide the user with a brief summary of what the setup will do.
    */
  printIntroduction() {
    const text = "This program helps with two tasks that must be completed\n" +
                 "before running the demo programs.  First, it confirms your\n" +
                 "registration, and second, it creates a configuration file\n" +
                 "with your login information.\n" +
                 "Either of these tasks can also be completed by hand, so\n" +
                 "both are optional.\n\nPress enter to continue. "
    console.clear();
    question(text, this.waitForEnterOptions);
  }
  /**
   * Provide the user with information about registration confirmation.
   * Ask the user if they want to confirm their registration and
   * call the confirmRegistration method if the answer is yes.
   */
  confirmRegistrationIfUserChooses() {
    const text = "Would you like to confirm your registration?\n" +
                 "To confirm your registration, you must first complete the\n" +
                 "registration process to create an account.\n" +
                 "To register for the OtterTax sandbox, go to\n" +
                 "https://sandbox.ottertax.com/register." +
                 "\n\nConfirm registration? [Y]: "
    console.clear();
    const response = question(text).toLowerCase();
    if(response.match(this.responseRegexWithDefault)) {
      this.confirmRegistration();
    } else {
      this.registrationConfirmed = false;
    }
  }
  /**
   * Provide the user with information about creating the configuration file.
   * Ask the user if they want to create the configuration file and
   * call the writeConfigFile method if the answer is yes.
   */
  writeConfigFileIfUserChooses() {
    const text = "All of the sample code in this directory requires a\n" +
                 "configuration file in the parent directory\n" +
                 "(../config.json). You can create the file by hand by\n" +
                 "using ../config.json.example as an example or you can\n" +
                 "have this program create it for you." +
                 "\n\nCreate configuration file? [Y]: "
    console.clear();
    const response = question(text).toLowerCase();
    if(response.match(this.responseRegexWithDefault)) {
      this.writeConfigFile();
    } else {
      this.configFileCreated = false;
    }
  }
  /**
   * Report the actions taken to the user.
   */
  reportResults() {
    const text = "Setup complete.\n" +
                 ("Registration was " + (this.registrationConfirmed ? "" : "not ") + "confirmed.\n") +
                 ("Configuration file was " + (this.configFileCreated ? "" : "not ") + "created.\n")
    console.clear();
    console.log(text);
  }
  /**
   * Confirm the user's registration.
   * This method delegates work to other methods, the most important of which
   * is postRegistrationConfirmation. See that method for more information about
   * its operation.
   */
  async confirmRegistration() {
    this.graphqlEndpoint = this.graphqlEndpoint || this.getGraphqlEndpoint();
    this.password = this.password || this.getPassword(true);
    const token = this.getConfirmationToken();
    const serverResponse = await this.postRegistrationConfirmation(this.password, token);
    const successMessage = 'Registration confirmation succeeded. ' +
                           'You can log in and begin processing statements.';
    const message = serverResponse.confirmRegistration.message;
    if(message === successMessage) {
      this.registrationConfirmed = true;
      const text = "\nRegistration confirmation succeeded. Press enter to continue. "
      question(text, this.waitForEnterOptions);
    } else {
      console.log(JSON.stringify(serverResponse));
      console.log('Registration failed.  Please correct the error above and try again.');
      process.exit();
    }
  }
  /**
   * Write the configuration file.
   * If the file already exists, confirm that the user wants to overwrite it first.
   */
  writeConfigFile() {
    let write = true;
    let msg = null;
    if (fs.existsSync(this.configFileName)) {
      const text = "\nConfiguration file exists. Overwrite? [N]: "
      const response = question(text).toLowerCase();
      if(!response.match(this.responseRegex)) {
        write = false;
        msg = "Not modifying existing configuration file.";
      }
    }
    if(write) {
      this.graphqlEndpoint = this.graphqlEndpoint || this.getGraphqlEndpoint();
      const emailAddress = this.getEmailAddress();
      this.password = this.password || this.getPassword();
      const config = { 'baseUrl': this.graphqlEndpoint,
                       'loginData': { 'email':    emailAddress,
                                      'password': this.password } }
      const formattedConfig = JSON.stringify(config, null, 2) + "\n";
      fs.writeFile(this.configFileName, formattedConfig, function(err) {
        if(err) return(console.log(err));
      });
      msg = "Configuration file was created.";
      this.configFileCreated = true;
    }
    const text = `\n${msg} Press enter to continue. `;
    question(text, this.waitForEnterOptions);
  }
  /**
   * Get the base GraphQL endpoint that corresponds to the environment that the user wishes to
   * configure.
   * @return {String} The base GraphQL endpoint, for example https://sandbox.ottertax.com.
   */
  getGraphqlEndpoint() {
    console.log("\nAvailable environments");
    for (const [key, value] of Object.entries(this.environments)) {
      console.log(`${key}: ${value[0]}`);
    }
    let response = question('Select the OtterTax environment you will be using [1]: ');
    if(response === '') {
      response = '1';
    }
    const environment = this.environments[response];
    if(environment == null) {
      console.log('Invalid environment.  Exiting.');
      process.exit();
    }
    return(environment[1]);
  }
  /**
   * Get the user's password, either a new password or an existing password.
   * @param newPassword {Boolean} If true, print information about minimum password
   *   length.  If false, prompt user for their existing password.
   * @return {String} The user's password.
   */
  getPassword(newPassword = false) {
    let text = null;
    if(newPassword) {
      text = "\nEnter the password you will use to access OtterTax.\n" +
             "Please choose a secure password of at least 20 characters.\n"
    } else {
      text = "\nEnter your OtterTax password.\n"
    }
    const pw = question(text, { hideEchoBack: true });
    return(pw);
  }
  /**
   * Get the user's email address.
   * @return {String} The user's email address.
   */
  getEmailAddress() {
    const text = "\nEnter the email address you used when you registered with\n" +
                 "OtterTax.\n"
    const addr = question(text);
    return(addr);
  }
  /**
   * Get the user's confirmation token. Confirmation tokens are emailed to users
   * after successful registration.
   * @return [String] The user's confirmation token.
   */
  getConfirmationToken() {
    const text = "\nEnter the confirmation token from the email you received\n" +
                 "after registering.\n"
    const token = question(text);
    return(token);
  }
  /** 
   * Build and post the GraphQL mutation for confirming a user's registration.
   * @param password {String} The password the user uses to access the OtterTax API.
   * @param confimation_token {String} The confirmation token received by the user after
   *   completing the registration process.
   * @return {Object} The response from the server formatted as an object.
   */
  async postRegistrationConfirmation(password, confirmationToken) {
    const endpoint = `${this.graphqlEndpoint}/v2/graphql`;
    const graphQLClient = new GraphQLClient(endpoint);
    const mutation = gql`
      mutation {
      confirmRegistration(
        confirmationToken: "${confirmationToken}",
        password: "${password}"
      ) {
          message
        }
      }
    `
    const data = await graphQLClient.request(mutation);
    return(data);
  }
}

const setup = new Setup();
setup.setup();

import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.io.Console;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import java.io.IOException;
import java.lang.SecurityException;
import java.io.File;
import java.io.FileWriter;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import org.apache.http.entity.StringEntity;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;

import com.ottertax.support.Config;
import com.ottertax.support.ConfirmRegistrationResponse;

public class Setup {
  private String configFileName = "../config.json";
  private Pattern responseRegex = Pattern.compile("^y(?:es)?$");
  private Pattern responseRegexWithDefault = Pattern.compile("(?:^$)|(?:^y(?:es)?$)");
  private String baseUrl;
  private String otxPassword;
  private boolean registrationConfirmed = false;
  private boolean configFilewritten = false;

  public static void main(String[] args) {
    Setup setup = new Setup();

    setup.printIntroduction();
    setup.confirmRegistration();
    setup.writeConfigFile();
    setup.reportResults();
  }

  private void printIntroduction() {
    String text = "This program helps with two tasks that must be completed \n" +
                  "before running the demo programs.  First, it confirms your\n" +
                  "registration, and second, it creates a configuration file\n" +
                  "with your login information.\n" +
                  "Either of these tasks can also be completed by hand, so\n" +
                  "both are optional.\nPress enter to continue. ";
    clearConsole();
    System.out.print(text);
    getResponse(true);
  }
  private void confirmRegistration() {
      String text = "Would you like to confirm your registration?\n" +
             "To confirm your registration, you must first complete the\n" +
             "registration process to create an account.\n" +
             "To register for the OtterTax sandbox, go to\n" +
             "https://sandbox.ottertax.com/register.\n" +
             "Confirm registration? [Y]: ";
    clearConsole();
    System.out.print(text);
    String response = getResponse(true).toLowerCase();
    Matcher matcher = responseRegexWithDefault.matcher(response);
    if(matcher.find()) {
      doConfirm();
    }
  }
  private void writeConfigFile() {
    String text = "All of the sample code in this directory requires a\n" +
                  "configuration file in the parent directory\n" +
                  "(../config.json). You can create the file by hand by\n" +
                  "using ../config.json.example as an example or you can\n" +
                  "have this program create it for you.\n" +
                  "Create configuration file? [Y]: ";
    clearConsole();
    System.out.print(text);
    String response = getResponse(true).toLowerCase();
    Matcher matcher = responseRegexWithDefault.matcher(response);
    if(matcher.find()) {
      doWrite();
    }
  }
  private void reportResults() {
    clearConsole();
    System.out.println("Setup complete.");
    if(registrationConfirmed == true) {
      System.out.println("Registration was confirmed");
    } else {
      System.out.println("Registration was not confirmed.");
    }
    if(configFilewritten == true) {
      System.out.println("Configuration file was created.");
    } else {
      System.out.println("Configuration file was not created.");
    }
  }
  private void clearConsole() {
    System.out.print("\033[H\033[2J");  
    System.out.flush();
  }
  private String getResponse(boolean echo) {
    String response;
    Console console = System.console();
    if(echo == true) {
      response = console.readLine();
    } else {
      char[] password = console.readPassword();
      response = new String(password);
    }
    return(response);
  }
  private void doConfirm() {
    if(baseUrl == null) {
      setBaseUrl();
    }
    if(otxPassword == null) {
      setPassword(true);
    }
    String token = getConfirmationToken();
    String mutation = buildConfirmationMutation(token);
    postRegistrationConfirmation(mutation);
    registrationConfirmed = true;
  }
  private void setBaseUrl() {
    String text = "\nAvailable environments:\n" +
                  "  1. Sandbox\n" +
                  "  2. Production\n" +
                  "Select the environment you will be using [1]: ";
    clearConsole();
    System.out.print(text);
    String response = getResponse(true);
    if(response.equals("") || response.equals("1")) {
      baseUrl = "https://sandbox.ottertax.com";
    } else if(response.equals("2")) {
      baseUrl = "https://api.ottertax.com";
    } else {
      System.out.println("Invalid environment.  Exiting.");
      System.exit(1);
    }
  }
  private void setPassword(boolean newPassword) {
    String text;
    if(newPassword == true) {
      text = "\nEnter the password you will use to access OtterTax.\n" +
             "Please choose a secure password of at least 20 characters.\n" +
             "Your entry will not be displayed on screen.\n" +
             "Your password: ";
    } else {
      text = "\nEnter your OtterTax password.\n" +
             "Your entry will not be displayed on screen.\n" +
             "Your password: ";
    }
    clearConsole();
    System.out.print(text);
    otxPassword = getResponse(false);
  }
  private String getConfirmationToken() {
    String text = "\nEnter the confirmation token from the email you received\n" +
                  "after registering: ";
    System.out.print(text);
    String response = getResponse(true);
    return(response);
  }
  private String getEmailAddress() {
    String text = "\nEnter the email address you used when you registered with\n" +
                  "OtterTax.\nYour email address: ";
    System.out.print(text);
    String response = getResponse(true);
    return(response);
  }
  private String buildConfirmationMutation(String token) {
    String mutation = "mutation {\n" +
                      "  confirmRegistration(\n" +
                      "    confirmationToken: \"" + token + "\",\n" +
                      "    password: \"" + otxPassword +"\"\n" +
                      "  ) {\n" +
                      "       message\n" +
                      "  }\n" +
                      "}\n";
    return(mutation);
  }
  private void postRegistrationConfirmation(String mutation) {
    String endpoint = baseUrl + "/v2/graphql";
    CloseableHttpClient httpClient = HttpClients.createDefault();

    try {
      HttpPost httpPost = new HttpPost(endpoint);
      httpPost.addHeader("Content-Type", "application/json");

      // Put the query in the post body.
      Helper helper = Helper.getInstance();
      StringEntity stringEntity = new StringEntity(helper.querify(mutation));
      httpPost.setEntity(stringEntity);
      CloseableHttpResponse httpResponse = httpClient.execute(httpPost);

      // Read the response.
      BufferedReader reader = new BufferedReader(new InputStreamReader(
          httpResponse.getEntity().getContent()));
      StringBuffer responseBuffer = new StringBuffer();
      String inputLine;
      while ((inputLine = reader.readLine()) != null) {
        responseBuffer.append(inputLine);
      }
      reader.close();
      String response = responseBuffer.toString();
      int responseCode = httpResponse.getStatusLine().getStatusCode();
      if( responseCode == 200  ) {
        String successMessage = "Registration confirmation succeeded. " +
                                "You can log in and begin processing statements.";
        Gson gson = new Gson();
        ConfirmRegistrationResponse confirmRegistrationResponse = gson.fromJson(response, ConfirmRegistrationResponse.class);
        String message = confirmRegistrationResponse.getData().getConfirmRegistration().getMessage();
        if(message.equals(successMessage)) {
          System.out.println("\nRegistration confirmation succeeded. Press enter to continue. ");
          getResponse(true);
        }
        else {
          System.out.println(message);
          System.out.println("Registration failed.  Please correct the error above and try again.");
          System.exit(1);
        }
      } else {
        System.out.println("Registration failed.  Response code from server was " + String.valueOf(responseCode) + ".");
        System.exit(1);
      } 
      httpResponse.close();
      httpClient.close();
    } catch(IOException e) {
      System.out.println("Error confirming registration.\nExiting");
      System.exit(1);
    }
  }
  private void doWrite() {
    boolean write = true;
    String msg = "";
    if(configFileExists()) {
      System.out.print("\nConfiguration file exists.  Overwrite? [N]: ");
      String response = getResponse(true).toLowerCase();
      Matcher matcher = responseRegex.matcher(response);
      if(!matcher.find()) {
        write = false;
        msg = "Not modifying existing configuration file.";
      }
    }
    if(write == true) {
      if(baseUrl == null) {
        setBaseUrl();
      }
      if(otxPassword == null) {
        setPassword(false);
      }
      String emailAddress = getEmailAddress();
      Config config = new Config();
      config.setBaseUrl(baseUrl);
      Config.LoginData loginData = new Config.LoginData();
      loginData.setEmail(emailAddress);
      loginData.setPassword(otxPassword);
      config.setLoginData(loginData);
      Gson gson = new GsonBuilder().setPrettyPrinting().create();
      try {
        FileWriter myWriter = new FileWriter(configFileName);
        myWriter.write(gson.toJson(config));
        myWriter.close();
        configFilewritten = true;
      } catch (IOException e) {
        System.out.println("Error writing to config file " + configFileName + ".");
        System.exit(1);
      }
    }
  }
  private Boolean configFileExists() {
    File configFile = new File(configFileName);
    Boolean exists = true;
    try {
      exists = configFile.isFile();
    } catch(SecurityException e) {
      System.out.println("Security exception reading config file " + configFileName + ".");
      System.exit(1);
    }
    return(exists);
  }
}

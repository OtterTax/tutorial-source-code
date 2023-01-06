import java.nio.file.Files;
import java.nio.file.Path;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import java.io.IOException;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import org.apache.http.entity.StringEntity;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.client.methods.HttpDelete;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;

import com.ottertax.support.Credential;
import com.ottertax.support.Config;
import com.ottertax.support.LogoutResponse;

public class Helper {
  private static Helper instance = null;
  private static final String configFileName = "../config.json";

  private Helper() { }

  public static Helper getInstance() {
    if(instance == null) {
      instance = new Helper();
    }
    return(instance);
  }

  public Credential getCredential() {
    String endpoint = getBaseUrl() + "/v2/auth/sign_in";
    CloseableHttpClient httpClient = HttpClients.createDefault();
    Credential credential = new Credential();

    try {
      HttpPost httpPost = new HttpPost(endpoint);
      httpPost.addHeader("Content-Type", "application/json");
      // Put the loginData in the post body.
      StringEntity stringEntity = new StringEntity(getJsonLoginData());
      httpPost.setEntity(stringEntity);
      CloseableHttpResponse httpResponse = httpClient.execute(httpPost);

      // Check to be sure that the code was a 200 and all headers are present.
      int responseCode = httpResponse.getStatusLine().getStatusCode();
      boolean headersPresent = (httpResponse.containsHeader("access-token") &&
                                httpResponse.containsHeader("client") &&
                                httpResponse.containsHeader("uid"));
      if( responseCode == 200 && headersPresent ) {
        String accessToken = httpResponse.getFirstHeader("access-token").getValue();
        String client = httpResponse.getFirstHeader("client").getValue();
        String uid = httpResponse.getFirstHeader("uid").getValue();
        credential = new Credential(accessToken, client, uid);
      } else {
        BufferedReader reader = new BufferedReader(new InputStreamReader(
            httpResponse.getEntity().getContent()));
        StringBuffer responseBuffer = new StringBuffer();
        String inputLine;
        while ((inputLine = reader.readLine()) != null) {
          responseBuffer.append(inputLine);
        }
        reader.close();
        System.out.println("Error retrieving credential.  Status code was " + String.valueOf(responseCode) + "." );
        System.out.println(responseBuffer.toString());
        System.out.println("Exiting.");
        System.exit(1);
      }
      httpResponse.close();
      httpClient.close();
    } catch(IOException e) {
      System.out.println("Error retrieving credential.\nExiting");
      System.exit(1);
    }
    return(credential);
  }

  public Boolean deleteCredential(Credential credential) {
    Gson gson = new Gson();
    String endpoint = getBaseUrl() + "/v2/auth/sign_out";
    CloseableHttpClient httpClient = HttpClients.createDefault();
    Boolean succeeded = false;

    try {
      HttpDelete httpDelete = new HttpDelete(endpoint);
      httpDelete.addHeader("Content-Type", "application/json");
      httpDelete.addHeader("access-token", credential.getAccessToken());
      httpDelete.addHeader("client", credential.getClient());
      httpDelete.addHeader("uid", credential.getUid());

      CloseableHttpResponse httpResponse = httpClient.execute(httpDelete);

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
        LogoutResponse logoutResponse = gson.fromJson(response, LogoutResponse.class);
        if(logoutResponse.getSuccess() == true) {
          succeeded = true;
        }
      } else {
        System.out.println("Response code from server was " + String.valueOf(responseCode) + ".");
      }
      httpResponse.close();
      httpClient.close();
    } catch(IOException e) {
      System.out.println("Error deleting credential.\nExiting");
      System.exit(1);
    }
    return(succeeded);
  }

  public String querify(String rawGraphql) {
    Gson gson = new Gson();
    return("{\"query\":" + gson.toJson(rawGraphql) + "}");
  }

  public String postGraphql(Credential credential, String payload) {
    String endpoint = getBaseUrl() + "/v2/graphql";
    CloseableHttpClient httpClient = HttpClients.createDefault();
    String response = "";

    try {
      HttpPost httpPost = new HttpPost(endpoint);
      httpPost.addHeader("Content-Type", "application/json");
      httpPost.addHeader("access-token", credential.getAccessToken());
      httpPost.addHeader("client", credential.getClient());
      httpPost.addHeader("uid", credential.getUid());

      // Put the query in the post body.
      StringEntity stringEntity = new StringEntity(querify(payload));
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
      response = responseBuffer.toString();
      int responseCode = httpResponse.getStatusLine().getStatusCode();
      if( responseCode != 200  ) {
        System.out.println("Response code from server was " + String.valueOf(responseCode) + ".");
      } 
      httpResponse.close();
      httpClient.close();
    } catch(IOException e) {
      System.out.println("Error posting GraphQL.\nExiting");
      System.exit(1);
    }
    return(response);
  }


  // Methods below here are all private
  private Config getConfig() {
    Path fileName = Path.of(configFileName);
    String json = "";
    try {
      json = Files.readString(fileName);
    } catch(IOException e) {
      System.out.println("Cannot open file " + configFileName + ".\nExiting.");
      System.exit(1);
    }
    Config config = new Gson().fromJson(json, Config.class);
    return(config);
  }

  private String getBaseUrl() {
    Config config = getConfig();
    return(config.getBaseUrl());
  }

  private String getJsonLoginData() {
    Gson gson = new GsonBuilder()
        .setPrettyPrinting()
        .create(); 
    Config config = getConfig();
    return(gson.toJson(config.getLoginData()));
  }
  // private String getEmail() {
  //   Config config = getConfig();
  //   return(config.getLoginData().getEmail());
  // }
  // private String getPassword() {
  //   Config config = getConfig();
  //   return(config.getLoginData().getEmail());
  // }
}

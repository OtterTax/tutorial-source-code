import java.nio.file.Files;
import java.nio.file.Path;
import com.google.gson.Gson;
import java.io.IOException;
import java.lang.reflect.Type;
import com.google.gson.reflect.TypeToken;
import java.util.List;
import java.util.ArrayList;

import com.google.gson.GsonBuilder;
import java.io.FileWriter;

import com.ottertax.support.Credential;
import com.ottertax.support.F5498InputStatement;
import com.ottertax.support.AddF5498StatementsResponse;


public class Add {
  private static String buildMutation(F5498InputStatement[] statements) {
    StringBuilder sb = new StringBuilder();
    sb.append("mutation {\n" +
              "  addF5498Statements(\n" +
              "    statements: [\n" );
    for(F5498InputStatement statement : statements) {
      sb.append(statement.toGraphql());
    }
    sb.append("    ]\n" +
              "  ) {\n" +
              "    errors\n" +
              "    statements {\n" +
              "      recordNumber\n" +
              "      statement {\n" +
              "        uploaderId\n" + 
              "        recipientFirstName\n" + 
              "        recipientLastName\n" + 
              "        recipientTin\n" + 
              "        recipientTinType\n" + 
              "        recipientAddress1\n" + 
              "        recipientAddress2\n" + 
              "        recipientCity\n" + 
              "        recipientState\n" + 
              "        recipientZipCode\n" + 
              "        senderName\n" + 
              "        senderTin\n" + 
              "        senderAddress1\n" + 
              "        senderCity\n" + 
              "        senderState\n" + 
              "        senderZipCode\n" + 
              "        lateContributionCode\n" + 
              "        lateContributionYear\n" + 
              "        ira\n" + 
              "        roth\n" + 
              "      }\n" +
              "      messages\n" +
              "    }\n" +
              "  }\n" +
              "}\n");
    return(sb.toString());
  }

  private static F5498InputStatement[] getStatements() {
    Path fileName = Path.of("../data/f5498-data.json");
    Gson gson = new Gson();
    String json = "";
    try {
      json = Files.readString(fileName);
    } catch(IOException e) {
      System.out.println("Cannot open file " + fileName + ".\nExiting.");
      System.exit(1);
    }
    Type statementsType = new TypeToken<ArrayList<F5498InputStatement>>(){}.getType();
    List<F5498InputStatement> list = gson.fromJson(json, statementsType);
    F5498InputStatement[] statements = new F5498InputStatement[list.size()];
    for (int i = 0; i < list.size(); i++) {
      statements[i] = list.get(i);
    }
    return(statements);
  }

  public static void main(String[] args) {
    Helper helper = Helper.getInstance();
    Credential credential = helper.getCredential();
    F5498InputStatement[] statements = getStatements();
    String mutation = buildMutation(statements);

    String response = helper.postGraphql(credential, mutation);
    Gson gson = new GsonBuilder().setPrettyPrinting().create();
    AddF5498StatementsResponse AddF5498StatementsResponse = gson.fromJson(response, AddF5498StatementsResponse.class);
    System.out.println(gson.toJson(AddF5498StatementsResponse));

    if(helper.deleteCredential(credential) == true) {
      System.out.println("\nSuccessfully deleted credential.");
    }
  }

}

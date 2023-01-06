import java.nio.file.Files;
import java.nio.file.Path;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import java.io.IOException;
import java.lang.reflect.Type;
import com.google.gson.reflect.TypeToken;
import java.util.List;
import java.util.ArrayList;

import com.ottertax.support.Credential;
import com.ottertax.support.F5498Update;
import com.ottertax.support.UpdateF5498StatementsResponse;

public class Correct {
  private static String buildMutation(F5498Update[] corrections) {
    StringBuilder sb = new StringBuilder();
    sb.append("mutation {\n" +
              "  updateF5498Statements(\n" +
              "    statements: [\n" );
    for(F5498Update correction : corrections) {
      sb.append(correction.toGraphql("uploaderId"));
    }
    sb.append("\n    ]\n" +
              "  ) {\n" +
              "    statements {\n" +
              "      recordNumber\n" +
              "      statement {\n" +
              "        uploaderId\n" + 
              "        senderCity\n" + 
              "        senderZipCode\n" + 
              "        lateContributionCode\n" + 
              "        lateContributionYear\n" + 
              "        roth\n" + 
              "      }\n" +
              "    }\n" +
              "  }\n" +
              "}\n");
    return(sb.toString());
  }

  private static F5498Update[] getCorrections() {
    Path fileName = Path.of("../data/f5498-corrections.json");
    Gson gson = new Gson();
    String json = "";
    try {
      json = Files.readString(fileName);
    } catch(IOException e) {
      System.out.println("Cannot open file " + fileName + ".\nExiting.");
      System.exit(1);
    }
    Type correctionsType = new TypeToken<ArrayList<F5498Update>>(){}.getType();
    List<F5498Update> list = gson.fromJson(json, correctionsType);
    F5498Update[] corrections = new F5498Update[list.size()];
    for (int i = 0; i < list.size(); i++) {
      corrections[i] = list.get(i);
    }
    return(corrections);
  }

  public static void main(String[] args) {
    Helper helper = Helper.getInstance();
    Credential credential = helper.getCredential();
    F5498Update[] corrections = getCorrections();
    String mutation = buildMutation(corrections);

    String response = helper.postGraphql(credential, mutation);
    Gson gson = new GsonBuilder().setPrettyPrinting().create();
    UpdateF5498StatementsResponse updateF5498StatementsResponse = gson.fromJson(response, UpdateF5498StatementsResponse.class);
    System.out.println(gson.toJson(updateF5498StatementsResponse));

    if(helper.deleteCredential(credential) == true) {
      System.out.println("\nSuccessfully deleted credential.");
    }
  }
}

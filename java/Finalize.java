import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import com.ottertax.support.Credential;
import com.ottertax.support.FinalizeResponse;

public class Finalize {
  private static String buildMutation(String[] uploaderIds) {
    Gson gson = new Gson();
    StringBuilder sb = new StringBuilder();
    sb.append("mutation {\n" +
              "  finalizeStatements(\n" +
              "    creditCard: {\n" +
              "      firstName: \"Annalise\"\n" +
              "      lastName: \"Havemeyer\"\n" +
              "      companyName: \"Big Apple Analytics\"\n" +
              "      address: \"179 N. 13th Street, Suite 14C\"\n" +
              "      city: \"Brooklyn\"\n" +
              "      state: \"NY\"\n" +
              "      zipCode: \"11249\"\n" +
              "      cardNumber: \"371648189095315\"\n" +
              "      cardExpiration: \"0825\"\n" +
              "      cvv: \"3767\"\n" +
              "    }\n" +
              "    uploaderIds: [\n" );
    for(String uploaderId : uploaderIds) {
      sb.append(gson.toJson(uploaderId) + " ");
    }
    sb.append("\n    ]\n" +
              "  ) {\n" +
              "    errors\n" +
              "    messages {\n" +
              "      messages\n" +
              "      otxId\n" +
              "      uploaderId\n" +
              "    }\n" +
              "    successCount\n" +
              "  }\n" +
              "}\n");
    return(sb.toString());
  }

  public static void main(String[] args) {
    Helper helper = Helper.getInstance();
    Credential credential = helper.getCredential();
    String[] uploaderIds = {"6733766","6733767","6733768","6733769","6733710"};
    String mutation = buildMutation(uploaderIds);
    String response = helper.postGraphql(credential, mutation);

    Gson gson = new GsonBuilder().setPrettyPrinting().create();
    FinalizeResponse finalizeResponse = gson.fromJson(response, FinalizeResponse.class);
    System.out.println(gson.toJson(finalizeResponse));

    if(helper.deleteCredential(credential) == true) {
      System.out.println("\nSuccessfully deleted credential.");
    }
  }
}

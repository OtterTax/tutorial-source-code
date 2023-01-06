import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import com.ottertax.support.Credential;
import com.ottertax.support.SubmitResponse;

public class Submit {
  private static String buildMutation(String[] uploaderIds) {
    Gson gson = new Gson();
    StringBuilder sb = new StringBuilder();
    sb.append("mutation {\n" +
              "  submitStatements(\n" +
              "    uploaderIds: [\n" );
    for(String uploaderId : uploaderIds) {
      sb.append(gson.toJson(uploaderId) + " ");
    }
    sb.append("\n    ]\n" +
              "  ) {\n" +
              "    messages {\n" +
              "      messages\n" +
              "      uploaderId\n" +
              "    }\n" +
              "    errors\n" +
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
    SubmitResponse submitResponse = gson.fromJson(response, SubmitResponse.class);
    System.out.println(gson.toJson(submitResponse));

    if(helper.deleteCredential(credential) == true) {
      System.out.println("\nSuccessfully deleted credential.");
    }
  }
}

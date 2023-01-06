import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import com.ottertax.support.Credential;
import com.ottertax.support.DeleteResponse;

public class Delete {
  private static String buildMutation(String[] uploaderIds) {
    Gson gson = new Gson();
    StringBuilder sb = new StringBuilder();
    sb.append("mutation {\n" +
              "  deleteStatements(\n" +
              "    uploaderIds: [\n" );
    for(String uploaderId : uploaderIds) {
      sb.append(gson.toJson(uploaderId) + " ");
    }
    sb.append("\n    ]\n" +
              "  ) {\n" +
              "    errors\n" +
              "    deleteCount\n" +
              "  }\n" +
              "}\n");
    return(sb.toString());
  }

  public static void main(String[] args) {
    Helper helper = Helper.getInstance();
    Credential credential = helper.getCredential();

    String[] uploaderIds = {"6733769"};
    String mutation = buildMutation(uploaderIds);
    String response = helper.postGraphql(credential, mutation);

    Gson gson = new GsonBuilder().setPrettyPrinting().create();
    DeleteResponse deleteResponse = gson.fromJson(response, DeleteResponse.class);
    System.out.println(gson.toJson(deleteResponse));

    if(helper.deleteCredential(credential) == true) {
      System.out.println("\nSuccessfully deleted credential.");
    }
  }
}
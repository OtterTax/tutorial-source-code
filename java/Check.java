import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import com.ottertax.support.Credential;
import com.ottertax.support.GetF5498StatementsResponse;

public class Check {
  private static String buildQuery(String[] uploaderIds) {
    Gson gson = new Gson();
    StringBuilder sb = new StringBuilder();
    sb.append("query {\n" +
              "  getF5498Statements(\n" +
              "    uploaderIds: [\n" );
    for(String uploaderId : uploaderIds) {
      sb.append(gson.toJson(uploaderId) + " ");
    }
    sb.append("\n    ]\n" +
              "  ) {\n" +
              "    errors\n" +
              "    statements {\n" +
              "      pageInfo {\n" +
              "        hasNextPage\n" +
              "      }\n" +
              "      nodes {\n" +
              "        otxId\n" + 
              "        uploaderId\n" + 
              "        statementValid\n" + 
              "        validationMessages\n" + 
              "        status\n" + 
              "        statusDescription\n" + 
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
              "    }\n" +
              "  }\n" +
              "}\n");
    return(sb.toString());
  }

  public static void main(String[] args) {
    Helper helper = Helper.getInstance();
    Credential credential = helper.getCredential();
    String[] uploaderIds = {"6733766","6733767","6733768","6733769","6733710"};
    String query = buildQuery(uploaderIds);
    String response = helper.postGraphql(credential, query);

    Gson gson = new GsonBuilder().setPrettyPrinting().create();
    GetF5498StatementsResponse getF5498StatementsResponse = gson.fromJson(response, GetF5498StatementsResponse.class);
    System.out.println(gson.toJson(getF5498StatementsResponse));

    if(helper.deleteCredential(credential) == true) {
      System.out.println("\nSuccessfully deleted credential.");
    }
  }

}

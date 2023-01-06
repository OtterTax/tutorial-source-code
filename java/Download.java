import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import java.util.Base64;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;

import com.ottertax.support.Credential;
import com.ottertax.support.DownloadResponse;

public class Download {
  private static String buildQuery(String[] uploaderIds) {
    Gson gson = new Gson();
    StringBuilder sb = new StringBuilder();
    sb.append("query {\n" +
              "  getStatements(\n" +
              "    uploaderIds: [\n" );
    for(String uploaderId : uploaderIds) {
      sb.append(gson.toJson(uploaderId) + " ");
    }
    sb.append("\n    ]\n" +
              "  ) {\n" +
              "    errors\n" +
              "    statements {\n" +
              "      nodes {\n" +
              "        uploaderId\n" + 
              "        pdf\n" + 
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
    DownloadResponse downloadResponse = gson.fromJson(response, DownloadResponse.class);
    for(DownloadResponse.Data.GetStatements.Statements.Node node :
      downloadResponse.getData().getGetStatements().getStatements().getNodes()) {
      String uploaderId = node.getUploaderId();
      String encryptedPdf = node.getPdf();
      byte[] decodedBytes = Base64.getMimeDecoder().decode(encryptedPdf);

      String fileName = "./statement_downloads/stmt-" + uploaderId + ".pdf";
      try {
        Files.write(Paths.get(fileName), decodedBytes);
      } catch (IOException e) {
        System.out.println("Unable to write file " + fileName + ".\nExiting.");
        System.exit(1);
      }
    }

    if(helper.deleteCredential(credential) == true) {
      System.out.println("\nSuccessfully deleted credential.");
    }
  }
}
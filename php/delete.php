<?php
include 'helper.php';

class StatementDeleter {
  private $helper;

  function __construct() {
    $this->helper = new Helper();
  }

  /**
   * Build a GraphQL mutation for deleting statements.
   *
   * @param array uploader_ids A list of uploader_ids representing
   * the statements to be deleted.
   * @return string The full GraphQL delete mutation.
   */
  function build_mutation($uploader_ids) {
    $callback = fn($x) => "\"${x}\"";
    $data = implode("\n", array_map($callback, $uploader_ids));
    $gql = <<<END_GQL
      mutation {
        deleteStatements(
          uploaderIds: [ {$data} ]
        ) {
          errors
          deleteCount
        }
      }
    END_GQL ;
    return($gql);
  }
  function delete() {
    $credential = $this->helper->get_credential();
    # Delete a single statement.
    $uploader_ids = array('23913');
    $mutation = $this->build_mutation($uploader_ids);
    $response = $this->helper->post_gql($credential, $mutation);
    # response is an object that you can manipulate to suit your needs.
    # Here we're just going to print it (as a JSON object to make it
    # easier to read).
    print(json_encode($response, JSON_PRETTY_PRINT) . "\n");
    # Credentials are valid for several days after they've been issued.
    # If you plan to do more work, you can use the same credential.  When done
    # working, you should delete the credential to provide additional security.
    if($this->helper->delete_credential($credential)) {
      print("Successfully deleted credential.\n");
    }
  }
}

$deleter = new StatementDeleter();
$deleter->delete();
?>
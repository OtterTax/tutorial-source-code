<?php
include 'helper.php';

class StatementSubmitter {
  private $helper;

  function __construct() {
    $this->helper = new Helper();
  }

  /**
   * Build a GraphQL mutation for submitting statements to the IRS.
   *
   * Statements in the sandbox system are not submitted to the IRS; the
   * mutation is provided for testing purposes only.
   * @param array uploader_ids A list of uploader_ids representing
   * the statements to be submitted.
   * @return string The full GraphQL mutation to submit the statements.
   */
  function build_mutation($uploader_ids) {
    $callback = fn($x) => "\"${x}\"";
    $data = implode("\n", array_map($callback, $uploader_ids));
    $gql = <<<END_GQL
      mutation {
        submitStatements(
          uploaderIds: [ {$data} ]
        ) {
          errors
          successCount
        }
      }
    END_GQL ;
    return($gql);
  }

  function submit() {
    $credential = $this->helper->get_credential();
    # Uploader IDs are provided by the user who uploads the statement.
    # See ../data/f1099nec-data.json
    $uploader_ids = ['23911','23912','23913','23914','23915'];
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

$submitter = new StatementSubmitter();
$submitter->submit();
?>

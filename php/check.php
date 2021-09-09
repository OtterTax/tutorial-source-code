<?php
include 'helper.php';

class StatementChecker {
  private $helper;

  function __construct() {
    $this->helper = new Helper();
  }

  /**
   * Build a GraphQL mutation for checking statement validity.
   *
   * @param array uploader_ids A list of uploader_ids representing
   * the statements to be checked.
   * @return string The full GraphQL mutation to get the statements.
   */
  function build_query($uploader_ids) {
    $callback = fn($x) => "\"${x}\"";
    $data = implode("\n", array_map($callback, $uploader_ids));
    $gql = <<<END_GQL
      query {
        getF1099necStatements(
          uploaderIds: [
            {$data}
          ]
        ) {
          errors
          statements {
            pageInfo {
              hasNextPage
            }
            nodes {
              otxId
              uploaderId
              statementValid
              validationMessages
              status
              statusDescription
            }
          }
        }
      }
    END_GQL ;
    return($gql);
  }

  function check() {
    $credential = $this->helper->get_credential();
    # Uploader IDs are provided by the user who uploads the statement.
    # See ../data/f1099nec-data.json
    # IDs for non-existent statements (e.g., those that have been deleted) will be
    # silently ignored.
    $uploader_ids = array('23911','23912','23913','23914','23915');
    $query = $this->build_query($uploader_ids);
    $response = $this->helper->post_gql($credential, $query);
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

$checker = new StatementChecker();
$checker->check();

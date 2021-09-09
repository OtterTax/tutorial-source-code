<?php
include 'helper.php';

class StatementCorrector {
  private $helper;

  function __construct() {
    $this->helper = new Helper();
  }

  /**
   * Build a GraphQL mutation for updating (correcting) statements.
   *
   * @param array corrections An array changes to make.  Each set of
   * changes should be an uploader_id and a set of field/value pairs.
   * See the format in ../data/f1099nec-corrections.json.
   * @return string The full GraphQL update mutation.
   */
  function build_mutation($corrections) {
    $callback = fn($x) => $this->helper->to_gql($x);
    $data = implode("\n", array_map($callback, $corrections));
    $gql = <<<END_GQL
      mutation {
        updateF1099necStatements(
          statements: [ {$data} ]
        ) {
          statements {
            recordNumber
            statement {
              otxId
              uploaderId
              nonemployeeComp
              recipientCity
              recipientZipCode
            }
            messages
          }
          errors
        }
      }
    END_GQL ;
    return($gql);
  }

  function correct() {
    $credential = $this->helper->get_credential();
    # See ../data/f1099nec-corrections.json for correction format.
    $corrections = $this->helper->get_data('../data/f1099nec-corrections.json');
    $mutation = $this->build_mutation($corrections);
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

$corrector = new StatementCorrector();
$corrector->correct();
?>
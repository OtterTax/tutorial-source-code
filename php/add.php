<?php
include 'helper.php';

class StatementAdder {
  private $helper;

  function __construct() {
    $this->helper = new Helper();
  }

  /**
   * Build the GraphQL mutation for adding new statements.
   *
   * @param array statements An array of statements to add.
   * Each statement in the array is an object.
   * @return string The full GraphQL add mutation.
   */
  function build_mutation($statements) {
    $callback = fn($x) => $this->helper->to_gql($x);
    $data = implode("\n", array_map($callback, $statements));
    $gql = <<<END_GQL
      mutation {
        addF1099necStatements(
          statements: [
            {$data}
          ]
        ) {
          errors
          statements {
            recordNumber
            statement {
              otxId
              uploaderId
              recipientFirstName
              recipientLastName
              tags
            }
            messages
          }
        }
      }
    END_GQL ;
    return($gql);
  }

  function add() {
    $credential = $this->helper->get_credential();
    # See the file ../data/f1099nec-data.json for statement data and format.
    $statements = $this->helper->get_data('../data/f1099nec-data.json');
    $mutation = $this->build_mutation($statements);
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

$adder = new StatementAdder();
$adder->add();

?>

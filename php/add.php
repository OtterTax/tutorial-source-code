<?php
include 'helper.php';

class StatementAdder {
  private $helper;

  function __construct() {
    $this->helper = new Helper();
  }

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
    $statements = $this->helper->get_data('../data/f1099nec-data.json');
    $mutation = $this->build_mutation($statements);
    $response = $this->helper->post_gql($credential, $mutation);
    print(json_encode($response, JSON_PRETTY_PRINT) . "\n");
    if($this->helper->delete_credential($credential)) {
      print("Successfully deleted credential.\n");
    }
  }

}

$adder = new StatementAdder();
$adder->add();

?>

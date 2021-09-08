<?php
include 'helper.php';

class StatementCorrector {
  private $helper;

  function __construct() {
    $this->helper = new Helper();
  }
  
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
    print(json_encode($response, JSON_PRETTY_PRINT) . "\n");
    if($this->helper->delete_credential($credential)) {
      print("Successfully deleted credential.\n");
    }
  }
}

$corrector = new StatementCorrector();
$corrector->correct();
?>
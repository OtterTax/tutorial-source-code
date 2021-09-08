<?php
include 'helper.php';

class StatementFinalizer {
  private $helper;

  function __construct() {
    $this->helper = new Helper();
  }

  function build_mutation($uploader_ids) {
    $callback = fn($x) => "\"${x}\"";
    $data = implode("\n", array_map($callback, $uploader_ids));
    $gql = <<<END_GQL
      mutation {
        finalizeStatements(
          creditCard: {
            firstName: "Annalise"
            lastName: "Havemeyer"
            companyName: "Big Apple Analytics"
            address: "179 N. 13th Street, Suite 14C"
            city: "Brooklyn"
            state: "NY"
            zipCode: "11249"
            cardNumber: "371648189095315"
            cardExpiration: "0825"
            cvv: "3767"
          }
          uploaderIds: [ {$data} ]
        ) {
          errors
          messages {
            messages
            otxId
            uploaderId
          }
          successCount
        }
      }
    END_GQL ;
    return($gql);
  }

  function finalize() {
    $credential = $this->helper->get_credential();
    $uploader_ids = ['23911','23912','23913','23914','23915'];
    $mutation = $this->build_mutation($uploader_ids);
    $response = $this->helper->post_gql($credential, $mutation );
    print(json_encode($response, JSON_PRETTY_PRINT) . "\n");
    if($this->helper->delete_credential($credential)) {
      print("Successfully deleted credential.\n");
    }
  }
}

$finalizer = new StatementFinalizer();
$finalizer->finalize();
?>
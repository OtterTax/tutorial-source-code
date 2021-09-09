<?php
include 'helper.php';

class StatementFinalizer {
  private $helper;

  function __construct() {
    $this->helper = new Helper();
  }

  /**
   * Build a GraphQL mutation for finalizing statements.
   *
   * The mutation includes hard-coded bogus credit card information which was obtained from
   * https://fake-card-generator.com/
   * Credit card information is optional when finalizing statements in the sandbox system,
   * and it is ignored when it is supplied (i.e., there is no charge for finalizing statements
   * in the sandbox system).  Credit card information is supported in the sandbox system so
   * that users can fully test the finalizeStatements mutation.
   * In the production system, the OtterTax watermark is removed from statements that have been
   * finalized, but the watermark is not removed in the sandbox system.
   * @param array uploader_ids A list of uploader_ids representing the statements to be
   * finalized.
   * @return string The full GraphQL mutation to finalize the statements.
   */
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
    # Uploader IDs are provided by the user who uploads the statement.
    # See ../data/f1099nec-data.json
    $uploader_ids = ['23911','23912','23913','23914','23915'];
    $mutation = $this->build_mutation($uploader_ids);
    $response = $this->helper->post_gql($credential, $mutation );
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

$finalizer = new StatementFinalizer();
$finalizer->finalize();
?>
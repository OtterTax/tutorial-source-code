<?php
include 'helper.php';

class StatementSubmitter {
  private $helper;

  function __construct() {
    $this->helper = new Helper();
  }

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
    $uploader_ids = ['23911','23912','23913','23914','23915'];
    $mutation = $this->build_mutation($uploader_ids);
    $response = $this->helper->post_gql($credential, $mutation);
    print(json_encode($response, JSON_PRETTY_PRINT) . "\n");
    if($this->helper->delete_credential($credential)) {
      print("Successfully deleted credential.\n");
    }
  }
}

$submitter = new StatementSubmitter();
$submitter->submit();
?>

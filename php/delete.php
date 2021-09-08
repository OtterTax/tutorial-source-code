<?php
include 'helper.php';

class StatementDeleter {
  private $helper;

  function __construct() {
    $this->helper = new Helper();
  }

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
    $uploader_ids = array('23913');
    $mutation = $this->build_mutation($uploader_ids);
    $response = $this->helper->post_gql($credential, $mutation);
    print(json_encode($response, JSON_PRETTY_PRINT) . "\n");
    if($this->helper->delete_credential($credential)) {
      print("Successfully deleted credential.\n");
    }
  }
}

$deleter = new StatementDeleter();
$deleter->delete();
?>
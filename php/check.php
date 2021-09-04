<?php
include 'helper.php';

class StatementChecker {
  private $helper;

  function __construct() {
    $this->helper = new Helper();
  }
  
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
    $uploader_ids = array('23911','23912','23913','23914','23915');
    $query = $this->build_query($uploader_ids);
    $response = $this->helper->post_gql($credential, $query);
    print(json_encode($response, JSON_PRETTY_PRINT) . "\n");
    if($this->helper->delete_credential($credential)) {
      print("Successfully deleted credential.\n");
    }
  }
}

$checker = new StatementChecker();
$checker->check();

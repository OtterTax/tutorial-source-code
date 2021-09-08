<?php
include 'helper.php';

class StatementDownloader {
  private $helper;

  function __construct() {
    $this->helper = new Helper();
    $this->download_directory = './statement_downloads';
  }

  function build_query($uploader_ids) {
    $callback = fn($x) => "\"${x}\"";
    $data = implode("\n", array_map($callback, $uploader_ids));
    $gql = <<<END_GQL
      query {
        getStatements(
          uploaderIds: [ {$data} ]
        ) {
          errors
          statements {
            nodes {
              otxId
              uploaderId
              pdf
            }
          }
        }
      }
    END_GQL ;
    return($gql);
  }

  function download() {
    $this->prepare_download_directory();
    $credential = $this->helper->get_credential();
    $uploader_ids = ['23911','23912','23913','23914','23915'];
    $query = $this->build_query($uploader_ids);
    $response = $this->helper->post_gql($credential, $query );
    $statements = $response->data->getStatements->statements->nodes;
    foreach( $statements as $statement ) {
      $file_name = "{$this->download_directory}/stmt-{$statement->uploaderId}.pdf";
      $pdf_file = fopen( $file_name, 'w' );
      fwrite( $pdf_file, base64_decode( $statement->pdf ) );
      fclose( $pdf_file );
    }
    print( "Statements successfully downloaded to {$this->download_directory}.\n" );
    if($this->helper->delete_credential($credential)) {
      print("Successfully deleted credential.\n");
    }
  }
  
  private function prepare_download_directory() {
    if (!file_exists($this->download_directory) && !is_dir($this->download_directory)) {
        mkdir($this->download_directory);
    } 
  }
}

$downloader = new StatementDownloader();
$downloader->download();
?>
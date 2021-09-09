<?php
include 'helper.php';

class StatementDownloader {
  private $helper;

  function __construct() {
    $this->helper = new Helper();
    $this->download_directory = './statement_downloads';
  }

  /**
   * Build a GraphQL mutation for retrieving PDF versions of statements.
   *
   * @param array uploader_ids A list of uploader_ids representing
   * the statements to be downloaded.
   * @return string The full GraphQL mutation to get the statements.
   */
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
    # Uploader IDs are provided by the user who uploads the statement.
    # See ../data/f1099nec-data.json
    $uploader_ids = ['23911','23912','23913','23914','23915'];
    $query = $this->build_query($uploader_ids);
    $response = $this->helper->post_gql($credential, $query );
    $statements = $response->data->getStatements->statements->nodes;
    foreach( $statements as $statement ) {
      $file_name = "{$this->download_directory}/stmt-{$statement->uploaderId}.pdf";
      $pdf_file = fopen( $file_name, 'w' );
      # Statements are Base 64 encoded, so we have to decode them.
      fwrite( $pdf_file, base64_decode( $statement->pdf ) );
      fclose( $pdf_file );
    }
    print( "Statements successfully downloaded to {$this->download_directory}.\n" );
    # Credentials are valid for several days after they've been issued.
    # If you plan to do more work, you can use the same credential.  When done
    # working, you should delete the credential to provide additional security.
    if($this->helper->delete_credential($credential)) {
      print("Successfully deleted credential.\n");
    }
  }

  # Be sure the download directory exists.
  private function prepare_download_directory() {
    if (!file_exists($this->download_directory) && !is_dir($this->download_directory)) {
        mkdir($this->download_directory);
    }
  }
}

$downloader = new StatementDownloader();
$downloader->download();
?>
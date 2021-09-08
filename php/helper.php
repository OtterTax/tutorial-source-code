<?php
class Helper {
  /** Obtain an access credential.
   *
   * The credential is obtained with the email address and password specified in ../config.json.
   * You must first register to obtain a vaild email/password.  Register for the sandbox at
   * https://sandbox.ottertax.com/register and follow instructions for confirming your
   * registration at https://doc.ottertax.com/registration/registration_confirmation.
   * The server is specified in the baseUrl parameter of ../config.json
   * @return array A valid authentication credential.
   */
  function get_credential() {
    $login_data = $this->get_config_element('loginData');
    $endpoint = $this->get_config_element('baseUrl') . '/v2/auth/sign_in';
    $payload = json_encode($login_data);
    $headers = ["Content-Type: application/json"];
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $endpoint);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_HEADER, true);
    $server_output = curl_exec ($ch);
    list($raw_headers, $raw_body) = explode("\r\n\r\n", $server_output, 2);
    curl_close ($ch);
    $headers = $this->headers_to_array($raw_headers);
    $credential = array(
      'access-token' => $headers['access-token'],
      'client' => $headers['client'],
      'uid' => $headers['uid']
    );
    return($credential);
  }

  /**
   * Delete the given access credential from the server.
   *
   * The server is specified in the baseUrl parameter of ../config.json
   * @param array credential The access credential to be deleted
   * from the server.
   * @return boolean True if the credential was successfully
   * deleted, false otherwise.
   */
  function delete_credential($credential) {
    $endpoint = $this->get_config_element('baseUrl') . '/v2/auth/sign_out';
    $header_array = array_merge( array('Content-Type' => 'application/json'),
                                       $credential);
    $headers = $this->array_to_headers($header_array);
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $endpoint);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "DELETE");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    $server_output = curl_exec ($ch);
    $resp = json_decode( $server_output );
    if( isset($resp->success) && $resp->success === true ) {
      $success = true;
    } else {
      $success = false;
      echo("Logout failed.\n");
    }
    return($success);
  }

  /**
   * Get data from a given file.  The file must contain data in JSON format.
   *
   * @param string filename The name of the data file.
   * @return object The data formatted as a PHP object.
   */
  function get_data($filename) {
    $json = json_decode(file_get_contents($filename));
    return($json);
  }

  /**
   * Convert a PHP object to its GraphQL equivalent.
   *
   * @param object object The object to be converted.
   * @return string The GraphQL representation of the object which can be
   * included in a query or mutation.
   */
  function to_gql($object) {
    $items = [];
    foreach($object as $key=>$value) {
      $val = (gettype($value) === 'object' ? $this->to_gql($value) : json_encode($value));
      array_push($items, $key . ': ' . $val);
    }
    return("{\n" . implode("\n", $items) . "\n}\n");
  }

  /**
   * Post a query or mutation.
   *
   * The server is defined in the baseUrl parameter of ../config.json.
   *
   * @param array credential A valid credential, typically obtained by get_credential.
   * @param string payload A GraphQL query or mutation to send to the server.
   * @return object The response from the server formatted as a PHP object.
   */
  function post_gql($credential, $payload) {
    $endpoint = $this->get_config_element('baseUrl') . '/v2/graphql';
    $header_array = array_merge( array('Content-Type' => 'application/json'),
                                       $credential);
    $headers = $this->array_to_headers($header_array);
    $body = json_encode(array('query' => $payload));
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $endpoint);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_HEADER, true);
    $response = curl_exec ($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    # Strip any status 100 continue messages from the beginning of the response.
    # Code adapted from posts at
    # https://stackoverflow.com/questions/2964687/how-to-handle-100-continue-http-message
    $delimiter = "\r\n\r\n";
    while(preg_match('#^HTTP/[0-9\\.]+\s+100\s+Continue#i', $response) ) {
        $tmp = explode($delimiter, $response, 2);
        $response = $tmp[1];
    }
    list($raw_headers, $raw_body) = explode($delimiter, $response, 2);

    if( preg_match('/^200/', $http_code) ) {
      return(json_decode($raw_body));
    } else {
      print("Response code from server was " . $http_code . '.');
      print($raw_body);
      return(new stdClass());
    }
  }

  /**
   * Check to be sure the configuration file exists, then
   * get the given configuration element from the configuration file.
   * @return string The requested configuration element.
   */
  private function get_config_element($element_name) {
    if(!file_exists('../config.json')) {
      echo('No configuration file found.');
      echo("Run 'setup.rb' to create one.");
      echo("Or use '../config.json.example' as a sample to build it from scratch.");
      exit;
    }
    $config = json_decode(file_get_contents('../config.json'));
    return($config->$element_name);
  }

  /**
   * Convert HTTP headers to a PHP array.
   * Code adapted from
   * https://stackoverflow.com/questions/41978957/get-header-from-php-curl-response
   * @return array The HTTP headers.
   */
  private function headers_to_array($raw_data) {
    $text_headers = explode("\n", $raw_data);
    $headers = [];
    $headers['status'] = $text_headers[0];
    array_shift($text_headers);
    foreach($text_headers as $text_header) {
      // Acccount for headers with colons (e.g., dates and times
      // like Fri, 01 Jan 2021 01:01:01 GMT)
      $middle = explode(":", $text_header , 2);
      //Supress warning message if $middle[1] does not exist
      if ( !isset($middle[1]) ) { $middle[1] = null; }
      $headers[trim($middle[0])] = trim($middle[1]);
    }
    return($headers);
  }

  /**
   * Convert a PHP array to headers suitable for cURL.
   *
   * @param array The headers in PHP format.
   * @return array The headers in cURL format.
   */
  private function array_to_headers($ary) {
    $text_headers = [];
    foreach($ary as $key=>$value) {
      array_push($text_headers, $key . ': '. $value);
    }
    $headers = implode("\r\n", $text_headers);
    return([$headers]);
  }
}
?>

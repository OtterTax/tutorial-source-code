<?php
class Helper {
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

  function get_data($filename) {
    $json = json_decode(file_get_contents($filename));
    return($json);
  }

// https://stackoverflow.com/questions/11797680/getting-http-code-in-php-using-curl
// curl_setopt($ch, CURLOPT_SSL_VERIFYHOST,false);
// curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);
// curl_setopt($ch, CURLOPT_TIMEOUT, 20);


  function to_gql($object) {
    $items = [];
    foreach($object as $key=>$value) {
      $val = (gettype($value) === 'object' ? $this->to_gql($value) : json_encode($value));
      array_push($items, $key . ': ' . $val);
    }
    return("{\n" . implode("\n", $items) . "\n}\n");
  }

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
    $server_output = curl_exec ($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    // graphql endpoint returns an extra "\r\n" at the beginning
    list($preamble, $raw_headers, $raw_body) = explode("\r\n\r\n", $server_output, 3);

    if( preg_match('/^200/', $http_code) ) {
      return(json_decode($raw_body));
    } else {
      print("Response code from server was " . $http_code . '.');
      print($raw_body);
      return(new stdClass());
    }
  }


  # Check to be sure the configuration file exists, then
  # get the given configuration element from the configuration file.
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

  // Code adapted from
  // https://stackoverflow.com/questions/41978957/get-header-from-php-curl-response
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

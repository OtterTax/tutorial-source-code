<?php

class Setup {
  private $config_file_name;
  private $response_regex;
  private $response_regex_with_default;
  private $environments;
  private $registration_confirmed;
  private $config_file_created;
  private $graphql_endpoint;
  private $password;

  function __construct() {
    $this->config_file_name = '../config.json';
    $this->response_regex = "/^y(?:es)?$/";
    $this->response_regex_with_default = "/(?:^$)|(?:^y(?:es)?$)/";
    $this->environments = [ '1' => array('Sandbox','https://sandbox.ottertax.com'),
                            '2' => array('Production','https://prod.ottertax.com') ];
  }

  function setup() {
    $this->print_introduction();
    $this->confirm_registration_if_user_chooses();
    $this->write_config_file_if_user_chooses();
    $this->report_results();
  }

  private function print_introduction() {
    $text = "This program helps with two tasks that must be completed \n" .
            "before running the demo programs.  First, it confirms your\n" .
            "registration, and second, it creates a configuration file\n" .
            "with your login information.\n" .
            "Either of these tasks can also be completed by hand, so\n" .
            "both are optional.\n";
    $this->clear_console();
    print($text);
    readline('Press enter to continue. ');
  }

  private function confirm_registration_if_user_chooses() {
    $text = "Would you like to confirm your registration?\n" .
            "To confirm your registration, you must first complete the\n" .
            "registration process to create an account.\n" .
            "To register for the OtterTax sandbox, go to\n" .
            "https://sandbox.ottertax.com/register.\n";
    $this->clear_console();
    print($text);
    $response = readline('Confirm registration? [Y]: ');
    $response = strtolower(trim($response));
    if(preg_match($this->response_regex_with_default, $response)) {
      $this->confirm_registration();
    } else {
      $this->registration_confirmed = false;
    }
  }

  private function write_config_file_if_user_chooses() {
    $text = "All of the sample code in this directory requires a\n" .
            "configuration file in the parent directory\n" .
            "(../config.json). You can create the file by hand by\n" .
            "using ../config.json.example as an example or you can\n" .
            "have this program create it for you.\n";
    $this->clear_console();
    print($text);
    $response = readline('Create configuration file? [Y]: ');
    $response = strtolower(trim($response));
    if(preg_match($this->response_regex_with_default, $response)) {
      $this->write_config_file();
    } else {
      $this->config_file_created = false;
    }
  }

  private function report_results() {
    $text = "Setup complete.\n" .
            ("Registration was " . ($this->registration_confirmed ? "" : "not ") . "confirmed.\n") .
            ("Configuration file was " . ($this->config_file_created ? "" : "not ") . "created.\n\n");
    $this->clear_console();
    print($text);
  }

  private function confirm_registration() {
    if($this->graphql_endpoint === null) {
      $this->graphql_endpoint = $this->get_graphql_endpoint();
    }
    if($this->password === null) {
      $this->password = $this->get_password(true);
    }
    $token = $this->get_confirmation_token();
    $mutation = $this->build_confirmation_mutation($this->password, $token);
    $server_response = $this->post_registration_confirmation($mutation);
    $success_message = 'Registration confirmation succeeded. ' .
                       'You can log in and begin processing statements.';
    if(isset($server_response->data->confirmRegistration->message) &&
       $server_response->data->confirmRegistration->message === $success_message) {
      $this->registration_confirmed = true;
      readline("\nRegistration confirmation succeeded. Press enter to continue. ");
    } else {
      print(json_encode($server_response, JSON_PRETTY_PRINT) . "\n");
      print("Registration failed.  Please correct the error above and try again.\n");
      exit;
    }
  }

  private function write_config_file() {
    $write = true;
    if(file_exists($this->config_file_name)) {
      $response = readline("\nConfiguration file exists.  Overwrite? [N]: ");
      $response = strtolower(trim($response));
      if(!preg_match($this->response_regex, $response)) {
        $write = false;
        $msg = 'Not modifying existing configuration file.';
      }
    }
    if($write) {
      if($this->graphql_endpoint === null) {
        $this->graphql_endpoint = $this->get_graphql_endpoint();
      }
      $email_address = $this->get_email_address();
      if($this->password === null) {
        $this->password = $this->get_password();
      }
      $config = [ 'baseUrl' => $this->graphql_endpoint,
                  'loginData' => [ 'email' =>    $email_address,
                                   'password' => $this->password ] ];
      $config_file = fopen($this->config_file_name, "w");
      fwrite($config_file,
             json_encode($config, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n");
      fclose($config_file);
      $msg = 'Configuration file was created.';
      $this->config_file_created = true;
    }
    print("\n" . $msg . "\n");
    readline("Press enter to continue. ");
  }

  # Slightly kludgey way to clear the console window.
  # Silently fails if neither command works.
  private function clear_console() {
    (system("clear")) || (system("cls"));
  }

  private function get_graphql_endpoint() {
    print("\nAvailable environments\n");
    foreach($this->environments as $key=>$value) {
      print("\t" . $key . ': ' . $value[0] . "\n");
    }
    $response = readline('Select the OtterTax environment you will be using [1]: ');
    $response = trim($response);
    if($response === '') $response = '1';
    if(!array_key_exists($response, $this->environments)) {
      print("\nInvalid environment.  Exiting.\n");
      exit;
    }
    $environment = $this->environments[$response];
    return($environment[1]);
  }
  private function get_password($new_password=false) {
    if($new_password) {
      $text = "\nEnter the password you will use to access OtterTax.\n" .
              "Please choose a secure password of at least 20 characters.\n";
      print($text);
      $password = readline('Your password: ');
    } else {
      $password = readline("\nEnter your OtterTax password: ");
    }
    return($password);
  }

  private function get_email_address() {
    $text = "\nEnter the email address you used when you registered with\n" .
           "OtterTax.\n";
    $address = readline('Your email address: ');
    return($address);
  }

  private function get_confirmation_token() {
    $text = "\nEnter the confirmation token from the email you received\n" .
            "after registering.";
    $token = readline('Your token: ');
    return($token);
  }

  private function build_confirmation_mutation($password, $confirmation_token) {
    $mutation = <<<END_MUTATION
      mutation {
      confirmRegistration(
        confirmationToken: "{$confirmation_token}",
        password: "{$password}"
      ) {
          message
        }
      }
    END_MUTATION ;
    return($mutation);
  }

  private function post_registration_confirmation($payload) {
    $endpoint = $this->graphql_endpoint . '/v2/graphql';
    $headers = ["Content-Type: application/json"];
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
    list($raw_headers, $raw_body) = explode("\r\n\r\n", $server_output, 2);
    if(preg_match('/^200/', $http_code)) {
      return(json_decode($raw_body));
    } else {
      print("\nResponse code from server was " . $http_code . '.');
      print("\n" . $raw_body . "\n");
      return(new stdClass());
    }
  }
}

$setup = new Setup();
$setup->setup();

?>
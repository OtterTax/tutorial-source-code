require( 'net/http' )
require( 'uri' )
require( 'json' )
require( 'io/console' )

module OTX
  class Setup
    def initialize
      @config_file_name = '../config.json'
      @response_regex = /^y(?:es)?$/
      @response_regex_with_default = /(?:^$)|(?:^y(?:es)?$)/
      @environments = { '1' => ['Sandbox','https://sandbox.ottertax.com'],
                        '2' => ['Production','https://api.ottertax.com'] }
    end
    # Run the main methods required to complete the setup.
    def setup
      print_introduction
      confirm_registration_if_user_chooses
      write_config_file_if_user_chooses
      report_results
    end
    
    private
    
    # Provide the user with information about what the program will do.
    def print_introduction
      text = "This program helps with two tasks that must be completed \n" \
             "before running the demo programs.  First, it confirms your\n" \
             "registration, and second, it creates a configuration file\n" \
             "with your login information.\n" \
             "Either of these tasks can also be completed by hand, so\n" \
             "both are optional."
      clear_console
      STDOUT.puts( text )
      STDOUT.write( 'Press enter to continue. ' )
      STDIN.gets
    end
    # Provide the user with information about registration confirmation.
    # Ask the user if they want to confirm their registration and
    # call the confirm_registration method if the answer is yes.
    def confirm_registration_if_user_chooses
      text = "Would you like to confirm your registration?\n" \
             "To confirm your registration, you must first complete the\n" \
             "registration process to create an account.\n" \
             "To register for the OtterTax sandbox, go to\n" \
             "https://sandbox.ottertax.com/register."
      clear_console
      STDOUT.puts( text )
      STDOUT.write( 'Confirm registration? [Y]: ' )
      response = STDIN.gets.chomp.downcase
      if( response =~ @response_regex_with_default )
        confirm_registration
      else
        @registration_confirmed = false
      end
    end
    # Provide the user with information about creating the configuration file.
    # Ask the user if they want to create the configuration file and
    # call the write_config_file method if the answer is yes.
    def write_config_file_if_user_chooses
      text = "All of the sample code in this directory requires a\n" \
             "configuration file in the parent directory\n" \
             "(../config.json). You can create the file by hand by\n" \
             "using ../config.json.example as an example or you can\n" \
             "have this program create it for you."
      clear_console
      STDOUT.puts( text )
      STDOUT.write( 'Create configuration file? [Y]: ' )
      response = STDIN.gets.chomp.downcase
      if( response =~ @response_regex_with_default )
        write_config_file
      else
        @config_file_created = false
      end
    end
    # Report the actions taken to the user.
    def report_results
      text = "Setup complete.\n" +
             ("Registration was " + (@registration_confirmed ? "" : "not ") + "confirmed.\n") +
             ("Configuration file was " + (@config_file_created ? "" : "not ") + "created.")
      clear_console
      STDOUT.puts( text )
    end
    # Confirm the user's registration.
    # This method delegates work to other methods, the most important of which
    # are build_confirmation_mutation and post_registration_confirmation.
    # See each of those methods for more information about their operation.
    def confirm_registration
      @graphql_endpoint ||= get_graphql_endpoint
      @password ||= get_password( new_password: true )
      token = get_confirmation_token
      mutation = build_confirmation_mutation( password: @password,
                                              confirmation_token: token )
      server_response = post_registration_confirmation( payload: mutation )
      success_message = 'Registration confirmation succeeded. ' \
                        'You can log in and begin processing statements.'
      message = server_response.dig( 'data', 'confirmRegistration', 'message' )
      if( message == success_message )
        @registration_confirmed = true
        STDOUT.write( "\nRegistration confirmation succeeded. Press enter to continue. " )
        STDIN.gets
      else
        STDOUT.puts( JSON.pretty_generate( server_response ) )
        STDOUT.puts( "\nRegistration failed.  Please correct the error above and try again." )
        exit
      end
    end
    # Write the configuration file.
    # If the file already exists, confirm that the user wants to overwrite it first.
    def write_config_file
      write = true
      if( File.exist?( @config_file_name ) )
        STDOUT.write( "\nConfiguration file exists.  Overwrite? [N]: " )
        response = STDIN.gets.chomp.downcase
        unless( response =~ @response_regex )
          write = false
          msg = 'Not modifying existing configuration file.'
        end
      end
      if( write )
        @graphql_endpoint ||= get_graphql_endpoint
        email_address = get_email_address
        @password ||= get_password
        config = { 'baseUrl' => @graphql_endpoint,
                  'loginData' => { 'email' =>     email_address,
                                   'password' =>  @password } }
        File.open( @config_file_name, 'w' ) { |f| f.puts( JSON.pretty_generate( config ) ) }
        msg = 'Configuration file was created.'
        @config_file_created = true
      end
      STDOUT.write( "\n#{msg} Press enter to continue. " )
      STDIN.gets
    end
    # Slightly kludgey way to clear the console window.
    # Silently fails if neither command works.
    def clear_console
      (system "clear") || (system "cls")
    end
    # Get the base GraphQL endpoint that corresponds to the environment that the user wishes to
    # configure.
    # @return [String] The base GraphQL endpoint, for example https://sandbox.ottertax.com.
    def get_graphql_endpoint
      STDOUT.puts( "\nAvailable environments" )
      @environments.each do |k,v|
        STDOUT.puts( "\t#{k}: #{v[0]}" )
      end
      STDOUT.write( 'Select the OtterTax environment you will be using [1]: ' )
      response = STDIN.gets.chomp
      response = '1' if( response == '' )
      environment = @environments[response]
      if( environment == nil )
        STDOUT.puts( 'Invalid environment.  Exiting.' )
        exit
      end
      environment[1]
    end
    # Get the user's password, either a new password or an existing password.
    # @param new_password [Boolean] If true, print information about minimum password
    #   length.  If false, prompt user for their existing password.
    # @return [String] The user's password.
    def get_password( new_password: false )
      if( new_password )
        text = "\nEnter the password you will use to access OtterTax.\n" \
               "Please choose a secure password of at least 20 characters.\n" \
               "Your entry will not be displayed on screen.\n"
      else
        text = "\nEnter your OtterTax password.\n" \
               "Your entry will not be displayed on screen.\n"
      end
      STDOUT.puts( text )
      IO.console.getpass( "Your password: " )
    end
    # Get the user's email address.
    # @return [String] The user's email address.
    def get_email_address
      text = "\nEnter the email address you used when you registered with\n" \
             "OtterTax."
      STDOUT.puts( text )
      STDOUT.write( 'Your email address: ' )
      STDIN.gets.chomp
    end
    # Get the user's confirmation token. Confirmation tokens are emailed to users
    # after successful registration.
    # @return [String] The user's confirmation token.
    def get_confirmation_token
      text = "\nEnter the confirmation token from the email you received\n" \
             "after registering."
      STDOUT.puts( text )
      STDOUT.write( 'Your token: ' )
      STDIN.gets.chomp
    end
    # Build the GraphQL mutation for confirming a user's registration.
    # @param password [String] The password the user uses to access the OtterTax API.
    # @param confimation_token [String] The confirmation token received by the user after
    #   completing the registration process.
    # @return [String] The full GraphQL mutation.
    def build_confirmation_mutation( password:, confirmation_token: )
      <<-END_MUTATION
        mutation {
        confirmRegistration(
          confirmationToken: "#{confirmation_token}",
          password: "#{password}"
        ) {
            message
          }
        }
      END_MUTATION
    end
    # Post the mutation for confirming a user's registration.
    # @param payload [String] The GraphQL mutation for confirming registrations.
    # @return [Object] The response from the server formatted as a ruby object.
    def post_registration_confirmation( payload: )
      uri = URI( "#{@graphql_endpoint}/v2/graphql" )
      header = { 'Content-Type': 'application/json' }
      Net::HTTP.start(uri.host, uri.port,
        :read_timeout => 720,
        :open_timeout => 60,
        :use_ssl => uri.scheme == 'https') do |http|

        request = Net::HTTP::Post.new(uri.request_uri, header )
        request.body = {query: payload}.to_json
        response = http.request( request )

        if( response.code == '200' )
          JSON.parse( response.body )
        else
          STDOUT.puts( "Response code from server was #{response.code}." )
          STDOUT.puts( response.inspect )
          {}
        end
      end
    end

  end
end

setup = OTX::Setup.new
setup.setup

require( 'net/http' )
require( 'uri' )
require( 'json' )

module OTX
  module Helpers
    # Obtain an access credential with the email address and password specified in ../config.json.
    # You must first register to obtain a vaild email/password.  Register for the sandbox at
    # https://sandbox.ottertax.com/register and follow instructions for confirming your
    # registration at https://doc.ottertax.com/registration/registration_confirmation.
    #
    # The server is specified in the baseUrl parameter of ../config.json
    # @return [Hash] A valid authentication credential.
    def get_credential
      login_data = get_config_element('loginData')
      endpoint = get_config_element('baseUrl') + '/v2/auth/sign_in'
      uri = URI( endpoint )
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = (uri.scheme == 'https')
      if( http.use_ssl? )
        http.verify_mode = OpenSSL::SSL::VERIFY_PEER
      end
      request = Net::HTTP::Post.new(uri.request_uri, { 'Content-Type': 'application/json' } )
      request.body = JSON.generate( login_data )
      response = http.request(request)
      { 'access-token' => response['access-token'],
        'client' =>       response['client'],
        'uid' =>          response['uid'] }
    end
    # Delete the given access credential from the server.
    # The server is specified in the baseUrl parameter of ../config.json
    # @param credential [Hash] The access credential to be
    #   deleted from the server.
    # @return [TrueClass, FalseClass] True if the credential
    #   was successfully deleted, false otherwise.
    def delete_credential( credential: )
      endpoint = get_config_element('baseUrl') + '/v2/auth/sign_out'
      uri = URI( endpoint )
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = (uri.scheme == 'https')
      if( http.use_ssl? )
        http.verify_mode = OpenSSL::SSL::VERIFY_PEER
      end
      header = credential.merge( { 'Content-Type': 'application/json' } )
      request = Net::HTTP::Delete.new(uri.request_uri, header )
      response = http.request(request)
      resp = JSON.parse( response.body )
      if( !resp.nil? && resp.is_a?( Hash ) && resp['success'] == true )
        success = true
      else
        success = false
        STDOUT.puts( 'Logout failed.' )
      end
      success
    end
    # Get data from a given file.  The file must contain data in JSON format.
    # @param filename [String] The name of the data file.
    # @return [Object] The data formatted as a ruby object.
    def get_data( filename: )
      JSON.parse(IO.read(filename))
    end
    # Convert a ruby object to its GraphQL equivalent.
    # @param object [Object] The object to be converted.
    # @return [String] The GraphQL representation of the object which can be included in a
    #   query or mutation.
    def to_gql( object: )
      items = Array.new
      object.each do |k, v|
        value = v.is_a?( Hash ) ? to_gql( object: v ) : JSON.generate( v )
        items << "#{k}: #{value}"
      end
      "{\n" + items.join( "\n" ) + "\n}\n"
    end
    # Post a query or mutation to the server defined in the baseUrl parameter of ../config.json.
    # @param credential [Hash] A valid credential, typically obtained by get_credential.
    # @param payload [String] A GraphQL query or mutation to send to the server.
    # @return [Object] The response from the server formatted as a ruby object.
    def post_gql( credential:, payload: )
      uri = URI( get_config_element('baseUrl') + '/v2/graphql' )
      header = credential.merge( { 'Content-Type': 'application/json' } )
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

    private

    # Check to be sure the configuration file exists, then
    # get the given configuration element from the configuration file.
    # @return [String] The requested configuration element.
    def get_config_element( element_name )
      unless( File.exist?( '../config.json' ) )
        STDOUT.puts( 'No configuration file found.' )
        STDOUT.puts( "Run 'setup.rb' to create one." )
        STDOUT.puts( "Or use '../config.json.example' as a sample to build it from scratch." )
        exit
      end
      config = JSON.parse(IO.read( '../config.json' ) )
      config[element_name]
    end
  end
end

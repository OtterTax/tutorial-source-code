require( 'json' )

response_regex = /^y(?:es)?$/
config_file_name = '../config.json'
if( File.exist?( config_file_name ) )
  STDOUT.write( 'Configuration file exists.  Overwrite? [N]: ' )
  response = STDIN.gets.chomp.strip.downcase
  unless( response =~ response_regex )
    STDOUT.puts( 'Exiting without modifying existing configuration file.' )
    exit
  end
end

STDOUT.puts( 'To run these programs, you must first register and create an account.' )
STDOUT.puts( 'To register for the OtterTax sandbox, go to' )
STDOUT.puts( 'https://sandbox.ottertax.com/register.' )
STDOUT.puts
STDOUT.write( 'Press enter to continue. ' )

STDIN.gets

environments = { '1' => 'Sandbox',
                 '2' => 'Production' }
urls = { '1' => 'https://sandbox.ottertax.com',
         '2' => 'https://prod.ottertax.com' }
STDOUT.puts( 'Available environments' )
environments.each do |k,v|
  STDOUT.puts( "\t#{k}: #{v}" )
end
STDOUT.write( 'Select the OtterTax environment you will be using [1]: ' )
response = STDIN.gets.chomp.strip
response = '1' if( response == '' )
base_url = urls[response]
if( base_url == nil )
  STDOUT.puts( 'Invalid environment.  Exiting.' )
  exit
end
environment = environments[response].downcase
STDOUT.write( "Enter the email address you used to register for the #{environment} environment: " )
email = STDIN.gets.chomp
STDOUT.write( "Enter your password for the #{environment} environment: " )
password = STDIN.gets.chomp

config = { 'baseUrl' => base_url,
           'loginData' => { 'email' => email,
                            'password' => password } }
File.open( config_file_name, 'w' ) { |f| f.puts( JSON.pretty_generate( config ) ) }
STDOUT.puts( "File '#{config_file_name}' was successfully created." )

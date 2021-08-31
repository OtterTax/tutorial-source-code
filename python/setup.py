import re
import os
import json
import getpass
from gql import gql, Client
from gql.transport.aiohttp import AIOHTTPTransport

class Setup:
    def __init__(self):
        self.config_file_name = '../config.json';
        self.response_regex = "^y(?:es)?$";
        self.response_regex_with_default = "(?:^$)|(?:^y(?:es)?$)";
        self.environments = { '1': ['Sandbox','https://sandbox.ottertax.com'],
                              '2': ['Production','https://prod.ottertax.com'] }
        self.registration_confirmed = False
        self.config_file_created = False

    def setup(self):
        self.print_introduction()
        self.confirm_registration_if_user_chooses()
        self.write_config_file_if_user_chooses()
        self.report_results()

    def print_introduction(self):
        text = "This program helps with two tasks that must be completed \n" + \
               "before running the demo programs.  First, it confirms your\n" + \
               "registration, and second, it creates a configuration file\n" + \
               "with your login information.\n" + \
               "Either of these tasks can also be completed by hand, so\n" + \
               "both are optional.\n"
        self.clear_console()
        print( text )
        input( 'Press enter to continue. ' )

    def confirm_registration_if_user_chooses(self):
        text = "Would you like to confirm your registration?\n" + \
               "To confirm your registration, you must first complete the\n" + \
               "registration process to create an account.\n" + \
               "To register for the OtterTax sandbox, go to\n" + \
               "https://sandbox.ottertax.com/register.\n"
        self.clear_console()
        print( text )
        response = input( 'Confirm registration? [Y]: ' )
        response = response.strip().lower()
        if(re.match(self.response_regex_with_default, response)):
            self.confirm_registration()
        else:
            print("Not confirming registration.\n")

    def write_config_file_if_user_chooses(self):
        text = "All of the sample code in this directory requires a\n" + \
               "configuration file in the parent directory\n" + \
               "(../config.json). You can create the file by hand by\n" + \
               "using ../config.json.example as an example or you can\n" + \
               "have this program create it for you.\n"
        self.clear_console()
        print( text )
        response = input( 'Create configuration file? [Y]: ' )
        response = response.strip().lower()
        if(re.match(self.response_regex_with_default, response)):
            self.write_config_file()
        else:
            print("Not writing configuration file.\n")

    def report_results(self):
        if(self.registration_confirmed):
            registration_text = 'Registration was confirmed.'
        else:
            registration_text = 'Registration was not confirmed.'
        if(self.config_file_created):
            configuration_text = 'Configuration file was created.'
        else:
            configuration_text = 'Configuration file was not created.'
        text = "Setup complete.\n" + registration_text + "\n" + \
               configuration_text + "\n"
        self.clear_console()
        print(text)

    def confirm_registration(self):
        if not hasattr(self, 'graphql_endpoint'):
            self.graphql_endpoint = self.get_graphql_endpoint()
        if not hasattr(self, 'password'):
            self.password = self.get_password(True)
        token = self.get_confirmation_token()
        mutation = self.build_confirmation_mutation(self.password, token)
        server_response = self.post_registration_confirmation(mutation)
        success_message = 'Registration confirmation succeeded. ' + \
                          'You can log in and begin processing statements.'
        success = False
        try:
            if server_response.data.confirmRegistration.message == success_message:
                success = True
        except AttributeError:
            pass
        if success:
            this.registration_confirmed = True
            input("\nRegistration confirmation succeeded. Press enter to continue. ")
        else:
            print(json.dumps(server_response, indent = 2))
            print("\nRegistration failed.  Please correct the error above and try again.\n")
            quit()

    def write_config_file(self):
        write = True
        if os.path.exists(self.config_file_name):
            response = input("\nConfiguration file exists.  Overwrite? [N]: ")
            response = response.strip().lower()
            if(not re.match(self.response_regex, response)):
                write = False
                msg = 'Not modifying existing configuration file.'
        if(write):
            if not hasattr(self, 'graphql_endpoint'):
                self.graphql_endpoint = self.get_graphql_endpoint()
            email_address = self.get_email_address()
            if not hasattr(self, 'password'):
                self.password = self.get_password(True)
            config = { 'baseUrl': self.graphql_endpoint,
                      'loginData': { 'email':     email_address,
                                     'password':  self.password } }
            config_file = open(self.config_file_name, 'w')
            config_file.write(json.dumps(config, indent = 2))
            config_file.close()
            msg = 'Configuration file was created.'
            self.config_file_created = True
        input("\n" + msg + "\nPress enter to continue. ")

    def clear_console(self):
        (os.system("clear")) or (os.system("cls"))

    def get_graphql_endpoint(self):
        print("\nAvailable environments")
        for key, value in self.environments.items():
          print("\t%s: %s" %(key, value[0]))
        response = input('Select the OtterTax environment you will be using [1]: ');
        response = response.strip().lower()
        if(response == ''):
          response = '1'
        if(not response in self.environments):
          print("\nInvalid environment.  Exiting.\n")
          quit()
        environment = self.environments[response]
        return(environment[1])

    def get_password(self, new_password=False):
        if(new_password):
          text = "\nEnter the password you will use to access OtterTax.\n" + \
                 "Please choose a secure password of at least 20 characters.\n" + \
                 "Your entry will not be displayed on screen.\n"
        else:
          text = "\nEnter your OtterTax password.\n" + \
                 "Your entry will not be displayed on screen.\n"
        print(text)
        password = getpass.getpass('Your password: ')
        return(password)
    
    def get_email_address(self):
        text = "\nEnter the email address you used when you registered with\n" + \
               "OtterTax."
        print( text )
        address = input('Your email address: ')
        return(address)

    def get_confirmation_token(self):
        text = "\nEnter the confirmation token from the email you received\n" + \
               "after registering."
        print( text )
        token = input('Your confirmation token: ')
        return(token)
  
    def build_confirmation_mutation(self, password, confirmation_token):
        mutation = """
          mutation {
          confirmRegistration(
            confirmationToken: "%s",
            password: "%s"
          ) {
              message
            }
          }
        """ % (confirmation_token, password)
        return(mutation)

    def post_registration_confirmation(self, payload):
        transport = AIOHTTPTransport(url=self.graphql_endpoint + '/v2/graphql')
        client = Client(transport=transport, fetch_schema_from_transport=True)
        query = gql(payload)
        try:
          result = client.execute(query)
          return(result)
        except Exception as e:
          print(e)
          return(dict())


setup = Setup()
setup.setup()
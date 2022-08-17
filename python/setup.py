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
                              '2': ['Production','https://api.ottertax.com'] }
        self.registration_confirmed = False
        self.config_file_created = False

    def setup(self):
        """Run the main methods to complete the setup."""
        self._print_introduction()
        self._confirm_registration_if_user_chooses()
        self._write_config_file_if_user_chooses()
        self._report_results()

    def _print_introduction(self):
        """Provide the user with information about what the program will do."""
        text = "This program helps with two tasks that must be completed \n" + \
               "before running the demo programs.  First, it confirms your\n" + \
               "registration, and second, it creates a configuration file\n" + \
               "with your login information.\n" + \
               "Either of these tasks can also be completed by hand, so\n" + \
               "both are optional.\n"
        self._clear_console()
        print( text )
        input( 'Press enter to continue. ' )

    def _confirm_registration_if_user_chooses(self):
        """Provide the user with information about registration confirmation.

        Ask the user if they want to confirm their registration and
        call the _confirm_registration method if the answer is yes.
        """

        text = "Would you like to confirm your registration?\n" + \
               "To confirm your registration, you must first complete the\n" + \
               "registration process to create an account.\n" + \
               "To register for the OtterTax sandbox, go to\n" + \
               "https://sandbox.ottertax.com/register.\n"
        self._clear_console()
        print( text )
        response = input( 'Confirm registration? [Y]: ' )
        response = response.strip().lower()
        if(re.match(self.response_regex_with_default, response)):
            self._confirm_registration()
        else:
            print("Not confirming registration.\n")

    def _write_config_file_if_user_chooses(self):
        """Provide the user with information about creating the configuration file.

        Ask the user if they want to create the configuration file and
        call the _write_config_file method if the answer is yes.
        """

        text = "All of the sample code in this directory requires a\n" + \
               "configuration file in the parent directory\n" + \
               "(../config.json). You can create the file by hand by\n" + \
               "using ../config.json.example as an example or you can\n" + \
               "have this program create it for you.\n"
        self._clear_console()
        print( text )
        response = input( 'Create configuration file? [Y]: ' )
        response = response.strip().lower()
        if(re.match(self.response_regex_with_default, response)):
            self._write_config_file()
        else:
            print("Not writing configuration file.\n")

    def _report_results(self):
        """Report the actions taken to the user."""
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
        self._clear_console()
        print(text)

    def _confirm_registration(self):
        """Confirm the user's registration.

        This method delegates work to other methods, the most important of which
        are _build_confirmation_mutation and _post_registration_confirmation.
        See each of those methods for more information about their operation.
        """

        if not hasattr(self, 'graphql_endpoint'):
            self.graphql_endpoint = self._get_graphql_endpoint()
        if not hasattr(self, 'password'):
            self.password = self._get_password(True)
        token = self._get_confirmation_token()
        mutation = self._build_confirmation_mutation(self.password, token)
        server_response = self._post_registration_confirmation(mutation)
        success_message = 'Registration confirmation succeeded. ' + \
                          'You can log in and begin processing statements.'
        success = False
        try:
            if server_response['confirmRegistration']['message'] == success_message:
                success = True
        except AttributeError:
            pass
        if success:
            self.registration_confirmed = True
            input("\nRegistration confirmation succeeded. Press enter to continue. ")
        else:
            print(json.dumps(server_response, indent = 2))
            print("\nRegistration failed.  Please correct the error above and try again.\n")
            quit()

    def _write_config_file(self):
        """Write the configuration file.

        If the file already exists, confirm that the user wants to overwrite it first.
        """

        write = True
        if os.path.exists(self.config_file_name):
            response = input("\nConfiguration file exists.  Overwrite? [N]: ")
            response = response.strip().lower()
            if(not re.match(self.response_regex, response)):
                write = False
                msg = 'Not modifying existing configuration file.'
        if(write):
            if not hasattr(self, 'graphql_endpoint'):
                self.graphql_endpoint = self._get_graphql_endpoint()
            email_address = self._get_email_address()
            if not hasattr(self, 'password'):
                self.password = self._get_password(True)
            config = { 'baseUrl': self.graphql_endpoint,
                      'loginData': { 'email':     email_address,
                                     'password':  self.password } }
            config_file = open(self.config_file_name, 'w')
            config_file.write(json.dumps(config, indent = 2))
            config_file.close()
            msg = 'Configuration file was created.'
            self.config_file_created = True
        input("\n" + msg + "\nPress enter to continue. ")

    def _clear_console(self):
        """Clear the console window."""
        command = 'clear'
        if os.name in ('nt', 'dos'):
            command = 'cls'
        os.system(command)

    def _get_graphql_endpoint(self):
        """Get the base GraphQL endpoint.

        The endpoint corresponds to the environment that the user wishes to configure.
        :return: The base GraphQL endpoint, for example https://sandbox.ottertax.com
        :rtype: str
        """

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

    def _get_password(self, new_password=False):
        """Get the user's password, either a new password or an existing password.

        :param bool new_password: If true, print information about minimum password
          length.  If false, prompt user for their existing password.  Optional.
          Defaults to false.
        :return: The user's password
        :rtype: str
        """

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
    
    def _get_email_address(self):
        """Get the user's email address.

        :return: The user's email address
        :rtype: str
        """

        text = "\nEnter the email address you used when you registered with\n" + \
               "OtterTax."
        print( text )
        address = input('Your email address: ')
        return(address)

    def _get_confirmation_token(self):
        """Get the user's confirmation token.

        Confirmation tokens are emailed to users after successful registration.
        :return: The user's confirmation token
        :rtype: str
        """

        text = "\nEnter the confirmation token from the email you received\n" + \
               "after registering."
        print( text )
        token = input('Your confirmation token: ')
        return(token)
  
    def _build_confirmation_mutation(self, password, confirmation_token):
        """Build the GraphQL mutation for confirming a user's registration.

        :param str password: The password the user uses to access the OtterTax API
        :param str confimation_token: The confirmation token received by the user after
          completing the registration process
        :return: The full GraphQL mutation
        :rtype: str
        """

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

    def _post_registration_confirmation(self, payload):
        """Post the mutation for confirming a user's registration.

        :param str payload: The GraphQL mutation for confirming registrations
        :return: The response from the server
        :rtype: dict
        """

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
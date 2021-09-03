import json
import requests
from gql import gql, Client
from gql.transport.aiohttp import AIOHTTPTransport
from os.path import exists

class Helper:
    def get_credential(self):
        """Obtain an access credential.

        The email address and password are read from ../config.json.
        You must first register to obtain a vaild email/password.
        Register for the sandbox at
        https://sandbox.ottertax.com/register and follow instructions
        for confirming your registration at
        https://doc.ottertax.com/registration/registration_confirmation.
        
        The server is specified in the baseUrl parameter of ../config.json

        :return: A valid authentication credential
        :rtype: dict
        """

        login_data = self._get_config_element('loginData')
        endpoint = self._get_config_element('baseUrl') + '/v2/auth/sign_in'
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json" }
        body = json.dumps(login_data).encode("utf-8")
        response = requests.post(endpoint, data=body, headers=headers)
        headers = response.headers
        credential = {
            "access-token": headers['access-token'],
            "client":       headers['client'],
            "uid":          headers['uid'] }
        return(credential)

    def delete_credential(self, credential):
        """Delete an access credential obtained by the get_credential method.

        :param dict credential: The credential to delete
        :return: Success or failure
        :rtype: bool
        """

        endpoint = self._get_config_element('baseUrl') + '/v2/auth/sign_out'
        headers = credential.copy()
        headers.update({'Content-Type': 'application/json'})
        response = requests.delete(endpoint, headers=headers)
        resp = json.loads(response.text)
        if(resp is not None and resp['success'] == True):
          success = True
        else:
          success = False
        return(success)

    def get_data(self, filename):
        """Get data from a given file.  The file must contain data in JSON format.

        :param str filename: The name of the data file.
        :return: The requested data
        :rtype: dict
        """

        contents = open(filename).read()
        return(json.loads(contents))

    def to_gql(self, object):
        """Convert a dict object to its GraphQL equivalent.

        :param dict object: The object to be converted
        :return: The GraphQL representation of the object which can be included in a
          query or mutation.
        :rtype: str
        """

        items = []
        for k, v in object.items():
            value = self.to_gql(v) if(type(v) == dict) else json.dumps(v)
            items.append(k + ': ' + value)
        str = "{\n" + "\n".join(items) + "\n}\n"
        return(str)

    def post_gql(self, credential, payload):
        """Post a query or mutation to the server.

        The server is defined in the baseUrl parameter of ../config.json.
        :param dict credential: A valid credential, typically obtained by get_credential
        :param str payload: A GraphQL query or mutation to send to the server
        :return: The response from the server
        :rtype: dict
        """

        uri = self._get_config_element('baseUrl') + '/v2/graphql'
        headers = credential.copy()
        headers.update({'Content-Type': 'application/json'})
        transport = AIOHTTPTransport(url = uri, headers = headers)
        query = gql(payload)
        client = Client(transport = transport, fetch_schema_from_transport = True)
        try:
            response = client.execute(query)
        except Exception as e:
            print("GQL call failed.")
            print("Error:\n%s" % str(e))
            response = {}
        return(response)

    def _get_config_element(self, element_name):
        """Get an element from the configuration file.

        Check to be sure the configuration file exists, and print an error if
        it does not.
        :return: The requested configuration element
        :rtype: str
        """

        if not exists('../config.json'):
            print('No configuration file found.')
            print("Run 'setup.py' to create one.")
            print("Or use '../config.json.example' as a sample to build it from scratch.")
            exit()
        contents = open('../config.json').read()
        config = json.loads(contents)
        return(config[element_name])


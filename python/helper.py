import json
import requests
from gql import gql, Client
from gql.transport.aiohttp import AIOHTTPTransport
from os.path import exists

class Helper:
    def get_credential(self):
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
        contents = open(filename).read()
        return(json.loads(contents))

    def to_gql(self, object):
        items = []
        for k, v in object.items():
            value = to_gql if(type(v) == dict) else json.dumps(v)
            items.append(k + ': ' + value)
        str = "{\n" + "\n".join(items) + "\n}\n"
        return(str)

    def post_gql(self, credential, payload):
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
        if not exists('../config.json'):
            print('No configuration file found.')
            print("Run 'setup.py' to create one.")
            print("Or use '../config.json.example' as a sample to build it from scratch.")
            exit()
        contents = open('../config.json').read()
        config = json.loads(contents)
        return(config[element_name])


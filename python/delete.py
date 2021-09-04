import json
from helper import Helper

class StatementDeleter:
    def __init__(self):
        self.helper = Helper()

    def _build_mutation(self, uploader_ids):
        """Build a GraphQL mutation for deleting statements.

        :param list uploader_ids: A list of uploader_ids representing
          the statements to be deleted
        :return: The full GraphQL delete mutation
        :rtype: str
        """

        data = "\n".join(map(lambda x: '"%s"' % (x), uploader_ids))
        str = """
          mutation {
            deleteStatements(
              uploaderIds: [ %s ]
            ) {
              errors
              deleteCount
            }
          }
        """ % (data)
        return(str)

    def delete(self):
        credential = self.helper.get_credential()
        uploader_ids = ['23913']
        mutation = self._build_mutation(uploader_ids)
        response = self.helper.post_gql(credential, mutation)
        # response is a dict that you can manipulate to suit your needs.
        # Here we're just going to print it (as a JSON object to make it
        # easier to read).
        print(json.dumps(response, indent = 2))
        # Credentials are valid for several days after they've been issued.
        # If you plan to do more work, you can use the same credential.  When done 
        # working, you should delete the credential to provide additional security.
        if(self.helper.delete_credential(credential)):
            print( "\nSuccessfully deleted credential." )

deleter = StatementDeleter()
deleter.delete()

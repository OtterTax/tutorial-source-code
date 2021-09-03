import json
from helper import Helper

class StatementSubmitter:
    def __init__(self):
        self.helper = Helper()

    def build_mutation(self, uploader_ids):
        """Build a GraphQL mutation for submitting statements to the IRS.

        Statements in the sandbox system are not submitted to the IRS; the
        mutation is provided for testing purposes only.
        :param list uploader_ids: A list of uploader_ids representing
          the statements to be submitted
        :return: The full GraphQL mutation to submit the statements
        :rtype: str
        """

        data = "\n".join(map(lambda x: '"%s"' % (x), uploader_ids))
        str = """
          mutation {
            submitStatements(uploaderIds: [ %s ]) {
              errors
              successCount
            }
          }
        """ % (data)
        return(str)

    def submit(self):
        credential = self.helper.get_credential()
        # Uploader IDs are provided by the user who uploads the statement.
        # See ../data/f1099nec-data.json
        uploader_ids = ['23911','23912','23913','23914','23915']
        mutation = self.build_mutation(uploader_ids)
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


submitter = StatementSubmitter()
submitter.submit()

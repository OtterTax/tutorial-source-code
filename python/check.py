import json
from helper import Helper

class StatementChecker:
    def __init__(self):
        self.helper = Helper()
  
    def build_query(self, uploader_ids):
        """Build a GraphQL mutation for checking statement validity.

        :param list uploader_ids: A list of uploader_ids representing
          the statements to be checked
        :return: The full GraphQL mutation to get the statements
        :rtype: str
        """

        data = "\n".join(map(lambda x: '"%s"' % (x), uploader_ids))
        str = """
          query {
            getF1099necStatements(
              uploaderIds: [
                %s
              ]
            ) {
              errors
              statements {
                pageInfo {
                  hasNextPage
                }
                nodes {
                  otxId
                  uploaderId
                  statementValid
                  validationMessages
                  status
                  statusDescription
                }
              }
            }
          }      
        """ % (data)
        return(str)

    def check(self):
        """Check statements with uploader IDs 23911-23915."""
        credential = self.helper.get_credential()
        # Uploader IDs are provided by the user who uploads the statement.
        # See ../data/f1099nec-data.json
        # IDs for non-existent statements (e.g., those that have been deleted) will be
        # silently ignored.
        uploader_ids = ['23911','23912','23913','23914','23915']
        query = self.build_query(uploader_ids)
        response = self.helper.post_gql( credential, query )
        # response is a dict that you can manipulate to suit your needs.
        # Here we're just going to print it (as a JSON object to make it
        # easier to read).
        print(json.dumps(response, indent = 2))
        # Credentials are valid for several days after they've been issued.
        # If you plan to do more work, you can use the same credential.  When done 
        # working, you should delete the credential to provide additional security.
        if(self.helper.delete_credential(credential)):
            print( "\nSuccessfully deleted credential." )


checker = StatementChecker()
checker.check()

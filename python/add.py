import json
from helper import Helper

class StatementAdder:
    def __init__(self):
        self.helper = Helper()

    def _build_mutation(self, statements):
        """Build the GraphQL mutation for adding new statements.

        :param list statements: The statements to add. Each statement
          is a dict
        :return: The full GraphQL add mutation
        :rtype: str
        """

        data = "\n".join(map(self.helper.to_gql, statements))
        str = """
          mutation {
            addF1099necStatements(
              statements: [
                %s
              ]
            ) {
              errors
              statements {
                recordNumber
                statement {
                  otxId
                  uploaderId
                  recipientFirstName
                  recipientLastName
                  tags
                }
                messages
              }
            }
          }
        """ % (data)
        return(str)

    def add(self):
        """Add the statements in ../data/f1099nec-data.json."""
        credential = self.helper.get_credential()
        # See the file ../data/f1099nec-data.json for statement data and format.
        statements = self.helper.get_data('../data/f1099nec-data.json')
        mutation = self._build_mutation(statements)
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


adder = StatementAdder()
adder.add()

import json
from helper import Helper

class StatementCorrector:
    def __init__(self):
        self.helper = Helper()
  
    def build_mutation(self, corrections):
        """Build a GraphQL mutation for updating (correcting) statements.

        :param list corrections: A list of changes to make.  Each set of 
          changes should be an uploader_id and a set of field/value pairs.
          See the format in ../data/f1099nec-corrections.json.
        :return: The full GraphQL update mutation
        :rtype: str
        """

        data = "\n".join(map(self.helper.to_gql, corrections))
        str = """
          mutation {
            updateF1099necStatements(
              statements: [ %s ]
            ) {
              statements {
                recordNumber
                statement {
                  otxId
                  uploaderId
                  nonemployeeComp
                  recipientCity
                  recipientZipCode
                }
                messages
              }
              errors
            }
          }      
        """ % (data)
        return(str)

    def correct(self):
        """Correct statements using data in ../data/f1099nec-corrections.json"""
        credential = self.helper.get_credential()
        # See ../data/f1099nec-corrections.json for correction format.
        corrections = self.helper.get_data('../data/f1099nec-corrections.json')
        mutation = self.build_mutation(corrections)
        response = self.helper.post_gql( credential, mutation )
        # response is a dict that you can manipulate to suit your needs.
        # Here we're just going to print it (as a JSON object to make it
        # easier to read).
        print(json.dumps(response, indent = 2))
        # Credentials are valid for several days after they've been issued.
        # If you plan to do more work, you can use the same credential.  When done 
        # working, you should delete the credential to provide additional security.
        if(self.helper.delete_credential(credential)):
            print( "\nSuccessfully deleted credential." )

corrector = StatementCorrector()
corrector.correct()

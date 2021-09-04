import os
import json
import base64
from helper import Helper

class StatementDownloader:
    def __init__(self):
        self.helper = Helper()
        self.download_directory = './statement_downloads'

    def _build_query(self, uploader_ids):
        """Build a GraphQL mutation for retrieving PDF versions of statements.

        :param list uploader_ids: A list of uploader_ids representing
          the statements to be downloaded
        :return: The full GraphQL mutation to get the statements 
        :rtype: str
        """

        data = "\n".join(map(lambda x: '"%s"' % (x), uploader_ids))
        str = """
          query {
            getStatements(
              uploaderIds: [ %s ]
            ) {
              errors
              statements {
                nodes {
                  otxId
                  uploaderId
                  pdf
                }
              }
            }
          }
        """ % (data)
        return(str)

    def download(self):
        """Download statements with uploader IDs 23911-23915."""
        self._prepare_download_directory()
        credential = self.helper.get_credential()
        # Uploader IDs are provided by the user who uploads the statement.
        # See ../data/f1099nec-data.json
        uploader_ids = ['23911','23912','23913','23914','23915']
        query = self._build_query(uploader_ids)
        response = self.helper.post_gql( credential, query )
        statements = response['getStatements']['statements']['nodes']
        for statement in statements:
            file_name = f'{self.download_directory}/stmt-{statement["uploaderId"]}.pdf'
            pdf_file = open(file_name, 'w+b')
            pdf_file.write(base64.b64decode(statement['pdf']))
            pdf_file.close()
        print( f'Statements successfully downloaded to {self.download_directory}.' )
        # Credentials are valid for several days after they've been issued.
        # If you plan to do more work, you can use the same credential.  When done 
        # working, you should delete the credential to provide additional security.
        if(self.helper.delete_credential(credential)):
            print( "\nSuccessfully deleted credential." )
    
    def _prepare_download_directory(self):
        """Be sure the download directory exists."""
        if not os.path.isdir(self.download_directory):
            os.mkdir(self.download_directory)


downloader = StatementDownloader()
downloader.download()

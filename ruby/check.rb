require( 'json' )
require_relative( './helpers' )

module OTX
  class StatementChecker
    include OTX::Helpers
    
    # Build a GraphQL mutation for checking statement validity.
    # @param uploader_ids [Array] An array of uploader_ids representing
    #   the statements to be checked.
    # @return [String] The full GraphQL mutation to get the statements.
    def build_query( uploader_ids: )
      data = uploader_ids.map{ |x| "\"#{x}\"" }.join( "\n" )
      <<-END_QUERY
        query {
          getF1099necStatements(
            uploaderIds: [
              #{data}
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
        END_QUERY
    end
    def check
      credential = get_credential
      # Uploader IDs are provided by the user who uploads the statement.
      # See ../data/f1099nec-data.json
      # IDs for non-existent statements (e.g., those that have been deleted) will be
      # silently ignored.
      uploader_ids = ['23911','23912','23913','23914','23915']
      query = build_query(uploader_ids: uploader_ids)
      response = post_gql( credential: credential,
                           payload: query )
      # response is a hash that you can manipulate to suit your needs.
      # Here we're just going to print it (as a JSON object to make it
      # easier to read).
      STDOUT.puts( JSON.pretty_generate( response ) )
      # Credentials are valid for several days after they've been issued.
      # If you plan to do more work, you can use the same credential.  When done 
      # working, you should delete the credential to provide additional security.
      if( delete_credential( credential: credential ) )
        STDOUT.puts( "\nSuccessfully deleted credential." )
      end
    end
  end
end

checker = OTX::StatementChecker.new
checker.check


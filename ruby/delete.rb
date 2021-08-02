require_relative( './helpers' )

module OTX
  class StatementDeleter
    include OTX::Helpers

    # Build a GraphQL mutation for deleting statements.
    # @param uploader_ids [Array] An array of uploader_ids representing
    #   the statements to be deleted.
    # @return [String] The full GraphQL delete mutation.
    def build_mutation( uploader_ids: )
      data = uploader_ids.map{ |x| "\"#{x}\"" }.join( "\n" )
      <<-END_MUTATION
        mutation {
          deleteStatements(
            uploaderIds: [ #{data} ]
          ) {
            errors
            deleteCount
          }
        }
      END_MUTATION
    end
    def delete
      credential = get_credential
      uploader_ids = ['23913']
      mutation = build_mutation(uploader_ids: uploader_ids)
      response = post_gql( credential: credential,
                           payload: mutation )
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

deleter = OTX::StatementDeleter.new
deleter.delete

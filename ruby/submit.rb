require_relative( './helpers' )

module OTX
  class StatementSubmitter
    include OTX::Helpers

    # Build a GraphQL mutation for submitting statements to the IRS.
    # Statements in the sandbox system are not submitted to the IRS; the
    # mutation is provided for testing purposes only.
    # @param uploader_ids [Array] An array of uploader_ids representing
    #   the statements to be submitted.
    # @return [String] The full GraphQL mutation to submit the statements.
    def build_mutation( uploader_ids: )
      data = uploader_ids.map{ |x| "\"#{x}\"" }.join( "\n" )
      <<-END_MUTATION
        mutation {
          submitStatements(
            uploaderIds: [ #{data} ]
          ) {
            errors
            successCount
          }
        }
      END_MUTATION
    end
    def submit
      credential = get_credential
      statements = get_data( filename: '../data/f1099nec-data.json' );
      # Uploader IDs are provided by the user who uploads the statement.
      # See ../data/f1099nec-data.json
      uploader_ids = ['23911','23912','23913','23914','23915']
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

submitter = OTX::StatementSubmitter.new
submitter.submit

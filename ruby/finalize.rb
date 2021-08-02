require_relative( './helpers' )

module OTX
  class StatementFinalizer
    include OTX::Helpers

    # Build a GraphQL mutation for finalizing statements.
    # The mutation includes hard-coded bogus credit card information which was obtained from
    # https://fake-card-generator.com/
    #
    # Credit card information is optional when finalizing statements in the sandbox system,
    # and it is ignored when it is supplied (i.e., there is no charge for finalizing statements
    # in the sandbox system).  Credit card information is supported in the sandbox system so 
    # that users can fully test the finalizeStatements mutation.
    #
    # In the production system, the OtterTax watermark is removed from statements that have been
    # finalized, but the watermark is not removed in the sandbox system.
    #
    # @param uploader_ids [Array] An array of uploader_ids representing the statements to be
    #   finalized.
    # @return [String] The full GraphQL mutation to finalize the statements.
    def build_mutation( uploader_ids: )
      data = uploader_ids.map{ |x| "\"#{x}\"" }.join( "\n" )
      <<-END_MUTATION
        mutation {
          finalizeStatements(
            creditCard: {
              firstName: "Annalise"
              lastName: "Havemeyer"
              companyName: "Big Apple Analytics"
              address: "179 N. 13th Street, Suite 14C"
              city: "Brooklyn"
              state: "NY"
              zipCode: "11249"
              cardNumber: "371648189095315"
              cardExpiration: "0825"
              cvv: "3767"
            }
            uploaderIds: [ #{data} ]
          ) {
            errors
            messages {
              messages
              otxId
              uploaderId
            }
            successCount
          }
        }
      END_MUTATION
    end
    def finalize
      credential = get_credential
      statements = get_data( filename: '../data/f1099nec-data.json' );
      # Uploader IDs are provided by the user who uploads the statement.
      # See ../data/f1099nec-data.json
      # The list of IDs assumes that statement with ID 23913 was deleted by running delete.rb.
      uploader_ids = ['23911','23912','23914','23915']
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

finalizer = OTX::StatementFinalizer.new
finalizer.finalize

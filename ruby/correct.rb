require( 'json' )
require_relative( './helpers' )

module OTX
  class StatementCorrector
    include OTX::Helpers
    
    # Build a GraphQL mutation for updating (correcting) statements.
    # @param corrections [Array] An array changes to make.  Each set of 
    #   changes should be an uploader_id and a set of field/value pairs.
    #   See the format in ../data/f1099nec-corrections.json.
    # @return [String] The full GraphQL update mutation.
    def build_mutation( corrections: )
      data = corrections.map{ |s| to_gql( object: s ) }.join( "\n" )
      <<-END_MUTATION
        mutation {
          updateF1099necStatements(
            statements: [ #{data} ]
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
      END_MUTATION
    end
    def correct
      credential = get_credential
      # See ../data/f1099nec-corrections.json for correction format.
      corrections = get_data( filename: '../data/f1099nec-corrections.json' )
      mutation = build_mutation(corrections: corrections)
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

corrector = OTX::StatementCorrector.new
corrector.correct

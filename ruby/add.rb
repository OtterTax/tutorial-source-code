require_relative( './helpers' )

module OTX
  class StatementAdder
    include OTX::Helpers

    # Build the GraphQL mutation for adding new statements.
    # @param statements [Array] An array of statements to add.
    #   Each statement in the array is a ruby Hash.
    # @return [String] The full GraphQL add mutation.
    def build_mutation( statements: )
      data = statements.map{ |s| to_gql( object: s ) }.join( "\n" )
      <<-END_MUTATION
        mutation {
          addF1099necStatements(
            statements: [
              #{data}
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
      END_MUTATION
    end
    def add
      credential = get_credential
      # See the file ../data/f1099nec-data.json for statement data and format.
      statements = get_data( filename: '../data/f1099nec-data.json' )
      mutation = build_mutation(statements: statements)
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

adder = OTX::StatementAdder.new
adder.add

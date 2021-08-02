require( 'json' )
require( 'base64' )
require_relative( './helpers' )

module OTX
  class StatementDownloader
    include OTX::Helpers
    
    def initialize
      @download_directory = './statement_downloads'
    end
    # Build a GraphQL mutation for retrieving PDF versions of statements.
    # @param uploader_ids [Array] An array of uploader_ids representing
    #   the statements to be downloaded.
    # @return [String] The full GraphQL mutation to get the statements.
    def build_query( uploader_ids: )
      data = uploader_ids.map{ |x| "\"#{x}\"" }.join( "\n" )
      <<-END_QUERY
        query {
          getStatements(
            uploaderIds: [ #{data} ]
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
      END_QUERY
    end
    def download
      prepare_download_directory
      credential = get_credential
      statements = get_data( filename: '../data/f1099nec-data.json' );
      # Uploader IDs are provided by the user who uploads the statement.
      # See ../data/f1099nec-data.json
      # The list of IDs assumes that statement with ID 23913 was deleted by running delete.rb.
      uploader_ids = ['23911','23912','23914','23915']
      query = build_query(uploader_ids: uploader_ids)
      response = post_gql( credential: credential,
                           payload: query )
      statements = response.dig( 'data', 'getStatements', 'statements', 'nodes' )
      statements.each do |statement|
        file_name = "#{@download_directory}/stmt-#{statement.dig( 'uploaderId' )}.pdf"
        File.open( file_name, 'wb' ) do |f|
          # Statements are Base 64 encoded, so we have to decode them.
          f.write( Base64.decode64( statement.dig( 'pdf' ) ) )
        end
      end      
      STDOUT.puts( "Statements successfully downloaded to #{@download_directory}." )
      # Credentials are valid for several days after they've been issued.
      # If you plan to do more work, you can use the same credential.  When done 
      # working, you should delete the credential to provide additional security.
      if( delete_credential( credential: credential ) )
        STDOUT.puts( "\nSuccessfully deleted credential." )
      end
    end
    
    private
    
    # Be sure the download directory exists.
    def prepare_download_directory
      unless( File.exist?( @download_directory ) && File.directory?( @download_directory ) )
        Dir.mkdir( @download_directory )
      end
    end
  end
end

downloader = OTX::StatementDownloader.new
downloader.download

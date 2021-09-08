# Source Code for OtterTax Tutorials

This is the source code to accompany the OtterTax video tutorials.  Though
intended as an accompaniment to the tutorials, the code here should also be
useful on its own.

## Prerequisites

You should have a working knowledge of the language whose tutorial you're
following.  All of the code should work with recent versions of the various
languages.  The bullets below list which version of each language was used to
test the code along with any libraries that must be installed.  The programs
for each language were tested on both Linux and Windows.
- Python
  - Version 3.8.8
  - GQL for Python [https://github.com/graphql-python/gql](https://github.com/graphql-python/gql)
- Ruby
  - Version 2.6.0

## Running the code

For the impatient reader who does not want to watch the tutorials :wink:,
here is a brief list of steps for running the code.
* Clone this repository.
* Register on either the [sandbox](https://sandbox.ottertax.com/register)
  or on the [production](https://api.ottertax.com/register) site.
* Confirm your registration and create a configuration file.  These tasks
  can be performed manually (they're both quite simple) or by running the
  utility program distributed with this code.
  * To use the utility program, run the appropriate setup program for the
    language you're using.  For example, ruby users should run setup.rb in
    the ruby directory.
  * To confirm your registration manually, see the
    [online documentation](https://doc.ottertax.com/registration/registration_confirmation/).
    To create the configuration file manually, copy the file `config.json.example`
    to `config.json` and edit the file to reflect your settings.
* Add statements by running the appropriate program for the language you're
  using.  For example, python users should run `python add.py`ruby users
  should run `ruby add.rb`.
* Run the check program to check the validity of the statements.  Note
  that the data intentionally includes errors to illustrate statement
  validation and correction.
* Run the download program to download and review draft copies of statements.
* Run the correct program to correct statement errors and optionally re-run
  the check program to validate that the errors are no longer reported.
* Run the delete program to delete a single statement.
* Run the finalize program to finalize the statements.  In the production
  environment this removes the draft watermark.  In the sandbox environment,
  finalizing statements has no effect.
* Run the submit program to file statements with the IRS or the Social Security
  Administration (SSA).  Submitting statements in the sandbox environment has
  no effect as statements are not actually submitted.

## Other Resources
* Our [documentation](https://doc.ottertax.com/) site includes full
  documentation for using the API.
* Our [video tutorials](https://vimeo.com/ottertax) walk through using
  the API with various programming languages.

## License

This project is licensed under the terms of the MIT license.  See LICENSE.txt.

@api @search-permit-api
Feature: Search and validate CITES permits using API
  Scenario: Validate Search Permit API response
    Given I set the required authorised API headers
    And I send a Search Permit API request with the following body:
      """
      {
        "permitNumber": "24GBEXP9HV17U"
      }
      """
    When the API response is returned successfully

    Then the response status code should be 200

    And the response should contain the following fields:
      | Field          |
      | permitId       |
      | permitNumber   |
      | permitType     |
      | statusLabel    |
      | statuscode     |
      | scientificName |
      | purposeCode    |

    And the following fields should not be null:
      | Field          |
      | permitId       |
      | permitNumber   |
      | permitType     |
      | statusLabel    |
      | scientificName |

    And the response should match the Search Permit API schema

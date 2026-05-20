@api @endorse-permit-api
Feature: Endorse CITES permit using API

  Scenario: Endorse an eligible CITES permit successfully
    Given I have a CITES permit with "Issued" status
    And I set the required authorised API headers

    When I send an Endorse Permit API request with valid endorsement details:
      """
      {
        "permitId": "9545f5a3-0aa4-ee11-be37-0022481abcc2",
        "cites_quantityreturned": 1,
        "cites_netmassreturned": 10.5,
        "cites_unitreturned": 149900001,
        "cites_NumberofanimalsDOA": 0,
        "cites_MovementReferenceNumberMRN": "MRNNumber",
        "cites_tradedate": "2026-04-15",
        "cites_CustomsOfficerEpauletteNumber": "BFNumber",
        "cites_Port": "NameOfPort"
      }
      """

    Then the response status code should be 200

    And the response should contain the following fields:
      | Field              |
      | previousStatuscode |
      | permitId           |
      | permitNumber       |
      | newStatuscode      |

    And the following fields should not be null:
      | Field              |
      | previousStatuscode |
      | permitId           |
      | permitNumber       |
      | newStatuscode      |

    And the response should contain the following values:
      | Field              | Value                                |
      | previousStatuscode | 149900002                            |
      | permitId           | 9545f5a3-0aa4-ee11-be37-0022481abcc2 |
      | permitNumber       | 23GBEXP6QTJV8                        |
      | newStatuscode      | 149900002                            |

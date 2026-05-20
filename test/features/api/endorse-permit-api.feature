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
    And the response should confirm the permit has been endorsed

    And the response should contain the following fields:
      | Field            |
      | permitId         |
      | permitNumber     |
      | statusLabel      |
      | statuscode       |
      | tradeDate        |
      | customsOfficer   |
      | port             |
      | netMass          |
      | customsReference |
      | modifiedBy       |
      | modifiedDateTime |

    And the following fields should not be null:
      | Field            |
      | permitId         |
      | permitNumber     |
      | statusLabel      |
      | tradeDate        |
      | customsOfficer   |
      | port             |
      | modifiedDateTime |

    And the permit status should be updated to "Endorsed"
    And Pegasus should record the endorsement in permit history
    And the endorsed permit should be retrievable by authorised users

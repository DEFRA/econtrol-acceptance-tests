@endorsepermit @cts-110
Feature: Search, validate and endorse CITES permits

  Background:
    Given I am logged in as an authorised Border Force officer
    And I can see the title "Search for CITES permits"

  Scenario: Search for valid permits and endorse a permit successfully

    When I search using the following permit numbers:
      | Permit number |
      | 26GBIMPABS719 |

    Then I should see a message showing the number of permits that matched my search
    And the number of displayed permit results should match the count shown in the message
    And the displayed permit results should match the search criteria

    And I should see the following permit results for valid:
      | Permit number | Type   | Scientific name   | Quantity | Valid until     | Status | Action       |
      | 26GBIMPABS719 | Import | Python bivittatus | 1        | 30 October 2026 | Valid  | Check permit |

    #When I select "Check permit" for permit number "26GBIMPABS719"

    #Then I should be navigated to the Check Permit Details page
    #And the permit details should be displayed correctly
    #And I should see the section "Enter endorsement details"

    #When I enter the following endorsement details:
    #  | Field                      | Value        |
    #  | Net mass, in kilograms     | 10           |
    #  | Customs document reference | GBR123456789 |

    #And I click on "Endorse Permit"

    #Then the permit status should be updated to "Endorsed"
    #And I should see a confirmation message that the permit has been endorsed successfully

    #When I search for permit number "26GBIMPABS719" again

    #Then the permit status should be displayed as "Endorsed"
    #And the endorsed permit should be retrievable by authorised users
    #And the endorsed permit should be saved successfully in the BE system

    #And Pegasus must record all modifications made to the CITES permit
    #And each modification must capture the date and time of the change
    #And the CITES permit history must be accessible to authorised users for review

    #And the following backend fields should be updated in Pegasus:
    #  | Backend Field      | Expected Value                             | Data Type            | Validation / Formula              | Notes                                              |
    #  | Permit Status      | Endorsed                                   | Single Line of Text  | Must update after endorsement     | Permit successfully endorsed                       |
    #  | Trade Date         | Current system date                        | Date                 | Automatically set as current date | Recorded automatically during endorsement          |
    #  | Customs Officer    | Logged-in officer epaulette number         | Single Line of Text  | Retrieved from Active Directory   | Officer name must not be displayed due to GDPR     |
    #  | Port               | Logged-in officer default port             | Single Line of Text  | Retrieved from Active Directory   | May differ from actual endorsement location        |
    #  | Net Mass           | 10                                         | Whole Number         | User entered value                | Captured from endorsement details                  |
    #  | Customs Reference  | GBR123456789                               | Single Line of Text  | User entered value                | Customs declaration reference                      |
    #  | Modified By        | Logged-in Border Force officer             | Single Line of Text  | Recorded automatically            | Audit history field                                |
    #  | Modified Date Time | Current system date and timestamp          | Date and Time        | Recorded automatically            | Audit timestamp                                    |
    #  | Permit History     | Endorsement action recorded successfully   | Audit History        | Modification history maintained   | Accessible by authorised users                     |
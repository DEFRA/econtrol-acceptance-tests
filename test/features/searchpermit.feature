@smoke2
Feature: Search Permit

  Background:
    Given I am on the Search Permit page
    And I can see the title "Search for CITES permits"

  Scenario: Search for valid permits and verify results
    When I search using the following permit numbers:
      | Permit number |
      | 26GBIMPABS719 |
      | 26GBIMPSTYXH1 |
      | 26GBIMPSTYHNO |
    Then I should see a message showing the number of permits that matched my search
    And the number of displayed permit results should match the count shown in the message
    And the displayed permit results should match the search criteria
    And I should see the following permit results:
      | Permit number | Type   | Scientific name   | Quantity | Valid until     | Status | Action       |
      | 26GBIMPABS719 | Import | Python bivittatus |        1 | 30 October 2026 | Valid  | Check permit |
      | 26GBIMPSTYXH1 | Import | Python bivittatus |        1 | 30 October 2026 | Valid  | Check permit |
      | 26GBIMPSTYHNO | Import | Python bivittatus |        1 | 30 October 2026 | Valid  | Check permit |

  Scenario Outline: Invalid permit inputs show the right message
    When I search using permit number "<permit number>"
    Then I should see the message "<expected message>"

    Examples:
      | permit number | expected message                |
      | INVALID123    | No permits found                |
      |        000000 | No permits found                |
      | TESTPERMIT    | No permits found                |
      | @@@###        | Enter a valid permit number     |
      |               | Enter a permit number to search |
